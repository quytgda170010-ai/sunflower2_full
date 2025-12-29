"""
EHR Core FastAPI Application
Main entry point for the EHR system backend
"""
from fastapi import FastAPI, HTTPException, Depends, status, Request
# CORS is handled by NGINX Gateway
# from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from typing import Optional, Dict, Any
import logging
import pymysql
from .database import get_db_connection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="EHR Core API",
    description="Electronic Health Records Core Backend API",
    version="1.0.0"
)

# CORS is handled by NGINX Gateway, so we don't need it here
# Removing CORS middleware to avoid duplicate headers
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # In production, specify exact origins
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ehr-core"}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "EHR Core API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# WAF Event logging endpoint (for Coraza WAF integration)
@app.post("/admin/internal/log-waf-event")
async def log_waf_event(log_data: Dict[str, Any], request: Request):
    """Log WAF blocked events to access_logs table for SIEM Dashboard
    
    This endpoint receives events from waf_filter.lua when a SQL Injection
    or XSS attack is detected and blocked by the WAF layer.
    """
    try:
        import uuid
        from datetime import datetime
        import json
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Extract WAF event data
        log_id = str(uuid.uuid4())
        raw_timestamp = log_data.get('timestamp')
        # Convert ISO format to MySQL datetime format
        if raw_timestamp:
            # Handle ISO format: 2025-12-17T05:50:59Z -> 2025-12-17 05:50:59
            timestamp = raw_timestamp.replace('T', ' ').replace('Z', '')
        else:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_type = log_data.get('log_type', 'SECURITY_ALERT')
        action = log_data.get('action', 'WAF Attack Blocked')
        attack_type = log_data.get('attack_type', 'Unknown')
        rule_id = log_data.get('rule_id', 'unknown')
        matched_pattern = log_data.get('matched_pattern', '')
        payload = log_data.get('payload', '')
        uri = log_data.get('uri', '')
        ip = log_data.get('ip', request.client.host if request.client else 'unknown')
        method = log_data.get('method', 'GET')
        user_agent = log_data.get('user_agent', 'unknown')
        request_id = log_data.get('request_id', '')
        
        # Build details JSON - include rule_code for compliance monitoring
        rule_code = log_data.get('rule_code', 'R-SEC-01')  # Default to SQLi rule
        details = {
            "event_type": "waf_blocked",
            "attack_type": attack_type,
            "rule_id": rule_id,
            "rule_code": rule_code,  # For compliance monitoring (R-SEC-01 = SQLi, R-SEC-02 = XSS)
            "matched_pattern": matched_pattern,
            "payload": payload[:500] if payload else "",  # Limit payload size
            "blocked": True,
            "ip_address": ip,
            "source_ip": ip,
            "user_agent": user_agent,
            "request_id": request_id,
            "is_waf_blocked": True,
            "has_violation": True
        }
        
        # Get user/role from request - for hackers, use 'unknown'/'attacker'
        actor_name = log_data.get('user', log_data.get('username', 'unknown'))
        actor_role = log_data.get('role', 'attacker')
        
        # Insert into access_logs table (matching actual schema)
        insert_query = """
            INSERT INTO access_logs (
                id, timestamp, user_id, actor_name, role, action, operation,
                method, status, uri, ip_address, user_agent, log_type, purpose, details
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (
            log_id,
            timestamp,
            'attacker',        # user_id - unknown attacker
            actor_name,        # actor_name - 'unknown' for hackers
            actor_role,        # role - 'attacker' for hackers
            action,            # action - e.g., "🛡️ [WAF] SQL Injection blocked"
            'WAF_BLOCK',       # operation
            method,            # method (GET/POST)
            403,               # status - Forbidden
            uri,
            ip,                # ip_address
            user_agent,        # user_agent
            log_type,          # log_type - SECURITY_ALERT
            'security_monitoring',  # purpose
            json.dumps(details, ensure_ascii=False)
        ))
        connection.commit()
        
        cursor.close()
        connection.close()
        
        logger.info(f"WAF event logged: {attack_type} attack blocked from {ip}")
        
        return {
            "success": True,
            "message": "WAF event logged successfully",
            "log_id": log_id
        }
    except Exception as e:
        logger.error(f"Error logging WAF event: {e}")
        # Don't raise error - logging failure shouldn't break the app
        return {
            "success": False,
            "message": "Failed to log WAF event",
            "error": str(e)
        }

# Login/Logout logging endpoint (no auth required for logging)
@app.post("/admin/login/log")
async def log_auth_event(log_data: Dict[str, Any], request: Request):
    """Log login/logout events - no authentication required"""
    try:
        username = log_data.get('username', 'unknown')
        success = log_data.get('success', False)
        roles = log_data.get('roles', [])
        event_type = log_data.get('event_type', 'login')
        ip_address = log_data.get('ip_address', request.client.host if request.client else 'unknown')
        
        # Log to application logger
        logger.info(f"Auth event: {event_type} - user: {username}, success: {success}, roles: {roles}, IP: {ip_address}")
        
        # Optionally save to database in the future
        # For now, just return success
        return {
            "success": True,
            "message": f"{event_type} event logged",
            "username": username,
            "event_type": event_type
        }
    except Exception as e:
        logger.error(f"Error logging auth event: {e}")
        # Don't raise error - logging failure shouldn't break the app
        return {
            "success": False,
            "message": "Failed to log event",
            "error": str(e)
        }

# Handle OPTIONS request for CORS preflight
@app.options("/admin/login/log")
async def log_auth_event_options():
    """Handle CORS preflight for login/log endpoint"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-User, X-User-Id, X-Roles",
        }
    )

# Dashboard stats endpoint
@app.get("/admin/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        # TODO: Implement actual statistics from database
        return {
            "total_patients": 0,
            "total_appointments": 0,
            "pending_appointments": 0,
            "today_appointments": 0
        }
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Appointments endpoints
@app.get("/admin/appointments")
async def get_appointments(
    date: Optional[str] = None,
    status: Optional[str] = None,
    department_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    days: Optional[int] = None,
    page: int = 1,
    page_size: int = 100
):
    """Get appointments list"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Build WHERE clause with table alias
        where_clauses = []
        params = []
        
        if date:
            where_clauses.append("a.appointment_date = %s")
            params.append(date)
        
        if status:
            # Handle comma-separated status list
            status_list = [s.strip() for s in status.split(',')]
            placeholders = ','.join(['%s'] * len(status_list))
            where_clauses.append(f"a.status IN ({placeholders})")
            params.extend(status_list)
        
        if department_id:
            where_clauses.append("a.department_id = %s")
            params.append(department_id)
        
        if doctor_id:
            # Filter by doctor who completed the review (check medical records)
            # This is a simplified approach - in a real system, you might have a doctor_id field in appointments
            where_clauses.append("EXISTS (SELECT 1 FROM ehr_medical_records mr WHERE mr.patient_id = a.patient_id AND mr.record_type = %s AND mr.title LIKE %s AND mr.created_by = %s)")
            params.extend(['note', 'Doctor Review%', doctor_id])
        
        if days:
            from datetime import datetime, timedelta
            days_ago = (datetime.now() - timedelta(days=days)).date()
            where_clauses.append("DATE(a.appointment_date) >= %s")
            params.append(days_ago.isoformat())
        
        where_sql = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM ehr_appointments a{where_sql}"
        cursor.execute(count_query, params)
        count_result = cursor.fetchone()
        total = count_result['total'] if isinstance(count_result, dict) else count_result[0]
        
        # Get appointments with patient and department info
        query = f"""
            SELECT 
                a.id,
                a.patient_id,
                a.department_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.queue_number,
                a.reason_text,
                a.reason_tags,
                a.created_at,
                p.patient_code,
                p.full_name as patient_name,
                d.name as department_name
            FROM ehr_appointments a
            LEFT JOIN ehr_patients p ON a.patient_id = p.id
            LEFT JOIN ehr_departments d ON a.department_id = d.id
            {where_sql}
            ORDER BY a.appointment_date DESC, a.queue_number ASC, a.appointment_time ASC
            LIMIT %s OFFSET %s
        """
        
        offset = (page - 1) * page_size
        cursor.execute(query, params + [page_size, offset])
        appointments = cursor.fetchall()
        
        # Format appointments (DictCursor returns dicts)
        formatted_appointments = []
        for apt in appointments:
            if not apt:
                continue
                
            # Parse reason_tags if it's JSON string
            reason_tags = apt.get('reason_tags')
            if reason_tags and isinstance(reason_tags, str):
                try:
                    import json
                    reason_tags = json.loads(reason_tags)
                except:
                    pass
            
            # Format date and time
            appointment_date = apt.get('appointment_date')
            if appointment_date and hasattr(appointment_date, 'strftime'):
                appointment_date = appointment_date.strftime('%Y-%m-%d')
            else:
                appointment_date = str(appointment_date) if appointment_date else None
            
            appointment_time = apt.get('appointment_time')
            if appointment_time and hasattr(appointment_time, 'strftime'):
                appointment_time = appointment_time.strftime('%H:%M:%S')
            else:
                appointment_time = str(appointment_time) if appointment_time else None
            
            created_at = apt.get('created_at')
            if created_at and hasattr(created_at, 'strftime'):
                created_at = created_at.strftime('%Y-%m-%d %H:%M:%S')
            else:
                created_at = str(created_at) if created_at else None
            
            formatted_apt = {
                "id": apt.get('id'),
                "patient_id": apt.get('patient_id'),
                "patient_code": apt.get('patient_code'),
                "patient_name": apt.get('patient_name'),
                "department_id": apt.get('department_id'),
                "department_name": apt.get('department_name'),
                "appointment_date": appointment_date,
                "appointment_time": appointment_time,
                "status": apt.get('status'),
                "queue_number": apt.get('queue_number'),
                "reason_text": apt.get('reason_text'),
                "reason_tags": reason_tags,
                "created_at": created_at
            }
            formatted_appointments.append(formatted_apt)
        
        cursor.close()
        connection.close()
        
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        
        return {
            "data": formatted_appointments,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages
            }
        }
    except Exception as e:
        logger.error(f"Error getting appointments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/appointments")
async def create_appointment(appointment_data: Dict[str, Any], request: Request):
    """Create a new appointment (add patient to queue)"""
    try:
        import uuid
        from datetime import datetime
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Extract appointment data
        patient_id = appointment_data.get('patient_id')
        department_id = appointment_data.get('department_id')
        appointment_date = appointment_data.get('appointment_date')
        appointment_time = appointment_data.get('appointment_time')
        reason_text = appointment_data.get('reason_text')
        reason_tags = appointment_data.get('reason_tags')
        status = appointment_data.get('status', 'waiting')
        
        # Get created_by from request headers (X-User) or default to 'system'
        created_by = 'system'
        if request:
            x_user = request.headers.get('X-User') or request.headers.get('x-user')
            if x_user:
                created_by = x_user
        
        # Validate required fields
        if not patient_id:
            raise HTTPException(status_code=400, detail="patient_id is required")
        if not department_id:
            raise HTTPException(status_code=400, detail="department_id is required")
        if not appointment_date:
            raise HTTPException(status_code=400, detail="appointment_date is required")
        
        # Verify patient exists
        cursor.execute("SELECT id FROM ehr_patients WHERE id = %s", (patient_id,))
        patient_result = cursor.fetchone()
        if not patient_result:
            # Try to find by patient_code if patient_id is not UUID
            cursor.execute("SELECT id FROM ehr_patients WHERE patient_code = %s", (str(patient_id),))
            patient_result = cursor.fetchone()
            if patient_result:
                patient_id = patient_result['id'] if isinstance(patient_result, dict) else patient_result[0]
            else:
                raise HTTPException(status_code=400, detail=f"Patient not found: {patient_id}")
        
        # department_id should be UUID from database (after fixing /admin/departments endpoint)
        # But handle both cases: UUID string or integer (for backward compatibility)
        actual_department_id = department_id
        
        # If department_id looks like UUID (contains dashes) or is already a valid string ID, use it directly
        if isinstance(department_id, str) and ('-' in department_id or len(department_id) > 10 or department_id.startswith('dept-')):
            # It's likely a UUID or department code like "dept-007"
            # Verify it exists in database
            cursor.execute("SELECT id FROM ehr_departments WHERE id = %s", (department_id,))
            dept_result = cursor.fetchone()
            if not dept_result:
                raise HTTPException(status_code=400, detail=f"Department not found: {department_id}")
        elif isinstance(department_id, int) or (isinstance(department_id, str) and department_id.isdigit()):
            # Legacy: integer ID - find by index in sorted list (for backward compatibility)
            cursor.execute("SELECT id FROM ehr_departments ORDER BY name LIMIT 1 OFFSET %s", (int(department_id) - 1,))
            dept_result = cursor.fetchone()
            if dept_result:
                actual_department_id = dept_result['id'] if isinstance(dept_result, dict) else dept_result[0]
            else:
                raise HTTPException(status_code=400, detail=f"Invalid department_id: {department_id}")
        
        # Convert reason_tags to JSON string if it's a list
        reason_tags_json = None
        if reason_tags:
            if isinstance(reason_tags, list):
                import json
                reason_tags_json = json.dumps(reason_tags, ensure_ascii=False)
            else:
                reason_tags_json = str(reason_tags)
        
        # Generate UUID for appointment id
        appointment_id = str(uuid.uuid4())
        
        # Get next queue number for the department on this date
        cursor.execute("""
            SELECT COALESCE(MAX(queue_number), 0) + 1 as next_queue
            FROM ehr_appointments
            WHERE department_id = %s AND appointment_date = %s
        """, (actual_department_id, appointment_date))
        queue_result = cursor.fetchone()
        queue_number = queue_result['next_queue'] if isinstance(queue_result, dict) else (queue_result[0] if queue_result else 1)
        
        # Insert into ehr_appointments table
        insert_query = """
            INSERT INTO ehr_appointments (
                id, patient_id, department_id, appointment_date, appointment_time,
                reason_text, reason_tags, status, queue_number, created_by, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """
        
        cursor.execute(insert_query, (
            appointment_id, patient_id, actual_department_id, appointment_date, appointment_time,
            reason_text, reason_tags_json, status, queue_number, created_by
        ))
        connection.commit()
        
        # Get the inserted appointment
        cursor.execute("""
            SELECT id, patient_id, department_id, appointment_date, appointment_time,
                   reason_text, reason_tags, status, queue_number, created_by, created_at
            FROM ehr_appointments WHERE id = %s
        """, (appointment_id,))
        appointment = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        return appointment
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating appointment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Patients endpoints
@app.get("/admin/patients")
async def get_patients(
    page: int = 1,
    page_size: int = 10,
    search: Optional[str] = None
):
    """Get patients list"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Build query with search
        base_query = "SELECT id, patient_code, full_name, date_of_birth, gender, phone, email FROM ehr_patients"
        count_query = "SELECT COUNT(*) as total FROM ehr_patients"
        
        where_clauses = []
        params = []
        
        if search:
            where_clauses.append("(full_name LIKE %s OR patient_code LIKE %s OR phone LIKE %s OR email LIKE %s)")
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param, search_param])
        
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)
            base_query += where_sql
            count_query += where_sql
        else:
            where_sql = ""
        
        # Get total count
        cursor.execute(count_query, params)
        result = cursor.fetchone()
        total = result['total'] if isinstance(result, dict) else result[0]
        
        # Get paginated data
        offset = (page - 1) * page_size
        base_query += f" ORDER BY created_at DESC LIMIT %s OFFSET %s"
        cursor.execute(base_query, params + [page_size, offset])
        patients = cursor.fetchall()
        
        # Format date_of_birth to string (DictCursor returns dicts)
        for patient in patients:
            if patient.get('date_of_birth'):
                if hasattr(patient['date_of_birth'], 'strftime'):
                    patient['date_of_birth'] = patient['date_of_birth'].strftime('%Y-%m-%d')
        
        cursor.close()
        connection.close()
        
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        
        return {
            "data": patients,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages
            }
        }
    except Exception as e:
        logger.error(f"Error getting patients: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/patients/search")
async def search_patients(q: str, exact: Optional[bool] = False):
    """Search patients by ID card number, phone number, or name
    
    Args:
        q: Search query (must be exactly 10 digits for phone or 12 digits for CCCD if exact=True)
        exact: If True, requires exact match (10 digits for phone, 12 digits for CCCD)
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Validate exact search: must be 10 or 12 digits
        if exact:
            if not q.isdigit():
                raise HTTPException(status_code=400, detail="Search query must contain only numbers")
            if len(q) not in [10, 12]:
                raise HTTPException(
                    status_code=400, 
                    detail="For exact search, please enter exactly 10 digits (phone) or 12 digits (ID card)"
                )
        
        # Check if cccd and bhyt columns exist
        cursor.execute("""
            SELECT COUNT(*) as col_count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'ehr_patients' 
            AND COLUMN_NAME IN ('cccd', 'bhyt')
        """, (os.getenv('DB_NAME', 'ehr_core'),))
        col_result = cursor.fetchone()
        has_cccd_bhyt = col_result['col_count'] == 2
        
        # Build search query based on exact match or partial match
        if exact:
            # Exact match: search by phone (10 digits) or cccd (12 digits)
            if len(q) == 10:
                # Search by phone number (exact match)
                if has_cccd_bhyt:
                    search_query = """
                        SELECT id, patient_code, full_name, date_of_birth, gender, phone, email, cccd, bhyt
                        FROM ehr_patients
                        WHERE phone = %s
                        LIMIT 10
                    """
                else:
                    search_query = """
                        SELECT id, patient_code, full_name, date_of_birth, gender, phone, email
                        FROM ehr_patients
                        WHERE phone = %s
                        LIMIT 10
                    """
                cursor.execute(search_query, (q,))
            elif len(q) == 12:
                # Search by CCCD (exact match)
                if has_cccd_bhyt:
                    search_query = """
                        SELECT id, patient_code, full_name, date_of_birth, gender, phone, email, cccd, bhyt
                        FROM ehr_patients
                        WHERE cccd = %s
                        LIMIT 10
                    """
                    cursor.execute(search_query, (q,))
                else:
                    # CCCD column doesn't exist, return empty
                    patients = []
                    cursor.close()
                    connection.close()
                    return []
        else:
            # Partial match (original behavior for backward compatibility)
            if has_cccd_bhyt:
                # Search in multiple fields: phone, patient_code (ID card), full_name, cccd, bhyt
                search_query = """
                    SELECT id, patient_code, full_name, date_of_birth, gender, phone, email, cccd, bhyt
                    FROM ehr_patients
                    WHERE phone LIKE %s OR patient_code LIKE %s OR full_name LIKE %s OR cccd LIKE %s OR bhyt LIKE %s
                    LIMIT 10
                """
                search_param = f"%{q}%"
                cursor.execute(search_query, (search_param, search_param, search_param, search_param, search_param))
            else:
                # Search without cccd and bhyt columns
                search_query = """
                    SELECT id, patient_code, full_name, date_of_birth, gender, phone, email
                    FROM ehr_patients
                    WHERE phone LIKE %s OR patient_code LIKE %s OR full_name LIKE %s
                    LIMIT 10
                """
                search_param = f"%{q}%"
                cursor.execute(search_query, (search_param, search_param, search_param))
        
        patients = cursor.fetchall()
        
        # Format date_of_birth to string and add cccd/bhyt if columns exist
        for patient in patients:
            if patient.get('date_of_birth'):
                if hasattr(patient['date_of_birth'], 'strftime'):
                    patient['date_of_birth'] = patient['date_of_birth'].strftime('%Y-%m-%d')
            # Ensure cccd and bhyt are in response even if columns don't exist
            if not has_cccd_bhyt:
                patient['cccd'] = None
                patient['bhyt'] = None
        
        cursor.close()
        connection.close()
        
        return patients
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching patients: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/patients/{patient_id}")
async def get_patient(patient_id: str, request: Request):
    """Get patient details by ID"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if cccd and bhyt columns exist
        cursor.execute("""
            SELECT COUNT(*) as col_count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'ehr_patients' 
            AND COLUMN_NAME IN ('cccd', 'bhyt')
        """, (os.getenv('DB_NAME', 'ehr_core'),))
        col_result = cursor.fetchone()
        has_cccd_bhyt = col_result['col_count'] == 2
        
        # Build query based on column existence
        if has_cccd_bhyt:
            query = """
                SELECT 
                    id,
                    patient_code,
                    full_name,
                    date_of_birth,
                    gender,
                    phone,
                    email,
                    address,
                    emergency_contact_name,
                    emergency_contact_phone,
                    cccd,
                    bhyt,
                    created_at,
                    updated_at
                FROM ehr_patients
                WHERE id = %s
            """
        else:
            query = """
                SELECT 
                    id,
                    patient_code,
                    full_name,
                    date_of_birth,
                    gender,
                    phone,
                    email,
                    address,
                    emergency_contact_name,
                    emergency_contact_phone,
                    created_at,
                    updated_at
                FROM ehr_patients
                WHERE id = %s
            """
        
        cursor.execute(query, (patient_id,))
        patient = cursor.fetchone()
        
        if not patient:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Patient not found")
        
        formatted_patient = {
            "id": patient.get('id'),
            "patient_code": patient.get('patient_code'),
            "full_name": patient.get('full_name'),
            "date_of_birth": str(patient.get('date_of_birth')) if patient.get('date_of_birth') else None,
            "gender": patient.get('gender'),
            "phone": patient.get('phone'),
            "email": patient.get('email'),
            "address": patient.get('address'),
            "emergency_contact_name": patient.get('emergency_contact_name'),
            "emergency_contact_phone": patient.get('emergency_contact_phone'),
            "cccd": patient.get('cccd') if has_cccd_bhyt else None,
            "bhyt": patient.get('bhyt') if has_cccd_bhyt else None,
            "created_at": str(patient.get('created_at')) if patient.get('created_at') else None,
            "updated_at": str(patient.get('updated_at')) if patient.get('updated_at') else None
        }
        
        # Log this access with patient info (will be done in background)
        # Note: Gateway already logs, but this ensures patient info is captured
        
        cursor.close()
        connection.close()
        
        return formatted_patient
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patient: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/patients/{patient_id}/prescriptions")
async def get_patient_prescriptions(patient_id: str):
    """Get patient prescriptions"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Get prescriptions from medical records
        query = """
            SELECT 
                id,
                patient_id,
                record_type,
                title,
                content,
                created_by,
                created_at,
                updated_at
            FROM ehr_medical_records
            WHERE patient_id = %s
            AND (record_type = 'prescription' OR title LIKE %s)
            ORDER BY created_at DESC
        """
        
        cursor.execute(query, (patient_id, '%Prescription%'))
        records = cursor.fetchall()
        
        import json
        formatted_prescriptions = []
        for record in records:
            content = record.get('content')
            if content and isinstance(content, str):
                try:
                    content = json.loads(content)
                except:
                    pass
            
            formatted_prescriptions.append({
                "id": record.get('id'),
                "patient_id": record.get('patient_id'),
                "title": record.get('title'),
                "content": content,
                "created_by": record.get('created_by'),
                "created_at": str(record.get('created_at')) if record.get('created_at') else None,
                "updated_at": str(record.get('updated_at')) if record.get('updated_at') else None
            })
        
        cursor.close()
        connection.close()
        
        return {"prescriptions": formatted_prescriptions}
    except Exception as e:
        logger.error(f"Error getting patient prescriptions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/patients/{patient_id}/diagnoses")
async def get_patient_diagnoses(patient_id: str):
    """Get patient diagnoses"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Get diagnoses from medical records
        query = """
            SELECT 
                id,
                patient_id,
                record_type,
                title,
                content,
                created_by,
                created_at,
                updated_at
            FROM ehr_medical_records
            WHERE patient_id = %s
            AND (record_type = 'diagnosis' OR title LIKE %s)
            ORDER BY created_at DESC
        """
        
        cursor.execute(query, (patient_id, '%Diagnosis%'))
        records = cursor.fetchall()
        
        import json
        formatted_diagnoses = []
        for record in records:
            content = record.get('content')
            if content and isinstance(content, str):
                try:
                    content = json.loads(content)
                except:
                    pass
            
            formatted_diagnoses.append({
                "id": record.get('id'),
                "patient_id": record.get('patient_id'),
                "title": record.get('title'),
                "content": content,
                "created_by": record.get('created_by'),
                "created_at": str(record.get('created_at')) if record.get('created_at') else None,
                "updated_at": str(record.get('updated_at')) if record.get('updated_at') else None
            })
        
        cursor.close()
        connection.close()
        
        return {"diagnoses": formatted_diagnoses}
    except Exception as e:
        logger.error(f"Error getting patient diagnoses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/patients")
async def create_patient(patient_data: Dict[str, Any], request: Request):
    """Create a new patient"""
    try:
        import uuid
        from datetime import datetime
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Generate patient ID
        patient_id = str(uuid.uuid4())
        
        # Extract patient data
        patient_code = patient_data.get('patient_code')
        full_name = patient_data.get('full_name') or patient_data.get('name')
        date_of_birth = patient_data.get('date_of_birth') or patient_data.get('dob')
        gender = patient_data.get('gender')
        phone = patient_data.get('phone') or None  # Optional, like phone
        email = patient_data.get('email') or None
        address = patient_data.get('address') or None
        emergency_contact_name = patient_data.get('emergency_contact_name') or None
        emergency_contact_phone = patient_data.get('emergency_contact_phone') or None
        cccd = patient_data.get('cccd') or None  # Optional, like phone
        bhyt = patient_data.get('bhyt') or None  # Optional
        
        # Generate patient_code if not provided
        if not patient_code:
            # Generate patient code: BN + timestamp
            import time
            patient_code = f"BN{int(time.time())}"
        
        # Check if cccd and bhyt columns exist in the database
        cursor.execute("""
            SELECT COUNT(*) as col_count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'ehr_patients' 
            AND COLUMN_NAME IN ('cccd', 'bhyt')
        """, (os.getenv('DB_NAME', 'ehr_core'),))
        col_result = cursor.fetchone()
        has_cccd_bhyt = col_result['col_count'] == 2
        
        # Build insert query dynamically based on column existence
        if has_cccd_bhyt:
            # Insert into ehr_patients with cccd and bhyt
            insert_query = """
                INSERT INTO ehr_patients (
                    id, patient_code, full_name, date_of_birth, gender, 
                    phone, email, address, emergency_contact_name, emergency_contact_phone,
                    cccd, bhyt, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """
            cursor.execute(insert_query, (
                patient_id, patient_code, full_name, date_of_birth, gender,
                phone, email, address, emergency_contact_name, emergency_contact_phone,
                cccd, bhyt
            ))
        else:
            # Insert without cccd and bhyt (for databases that haven't run migration yet)
            insert_query = """
                INSERT INTO ehr_patients (
                    id, patient_code, full_name, date_of_birth, gender, 
                    phone, email, address, emergency_contact_name, emergency_contact_phone,
                    created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """
            cursor.execute(insert_query, (
                patient_id, patient_code, full_name, date_of_birth, gender,
                phone, email, address, emergency_contact_name, emergency_contact_phone
            ))
        connection.commit()
        
        # Get created patient - handle both cases (with/without cccd/bhyt columns)
        if has_cccd_bhyt:
            cursor.execute("""
                SELECT id, patient_code, full_name, date_of_birth, gender, phone, email, address,
                       emergency_contact_name, emergency_contact_phone, cccd, bhyt
                FROM ehr_patients WHERE id = %s
            """, (patient_id,))
        else:
            cursor.execute("""
                SELECT id, patient_code, full_name, date_of_birth, gender, phone, email, address,
                       emergency_contact_name, emergency_contact_phone
                FROM ehr_patients WHERE id = %s
            """, (patient_id,))
        patient = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        # Format response
        response_data = {
            "id": patient['id'],
            "patient_code": patient['patient_code'],
            "full_name": patient['full_name'],
            "date_of_birth": str(patient['date_of_birth']) if patient['date_of_birth'] else None,
            "gender": patient['gender'],
            "phone": patient.get('phone'),
            "email": patient.get('email'),
            "address": patient.get('address'),
            "emergency_contact_name": patient.get('emergency_contact_name'),
            "emergency_contact_phone": patient.get('emergency_contact_phone'),
            "cccd": patient.get('cccd') if has_cccd_bhyt else None,
            "bhyt": patient.get('bhyt') if has_cccd_bhyt else None,
            "message": "Patient created successfully"
        }
        
        return response_data
    except Exception as e:
        logger.error(f"Error creating patient: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/patients-with-user")
async def create_patient_with_user(patient_data: Dict[str, Any], request: Request):
    """Create a new patient and optionally create a Keycloak user account"""
    try:
        import uuid
        import httpx
        from datetime import datetime
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Generate patient ID
        patient_id = str(uuid.uuid4())
        
        # Extract patient data
        patient_code = patient_data.get('patient_code')
        full_name = patient_data.get('full_name') or patient_data.get('name')
        date_of_birth = patient_data.get('date_of_birth') or patient_data.get('dob')
        gender = patient_data.get('gender')
        phone = patient_data.get('phone') or None
        email = patient_data.get('email') or None
        address = patient_data.get('address') or None
        emergency_contact_name = patient_data.get('emergency_contact_name') or None
        emergency_contact_phone = patient_data.get('emergency_contact_phone') or None
        cccd = patient_data.get('cccd') or None
        bhyt = patient_data.get('bhyt') or None
        
        # User credentials
        username = patient_data.get('username')
        password = patient_data.get('password')
        
        # Generate patient_code if not provided
        if not patient_code:
            import time
            patient_code = f"BN{int(time.time())}"
        
        # Check if cccd and bhyt columns exist in the database
        cursor.execute("""
            SELECT COUNT(*) as col_count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'ehr_patients' 
            AND COLUMN_NAME IN ('cccd', 'bhyt')
        """, (os.getenv('DB_NAME', 'ehr_core'),))
        col_result = cursor.fetchone()
        has_cccd_bhyt = col_result['col_count'] == 2
        
        # Build insert query dynamically based on column existence
        if has_cccd_bhyt:
            insert_query = """
                INSERT INTO ehr_patients (
                    id, patient_code, full_name, date_of_birth, gender, 
                    phone, email, address, emergency_contact_name, emergency_contact_phone,
                    cccd, bhyt, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """
            cursor.execute(insert_query, (
                patient_id, patient_code, full_name, date_of_birth, gender,
                phone, email, address, emergency_contact_name, emergency_contact_phone,
                cccd, bhyt
            ))
        else:
            insert_query = """
                INSERT INTO ehr_patients (
                    id, patient_code, full_name, date_of_birth, gender, 
                    phone, email, address, emergency_contact_name, emergency_contact_phone,
                    created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """
            cursor.execute(insert_query, (
                patient_id, patient_code, full_name, date_of_birth, gender,
                phone, email, address, emergency_contact_name, emergency_contact_phone
            ))
        connection.commit()
        
        # Create Keycloak user account if username and password are provided
        keycloak_user = None
        if username and password:
            try:
                keycloak_url = os.getenv('KEYCLOAK_URL', 'http://keycloak:8080')
                realm = os.getenv('KEYCLOAK_REALM', 'clinicrealm')
                admin_client_id = os.getenv('KEYCLOAK_ADMIN_CLIENT_ID', 'admin-cli')
                admin_client_secret = os.getenv('KEYCLOAK_ADMIN_CLIENT_SECRET', '')
                
                # Get admin token
                token_url = f"{keycloak_url}/realms/master/protocol/openid-connect/token"
                token_data = {
                    'grant_type': 'client_credentials',
                    'client_id': admin_client_id,
                    'client_secret': admin_client_secret
                }
                
                async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
                    # Get admin token
                    token_response = await client.post(token_url, data=token_data)
                    if token_response.status_code != 200:
                        # Try password grant as fallback
                        token_data = {
                            'grant_type': 'password',
                            'client_id': admin_client_id,
                            'username': os.getenv('KEYCLOAK_ADMIN_USER', 'admin'),
                            'password': os.getenv('KEYCLOAK_ADMIN_PASSWORD', 'admin')
                        }
                        token_response = await client.post(token_url, data=token_data)
                    
                    if token_response.status_code == 200:
                        access_token = token_response.json().get('access_token')
                        
                        # Create user in Keycloak
                        users_url = f"{keycloak_url}/admin/realms/{realm}/users"
                        headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}
                        
                        # Split full_name into first and last name
                        name_parts = full_name.split(' ', 1) if full_name else ['', '']
                        first_name = name_parts[0]
                        last_name = name_parts[1] if len(name_parts) > 1 else ''
                        
                        user_payload = {
                            'username': username,
                            'email': email or f"{username}@patient.local",
                            'firstName': first_name,
                            'lastName': last_name,
                            'enabled': True,
                            'credentials': [{
                                'type': 'password',
                                'value': password,
                                'temporary': False
                            }],
                            'realmRoles': ['patient'],
                            'attributes': {
                                'patient_id': [patient_id],
                                'patient_code': [patient_code]
                            }
                        }
                        
                        create_response = await client.post(users_url, headers=headers, json=user_payload)
                        
                        if create_response.status_code in [201, 204]:
                            # Get created user ID from location header
                            location = create_response.headers.get('Location', '')
                            keycloak_user_id = location.split('/')[-1] if location else None
                            
                            keycloak_user = {
                                'id': keycloak_user_id,
                                'username': username
                            }
                            
                            # Assign patient role if it exists
                            if keycloak_user_id:
                                try:
                                    # Get available realm roles
                                    roles_url = f"{keycloak_url}/admin/realms/{realm}/roles"
                                    roles_response = await client.get(roles_url, headers=headers)
                                    if roles_response.status_code == 200:
                                        roles = roles_response.json()
                                        patient_role = next((r for r in roles if r['name'] == 'patient'), None)
                                        if patient_role:
                                            assign_url = f"{users_url}/{keycloak_user_id}/role-mappings/realm"
                                            await client.post(assign_url, headers=headers, json=[patient_role])
                                except Exception as role_err:
                                    logger.warning(f"Could not assign patient role: {role_err}")
                            
                            logger.info(f"Created Keycloak user: {username} for patient: {patient_code}")
                        elif create_response.status_code == 409:
                            # User already exists
                            logger.warning(f"Keycloak user already exists: {username}")
                            keycloak_user = {'username': username, 'error': 'User already exists'}
                        else:
                            error_text = create_response.text
                            logger.error(f"Failed to create Keycloak user: {create_response.status_code} - {error_text}")
                            keycloak_user = {'username': username, 'error': f'Create failed: {create_response.status_code}'}
                    else:
                        logger.error(f"Failed to get Keycloak admin token: {token_response.status_code}")
                        keycloak_user = {'username': username, 'error': 'Auth failed'}
            except Exception as kc_err:
                logger.error(f"Keycloak error: {kc_err}")
                keycloak_user = {'username': username, 'error': str(kc_err)}
        
        # Get created patient
        if has_cccd_bhyt:
            cursor.execute("""
                SELECT id, patient_code, full_name, date_of_birth, gender, phone, email, address,
                       emergency_contact_name, emergency_contact_phone, cccd, bhyt
                FROM ehr_patients WHERE id = %s
            """, (patient_id,))
        else:
            cursor.execute("""
                SELECT id, patient_code, full_name, date_of_birth, gender, phone, email, address,
                       emergency_contact_name, emergency_contact_phone
                FROM ehr_patients WHERE id = %s
            """, (patient_id,))
        patient = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        # Format response - ALWAYS include 'user' field with 'username' for frontend compatibility
        response_data = {
            "patient": {
                "id": patient['id'],
                "patient_code": patient['patient_code'],
                "full_name": patient['full_name'],
                "date_of_birth": str(patient['date_of_birth']) if patient['date_of_birth'] else None,
                "gender": patient['gender'],
                "phone": patient.get('phone'),
                "email": patient.get('email'),
                "address": patient.get('address'),
                "emergency_contact_name": patient.get('emergency_contact_name'),
                "emergency_contact_phone": patient.get('emergency_contact_phone'),
                "cccd": patient.get('cccd') if has_cccd_bhyt else None,
                "bhyt": patient.get('bhyt') if has_cccd_bhyt else None,
            },
            "user": keycloak_user if keycloak_user else {"username": username or patient_code},
            "message": "Patient created successfully" + (" with user account" if keycloak_user else "")
        }
        
        return response_data
    except Exception as e:
        logger.error(f"Error creating patient with user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/admin/patients/{patient_id}")
async def update_patient(patient_id: str, patient_data: Dict[str, Any], request: Request):
    """Update an existing patient"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Extract patient data
        patient_code = patient_data.get('patient_code')
        full_name = patient_data.get('full_name') or patient_data.get('name')
        date_of_birth = patient_data.get('date_of_birth') or patient_data.get('dob')
        gender = patient_data.get('gender')
        phone = patient_data.get('phone') or None  # Optional, like phone
        email = patient_data.get('email') or None
        address = patient_data.get('address') or None
        emergency_contact_name = patient_data.get('emergency_contact_name') or None
        emergency_contact_phone = patient_data.get('emergency_contact_phone') or None
        cccd = patient_data.get('cccd') or None  # Optional, like phone
        bhyt = patient_data.get('bhyt') or None  # Optional
        
        # Check if cccd and bhyt columns exist in the database
        cursor.execute("""
            SELECT COUNT(*) as col_count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'ehr_patients' 
            AND COLUMN_NAME IN ('cccd', 'bhyt')
        """, (os.getenv('DB_NAME', 'ehr_core'),))
        col_result = cursor.fetchone()
        has_cccd_bhyt = col_result['col_count'] == 2
        
        # Update ehr_patients - build query dynamically
        if has_cccd_bhyt:
            update_query = """
                UPDATE ehr_patients SET
                    patient_code = %s,
                    full_name = %s,
                    date_of_birth = %s,
                    gender = %s,
                    phone = %s,
                    email = %s,
                    address = %s,
                    emergency_contact_name = %s,
                    emergency_contact_phone = %s,
                    cccd = %s,
                    bhyt = %s,
                    updated_at = NOW()
                WHERE id = %s
            """
            cursor.execute(update_query, (
                patient_code, full_name, date_of_birth, gender,
                phone, email, address, emergency_contact_name, emergency_contact_phone,
                cccd, bhyt, patient_id
            ))
        else:
            update_query = """
                UPDATE ehr_patients SET
                    patient_code = %s,
                    full_name = %s,
                    date_of_birth = %s,
                    gender = %s,
                    phone = %s,
                    email = %s,
                    address = %s,
                    emergency_contact_name = %s,
                    emergency_contact_phone = %s,
                    updated_at = NOW()
                WHERE id = %s
            """
            cursor.execute(update_query, (
                patient_code, full_name, date_of_birth, gender,
                phone, email, address, emergency_contact_name, emergency_contact_phone,
                patient_id
            ))
        connection.commit()
        
        # Get updated patient - handle both cases
        if has_cccd_bhyt:
            cursor.execute("""
                SELECT id, patient_code, full_name, date_of_birth, gender, phone, email, address,
                       emergency_contact_name, emergency_contact_phone, cccd, bhyt
                FROM ehr_patients WHERE id = %s
            """, (patient_id,))
        else:
            cursor.execute("""
                SELECT id, patient_code, full_name, date_of_birth, gender, phone, email, address,
                       emergency_contact_name, emergency_contact_phone
                FROM ehr_patients WHERE id = %s
            """, (patient_id,))
        patient = cursor.fetchone()
        
        if not patient:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Patient not found")
        
        cursor.close()
        connection.close()
        
        # Format response
        response_data = {
            "id": patient['id'],
            "patient_code": patient['patient_code'],
            "full_name": patient['full_name'],
            "date_of_birth": str(patient['date_of_birth']) if patient['date_of_birth'] else None,
            "gender": patient['gender'],
            "phone": patient.get('phone'),
            "email": patient.get('email'),
            "address": patient.get('address'),
            "emergency_contact_name": patient.get('emergency_contact_name'),
            "emergency_contact_phone": patient.get('emergency_contact_phone'),
            "cccd": patient.get('cccd') if has_cccd_bhyt else None,
            "bhyt": patient.get('bhyt') if has_cccd_bhyt else None,
            "message": "Patient updated successfully"
        }
        
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating patient: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Bills endpoints
@app.get("/admin/bills")
async def get_bills(page: int = 1, page_size: int = 10):
    """Get bills list"""
    try:
        # TODO: Implement actual database query
        return {
            "data": [],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": 0,
                "total_pages": 0
            }
        }
    except Exception as e:
        logger.error(f"Error getting bills: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/bills")
async def create_bill(bill_data: Dict[str, Any]):
    """Create a new bill"""
    try:
        # TODO: Implement actual database insert
        return {"id": 1, "message": "Bill created successfully"}
    except Exception as e:
        logger.error(f"Error creating bill: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Standard Screening endpoint for NurseScreening (non Internal Med)
@app.put("/admin/appointments/{appointment_id}/screening")
async def update_appointment_screening(appointment_id: str, screening_data: Dict[str, Any], request: Request):
    """Update standard nurse screening data and forward patient to doctor"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        import traceback
        
        # Check if appointment exists
        check_query = "SELECT id, patient_id, status FROM ehr_appointments WHERE id = %s"
        cursor.execute(check_query, (appointment_id,))
        appointment = cursor.fetchone()
        
        if not appointment:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Get created_by from request headers
        created_by = 'system'
        if request:
            created_by = request.headers.get('X-User', 'system')
        
        import json
        import uuid
        from datetime import datetime
        
        # Prepare screening data as JSON to store in content field
        screening_content = {
            "appointment_id": appointment_id,
            "pulse": screening_data.get('pulse'),
            "temperature": screening_data.get('temperature'),
            "blood_pressure_systolic": screening_data.get('blood_pressure_systolic'),
            "blood_pressure_diastolic": screening_data.get('blood_pressure_diastolic'),
            "respiratory_rate": screening_data.get('respiratory_rate'),
            "weight": screening_data.get('weight'),
            "height": screening_data.get('height'),
            "oxygen_saturation": screening_data.get('oxygen_saturation'),
            "pain_scale": screening_data.get('pain_scale'),
            "reason_text": screening_data.get('reason_text'),
            "medical_history": screening_data.get('medical_history'),
            "allergies": screening_data.get('allergies'),
            "current_medications": screening_data.get('current_medications'),
            "nurse_notes": screening_data.get('nurse_notes'),
            "screened_by": created_by,
            "screened_at": datetime.now().isoformat()
        }
        content_json = json.dumps(screening_content, ensure_ascii=False)
        
        # Check if record exists
        record_check = """
            SELECT id FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC LIMIT 1
        """
        cursor.execute(record_check, (appointment.get('patient_id'), 'Screening%'))
        existing_record = cursor.fetchone()
        
        if existing_record:
            # Update existing record
            update_query = """
                UPDATE ehr_medical_records SET
                    content = %s,
                    updated_at = %s
                WHERE id = %s
            """
            cursor.execute(update_query, (
                content_json,
                datetime.now(),
                existing_record.get('id')
            ))
        else:
            # Create new record
            record_id = str(uuid.uuid4())
            insert_query = """
                INSERT INTO ehr_medical_records (
                    id, patient_id, record_type, title, content, created_by, created_at, updated_at
                ) VALUES (
                    %s, %s, 'note', %s, %s, %s, NOW(), NOW()
                )
            """
            cursor.execute(insert_query, (
                record_id,
                appointment.get('patient_id'),
                f'Screening - Appointment {appointment_id}',
                content_json,
                created_by
            ))
        
        # Update appointment status to waiting_doctor_review (forward to Doctor queue)
        # Note: Must match the status filter in /admin/queues/internal-med/doctor endpoint
        update_appointment = "UPDATE ehr_appointments SET status = 'waiting_doctor_review', updated_at = %s WHERE id = %s"
        cursor.execute(update_appointment, (datetime.now(), appointment_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "message": "Screening information saved successfully. Patient has been forwarded to Doctor.",
            "appointment_id": appointment_id,
            "status": "waiting_doctor_review"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating screening: {e}")
        traceback.print_exc()
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Internal Medicine Queue endpoints
@app.get("/admin/queues/internal-med/screening")
async def get_internal_med_screening_queue():
    """Get internal medicine nurse screening queue"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Get appointments with status waiting or waiting_nurse_screening for Internal Medicine department
        # Include all appointments regardless of date (not just today)
        query = """
            SELECT 
                a.id,
                a.patient_id,
                a.department_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.queue_number,
                a.reason_text,
                a.reason_tags,
                p.patient_code,
                p.full_name as patient_name,
                p.date_of_birth,
                p.gender,
                d.name as department_name
            FROM ehr_appointments a
            LEFT JOIN ehr_patients p ON a.patient_id = p.id
            LEFT JOIN ehr_departments d ON a.department_id = d.id
            WHERE a.status IN ('waiting', 'waiting_nurse_screening')
            AND (d.name LIKE %s OR d.name LIKE %s OR a.department_id LIKE %s)
            ORDER BY a.appointment_date DESC, a.queue_number ASC, a.appointment_time ASC
        """
        
        cursor.execute(query, ('%Nội%', '%Internal%', 'dept-001%'))
        appointments = cursor.fetchall()
        
        # Format appointments
        formatted_appointments = []
        for apt in appointments:
            # Parse reason_tags if it's JSON string
            reason_tags = apt.get('reason_tags')
            if reason_tags and isinstance(reason_tags, str):
                try:
                    import json
                    reason_tags = json.loads(reason_tags)
                except:
                    pass
            
            formatted_apt = {
                "id": apt.get('id'),
                "patient_id": apt.get('patient_id'),
                "patient_code": apt.get('patient_code'),
                "patient_name": apt.get('patient_name'),
                "date_of_birth": str(apt.get('date_of_birth')) if apt.get('date_of_birth') else None,
                "gender": apt.get('gender'),
                "department_id": apt.get('department_id'),
                "department_name": apt.get('department_name'),
                "appointment_date": str(apt.get('appointment_date')) if apt.get('appointment_date') else None,
                "appointment_time": str(apt.get('appointment_time')) if apt.get('appointment_time') else None,
                "status": apt.get('status'),
                "queue_number": apt.get('queue_number'),
                "reason_text": apt.get('reason_text'),
                "reason_tags": reason_tags
            }
            formatted_appointments.append(formatted_apt)
        
        cursor.close()
        connection.close()
        
        return {"appointments": formatted_appointments}
    except Exception as e:
        logger.error(f"Error getting screening queue: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/queues/internal-med/{appointment_id}/screening")
async def get_internal_med_screening_details(appointment_id: str):
    """Get internal medicine screening details for a specific appointment"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Get appointment with patient info
        query = """
            SELECT 
                a.id,
                a.patient_id,
                a.department_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.queue_number,
                a.reason_text,
                a.reason_tags,
                p.id as patient_id,
                p.patient_code,
                p.full_name,
                p.date_of_birth,
                p.gender,
                p.phone,
                p.email,
                p.address,
                d.name as department_name
            FROM ehr_appointments a
            LEFT JOIN ehr_patients p ON a.patient_id = p.id
            LEFT JOIN ehr_departments d ON a.department_id = d.id
            WHERE a.id = %s
        """
        
        cursor.execute(query, (appointment_id,))
        appointment = cursor.fetchone()
        
        if not appointment:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Format patient data
        patient = {
            "id": appointment.get('patient_id'),
            "patient_code": appointment.get('patient_code'),
            "full_name": appointment.get('full_name'),
            "date_of_birth": str(appointment.get('date_of_birth')) if appointment.get('date_of_birth') else None,
            "gender": appointment.get('gender'),
            "phone": appointment.get('phone'),
            "email": appointment.get('email'),
            "address": appointment.get('address')
        }
        
        # Get or create medical record (screening data)
        # For now, return empty record - will be stored when screening is saved
        record = {}
        
        # Try to get existing screening record if any
        # Store screening data in content field as JSON
        record_query = """
            SELECT * FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC 
            LIMIT 1
        """
        try:
            cursor.execute(record_query, (appointment.get('patient_id'), 'Screening%'))
            existing_record = cursor.fetchone()
            if existing_record:
                # Parse JSON from content field
                import json
                try:
                    content_data = json.loads(existing_record.get('content', '{}'))
                    record = content_data
                    record['id'] = existing_record.get('id')
                except:
                    record = {}
        except Exception as e:
            logger.warning(f"No existing record found or error reading record: {e}")
        
        cursor.close()
        connection.close()
        
        return {
            "patient": patient,
            "record": record,
            "appointment": {
                "id": appointment.get('id'),
                "appointment_date": str(appointment.get('appointment_date')) if appointment.get('appointment_date') else None,
                "appointment_time": str(appointment.get('appointment_time')) if appointment.get('appointment_time') else None,
                "status": appointment.get('status'),
                "queue_number": appointment.get('queue_number'),
                "reason_text": appointment.get('reason_text'),
                "department_name": appointment.get('department_name')
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting screening details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/admin/queues/internal-med/{appointment_id}/screening")
async def update_internal_med_screening(appointment_id: str, screening_data: Dict[str, Any], request: Request):
    """Update internal medicine screening data and forward to next step"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if appointment exists
        check_query = "SELECT id, patient_id, status FROM ehr_appointments WHERE id = %s"
        cursor.execute(check_query, (appointment_id,))
        appointment = cursor.fetchone()
        
        if not appointment:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Get created_by from request headers
        created_by = 'system'
        if request:
            created_by = request.headers.get('X-User', 'system')
        
        # Check if record exists
        record_check = """
            SELECT id FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC LIMIT 1
        """
        cursor.execute(record_check, (appointment.get('patient_id'), 'Screening%'))
        existing_record = cursor.fetchone()
        
        import json
        import uuid
        from datetime import datetime
        
        # Prepare screening data as JSON to store in content field
        screening_content = {
            "appointment_id": appointment_id,
            "admission_date": screening_data.get('admission_date'),
            "admission_time": screening_data.get('admission_time'),
            "bed_number": screening_data.get('bed_number'),
            "room_number": screening_data.get('room_number'),
            "admission_type": screening_data.get('admission_type', 'outpatient'),
            "referred_by": screening_data.get('referred_by'),
            "admission_for_this_illness_times": screening_data.get('admission_for_this_illness_times'),
            "reason_for_admission": screening_data.get('reason_for_admission'),
            "admission_day_of_illness": screening_data.get('admission_day_of_illness'),
            "illness_course": screening_data.get('illness_course'),
            "personal_history": screening_data.get('personal_history'),
            "allergies_detail": screening_data.get('allergies_detail'),
            "drug_abuse_duration_months": screening_data.get('drug_abuse_duration_months'),
            "alcohol_duration_months": screening_data.get('alcohol_duration_months'),
            "tobacco_duration_months": screening_data.get('tobacco_duration_months'),
            "traditional_tobacco_duration_months": screening_data.get('traditional_tobacco_duration_months'),
            "other_habits_detail": screening_data.get('other_habits_detail'),
            "family_history": screening_data.get('family_history'),
            "general_examination": screening_data.get('general_examination'),
            "vital_signs": screening_data.get('vital_signs', {}),
            "chief_complaint": screening_data.get('chief_complaint'),
            "present_illness": screening_data.get('present_illness'),
            "past_medical_history": screening_data.get('past_medical_history'),
            "allergies": screening_data.get('allergies'),
            "current_medications": screening_data.get('current_medications'),
            "social_history": screening_data.get('social_history'),
            "screening_checklist": screening_data.get('screening_checklist', {})
        }
        content_json = json.dumps(screening_content, ensure_ascii=False)
        
        if existing_record:
            # Update existing record
            update_query = """
                UPDATE ehr_medical_records SET
                    content = %s,
                    updated_at = %s
                WHERE id = %s
            """
            cursor.execute(update_query, (
                content_json,
                datetime.now(),
                existing_record.get('id')
            ))
        else:
            # Create new record
            record_id = str(uuid.uuid4())
            insert_query = """
                INSERT INTO ehr_medical_records (
                    id, patient_id, record_type, title, content, created_by, created_at, updated_at
                ) VALUES (
                    %s, %s, 'note', %s, %s, %s, NOW(), NOW()
                )
            """
            cursor.execute(insert_query, (
                record_id,
                appointment.get('patient_id'),
                f'Screening - Appointment {appointment_id}',
                content_json,
                created_by
            ))
        
        # Update appointment status to waiting_lab_processing (forward to Lab Technician)
        update_appointment = "UPDATE ehr_appointments SET status = 'waiting_lab_processing', updated_at = %s WHERE id = %s"
        cursor.execute(update_appointment, (datetime.now(), appointment_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "message": "Screening information saved successfully. Patient has been forwarded to Lab Technician.",
            "appointment_id": appointment_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating screening: {e}")
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/queues/internal-med/lab")
async def get_internal_med_lab_queue():
    """Get internal medicine lab processing queue"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Get appointments with status waiting_lab_processing for Internal Medicine department
        # Include all appointments regardless of date (not just today)
        query = """
            SELECT 
                a.id,
                a.patient_id,
                a.department_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.queue_number,
                a.reason_text,
                a.reason_tags,
                p.patient_code,
                p.full_name as patient_name,
                d.name as department_name
            FROM ehr_appointments a
            LEFT JOIN ehr_patients p ON a.patient_id = p.id
            LEFT JOIN ehr_departments d ON a.department_id = d.id
            WHERE a.status = 'waiting_lab_processing'
            AND (d.name LIKE %s OR d.name LIKE %s OR a.department_id LIKE %s)
            ORDER BY a.appointment_date DESC, a.queue_number ASC, a.appointment_time ASC
        """
        
        cursor.execute(query, ('%Nội%', '%Internal%', 'dept-001%'))
        appointments = cursor.fetchall()
        
        # Format appointments
        formatted_appointments = []
        for apt in appointments:
            # Parse reason_tags if it's JSON string
            reason_tags = apt.get('reason_tags')
            if reason_tags and isinstance(reason_tags, str):
                try:
                    import json
                    reason_tags = json.loads(reason_tags)
                except:
                    pass
            
            formatted_apt = {
                "id": apt.get('id'),
                "patient_id": apt.get('patient_id'),
                "patient_code": apt.get('patient_code'),
                "patient_name": apt.get('patient_name'),
                "department_id": apt.get('department_id'),
                "department_name": apt.get('department_name'),
                "appointment_date": str(apt.get('appointment_date')) if apt.get('appointment_date') else None,
                "appointment_time": str(apt.get('appointment_time')) if apt.get('appointment_time') else None,
                "status": apt.get('status'),
                "queue_number": apt.get('queue_number'),
                "reason_text": apt.get('reason_text'),
                "reason_tags": reason_tags
            }
            formatted_appointments.append(formatted_apt)
        
        cursor.close()
        connection.close()
        
        return {"appointments": formatted_appointments}
    except Exception as e:
        logger.error(f"Error getting lab queue: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/queues/internal-med/{appointment_id}/lab")
async def get_internal_med_lab_details(appointment_id: str):
    """Get patient and record details for lab processing"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Get appointment with patient info
        query = """
            SELECT 
                a.id,
                a.patient_id,
                a.department_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.queue_number,
                a.reason_text,
                a.reason_tags,
                p.id as patient_uuid,
                p.patient_code,
                p.full_name,
                p.date_of_birth,
                p.gender,
                p.phone,
                p.email,
                p.address,
                d.name as department_name
            FROM ehr_appointments a
            LEFT JOIN ehr_patients p ON a.patient_id = p.id
            LEFT JOIN ehr_departments d ON a.department_id = d.id
            WHERE a.id = %s
        """
        
        cursor.execute(query, (appointment_id,))
        appointment = cursor.fetchone()
        
        if not appointment:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Format patient data
        patient = {
            "id": appointment.get('patient_uuid'),
            "patient_code": appointment.get('patient_code'),
            "full_name": appointment.get('full_name'),
            "date_of_birth": str(appointment.get('date_of_birth')) if appointment.get('date_of_birth') else None,
            "gender": appointment.get('gender'),
            "phone": appointment.get('phone'),
            "email": appointment.get('email'),
            "address": appointment.get('address')
        }
        
        # Get or create medical record (lab data)
        record = {}
        
        # Try to get existing lab record if any
        record_query = """
            SELECT * FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC 
            LIMIT 1
        """
        try:
            cursor.execute(record_query, (appointment.get('patient_id'), 'Lab%'))
            existing_record = cursor.fetchone()
            if existing_record:
                # Parse JSON from content field
                import json
                try:
                    content_data = json.loads(existing_record.get('content', '{}'))
                    record = content_data
                    record['id'] = existing_record.get('id')
                except:
                    record = {}
        except Exception as e:
            logger.warning(f"No existing record found or error reading record: {e}")
        
        cursor.close()
        connection.close()
        
        return {
            "patient": patient,
            "record": record,
            "appointment": {
                "id": appointment.get('id'),
                "appointment_date": str(appointment.get('appointment_date')) if appointment.get('appointment_date') else None,
                "appointment_time": str(appointment.get('appointment_time')) if appointment.get('appointment_time') else None,
                "status": appointment.get('status'),
                "queue_number": appointment.get('queue_number'),
                "reason_text": appointment.get('reason_text'),
                "department_name": appointment.get('department_name')
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting lab details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/admin/queues/internal-med/{appointment_id}/lab")
async def update_internal_med_lab(appointment_id: str, lab_data: Dict[str, Any], request: Request):
    """Update lab processing data and forward to nurse review"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if appointment exists
        check_query = "SELECT id, patient_id, status FROM ehr_appointments WHERE id = %s"
        cursor.execute(check_query, (appointment_id,))
        appointment = cursor.fetchone()
        
        if not appointment:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Get created_by from request headers
        created_by = 'system'
        if request:
            created_by = request.headers.get('X-User', 'system')
        
        # Check if record exists
        record_check = """
            SELECT id FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC LIMIT 1
        """
        cursor.execute(record_check, (appointment.get('patient_id'), 'Lab%'))
        existing_record = cursor.fetchone()
        
        import json
        import uuid
        from datetime import datetime
        
        # Prepare lab data as JSON to store in content field
        lab_content = {
            "appointment_id": appointment_id,
            "sample_collection_date": lab_data.get('sample_collection_date'),
            "sample_collection_time": lab_data.get('sample_collection_time'),
            "sample_type": lab_data.get('sample_type'),
            "sample_id": lab_data.get('sample_id'),
            "sample_quality": lab_data.get('sample_quality'),
            "lab_results": lab_data.get('lab_results', []),
            "imaging_results": lab_data.get('imaging_results', []),
            "lab_notes": lab_data.get('lab_notes', ''),
            "processed_by": created_by,
            "processed_at": datetime.now().isoformat()
        }
        
        lab_content_json = json.dumps(lab_content, ensure_ascii=False)
        
        if existing_record:
            # Update existing record
            update_record = """
                UPDATE ehr_medical_records 
                SET content = %s, updated_at = %s
                WHERE id = %s
            """
            cursor.execute(update_record, (lab_content_json, datetime.now(), existing_record.get('id')))
        else:
            # Create new record
            record_id = str(uuid.uuid4())
            insert_record = """
                INSERT INTO ehr_medical_records (
                    id, patient_id, record_type, title, content, created_by, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_record, (
                record_id,
                appointment.get('patient_id'),
                'note',
                f'Lab Processing - {datetime.now().strftime("%Y-%m-%d %H:%M")}',
                lab_content_json,
                created_by,
                datetime.now(),
                datetime.now()
            ))
        
        # Update appointment status to waiting_doctor_review (forward back to doctor)
        update_appointment = "UPDATE ehr_appointments SET status = 'waiting_doctor_review', updated_at = %s WHERE id = %s"
        cursor.execute(update_appointment, (datetime.now(), appointment_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "message": "Lab data saved successfully and forwarded to doctor review",
            "appointment_id": appointment_id,
            "status": "waiting_doctor_review"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating lab data: {e}")
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/lab-orders")
async def get_lab_orders(
    status: Optional[str] = None,
    patient_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 100
):
    """Get lab orders list"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Build WHERE clause
        where_clauses = []
        params = []
        
        if status:
            where_clauses.append("status = %s")
            params.append(status)
        
        if patient_id:
            where_clauses.append("patient_id = %s")
            params.append(patient_id)
        
        where_sql = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM ehr_lab_orders{where_sql}"
        cursor.execute(count_query, params)
        count_result = cursor.fetchone()
        total = count_result['total'] if isinstance(count_result, dict) else count_result[0]
        
        # Get lab orders with patient info
        query = f"""
            SELECT 
                lo.id,
                lo.patient_id,
                lo.appointment_id,
                lo.test_type,
                lo.test_name,
                lo.status,
                lo.order_date,
                lo.completed_date,
                lo.results,
                lo.notes,
                lo.created_at,
                p.patient_code,
                p.full_name as patient_name
            FROM ehr_lab_orders lo
            LEFT JOIN ehr_patients p ON lo.patient_id = p.id
            {where_sql}
            ORDER BY lo.order_date DESC, lo.created_at DESC
            LIMIT %s OFFSET %s
        """
        
        offset = (page - 1) * page_size
        cursor.execute(query, params + [page_size, offset])
        orders = cursor.fetchall()
        
        # Format orders
        formatted_orders = []
        for order in orders:
            # Parse results if it's JSON string
            results = order.get('results')
            if results and isinstance(results, str):
                try:
                    import json
                    results = json.loads(results)
                except:
                    pass
            
            formatted_order = {
                "id": order.get('id'),
                "patient_id": order.get('patient_id'),
                "patient_code": order.get('patient_code'),
                "patient_name": order.get('patient_name'),
                "appointment_id": order.get('appointment_id'),
                "test_type": order.get('test_type'),
                "test_name": order.get('test_name'),
                "status": order.get('status'),
                "order_date": str(order.get('order_date')) if order.get('order_date') else None,
                "completed_date": str(order.get('completed_date')) if order.get('completed_date') else None,
                "results": results,
                "notes": order.get('notes'),
                "created_at": str(order.get('created_at')) if order.get('created_at') else None
            }
            formatted_orders.append(formatted_order)
        
        cursor.close()
        connection.close()
        
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        
        return {
            "data": formatted_orders,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages
            }
        }
    except Exception as e:
        logger.error(f"Error getting lab orders: {e}")
        # If table doesn't exist, return empty list
        if "doesn't exist" in str(e).lower() or "unknown table" in str(e).lower():
            return {
                "data": [],
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": 0,
                    "total_pages": 0
                }
            }
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/admin/lab-orders/{order_id}")
async def update_lab_order(order_id: str, order_data: Dict[str, Any], request: Request):
    """Update lab order results and status"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if order exists
        check_query = "SELECT id FROM ehr_lab_orders WHERE id = %s"
        cursor.execute(check_query, (order_id,))
        order = cursor.fetchone()
        
        if not order:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Lab order not found")
        
        # Get updated_by from request headers
        updated_by = 'system'
        if request:
            updated_by = request.headers.get('X-User', 'system')
        
        import json
        from datetime import datetime
        
        # Prepare update data
        results_json = None
        if order_data.get('result') or order_data.get('results'):
            results_data = order_data.get('results') or order_data.get('result')
            if isinstance(results_data, dict):
                results_json = json.dumps(results_data, ensure_ascii=False)
            elif isinstance(results_data, str):
                results_json = results_data
        
        # Update order
        update_query = """
            UPDATE ehr_lab_orders SET
                status = %s,
                results = %s,
                notes = %s,
                completed_date = %s,
                updated_at = %s
            WHERE id = %s
        """
        
        completed_date = None
        if order_data.get('status') in ['completed', 'done', 'finished']:
            completed_date = datetime.now()
        
        cursor.execute(update_query, (
            order_data.get('status'),
            results_json,
            order_data.get('notes'),
            completed_date,
            datetime.now(),
            order_id
        ))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "message": "Lab order updated successfully",
            "order_id": order_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating lab order: {e}")
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/queues/internal-med/review")
async def get_internal_med_review_queue():
    """Get internal medicine nurse review queue"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Get appointments with status waiting_nurse_review for Internal Medicine department
        # Include all appointments regardless of date (not just today)
        query = """
            SELECT 
                a.id,
                a.patient_id,
                a.department_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.queue_number,
                a.reason_text,
                a.reason_tags,
                p.patient_code,
                p.full_name as patient_name,
                d.name as department_name
            FROM ehr_appointments a
            LEFT JOIN ehr_patients p ON a.patient_id = p.id
            LEFT JOIN ehr_departments d ON a.department_id = d.id
            WHERE a.status = 'waiting_nurse_review'
            AND (d.name LIKE %s OR d.name LIKE %s OR a.department_id LIKE %s)
            ORDER BY a.appointment_date DESC, a.queue_number ASC, a.appointment_time ASC
        """
        
        cursor.execute(query, ('%Nội%', '%Internal%', 'dept-001%'))
        appointments = cursor.fetchall()
        
        # Format appointments
        formatted_appointments = []
        for apt in appointments:
            # Parse reason_tags if it's JSON string
            reason_tags = apt.get('reason_tags')
            if reason_tags and isinstance(reason_tags, str):
                try:
                    import json
                    reason_tags = json.loads(reason_tags)
                except:
                    pass
            
            formatted_apt = {
                "id": apt.get('id'),
                "patient_id": apt.get('patient_id'),
                "patient_code": apt.get('patient_code'),
                "patient_name": apt.get('patient_name'),
                "department_id": apt.get('department_id'),
                "department_name": apt.get('department_name'),
                "appointment_date": str(apt.get('appointment_date')) if apt.get('appointment_date') else None,
                "appointment_time": str(apt.get('appointment_time')) if apt.get('appointment_time') else None,
                "status": apt.get('status'),
                "queue_number": apt.get('queue_number'),
                "reason_text": apt.get('reason_text'),
                "reason_tags": reason_tags
            }
            formatted_appointments.append(formatted_apt)
        
        cursor.close()
        connection.close()
        
        return {"appointments": formatted_appointments}
    except Exception as e:
        logger.error(f"Error getting review queue: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/queues/internal-med/{appointment_id}/review")
async def get_internal_med_review_details(appointment_id: str):
    """Get patient and record details for nurse review"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Get appointment with patient info
        query = """
            SELECT 
                a.id,
                a.patient_id,
                a.department_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.queue_number,
                a.reason_text,
                a.reason_tags,
                p.id as patient_uuid,
                p.patient_code,
                p.full_name,
                p.date_of_birth,
                p.gender,
                p.phone,
                p.email,
                p.address,
                d.name as department_name
            FROM ehr_appointments a
            LEFT JOIN ehr_patients p ON a.patient_id = p.id
            LEFT JOIN ehr_departments d ON a.department_id = d.id
            WHERE a.id = %s
        """
        
        cursor.execute(query, (appointment_id,))
        appointment = cursor.fetchone()
        
        if not appointment:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Format patient data
        patient = {
            "id": appointment.get('patient_uuid'),
            "patient_code": appointment.get('patient_code'),
            "full_name": appointment.get('full_name'),
            "date_of_birth": str(appointment.get('date_of_birth')) if appointment.get('date_of_birth') else None,
            "gender": appointment.get('gender'),
            "phone": appointment.get('phone'),
            "email": appointment.get('email'),
            "address": appointment.get('address')
        }
        
        # Get medical records (screening and lab data)
        record = {}
        
        # Get screening record
        screening_query = """
            SELECT * FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC 
            LIMIT 1
        """
        try:
            cursor.execute(screening_query, (appointment.get('patient_id'), 'Screening%'))
            screening_record = cursor.fetchone()
            if screening_record:
                import json
                try:
                    screening_content = json.loads(screening_record.get('content', '{}'))
                    record['screening'] = screening_content
                except:
                    record['screening'] = {}
        except Exception as e:
            logger.warning(f"No screening record found: {e}")
        
        # Get lab record
        lab_query = """
            SELECT * FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC 
            LIMIT 1
        """
        try:
            cursor.execute(lab_query, (appointment.get('patient_id'), 'Lab%'))
            lab_record = cursor.fetchone()
            if lab_record:
                import json
                try:
                    lab_content = json.loads(lab_record.get('content', '{}'))
                    record['lab'] = lab_content
                except:
                    record['lab'] = {}
        except Exception as e:
            logger.warning(f"No lab record found: {e}")
        
        # Get review record if exists
        review_query = """
            SELECT * FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC 
            LIMIT 1
        """
        try:
            cursor.execute(review_query, (appointment.get('patient_id'), 'Review%'))
            review_record = cursor.fetchone()
            if review_record:
                import json
                try:
                    review_content = json.loads(review_record.get('content', '{}'))
                    record['review_checklist'] = review_content.get('review_checklist', {})
                    record['review_notes'] = review_content.get('review_notes', '')
                    record['id'] = review_record.get('id')
                except:
                    pass
        except Exception as e:
            logger.warning(f"No review record found: {e}")
        
        cursor.close()
        connection.close()
        
        return {
            "patient": patient,
            "record": record,
            "appointment": {
                "id": appointment.get('id'),
                "appointment_date": str(appointment.get('appointment_date')) if appointment.get('appointment_date') else None,
                "appointment_time": str(appointment.get('appointment_time')) if appointment.get('appointment_time') else None,
                "status": appointment.get('status'),
                "queue_number": appointment.get('queue_number'),
                "reason_text": appointment.get('reason_text'),
                "department_name": appointment.get('department_name')
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting review details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/admin/queues/internal-med/{appointment_id}/review")
async def update_internal_med_review(appointment_id: str, review_data: Dict[str, Any], request: Request):
    """Update nurse review and forward to next step"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if appointment exists
        check_query = "SELECT id, patient_id, status FROM ehr_appointments WHERE id = %s"
        cursor.execute(check_query, (appointment_id,))
        appointment = cursor.fetchone()
        
        if not appointment:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Get created_by from request headers
        created_by = 'system'
        if request:
            created_by = request.headers.get('X-User', 'system')
        
        # Check if review record exists
        record_check = """
            SELECT id FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC LIMIT 1
        """
        cursor.execute(record_check, (appointment.get('patient_id'), 'Review%'))
        existing_record = cursor.fetchone()
        
        import json
        import uuid
        from datetime import datetime
        
        # Prepare review content as JSON to store in content field
        review_content = {
            "appointment_id": appointment_id,
            "review_checklist": review_data.get('review_checklist', {}),
            "review_notes": review_data.get('review_notes', ''),
            "review_action": review_data.get('review_action', 'approve'),
            "reviewed_by": created_by,
            "reviewed_at": datetime.now().isoformat()
        }
        
        review_content_json = json.dumps(review_content, ensure_ascii=False)
        
        if existing_record:
            # Update existing record
            update_record = """
                UPDATE ehr_medical_records 
                SET content = %s, updated_at = %s
                WHERE id = %s
            """
            cursor.execute(update_record, (review_content_json, datetime.now(), existing_record.get('id')))
        else:
            # Create new record
            record_id = str(uuid.uuid4())
            insert_record = """
                INSERT INTO ehr_medical_records (
                    id, patient_id, record_type, title, content, created_by, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_record, (
                record_id,
                appointment.get('patient_id'),
                'note',
                f'Review - {datetime.now().strftime("%Y-%m-%d %H:%M")}',
                review_content_json,
                created_by,
                datetime.now(),
                datetime.now()
            ))
        
        # Update appointment status based on review action
        review_action = review_data.get('review_action', 'approve')
        new_status = 'waiting_doctor_review'  # Default: forward to doctor
        
        if review_action == 'return_to_screening':
            new_status = 'waiting_nurse_screening'
        elif review_action == 'return_to_lab':
            new_status = 'waiting_lab_processing'
        elif review_action == 'approve':
            new_status = 'waiting_doctor_review'
        
        update_appointment = "UPDATE ehr_appointments SET status = %s, updated_at = %s WHERE id = %s"
        cursor.execute(update_appointment, (new_status, datetime.now(), appointment_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "message": f"Review saved successfully. Status updated to {new_status}",
            "appointment_id": appointment_id,
            "status": new_status
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating review: {e}")
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/queues/internal-med/doctor")
async def get_internal_med_doctor_queue(request: Request):
    """Get internal medicine doctor queue - filtered by assigned doctor"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Get current user from request header
        current_user = request.headers.get('X-User', 'bs.dakhoa')
        
        # Get appointments with status waiting_doctor_review for Internal Medicine department
        # Filter by assigned_doctor column:
        # - bs.dakhoa: sees patients assigned to 'bs.dakhoa' or NULL
        # - Specialist doctors: only see patients assigned to their username
        
        # Non-doctor users see nothing
        if not current_user.startswith('bs.'):
            cursor.close()
            connection.close()
            return {"appointments": []}
        
        query = """
            SELECT 
                a.id,
                a.patient_id,
                a.department_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.queue_number,
                a.reason_text,
                a.reason_tags,
                a.assigned_doctor,
                p.patient_code,
                p.full_name as patient_name,
                d.name as department_name
            FROM ehr_appointments a
            LEFT JOIN ehr_patients p ON a.patient_id = p.id
            LEFT JOIN ehr_departments d ON a.department_id = d.id
            WHERE a.status = 'waiting_doctor_review'
            AND (d.name LIKE %s OR d.name LIKE %s OR a.department_id LIKE %s)
            AND (a.assigned_doctor = %s OR (a.assigned_doctor IS NULL AND %s = 'bs.dakhoa'))
            ORDER BY a.appointment_date DESC, a.queue_number ASC, a.appointment_time ASC
        """
        cursor.execute(query, ('%Nội%', '%Internal%', 'dept-001%', current_user, current_user))
        appointments = cursor.fetchall()
        
        # Format appointments
        formatted_appointments = []
        for apt in appointments:
            # Parse reason_tags if it's JSON string
            reason_tags = apt.get('reason_tags')
            if reason_tags and isinstance(reason_tags, str):
                try:
                    import json
                    reason_tags = json.loads(reason_tags)
                except:
                    pass
            
            formatted_apt = {
                "id": apt.get('id'),
                "patient_id": apt.get('patient_id'),
                "patient_code": apt.get('patient_code'),
                "patient_name": apt.get('patient_name'),
                "department_id": apt.get('department_id'),
                "department_name": apt.get('department_name'),
                "appointment_date": str(apt.get('appointment_date')) if apt.get('appointment_date') else None,
                "appointment_time": str(apt.get('appointment_time')) if apt.get('appointment_time') else None,
                "status": apt.get('status'),
                "queue_number": apt.get('queue_number'),
                "reason_text": apt.get('reason_text'),
                "reason_tags": reason_tags
            }
            formatted_appointments.append(formatted_apt)
        
        cursor.close()
        connection.close()
        
        return {"appointments": formatted_appointments}
    except Exception as e:
        logger.error(f"Error getting doctor queue: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/queues/internal-med/{appointment_id}/doctor")
async def get_internal_med_doctor_details(appointment_id: str):
    """Get internal medicine doctor review details"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Get appointment with patient info
        query = """
            SELECT 
                a.id,
                a.patient_id,
                a.department_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.queue_number,
                a.reason_text,
                a.reason_tags,
                p.id as patient_uuid,
                p.patient_code,
                p.full_name,
                p.date_of_birth,
                p.gender,
                p.phone,
                p.email,
                p.address,
                d.name as department_name
            FROM ehr_appointments a
            LEFT JOIN ehr_patients p ON a.patient_id = p.id
            LEFT JOIN ehr_departments d ON a.department_id = d.id
            WHERE a.id = %s
        """
        
        cursor.execute(query, (appointment_id,))
        appointment = cursor.fetchone()
        
        if not appointment:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Format patient data
        patient = {
            "id": appointment.get('patient_uuid'),
            "patient_code": appointment.get('patient_code'),
            "full_name": appointment.get('full_name'),
            "date_of_birth": str(appointment.get('date_of_birth')) if appointment.get('date_of_birth') else None,
            "gender": appointment.get('gender'),
            "phone": appointment.get('phone'),
            "email": appointment.get('email'),
            "address": appointment.get('address')
        }
        
        # Get all medical records (screening, lab, review, doctor review)
        record = {}
        
        import json
        
        # Get screening record
        screening_query = """
            SELECT * FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC 
            LIMIT 1
        """
        try:
            logger.info(f"Looking for screening record with patient_id={appointment.get('patient_id')}")
            cursor.execute(screening_query, (appointment.get('patient_id'), 'Screening%'))
            screening_record = cursor.fetchone()
            logger.info(f"Screening record found: {screening_record is not None}")
            if screening_record:
                logger.info(f"Screening title: {screening_record.get('title')}")
                try:
                    screening_content = json.loads(screening_record.get('content', '{}'))
                    record['screening'] = screening_content
                    logger.info(f"Loaded screening data: {list(screening_content.keys())}")
                except:
                    record['screening'] = {}
        except Exception as e:
            logger.warning(f"No screening record found: {e}")
        
        # Get lab record
        lab_query = """
            SELECT * FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC 
            LIMIT 1
        """
        try:
            cursor.execute(lab_query, (appointment.get('patient_id'), 'Lab%'))
            lab_record = cursor.fetchone()
            if lab_record:
                try:
                    lab_content = json.loads(lab_record.get('content', '{}'))
                    record['lab'] = lab_content
                except:
                    record['lab'] = {}
        except Exception as e:
            logger.warning(f"No lab record found: {e}")
        
        # Get review record (nurse review)
        review_query = """
            SELECT * FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC 
            LIMIT 1
        """
        try:
            cursor.execute(review_query, (appointment.get('patient_id'), 'Review%'))
            review_record = cursor.fetchone()
            if review_record:
                try:
                    review_content = json.loads(review_record.get('content', '{}'))
                    record['review'] = review_content
                except:
                    record['review'] = {}
        except Exception as e:
            logger.warning(f"No review record found: {e}")
        
        # Get doctor review record if exists
        doctor_review_query = """
            SELECT * FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC 
            LIMIT 1
        """
        try:
            cursor.execute(doctor_review_query, (appointment.get('patient_id'), 'Doctor Review%'))
            doctor_review_record = cursor.fetchone()
            if doctor_review_record:
                try:
                    doctor_review_content = json.loads(doctor_review_record.get('content', '{}'))
                    # Merge doctor review data into record
                    for key, value in doctor_review_content.items():
                        if key not in ['appointment_id', 'reviewed_by', 'reviewed_at']:
                            record[key] = value
                    record['doctor_review_id'] = doctor_review_record.get('id')
                except:
                    pass
        except Exception as e:
            logger.warning(f"No doctor review record found: {e}")
        
        cursor.close()
        connection.close()
        
        return {
            "patient": patient,
            "record": record,
            "appointment": {
                "id": appointment.get('id'),
                "appointment_date": str(appointment.get('appointment_date')) if appointment.get('appointment_date') else None,
                "appointment_time": str(appointment.get('appointment_time')) if appointment.get('appointment_time') else None,
                "status": appointment.get('status'),
                "queue_number": appointment.get('queue_number'),
                "reason_text": appointment.get('reason_text'),
                "department_name": appointment.get('department_name')
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting doctor details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/admin/queues/internal-med/{appointment_id}/doctor")
async def update_internal_med_doctor_review(appointment_id: str, review_data: Dict[str, Any], request: Request):
    """Update internal medicine doctor review"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if appointment exists
        check_query = "SELECT id, patient_id, status FROM ehr_appointments WHERE id = %s"
        cursor.execute(check_query, (appointment_id,))
        appointment = cursor.fetchone()
        
        if not appointment:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Get created_by from request headers
        created_by = 'system'
        if request:
            created_by = request.headers.get('X-User', 'system')
        
        # Check if doctor review record exists
        record_check = """
            SELECT id FROM ehr_medical_records 
            WHERE patient_id = %s 
            AND record_type = 'note'
            AND title LIKE %s
            ORDER BY created_at DESC LIMIT 1
        """
        cursor.execute(record_check, (appointment.get('patient_id'), 'Doctor Review%'))
        existing_record = cursor.fetchone()
        
        import json
        import uuid
        from datetime import datetime
        
        # Debug: log what ent_exam value is received
        logger.info(f"Doctor review - User: {created_by}, ent_exam received: '{review_data.get('ent_exam')}'")
        logger.info(f"Doctor review - All clinical exam fields: cardiovascular={review_data.get('cardiovascular_exam')}, ent={review_data.get('ent_exam')}, dental={review_data.get('dental_exam')}, eye={review_data.get('eye_exam')}")
        
        # Load existing content if record exists (for merging)
        existing_content = {}
        if existing_record:
            content_query = "SELECT content FROM ehr_medical_records WHERE id = %s"
            cursor.execute(content_query, (existing_record.get('id'),))
            content_row = cursor.fetchone()
            if content_row and content_row.get('content'):
                try:
                    existing_content = json.loads(content_row.get('content'))
                except:
                    existing_content = {}
        
        # Helper function to merge: only update if new value is not empty
        def merge_value(key, new_value, default=''):
            # If new value is provided and not empty, use it
            # Otherwise keep existing value
            if new_value is not None and new_value != '' and new_value != 'No permission to view':
                return new_value
            # Keep existing value if available
            return existing_content.get(key, default)
        
        # Prepare doctor review content as JSON to store in content field
        # MERGE: keep existing values for fields not updated
        doctor_review_content = {
            "appointment_id": appointment_id,
            "reviewed_by": created_by,
            "reviewed_at": datetime.now().isoformat(),
            # Physical examination - merge with existing
            "cardiovascular_exam": merge_value('cardiovascular_exam', review_data.get('cardiovascular_exam')),
            "respiratory_exam": merge_value('respiratory_exam', review_data.get('respiratory_exam')),
            "digestive_exam": merge_value('digestive_exam', review_data.get('digestive_exam')),
            "genitourinary_exam": merge_value('genitourinary_exam', review_data.get('genitourinary_exam')),
            "neurological_exam": merge_value('neurological_exam', review_data.get('neurological_exam')),
            "musculoskeletal_exam": merge_value('musculoskeletal_exam', review_data.get('musculoskeletal_exam')),
            "ent_exam": merge_value('ent_exam', review_data.get('ent_exam')),
            "dental_exam": merge_value('dental_exam', review_data.get('dental_exam')),
            "eye_exam": merge_value('eye_exam', review_data.get('eye_exam')),
            "endocrine_exam": merge_value('endocrine_exam', review_data.get('endocrine_exam')),
            "required_paraclinical_tests": merge_value('required_paraclinical_tests', review_data.get('required_paraclinical_tests')),
            "case_summary": merge_value('case_summary', review_data.get('case_summary')),
            # Diagnosis - merge with existing
            "diagnosis_on_admission_primary": merge_value('diagnosis_on_admission_primary', review_data.get('diagnosis_on_admission_primary')),
            "diagnosis_on_admission_primary_code": merge_value('diagnosis_on_admission_primary_code', review_data.get('diagnosis_on_admission_primary_code')),
            "diagnosis_on_admission_secondary": merge_value('diagnosis_on_admission_secondary', review_data.get('diagnosis_on_admission_secondary')),
            "diagnosis_on_admission_secondary_code": merge_value('diagnosis_on_admission_secondary_code', review_data.get('diagnosis_on_admission_secondary_code')),
            "diagnosis_on_admission_differential": merge_value('diagnosis_on_admission_differential', review_data.get('diagnosis_on_admission_differential')),
            "diagnosis_on_admission_differential_code": merge_value('diagnosis_on_admission_differential_code', review_data.get('diagnosis_on_admission_differential_code')),
            "prognosis": merge_value('prognosis', review_data.get('prognosis')),
            "treatment_direction": merge_value('treatment_direction', review_data.get('treatment_direction')),
            # Clinical course - merge with existing
            "clinical_course_summary": merge_value('clinical_course_summary', review_data.get('clinical_course_summary')),
            "paraclinical_results_summary": merge_value('paraclinical_results_summary', review_data.get('paraclinical_results_summary')),
            "treatment_methods": merge_value('treatment_methods', review_data.get('treatment_methods')),
            "discharge_condition": merge_value('discharge_condition', review_data.get('discharge_condition')),
            # Death (if applicable) - merge with existing
            "death_date": merge_value('death_date', review_data.get('death_date'), None),
            "death_time": merge_value('death_time', review_data.get('death_time'), None),
            "death_cause": merge_value('death_cause', review_data.get('death_cause'), None),
            "death_timing": merge_value('death_timing', review_data.get('death_timing'), None),
            "primary_death_cause": merge_value('primary_death_cause', review_data.get('primary_death_cause')),
            "primary_death_cause_code": merge_value('primary_death_cause_code', review_data.get('primary_death_cause_code')),
            "autopsy_performed": review_data.get('autopsy_performed', existing_content.get('autopsy_performed', False)),
            "autopsy_diagnosis": merge_value('autopsy_diagnosis', review_data.get('autopsy_diagnosis')),
            "autopsy_diagnosis_code": merge_value('autopsy_diagnosis_code', review_data.get('autopsy_diagnosis_code')),
            # Discharge - merge with existing
            "discharge_date": merge_value('discharge_date', review_data.get('discharge_date'), None),
            "discharge_time": merge_value('discharge_time', review_data.get('discharge_time'), None),
            "discharge_type": merge_value('discharge_type', review_data.get('discharge_type')),
            "total_treatment_days": merge_value('total_treatment_days', review_data.get('total_treatment_days'), None)
        }
        
        doctor_review_content_json = json.dumps(doctor_review_content, ensure_ascii=False)
        
        if existing_record:
            # Update existing record
            update_record = """
                UPDATE ehr_medical_records 
                SET content = %s, updated_at = %s
                WHERE id = %s
            """
            cursor.execute(update_record, (doctor_review_content_json, datetime.now(), existing_record.get('id')))
        else:
            # Create new record
            record_id = str(uuid.uuid4())
            insert_record = """
                INSERT INTO ehr_medical_records (
                    id, patient_id, record_type, title, content, created_by, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_record, (
                record_id,
                appointment.get('patient_id'),
                'note',
                f'Doctor Review - {datetime.now().strftime("%Y-%m-%d %H:%M")}',
                doctor_review_content_json,
                created_by,
                datetime.now(),
                datetime.now()
            ))
        
        # Update appointment status based on doctor's action
        # Priority: return_to_general > transfer_to_specialist > forward_to_lab > discharge_date (completed) > in_progress
        return_to_general = review_data.get('return_to_general')
        transfer_to_specialist = review_data.get('transfer_to_specialist')
        
        if return_to_general:
            # Return to general doctor (bs.dakhoa) - from specialist
            new_status = 'waiting_doctor_review'
            update_appointment = """
                UPDATE ehr_appointments 
                SET status = %s, updated_at = %s, assigned_doctor = 'bs.dakhoa'
                WHERE id = %s
            """
            cursor.execute(update_appointment, (new_status, datetime.now(), appointment_id))
        elif transfer_to_specialist:
            # Transfer to specialist doctor - keep in waiting_doctor_review but set assigned_specialist
            new_status = 'waiting_doctor_review'
            # Store specialist assignment in assigned_doctor column
            update_appointment = """
                UPDATE ehr_appointments 
                SET status = %s, updated_at = %s, assigned_doctor = %s
                WHERE id = %s
            """
            cursor.execute(update_appointment, (new_status, datetime.now(), transfer_to_specialist, appointment_id))
        elif review_data.get('forward_to_lab'):
            new_status = 'waiting_lab_processing'
            update_appointment = "UPDATE ehr_appointments SET status = %s, updated_at = %s WHERE id = %s"
            cursor.execute(update_appointment, (new_status, datetime.now(), appointment_id))
        elif review_data.get('discharge_date'):
            new_status = 'completed'
            update_appointment = "UPDATE ehr_appointments SET status = %s, updated_at = %s WHERE id = %s"
            cursor.execute(update_appointment, (new_status, datetime.now(), appointment_id))
        else:
            # No specific action - keep status as waiting_doctor_review so other doctors can still access
            # This is important for specialists who just save their portion
            new_status = 'waiting_doctor_review'
            update_appointment = "UPDATE ehr_appointments SET status = %s, updated_at = %s WHERE id = %s"
            cursor.execute(update_appointment, (new_status, datetime.now(), appointment_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        message = "Doctor review saved successfully"
        if transfer_to_specialist:
            message = f"Patient transferred to {transfer_to_specialist}"
        
        return {
            "message": message,
            "appointment_id": appointment_id,
            "status": new_status
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating doctor review: {e}")
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Medical records endpoints
@app.get("/admin/medical-records")
async def get_medical_records(
    patient_id: Optional[str] = None,
    days: Optional[int] = None,
    date: Optional[str] = None,
    page: int = 1,
    page_size: int = 100
):
    """Get medical records"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Build WHERE clause
        where_clauses = []
        params = []
        
        if patient_id:
            where_clauses.append("mr.patient_id = %s")
            params.append(patient_id)
        
        if days:
            from datetime import datetime, timedelta
            days_ago = (datetime.now() - timedelta(days=days)).date()
            where_clauses.append("DATE(mr.created_at) >= %s")
            params.append(days_ago.isoformat())
        
        if date:
            where_clauses.append("DATE(mr.created_at) = %s")
            params.append(date)
        
        where_sql = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM ehr_medical_records mr{where_sql}"
        cursor.execute(count_query, params)
        count_result = cursor.fetchone()
        total = count_result['total'] if isinstance(count_result, dict) else count_result[0]
        
        # Get medical records with patient info
        query = f"""
            SELECT 
                mr.id,
                mr.patient_id,
                mr.record_type,
                mr.title,
                mr.content,
                mr.created_by,
                mr.created_at,
                mr.updated_at,
                p.patient_code,
                p.full_name as patient_name
            FROM ehr_medical_records mr
            LEFT JOIN ehr_patients p ON mr.patient_id = p.id
            {where_sql}
            ORDER BY mr.created_at DESC
            LIMIT %s OFFSET %s
        """
        
        offset = (page - 1) * page_size
        cursor.execute(query, params + [page_size, offset])
        records = cursor.fetchall()
        
        # Format records
        formatted_records = []
        import json
        for record in records:
            # Parse content if it's JSON string
            content = record.get('content')
            if content and isinstance(content, str):
                try:
                    content = json.loads(content)
                except:
                    pass
            
            formatted_record = {
                "id": record.get('id'),
                "patient_id": record.get('patient_id'),
                "patient_code": record.get('patient_code'),
                "patient_name": record.get('patient_name'),
                "record_type": record.get('record_type'),
                "title": record.get('title'),
                "content": content,
                "created_by": record.get('created_by'),
                "created_at": str(record.get('created_at')) if record.get('created_at') else None,
                "updated_at": str(record.get('updated_at')) if record.get('updated_at') else None
            }
            formatted_records.append(formatted_record)
        
        cursor.close()
        connection.close()
        
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        
        return {
            "records": formatted_records,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages
            }
        }
    except Exception as e:
        logger.error(f"Error getting medical records: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Consents endpoints
@app.get("/admin/consents")
async def get_consents(page: int = 1, page_size: int = 10):
    """Get consents list"""
    try:
        # TODO: Implement actual database query
        return {
            "data": [],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": 0,
                "total_pages": 0
            }
        }
    except Exception as e:
        logger.error(f"Error getting consents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/consents")
async def create_consent(consent_data: Dict[str, Any]):
    """Create a new consent"""
    try:
        # TODO: Implement actual database insert
        return {"id": 1, "message": "Consent created successfully"}
    except Exception as e:
        logger.error(f"Error creating consent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Emergency access endpoints
@app.get("/admin/emergency-access")
async def get_emergency_access(page: int = 1, page_size: int = 10):
    """Get emergency access logs"""
    try:
        # TODO: Implement actual database query
        return {
            "data": [],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": 0,
                "total_pages": 0
            }
        }
    except Exception as e:
        logger.error(f"Error getting emergency access: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/emergency-access")
async def create_emergency_access(access_data: Dict[str, Any]):
    """Create emergency access request"""
    try:
        # TODO: Implement actual database insert
        return {"id": 1, "message": "Emergency access granted"}
    except Exception as e:
        logger.error(f"Error creating emergency access: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Internal endpoint for gateway to log allowed access
@app.post("/admin/internal/log-access")
async def log_access(log_data: Dict[str, Any]):
    """Log allowed access to access_logs table"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Extract data from log_data
        username = log_data.get('username') or log_data.get('user_id', '')
        user_id = log_data.get('user_id') or username
        role = log_data.get('role') or 'UNKNOWN'
        method = log_data.get('method') or 'GET'
        uri = log_data.get('uri') or log_data.get('path', '')
        purpose = log_data.get('purpose') or 'administrative'
        action = log_data.get('action') or 'Access'
        operation = log_data.get('operation') or 'view'
        patient_id = log_data.get('patient_id')
        patient_code = log_data.get('patient_code')
        patient_name = log_data.get('patient_name')
        ip_address = log_data.get('ip_address')
        user_agent = log_data.get('user_agent')
        status = log_data.get('status') or 200
        
        # Build details JSON
        details = {
            'purpose': purpose,
            'status': status,
            'actor_username': username,
            'actor_name': username,
            'request_id': log_data.get('request_id', '')
        }
        import json
        details_json = json.dumps(details)
        
        # Extract request_body and response_body if available
        request_body = log_data.get('request_body')
        response_body = log_data.get('response_body')
        
        # If request_body is a dict, convert to JSON string
        if request_body and isinstance(request_body, dict):
            import json
            request_body = json.dumps(request_body)
        elif request_body and not isinstance(request_body, str):
            request_body = str(request_body)
        
        # If response_body is a dict, convert to JSON string
        if response_body and isinstance(response_body, dict):
            import json
            response_body = json.dumps(response_body)
        elif response_body and not isinstance(response_body, str):
            response_body = str(response_body)
        
        # Try to extract patient_id from response_body if not already set
        if not patient_id and response_body:
            try:
                import json
                resp_data = json.loads(response_body) if isinstance(response_body, str) else response_body
                if isinstance(resp_data, dict):
                    patient_id = resp_data.get('id') or resp_data.get('patient_id')
                    if not patient_code:
                        patient_code = resp_data.get('patient_code')
                    if not patient_name:
                        patient_name = resp_data.get('full_name') or resp_data.get('patient_name') or resp_data.get('name')
            except:
                pass
        
        # Check if there's a recent log entry for the same request (within last 2 seconds)
        # This handles the case where gateway logs twice: once in access_by_lua (without response_body)
        # and once in log_by_lua (with response_body and patient info)
        from datetime import datetime, timedelta
        check_query = """
            SELECT id FROM access_logs 
            WHERE user_id = %s 
            AND uri = %s 
            AND method = %s
            AND timestamp > DATE_SUB(NOW(), INTERVAL 2 SECOND)
            ORDER BY timestamp DESC
            LIMIT 1
        """
        cursor.execute(check_query, (user_id, uri, method))
        existing_log = cursor.fetchone()
        
        if existing_log and (patient_id or patient_code or patient_name or response_body):
            # Extract log ID
            log_id = None
            if isinstance(existing_log, dict):
                log_id = existing_log.get('id')
            elif isinstance(existing_log, (list, tuple)) and len(existing_log) > 0:
                log_id = existing_log[0]
            else:
                log_id = existing_log
            
            if log_id:
                # Update existing log with patient info and response_body
                update_query = """
                    UPDATE access_logs 
                    SET patient_id = COALESCE(%s, patient_id),
                        patient_code = COALESCE(%s, patient_code),
                        patient_name = COALESCE(%s, patient_name),
                        response_body = COALESCE(%s, response_body),
                        status = COALESCE(%s, status)
                    WHERE id = %s
                """
                cursor.execute(update_query, (
                    patient_id, patient_code, patient_name, response_body, status, log_id
                ))
                connection.commit()
                cursor.close()
                connection.close()
                return {"success": True, "message": "Access log updated successfully"}
        else:
            # Insert new log entry
            import uuid
            from datetime import datetime
            new_log_id = str(uuid.uuid4())
            
            # Extract log_type from log_data (sent by gateway)
            log_type = log_data.get('log_type')
            
            insert_query = """
                INSERT INTO access_logs (
                    id, timestamp, user_id, actor_name, role, method, uri, status, purpose, action, operation,
                    patient_id, patient_code, patient_name, ip_address, user_agent, details,
                    request_body, response_body, log_type
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                new_log_id, datetime.now(), user_id, username, role, method, uri, status, purpose, action, operation,
                patient_id, patient_code, patient_name, ip_address, user_agent, details_json,
                request_body, response_body, log_type
            ))
            connection.commit()
        cursor.close()
        connection.close()
        
        return {"success": True, "message": "Access logged successfully"}
    except Exception as e:
        logger.error(f"Error logging access: {e}")
        # Don't raise exception, just log it (gateway shouldn't fail if logging fails)
        return {"success": False, "error": str(e)}

# Medications endpoints
@app.get("/admin/medications")
async def get_medications(page: int = 1, page_size: int = 100):
    """Get medications list"""
    try:
        # TODO: Implement actual database query
        return {
            "data": [],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": 0,
                "total_pages": 0
            }
        }
    except Exception as e:
        logger.error(f"Error getting medications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Menu endpoints
@app.get("/admin/menus/role/{role}")
async def get_menu_by_role(role: str):
    """Get menu items for a specific role"""
    try:
        # Default menu structure for different roles
        menus = {
            "receptionist": [
                {"id": "dashboard", "label": "Dashboard", "path": "/dashboard", "icon": "dashboard"},
                {"id": "queue", "label": "Queue Management", "path": "/queue-management", "icon": "queue"},
                {"id": "patients", "label": "Patients", "path": "/patients", "icon": "people"},
                {"id": "billing", "label": "Billing", "path": "/billing", "icon": "payment"},
                {"id": "appointments", "label": "Appointments", "path": "/appointments", "icon": "calendar"}
            ],
            "doctor": [
                {"id": "dashboard", "label": "Dashboard", "path": "/dashboard", "icon": "dashboard"},
                {"id": "queue", "label": "Queue Management", "path": "/queue-management", "icon": "queue"},
                {"id": "patients", "label": "Patients", "path": "/patients", "icon": "people"},
                {"id": "medical-records", "label": "Medical Records", "path": "/medical-records", "icon": "folder"}
            ],
            "nurse": [
                {"id": "dashboard", "label": "Dashboard", "path": "/dashboard", "icon": "dashboard"},
                {"id": "queue", "label": "Queue Management", "path": "/queue-management", "icon": "queue"},
                {"id": "patients", "label": "Patients", "path": "/patients", "icon": "people"}
            ],
            "admin": [
                {"id": "dashboard", "label": "Dashboard", "path": "/dashboard", "icon": "dashboard"},
                {"id": "queue", "label": "Queue Management", "path": "/queue-management", "icon": "queue"},
                {"id": "patients", "label": "Patients", "path": "/patients", "icon": "people"},
                {"id": "billing", "label": "Billing", "path": "/billing", "icon": "payment"},
                {"id": "appointments", "label": "Appointments", "path": "/appointments", "icon": "calendar"},
                {"id": "users", "label": "User Management", "path": "/users", "icon": "people"},
                {"id": "settings", "label": "Settings", "path": "/settings", "icon": "settings"}
            ]
        }
        
        # Return menu for role or default receptionist menu
        menu_items = menus.get(role.lower(), menus.get("receptionist", []))
        return {"items": menu_items}
    except Exception as e:
        logger.error(f"Error getting menu for role {role}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Reason tags endpoints
@app.get("/admin/reason-tags")
async def get_reason_tags():
    """Get list of reason tags for appointments"""
    try:
        # TODO: Implement actual database query
        return {
            "data": [
                {"id": 1, "name": "Khám tổng quát", "code": "GENERAL"},
                {"id": 2, "name": "Khám chuyên khoa", "code": "SPECIALIST"},
                {"id": 3, "name": "Tái khám", "code": "FOLLOW_UP"},
                {"id": 4, "name": "Cấp cứu", "code": "EMERGENCY"},
                {"id": 5, "name": "Xét nghiệm", "code": "LAB_TEST"},
                {"id": 6, "name": "Chụp X-quang", "code": "XRAY"},
                {"id": 7, "name": "Siêu âm", "code": "ULTRASOUND"}
            ]
        }
    except Exception as e:
        logger.error(f"Error getting reason tags: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Departments endpoints
@app.get("/admin/departments")
async def get_departments():
    """Get list of departments"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Query departments from database
        cursor.execute("SELECT id, name, description FROM ehr_departments ORDER BY name")
        departments = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        # If no departments in database, return default list with UUIDs
        if not departments or len(departments) == 0:
            import uuid
            default_departments = [
                {"id": str(uuid.uuid4()), "name": "Khoa Nội", "code": "INTERNAL", "description": "Khoa Nội tổng quát"},
                {"id": str(uuid.uuid4()), "name": "Khoa Ngoại", "code": "SURGERY", "description": "Khoa Ngoại tổng quát"},
                {"id": str(uuid.uuid4()), "name": "Khoa Sản", "code": "OBSTETRICS", "description": "Khoa Sản phụ khoa"},
                {"id": str(uuid.uuid4()), "name": "Khoa Nhi", "code": "PEDIATRICS", "description": "Khoa Nhi"},
                {"id": str(uuid.uuid4()), "name": "Khoa Mắt", "code": "OPHTHALMOLOGY", "description": "Khoa Mắt"},
                {"id": str(uuid.uuid4()), "name": "Khoa Tai Mũi Họng", "code": "ENT", "description": "Khoa Tai Mũi Họng"},
                {"id": str(uuid.uuid4()), "name": "Khoa Da Liễu", "code": "DERMATOLOGY", "description": "Khoa Da Liễu"},
                {"id": str(uuid.uuid4()), "name": "Khoa Tim Mạch", "code": "CARDIOLOGY", "description": "Khoa Tim Mạch"}
            ]
            return {"data": default_departments}
        
        # Format departments from database
        formatted_departments = []
        for dept in departments:
            dept_dict = {
                "id": dept['id'] if isinstance(dept, dict) else dept[0],
                "name": dept['name'] if isinstance(dept, dict) else dept[1],
                "description": dept.get('description') if isinstance(dept, dict) else (dept[2] if len(dept) > 2 else None)
            }
            formatted_departments.append(dept_dict)
        
        return {"data": formatted_departments}
    except Exception as e:
        logger.error(f"Error getting departments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Patient Portal endpoints
@app.get("/patient/profile")
async def get_patient_profile(request: Request):
    """Get patient profile for logged-in patient"""
    try:
        # Get patient ID from various sources
        patient_id = request.headers.get("X-Patient-Id")
        username = request.headers.get("X-User") or ""
        
        # If no X-Patient-Id, try to extract from Authorization header (JWT)
        if not patient_id and not username:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                try:
                    import base64
                    import json
                    token = auth_header.split(" ")[1]
                    # Decode JWT payload (second part)
                    payload_b64 = token.split(".")[1]
                    # Add padding
                    padding = 4 - len(payload_b64) % 4
                    if padding != 4:
                        payload_b64 += "=" * padding
                    payload_json = base64.urlsafe_b64decode(payload_b64)
                    payload = json.loads(payload_json)
                    username = payload.get("preferred_username") or payload.get("username") or ""
                except Exception as e:
                    logger.warning(f"Failed to decode JWT: {e}")
        
        # Find patient by username (format: bn25122017 -> BN25122017)
        if not patient_id and username:
            # Username like "bn25122017" corresponds to patient_code "BN25122017"
            patient_id = username.upper()
        
        # If still no patient_id, return 401
        if not patient_id:
            raise HTTPException(status_code=401, detail="Patient ID not found")
        
        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT *
            FROM ehr_patients
            WHERE id = %s OR patient_code = %s
        """, (patient_id, patient_id))
        
        patient = cursor.fetchone()
        cursor.close()
        connection.close()
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return patient
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patient profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patient/medical-records")
async def get_patient_medical_records(
    request: Request,
    page: int = 1,
    page_size: int = 10
):
    """Get medical records for logged-in patient"""
    try:
        # Get patient ID from various sources
        patient_id = request.headers.get("X-Patient-Id")
        username = request.headers.get("X-User") or ""
        
        # If no X-Patient-Id, try to extract from Authorization header (JWT)
        if not patient_id and not username:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                try:
                    import base64
                    import json
                    token = auth_header.split(" ")[1]
                    # Decode JWT payload (second part)
                    payload_b64 = token.split(".")[1]
                    # Add padding
                    padding = 4 - len(payload_b64) % 4
                    if padding != 4:
                        payload_b64 += "=" * padding
                    payload_json = base64.urlsafe_b64decode(payload_b64)
                    payload = json.loads(payload_json)
                    username = payload.get("preferred_username") or payload.get("username") or ""
                except Exception as e:
                    logger.warning(f"Failed to decode JWT: {e}")
        
        # Find patient by username (format: bn25122017 -> BN25122017)
        if not patient_id and username:
            patient_id = username.upper()
        
        # If still no patient_id, return 401
        if not patient_id:
            raise HTTPException(status_code=401, detail="Patient ID not found")
        
        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
        # Get total count
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM ehr_medical_records
            WHERE patient_id = %s
        """, (patient_id,))
        total = cursor.fetchone()['total']
        
        # Get paginated records
        offset = (page - 1) * page_size
        cursor.execute("""
            SELECT 
                id,
                patient_id,
                record_type,
                content,
                created_at,
                updated_at
            FROM ehr_medical_records
            WHERE patient_id = %s
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, (patient_id, page_size, offset))
        
        records = cursor.fetchall()
        cursor.close()
        connection.close()
        
        return {
            "data": records,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": (total + page_size - 1) // page_size
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patient medical records: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# --- BILLING MOCK DATA ENDPOINTS ---

@app.get("/admin/services")
async def get_admin_services():
    """Mock API for billing services list"""
    return [
        {"id": 1, "name": "Khám tổng quát", "price": 200000, "code": "SV001"},
        {"id": 2, "name": "Khám chuyên khoa", "price": 300000, "code": "SV002"},
        {"id": 3, "name": "Cấp cứu", "price": 500000, "code": "SV003"},
        {"id": 4, "name": "Hội chẩn", "price": 1000000, "code": "SV004"}
    ]

@app.get("/admin/imaging")
async def get_admin_imaging():
    """Mock API for imaging catalog"""
    return [
        {"id": 1, "name": "X-Quang Ngực", "price": 150000, "code": "IMG001"},
        {"id": 2, "name": "CT Scanner Sọ não", "price": 1200000, "code": "IMG002"},
        {"id": 3, "name": "MRI Cột sống", "price": 2500000, "code": "IMG003"},
        {"id": 4, "name": "Siêu âm bụng", "price": 200000, "code": "IMG004"}
    ]

@app.get("/admin/lab-tests")
async def get_admin_lab_tests():
    """Mock API for lab tests catalog"""
    return [
        {"id": 1, "name": "Công thức máu", "price": 100000, "code": "LAB001"},
        {"id": 2, "name": "Sinh hóa máu", "price": 150000, "code": "LAB002"},
        {"id": 3, "name": "Xét nghiệm nước tiểu", "price": 80000, "code": "LAB003"},
        {"id": 4, "name": "Xét nghiệm miễn dịch", "price": 300000, "code": "LAB004"}
    ]

@app.get("/admin/doctors")
async def get_admin_doctors():
    """Mock API for doctors list"""
    return [
        {"id": "doc01", "name": "BS. Nguyễn Văn An", "department": "Nội khoa", "specialty": "Nội tổng quát"},
        {"id": "doc02", "name": "BS. Trần Thị Bình", "department": "Ngoại khoa", "specialty": "Ngoại tổng quát"},
        {"id": "doc03", "name": "BS. Lê Văn Cường", "department": "Nhi khoa", "specialty": "Nhi"},
        {"id": "doc04", "name": "BS. Phạm Thị Dung", "department": "Sản khoa", "specialty": "Sản phụ khoa"}
    ]

@app.get("/api/my-activity")
async def get_patient_activity(
    request: Request,
    page: int = 1,
    page_size: int = 50
):
    """Get activity logs for logged-in patient"""
    try:
        # Get username from JWT token
        username = ""
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                import base64
                import json
                token = auth_header.split(" ")[1]
                payload_b64 = token.split(".")[1]
                padding = 4 - len(payload_b64) % 4
                if padding != 4:
                    payload_b64 += "=" * padding
                payload_json = base64.urlsafe_b64decode(payload_b64)
                payload = json.loads(payload_json)
                username = payload.get("preferred_username") or payload.get("username") or ""
            except Exception as e:
                logger.warning(f"Failed to decode JWT: {e}")
        
        if not username:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        # Query access_logs table for this user's activity
        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
        # Get total count
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM access_logs
            WHERE actor_name = %s OR user_id = %s
        """, (username, username))
        total = cursor.fetchone()['total']
        
        # Get paginated logs
        offset = (page - 1) * page_size
        cursor.execute("""
            SELECT 
                id,
                timestamp,
                actor_name as username,
                role,
                action,
                operation,
                method,
                status,
                uri,
                ip_address,
                purpose,
                log_type
            FROM access_logs
            WHERE actor_name = %s OR user_id = %s
            ORDER BY timestamp DESC
            LIMIT %s OFFSET %s
        """, (username, username, page_size, offset))
        
        logs = cursor.fetchall()
        cursor.close()
        connection.close()
        
        return {
            "activities": logs,
            "total": total,
            "page": page,
            "page_size": page_size
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patient activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)




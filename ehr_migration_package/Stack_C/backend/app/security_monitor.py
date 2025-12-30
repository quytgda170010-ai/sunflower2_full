"""
Security Monitor: Query security logs from database
"""
import os
import mysql.connector
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


def extract_primary_role(role_str, username=None):
    """
    Extract primary role from role string or username
    Filters out system roles like 'offline_access', 'default-roles-clinicrealm', etc.
    """
    if not role_str:
        # Try to infer from username
        if username:
            username_lower = username.lower()
            # Check in order of priority (most specific first)
            if 'giamdoc' in username_lower or 'admin_hospital' in username_lower or 'hospital_admin' in username_lower:
                return 'admin_hospital'
            elif 'truongdieuduong' in username_lower or 'head_nurse' in username_lower or 'truongyd' in username_lower:
                return 'head_nurse'
            elif 'truongletan' in username_lower or 'head_reception' in username_lower or 'truongtieptan' in username_lower:
                return 'head_reception'
            elif 'ketoan' in username_lower or 'accountant' in username_lower or 'thungan' in username_lower:
                return 'accountant'
            elif 'duocsi' in username_lower or 'pharmacist' in username_lower or 'ds' in username_lower:
                return 'pharmacist'
            elif 'ktv' in username_lower or 'lab' in username_lower or 'xetnghiem' in username_lower or 'technician' in username_lower:
                return 'lab_technician'
            elif 'dieuduong' in username_lower or 'nurse' in username_lower or 'yd' in username_lower or 'dd' in username_lower:
                return 'nurse'
            elif 'letan' in username_lower or 'reception' in username_lower or 'tieptan' in username_lower:
                return 'receptionist'
            elif 'bacsi' in username_lower or 'doctor' in username_lower or 'bs' in username_lower:
                return 'doctor'
            elif 'benhnhan' in username_lower or 'patient' in username_lower or 'bn' in username_lower:
                return 'patient'
            elif 'admin' in username_lower or 'quanly' in username_lower or 'quantri' in username_lower:
                return 'admin'
        return 'UNKNOWN'
    
    # System roles to filter out
    system_roles = {
        'offline_access', 'default-roles-clinicrealm', 'uma_authorization',
        'manage-account', 'manage-account-links', 'view-profile'
    }
    
    # If role_str is a single role, check if it's a system role
    if role_str.lower() in system_roles:
        # Try to infer from username
        if username:
            username_lower = username.lower()
            # Check in order of priority (most specific first)
            if 'giamdoc' in username_lower or 'admin_hospital' in username_lower or 'hospital_admin' in username_lower:
                return 'admin_hospital'
            elif 'truongdieuduong' in username_lower or 'head_nurse' in username_lower or 'truongyd' in username_lower:
                return 'head_nurse'
            elif 'truongletan' in username_lower or 'head_reception' in username_lower or 'truongtieptan' in username_lower:
                return 'head_reception'
            elif 'ketoan' in username_lower or 'accountant' in username_lower or 'thungan' in username_lower:
                return 'accountant'
            elif 'duocsi' in username_lower or 'pharmacist' in username_lower or 'ds' in username_lower:
                return 'pharmacist'
            elif 'ktv' in username_lower or 'lab' in username_lower or 'xetnghiem' in username_lower or 'technician' in username_lower:
                return 'lab_technician'
            elif 'dieuduong' in username_lower or 'nurse' in username_lower or 'yd' in username_lower or 'dd' in username_lower:
                return 'nurse'
            elif 'letan' in username_lower or 'reception' in username_lower or 'tieptan' in username_lower:
                return 'receptionist'
            elif 'bacsi' in username_lower or 'doctor' in username_lower or 'bs' in username_lower:
                return 'doctor'
            elif 'benhnhan' in username_lower or 'patient' in username_lower or 'bn' in username_lower:
                return 'patient'
            elif 'admin' in username_lower or 'quanly' in username_lower or 'quantri' in username_lower:
                return 'admin'
        return role_str  # Return as-is if can't infer
    
    # If role_str contains multiple roles (comma-separated), find the primary one
    if ',' in role_str:
        roles = [r.strip() for r in role_str.split(',')]
        # Filter out system roles and find primary role
        primary_roles = [r for r in roles if r.lower() not in system_roles]
        if primary_roles:
            return primary_roles[0]  # Return first non-system role
        return roles[0] if roles else 'UNKNOWN'
    
    # Single role - check if it's a system role
    if role_str.lower() in system_roles:
        # Try to infer from username
        if username:
            username_lower = username.lower()
            # Check in order of priority (most specific first)
            if 'giamdoc' in username_lower or 'admin_hospital' in username_lower or 'hospital_admin' in username_lower:
                return 'admin_hospital'
            elif 'truongdieuduong' in username_lower or 'head_nurse' in username_lower or 'truongyd' in username_lower:
                return 'head_nurse'
            elif 'truongletan' in username_lower or 'head_reception' in username_lower or 'truongtieptan' in username_lower:
                return 'head_reception'
            elif 'ketoan' in username_lower or 'accountant' in username_lower or 'thungan' in username_lower:
                return 'accountant'
            elif 'duocsi' in username_lower or 'pharmacist' in username_lower or 'ds' in username_lower:
                return 'pharmacist'
            elif 'ktv' in username_lower or 'lab' in username_lower or 'xetnghiem' in username_lower or 'technician' in username_lower:
                return 'lab_technician'
            elif 'dieuduong' in username_lower or 'nurse' in username_lower or 'yd' in username_lower or 'dd' in username_lower:
                return 'nurse'
            elif 'letan' in username_lower or 'reception' in username_lower or 'tieptan' in username_lower:
                return 'receptionist'
            elif 'bacsi' in username_lower or 'doctor' in username_lower or 'bs' in username_lower:
                return 'doctor'
            elif 'benhnhan' in username_lower or 'patient' in username_lower or 'bn' in username_lower:
                return 'patient'
            elif 'admin' in username_lower or 'quanly' in username_lower or 'quantri' in username_lower:
                return 'admin'
        return role_str  # Return as-is if can't infer
    
    return role_str


class SecurityMonitor:
    """Query security logs from database"""
    
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'mariadb'),
            'user': os.getenv('DB_USER', 'openemr'),
            'password': os.getenv('DB_PASS', 'Openemr!123'),
            'database': os.getenv('DB_NAME', 'ehr_core'),
            'charset': 'utf8mb4',
            'use_unicode': True,
            'collation': 'utf8mb4_unicode_ci'
        }
    
    def _get_connection(self):
        """Get database connection"""
        return mysql.connector.connect(**self.db_config)
    
    def get_security_logs(
        self, 
        page: int = 1, 
        page_size: int = 20,
        log_type: Optional[str] = None,
        since_seconds: int = 86400,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Get security monitoring logs from access_logs table
        
        Args:
            page: Page number
            page_size: Items per page
            log_type: Filter by log type (SESSION_LOG, EMR_ACCESS_LOG, ENCOUNTER_LOG, PRESCRIPTION_LOG)
            since_seconds: Time window in seconds (default 24 hours)
            date_from: Start date (YYYY-MM-DD or DD/MM/YYYY)
            date_to: End date (YYYY-MM-DD or DD/MM/YYYY)
        
        Returns:
            (logs, total_count)
        """
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Build where clause based on date filter
            where_clauses = []
            params = []
            
            # If date_from and date_to are provided, use them
            if date_from and date_to:
                # Parse date formats (DD/MM/YYYY or YYYY-MM-DD)
                try:
                    if '/' in date_from:
                        from_date = datetime.strptime(date_from, '%d/%m/%Y')
                    else:
                        from_date = datetime.strptime(date_from, '%Y-%m-%d')
                    
                    if '/' in date_to:
                        to_date = datetime.strptime(date_to, '%d/%m/%Y')
                    else:
                        to_date = datetime.strptime(date_to, '%Y-%m-%d')
                    
                    # Add 1 day to to_date to include the entire day
                    to_date = to_date + timedelta(days=1)
                    
                    where_clauses.append("a.timestamp >= %s AND a.timestamp < %s")
                    params.extend([from_date, to_date])
                except ValueError as e:
                    logger.warning(f"Invalid date format: {e}, falling back to since_seconds")
                    where_clauses.append("a.timestamp >= DATE_SUB(NOW(), INTERVAL %s SECOND)")
                    params.append(since_seconds)
            else:
                # Fallback to since_seconds
                where_clauses.append("a.timestamp >= DATE_SUB(NOW(), INTERVAL %s SECOND)")
                params.append(since_seconds)
            
            if log_type == 'SESSION_LOG':
                # Filter login/logout session logs from:
                # 1. Keycloak session logs (log_type = SESSION_LOG)
                # 2. Keycloak SSO logs with login action (log_type = SYSTEM_AUTH_LOG)
                # 3. OpenEMR access logs that represent a login session
                where_clauses.append("""(
                    a.log_type IN ('SESSION_LOG', 'session_log')
                    OR (a.log_type IN ('SYSTEM_AUTH_LOG', 'system_auth', 'system_auth_log') AND (a.action LIKE '%Đăng nhập%' OR a.action LIKE '%login%' OR a.action LIKE '%Login%'))
                    OR (a.log_type IN ('emr_access_log', 'EMR_ACCESS_LOG', NULL) AND a.action = 'Access' AND a.purpose = 'Hành chính')
                    OR (a.log_type IS NULL AND a.action = 'Access')
                )""")
            elif log_type == 'EMR_ACCESS_LOG':
                # Filter meaningful EMR operations only (not generic 'Access' logs)
                # Include: View/Update patient, View/Create appointment, View billing
                # Exclude: Generic 'Access', 'Xem Access', 'Xem dữ liệu', SECURITY_ALERT
                where_clauses.append("""(
                    (a.log_type IN ('emr_access_log', 'EMR_ACCESS_LOG') OR a.log_type IS NULL OR a.log_type = '')
                    AND (
                        a.action LIKE '%bệnh nhân%'
                        OR a.action LIKE '%patient%'
                        OR a.action LIKE '%lịch hẹn%'
                        OR a.action LIKE '%appointment%'
                        OR a.action LIKE 'View patient%'
                        OR a.action LIKE 'View billing%'
                        OR a.action LIKE 'View appointment%'
                        OR a.action LIKE 'Xem thông tin%'
                        OR a.action LIKE 'Cập nhật%'
                        OR a.action LIKE 'Tạo lịch%'
                        OR a.action LIKE 'Thêm bệnh nhân%'
                        OR a.uri LIKE '%/patients%'
                        OR a.uri LIKE '%/appointments%'
                        OR a.uri LIKE '%/bills%'
                    )
                    AND a.action NOT IN ('Access', 'Xem Access', 'Xem dữ liệu')
                    AND a.action NOT LIKE '%BRUTE%'
                    AND COALESCE(a.log_type, '') != 'SECURITY_ALERT'
                )""")
            elif log_type == 'ENCOUNTER_LOG':
                # Filter logs nội dung khám bệnh: medical-records, encounter, diagnosis
                # Include Access logs with medical-records URI, exclude system logs (DLP, TLS) and prescription logs
                where_clauses.append("""(
                    (
                        a.action LIKE '%khám%'
                        OR a.action LIKE '%encounter%'
                        OR a.action LIKE '%diagnosis%'
                        OR a.action LIKE '%consultation%'
                        OR a.action LIKE '%medical%'
                        OR a.action LIKE 'View medical%'
                        OR a.uri LIKE '%/medical-records%'
                        OR a.uri LIKE '%/encounters%'
                        OR a.uri LIKE '%/visits%'
                    )
                    AND a.action NOT IN ('TLS_HANDSHAKE', 'DLP_COMPLIANCE', 'Xem dữ liệu', 'Create prescription')
                    AND a.action NOT LIKE '%prescription%'
                    AND a.action NOT LIKE '%thuốc%'
                    AND a.action NOT LIKE '%hàng chờ%'
                    AND a.action NOT LIKE '%queue%'
                    AND COALESCE(a.changed_fields, '') NOT LIKE '%"record_type": "prescription"%'
                    AND COALESCE(a.changed_fields, '') NOT LIKE '%"record_type":"prescription"%'
                    AND COALESCE(a.log_type, '') NOT IN ('system_tls', 'system_dlp', 'system_auth', 'SYSTEM_TLS_LOG', 'SYSTEM_DLP_LOG', 'SYSTEM_AUTH_LOG', 'SECURITY_ALERT')
                )""")
            elif log_type == 'PRESCRIPTION_LOG':
                # Filter logs nội dung thuốc: prescription, medication, drug
                # Only catch: 
                # 1. Logs with action containing thuốc/prescription/medication/drug
                # 2. Logs with log_type = PRESCRIPTION_LOG
                # 3. POST/PUT/PATCH requests to /medical-records (not GET)
                where_clauses.append("""(
                    a.action LIKE '%thuốc%' 
                    OR a.action LIKE '%prescription%'
                    OR a.action LIKE '%medication%'
                    OR a.action LIKE '%drug%'
                    OR a.log_type IN ('PRESCRIPTION_LOG', 'prescription_log')
                    OR (a.uri LIKE '%/medical-records%' AND a.method IN ('POST', 'PUT', 'PATCH'))
                )""")
            elif log_type == 'BACKUP_ENCRYPTION_LOG':
                # Filter logs backup và encryption
                where_clauses.append("(a.log_type IN ('BACKUP_ENCRYPTION_LOG', 'backup_encryption_log', 'system_encryption', 'emr_encryption'))")
            elif log_type == 'SYSTEM_TLS_LOG':
                # Filter logs TLS/SSL/Gateway
                where_clauses.append("(a.log_type IN ('SYSTEM_TLS_LOG', 'system_tls', 'system_tls_log'))")
            elif log_type == 'SYSTEM_AUTH_LOG':
                # Filter logs xác thực SSO/Keycloak
                where_clauses.append("(a.log_type IN ('SYSTEM_AUTH_LOG', 'system_auth', 'system_auth_log'))")
            elif log_type == 'SYSTEM_DLP_LOG':
                # Filter logs DLP chống rò rỉ dữ liệu
                where_clauses.append("(a.log_type IN ('SYSTEM_DLP_LOG', 'system_dlp', 'system_dlp_log'))")
            elif log_type == 'SECURITY_ALERT':
                # Filter security alerts: WAF blocked (SQLi, XSS) and brute force attacks
                # Only match logs with explicit SECURITY_ALERT log_type or WAF_BLOCK operation
                where_clauses.append("""(
                    a.log_type IN ('SECURITY_ALERT', 'security_alert')
                    OR a.operation = 'WAF_BLOCK'
                )""")
            
            where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
            logger.info(f"PRESCRIPTION_LOG filter - log_type: {log_type}, where_sql: {where_sql}")
            
            # Count total (use alias for consistency)
            count_query = f"SELECT COUNT(*) as total FROM access_logs a WHERE {where_sql}"
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']
            
            # Get paginated results with patient info from ehr_patients
            offset = (page - 1) * page_size
            query = f"""
                SELECT 
                    a.id,
                    a.timestamp,
                    a.user_id,
                    a.actor_name as username,
                    a.role,
                    a.action,
                    a.operation,
                    a.method,
                    a.status,
                    a.purpose,
                    a.patient_id,
                    COALESCE(p.patient_code, a.patient_code) as patient_code,
                    COALESCE(p.full_name, a.patient_name) as patient_name,
                    CASE 
                        WHEN COALESCE(p.patient_code, a.patient_code) IS NOT NULL AND LENGTH(COALESCE(p.patient_code, a.patient_code)) > 0
                             AND COALESCE(p.full_name, a.patient_name) IS NOT NULL AND LENGTH(COALESCE(p.full_name, a.patient_name)) > 0
                        THEN CONCAT(COALESCE(p.patient_code, a.patient_code), ' - ', COALESCE(p.full_name, a.patient_name))
                        WHEN COALESCE(p.patient_code, a.patient_code) IS NOT NULL AND LENGTH(COALESCE(p.patient_code, a.patient_code)) > 0
                        THEN COALESCE(p.patient_code, a.patient_code)
                        WHEN COALESCE(p.full_name, a.patient_name) IS NOT NULL AND LENGTH(COALESCE(p.full_name, a.patient_name)) > 0
                        THEN COALESCE(p.full_name, a.patient_name)
                        ELSE NULL
                    END as patient_display,
                    p.date_of_birth as patient_date_of_birth,
                    p.gender as patient_gender,
                    p.phone as patient_phone,
                    p.email as patient_email,
                    p.address as patient_address,
                    a.actor_name as user_full_name,
                    '' as user_department,
                    '' as user_email,
                    '' as user_phone,
                    a.changed_fields,
                    a.details,
                    a.uri,
                    a.ip_address,
                    a.user_agent,
                    a.request_body,
                    a.response_body,
                    COALESCE(a.log_type, 'EMR_ACCESS_LOG') as log_type
                FROM access_logs a
                LEFT JOIN ehr_patients p ON a.patient_id COLLATE utf8mb4_unicode_ci = p.id
                WHERE {where_sql}
                ORDER BY a.timestamp DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, params + [page_size, offset])
            logs = cursor.fetchall()
            
            # Format logs for frontend
            formatted_logs = []
            for log in logs:
                # Format action based on URI and operation
                action = self._format_action(log)
                
                # Format purpose
                purpose = self._format_purpose(log)
                
                # Extract primary role (filter out system roles)
                username = log.get('username') or log.get('user_id')
                role_str = log.get('role') or ''
                primary_role = extract_primary_role(role_str, username)
                
                formatted_log = {
                    'id': log.get('id'),
                    'timestamp': log.get('timestamp'),
                    'user_id': log.get('user_id'),
                    'username': username,
                    'user_full_name': log.get('user_full_name') or log.get('user_username') or username,
                    'user_department': log.get('user_department') or '',
                    'user_email': log.get('user_email') or '',
                    'user_phone': log.get('user_phone') or '',
                    'role': primary_role,
                    'action': action,
                    'operation': log.get('operation') or 'unknown',
                    'method': log.get('method') or 'N/A',
                    'status': str(log.get('status')) if log.get('status') else 'N/A',
                    'purpose': purpose,
                    'patient_id': log.get('patient_id'),
                    'patient_code': log.get('patient_code'),
                    'patient_name': log.get('patient_name'),
                    'patient_display': log.get('patient_display') or 'N/A',
                    'patient_date_of_birth': log.get('patient_date_of_birth'),
                    'patient_gender': log.get('patient_gender'),
                    'patient_phone': log.get('patient_phone'),
                    'patient_email': log.get('patient_email'),
                    'patient_address': log.get('patient_address') or '',
                    'changed_fields': log.get('changed_fields'),
                    'details': log.get('details'),
                    'uri': log.get('uri'),
                    'ip_address': log.get('ip_address'),
                    'user_agent': log.get('user_agent'),
                    'log_type': log.get('log_type') or 'EMR_ACCESS_LOG',
                    'record_type': log.get('record_type'),
                    'encounter_id': log.get('encounter_id'),
                    'visit_id': log.get('visit_id'),
                    'request_body': log.get('request_body'),  # Include for frontend processing
                    'response_body': log.get('response_body')  # Include for frontend processing
                }
                formatted_logs.append(formatted_log)
            
            return formatted_logs, total
            
        finally:
            cursor.close()
            conn.close()
    
    def _format_action(self, log: Dict[str, Any]) -> str:
        """Format action to Vietnamese based on URI and operation"""
        uri = log.get('uri', '') or ''
        operation = log.get('operation', '')
        action = log.get('action', '') or ''
        patient_code = log.get('patient_code')
        patient_name = log.get('patient_name')
        patient_display = log.get('patient_display', '') or ''
        status = str(log.get('status')) if log.get('status') is not None else ''
        log_type = (log.get('log_type') or '').upper()
        
        # Build patient suffix
        patient_suffix = ''
        if patient_code and patient_name:
            patient_suffix = f' - {patient_code} - {patient_name}'
        elif patient_code:
            patient_suffix = f' - {patient_code}'
        elif patient_display and patient_display != 'N/A':
            patient_suffix = f' - {patient_display}'
        
        # Map operations
        operation_map = {
            'view': 'Xem',
            'create': 'Tạo',
            'update': 'Cập nhật',
            'delete': 'Xóa',
            'print': 'In',
            'export': 'Xuất',
            'share': 'Chia sẻ'
        }
        operation_vn = operation_map.get(operation, '')
        
        # Map URI patterns to Vietnamese actions
        uri_lower = uri.lower()
        action_lower = action.lower()
        
        # Session/login logs
        if (
            log_type == 'SESSION_LOG'
            or 'login' in uri_lower
            or 'auth' in uri_lower
            or 'login' in action_lower
            or log.get('purpose') == 'authentication'
        ):
            outcome = 'thành công' if status.startswith('2') else 'thất bại'
            return f'Đăng nhập {outcome}'
        
        if '/appointments' in uri_lower or 'appointment' in uri_lower:
            if operation == 'view':
                return f'Xem lịch hẹn{patient_suffix}'
            elif operation == 'create':
                return f'Tạo lịch hẹn{patient_suffix}'
            elif operation == 'update':
                return f'Cập nhật lịch hẹn{patient_suffix}'
            else:
                return f'Quản lý lịch hẹn{patient_suffix}'
        
        elif '/patients' in uri_lower or 'patient' in uri_lower:
            if operation == 'view':
                return f'Xem thông tin bệnh nhân{patient_suffix}'
            elif operation == 'create':
                return f'Tạo người dùng{patient_suffix}' if 'user' in uri_lower else f'Thêm bệnh nhân mới{patient_suffix}'
            elif operation == 'update':
                return f'Cập nhật thông tin bệnh nhân{patient_suffix}'
            else:
                return f'Quản lý bệnh nhân{patient_suffix}'
        
        elif '/encounters' in uri_lower or 'encounter' in uri_lower or 'visit' in uri_lower:
            if operation == 'view':
                return f'Xem nội dung khám bệnh{patient_suffix}'
            elif operation == 'create':
                return f'Tạo phiếu khám{patient_suffix}'
            elif operation == 'update':
                return f'Cập nhật phiếu khám{patient_suffix}'
            else:
                return f'Quản lý phiếu khám{patient_suffix}'
        
        # Handle /medical-records POST (prescription creation from gateway)
        elif '/medical-records' in uri_lower:
            method = log.get('method', '').upper()
            # Try to get patient info from request_body if not already available
            if not patient_suffix:
                import json
                request_body = log.get('request_body', '') or ''
                try:
                    if request_body and isinstance(request_body, str):
                        body_data = json.loads(request_body)
                        p_name = body_data.get('patient_name', '')
                        p_code = body_data.get('patient_code', '')
                        if p_code and p_name:
                            patient_suffix = f' - {p_code} - {p_name}'
                        elif p_name:
                            patient_suffix = f' - {p_name}'
                except:
                    pass
            
            if method == 'POST':
                return f'Tạo đơn thuốc{patient_suffix}'
            elif method == 'GET':
                return f'Xem nội dung thuốc{patient_suffix}'
            elif method in ('PUT', 'PATCH'):
                return f'Cập nhật đơn thuốc{patient_suffix}'
            else:
                return f'Quản lý đơn thuốc{patient_suffix}'
        
        elif '/prescriptions' in uri_lower or 'prescription' in uri_lower or 'medication' in uri_lower:
            if operation == 'view':
                return f'Xem nội dung thuốc{patient_suffix}'
            elif operation == 'create':
                return f'Tạo đơn thuốc{patient_suffix}'
            elif operation == 'update':
                return f'Cập nhật đơn thuốc{patient_suffix}'
            else:
                return f'Quản lý đơn thuốc{patient_suffix}'
        
        elif '/waiting' in uri_lower or 'queue' in uri_lower:
            return f'Quản lý hàng chờ{patient_suffix}'
        
        elif '/config' in uri_lower or 'setting' in uri_lower:
            return f'Xem cấu hình{patient_suffix}'
        
        # Fallback: Use operation + original action
        if operation_vn and action:
            # Try to extract meaningful part from action
            if 'http' in action.lower():
                return f'{operation_vn} {uri.split("?")[0].split("/")[-1]}{patient_suffix}'
            return f'{operation_vn} {action}{patient_suffix}'
        
        return action or 'N/A'
    
    def _format_purpose(self, log: Dict[str, Any]) -> str:
        """Format purpose to Vietnamese"""
        purpose = log.get('purpose', '') or ''
        uri = log.get('uri', '') or ''
        patient_code = log.get('patient_code')
        patient_name = log.get('patient_name')
        
        patient_suffix = ''
        if patient_code and patient_name:
            patient_suffix = f' - {patient_code} - {patient_name}'
        elif patient_code:
            patient_suffix = f' - {patient_code}'
        
        # Special handling for /medical-records - always show as "Nội dung thuốc"
        uri_lower = uri.lower()
        if '/medical-records' in uri_lower:
            # Try to get patient info from request_body if not already available
            if not patient_suffix:
                import json
                request_body = log.get('request_body', '') or ''
                try:
                    if request_body and isinstance(request_body, str):
                        body_data = json.loads(request_body)
                        p_name = body_data.get('patient_name', '')
                        p_code = body_data.get('patient_code', '')
                        if p_code and p_name:
                            patient_suffix = f' - {p_code} - {p_name}'
                        elif p_name:
                            patient_suffix = f' - {p_name}'
                except:
                    pass
            return f'Nội dung thuốc{patient_suffix}'
        
        purpose_map = {
            'appointment': 'Quản lý lịch hẹn',
            'patient': 'Quản lý bệnh nhân',
            'encounter': 'Nội dung khám bệnh',
            'visit': 'Nội dung khám bệnh',
            'prescription': 'Nội dung thuốc',
            'medication': 'Nội dung thuốc',
            'login': 'Xác thực người dùng',
            'auth': 'Xác thực người dùng',
            'waiting': 'Quản lý hàng chờ',
            'queue': 'Quản lý hàng chờ',
            'config': 'Cấu hình hệ thống',
            'setting': 'Cấu hình hệ thống',
            'registration': 'Đăng ký bệnh nhân',
            'record': 'Quản lý hồ sơ',
            'emr': 'Quản lý hồ sơ bệnh án',
            'treatment': 'Điều trị'
        }
        
        purpose_vn = purpose_map.get(purpose.lower(), purpose)
        
        # Add patient info if available
        if patient_suffix and purpose_vn:
            return f'{purpose_vn}{patient_suffix}'
        
        return purpose_vn or 'Không xác định'
    
    def get_stats(self, hours: int = 24) -> Dict[str, Any]:
        """Get dashboard statistics from access_logs"""
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Total logs from access_logs
            cursor.execute(f"""
                SELECT COUNT(*) as total FROM access_logs 
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL {hours} HOUR)
            """)
            total_logs = cursor.fetchone()['total']
            
            # Successful requests (status 200-299)
            cursor.execute(f"""
                SELECT COUNT(*) as total FROM access_logs 
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL {hours} HOUR)
                AND status >= 200 AND status < 300
            """)
            successful = cursor.fetchone()['total']
            
            # Denied requests (status 400-499, 403, 401)
            cursor.execute(f"""
                SELECT COUNT(*) as total FROM access_logs 
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL {hours} HOUR)
                AND (status >= 400 AND status < 500 OR status = 403 OR status = 401)
            """)
            denied = cursor.fetchone()['total']
            
            # Active users
            cursor.execute(f"""
                SELECT COUNT(DISTINCT user_id) as total FROM access_logs 
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL {hours} HOUR)
            """)
            active_users = cursor.fetchone()['total']
            
            return {
                "total_logs": total_logs or 0,
                "successful_requests": successful or 0,
                "denied_requests": denied or 0,
                "active_users": active_users or 0,
                "hours": hours
            }
        finally:
            cursor.close()
            conn.close()


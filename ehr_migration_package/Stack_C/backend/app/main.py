from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os
import tempfile
import logging
from .law_rules import LawRuleRepository
from .ai.document_parser import DocumentParser
from .ai.multi_model_extractor import MultiModelExtractor
from .models import LawRulesSearchResponse, DocumentImportResponse, LawRuleResponse
from .security_monitor import SecurityMonitor
from .behavior_monitor import BehaviorMonitor
from .user_service import UserService
from .keycloak_collector import KeycloakEventCollector
from .tls_collector import TLSCollector
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import atexit

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize scheduler for automatic log collection
scheduler = BackgroundScheduler()

def collect_keycloak_events_job():
    """Background job to collect Keycloak events periodically"""
    try:
        collector = KeycloakEventCollector()
        result = collector.collect_and_process()
        logger.info(f"Scheduled Keycloak collection: {result.get('events_inserted', 0)} events inserted")
    except Exception as e:
        logger.error(f"Scheduled Keycloak collection error: {e}")

# Schedule Keycloak collection every 60 seconds
scheduler.add_job(
    func=collect_keycloak_events_job,
    trigger=IntervalTrigger(seconds=60),
    id='keycloak_collector',
    name='Collect Keycloak Events',
    replace_existing=True
)

def collect_tls_status_job():
    """Background job to collect TLS/service status periodically"""
    try:
        collector = TLSCollector()
        result = collector.collect_and_process()
        logger.info(f"Scheduled TLS collection: {result.get('logs_inserted', 0)} logs inserted")
    except Exception as e:
        logger.error(f"Scheduled TLS collection error: {e}")

# Schedule TLS status collection every 5 minutes
scheduler.add_job(
    func=collect_tls_status_job,
    trigger=IntervalTrigger(seconds=300),
    id='tls_collector',
    name='Collect TLS Status',
    replace_existing=True
)

# Start scheduler
scheduler.start()
logger.info("APScheduler started - Keycloak (60s), TLS (300s) collectors running")

# Shut down the scheduler when exiting the app
atexit.register(lambda: scheduler.shutdown())

app = FastAPI(title="SIEM Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3002,http://localhost:3001").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/my-activity")
async def get_my_activity(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100)
):
    """Get activity logs for logged-in patient"""
    try:
        # Get patient ID from request headers (should be set by gateway)
        # For now, return empty data - should query access_logs filtered by patient
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
        logger.error(f"Error getting my activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/law-rules")
async def search_law_rules(
    keyword: Optional[str] = Query(None),
    law_source: Optional[str] = Query(None),
    functional_group: Optional[str] = Query(None),
    allowed_status: Optional[str] = Query(None),
    rule_scope: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    include_meta: bool = Query(False)
):
    """Search law rules"""
    repo = LawRuleRepository()
    filters = {
        'keyword': keyword,
        'law_source': law_source,
        'functional_group': functional_group,
        'allowed_status': allowed_status,
        'rule_scope': rule_scope
    }
    rules, total = repo.search_rules(filters, page, page_size)
    result = {
        'rules': rules,
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size
    }
    if include_meta:
        result['meta'] = repo.get_meta()
    return result

@app.post("/api/law-rules/import-document", response_model=DocumentImportResponse)
async def import_document(file: UploadFile = File(...)):
    """Import law document and extract rules using AI"""
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            # Parse document
            parser = DocumentParser()
            doc_data = await parser.parse_file(tmp_path)
            text = doc_data['text']
            
            if not text or len(text.strip()) < 100:
                raise HTTPException(status_code=400, detail="Document quá ngắn hoặc không có nội dung")
            
            # Extract rules using AI
            extractor = MultiModelExtractor()
            result = await extractor.extract(text)
            
            # Save rules to database
            repo = LawRuleRepository()
            created = 0
            skipped = 0
            
            for rule in result['rules']:
                try:
                    repo.create_rule(rule)
                    created += 1
                except ValueError as e:
                    # Duplicate rule code
                    logger.warning(f"Skipped duplicate rule: {e}")
                    skipped += 1
                except Exception as e:
                    logger.error(f"Error creating rule: {e}")
                    skipped += 1
            
            return {
                'success': True,
                'message': f'Đã tạo {created} quy tắc từ văn bản',
                'rules_created': created,
                'rules_skipped': skipped,
                'confidence': result['confidence'],
                'needs_review': result['needs_review'],
                'invalid_rules': result['validation']['invalid_rules'] if result['validation']['invalid_count'] > 0 else None
            }
            
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                
    except Exception as e:
        logger.error(f"Import error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/law-rules", response_model=LawRuleResponse)
async def create_rule(rule: LawRuleResponse):
    """Create a new rule manually"""
    repo = LawRuleRepository()
    try:
        return repo.create_rule(rule.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# Dashboard & Stats Endpoints
# ============================================

@app.get("/api/stats")
async def get_stats(hours: int = Query(24, ge=1, le=168)):
    """Get dashboard statistics"""
    try:
        monitor = SecurityMonitor()
        return monitor.get_stats(hours)
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return {
            "total_logs": 0,
            "successful_requests": 0,
            "denied_requests": 0,
            "active_users": 0,
            "hours": hours
        }

@app.get("/api/chart")
async def get_chart_data(hours: int = Query(24, ge=1, le=168)):
    """Get chart data for dashboard"""
    return {
        "labels": [],
        "datasets": []
    }

# ============================================
# Security Monitoring Endpoints
# ============================================

@app.get("/api/security-monitoring")
async def get_security_monitoring(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    log_type: Optional[str] = Query(None),
    since_seconds: int = Query(86400, ge=30, le=604800),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None)
):
    """Get security monitoring logs"""
    try:
        monitor = SecurityMonitor()
        logs, total = monitor.get_security_logs(
            page, page_size, log_type, 
            since_seconds=since_seconds,
            date_from=from_date,
            date_to=to_date
        )
        return {
            "logs": logs,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    except Exception as e:
        logger.error(f"Error getting security logs: {e}")
        return {
            "logs": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0
        }

@app.get("/api/behavior-monitoring/summary-by-user")
async def get_behavior_summary_by_user(
    since_hours: int = Query(48, ge=1, le=168),
    since_seconds: Optional[int] = Query(300, ge=30, le=86400),
    from_date: Optional[str] = Query(None),  # YYYY-MM-DD format
    to_date: Optional[str] = Query(None)     # YYYY-MM-DD format
):
    """Get behavior monitoring summary grouped by user"""
    try:
        monitor = BehaviorMonitor()
        rules = monitor._get_behavior_rules()
        
        # Use date range if provided, otherwise fall back to since_hours/since_seconds
        if from_date and to_date:
            logs = monitor._fetch_recent_logs(from_date=from_date, to_date=to_date, limit=10000)
        else:
            logs = monitor._fetch_recent_logs(since_hours=since_hours, since_seconds=since_seconds, limit=10000)
        
        # Group by user
        user_stats = {}
        for log in logs:
            user = log.get('actor_name') or log.get('user_id') or 'Unknown'
            if user not in user_stats:
                user_stats[user] = {
                    'user': user,
                    'role': log.get('role', 'Unknown'),
                    'violations': 0,
                    'compliant': 0,
                    'high_risk': 0,
                    'medium_risk': 0,
                    'low_risk': 0,
                    'total_logs': 0
                }
            
            user_stats[user]['total_logs'] += 1
            violations, compliant_records = monitor._evaluate_log(log, rules)
            
            if violations:
                user_stats[user]['violations'] += len(violations)
                for v in violations:
                    severity = (v.get('severity') or '').lower()
                    if severity == 'high':
                        user_stats[user]['high_risk'] += 1
                    elif severity == 'medium':
                        user_stats[user]['medium_risk'] += 1
                    elif severity == 'low':
                        user_stats[user]['low_risk'] += 1
            if compliant_records:
                user_stats[user]['compliant'] += len(compliant_records)
        
        # Convert to list and sort by violations (descending)
        result = list(user_stats.values())
        result.sort(key=lambda x: x['violations'], reverse=True)
        
        return {
            'users': result,
            'total_users': len(result),
            'since_hours': since_hours,
            'since_seconds': since_seconds
        }
    except Exception as e:
        logger.error(f"Error getting behavior summary by user: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Unable to load user summary: {str(e)}")

@app.get("/api/behavior-monitoring")
async def get_behavior_monitoring(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    since_hours: int = Query(48, ge=1, le=168),
    severity: Optional[str] = Query(None),
    rule_code: Optional[str] = Query(None),
    status: str = Query('all'),
    user_id: Optional[str] = Query(None),
    since_seconds: Optional[int] = Query(300, ge=30, le=86400),
    compliance_type: Optional[str] = Query(None),  # 'user' or 'system'
    from_date: Optional[str] = Query(None),  # YYYY-MM-DD
    to_date: Optional[str] = Query(None)     # YYYY-MM-DD
):
    """Compare user actions with compliance rules to detect violations."""
    try:
        monitor = BehaviorMonitor()
        result = monitor.get_behavior_violations(
            page=page,
            page_size=page_size,
            since_hours=since_hours,
            severity=severity,
            rule_code=rule_code,
            status=status,
            user_id=user_id,
            since_seconds=since_seconds,
            compliance_type=compliance_type,
            from_date=from_date,
            to_date=to_date
        )
        return result
    except Exception as e:
        import traceback
        error_detail = str(e)
        error_traceback = traceback.format_exc()
        logger.error(f"Error getting behavior monitoring data: {error_detail}")
        logger.error(f"Traceback: {error_traceback}")
        raise HTTPException(status_code=500, detail=f"Unable to load behavior monitoring data: {error_detail}")

@app.post("/api/behavior-monitoring/evaluate-log")
async def evaluate_behavior_log(payload: dict):
    """Evaluate a single raw log payload against compliance rules."""
    try:
        if not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="Body must be a JSON object")

        log_payload = payload.get('log') if 'log' in payload else payload
        rule_code = payload.get('rule_code')

        if not isinstance(log_payload, dict):
            raise HTTPException(status_code=400, detail="Thiếu dữ liệu log để so sánh")

        monitor = BehaviorMonitor()
        result = monitor.evaluate_log_payload(log_payload, rule_code=rule_code)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error evaluating log payload: {e}")
        raise HTTPException(status_code=500, detail="Không thể so sánh log với quy tắc")

@app.get("/api/logs")
async def get_logs(params: dict = {}):
    """Get general logs"""
    return {
        "logs": [],
        "total": 0
    }

@app.get("/api/denied")
async def get_denied_logs(params: dict = {}):
    """Get denied access logs"""
    return {
        "logs": [],
        "total": 0
    }

@app.get("/api/anomalies")
async def get_anomalies(params: dict = {}):
    """Get security anomalies"""
    return {
        "anomalies": [],
        "total": 0
    }

# ============================================
# Watchdog Alerts Endpoints (Log Tampering Detection)
# ============================================

@app.get("/api/watchdog-alerts")
async def get_watchdog_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    acknowledged: Optional[bool] = Query(None)
):
    """Get watchdog alerts for log tampering detection"""
    try:
        import mysql.connector
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'mariadb'),
            database=os.getenv('DB_NAME', 'ehr_core'),
            user='root',
            password=os.getenv('MARIADB_ROOT_PASSWORD', 'emrdbpass')
        )
        cursor = conn.cursor(dictionary=True)
        
        # Build query
        where_clause = ""
        if acknowledged is not None:
            where_clause = f"WHERE acknowledged = {1 if acknowledged else 0}"
        
        # Get total count
        cursor.execute(f"SELECT COUNT(*) as total FROM watchdog_alerts {where_clause}")
        total = cursor.fetchone()['total']
        
        # Get alerts with pagination
        offset = (page - 1) * page_size
        cursor.execute(f"""
            SELECT id, alert_type, message, detected_at, status, 
                   acknowledged, acknowledged_by, acknowledged_at, ip_address
            FROM watchdog_alerts 
            {where_clause}
            ORDER BY detected_at DESC
            LIMIT {page_size} OFFSET {offset}
        """)
        alerts = cursor.fetchall()
        
        # Convert datetime to string
        for alert in alerts:
            if alert.get('detected_at'):
                alert['detected_at'] = alert['detected_at'].strftime('%Y-%m-%d %H:%M:%S')
            if alert.get('acknowledged_at'):
                alert['acknowledged_at'] = alert['acknowledged_at'].strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        conn.close()
        
        return {
            "alerts": alerts,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
            "unacknowledged_count": sum(1 for a in alerts if not a.get('acknowledged'))
        }
    except Exception as e:
        logger.error(f"Error getting watchdog alerts: {e}")
        return {
            "alerts": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0,
            "unacknowledged_count": 0,
            "error": str(e)
        }

@app.post("/api/watchdog-alerts/{alert_id}/acknowledge")
async def acknowledge_watchdog_alert(alert_id: int, data: dict = {}):
    """Acknowledge a watchdog alert"""
    try:
        import mysql.connector
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'mariadb'),
            database=os.getenv('DB_NAME', 'ehr_core'),
            user='root',
            password=os.getenv('MARIADB_ROOT_PASSWORD', 'emrdbpass')
        )
        cursor = conn.cursor()
        
        acknowledged_by = data.get('acknowledged_by', 'admin')
        cursor.execute("""
            UPDATE watchdog_alerts 
            SET acknowledged = TRUE, acknowledged_by = %s, acknowledged_at = NOW()
            WHERE id = %s
        """, (acknowledged_by, alert_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "message": "Alert acknowledged"}
    except Exception as e:
        logger.error(f"Error acknowledging alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/watchdog-alerts/count")
async def get_watchdog_alerts_count():
    """Get count of unacknowledged watchdog alerts"""
    try:
        import mysql.connector
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'mariadb'),
            database=os.getenv('DB_NAME', 'ehr_core'),
            user='root',
            password=os.getenv('MARIADB_ROOT_PASSWORD', 'emrdbpass')
        )
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT COUNT(*) as count FROM watchdog_alerts WHERE acknowledged = FALSE")
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return {"unacknowledged": result['count']}
    except Exception as e:
        logger.error(f"Error getting alerts count: {e}")
        return {"unacknowledged": 0}

# ============================================
# MySQL General Log Endpoints (SQL Query Monitoring)
# ============================================

@app.get("/api/mysql-logs")
async def get_mysql_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    filter_type: Optional[str] = Query(None),  # suspicious, all
    search: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),  # YYYY-MM-DD
    to_date: Optional[str] = Query(None)     # YYYY-MM-DD
):
    """Get MySQL general_log entries to monitor SQL queries"""
    try:
        import mysql.connector
        import re
        from datetime import datetime, timedelta
        
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'mariadb'),
            database='mysql',
            user='root',
            password=os.getenv('MARIADB_ROOT_PASSWORD', 'emrdbpass')
        )
        cursor = conn.cursor(dictionary=True)
        
        # Check if general_log is enabled
        cursor.execute("SELECT @@general_log as status, @@log_output as output")
        log_config = cursor.fetchone()
        log_status = log_config['status'] == 1
        log_output = log_config['output']
        
        logs = []
        suspicious_keywords = ['DELETE', 'DROP', 'TRUNCATE', 'general_log']
        
        # If log_output includes TABLE, read from mysql.general_log table
        if 'TABLE' in log_output.upper():
            # Build date filter
            date_conditions = []
            params = []
            
            if from_date:
                date_conditions.append("event_time >= %s")
                params.append(f"{from_date} 00:00:00")
            if to_date:
                date_conditions.append("event_time <= %s")
                params.append(f"{to_date} 23:59:59")
            
            # If no date specified, default to last 24 hours
            if not date_conditions:
                date_conditions.append("event_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)")
            
            where_clause = " AND ".join(["command_type = 'Query'"] + date_conditions)
            
            # Calculate offset for pagination
            offset = (page - 1) * page_size
            
            # Build query with date filter and pagination
            query = f"""
                SELECT event_time, user_host, thread_id, server_id, command_type, argument
                FROM mysql.general_log
                WHERE {where_clause}
                ORDER BY event_time DESC
                LIMIT %s OFFSET %s
            """
            params.extend([page_size, offset])
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            
            for row in rows:
                query_text = row['argument'] if row['argument'] else ''
                if isinstance(query_text, bytes):
                    query_text = query_text.decode('utf-8', errors='ignore')
                
                user_host = row['user_host'] if row['user_host'] else ''
                
                # Skip SIEM system auto-queries (connection setup & SIEM internal queries)
                query_upper = query_text.upper().strip()
                
                # These are MySQL connection setup commands (auto by driver)
                connection_setup_patterns = [
                    'SET AUTOCOMMIT',
                    'SET NAMES',
                    'SET CHARACTER_SET',
                    'SET @@',
                    'SET SESSION',
                    'COMMIT',
                    'ROLLBACK',
                ]
                
                # These are SIEM internal queries (reading its own data)
                siem_internal_patterns = [
                    'SELECT @@GENERAL_LOG',
                    'SELECT @@LOG_OUTPUT', 
                    'FROM MYSQL.GENERAL_LOG',
                    'FROM WATCHDOG_ALERTS',
                    'SHOW VARIABLES LIKE',
                    'SHOW COLLATION',
                    'SHOW WARNINGS',
                    # SIEM Dashboard statistics queries
                    'SELECT COUNT(DISTINCT USER_ID)',
                    'SELECT COUNT(*) AS TOTAL FROM ACCESS_LOGS WHERE TIMESTAMP',
                    'DATE_SUB(NOW(), INTERVAL',
                    'FROM ACCESS_LOGS WHERE TIMESTAMP >=',
                    # Watchdog PROCESSLIST checks
                    'FROM INFORMATION_SCHEMA.PROCESSLIST',
                    'INFORMATION_SCHEMA.PROCESSLIST',
                    # SIEM access_logs monitoring
                    'SELECT ID FROM ACCESS_LOGS WHERE',
                    'FROM ACCESS_LOGS WHERE ACTOR_NAME',
                    'ACTOR_NAME = \'DD.HA\'',
                    # Keycloak collector
                    'SELECT DISTINCT USER_ID AS USERNAME',
                    'SELECT MAX(TIMESTAMP) AS LAST_LOGIN',
                    # General SIEM queries
                    'SELECT COUNT(*) FROM ACCESS_LOGS',
                    'SELECT ID, TIMESTAMP, USER_ID',
                    'LIMIT 1000',
                    'ORDER BY TIMESTAMP DESC LIMIT',
                ]
                
                is_connection_setup = any(pattern in query_upper for pattern in connection_setup_patterns)
                is_siem_internal = any(pattern in query_upper for pattern in siem_internal_patterns)
                
                if is_connection_setup or is_siem_internal:
                    continue  # Skip this query
                
                # Extract IP from user_host 
                # MariaDB format: "root[root] @ [172.18.0.2]" or "root[root] @ localhost []"
                user_host_str = row['user_host'] if row['user_host'] else ''
                ip_address = ''
                username = user_host_str
                
                # Parse format: user[user] @ hostname [IP] or user[user] @ [IP]
                import re as regex
                
                # Extract username (before @)
                if '@' in user_host_str:
                    username = user_host_str.split('@')[0].strip()
                    # Remove [user] part from username
                    if '[' in username:
                        username = username.split('[')[0].strip()
                
                # Extract IP from brackets at end: [172.18.0.2]
                ip_match = regex.search(r'\[(\d+\.\d+\.\d+\.\d+)\]', user_host_str)
                if ip_match:
                    ip_address = ip_match.group(1)
                elif 'localhost' in user_host_str.lower():
                    ip_address = '127.0.0.1'
                
                entry = {
                    'timestamp': row['event_time'].strftime('%Y-%m-%d %H:%M:%S') if row['event_time'] else '',
                    'user': username,
                    'user_host': user_host_str,
                    'ip_address': ip_address,
                    'query': query_text,
                    'is_suspicious': False,
                    'query_type': 'OTHER'
                }
                
                # Determine query type
                if query_upper.startswith('SELECT'):
                    entry['query_type'] = 'SELECT'
                elif query_upper.startswith('INSERT'):
                    entry['query_type'] = 'INSERT'
                elif query_upper.startswith('UPDATE'):
                    entry['query_type'] = 'UPDATE'
                elif query_upper.startswith('DELETE'):
                    entry['query_type'] = 'DELETE'
                    entry['is_suspicious'] = True
                elif query_upper.startswith('SET'):
                    entry['query_type'] = 'SET'
                    # Only suspicious if trying to disable general_log
                    if 'general_log' in query_text.lower() and ('off' in query_text.lower() or "= 0" in query_text or "='off'" in query_text.lower()):
                        entry['is_suspicious'] = True
                elif query_upper.startswith('DROP'):
                    entry['query_type'] = 'DROP'
                    entry['is_suspicious'] = True
                elif query_upper.startswith('TRUNCATE'):
                    entry['query_type'] = 'TRUNCATE'
                    entry['is_suspicious'] = True
                elif query_upper.startswith('SHOW'):
                    entry['query_type'] = 'SHOW'
                
                # Check for suspicious patterns (only truly dangerous ones)
                dangerous_patterns = ['DELETE FROM', 'DROP TABLE', 'DROP DATABASE', 'TRUNCATE TABLE']
                for pattern in dangerous_patterns:
                    if re.search(pattern, query_text, re.IGNORECASE):
                        entry['is_suspicious'] = True
                        break
                
                logs.append(entry)
        else:
            # log_output is FILE - cannot read directly from container
            # Return message that log is file-based
            cursor.close()
            conn.close()
            return {
                "logs": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "total_pages": 0,
                "suspicious_count": 0,
                "general_log_enabled": log_status,
                "log_output": log_output,
                "message": "Log output is FILE mode. Enable TABLE mode with: SET GLOBAL log_output = 'TABLE';"
            }
        
        cursor.close()
        conn.close()
        
        # Filter by type
        if filter_type == 'suspicious':
            logs = [l for l in logs if l.get('is_suspicious')]
        
        # Filter by search
        if search:
            logs = [l for l in logs if search.lower() in l.get('query', '').lower()]
        
        # Pagination
        total = len(logs)
        start = (page - 1) * page_size
        end = start + page_size
        paginated_logs = logs[start:end]
        
        return {
            "logs": paginated_logs,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
            "suspicious_count": sum(1 for l in logs if l.get('is_suspicious')),
            "general_log_enabled": log_status,
            "log_output": log_output
        }
    except Exception as e:
        logger.error(f"Error getting MySQL logs: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {
            "logs": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0,
            "error": str(e)
        }

# ============================================
# IP Blacklist Endpoints (Auto-Block)
# ============================================

@app.get("/api/blocked-ips")
async def get_blocked_ips():
    """Get list of blocked IPs"""
    try:
        import mysql.connector
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'mariadb'),
            database=os.getenv('DB_NAME', 'ehr_core'),
            user='root',
            password=os.getenv('MARIADB_ROOT_PASSWORD', 'emrdbpass')
        )
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, ip_address, reason, violation_count, blocked_at, expires_at, is_active
            FROM ip_blacklist
            WHERE is_active = TRUE
            ORDER BY blocked_at DESC
        """)
        ips = cursor.fetchall()
        
        for ip in ips:
            if ip.get('blocked_at'):
                ip['blocked_at'] = ip['blocked_at'].strftime('%Y-%m-%d %H:%M:%S')
            if ip.get('expires_at'):
                ip['expires_at'] = ip['expires_at'].strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        conn.close()
        
        return {"blocked_ips": ips, "total": len(ips)}
    except Exception as e:
        logger.error(f"Error getting blocked IPs: {e}")
        return {"blocked_ips": [], "total": 0, "error": str(e)}

@app.post("/api/blocked-ips/add")
async def add_blocked_ip(data: dict):
    """Add IP to blacklist"""
    try:
        import mysql.connector
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'mariadb'),
            database=os.getenv('DB_NAME', 'ehr_core'),
            user='root',
            password=os.getenv('MARIADB_ROOT_PASSWORD', 'emrdbpass')
        )
        cursor = conn.cursor()
        
        ip = data.get('ip_address')
        reason = data.get('reason', 'Manual block')
        
        cursor.execute("""
            INSERT INTO ip_blacklist (ip_address, reason, violation_count)
            VALUES (%s, %s, 1)
            ON DUPLICATE KEY UPDATE 
                violation_count = violation_count + 1,
                reason = %s,
                is_active = TRUE
        """, (ip, reason, reason))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "message": f"IP {ip} blocked"}
    except Exception as e:
        logger.error(f"Error blocking IP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/blocked-ips/{ip_id}/unblock")
async def unblock_ip(ip_id: int):
    """Unblock an IP"""
    try:
        import mysql.connector
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'mariadb'),
            database=os.getenv('DB_NAME', 'ehr_core'),
            user='root',
            password=os.getenv('MARIADB_ROOT_PASSWORD', 'emrdbpass')
        )
        cursor = conn.cursor()
        
        cursor.execute("UPDATE ip_blacklist SET is_active = FALSE WHERE id = %s", (ip_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "message": "IP unblocked"}
    except Exception as e:
        logger.error(f"Error unblocking IP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/blocked-ips/check-and-block")
async def check_and_block_ip(data: dict):
    """Auto-block IP after N violations (called by WAF)"""
    try:
        import mysql.connector
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'mariadb'),
            database=os.getenv('DB_NAME', 'ehr_core'),
            user='root',
            password=os.getenv('MARIADB_ROOT_PASSWORD', 'emrdbpass')
        )
        cursor = conn.cursor(dictionary=True)
        
        ip = data.get('ip_address')
        reason = data.get('reason', 'Auto-blocked after violations')
        threshold = data.get('threshold', 3)
        
        # Insert or update violation count
        cursor.execute("""
            INSERT INTO ip_blacklist (ip_address, reason, violation_count, is_active)
            VALUES (%s, %s, 1, FALSE)
            ON DUPLICATE KEY UPDATE 
                violation_count = violation_count + 1,
                reason = %s
        """, (ip, reason, reason))
        conn.commit()
        
        # Check if threshold reached
        cursor.execute("SELECT violation_count FROM ip_blacklist WHERE ip_address = %s", (ip,))
        result = cursor.fetchone()
        
        blocked = False
        if result and result['violation_count'] >= threshold:
            cursor.execute("UPDATE ip_blacklist SET is_active = TRUE WHERE ip_address = %s", (ip,))
            conn.commit()
            blocked = True
        
        cursor.close()
        conn.close()
        
        return {
            "ip": ip,
            "violation_count": result['violation_count'] if result else 1,
            "blocked": blocked,
            "threshold": threshold
        }
    except Exception as e:
        logger.error(f"Error checking IP: {e}")
        return {"error": str(e)}

# ============================================
# User Management Endpoints
# ============================================

@app.get("/api/users")
async def get_users():
    """Get all users"""
    try:
        user_service = UserService()
        users = user_service.get_users()
        return users  # Return array directly for frontend compatibility
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        return []

@app.post("/api/users")
async def create_user(user_data: dict):
    """Create a new user"""
    return {"success": True, "message": "User created"}

@app.put("/api/users/{user_id}")
async def update_user(user_id: int, user_data: dict):
    """Update a user"""
    return {"success": True, "message": "User updated"}

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int):
    """Delete a user"""
    return {"success": True, "message": "User deleted"}

@app.put("/api/users/{user_id}/password")
async def change_password(user_id: int, password_data: dict):
    """Change user password"""
    return {"success": True, "message": "Password changed"}

# ============================================
# Patient Activity Endpoints
# ============================================

@app.get("/api/patient-activity")
async def get_patient_activity(params: dict = {}):
    """Get patient activity logs"""
    return {
        "activities": [],
        "total": 0
    }

@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: str):
    """Get patient information"""
    return {
        "patient_id": patient_id,
        "name": "",
        "data": {}
    }

@app.get("/api/patients")
async def search_patients(patient_code: Optional[str] = Query(None)):
    """Search patients"""
    return {
        "patients": [],
        "total": 0
    }

# ============================================
# Compliance Violations Endpoints
# ============================================

@app.get("/api/compliance/violations")
async def get_compliance_violations(params: dict = {}):
    """Get compliance violations"""
    return {
        "violations": [],
        "total": 0
    }

@app.get("/api/compliance/violations/{violation_id}/rules")
async def get_violation_rules(violation_id: int):
    """Get rules for a violation"""
    return {
        "rules": []
    }

@app.post("/api/compliance/violations/bulk-update")
async def bulk_update_violations(data: dict):
    """Bulk update violations"""
    return {"success": True, "updated": 0}

@app.get("/api/compliance/violations/export")
async def export_violations(format: str = Query("excel"), violation_ids: Optional[str] = Query(None)):
    """Export violations"""
    return {"success": True, "data": []}

@app.post("/api/compliance/violations/auto-map-rules")
async def auto_map_violation_rules(data: Optional[dict] = None):
    """Auto-map rules to violations"""
    return {"success": True, "mapped": 0}

@app.post("/api/compliance/violations/auto-map-all")
async def auto_map_all_violations():
    """Auto-map all violations"""
    return {"success": True, "mapped": 0}

@app.get("/api/compliance/violations/timeline")
async def get_violations_timeline(params: dict = {}):
    """Get violations timeline"""
    return {
        "timeline": []
    }

@app.get("/api/compliance/violations/risk-score")
async def get_violations_risk_score(params: dict = {}):
    """Get violations risk score"""
    return {
        "risk_scores": []
    }

@app.get("/api/compliance/stats")
async def get_compliance_stats_overview():
    """Get compliance statistics overview"""
    return {
        "total_violations": 0,
        "resolved": 0,
        "pending": 0
    }

@app.post("/api/collect-keycloak-events")
async def collect_keycloak_events():
    """Trigger Keycloak event collection - collects login/logout events and detects brute-force"""
    try:
        collector = KeycloakEventCollector()
        result = collector.collect_and_process()
        return {
            "status": "success",
            "message": "Keycloak events collected successfully",
            "data": result
        }
    except Exception as e:
        import traceback
        logger.error(f"Error collecting Keycloak events: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to collect Keycloak events: {str(e)}")

@app.get("/api/collect-keycloak-events")
async def collect_keycloak_events_get():
    """GET version for easy browser testing"""
    return await collect_keycloak_events()

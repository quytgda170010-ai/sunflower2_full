import os
import json
import logging
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import mysql.connector

from .security_monitor import SecurityMonitor

logger = logging.getLogger(__name__)


class BehaviorMonitor:
    """Evaluate user behavior logs against law/compliance rules."""

    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'mariadb'),
            'user': os.getenv('DB_USER', 'openemr'),
            'password': os.getenv('DB_PASS', 'Openemr!123'),
            'database': os.getenv('DB_NAME', 'ehr_core'),
            'charset': 'utf8mb4',
            'connection_timeout': 30  # Increased timeout for large queries
        }
        self.security_monitor = SecurityMonitor()
    
    def _map_uuid_to_username(self, user_id: str, role: str) -> tuple:
        """
        Map UUID sang username và role thực tế từ Keycloak DB
        Returns: (username, role)
        """
        if not user_id or len(user_id) != 36 or user_id.count('-') != 4:
            return (user_id, role)  # Không phải UUID format
        
        if role != 'system':
            return (user_id, role)  # Không phải system role, không cần map
        
        try:
            from app.main import _get_user_info_from_keycloak
            user_info = _get_user_info_from_keycloak(user_id)
            if user_info:
                username = user_info.get('username', user_id)
                actual_role = user_info.get('actor_role', role)
                return (username, actual_role)
        except Exception as e:
            logger.debug(f"Không thể map UUID {user_id} sang username: {e}")
        
        return (user_id, role)  # Fallback: giữ nguyên

    def _get_connection(self):
        return mysql.connector.connect(**self.db_config)

    def _parse_json(self, value: Any):
        if value is None:
            return None
        if isinstance(value, (dict, list)):
            return value
        if isinstance(value, (bytes, bytearray)):
            value = value.decode('utf-8', errors='ignore')
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
            try:
                return json.loads(value)
            except Exception:
                return None
        return None

    def _is_patient_specific_uri(self, uri: Optional[str]) -> bool:
        """
        Trả về True nếu URI nhắm vào một bệnh nhân cụ thể
        (có patient_id/patient_code ở query hoặc dạng /patients/{id}).
        Dùng để bỏ qua yêu cầu patient_id cho các request danh sách (/patients?page=...).
        """
        if not uri:
            return False
        try:
            parsed = urlparse(uri)
            query = parse_qs(parsed.query)
            if query.get('patient_id') or query.get('patient_code'):
                return True

            path_parts = [p for p in parsed.path.strip('/').split('/') if p]
            if 'patients' in path_parts:
                idx = path_parts.index('patients')
                if idx + 1 < len(path_parts) and path_parts[idx + 1]:
                    return True
            return False
        except Exception:
            return False

    def _count_recent_failures(self, actor: str, log_time: str, window_minutes: int = 5) -> int:
        """
        Count recent login failures (status 401/403) for this actor within time window.
        Used to detect brute force attacks before account lockout.
        """
        if not actor or not log_time:
            return 0
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) FROM access_logs
                WHERE actor_name = %s
                AND status IN (401, 403)
                AND timestamp > DATE_SUB(%s, INTERVAL %s MINUTE)
                AND timestamp <= %s
            """, (actor, log_time, window_minutes, log_time))
            count = cursor.fetchone()[0]
            cursor.close()
            conn.close()
            return count
        except Exception as e:
            logger.warning(f"Failed to count recent failures for {actor}: {e}")
            return 0

    # Global cache for rules
    _RULES_CACHE = None
    _RULES_CACHE_TIME = 0

    def _get_behavior_rules(self) -> List[Dict[str, Any]]:
        import time
        # Check cache (1 minute TTL is enough for rules)
        if BehaviorMonitor._RULES_CACHE and (time.time() - BehaviorMonitor._RULES_CACHE_TIME < 60):
            return BehaviorMonitor._RULES_CACHE

        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # IMPORTANT: Database has 'required_log_fields' (new) and 'log_fields' (old)
            # We prioritize the NEW schema with required_log_fields
            try:
                # Try new schema first (with required_log_fields)
                cursor.execute("""
                    SELECT id, law_source, rule_code, rule_name, allowed_status,
                           legal_basis,
                           explanation, 
                           COALESCE(required_log_fields, log_fields) as log_fields_data,
                           functional_group,
                           penalty_level, law_url
                    FROM siem_law_rules
                    WHERE (required_log_fields IS NOT NULL AND JSON_LENGTH(required_log_fields) > 0)
                       OR (log_fields IS NOT NULL AND JSON_LENGTH(log_fields) > 0)
                """)
                rows = cursor.fetchall()
            except Exception as e1:
                # Fallback to old schema if required_log_fields column doesn't exist
                logger.warning(f"New schema query failed: {e1}, trying legacy query...")
                try:
                    cursor.execute("""
                        SELECT id, law_source, rule_code, rule_name, allowed_status,
                               legal_basis,
                               explanation, 
                               log_fields as log_fields_data,
                               functional_group,
                               penalty_level, law_url
                        FROM siem_law_rules
                        WHERE log_fields IS NOT NULL AND JSON_LENGTH(log_fields) > 0
                    """)
                    rows = cursor.fetchall()
                except Exception as e2:
                    logger.error(f"Both query attempts failed: {e1}, {e2}")
                    return []
            rules = []
            for row in rows:
                try:
                    # Support both column names: 'required_log_fields' (new) and 'log_fields' (old)
                    payload = row.get('log_fields_data') or row.get('required_log_fields') or row.get('log_fields') or '[]'
                    if isinstance(payload, str):
                        row['required_log_fields'] = json.loads(payload)
                    elif isinstance(payload, list):
                        row['required_log_fields'] = payload
                    else:
                        row['required_log_fields'] = []
                except Exception as e:
                    logger.warning(f"Error parsing log_fields for rule {row.get('rule_code')}: {e}")
                    row['required_log_fields'] = []
                
                try:
                    tags_payload = row.get('tags') or '[]'
                    if isinstance(tags_payload, str):
                        row['tags'] = json.loads(tags_payload)
                    elif isinstance(tags_payload, list):
                        row['tags'] = tags_payload
                    else:
                        row['tags'] = []
                except Exception:
                    row['tags'] = []
                
                # Ensure legal_basis is set (support both column names)
                if not row.get('legal_basis'):
                    row['legal_basis'] = row.get('legal_refs', '')
                
                rules.append(row)
            
            # Update cache
            import time
            BehaviorMonitor._RULES_CACHE = rules
            BehaviorMonitor._RULES_CACHE_TIME = time.time()
            
            logger.info(f"[RULES_DEBUG] Fetched {len(rules)} rules from DB")
            return rules
        finally:
            cursor.close()
            conn.close()

    def _fetch_recent_logs(self, since_hours: int = 48, since_seconds: Optional[int] = None, limit: int = 5000, from_date: Optional[str] = None, to_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch recent logs from access_logs table.
        Reduced limit to 5000 for better performance (can be adjusted via since_hours).
        Supports date range filtering via from_date and to_date (YYYY-MM-DD format).
        """
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # Priority: from_date/to_date > since_seconds > since_hours
            if from_date and to_date:
                # Use date range (from_date 00:00:00 to to_date 23:59:59)
                from_ts = datetime.strptime(from_date, '%Y-%m-%d').replace(hour=0, minute=0, second=0)
                to_ts = datetime.strptime(to_date, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
                cursor.execute("""
                    SELECT id, timestamp, user_id, actor_name, role, action, operation,
                           method, status, purpose, patient_id, patient_code, patient_name,
                           changed_fields, details, request_body, response_body,
                           uri, ip_address, user_agent, log_type
                    FROM access_logs
                    WHERE timestamp >= %s AND timestamp <= %s
                    ORDER BY timestamp DESC
                    LIMIT %s
                """, (from_ts, to_ts, limit))
            elif since_seconds:
                since_ts = datetime.utcnow() - timedelta(seconds=since_seconds)
                cursor.execute("""
                    SELECT id, timestamp, user_id, actor_name, role, action, operation,
                           method, status, purpose, patient_id, patient_code, patient_name,
                           changed_fields, details, request_body, response_body,
                           uri, ip_address, user_agent, log_type
                    FROM access_logs
                    WHERE timestamp >= %s
                    ORDER BY timestamp DESC
                    LIMIT %s
                """, (since_ts, limit))
            else:
                since_ts = datetime.utcnow() - timedelta(hours=since_hours)
                cursor.execute("""
                    SELECT id, timestamp, user_id, actor_name, role, action, operation,
                           method, status, purpose, patient_id, patient_code, patient_name,
                           changed_fields, details, request_body, response_body,
                           uri, ip_address, user_agent, log_type
                    FROM access_logs
                    WHERE timestamp >= %s
                    ORDER BY timestamp DESC
                    LIMIT %s
                """, (since_ts, limit))
            logs = cursor.fetchall()
            for log in logs:
                log['log_type'] = self._derive_log_type(log)
            logger.info(f"Fetched {len(logs)} logs from access_logs for behavior evaluation")
            return logs
        finally:
            cursor.close()
            conn.close()

    def _fetch_logs_by_ids(self, log_ids: List[str]) -> List[Dict[str, Any]]:
        if not log_ids:
            return []
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            placeholders = ','.join(['%s'] * len(log_ids))
            query = f"""
                SELECT id, timestamp, user_id, actor_name, role, action, operation,
                       method, status, purpose, patient_id, patient_code, patient_name,
                       changed_fields, details, request_body, response_body,
                       uri, ip_address, user_agent
                FROM access_logs
                WHERE id IN ({placeholders})
                ORDER BY timestamp DESC
            """
            cursor.execute(query, tuple(log_ids))
            logs = cursor.fetchall()
            for log in logs:
                log['log_type'] = self._derive_log_type(log)
            logger.info(f"Fetched {len(logs)} logs by IDs for behavior evaluation")
            return logs
        finally:
            cursor.close()
            conn.close()

    def _derive_log_type(self, log: Dict[str, Any]) -> str:
        uri = (log.get('uri') or '').lower()
        action = (log.get('action') or '').lower()
        purpose = (log.get('purpose') or '').lower()
        operation = (log.get('operation') or '').lower()
        role = (log.get('role') or '').lower()
        existing_log_type = (log.get('log_type') or '').lower()

        # CRITICAL: Preserve SECURITY_ALERT and SECURITY_INCIDENT log types
        # These are explicitly set by WAF/FIM and should not be overridden
        if existing_log_type in ['security_alert', 'security_incident']:
            return log.get('log_type')  # Return original case
        
        # Respect explicit backup/encryption log types
        if purpose == 'backup_encryption' or existing_log_type in {'emr_encryption', 'emr_backup', 'emr_delete'} \
                or any(keyword in action for keyword in ['backup', 'encrypt']) \
                or '/backup-encryption/' in uri:
            return 'backup_encryption_log'

        # CRITICAL: Check if log already has system log type from /api/system/logs
        # If log has rule_group='auth' in details, it's a system auth log, not session log
        details_json = self._parse_json(log.get('details'))
        
        # CRITICAL: Check purpose='system_compliance' FIRST (logs from /api/system/logs)
        if purpose == 'system_compliance':
            # This is definitely a system compliance log
            if existing_log_type.startswith('system_'):
                return existing_log_type.upper()
            # Check rule_group in details to determine specific type
            rule_group = details_json.get('rule_group') if details_json else None
            if rule_group == 'auth':
                return 'SYSTEM_AUTH_LOG'
            elif rule_group:
                return f'SYSTEM_{rule_group.upper()}_LOG'
            return 'SYSTEM_COMPLIANCE_LOG'
        
        if existing_log_type.startswith('system_') or 'system' in role or 'system' in action:
            return 'SYSTEM_COMPLIANCE_LOG'

        # Check if it's an auth log with rule_group='auth' in details (from /api/system/logs but purpose might be different)
        if details_json and details_json.get('rule_group') == 'auth':
            return 'SYSTEM_AUTH_LOG'

        # Only return SESSION_LOG if it's NOT a system auth log
        if any(keyword in uri for keyword in ['/login', '/auth', '/session']) or \
           'login' in action or purpose == 'authentication':
            # Double-check: if it has rule_group='auth', it's system auth, not session
            if details_json and details_json.get('rule_group') == 'auth':
                return 'SYSTEM_AUTH_LOG'
            return 'SESSION_LOG'

        # Administrative UI (menu/navigation) should not be treated as EMR access
        admin_keywords = ['/admin/menus', '/admin/dashboard', '/admin/settings', '/admin/roles']
        if any(keyword in uri for keyword in admin_keywords):
            return 'ADMIN_ACTIVITY_LOG'

        if any(keyword in uri for keyword in ['/prescriptions', '/medications', '/pharmacy']) or \
           'prescription' in purpose or 'medication' in purpose:
            return 'PRESCRIPTION_LOG'

        if any(keyword in uri for keyword in ['/appointments', '/queues', '/encounters', '/patients']) or \
           'encounter' in purpose or 'visit' in purpose or operation in {'create', 'update'} and 'appointment' in uri:
                return 'EMR_ACCESS_LOG'

    def _rule_applies(self, rule: Dict[str, Any], log: Dict[str, Any]) -> bool:
        """
        OPTIMIZED FULL COMPLIANCE CHECK: Check rules with Rule Grouping.
        - USER logs → only USER scope rules (EMR, session, prescription)
        - SYSTEM logs → only SYSTEM scope rules (TLS, backup, auth, infra)
        - REFERENCE rules (policy/governance) → skip (can't auto-check from logs)
        """
        rule_code = (rule.get('rule_code') or '').upper().strip()
        rule_scope = (rule.get('rule_scope') or '').upper().strip()
        
        # Only skip if rule has no rule_code
        if not rule_code:
            return False
        
        # ===== SKIP REFERENCE RULES (POLICY/GOVERNANCE) =====
        # These rules can't be verified from logs - they require manual attestation or config checks
        # Display in "Tra cứu Bộ luật" for reference only, don't check in behavior monitoring
        reference_rule_prefixes = [
            'R-GOV-',   # Governance rules (thành lập ban ATTT, đào tạo, chính sách...)
            'R-BKP-',   # Backup policy rules (3-2-1, retention, offsite...)
            'R-IR-',    # Incident Response rules (playbook, 72h notification...)
            'R-RBAC-',  # RBAC policy rules (role assignment, break-glass...)
            'R-SIG-',   # Signature/Certificate rules (chữ ký số, watermark...)
            'R-INT-',   # Integration rules (HL7, FHIR, master data...)
            'R-CON-',   # Consent/Sharing rules (đồng ý bệnh nhân, chia sẻ dữ liệu...)
            'R-DAM-',   # Data Management policy rules (export, clipboard, USB...)
        ]
        
        for prefix in reference_rule_prefixes:
            if rule_code.startswith(prefix):
                logger.debug(f"[REFERENCE] Skip policy rule {rule_code} (can't auto-check from logs)")
                return False
        
        # Skip noise logs (token refresh, health checks)
        uri = (log.get('uri') or '').lower()
        if 'openid-connect/token' in uri or '/health' in uri or '/metrics' in uri:
            return False
        
        # ===== STRICT 1:1 LOG-RULE MAPPING =====
        # Each log type ONLY checks its specific rules
        # If no matching log type → don't check ANY rule (avoid false violations)
        
        log_type = (log.get('log_type') or '').lower()
        purpose = (log.get('purpose') or '').lower()
        action = (log.get('action') or log.get('action_description') or '').lower()
        
        # ===== 1. LOGIN SUCCESS LOG =====
        is_login_success = (
            purpose == 'authentication' or
            'đăng nhập thành công' in action or 'login success' in action or
            (log_type == 'session_log' and 'thành công' in action)
        )
        if is_login_success:
            # Only check: LOGIN-001, SYS-AUTH-01
            allowed = ['LOGIN-001', 'SYS-AUTH-01']
            return rule_code in allowed
        
        # ===== 2. LOGIN FAILED LOG =====
        is_login_failed = (
            'đăng nhập thất bại' in action or 'login failed' in action or
            'sai mật khẩu' in action or 'brute' in action.lower()
        )
        if is_login_failed:
            # Only check: SYS-AUTH-01, SYS-AUTH-03, R-IAM-06
            allowed = ['SYS-AUTH-01', 'SYS-AUTH-03', 'R-IAM-06']
            return rule_code in allowed
        
        # ===== 3. EMR READ LOG =====
        is_emr_read = (
            log_type == 'emr_access_log' or
            'xem hồ sơ' in action or 'đọc bệnh án' in action or 
            'emr read' in action.lower() or 'view' in action.lower()
        )
        if is_emr_read:
            allowed = ['EMR-READ-001']
            return rule_code in allowed
        
        # ===== 4. EMR UPDATE LOG =====
        is_emr_update = (
            'sửa hồ sơ' in action or 'cập nhật bệnh án' in action or
            'emr update' in action.lower() or 'chỉnh sửa' in action
        )
        if is_emr_update:
            allowed = ['EMR-UPDATE-001']
            return rule_code in allowed
        
        # ===== 5. EMR EXPORT LOG =====
        is_emr_export = (
            'xuất hồ sơ' in action or 'export' in action.lower() or
            'tải xuống' in action or 'download' in action.lower()
        )
        if is_emr_export:
            allowed = ['EMR-EXPORT-001']
            return rule_code in allowed
        
        # ===== 6. EMR PRINT LOG =====
        is_emr_print = 'in hồ sơ' in action or 'print' in action.lower()
        if is_emr_print:
            allowed = ['EMR-PRINT-001']
            return rule_code in allowed
        
        # ===== 7. PRESCRIPTION LOG =====
        is_prescription = (
            log_type == 'prescription_log' or
            'kê đơn' in action or 'thuốc' in action
        )
        if is_prescription:
            allowed = ['RX-ISSUE-001']
            return rule_code in allowed
        
        # ===== 8. QUEUE LOG =====
        is_queue = 'hàng chờ' in action or 'queue' in action.lower()
        if is_queue:
            allowed = ['QUEUE-ACCESS-001']
            return rule_code in allowed
        
        # ===== 9. TLS/ENCRYPTION LOG =====
        is_tls = log_type in ['system_tls_log', 'gateway_log'] or purpose == 'system_compliance'
        if is_tls:
            allowed = ['SYS-TLS-01', 'SYS-TLS-02', 'SYS-ENC-01']
            return rule_code in allowed
        
        # ===== DEFAULT: Unknown log type → DON'T CHECK ANY RULE =====
        # This prevents false violations from unmatched logs
        logger.debug(f"[SKIP] Unknown log type: {log_type}, action: {action[:50]}... - skipping all rules")
        return False
    
    def _rule_applies_strict(self, rule: Dict[str, Any], log: Dict[str, Any]) -> bool:
        """
        STRICT MODE (OLD): Original complex filtering logic.
        Kept for reference but not used in production.
        """
        rule_code = (rule.get('rule_code') or '').upper().strip()
        functional_group = (rule.get('functional_group') or '').lower().strip()
        log_type = (log.get('log_type') or '').lower().strip()
        
        # ===== FIX: DIRECT RULE_CODE MATCHING FOR KEYCLOAK AUTHENTICATION LOGS =====
        # Keycloak Collector already assigns proper rule_codes (SYS-AUTH-01, SYS-AUTH-03, R-IAM-03, R-IAM-06)
        # For authentication logs, we directly match log's details.rule_code with database rule's rule_code
        log_purpose = (log.get('purpose') or '').lower().strip()
        if log_purpose == 'authentication':
            # Skip LOGIN-* rules (which would re-classify these logs incorrectly)
            if rule_code.startswith('LOGIN-'):
                logger.debug(f"[AUTH] Skipping LOGIN-* rule {rule_code} for Keycloak log (purpose=authentication)")
                return False
            
            # DIRECT MATCH: Check if log's rule_code matches this database rule
            details_json = self._parse_json(log.get('details'))
            if details_json and isinstance(details_json, dict):
                log_rule_code = (details_json.get('rule_code') or '').upper().strip()
                if log_rule_code:
                    # If log has a rule_code, only match if it equals this rule
                    if log_rule_code == rule_code:
                        logger.info(f"[AUTH] MATCH: Log rule_code '{log_rule_code}' matches database rule '{rule_code}'")
                        return True
                    else:
                        logger.debug(f"[AUTH] SKIP: Log rule_code '{log_rule_code}' != database rule '{rule_code}'")
                        return False
            # If no rule_code in details, don't match
            return False
        
        # ===== CRITICAL: EHR USER ACTIVITY RULES CHECK FIRST =====
        # EMR-*, RX-*, QUEUE-* rules should be checked BEFORE other system rules
        # These are user behavior rules that apply to EHR operations
        ehr_rule_prefixes = {
            'EMR-READ-': ['emr_access_log', 'encounter_log'],
            'EMR-UPDATE-': ['emr_access_log', 'encounter_log'],
            'EMR-PRINT-': ['emr_access_log'],
            'EMR-EXPORT-': ['emr_access_log'],
            'RX-': ['prescription_log'],
            'QUEUE-': ['emr_access_log', 'encounter_log'],
        }
        
        for prefix, valid_log_types in ehr_rule_prefixes.items():
            if rule_code.startswith(prefix):
                # Debug: trace the matching
                logger.info(f"[EHR_RULE_DEBUG] rule={rule_code}, log_type='{log_type}', valid_types={valid_log_types}, match={log_type in valid_log_types}")
                # This is an EHR rule - check if log_type matches
                if log_type in valid_log_types:
                    # Extract operation info
                    operation = (log.get('operation') or '').lower()
                    method = (log.get('method') or '').lower()
                    action = (log.get('action') or '').lower()
                    uri = (log.get('uri') or '').lower()
                    
                    # Check operation type for each rule type
                    if 'READ' in rule_code:
                        if operation in {'view', 'read', 'get', 'search'} or method == 'get' or 'xem' in action or 'view' in action:
                            logger.info(f"[EHR_RULE] MATCH: {rule_code} applies to {log_type} with operation={operation}")
                            return True
                        return False
                        
                    elif 'UPDATE' in rule_code:
                        if operation in {'update', 'edit', 'modify', 'patch', 'create'} or method in {'put', 'patch', 'post'}:
                            logger.info(f"[EHR_RULE] MATCH: {rule_code} applies to {log_type} with operation={operation}")
                            return True
                        return False
                        
                    elif 'PRINT' in rule_code:
                        if operation == 'print' or action == 'print' or 'in bệnh án' in action or 'in hồ sơ' in action:
                            return True
                        return False
                        
                    elif 'EXPORT' in rule_code:
                        if operation in {'export', 'download'} or 'xuất' in action or 'export' in action:
                            return True
                        return False
                        
                    elif prefix == 'RX-':
                        if 'prescription' in uri or 'thuốc' in action or 'kê đơn' in action or operation in {'create', 'issue'}:
                            return True
                        return False
                        
                    elif prefix == 'QUEUE-':
                        if 'queue' in uri or 'hàng chờ' in action or 'waiting' in action or 'appointment' in uri:
                            return True
                        return False
                else:
                    # Wrong log_type for this EHR rule
                    return False
        
        # ===== CRITICAL FIX: R-SEC RULES ONLY APPLY TO SECURITY INCIDENTS =====
        # R-SEC rules (SQL Injection, XSS, etc.) should ONLY apply to logs with
        # actual evidence of suspicious activity - NOT normal EHR operations.
        # Normal operations (view patient, update record) are COMPLIANT by default.
        if rule_code.startswith('R-SEC-'):
            # ===== CRITICAL: GLOBAL EXCLUSION FOR KEYCLOAK / AUTH EVENTS =====
            # R-SEC rules (SQLi, XSS) should NEVER apply to Keycloak authentication logs.
            # We identify these matching logs by 'realm'/'client_id' in details or explicit log types/actions.
            details_check = self._parse_json(log.get('details')) or {}
            log_purpose = (log.get('purpose') or '').lower().strip()
            
            # DEFINITIVE CHECK: If purpose is 'authentication', it's from Keycloak Collector = SKIP R-SEC
            if log_purpose == 'authentication':
                logger.debug(f"[R-SEC] Skipping {rule_code} for Keycloak log (purpose=authentication)")
                return False
            
            if 'BRUTE-FORCE' in (log.get('action') or '').upper() or \
               'BRUTE_FORCE' in str(log.get('details') or '').upper() or \
               details_check.get('is_brute_force') is True or \
               details_check.get('realm') or \
               details_check.get('client_id') or \
               (details_check.get('rule_code') or '').startswith('R-IAM') or \
               (details_check.get('rule_code') or '').startswith('SYS-AUTH'):
                logger.debug(f"[R-SEC] Skipping {rule_code} for IAM/Auth event (realm/client_id detected)")
                return False

            # Check 1: Is this a security alert/WAF event?
            # These are explicitly security-related and should be evaluated
            if log_type in ['security_alert', 'waf_block', 'security_incident']:
                logger.info(f"[R-SEC] Applying {rule_code} to security event: log_type={log_type}")
                return True
            
            # Check 2: Does log details contain security-related fields?
            details_json = self._parse_json(log.get('details'))
            if details_json and isinstance(details_json, dict):
                # WAF/IDS events have attack_type, matched_pattern, or rule_id
                if details_json.get('attack_type') or details_json.get('matched_pattern') or details_json.get('waf_rule_id'):
                    logger.info(f"[R-SEC] Applying {rule_code}: found security indicators in details")
                    return True
                # Explicit violation flag from WAF/IDS
                if details_json.get('violation') is True or details_json.get('is_attack') is True:
                    logger.info(f"[R-SEC] Applying {rule_code}: violation flag detected")
                    return True
            
            # Check 3: Does request contain suspicious patterns?
            uri = (log.get('uri') or '').upper()
            request_body = str(log.get('request_body') or '').upper()
            action = (log.get('action') or '').upper()
            
            # SQL Injection patterns
            sql_patterns = ['UNION SELECT', 'UNION%20SELECT', 'OR 1=1', "OR '1'='1", 
                           '; DROP', ';DROP', '--', '%27', 'EXEC(', 'EXECUTE(']
            # XSS patterns
            xss_patterns = ['<SCRIPT', 'JAVASCRIPT:', 'ONERROR=', 'ONLOAD=', 
                           'ONCLICK=', 'ONMOUSEOVER=', 'ONFOCUS=', '%3CSCRIPT']
            
            for pattern in sql_patterns:
                if pattern in uri or pattern in request_body:
                    logger.info(f"[R-SEC] Applying {rule_code}: SQL pattern '{pattern}' found in request")
                    return True
            
            for pattern in xss_patterns:
                if pattern in uri or pattern in request_body:
                    logger.info(f"[R-SEC] Applying {rule_code}: XSS pattern '{pattern}' found in request")
                    return True
            
            # Check 4: WAF-related operation or action
            operation = (log.get('operation') or '').upper()
            if operation == 'WAF_BLOCK' or '[WAF]' in action:
                # CRITICAL FIX: Ensure this isn't a Brute Force event masquerading as WAF
                # (Though usually WAF_BLOCK is network level)
                logger.info(f"[R-SEC] Applying {rule_code}: WAF operation detected")
                return True
            
            # No security indicators found - skip R-SEC for normal operations
            # This prevents false positives on "Xem hồ sơ bệnh án", "Cập nhật bệnh nhân", etc.
            logger.debug(f"[R-SEC] Skipping {rule_code} for normal operation: log_type={log_type}, uri={log.get('uri')}")
            return False
        
        uri = (log.get('uri') or '').lower().strip()
        purpose = (log.get('purpose') or '').lower().strip()
        status = str(log.get('status') or '')
        result = (log.get('result') or '').upper().strip()
        
        # DEBUG: Unconditional logging to trace execution
        logger.info(f"[DEBUG_TRACE] rule='{rule_code}', user='{log.get('user_id')}', status={status} (type={type(status)})")
        
        # ===== CONTEXT-AWARE FILTERING FOR AUTH RULES =====
        # This prevents irrelevant AUTH rules from being checked based on login status
        if rule_code.startswith('SYS-AUTH-'):
            # Convert status to int for comparison (DB stores as int)
            try:
                status_int = int(status) if status else 0
            except (ValueError, TypeError):
                status_int = 0
            
            # LOGIN FAILED (401/403/423): Only check Brute Force
            # LOGIN FAILED (401/403/423): Only check Brute Force
            if status_int in [401, 403, 423] or result == 'FAILED':
                # Only SYS-AUTH-03 (Brute Force) applies to failed logins
                if rule_code != 'SYS-AUTH-03':
                    logger.info(f"[AUTH_FILTER] Skipping {rule_code} for failed login (status={status_int})")
                    return False  # Skip all other AUTH rules (no session/token/MFA yet)
                else:
                    logger.info(f"[AUTH_FILTER] Checking {rule_code} for failed login (status={status_int})")
                    # CRITICAL FIX: Return True immediately to ensure SYS-AUTH-03 is applied
                    # This bypasses later checks that might incorrectly skip this rule
                    return True
            
            # LOGIN SUCCESS (200): Check session/token/MFA rules, skip Brute Force
            elif status_int == 200 or result == 'SUCCESS':
                # Skip SYS-AUTH-03 for successful logins (no brute force if already logged in)
                if rule_code == 'SYS-AUTH-03':
                    logger.info(f"[AUTH_FILTER] Skipping {rule_code} for successful login (status={status_int})")
                    return False
        
        # For system logs, use rule_group from details to match against rule_code prefixc log_type (emr_encryption, emr_backup, emr_delete)
        details_json = self._parse_json(log.get('details'))
        backup_log_type = None
        system_rule_group = None
        if details_json and isinstance(details_json, dict):
            backup_log_type = (details_json.get('log_type') or '').lower().strip()
            system_rule_group = (details_json.get('rule_group') or '').lower().strip()
        
        # Debug logging for ALL logs to trace matching
        if rule_code.startswith('SYS-TLS'):
            logger.info(f"[RULE_APPLIES_DEBUG] Rule {rule_code} vs Log {log.get('id')}: "
                       f"purpose={purpose}, log_type={log_type}, "
                       f"details_json type={type(details_json)}, "
                       f"details_json.rule_group={details_json.get('rule_group') if isinstance(details_json, dict) else 'N/A'}, "
                       f"system_rule_group={system_rule_group}")

        # CRITICAL: Check system_compliance FIRST before backup_encryption
        # System compliance logs (TLS, Auth, App, etc.) should be matched before backup_encryption
        # Check purpose, log_type (including SYSTEM_TLS_LOG, SYSTEM_AUTH_LOG, etc.), or rule_scope/rule_group in details
        # CRITICAL FIX: Also check if purpose='authentication' but has rule_group='auth' in details (auth logs from /api/system/logs)
        is_system_compliance = (
            purpose == 'system_compliance' or 
            log_type == 'system_compliance_log' or 
            (log_type and log_type.lower().startswith('system_')) or
            (details_json and details_json.get('rule_scope') == 'system') or
            (details_json and details_json.get('rule_group') in ['tls', 'auth', 'app', 'log', 'database', 'db', 'infra', 'infrastructure', 'dlp', 'ops', 'operation', 'dsr', 'data_subject']) or
            # CRITICAL: Auth logs from /api/system/logs have purpose='system_compliance' and rule_group='auth'
            # But if they were saved with purpose='authentication', check rule_group in details
            (purpose == 'authentication' and details_json and details_json.get('rule_group') == 'auth')
        )
        if is_system_compliance:
            logger.info(f"[SYSTEM_COMPLIANCE_CHECK] Log {log.get('id')}: purpose={purpose}, log_type={log_type}, "
                       f"details_json.rule_group={details_json.get('rule_group') if details_json else 'N/A'}, "
                       f"details_json.rule_scope={details_json.get('rule_scope') if details_json else 'N/A'}, "
                       f"is_system_compliance={is_system_compliance}")
            prefix_map = {
                'tls': 'SYS-TLS-',
                'auth': 'SYS-AUTH-',
                'authentication': 'SYS-AUTH-',
                'application': 'SYS-APP-',
                'app': 'SYS-APP-',
                'log': 'SYS-LOG-',
                'logging': 'SYS-LOG-',
                'database': 'SYS-DB-',
                'db': 'SYS-DB-',
                'infra': 'SYS-INF-',
                'infrastructure': 'SYS-INF-',
                'dlp': 'SYS-DLP-',
                'ops': 'SYS-OPS-',
                'operation': 'SYS-OPS-',
                'dsr': 'SYS-DSR-',
                'data_subject': 'SYS-DSR-',
            }
            prefix = prefix_map.get(system_rule_group)
            if prefix:
                # Support test rules: SYS-AUTH-T01 matches SYS-AUTH- prefix
                # Check if rule_code starts with prefix OR has -T variant (e.g., SYS-AUTH-T01)
                base_prefix = prefix.rstrip('-')  # SYS-AUTH- → SYS-AUTH
                match_result = rule_code.startswith(prefix) or rule_code.startswith(f"{base_prefix}-T")
                logger.info(f"[RULE_MATCH] system_rule_group='{system_rule_group}' → prefix='{prefix}', rule_code='{rule_code}', match={match_result}")
                return match_result
            # Fallback: if no system_rule_group found, try to match any SYS- rule
            match_result = rule_code.startswith('SYS-')
            logger.info(f"[RULE_MATCH] No system_rule_group found (value='{system_rule_group}'), falling back to SYS- prefix check. rule_code='{rule_code}', match={match_result}")
            return match_result

        # CRITICAL: Match rules based on specific backup/encryption log type
        if purpose == 'backup_encryption' or log_type == 'backup_encryption_log' or backup_log_type:
            # If we have specific backup_log_type, only apply matching rules
            if backup_log_type == 'emr_encryption':
                # Log encryption → chỉ apply encryption rules (SYS-ENC-*)
                if not rule_code.startswith('SYS-ENC-'):
                    return False
            elif backup_log_type == 'emr_backup':
                # Log backup → chỉ apply backup rules (SYS-BKP-*), trừ retention
                if not rule_code.startswith('SYS-BKP-') or rule_code == 'SYS-BKP-03':
                    # SYS-BKP-03 là về retention, không áp dụng cho backup run
                    if rule_code == 'SYS-BKP-03':
                        return False
                    if not rule_code.startswith('SYS-BKP-'):
                        return False
            elif backup_log_type == 'emr_delete':
                # Log delete → chỉ apply retention rules (SYS-BKP-03 và các rules về retention)
                if not (rule_code == 'SYS-BKP-03' or 'retention' in functional_group or 'delete' in functional_group):
                    return False
            else:
                # Fallback: nếu không có backup_log_type cụ thể, chỉ apply rules trong allowed groups
                allowed_groups = {
                    'backup_encryption',
                    'backup',
                    'encryption',
                    'retention',
                    'emr_backup',
                    'emr_encryption',
                    'emr_delete'
                }
                if functional_group not in allowed_groups:
                    return False

        if purpose == 'system_compliance' or log_type == 'system_compliance_log' or (details_json and details_json.get('rule_scope') == 'system'):
            prefix_map = {
                'tls': 'SYS-TLS-',
                'auth': 'SYS-AUTH-',
                'authentication': 'SYS-AUTH-',
                'application': 'SYS-APP-',
                'app': 'SYS-APP-',
                'log': 'SYS-LOG-',
                'logging': 'SYS-LOG-',
                'database': 'SYS-DB-',
                'db': 'SYS-DB-',
                'infra': 'SYS-INF-',
                'infrastructure': 'SYS-INF-',
                'dlp': 'SYS-DLP-',
                'ops': 'SYS-OPS-',
                'operation': 'SYS-OPS-',
                'dsr': 'SYS-DSR-',
                'data_subject': 'SYS-DSR-',
            }
            prefix = prefix_map.get(system_rule_group)
            if prefix:
                # Support test rules: SYS-AUTH-T01 matches SYS-AUTH- prefix
                base_prefix = prefix.rstrip('-')  # SYS-AUTH- → SYS-AUTH
                match_result = rule_code.startswith(prefix) or rule_code.startswith(f"{base_prefix}-T")
                logger.info(f"[RULE_MATCH] system_rule_group='{system_rule_group}' → prefix='{prefix}', rule_code='{rule_code}', match={match_result}")
                return match_result
            # Fallback: if no system_rule_group found, try to match any SYS- rule
            match_result = rule_code.startswith('SYS-')
            logger.info(f"[RULE_MATCH] No system_rule_group found (value='{system_rule_group}'), falling back to SYS- prefix check. rule_code='{rule_code}', match={match_result}")
            return match_result

        # CRITICAL FIX: Rules without functional_group should NOT match all logs
        # Only apply if rule_code explicitly indicates it's a general rule
        if not functional_group:
            # If no functional_group, only apply to rules that are explicitly general
            # For now, we skip rules without functional_group to avoid false positives
            # LOGIN-001 should have functional_group='session' or 'login'
            return False

        # Basic mappings between functional group and log_type/URI
        mappings = {
            'session': ['session_log'],
            'session_log': ['session_log'],
            'login': ['session_log'],
            'emr': ['emr_access_log', 'encounter_log', 'prescription_log'],
            'emr_access': ['emr_access_log'],
            'encounter': ['encounter_log'],
            'prescription': ['prescription_log'],
            'queue': [],
            'admin': ['admin_activity_log'],
            'admin_activity': ['admin_activity_log'],
            'backup_encryption': ['backup_encryption_log'],
            'backup': ['backup_encryption_log'],
            'encryption': ['backup_encryption_log'],
            'retention': ['backup_encryption_log'],
            'tls': ['network_log', 'api_log'], # SYS-TLS should only apply to network/api logs
            'dlp': ['data_access_log', 'file_log'], # SYS-DLP should only apply to data/file events
        }
        
        # ===== CRITICAL FIX: EXPLICIT MAPPING FOR EHR OPERATION RULES =====
        # These rules have PHẦN functional_groups that don't directly match log_type
        # Map rule_code patterns directly to expected log_types
        ehr_rule_mappings = {
            'EMR-READ-': ['emr_access_log', 'encounter_log'],
            'EMR-UPDATE-': ['emr_access_log', 'encounter_log'],
            'EMR-PRINT-': ['emr_access_log'],
            'EMR-EXPORT-': ['emr_access_log'],
            'LOGIN-': ['session_log'],
            'RX-': ['prescription_log'],
            'QUEUE-': ['emr_access_log', 'encounter_log'],
        }
        
        for prefix, valid_log_types in ehr_rule_mappings.items():
            if rule_code.startswith(prefix):
                if log_type in valid_log_types:
                    # Extract operation/action/method once
                    operation = (log.get('operation') or '').lower()
                    method = (log.get('method') or '').lower()
                    action = (log.get('action') or '').lower()
                    uri = (log.get('uri') or '').lower()
                    
                    # Check operation type for each rule type
                    if 'READ' in rule_code:
                        if operation in {'view', 'read', 'get', 'search'} or method == 'get' or 'xem' in action:
                            return True
                        return False  # Wrong operation type
                        
                    elif 'UPDATE' in rule_code:
                        if operation in {'update', 'edit', 'modify', 'patch', 'create'} or method in {'put', 'patch', 'post'}:
                            return True
                        return False  # Wrong operation type
                        
                    elif 'PRINT' in rule_code:
                        # Stricter matching - only match print operations, not Vietnamese words containing 'in'
                        if operation == 'print' or action == 'print' or 'in bệnh án' in action or 'in hồ sơ' in action:
                            return True
                        return False
                        
                    elif 'EXPORT' in rule_code:
                        if operation in {'export', 'download'} or 'xuất' in action or 'export' in action:
                            return True
                        return False
                        
                    elif prefix == 'LOGIN-':
                        # Login rule - check for login/logout operations
                        if operation in {'login', 'logout', 'authenticate'} or 'đăng nhập' in action or 'đăng xuất' in action:
                            return True
                        return False
                        
                    elif prefix == 'QUEUE-':
                        # Queue rule - only match queue/hàng chờ operations
                        if 'queue' in uri or 'hàng chờ' in action or 'waiting' in action or operation == 'queue':
                            return True
                        return False
                        
                    elif prefix == 'RX-':
                        # Prescription rule - match create/issue prescription
                        if 'prescription' in uri or 'thuốc' in action or 'kê đơn' in action or operation in {'create', 'issue'}:
                            return True
                        return False
                        
                else:
                    return False  # Wrong log_type for this rule
        
        # ===== STRICT 1-TO-1 RULE MAPPING =====
        # User logs (EMR, Session, etc.) should ONLY match their SPECIFIC rules
        # NOT all R-* rules in the same PHẦN group
        
        # If this is a user activity log type, ONLY allow specific EHR rules
        user_log_types = ['session_log', 'emr_access_log', 'encounter_log', 'prescription_log', 'admin_activity_log']
        if log_type in user_log_types:
            # User logs should ONLY be checked against specific EHR operation rules
            # Do NOT apply general R-* (audit, integrity, etc.) rules to user operations
            # Those R-* rules are for SYSTEM compliance checking, not user behavior
            
            # Skip all R-* rules (R-AUD, R-CON, R-DAM, R-INT, R-SIG, etc.)
            # These are system/infrastructure compliance rules, not user behavior rules
            if rule_code.startswith('R-'):
                return False
            
            # Skip SYS-* rules for user logs (those are for system compliance)
            if rule_code.startswith('SYS-'):
                return False
            
            # At this point, the log didn't match any specific EHR rule above
            # and it's not a system rule. Check if it's a general rule that SHOULD apply
            # For now, skip - only explicit EHR rules should apply
            return False

        # Extract common fields
        role = log.get('role')
        log_type = (log.get('log_type') or '').lower()
        uri = log.get('uri') or ''


        
        # Helper functions definition moved up
        operation = (log.get('operation') or '').lower().strip()
        action = (log.get('action') or '').lower().strip()
        method = (log.get('method') or '').lower().strip()

        def matches_view():
            return operation in {'view', 'read', 'get', 'search'} or method == 'get' or 'view' in action or 'xem' in action

        def matches_update():
            return operation in {'update', 'edit', 'modify', 'patch'} or method in {'put', 'patch'} or 'cập nhật' in action or 'update' in action

        def matches_create():
            return operation in {'create', 'add', 'insert'} or method == 'post' or 'tạo' in action or 'create' in action

        def matches_export():
            return operation in {'export', 'download'} or 'export' in action or 'download' in action or 'xuất' in action

        def matches_print():
            return operation == 'print' or 'print' in action or 'in ' in action

        # ===== CRITICAL: FILTER SYS-TLS and SYS-DLP =====
        if 'SYS-TLS' in rule_code:
            # Only apply if log has network context or is an API call
            # And SKIP for 'system' role or internal calls if not relevant
            if log_type not in ['network_log', 'api_log'] and 'protocol' not in log:
                return False
            # Fix for admin.user flagging SYS-TLS-06 on standard internal admin APIs
            if role == 'system' and log.get('uri'):
                 uri_lower = log.get('uri').lower()
                 # Skip TLS checks for internal dashboard APIs or non-PHI access
                 if '/api/behavior-monitoring' in uri_lower or '/api/users' in uri_lower:
                     return False

        if 'SYS-DLP' in rule_code:
            # DLP only relevant for EXPORT, DOWNLOAD, PRINT, or EMAIL
            if not (matches_export() or matches_print() or 'email' in rule_code.lower() or 'usb' in rule_code.lower()):
                 # If it's just a VIEW operation, DLP usually doesn't apply unless Mass Read (handled by other rules)
                 # Exception: SYS-DLP-08 (Traffic foreign IP) applies to network
                 if 'SYS-DLP-08' not in rule_code:
                     return False
            # Gateway user shouldn't trigger Application DLP usually
            if role == 'system' and log.get('actor_name') == 'gateway':
                return False
        # ================================================

        if functional_group in mappings:
            targets = mappings[functional_group]
            if targets and log_type not in targets:
                return False
            # fallback based on URI keywords for queue etc.
            if not targets and functional_group == 'queue':
                return 'queue' in uri or 'waiting' in uri

        # Additional safety: EMR rules should NOT match SESSION_LOG
        if log_type == 'session_log':
            # Only SESSION/LOGIN rules should match session logs
            if functional_group not in ['session', 'session_log', 'login']:
                return False

        if 'READ' in rule_code and not matches_view():
            return False
        if 'UPDATE' in rule_code and not (matches_update() or matches_create()):
            return False
        if 'EXPORT' in rule_code and not matches_export():
            return False
        if 'PRINT' in rule_code and not matches_print():
            return False
            
        # fallback: check if keyword exists in URI or log_type (but be more strict)
        return functional_group in log_type or functional_group in uri

    def _get_nested_value(self, obj: Any, path: List[str]):
        current = obj
        for key in path:
            if current is None:
                return None
            if isinstance(current, dict):
                current = current.get(key)
            elif isinstance(current, list):
                try:
                    idx = int(key)
                    current = current[idx]
                except Exception:
                    return None
            else:
                return None
        return current

    def _field_present(self, log: Dict[str, Any], field_name: str) -> bool:
        path = [segment for segment in field_name.split('.') if segment]
        if not path:
            return True

        # CRITICAL FIX: request_body is optional for GET/HEAD/DELETE/OPTIONS
        if field_name == 'request_body':
            method = str(log.get('method') or '').upper()
            if method in ['GET', 'HEAD', 'DELETE', 'OPTIONS']:
                 return True

        # Nếu rule yêu cầu patient_id/patient_code nhưng URI không nhắm vào bệnh nhân cụ thể,
        # bỏ qua yêu cầu này để tránh false-positive khi gọi list /admin/patients?page=...
        if field_name in ['patient_id', 'patient_code', 'mã bệnh nhân']:
            uri = log.get('uri')
            if uri and not self._is_patient_specific_uri(uri):
                return True
            # Fallback: nếu thiếu patient_id nhưng URI có patient_id ở query/path, coi như có
            if uri:
                try:
                    from urllib.parse import urlparse, parse_qs
                    parsed = urlparse(uri)
                    q = parse_qs(parsed.query or '')
                    pid = None
                    if 'patient_id' in q and q['patient_id']:
                        pid = q['patient_id'][0]
                    # fallback path /patients/{id} hoặc /medical-records?patient_id=...
                    if not pid:
                        parts = parsed.path.strip('/').split('/')
                        if 'patients' in parts:
                            idx = parts.index('patients')
                            if idx + 1 < len(parts):
                                pid = parts[idx + 1]
                    if pid:
                        return True
                except Exception:
                    pass

        # Fallback for session_start (SYS-AUTH-04): 
        # If session_start is required but missing, and we have a timestamp,
        # assume session started now (duration=0) to avoid "Missing Field" violation.
        if field_name == 'session_start' and log.get('timestamp'):
             # Check if it really exists first using standard logic
             # But here we are deciding if it is "present".
             # If we return True here, we claim it IS present.
             pass 

        # Map các trường tương đương (field aliases)
        field_aliases = {
            'patient_code': ['patient_id', 'patient_code', 'mã bệnh nhân', 'patient_uuid'],
            'patient_id': ['patient_id', 'patient_code', 'mã bệnh nhân', 'patient_uuid'],
            'mã bệnh nhân': ['patient_id', 'patient_code', 'mã bệnh nhân', 'patient_uuid'],
            'user': ['user', 'actor_name', 'username', 'user_id', 'actor_id'],  # Added user alias
            'user_id': ['user_id', 'actor_id', 'actor_name', 'username'],
            'session_start': ['session_start', 'login_time', 'iat', 'auth_time', 'timestamp'], # Updated alias to include timestamp
            'session_id': ['session_id', 'event_id', 'log_id', 'id'], # Map session_id to event_id/log_id

            'actor_id': ['user_id', 'actor_id', 'actor_name', 'username'],
            'changed_fields': ['changed_fields', 'modified_fields', 'updated_fields'],
            'source_ip': ['ip_address', 'source_ip', 'remote_addr', 'client_ip'],
            'source_port': ['port', 'source_port', 'client_port'],
            'result': ['status', 'result', 'outcome'],
            'source_port': ['port', 'source_port', 'client_port'],
            'result': ['status', 'result', 'outcome'],
            'resource_uri': ['uri', 'url', 'path', 'resource_uri'],
            'protocol': ['protocol', 'scheme', 'tls_version', 'ssl_protocol'],
        }
        
        # Lấy danh sách các tên trường tương đương
        field_variants = field_aliases.get(field_name, [field_name])
        
        sources: List[Any] = [
            log,
            self._parse_json(log.get('details')),
            self._parse_json(log.get('request_body')),
            self._parse_json(log.get('response_body')),
        ]

        # changed_fields may be JSON array or dict
        changed_fields = self._parse_json(log.get('changed_fields'))
        if changed_fields:
            sources.append(changed_fields)

        # Kiểm tra tất cả các biến thể của trường
        for field_variant in field_variants:
            variant_path = [segment for segment in field_variant.split('.') if segment]
            for source in sources:
                if source is None:
                    continue
                value = self._get_nested_value(source, variant_path)
                if value not in (None, '', [], {}):
                    return True
                # Allow presence check in changed_fields list of dicts
                if isinstance(source, list):
                    for item in source:
                        if isinstance(item, dict):
                            value = self._get_nested_value(item, variant_path)
                            if value not in (None, '', [], {}):
                                return True
                        elif isinstance(item, str) and variant_path[-1] == item:
                            return True
        return False

    def _evaluate_log(self, log: Dict[str, Any], rules: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        violations = []
        compliant_records = []
        
        # SKIP NOISE: Keycloak Token Requests ONLY (not manual login logs)
        uri = (log.get('uri') or '').lower()
        # Exclude ONLY Keycloak infrastructure token requests (duplicate of manual login)
        if 'openid-connect/token' in uri:
             return [], []
        
        # SKIP NOISE: Individual Failed Login Attempts (401/403) - REMOVED
        # User reported missing violations. We must evaluate these logs against SYS-AUTH-03.
        # Strict filtering is handled in _rule_applies (returning False for non-auth rules).
        status = log.get('status')
        # if status in [401, 403]:
        #     return [], []
        
        # SKIP NOISE: Duplicate Account Lockout Logs (423)
        # When account is locked, user may continue trying → multiple 423 logs
        # Only show the FIRST lockout event, not subsequent attempts
        if status == 423:
            actor = log.get('actor_name') or log.get('user_id')
            log_time = log.get('timestamp')
            
            # Check if there's already a recent 423 log for this user
            # (within last 5 minutes = same lockout incident)
            if actor and log_time:
                try:
                    from datetime import datetime, timedelta
                    import mysql.connector
                    
                    conn = mysql.connector.connect(
                        host=self.db_config.get('host', 'mariadb'),
                        user=self.db_config.get('user', 'openemr'),
                        password=self.db_config.get('password', ''),
                        database=self.db_config.get('database', 'ehr_core'),
                        charset='utf8mb4'
                    )
                    cursor = conn.cursor()
                    
                    # Check for earlier 423 log from same user within 5 minutes
                    cursor.execute("""
                        SELECT id FROM access_logs
                        WHERE actor_name = %s
                        AND status = 423
                        AND timestamp < %s
                        AND timestamp > DATE_SUB(%s, INTERVAL 5 MINUTE)
                        LIMIT 1
                    """, (actor, log_time, log_time))
                    
                    earlier_lockout = cursor.fetchone()
                    cursor.close()
                    conn.close()
                    
                    if earlier_lockout:
                        # There's already a lockout log for this user recently
                        # Skip this duplicate
                        return [], []
                except Exception as e:
                    # If DB check fails, continue anyway (fail open)
                    logger.warning(f"Failed to check for duplicate 423 logs: {e}")
        
        # SKIP NOISE: Keycloak Replay Events (batch events after restart)
        # These appear as 30+ logs with identical timestamp when Keycloak restarts
        # CRITICAL: Do NOT filter real user login failures!
        # Replay events: keycloak_LOGOUT, /protocol/openid-connect/token
        # Real events: keycloak_LOGIN_ERROR (actual user failed attempts) - KEEP THESE!
        details_str = str(log.get('details') or '')
        if 'keycloak_logout' in details_str.lower() or 'openid-connect/token' in uri:
            # This is a Keycloak infrastructure event (logout sync, token request)
            return [], []

        # SKIP NOISE: TLS/Gateway System Logs (connection encryption info)
        # These are system infrastructure logs about HTTPS connections, not user login attempts
        action = (log.get('action') or '').lower()
        if 'tls' in action or 'kết nối tls' in action or 'gateway' in action:
            return [], []
        
        # Also check details.rule_group for 'tls' logs
        details_json = self._parse_json(log.get('details'))
        if details_json and isinstance(details_json, dict):
            rule_group = (details_json.get('rule_group') or '').lower()
            if rule_group == 'tls':
                return [], []

        # Map UUID sang username nếu cần (cho logs cũ)
        user_id = log.get('user_id') or log.get('actor_name')
        role = log.get('role', '')
        if user_id and role == 'system':
            mapped_username, mapped_role = self._map_uuid_to_username(user_id, role)
            if mapped_username != user_id:
                log['actor_name'] = mapped_username
                log['role'] = mapped_role
                log['user_id'] = mapped_username  # Cập nhật user_id cũng
        
        violations = []
        compliant_records = []
        logger.info(f"[EVALUATE_DEBUG] Evaluating log {log.get('id')} against {len(rules)} rules. log_type={log.get('log_type')}, functional_group_check={rules[0].get('functional_group') if rules else 'N/A'}")
        
        print(f"!!! DEBUG: Starting _evaluate_log for log {log.get('id')}, log_type={log.get('log_type')}, status={log.get('status')}, {len(rules)} rules total")
        
        try:

            action_description = self.security_monitor._format_action(log)
        except Exception:
            action_description = log.get('action')
            logger.debug("Unable to format action description for log %s", log.get('id'))
        for rule in rules:
            if not rule.get('required_log_fields'):
                continue

            rule_code_check = (rule.get('rule_code') or '').upper()
            # Debug logging for SYS-TLS rules
            if rule_code_check.startswith('SYS-TLS'):
                logger.info(f"[EVALUATE_LOG] Checking rule {rule_code_check} against log {log.get('id')}")
            
            if not self._rule_applies(rule, log):
                if rule_code_check.startswith('SYS-TLS'):
                    logger.info(f"[EVALUATE_LOG] Rule {rule_code_check} does NOT apply to log {log.get('id')}")
                print(f"!!! DEBUG: Rule {rule_code_check} SKIPPED by _rule_applies")
                continue

            
            # Debug logging for TLS rules
            if rule.get('rule_code', '').startswith('SYS-TLS'):
                details_json = self._parse_json(log.get('details'))
                system_rule_group = (details_json.get('rule_group') or '').lower().strip() if details_json else ''
                logger.debug(f"[TLS_RULE_DEBUG] Rule {rule.get('rule_code')} applies to log {log.get('id')}: "
                           f"purpose={log.get('purpose')}, log_type={log.get('log_type')}, "
                           f"system_rule_group={system_rule_group}, rule_group_from_details={details_json.get('rule_group') if details_json else 'N/A'}")

            # Cho phép bỏ qua một số trường cho rule SYS-AUTH-03 (brute force) để tránh vi phạm khi khóa đã diễn ra
            if rule_code_check == 'SYS-AUTH-03':
                required_fields = [
                    field for field in rule['required_log_fields']
                    if field not in ('result', 'source_ip', 'source_port')
                ]
            else:
                required_fields = rule['required_log_fields']

            # CRITICAL CHECK: SYS-AUTH-03 (Brute Force) should flag a violation if account is LOCKED (423)
            # Even if all fields are present, the EVENT itself is a violation/alert.
            is_brute_force_event = False
            details_json = self._parse_json(log.get('details')) or {} 
            status_code = str(log.get('status') or '')
            
            if rule_code_check == 'SYS-AUTH-03':
                # SKIP WAF logs - they have their own rule (WAF-SQLi-001, WAF-XSS-001)
                # WAF logs have operation='WAF_BLOCK' or action contains '[WAF]'
                operation = (log.get('operation') or '').upper()
                action = log.get('action') or ''
                if operation == 'WAF_BLOCK' or '[WAF]' in action:
                    continue  # Skip Brute Force rule for WAF logs
                    
                # Flag ONLY when account is LOCKED (status 423), not every failed login
                # This indicates a brute force attack (multiple failures leading to lockout)
                # 423 = Locked (account locked due to excessive failures)
                if status_code == '423' or \
                   (details_json and details_json.get('account_locked') is True) or \
                   'LOCKED' in (log.get('action') or '').upper() or \
                   'disabled' in str(details_json.get('error', '')).lower():
                    is_brute_force_event = True
                
                # CRITICAL FIX: Also flag when CONSECUTIVE LOGIN FAILURES detected
                # Check if current log is part of a series of 4+ failures in 5 minutes
                # This catches brute force attempts BEFORE account gets locked
                elif status_code in ['401', '403']:
                    actor = log.get('actor_name') or log.get('user_id')
                    log_time = log.get('timestamp')
                    if actor and log_time:
                        failure_count = self._count_recent_failures(actor, log_time)
                        if failure_count >= 4:
                            is_brute_force_event = True
                            logger.info(f"[BRUTE_FORCE] Detected {failure_count} consecutive failures for {actor} - flagging as violation")
            
            # CRITICAL CHECK: R-SEC-01 (SQL Injection) / R-SEC-02 (XSS) for WAF blocked attacks
            # WAF logs with log_type='SECURITY_ALERT' should be flagged as security events
            is_waf_security_event = False
            waf_attack_type = None
            
            if rule_code_check in ['R-SEC-01', 'R-SEC-02']:
                log_type_lower = (log.get('log_type') or '').lower()
                operation = (log.get('operation') or '').upper()
                action = log.get('action') or ''
                
                # Check if this is a WAF blocked event
                if log_type_lower == 'security_alert' or operation == 'WAF_BLOCK' or '[WAF]' in action:
                    # This is a WAF security event - mark as violation
                    waf_attack_type = details_json.get('attack_type', 'SQL Injection') if details_json else 'Unknown'
                    is_waf_security_event = True
                    logger.info(f"[WAF_SECURITY_EVENT] Detected {waf_attack_type} attack blocked - flagging as security event")
            
            if is_waf_security_event:
                # WAF BLOCKED = COMPLIANT (System successfully defended against attack)
                # NOT a violation - the rule requires defense, and we defended successfully
                
                # Get attack type from details
                attack_type = waf_attack_type or (details_json.get('attack_type') if details_json else 'SQL Injection')
                
                # Legal basis for successful defense
                legal_basis_val = "Điều 27, Khoản 1.c (Nghị định 15/2020/NĐ-CP); ISO 27001:2022 - A.8.3"
                law_source_val = "Nghị định 15/2020/NĐ-CP + ISO 27001"

                # Create COMPLIANT record (successful defense)
                compliant_record = {
                    'id': f"{log.get('id')}::{rule.get('rule_code')}::ok",
                    'log_id': log.get('id'),
                    'timestamp': log.get('timestamp'),
                    'user': 'WAF Security',
                    'user_id': log.get('ip_address') or 'system_waf',
                    'actor_name': 'WAF Security',
                    'role': 'system_waf',
                    'operation': 'WAF_BLOCK',
                    'method': log.get('method'),
                    'status': '403',  # Blocked successfully
                    'purpose': 'security_defense',
                    'uri': log.get('uri'),
                    'patient_code': None,
                    'patient_name': None,
                    'rule_code': rule.get('rule_code'),
                    'rule_name': f"✅ Đã chặn tấn công {attack_type}",
                    'law_source': law_source_val,
                    'legal_basis': legal_basis_val,
                    'penalty_level': None,  # No penalty - we complied
                    'law_url': None,
                    'allowed_status': 'allowed',
                    'severity': 'info',  # Not a violation, just info
                    'missing_fields': [],
                    'violation_type': None,  # Not a violation
                    'violation_detail': None,
                    'functional_group': 'security',
                    'has_violation': False,  # COMPLIANT - Successfully defended
                    'log_type': 'SECURITY_ALERT',
                    'violation_id': None,
                    'required_fields': rule.get('required_log_fields'),
                    'action_description': f"✅ [WAF] {attack_type} Attack Blocked Successfully",
                    'details': {
                        'explanation': f"Hệ thống WAF đã phát hiện và chặn thành công cuộc tấn công {attack_type}. Tuân thủ quy tắc phòng chống tấn công.",
                        'tags': ['waf', 'security', 'compliant', 'blocked', attack_type.lower().replace(' ', '_')],
                        'law_source': law_source_val,
                        'attack_type': attack_type,
                        'defense_status': 'SUCCESS',
                        'matched_pattern': details_json.get('matched_pattern') if details_json else None,
                        'attacker_ip': log.get('ip_address') or (details_json.get('ip_address') if details_json else None),
                        'blocked_payload': log.get('uri'),
                        'event_type': 'waf_blocked',
                        'waf_rule_id': details_json.get('rule_id') if details_json else 'WAF-SQLi-001',
                        'log_snapshot': {
                            'action': log.get('action'),
                            'operation': log.get('operation'),
                            'uri': log.get('uri'),
                            'details': details_json,
                        }
                    }
                }
                compliant_records.append(compliant_record)
                logger.info(f"[WAF_COMPLIANT] {attack_type} attack blocked successfully - marking as COMPLIANT")
                # CRITICAL FIX: BREAK instead of CONTINUE to stop other rules (like R-SEC-03) from matching this WAF log
                break  


            if is_brute_force_event:
                # Force violation for Brute Force detection
                severity = 'high'
                
                # Ensure Legal Basis is populated (Hardcoded Failsafe)
                legal_basis_val = rule.get('legal_basis') or rule.get('legal_refs')
                if not legal_basis_val or len(legal_basis_val) < 5:
                    legal_basis_val = "Nghị định 13/2023/NĐ-CP (Điều 27, Khoản 3); ISO 27001:2013 (A.9.4.2)"
                
                law_source_val = rule.get('law_source')
                if not law_source_val:
                    law_source_val = "Nghị định 13/CP + ISO 27001"
                
                # Ensure Penalty/URL (Hardcoded Failsafe)
                penalty_val = rule.get('penalty_level')
                if not penalty_val:
                    penalty_val = "Phạt tiền từ 40.000.000 đồng đến 60.000.000 đồng (Theo khoản 3 Điều 100 Nghị định 15/2020/NĐ-CP)"
                
                url_val = rule.get('law_url')
                if not url_val:
                    url_val = "https://mod.gov.vn/wps/wcm/connect/e542ef86-13a8-4448-9c60-a8868df4194d/Nghidinh13_CP.pdf?MOD=AJPERES&CVID=op07.7-"

                violation = {
                    'id': f"{log.get('id')}::{rule.get('rule_code')}::BF",
                    'log_id': log.get('id'),
                    'timestamp': log.get('timestamp'),
                    'user': log.get('actor_name') or (log.get('user_id') if log.get('role') != 'system' else 'Hệ thống'),
                    'user_id': log.get('user_id'),
                    'actor_name': log.get('actor_name'),
                    'role': log.get('role'),
                    'operation': log.get('operation'),
                    'method': log.get('method'),
                    'status': status_code,
                    'purpose': log.get('purpose'),
                    'uri': log.get('uri'),
                    'patient_code': log.get('patient_code'),
                    'patient_name': log.get('patient_name'),
                    'rule_code': rule.get('rule_code'),
                    'rule_name': rule.get('rule_name'),
                    'law_source': law_source_val,
                    'legal_basis': legal_basis_val,
                    'penalty_level': penalty_val,
                    'law_url': url_val,
                    'allowed_status': rule.get('allowed_status'),
                    'severity': severity,
                    'missing_fields': [],
                    'violation_type': 'SECURITY_EVENT',
                    'violation_detail': 'Brute Force / Account Lock Detected',
                    'functional_group': rule.get('functional_group'),
                    'has_violation': True,
                    'log_type': log.get('log_type'),
                    'violation_id': None,
                    'required_fields': rule.get('required_log_fields'),
                    'action_description': action_description,
                    'details': {
                        'explanation': "Hệ thống phát hiện tài khoản bị khóa do đăng nhập sai nhiều lần (Brute Force)",
                        'tags': rule.get('tags'),
                        'law_source': rule.get('law_source'),
                        # Include captured_queries from original log for forensic trace
                        'captured_queries': details_json.get('captured_queries', []) if details_json else [],
                        'event_type': details_json.get('event_type') if details_json else None,
                        'rule_code': details_json.get('rule_code') if details_json else None,
                        'violation_reasons': details_json.get('violation_reasons') if details_json else None,
                        'severity': details_json.get('severity') if details_json else None,
                        'message': details_json.get('message') if details_json else None,
                        'log_snapshot': {
                            'action': log.get('action'),
                            'operation': log.get('operation'),
                            'changed_fields': self._parse_json(log.get('changed_fields')),
                             'details': details_json,
                        }
                    }
                }
                violations.append(violation)
                continue # Skip standard missing_fields check

            missing_fields = [
                field for field in required_fields
                if not self._field_present(log, field)
            ]

            if missing_fields:
                severity_map = {
                    'not_allowed': 'high',
                    'required': 'medium',
                    'conditional': 'medium',
                    'allowed': 'low'
                }
                severity = severity_map.get(rule.get('allowed_status'), 'medium')
                
                # Ensure penalty_level and law_url have values (especially for SYS-AUTH-03)
                penalty_val = rule.get('penalty_level')
                url_val = rule.get('law_url')
                
                # Special handling for SYS-AUTH-03 (Brute Force) - provide fallback values
                if rule.get('rule_code') == 'SYS-AUTH-03':
                    if not penalty_val:
                        penalty_val = "Phạt tiền từ 40.000.000 đồng đến 60.000.000 đồng (Theo khoản 3 Điều 100 Nghị định 15/2020/NĐ-CP)"
                    if not url_val:
                        url_val = "https://mod.gov.vn/wps/wcm/connect/e542ef86-13a8-4448-9c60-a8868df4194d/Nghidinh13_CP.pdf?MOD=AJPERES&CVID=op07.7-"
                
                violation = {
                    'id': f"{log.get('id')}::{rule.get('rule_code')}",
                    'log_id': log.get('id'),
                    'timestamp': log.get('timestamp'),
                    # Đã được map trong _evaluate_log, sử dụng giá trị đã map
                    'user': log.get('actor_name') or (log.get('user_id') if log.get('role') != 'system' else 'Hệ thống'),
                    'user_id': log.get('user_id'),
                    'actor_name': log.get('actor_name'),
                    'role': log.get('role'),
                    'operation': log.get('operation'),
                    'method': log.get('method'),
                    'status': str(log.get('status')) if log.get('status') is not None else None,
                    'purpose': log.get('purpose'),
                    'uri': log.get('uri'),
                    'ip_address': log.get('ip_address'),
                    'patient_code': log.get('patient_code'),
                    'patient_name': log.get('patient_name'),
                    'rule_code': rule.get('rule_code'),
                    'rule_name': rule.get('rule_name'),
                    'law_source': rule.get('law_source'),
                    'legal_basis': rule.get('legal_basis'),
                    'penalty_level': penalty_val,
                    'law_url': url_val,
                    'allowed_status': rule.get('allowed_status'),
                    'severity': severity,
                    'missing_fields': missing_fields,
                    'functional_group': rule.get('functional_group'),
                    'has_violation': True,
                    'log_type': log.get('log_type'),
                    'violation_id': None,
                    'required_fields': rule.get('required_log_fields'),
                    'action_description': action_description,
                    'details': {
                        'explanation': rule.get('explanation'),
                        'tags': rule.get('tags'),
                        'law_source': rule.get('law_source'),
                        # Include captured_queries from original log for forensic trace
                        'captured_queries': details_json.get('captured_queries', []) if details_json else [],
                        'event_type': details_json.get('event_type') if details_json else None,
                        'rule_code': details_json.get('rule_code') if details_json else None,
                        'violation_reasons': details_json.get('violation_reasons', []) if details_json else [],
                        'severity': details_json.get('severity') if details_json else None,
                        'message': details_json.get('message') if details_json else None,
                        'log_snapshot': {
                            'action': log.get('action'),
                            'operation': log.get('operation'),
                            'changed_fields': self._parse_json(log.get('changed_fields')),
                            'request_body': self._parse_json(log.get('request_body')),
                            'response_body': self._parse_json(log.get('response_body')),
                            'details': self._parse_json(log.get('details')),
                        }
                    }
                }
                violations.append(violation)
            else:
                compliant_records.append({
                    'id': f"{log.get('id')}::{rule.get('rule_code')}::ok",
                    'log_id': log.get('id'),
                    'timestamp': log.get('timestamp'),
                    # Đã được map trong _evaluate_log, sử dụng giá trị đã map
                    'user': log.get('actor_name') or (log.get('user_id') if log.get('role') != 'system' else 'Hệ thống'),
                    'user_id': log.get('user_id'),
                    'actor_name': log.get('actor_name'),
                    'role': log.get('role'),
                    'operation': log.get('operation'),
                    'method': log.get('method'),
                    'status': str(log.get('status')) if log.get('status') is not None else None,
                    'purpose': log.get('purpose'),
                    'uri': log.get('uri'),
                    'ip_address': log.get('ip_address'),
                    'patient_code': log.get('patient_code'),
                    'patient_name': log.get('patient_name'),
                    'rule_code': rule.get('rule_code'),
                    'rule_name': rule.get('rule_name'),
                    'law_source': rule.get('law_source'),
                    'legal_basis': rule.get('legal_basis'),
                    'penalty_level': rule.get('penalty_level'),
                    'law_url': rule.get('law_url'),
                    'allowed_status': rule.get('allowed_status'),
                    'severity': 'compliant',
                    'missing_fields': [],
                    'functional_group': rule.get('functional_group'),
                    'has_violation': False,
                    'log_type': log.get('log_type'),
                    'violation_id': None,
                    'required_fields': rule.get('required_log_fields'),
                    'action_description': action_description,
                    'compliance_status': 'compliant',
                    'audit_proof': f"Checked {len(rule.get('required_log_fields', []))} fields: {', '.join(rule.get('required_log_fields', []))}",
                    'satisfied_fields': rule.get('required_log_fields'),
                    'details': {
                        'explanation': rule.get('explanation'),
                        'tags': rule.get('tags'),
                        'law_source': rule.get('law_source'),
                        'checked_fields': rule.get('required_log_fields'),
                        'log_snapshot': {
                            'action': log.get('action'),
                            'operation': log.get('operation'),
                            'changed_fields': self._parse_json(log.get('changed_fields')),
                            'request_body': self._parse_json(log.get('request_body')),
                            'response_body': self._parse_json(log.get('response_body')),
                            'details': self._parse_json(log.get('details')),
                        }
                    }
                })
        return violations, compliant_records

    def get_behavior_violations(
        self,
        page: int = 1,
        page_size: int = 25,
        since_hours: int = 48,
        severity: Optional[str] = None,
        rule_code: Optional[str] = None,
        status: str = 'violations',
        user_id: Optional[str] = None,
        user_role: Optional[str] = None,
        log_ids: Optional[List[str]] = None,
        since_seconds: Optional[int] = None,
        compliance_type: Optional[str] = None,  # 'user' or 'system' to filter compliance type
        from_date: Optional[str] = None,  # YYYY-MM-DD format
        to_date: Optional[str] = None,    # YYYY-MM-DD format
        group_by_log: bool = False  # Group results by log_id instead of showing each rule separately
    ) -> Dict[str, Any]:
        """Return behavior violations derived from logs and rules."""
        status = (status or 'violations').lower()
        logger.info(f"DEBUG: Entering get_behavior_violations. page={page}, since_hours={since_hours}, from={from_date}, to={to_date}")
        if status not in {'violations', 'compliant', 'all'}:
            status = 'violations'

        rules = self._get_behavior_rules()
        logger.info(f"DEBUG: Retrieved {len(rules) if rules else 0} rules")
        if not rules:
            logger.warning("No behavior rules found in database. Please add rules via Law Rule Catalog.")
            return {
                'data': [],
                'total': 0,
                'summary': {
                    'violations_found': 0,
                    'compliant_found': 0,
                    'logs_scanned': 0,
                    'since_hours': since_hours
                }
            }
        
        if rule_code:
            rules = [rule for rule in rules if rule.get('rule_code') == rule_code]

        # Fetch ALL logs from access_logs to ensure comprehensive evaluation
        logs = []
        if log_ids:
            logs = self._fetch_logs_by_ids(log_ids)
        else:
            # Calculate optimal limit based on date range
            if from_date and to_date:
                from_dt = datetime.strptime(from_date, '%Y-%m-%d')
                to_dt = datetime.strptime(to_date, '%Y-%m-%d')
                days_diff = (to_dt - from_dt).days
                # Optimize limit: 1 day = 1000, 7 days = 1500, 30 days = 3000
                if days_diff <= 1:
                    limit = 1000
                elif days_diff <= 7:
                    limit = 1500
                elif days_diff <= 30:
                    limit = 3000
                else:
                    limit = 5000
                logs = self._fetch_recent_logs(from_date=from_date, to_date=to_date, limit=limit)
            else:
                logs = self._fetch_recent_logs(since_hours=since_hours, since_seconds=since_seconds, limit=1500)
        
        logger.info(f"DEBUG: Fetched {len(logs)} logs from DB")
        
        # Filter by user_id if provided
        if user_id:
            filtered_logs = []
            for log in logs:
                log_user = (log.get('user_id') or log.get('actor_name') or '').lower().strip()
                filter_user = user_id.lower().strip()
                if log_user == filter_user:
                    filtered_logs.append(log)
            logs = filtered_logs
            logger.info(f"Filtered to {len(logs)} logs for user {user_id}")
        
        # Filter by user_role if provided (only when user_id is not specified)
        if user_role and not user_id:
            filtered_logs = []
            for log in logs:
                log_role = (log.get('role') or '').lower().strip()
                filter_role = user_role.lower().strip()
                if log_role == filter_role:
                    filtered_logs.append(log)
            logs = filtered_logs
            logger.info(f"Filtered to {len(logs)} logs for role {user_role}")
        
        # Filter by compliance_type (user vs system)
        if compliance_type and compliance_type != 'all':
            filtered_logs = []
            for log in logs:
                log_role = (log.get('role') or '').lower().strip()
                log_purpose = (log.get('purpose') or '').lower().strip()
                log_type = (log.get('log_type') or '').lower().strip()
                details_json = self._parse_json(log.get('details'))
                # CRITICAL: Handle None values from get() - use 'or' to default to empty string
                rule_scope = (details_json.get('rule_scope') or '') if details_json else ''
                rule_scope = rule_scope.lower().strip() if rule_scope else ''
                rule_group = (details_json.get('rule_group') or '') if details_json else ''
                rule_group = rule_group.lower().strip() if rule_group else ''
                
                if compliance_type == 'user':
                    # User compliance: user activities (even if role='system' for EMR logs)
                    # Include:
                    # 1. Non-system roles doing any activity
                    # 2. EMR access logs (patient views, queues, appointments) - actual user activity
                    # Exclude:
                    # 1. Pure infrastructure logs (backup, system_compliance, TLS, etc.)
                    is_user_activity = (
                        # Non-system role doing anything
                        (log_role != 'system') or
                        # EMR/Clinical activity logs (user viewing/editing patient data)
                        log_type in ['emr_access_log', 'prescription_log', 'admin_activity_log', 
                                     'session_log', 'access_log', 'api_log', 'network_log',
                                     'security_alert']  # Include WAF/security events as user-facing
                    )
                    # Explicitly exclude infrastructure logs
                    # NOTE: Do NOT use log_purpose here - EMR logs have purpose='system_compliance'
                    # but they are user activities, not infrastructure!
                    is_infrastructure = (
                        log_type.startswith('system_tls') or
                        log_type.startswith('system_backup')
                    )
                    
                    print(f"!!! COMPLIANCE_FILTER: log_id={log.get('id')[:8]}, log_type={log_type}, log_role={log_role}, is_user_activity={is_user_activity}, is_infrastructure={is_infrastructure}")
                    
                    if is_user_activity and not is_infrastructure:
                        filtered_logs.append(log)


                elif compliance_type == 'system':
                    # System compliance: role = 'system' OR purpose = 'backup_encryption' OR purpose = 'system_compliance' OR log_type starts with 'system_'
                    # CRITICAL: Also include auth logs with purpose='authentication' but rule_group='auth'
                    if (log_role == 'system' or 
                        log_purpose == 'backup_encryption' or 
                        log_purpose == 'system_compliance' or
                        (log_type and log_type.startswith('system_')) or
                        rule_scope == 'system' or
                        rule_group in ['tls', 'auth', 'app', 'log', 'database', 'db', 'infra', 'infrastructure', 'dlp', 'ops', 'operation', 'dsr', 'data_subject'] or
                        # CRITICAL: Include auth logs with purpose='authentication' but rule_group='auth' in details
                        (log_purpose == 'authentication' and rule_group == 'auth')):
                        filtered_logs.append(log)
            logs = filtered_logs
            logger.info(f"Filtered to {len(logs)} logs for compliance_type {compliance_type}")
        
        # DEBUG EXCEPTION
        # raise Exception(f"DEBUG: Rules={len(rules)}, Logs={len(logs)}")
        
        # Debug: Count TLS logs
        tls_logs = [log for log in logs if log.get('purpose') == 'system_compliance']
        logger.info(f"Found {len(tls_logs)} system_compliance logs (TLS/Auth/App/etc)")
        
        # Debug: Count TLS rules
        tls_rules = [rule for rule in rules if rule.get('rule_code', '').startswith('SYS-TLS')]
        logger.info(f"Found {len(tls_rules)} SYS-TLS rules")
        
        all_violations: List[Dict[str, Any]] = []
        all_compliant: List[Dict[str, Any]] = []

        # Load already evaluated results from cache (much faster than re-evaluating)
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        evaluated_results = {}  # {log_id: {'violations': [...], 'compliant': [...]}}
        evaluated_log_ids = set()
        try:
            if logs:
                log_ids = [str(log.get('id')) for log in logs if log.get('id')]
                if log_ids:
                    placeholders = ','.join(['%s'] * len(log_ids))
                    # Load all evaluation results for these logs
                    cursor.execute(f"""
                        SELECT log_id, predicted_label, applied_rules, violation_reasons
                        FROM log_evaluation_results 
                        WHERE log_id IN ({placeholders})
                    """, tuple(log_ids))
                    for row in cursor.fetchall():
                        log_id = str(row['log_id'])
                        evaluated_log_ids.add(log_id)
                        if log_id not in evaluated_results:
                            evaluated_results[log_id] = {'violations': [], 'compliant': []}
        finally:
            cursor.close()
            conn.close()

        # FORCE RE-EVALUATION: Ignore cache to ensure all logs appear and rule changes are reflected
        # logs_to_evaluate = [log for log in logs if str(log.get('id')) not in evaluated_log_ids]
        logs_to_evaluate = logs 
        
        # Evaluate logs
        for log in logs_to_evaluate:
            violations, compliant_records = self._evaluate_log(log, rules)
            all_violations.extend(violations)
            all_compliant.extend(compliant_records)
        
        logger.info(f"Evaluation complete: {len(all_violations)} violations, {len(all_compliant)} compliant records")

        # Apply severity filter
        filtered_violations = all_violations
        if severity and severity.lower() != 'all':
            all_violations = [
                v for v in all_violations
                if (v.get('severity') or '').lower() == severity.lower()
            ]
            filtered_violations = all_violations

        if status == 'violations':
            dataset = filtered_violations
        elif status == 'compliant':
            dataset = all_compliant
        else:  # 'all' - show both violations and compliant
            dataset = filtered_violations + all_compliant

        # Group by log_id if requested (BEFORE pagination)
        logger.info(f"[GROUPING_DEBUG] group_by_log={group_by_log}, dataset_len={len(dataset) if dataset else 0}")
        if group_by_log and dataset:
            logger.info(f"[GROUPING_DEBUG] Starting grouping for {len(dataset)} records")
            grouped_data = {}
            for record in dataset:  # Group from full dataset
                log_id = record.get('log_id')
                if not log_id:
                    continue
                
                if log_id not in grouped_data:
                    # Initialize grouped record with first occurrence's data
                    grouped_data[log_id] = {
                        'log_id': log_id,
                        'timestamp': record.get('timestamp'),
                        'user': record.get('user'),
                        'user_id': record.get('user_id'),
                        'actor_name': record.get('actor_name'),
                        'role': record.get('role'),
                        'action': record.get('action'),
                        'operation': record.get('operation'),
                        'method': record.get('method'),
                        'status': record.get('status'),
                        'purpose': record.get('purpose'),
                        'uri': record.get('uri'),
                        'ip_address': record.get('ip_address'),
                        'source_ip': record.get('ip_address'),  # Alias for frontend compatibility
                        'details': record.get('details'),
                        'patient_code': record.get('patient_code'),
                        'patient_name': record.get('patient_name'),
                        'log_type': record.get('log_type'),
                        'functional_group': record.get('functional_group'),
                        'rule_code': record.get('rule_code'),  # Take from first violation
                        'rule_name': record.get('rule_name'),  # Take from first violation
                        'legal_basis': record.get('legal_basis'),  # Take from first violation
                        'law_url': record.get('law_url'),  # ADDED for frontend
                        'penalty_level': record.get('penalty_level'),  # ADDED for frontend
                        'total_rules': 0,
                        'passed_rules': 0,
                        'failed_rules': 0,
                        'has_violation': False,
                        'rules_detail': []
                    }
                
                # Aggregate rule results
                grouped_data[log_id]['total_rules'] += 1
                if record.get('has_violation'):
                    grouped_data[log_id]['failed_rules'] += 1
                    grouped_data[log_id]['has_violation'] = True
                else:
                    grouped_data[log_id]['passed_rules'] += 1
                
                # Add rule detail
                grouped_data[log_id]['rules_detail'].append({
                    'rule_code': record.get('rule_code'),
                    'rule_name': record.get('rule_name'),
                    'law_source': record.get('law_source'),
                    'legal_basis': record.get('legal_basis'),
                    'penalty_level': record.get('penalty_level'),
                    'law_url': record.get('law_url'),
                    'allowed_status': record.get('allowed_status'),
                    'severity': record.get('severity'),
                    'missing_fields': record.get('missing_fields', []),
                    'has_violation': record.get('has_violation', False)
                })
            
            # Convert to list and sort by timestamp descending
            dataset = list(grouped_data.values())
            dataset.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            logger.info(f"[GROUPING_DEBUG] Grouped into {len(dataset)} unique logs")
        else:
            # ALWAYS sort by timestamp (newest first) - even for ungrouped data
            # This ensures logs appear in real-time order, not violations-first
            dataset.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            logger.info(f"[SORTING] Sorted {len(dataset)} records by timestamp (newest first)")

        # Paginate (works for both grouped and ungrouped)
        total = len(dataset)
        start = max((page - 1) * page_size, 0)
        end = start + page_size
        data = dataset[start:end]
        logger.info(f"[GROUPING_DEBUG] Returning {len(data)} records (page {page}, total={total})")

        summary = {
            'total_rules': len(rules),
            'rules_with_fields': sum(1 for r in rules if r.get('required_log_fields')),
            'logs_scanned': len(logs),
            'violations_found': len(filtered_violations),
            'compliant_found': len(all_compliant),
            'since_hours': since_hours if not (from_date and to_date) else None,
            'since_seconds': since_seconds if not (from_date and to_date) else None,
            'from_date': from_date,
            'to_date': to_date,
            'status': status,
        }

        return {
            'data': data,
            'total': total,
            'summary': summary
        }

    def evaluate_log_payload(self, log_payload: Dict[str, Any], rule_code: Optional[str] = None) -> Dict[str, Any]:
        """Evaluate a single raw log object against existing rules."""
        if not isinstance(log_payload, dict):
            raise ValueError("log payload must be an object")

        log = dict(log_payload)

        # Normalize basic fields
        if not log.get('timestamp') and log.get('ts'):
            log['timestamp'] = log.get('ts')
        if not log.get('actor_name') and log.get('user'):
            log['actor_name'] = log.get('user')
        if not log.get('user'):
            log['user'] = log.get('actor_name') or log.get('user_id')

        # Ensure log_type is derived
        if not log.get('log_type'):
            log['log_type'] = self._derive_log_type(log)

        rules = self._get_behavior_rules()
        if rule_code:
            rules = [rule for rule in rules if rule.get('rule_code') == rule_code]

        if not rules:
            return {
                'violations': [],
                'compliant': [],
                'summary': {
                    'log_id': log.get('id'),
                    'timestamp': log.get('timestamp'),
                    'user': log.get('user'),
                    'rules_checked': 0,
                    'message': 'Không có quy tắc phù hợp để so sánh.'
                }
            }

        violations, compliant_records = self._evaluate_log(log, rules)
        summary = {
            'log_id': log.get('id'),
            'timestamp': log.get('timestamp'),
            'user': log.get('user') or log.get('actor_name') or log.get('user_id'),
            'rules_checked': len(rules),
            'violations_found': len(violations),
            'compliant_found': len(compliant_records),
            'log_type': log.get('log_type'),
        }

        return {
            'violations': violations,
            'compliant': compliant_records,
            'summary': summary
        }

    def _evaluate_backup_encryption_rules(self, log: Dict[str, Any]) -> Tuple[List[Dict], List[Dict]]:
        """
        Evaluate log về backup & encryption theo 14 rules
        Returns: (violations, compliant_records)
        """
        violations = []
        compliant_records = []
        
        log_type = log.get('log_type')
        if log_type not in ['emr_encryption', 'emr_backup', 'emr_delete']:
            return violations, compliant_records
        
        # Lấy rules từ database (functional_group = 'Backup_Encryption')
        rules = self._get_backup_encryption_rules()
        
        for rule in rules:
            rule_code = rule.get('rule_code', '')
            rule_name = rule.get('rule_name', '')
            severity_map = {
                'High': 'high',
                'Medium': 'medium',
                'Low': 'low',
                'Critical': 'critical'
            }
            
            # Check rule theo rule_code
            if rule_code == 'SYS-ENC-01':
                # Mã hoá At-Rest Bắt Buộc
                encryption_status = log.get('encryption_status')
                if encryption_status == 'not_encrypted' or not encryption_status:
                    violations.append({
                        'rule_code': rule_code,
                        'rule_name': rule_name,
                        'severity': 'high',
                        'message': 'Medical record không được mã hoá at-rest',
                        'log_id': log.get('event_id')
                    })
            
            elif rule_code == 'SYS-ENC-02':
                # Thuật Toán Mã Hoá Được Phê Duyệt
                encryption_algo = log.get('encryption_algo') or log.get('backup_encryption_algo')
                allowed_algos = log.get('allowed_algos', ['AES-256-GCM', 'AES-128-GCM', 'ChaCha20-Poly1305', 'AES-256-CBC'])
                if encryption_algo and encryption_algo not in allowed_algos:
                    violations.append({
                        'rule_code': rule_code,
                        'rule_name': rule_name,
                        'severity': 'high',
                        'message': f'Thuật toán mã hoá {encryption_algo} không được phê duyệt. Danh sách được phê duyệt: {allowed_algos}',
                        'log_id': log.get('event_id')
                    })
            
            elif rule_code == 'SYS-ENC-03':
                # Log Thiếu Trường Bắt Buộc
                required_fields = rule.get('required_log_fields', [])
                if isinstance(required_fields, str):
                    required_fields = [f.strip() for f in required_fields.split(',')]
                missing_fields = [f for f in required_fields if f and (f not in log or log.get(f) is None)]
                if missing_fields:
                    violations.append({
                        'rule_code': rule_code,
                        'rule_name': rule_name,
                        'severity': 'medium',
                        'message': f'Log thiếu trường bắt buộc: {", ".join(missing_fields)}',
                        'missing_fields': missing_fields,
                        'log_id': log.get('event_id')
                    })
            
            elif rule_code == 'SYS-ENC-04':
                # Giải Mã Bởi Role Không Được Phép
                action = log.get('action') or log.get('event_type', '')
                encryption_status = log.get('encryption_status')
                actor_role = log.get('actor_role', '')
                allowed_roles = log.get('allowed_roles', ['doctor', 'admin', 'emergency_team', 'chief_doctor'])
                
                if action in ['DECRYPT_EMR', 'VIEW_PHI', 'DECRYPT_RECORD'] and encryption_status == 'encrypted':
                    if actor_role not in allowed_roles:
                        emergency_flag = log.get('emergency_flag', False)
                        approval_id = log.get('approval_id')
                        if not emergency_flag or not approval_id:
                            violations.append({
                                'rule_code': rule_code,
                                'rule_name': rule_name,
                                'severity': 'high',
                                'message': f'Role {actor_role} không được phép giải mã. Roles được phép: {allowed_roles}',
                                'log_id': log.get('event_id')
                            })
            
            elif rule_code == 'SYS-ENC-05':
                # Encryption In-Transit
                encryption_in_transit = log.get('encryption_in_transit')
                tls_version = log.get('tls_version', '')
                if encryption_in_transit is False or (tls_version and float(tls_version.replace('TLS', '').replace('SSL', '')) < 1.2):
                    violations.append({
                        'rule_code': rule_code,
                        'rule_name': rule_name,
                        'severity': 'high',
                        'message': f'Không mã hoá khi truyền hoặc TLS version < 1.2 (hiện tại: {tls_version})',
                        'log_id': log.get('event_id')
                    })
            
            elif rule_code == 'SYS-ENC-06':
                # Key Rotation
                key_age_days = log.get('key_age_days')
                if key_age_days and key_age_days > 365:
                    violations.append({
                        'rule_code': rule_code,
                        'rule_name': rule_name,
                        'severity': 'medium',
                        'message': f'Encryption key đã quá 12 tháng (key_age_days: {key_age_days}), cần rotate',
                        'log_id': log.get('event_id')
                    })
            
            elif rule_code == 'SYS-BKP-01':
                # Backup Đúng Tần Suất
                job_status = log.get('job_status')
                if job_status in ['FAILED', 'SKIPPED']:
                    violations.append({
                        'rule_code': rule_code,
                        'rule_name': rule_name,
                        'severity': 'high',
                        'message': f'Backup job thất bại hoặc bị bỏ qua (status: {job_status})',
                        'log_id': log.get('event_id')
                    })
            
            elif rule_code == 'SYS-BKP-02':
                # Backup Phải Được Mã Hoá
                backup_encrypted = log.get('backup_encrypted')
                backup_encryption_algo = log.get('backup_encryption_algo')
                allowed_algos = log.get('allowed_algos', ['AES-256-GCM', 'AES-128-GCM', 'ChaCha20-Poly1305', 'AES-256-CBC'])
                if backup_encrypted is False:
                    violations.append({
                        'rule_code': rule_code,
                        'rule_name': rule_name,
                        'severity': 'high',
                        'message': 'Backup không được mã hoá',
                        'log_id': log.get('event_id')
                    })
                elif backup_encryption_algo and backup_encryption_algo not in allowed_algos:
                    violations.append({
                        'rule_code': rule_code,
                        'rule_name': rule_name,
                        'severity': 'high',
                        'message': f'Backup dùng thuật toán không được phê duyệt: {backup_encryption_algo}',
                        'log_id': log.get('event_id')
                    })
            
            elif rule_code == 'SYS-BKP-03':
                # Xoá Trước Hạn Retention
                action = log.get('action') or log.get('event_type', '')
                if action in ['DELETE_EMR', 'DELETE_BACKUP', 'DELETE_RECORD']:
                    retention_until = log.get('retention_until') or log.get('retention_expiry_at')
                    delete_time = log.get('timestamp') or log.get('delete_requested_at')
                    if retention_until and delete_time:
                        try:
                            from datetime import datetime
                            retention_date = datetime.fromisoformat(retention_until.replace('Z', '+00:00'))
                            delete_date = datetime.fromisoformat(delete_time.replace('Z', '+00:00'))
                            if delete_date < retention_date:
                                violations.append({
                                    'rule_code': rule_code,
                                    'rule_name': rule_name,
                                    'severity': 'critical',
                                    'message': f'Xoá medical record/backup trước hạn retention (retention_until: {retention_until}, delete_time: {delete_time})',
                                    'log_id': log.get('event_id')
                                })
                        except Exception as e:
                            logger.warning(f"Error parsing dates for retention check: {e}")
            
            elif rule_code == 'SYS-BKP-04':
                # Restore Test Thất Bại
                restore_test_status = log.get('restore_test_status')
                error_code = log.get('error_code')
                if restore_test_status == 'FAILED' or error_code in ['KEY_NOT_FOUND', 'DECRYPT_FAILED', 'KEY_EXPIRED']:
                    violations.append({
                        'rule_code': rule_code,
                        'rule_name': rule_name,
                        'severity': 'high',
                        'message': f'Restore test thất bại (status: {restore_test_status}, error: {error_code})',
                        'log_id': log.get('event_id')
                    })
            
            elif rule_code == 'SYS-BKP-05':
                # Retention Policy Bắt Buộc
                retention_policy = log.get('retention_policy')
                retention_days = log.get('retention_days')
                min_required_days = log.get('min_required_days', 2555)  # 7 năm cho EMR
                if not retention_policy or (retention_days and retention_days < min_required_days):
                    violations.append({
                        'rule_code': rule_code,
                        'rule_name': rule_name,
                        'severity': 'high',
                        'message': f'Retention policy không hợp lệ (policy: {retention_policy}, days: {retention_days}, min: {min_required_days})',
                        'log_id': log.get('event_id')
                    })
            
            elif rule_code == 'SYS-BKP-06':
                # Immutable Backup
                backup_immutable = log.get('backup_immutable')
                if backup_immutable is False:
                    violations.append({
                        'rule_code': rule_code,
                        'rule_name': rule_name,
                        'severity': 'high',
                        'message': 'Backup không được lưu ở immutable storage (WORM/object lock)',
                        'log_id': log.get('event_id')
                    })
            
            elif rule_code == 'SYS-BKP-07':
                # Offsite Backup
                offsite_backup_exists = log.get('offsite_backup_exists')
                if offsite_backup_exists is False:
                    violations.append({
                        'rule_code': rule_code,
                        'rule_name': rule_name,
                        'severity': 'high',
                        'message': 'Không có backup offsite (vi phạm chiến lược 3-2-1)',
                        'log_id': log.get('event_id')
                    })
            
            elif rule_code == 'SYS-BKP-08':
                # Backup Verification
                backup_verified = log.get('backup_verified')
                backup_checksum = log.get('backup_checksum')
                if backup_verified is False or not backup_checksum:
                    violations.append({
                        'rule_code': rule_code,
                        'rule_name': rule_name,
                        'severity': 'medium',
                        'message': 'Backup không có checksum hoặc chưa được verify',
                        'log_id': log.get('event_id')
                    })
            
            # Nếu không vi phạm rule này, đánh dấu compliant
            if not any(v['rule_code'] == rule_code for v in violations):
                compliant_records.append({
                    'rule_code': rule_code,
                    'rule_name': rule_name,
                    'status': 'compliant'
                })
        
        return violations, compliant_records

    def _get_backup_encryption_rules(self) -> List[Dict[str, Any]]:
        """Lấy 14 rules về backup & encryption từ database"""
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT id, law_source, rule_code, rule_name, allowed_status,
                       legal_basis,
                       explanation,
                       COALESCE(required_log_fields, log_fields) as log_fields_data,
                       functional_group
                FROM siem_law_rules
                WHERE functional_group = 'Backup_Encryption'
                   OR rule_code LIKE 'SYS-ENC-%'
                   OR rule_code LIKE 'SYS-BKP-%'
                ORDER BY rule_code
            """)
            rows = cursor.fetchall()
            rules = []
            for row in rows:
                try:
                    # Parse log_fields
                    log_fields_data = row.get('log_fields_data')
                    if isinstance(log_fields_data, str):
                        import json
                        row['required_log_fields'] = json.loads(log_fields_data)
                    elif isinstance(log_fields_data, list):
                        row['required_log_fields'] = log_fields_data
                    else:
                        row['required_log_fields'] = []
                    
                    # CRITICAL: Handle optional/computable fields
                    # If session_start is missing but we have timestamp, we can assume session starts now (for new logins)
                    if 'session_start' in missing_fields and 'timestamp' in log:
                         missing_fields.remove('session_start')
                         
                    # If mfa_used is missing but auth_method is present, technically we have auth info (context dependent)
                    # But for SYS-AUTH-01 we strictly need mfa_used, so keep it required there.
                    
                    # Filter out fields that are present in details JSON
                    # (This is already done partially above but let's be robust)
                    final_missing = []
                    for field in missing_fields:
                        if field not in log:
                             # Double check details
                             details_obj = self._parse_json(log.get('details'))
                             if not details_obj or field not in details_obj:
                                 final_missing.append(field)
                    
                    missing_fields = final_missing
                    
                    # Parse tags
                    tags = row.get('tags')
                    if isinstance(tags, str):
                        import json
                        row['tags'] = json.loads(tags)
                    elif not isinstance(tags, list):
                        row['tags'] = []
                    
                    rules.append(row)
                except Exception as e:
                    logger.warning(f"Error parsing rule {row.get('rule_code')}: {e}")
                    continue
            return rules
        finally:
            cursor.close()
            conn.close()


"""
Keycloak Event Collector - Collects authentication events from Keycloak and sends to SIEM database

This script:
1. Uses Keycloak Admin REST API to fetch authentication events
2. Detects brute-force patterns (multiple failed logins)
3. Inserts events into access_logs table for SIEM monitoring
"""
import os
import json
import requests
import mysql.connector
from datetime import datetime, timedelta, timezone
import logging

# Local timezone offset (UTC+7 for Vietnam)
LOCAL_TZ = timezone(timedelta(hours=7))

def get_local_time():
    """Get current time in local timezone (+07:00)"""
    return datetime.now(LOCAL_TZ).replace(tzinfo=None)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KeycloakEventCollector:
    def __init__(self):
        self.keycloak_url = os.getenv('KEYCLOAK_URL', 'http://keycloak:8080')
        self.realm = os.getenv('KEYCLOAK_REALM', 'ClinicRealm')
        self.client_id = 'admin-cli'  # Must use admin-cli for Keycloak Admin API
        self.admin_user = os.getenv('KEYCLOAK_ADMIN_USER', 'admin')
        self.admin_password = os.getenv('KEYCLOAK_ADMIN_PASSWORD', '123456789')
        
        self.db_config = {
            'host': os.getenv('DB_HOST', 'mariadb'),
            'user': os.getenv('DB_USER', 'openemr'),
            'password': os.getenv('DB_PASSWORD', 'Openemr!123'),
            'database': os.getenv('DB_NAME', 'ehr_core'),
            'charset': 'utf8mb4',
            'use_unicode': True
        }
        
        # Brute-force detection threshold
        self.brute_force_threshold = 5
        self.brute_force_window_minutes = 5
    
    def _get_user_role(self, username, cursor):
        """Get user role from username patterns or database"""
        if not username:
            return 'user'
        
        # PRIORITY 1: Determine role from username patterns (most reliable)
        username_lower = username.lower()
        if 'admin' in username_lower:
            return 'admin'
        elif 'nurse' in username_lower or username_lower.startswith('dd.'):
            return 'nurse'
        elif 'letan' in username_lower or 'receptionist' in username_lower:
            return 'receptionist'  # Reception/letan staff as receptionist role
        elif 'patient' in username_lower or 'bn.' in username_lower:
            return 'patient'
        
        # PRIORITY 2: Try to get role from existing access_logs (fallback)
        try:
            cursor.execute("""
                SELECT role FROM access_logs 
                WHERE user_id = %s AND role IS NOT NULL AND role NOT IN ('user', 'system')
                ORDER BY timestamp DESC LIMIT 1
            """, (username,))
            result = cursor.fetchone()
            if result and result[0]:
                return result[0]
        except:
            pass
        
        return 'user'
        
    def get_admin_token(self):
        """Get admin access token from Keycloak"""
        try:
            url = f"{self.keycloak_url}/realms/master/protocol/openid-connect/token"
            data = {
                'grant_type': 'password',
                'client_id': self.client_id,
                'username': self.admin_user,
                'password': self.admin_password
            }
            resp = requests.post(url, data=data, timeout=10)
            if resp.status_code == 200:
                return resp.json()['access_token']
            else:
                logger.error(f"Failed to get admin token: {resp.status_code} - {resp.text}")
                return None
        except Exception as e:
            logger.error(f"Error getting admin token: {e}")
            return None
    
    def get_events(self, token, event_types=None, max_results=100, since_minutes=30):
        """Fetch authentication events from Keycloak Admin API"""
        try:
            url = f"{self.keycloak_url}/admin/realms/{self.realm}/events"
            headers = {'Authorization': f'Bearer {token}'}
            
            # Calculate date range
            date_from = (datetime.utcnow() - timedelta(minutes=since_minutes)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
            
            params = {
                'max': max_results,
                'dateFrom': date_from
            }
            
            if event_types:
                params['type'] = event_types
            
            resp = requests.get(url, headers=headers, params=params, timeout=30)
            if resp.status_code == 200:
                return resp.json()
            else:
                logger.error(f"Failed to get events: {resp.status_code} - {resp.text}")
                return []
        except Exception as e:
            logger.error(f"Error getting events: {e}")
            return []
    
    def insert_event_to_db(self, event, is_brute_force=False):
        """Insert Keycloak event into access_logs table"""
        try:
            conn = mysql.connector.connect(**self.db_config)
            cur = conn.cursor()
            
            # Parse event data
            event_time = datetime.fromtimestamp(event.get('time', 0) / 1000)
            event_type = event.get('type', '')
            error = event.get('error', '')
            username = event.get('details', {}).get('username', event.get('userId', 'unknown'))
            ip_address = event.get('ipAddress', '')
            
            # Determine action and status based on event type
            if event_type == 'LOGIN':
                action = f"Đăng nhập thành công - {username}"
                status = 200
                log_type = 'SYSTEM_AUTH_LOG'
                has_violation = False
            elif event_type == 'LOGIN_ERROR':
                if error == 'invalid_user_credentials':
                    action = f"Đăng nhập thất bại - Sai mật khẩu - {username}"
                    status = 401
                elif error == 'user_temporarily_disabled':
                    action = f"Tài khoản bị khóa - {username}"
                    status = 423
                elif error == 'user_not_found':
                    action = f"Đăng nhập thất bại - Người dùng không tồn tại - {username}"
                    status = 401
                else:
                    action = f"Đăng nhập thất bại - {error} - {username}"
                    status = 401
                log_type = 'SYSTEM_AUTH_LOG'
                has_violation = True
            elif event_type == 'LOGOUT':
                action = f"Đăng xuất - {username}"
                status = 200
                log_type = 'SYSTEM_AUTH_LOG'
                has_violation = False
            else:
                action = f"{event_type} - {username}"
                status = 200
                log_type = 'SYSTEM_AUTH_LOG'
                has_violation = False
            
            # Create brute-force alert if detected
            if is_brute_force:
                action = f"[CẢNH BÁO] BRUTE-FORCE ATTACK DETECTED - {username}"
                log_type = 'SECURITY_ALERT'
                has_violation = True
                status = 403
                # REMOVED: Do NOT override timestamp here.
                # Keeping original event_time allows duplicate detection to work correctly.
                # The consolidated BRUTE_FORCE_ALERT event (created later) uses current time.
            
            # UNIQUE IDENTIFIER: Use Keycloak's event time (milliseconds) as unique event ID
            # This is more reliable than comparing datetime which has precision issues
            keycloak_event_time_ms = event.get('time', 0)
            
            # Build details JSON - with unique event ID
            details = {
                'keycloak_event_id': f"{keycloak_event_time_ms}_{username}_{event_type}",  # Unique key
                'event_type': event_type,
                'error': error,
                'ip_address': ip_address,
                'username': username,
                'realm': self.realm,
                'client_id': event.get('clientId', ''),
                'session_id': event.get('sessionId', ''),
                'auth_method': event.get('details', {}).get('auth_method', 'openid-connect'),
                'is_brute_force': is_brute_force,
                'rule_code': 'R-IAM-06' if is_brute_force else ('R-IAM-03' if has_violation else 'SYS-AUTH-01'),
                'rule_name': 'Brute-force Protection' if is_brute_force else ('Authentication Failure' if has_violation else 'Authentication Success')
            }
            
            # ROBUST DUPLICATE CHECK: Search for keycloak_event_id in details JSON
            # This works regardless of action text changes or timestamp precision
            keycloak_event_id = f"{keycloak_event_time_ms}_{username}_{event_type}"
            check_sql = """
                SELECT COUNT(*) FROM access_logs 
                WHERE details LIKE %s
            """
            cur.execute(check_sql, (f'%"keycloak_event_id": "{keycloak_event_id}"%',))
            exists = cur.fetchone()[0] > 0
            
            if exists:
                cur.close()
                conn.close()
                return False  # Skip duplicate
            
            # Generate unique ID for this log
            import uuid
            log_id = str(uuid.uuid4())
            
            # Build client_location from realm and clientId
            client_id_val = event.get('clientId', 'unknown')
            client_location = f"{self.realm}/{client_id_val}"
            
            # Insert into access_logs
            sql = """
                INSERT INTO access_logs 
                (id, timestamp, user_id, action, status, ip_address, role, log_type, purpose, details, client_location)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                log_id,
                event_time,
                username,
                action,
                status,
                ip_address,
                self._get_user_role(username, cur),  # Get role from database or username
                log_type,
                'authentication',
                json.dumps(details, ensure_ascii=False),
                client_location
            )
            
            cur.execute(sql, values)
            conn.commit()
            
            logger.info(f"Inserted event: {action} at {event_time}")
            
            cur.close()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Error inserting event to DB: {e}")
            return False
    
    def detect_brute_force(self, events):
        """Detect brute-force patterns from events"""
        # Group login failures and successes by username and IP
        failures = {}
        successes = {}
        
        for event in events:
            username = event.get('details', {}).get('username', '')
            ip = event.get('ipAddress', '')
            key = f"{username}|{ip}"
            event_time = event.get('time', 0)
            
            if event.get('type') == 'LOGIN_ERROR':
                if key not in failures:
                    failures[key] = []
                failures[key].append({'time': event_time, 'event': event})
            elif event.get('type') == 'LOGIN':
                if key not in successes:
                    successes[key] = []
                successes[key].append({'time': event_time, 'event': event})
        
        # Check for brute-force (threshold exceeded AND no successful login after)
        brute_force_users = []
        for key, failed_events in failures.items():
            if len(failed_events) >= self.brute_force_threshold:
                username, ip = key.split('|')
                last_failed_time = max(f['time'] for f in failed_events)
                
                # Check if user has successful login AFTER the last failed attempt
                user_successes = successes.get(key, [])
                has_success_after_fails = any(s['time'] > last_failed_time for s in user_successes)
                
                if has_success_after_fails:
                    logger.info(f"Skipping brute-force alert for {username} - user logged in successfully after failed attempts")
                    continue
                
                brute_force_users.append({
                    'username': username,
                    'ip': ip,
                    'attempts': len(failed_events),
                    'last_event': failed_events[-1]['event']
                })
                logger.warning(f"BRUTE-FORCE DETECTED: {username} from {ip} - {len(failed_events)} attempts")
        
        return brute_force_users
    
    def collect_and_process(self):
        """Main collection process"""
        logger.info("Starting Keycloak Event Collection...")
        
        # Get admin token
        token = self.get_admin_token()
        if not token:
            logger.error("Failed to authenticate to Keycloak Admin API")
            return
        
        # Fetch login-related events
        # CRITICAL FIX: Only fetch events from the last 5 minutes (not 60!) to prevent
        # repeated processing of stale events and duplicate alerts.
        events = self.get_events(
            token,
            event_types=['LOGIN', 'LOGIN_ERROR', 'LOGOUT'],
            max_results=200,
            since_minutes=5  # Changed from 60 to 5
        )
        
        logger.info(f"Fetched {len(events)} events from Keycloak")
        
        # Detect brute-force patterns
        brute_force_users = self.detect_brute_force(events)
        
        # Insert events to database
        # CRITICAL FIX: Do NOT flag individual LOGIN_ERROR as is_brute_force
        # Only the consolidated BRUTE_FORCE_ALERT (created below) should be flagged
        inserted = 0
        for event in events:
            # Always insert as normal event (is_brute_force=False)
            # This prevents spam of individual "BRUTE-FORCE ATTACK DETECTED" logs
            if self.insert_event_to_db(event, is_brute_force=False):
                inserted += 1
        
        # Create separate brute-force alert events (with cooldown to prevent spam)
        for bf in brute_force_users:
            # Check if alert was already created for this user in last 10 minutes
            try:
                conn = mysql.connector.connect(**self.db_config)
                cur = conn.cursor()
                cooldown_check = """
                    SELECT COUNT(*) FROM access_logs 
                    WHERE user_id = %s 
                    AND log_type = 'SECURITY_ALERT' 
                    AND action LIKE '%BRUTE-FORCE%'
                    AND timestamp > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
                """
                cur.execute(cooldown_check, (bf['username'],))
                recent_alerts = cur.fetchone()[0]
                cur.close()
                conn.close()
                
                if recent_alerts > 0:
                    logger.info(f"Skipping duplicate brute-force alert for {bf['username']} (cooldown active)")
                    continue
            except Exception as e:
                logger.error(f"Error checking cooldown: {e}")
            
            alert_event = {
                'type': 'BRUTE_FORCE_ALERT',
                'time': int(datetime.utcnow().timestamp() * 1000),
                'ipAddress': bf['ip'],
                'details': {'username': bf['username']},
                'error': f"brute_force_detected_{bf['attempts']}_attempts"
            }
            self.insert_event_to_db(alert_event, is_brute_force=True)
        
        logger.info(f"Inserted {inserted} events to database")
        logger.info(f"Detected {len(brute_force_users)} brute-force attacks")
        
        return {
            'events_fetched': len(events),
            'events_inserted': inserted,
            'brute_force_alerts': len(brute_force_users)
        }


if __name__ == '__main__':
    collector = KeycloakEventCollector()
    result = collector.collect_and_process()
    print(f"Collection result: {result}")

"""
OPA Collector - Real Log Tailing Version
Collects ACTUAL policy decisions triggered by OPA decision logs.

This script:
1. Tails the OPA decision log file (redirected from stdout)
2. Parses valid JSON decision logs
3. Inserts into access_logs table
"""
import os
import json
import mysql.connector
from datetime import datetime, timedelta, timezone
import logging
import uuid
import time

# Local timezone offset (UTC+7 for Vietnam)
LOCAL_TZ = timezone(timedelta(hours=7))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OPACollector:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'mariadb'),
            'user': os.getenv('DB_USER', 'openemr'),
            'password': os.getenv('DB_PASSWORD', 'Openemr!123'),
            'database': os.getenv('DB_NAME', 'ehr_core'),
            'charset': 'utf8mb4',
            'use_unicode': True
        }
        
        # Log file path (mounted from shared volume)
        self.log_file = os.getenv('OPA_LOG_FILE', '/shared/opa-logs/decisions.log')
        
        # Position file to track reading progress (Byte offset)
        self.position_file = '/tmp/opa_collector_position.txt'

    def get_last_position(self):
        """Get the last byte offset read from the log file"""
        try:
            if os.path.exists(self.position_file):
                with open(self.position_file, 'r') as f:
                    content = f.read().strip()
                    return int(content) if content else 0
        except Exception as e:
            logger.warning(f"Could not read position file: {e}")
        return 0

    def save_position(self, position):
        """Save the current byte offset"""
        try:
            with open(self.position_file, 'w') as f:
                f.write(str(position))
        except Exception as e:
            logger.error(f"Error saving position: {e}")

    def parse_opa_log(self, line):
        """
        Parse OPA decision log output.
        Note: The file may contain non-JSON lines (startup info), so we must validat.
        Expected JSON structure:
        {
          "decision_id": "...",
          "input": { "user": ..., "path": ... },
          "result": { "allow": true/false, ... },
          "time": "..."
        }
        """
        try:
            # 1. Try to parse JSON
            entry = json.loads(line)
            
            # 2. Filter: Only process Decision Logs (must have decision_id)
            if 'decision_id' not in entry:
                return None
                
            # 3. Extract core fields
            # OPA standard time format: 2023-10-27T03:00:00Z
            log_time = datetime.now(LOCAL_TZ) # Default to now if parsing fails
            if 'time' in entry:
                try:
                    # Parse ISO format (handling Z for UTC)
                    dt = datetime.fromisoformat(entry['time'].replace('Z', '+00:00'))
                    log_time = dt.astimezone(LOCAL_TZ)
                except:
                    pass

            input_data = entry.get('input', {})
            result_data = entry.get('result', {})
            
            # 4. Construct Normalized Log Object
            parsed_log = {
                'timestamp': log_time.replace(tzinfo=None), # Remove timezone for MySQL
                'decision_id': entry.get('decision_id'),
                'user_id': input_data.get('user', {}).get('id', 'anonymous'),
                'input': input_data,
                'result': result_data,
                'path': input_data.get('path', 'unknown'),
                'method': input_data.get('method', 'unknown'),
                'allow': result_data if isinstance(result_data, bool) else result_data.get('allow', False)
                # Note: 'result' key in OPA output matches the output of policy.
                # If policy returns boolean, result is bool. If object, result is object.
            }
            
            # Handle result structure (policy.rego usually returns object with Allow/Reason)
            # But header 'default allow = false' usually implies base response is object?
            # Actually, standard OPA decision logpar 'result' captures the EVALUATION RESULT.
            # If query is 'data.http.authz.allow', result is boolean.
            # If query is 'data.http.authz', result is {allow: ..., reason: ...}
            
            return parsed_log
            
        except json.JSONDecodeError:
            return None # Ignore non-JSON lines
        except Exception as e:
            logger.error(f"Error parsing log line: {e}")
            return None

    def insert_log_to_db(self, log_entry):
        """Insert parsed decision into database"""
        try:
            conn = mysql.connector.connect(**self.db_config)
            cur = conn.cursor()
            
            log_id = str(uuid.uuid4())
            
            # Determine Action String
            status_code = 200 if log_entry['allow'] else 403
            action_verb = "ALLOW" if log_entry['allow'] else "DENY"
            action = f"Policy: {action_verb} {log_entry['method']} {log_entry['path']}"

            # Build Details JSON
            details = {
                'decision_id': log_entry['decision_id'],
                'input': log_entry['input'],
                'result': log_entry['result'],
                'source': 'opa_decision_log'
            }
            
            # Check Duplicate (using decision_id which is unique from OPA)
            check_sql = "SELECT COUNT(*) FROM access_logs WHERE details LIKE %s"
            cur.execute(check_sql, (f'%"decision_id": "{log_entry["decision_id"]}"%',))
            if cur.fetchone()[0] > 0:
                cur.close()
                conn.close()
                return False

            # Insert
            sql = """
                INSERT INTO access_logs 
                (id, timestamp, user_id, role, action, status, log_type, purpose, details)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            # Determine Role (from input)
            user_roles = log_entry['input'].get('user', {}).get('roles', [])
            role_str = user_roles[0] if user_roles else 'unknown'

            values = (
                log_id,
                log_entry['timestamp'],
                log_entry['user_id'],
                role_str,
                action,
                status_code,
                'POLICY_LOG',
                'policy_enforcement',
                json.dumps(details, ensure_ascii=False)
            )
        
            cur.execute(sql, values)
            conn.commit()
            cur.close()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"DB Error: {e}")
            return False

    def collect_and_process(self):
        """Main Loop: Tail file and Process"""
        logger.info(f"Starting OPA Real-time Collection from {self.log_file}...")
        
        if not os.path.exists(self.log_file):
            logger.warning(f"Log file not found yet: {self.log_file}")
            return {'status': 'waiting_for_file'}

        last_pos = self.get_last_position()
        processed = 0
        inserted = 0
        
        try:
            with open(self.log_file, 'r') as f:
                f.seek(last_pos)
                
                for line in f:
                    line = line.strip()
                    if not line: continue
                    
                    log_entry = self.parse_opa_log(line)
                    if log_entry:
                        if self.insert_log_to_db(log_entry):
                            inserted += 1
                        processed += 1
                
                # Update position
                self.save_position(f.tell())
                
        except Exception as e:
            logger.error(f"Processing Error: {e}")
            
        return {'processed': processed, 'inserted': inserted}

if __name__ == '__main__':
    collector = OPACollector()
    result = collector.collect_and_process()
    print(f"Collection result: {result}")

"""
Database Collector - Collects MariaDB query logs and sends to SIEM database

This script:
1. Reads MariaDB general query log or audit log
2. Parses SQL queries with user and timestamp
3. Inserts into access_logs table with log_type=DB_LOG
"""
import os
import json
import mysql.connector
from datetime import datetime, timedelta, timezone
import logging
import uuid
import re

# Local timezone offset (UTC+7 for Vietnam)
LOCAL_TZ = timezone(timedelta(hours=7))

def get_local_time():
    """Get current time in local timezone (+07:00)"""
    return datetime.now(LOCAL_TZ).replace(tzinfo=None)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseCollector:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'mariadb'),
            'user': os.getenv('DB_USER', 'openemr'),
            'password': os.getenv('DB_PASSWORD', 'Openemr!123'),
            'database': os.getenv('DB_NAME', 'ehr_core'),
            'charset': 'utf8mb4',
            'use_unicode': True
        }
        
        # MariaDB general log path (if enabled)
        self.log_file = os.getenv('MARIADB_LOG_FILE', '/var/log/mysql/queries.log')
        self.position_file = '/tmp/db_collector_position.txt'
    
    def check_general_log_enabled(self):
        """Check if MariaDB general log is enabled"""
        try:
            conn = mysql.connector.connect(**self.db_config)
            cur = conn.cursor()
            
            cur.execute("SHOW VARIABLES LIKE 'general_log'")
            result = cur.fetchone()
            
            cur.close()
            conn.close()
            
            if result:
                return result[1].upper() == 'ON'
            return False
            
        except Exception as e:
            logger.error(f"Error checking general log: {e}")
            return False
    
    def enable_general_log(self):
        """Enable MariaDB general log (requires SUPER privilege)"""
        try:
            conn = mysql.connector.connect(**self.db_config)
            cur = conn.cursor()
            
            cur.execute("SET GLOBAL general_log = 'ON'")
            cur.execute("SET GLOBAL general_log_file = '/var/log/mysql/queries.log'")
            
            cur.close()
            conn.close()
            
            logger.info("MariaDB general log enabled")
            return True
            
        except Exception as e:
            logger.error(f"Error enabling general log: {e}")
            logger.info("Note: Enabling general_log requires SUPER privilege. Skip this step if not possible.")
            return False
    
    def get_recent_db_activity(self):
        """
        Get recent database activity from information_schema
        This is an alternative approach if general_log is not available
        """
        try:
            conn = mysql.connector.connect(**self.db_config)
            cur = conn.cursor(dictionary=True)
            
            # Get current processlist (active queries)
            cur.execute("""
                SELECT 
                    ID as process_id,
                    USER as user,
                    HOST as host,
                    DB as database_name,
                    COMMAND as command,
                    TIME as duration,
                    STATE as state,
                    INFO as query_text
                FROM information_schema.PROCESSLIST
                WHERE COMMAND != 'Sleep' 
                AND USER NOT IN ('system user', 'event_scheduler')
                LIMIT 100
            """)
            
            processes = cur.fetchall()
            
            cur.close()
            conn.close()
            
            # Convert to log entries
            logs = []
            for proc in processes:
                if proc['query_text']:
                    logs.append({
                        'timestamp': get_local_time(),
                        'user': proc['user'],
                        'host': proc['host'],
                        'database': proc['database_name'] or 'N/A',
                        'command': proc['command'],
                        'duration': proc['duration'],
                        'query': proc['query_text'][:500]  # Limit query length
                    })
            
            return logs
            
        except Exception as e:
            logger.error(f"Error getting DB activity: {e}")
            return []
    
    def insert_db_log_to_db(self, log_entry):
        """Insert database query log into access_logs table"""
        try:
            conn = mysql.connector.connect(**self.db_config)
            cur = conn.cursor()
            
            log_id = str(uuid.uuid4())
            
            # Build action description - Tạo tên hành động thân thiện
            action = self._generate_action_name(log_entry['query'], log_entry['command'])
            
            # Determine if this is a sensitive query
            sensitive_keywords = ['password', 'secret', 'token', 'credit_card']
            is_sensitive = any(kw in log_entry['query'].lower() for kw in sensitive_keywords)
            
            # Build details
            # Build details
            details = {
                'database': log_entry['database'],
                'command': log_entry['command'],
                'duration_seconds': log_entry['duration'],
                'query': log_entry['query'],
                'host': log_entry['host'],
                'is_sensitive': is_sensitive
            }
            
            # Check duplicate (same timestamp + query)
            check_sql = """
                SELECT COUNT(*) FROM access_logs 
                WHERE timestamp = %s AND log_type = 'DB_LOG'
                AND details LIKE %s
            """
            cur.execute(check_sql, (
                log_entry['timestamp'],
                f'%{log_entry["query"][:50]}%'
            ))
            
            if cur.fetchone()[0] > 0:
                cur.close()
                conn.close()
                return False
            
            # Insert
            sql = """
                INSERT INTO access_logs 
                (id, timestamp, user_id, role, action, status, ip_address, log_type, purpose, details)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            values = (
                log_id,
                log_entry['timestamp'],
                log_entry['user'],
                'database_user',
                action,
                200,
                log_entry['host'],
                'DB_LOG',
                'database_access',
                json.dumps(details, ensure_ascii=False)
            )
            
            cur.execute(sql, values)
            conn.commit()
            
            cur.close()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Error inserting DB log: {e}")
            return False
    
    def _generate_action_name(self, query, command):
        """
        Parse SQL query và tạo tên hành động thân thiện tiếng Việt
        
        Args:
            query: SQL query string
            command: SQL command (SELECT, INSERT, UPDATE, DELETE)
        
        Returns:
            Tên hành động tiếng Việt
        """
        query_lower = query.lower()
        
        # Xác định table từ SQL query
        table = 'unknown'
        if 'patients' in query_lower or 'bệnh nhân' in query_lower:
            table = 'patients'
        elif 'appointments' in query_lower or 'lịch hẹn' in query_lower:
            table = 'appointments'
        elif 'medical_records' in query_lower or 'hồ sơ' in query_lower:
            table = 'medical_records'
        elif 'prescriptions' in query_lower or 'thuốc' in query_lower or 'prescription' in query_lower:
            table = 'prescriptions'
        elif 'bills' in query_lower or 'hóa đơn' in query_lower or 'billing' in query_lower:
            table = 'bills'
        elif 'encounters' in query_lower or 'khám' in query_lower:
            table = 'encounters'
        elif 'users' in query_lower or 'user' in query_lower:
            table = 'users'
        
        # Map command + table → Tên hành động tiếng Việt
        action_map = {
            # Patients
            ('SELECT', 'patients'): 'Xem hồ sơ bệnh nhân',
            ('INSERT', 'patients'): 'Thêm bệnh nhân mới',
            ('UPDATE', 'patients'): 'Cập nhật thông tin bệnh nhân',
            ('DELETE', 'patients'): 'Xóa hồ sơ bệnh nhân',
            
            # Appointments
            ('SELECT', 'appointments'): 'Xem lịch hẹn',
            ('INSERT', 'appointments'): 'Tạo lịch hẹn mới',
            ('UPDATE', 'appointments'): 'Cập nhật lịch hẹn',
            ('DELETE', 'appointments'): 'Hủy lịch hẹn',
            
            # Medical Records
            ('SELECT', 'medical_records'): 'Xem hồ sơ khám bệnh',
            ('INSERT', 'medical_records'): 'Tạo hồ sơ khám bệnh',
            ('UPDATE', 'medical_records'): 'Cập nhật hồ sơ khám bệnh',
            ('DELETE', 'medical_records'): 'Xóa hồ sơ khám bệnh',
            
            # Prescriptions
            ('SELECT', 'prescriptions'): 'Xem đơn thuốc',
            ('INSERT', 'prescriptions'): 'Kê đơn thuốc',
            ('UPDATE', 'prescriptions'): 'Cập nhật đơn thuốc',
            ('DELETE', 'prescriptions'): 'Xóa đơn thuốc',
            
            # Bills
            ('SELECT', 'bills'): 'Xem hóa đơn',
            ('INSERT', 'bills'): 'Tạo hóa đơn',
            ('UPDATE', 'bills'): 'Cập nhật hóa đơn',
            ('DELETE', 'bills'): 'Xóa hóa đơn',
            
            # Encounters
            ('SELECT', 'encounters'): 'Xem phiếu khám',
            ('INSERT', 'encounters'): 'Tạo phiếu khám',
            ('UPDATE', 'encounters'): 'Cập nhật phiếu khám',
            ('DELETE', 'encounters'): 'Xóa phiếu khám',
            
            # Users
            ('SELECT', 'users'): 'Xem thông tin người dùng',
            ('INSERT', 'users'): 'Tạo tài khoản mới',
            ('UPDATE', 'users'): 'Cập nhật tài khoản',
            ('DELETE', 'users'): 'Xóa tài khoản',
        }
        
        # Lấy tên hành động từ map, nếu không có thì trả về command + table
        key = (command, table)
        action_name = action_map.get(key, f'{command} - {table}')
        
        return action_name
    
    def process_log_file(self):
        """Read and parse MariaDB general log file"""
        logs = []
        try:
            if not os.path.exists(self.log_file):
                logger.warning(f"Log file not found at: {self.log_file}")
                return []

            # Determine start position
            start_pos = 0
            if os.path.exists(self.position_file):
                try:
                    with open(self.position_file, 'r') as f:
                        start_pos = int(f.read().strip())
                except:
                    pass

            curr_pos = start_pos
            current_log_size = os.path.getsize(self.log_file)
            
            # If file is smaller than last position, it was rotated
            if current_log_size < start_pos:
                start_pos = 0
            
            with open(self.log_file, 'r', encoding='utf-8', errors='ignore') as f:
                f.seek(start_pos)
                
                current_entry = None
                
                for line in f:
                    # Simple parser for MariaDB general log format
                    # Example: 250118 10:00:00    12 Query    SELECT * FROM...
                    # Regex for timestamp line start: ^(\d{6}\s+\d{1,2}:\d{2}:\d{2})\s+(\d+)\s+(\w+)\s+(.*)$
                    
                    # Check if line starts with timestamp (YYMMDD HH:MM:SS)
                    match = re.match(r'^(\d{6}\s+\d{1,2}:\d{2}:\d{2})\s+(\d+)\s+(\w+)\s+(.*)$', line)
                    
                    if match:
                        # Save previous entry if exists
                        if current_entry:
                            logs.append(current_entry)
                        
                        # New entry
                        timestamp_str, thread_id, command, argument = match.groups()
                        
                        # Parse timestamp (YYMMDD HH:MM:SS)
                        try:
                            ts = datetime.strptime(timestamp_str, "%y%m%d %H:%M:%S")
                        except:
                            ts = datetime.now()
                            
                        current_entry = {
                            'timestamp': ts,
                            'user': 'unknown', # File log often doesn't repeat user on every line
                            'host': 'unknown',
                            'database': 'unknown',
                            'command': command,
                            'duration': 0,
                            'query': argument.strip()
                        }
                    else:
                        # Continuation of previous query?
                        if current_entry:
                            current_entry['query'] += " " + line.strip()
                
                # Append last entry
                if current_entry:
                    logs.append(current_entry)
                
                # Update position
                curr_pos = f.tell()
                
            # Save new position
            with open(self.position_file, 'w') as f:
                f.write(str(curr_pos))
                
            return logs

        except Exception as e:
            logger.error(f"Error processing log file: {e}")
            return []

    def get_logs_from_table(self):
        """
        Read queries from mysql.general_log TABLE
        This works when general_log is enabled AND log_output = 'TABLE'
        """
        try:
            # Connect to mysql database (not ehr_core) to read general_log
            mysql_config = self.db_config.copy()
            mysql_config['database'] = 'mysql'
            
            conn = mysql.connector.connect(**mysql_config)
            cur = conn.cursor(dictionary=True)
            
            # Check log_output setting
            cur.execute("SELECT @@log_output as output")
            log_output = cur.fetchone()['output']
            
            if 'TABLE' not in log_output.upper():
                cur.close()
                conn.close()
                return None  # Not using TABLE output
            
            # Get last processed timestamp
            last_timestamp = None
            position_file = '/tmp/db_collector_table_position.txt'
            try:
                if os.path.exists(position_file):
                    with open(position_file, 'r') as f:
                        last_timestamp = f.read().strip()
            except:
                pass
            
            # Build query
            if last_timestamp:
                query = """
                    SELECT event_time, user_host, thread_id, command_type, argument
                    FROM mysql.general_log
                    WHERE command_type = 'Query'
                    AND event_time > %s
                    ORDER BY event_time ASC
                    LIMIT 500
                """
                cur.execute(query, (last_timestamp,))
            else:
                # First run - get last 30 minutes of logs
                query = """
                    SELECT event_time, user_host, thread_id, command_type, argument
                    FROM mysql.general_log
                    WHERE command_type = 'Query'
                    AND event_time >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
                    ORDER BY event_time ASC
                    LIMIT 500
                """
                cur.execute(query)
            
            rows = cur.fetchall()
            cur.close()
            conn.close()
            
            # Convert to log entries
            logs = []
            latest_timestamp = None
            
            for row in rows:
                query_text = row['argument'] if row['argument'] else ''
                if isinstance(query_text, bytes):
                    query_text = query_text.decode('utf-8', errors='ignore')
                
                # Skip internal/system queries
                query_upper = query_text.upper().strip()
                skip_patterns = [
                    'SET AUTOCOMMIT', 'SET NAMES', 'SET @@', 'COMMIT', 'ROLLBACK',
                    'SELECT @@', 'SHOW VARIABLES', 'SHOW COLLATION', 'SHOW WARNINGS',
                    'FROM MYSQL.GENERAL_LOG', 'FROM ACCESS_LOGS', 'FROM WATCHDOG_ALERTS',
                    'FROM INFORMATION_SCHEMA'
                ]
                if any(pattern in query_upper for pattern in skip_patterns):
                    continue
                
                # Parse user from user_host (format: user[user] @ host [ip])
                user_host = row['user_host'] if row['user_host'] else ''
                username = 'unknown'
                host = 'unknown'
                if '@' in user_host:
                    parts = user_host.split('@')
                    username = parts[0].split('[')[0].strip()
                    host = parts[1].strip()
                
                # Determine command type
                command = 'SELECT'
                if query_upper.startswith('INSERT'):
                    command = 'INSERT'
                elif query_upper.startswith('UPDATE'):
                    command = 'UPDATE'
                elif query_upper.startswith('DELETE'):
                    command = 'DELETE'
                
                logs.append({
                    'timestamp': row['event_time'],
                    'user': username,
                    'host': host,
                    'database': 'unknown',
                    'command': command,
                    'duration': 0,
                    'query': query_text[:500]
                })
                
                latest_timestamp = row['event_time']
            
            # Save position
            if latest_timestamp:
                try:
                    with open(position_file, 'w') as f:
                        f.write(str(latest_timestamp))
                except:
                    pass
            
            return logs
            
        except Exception as e:
            logger.error(f"Error reading from general_log table: {e}")
            return None

    def collect_and_process(self):
        """Main collection process"""
        logger.info("Starting Database Log Collection...")
        
        # 1. Try to enable General Log
        if not self.check_general_log_enabled():
            logger.info("General log disabled. Attempting to enable...")
            self.enable_general_log()
        
        # 2. Collect Data (Priority: TABLE > File > Processlist)
        logs = []
        source = 'none'
        
        # Try reading from mysql.general_log TABLE first
        table_logs = self.get_logs_from_table()
        if table_logs is not None:
            logs = table_logs
            source = 'table'
            logger.info(f"Collecting from mysql.general_log TABLE: {len(logs)} queries")
        elif self.check_general_log_enabled() and os.path.exists(self.log_file):
            logger.info(f"Collecting from log file: {self.log_file}")
            logs = self.process_log_file()
            source = 'file'
        else:
            logger.info("Log file not available. Fallback to Processlist.")
            logs = self.get_recent_db_activity()
            source = 'processlist'
        
        # 3. Insert into SIEM
        inserted = 0
        for log_entry in logs:
            if self.insert_db_log_to_db(log_entry):
                inserted += 1
        
        logger.info(f"DB collection complete: {len(logs)} collected, {inserted} inserted (source: {source})")
        
        return {
            'queries_collected': len(logs),
            'logs_inserted': inserted,
            'source': source
        }


if __name__ == '__main__':
    collector = DatabaseCollector()
    result = collector.collect_and_process()
    print(f"Collection result: {result}")

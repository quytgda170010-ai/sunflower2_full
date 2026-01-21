"""
Gateway Collector - Collects nginx access logs and sends to SIEM database

This script:
1. Reads nginx access.log from gateway
2. Parses log entries (method, path, status, response time)
3. Inserts into access_logs table with log_type=GATEWAY_LOG
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

class GatewayCollector:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'mariadb'),
            'user': os.getenv('DB_USER', 'openemr'),
            'password': os.getenv('DB_PASSWORD', 'Openemr!123'),
            'database': os.getenv('DB_NAME', 'ehr_core'),
            'charset': 'utf8mb4',
            'use_unicode': True
        }
        
        # Nginx access log path (mount from gateway container - JSON format)
        self.log_file = os.getenv('GATEWAY_LOG_FILE', '/var/log/gateway/access.json')
        self.position_file = '/tmp/gateway_collector_position.txt'
    
    def get_last_position(self):
        """Get last read position from file"""
        try:
            if os.path.exists(self.position_file):
                with open(self.position_file, 'r') as f:
                    return int(f.read().strip())
        except:
            pass
        return 0
    
    def save_position(self, position):
        """Save current read position"""
        try:
            with open(self.position_file, 'w') as f:
                f.write(str(position))
        except Exception as e:
            logger.error(f"Error saving position: {e}")
    
    def parse_nginx_log(self, line):
        """Parse nginx JSON log line
        Format: {"ts":"...", "ip":"...", "method":"...", "uri":"...", "status":200, ...}
        """
        try:
            log_entry = json.loads(line.strip())
            
            # Parse timestamp
            ts_str = log_entry.get('ts', '')
            try:
                timestamp = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
            except:
                timestamp = datetime.now(LOCAL_TZ)
            
            return {
                'ip_address': log_entry.get('ip', 'unknown'),
                'user_id': log_entry.get('user', 'anonymous') or 'anonymous',
                'timestamp': timestamp.astimezone(LOCAL_TZ).replace(tzinfo=None),
                'method': log_entry.get('method', 'GET'),
                'path': log_entry.get('uri', '/'),
                'status': int(log_entry.get('status', 0)),
                'size': int(log_entry.get('bytes', 0)),
                'role': log_entry.get('role', ''),
                'purpose': log_entry.get('purpose', ''),
                'decision': log_entry.get('decision', ''),
                'request_id': log_entry.get('request_id', ''),
                'referer': '',
                'user_agent': '',
                'response_time': 0.0
            }
        except json.JSONDecodeError:
            # Fallback to empty entry if JSON parsing fails
            return None
        except Exception as e:
            logger.error(f"Error parsing log: {e}")
            return None
    
    def insert_log_to_db(self, log_entry):
        """Insert gateway log into access_logs table"""
        try:
            conn = mysql.connector.connect(**self.db_config)
            cur = conn.cursor()
            
            log_id = str(uuid.uuid4())
            
            # Build action description
            action = f"{log_entry['method']} {log_entry['path']} - {log_entry['status']}"
            
            # Determine user_id (try to extract from path or use IP)
            user_id = log_entry['user_id']
            if user_id == 'anonymous':
                # Try to extract from X-User header (if logged)
                user_id = 'gateway-access'
            
            # Build details
            details = {
                'method': log_entry['method'],
                'path': log_entry['path'],
                'status_code': log_entry['status'],
                'response_size': log_entry['size'],
                'response_time_ms': log_entry['response_time'] * 1000,
                'referer': log_entry['referer'],
                'user_agent': log_entry['user_agent'],
                'ip_address': log_entry['ip_address']
            }
            
            # Check for duplicate (same timestamp + path + IP)
            check_sql = """
                SELECT COUNT(*) FROM access_logs 
                WHERE timestamp = %s AND details LIKE %s
            """
            cur.execute(check_sql, (
                log_entry['timestamp'],
                f'%"path": "{log_entry["path"]}"%'
            ))
            
            if cur.fetchone()[0] > 0:
                cur.close()
                conn.close()
                return False  # Skip duplicate
            
            # Insert
            sql = """
                INSERT INTO access_logs 
                (id, timestamp, user_id, role, action, status, ip_address, log_type, purpose, details)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            values = (
                log_id,
                log_entry['timestamp'],
                user_id,
                'system',
                action,
                log_entry['status'],
                log_entry['ip_address'],
                'GATEWAY_LOG',
                'system_access',
                json.dumps(details, ensure_ascii=False)
            )
            
            cur.execute(sql, values)
            conn.commit()
            
            cur.close()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Error inserting gateway log: {e}")
            return False
    
    def collect_and_process(self):
        """Main collection process"""
        logger.info("Starting Gateway Log Collection...")
        
        if not os.path.exists(self.log_file):
            logger.warning(f"Log file not found: {self.log_file}")
            return {'logs_processed': 0, 'logs_inserted': 0}
        
        # Get last position
        last_pos = self.get_last_position()
        
        inserted = 0
        processed = 0
        
        try:
            with open(self.log_file, 'r') as f:
                # Seek to last position
                f.seek(last_pos)
                
                for line in f:
                    processed += 1
                    line = line.strip()
                    
                    if not line:
                        continue
                    
                    # Parse log line
                    log_entry = self.parse_nginx_log(line)
                    if not log_entry:
                        continue
                    
                    # Insert to database
                    if self.insert_log_to_db(log_entry):
                        inserted += 1
                
                # Save current position
                current_pos = f.tell()
                self.save_position(current_pos)
        
        except Exception as e:
            logger.error(f"Error processing logs: {e}")
        
        logger.info(f"Gateway collection complete: {processed} processed, {inserted} inserted")
        
        return {
            'logs_processed': processed,
            'logs_inserted': inserted
        }


if __name__ == '__main__':
    collector = GatewayCollector()
    result = collector.collect_and_process()
    print(f"Collection result: {result}")

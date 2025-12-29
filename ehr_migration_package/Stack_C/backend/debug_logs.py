
import mysql.connector
import os
import json
from datetime import datetime

def check_logs():
    db_config = {
        'host': 'mariadb',
        'user': 'openemr',
        'password': 'Openemr!123',
        'database': 'ehr_core',
        'charset': 'utf8mb4'
    }
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    print("Fetching last 10 access_logs...")
    cursor.execute("""
        SELECT id, timestamp, action, log_type, operation, details, request_body 
        FROM access_logs 
        ORDER BY timestamp DESC 
        LIMIT 10
    """)
    
    logs = cursor.fetchall()
    
    for log in logs:
        print("-" * 50)
        print(f"ID: {log['id']}")
        print(f"Time: {log['timestamp']}")
        print(f"Action: {log['action']}")
        print(f"Log Type: {log['log_type']}")
        print(f"Operation: {log['operation']}")
        print(f"Details: {log['details']}")
        print(f"Request Body: {log['request_body']}")
        
        # Test my condition
        action = (log['action'] or '').upper()
        details = str(log['details'] or '').upper()
        
        if 'BRUTE-FORCE' in action or 'BRUTE_FORCE' in details:
            print(">>> DETECTED AS BRUTE FORCE (Match Fix)")
        else:
            print(">>> NOT DETECTED AS BRUTE FORCE")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_logs()

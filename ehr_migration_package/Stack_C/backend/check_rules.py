import mysql.connector
import json

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Check distinct actions for role=nurse
print("=== Sample logs for nurse role ===")
cur.execute("""
    SELECT action, log_type, details
    FROM access_logs 
    WHERE role = 'nurse' 
    AND timestamp >= '2025-12-17'
    LIMIT 5
""")
for row in cur.fetchall():
    print(f"Action: {row[0]}")
    print(f"log_type: {row[1]}")
    if row[2]:
        try:
            details = json.loads(row[2])
            print(f"rule_code: {details.get('rule_code', 'N/A')}")
        except:
            pass
    print()

# Check distinct rule_codes from details JSON
print("=== Distinct rule_codes in details ===")
cur.execute("""
    SELECT DISTINCT 
        JSON_EXTRACT(details, '$.rule_code') as rule_code
    FROM access_logs 
    WHERE details IS NOT NULL 
    AND timestamp >= '2025-12-17'
    LIMIT 30
""")
for row in cur.fetchall():
    print(f"  {row[0]}")

# Check sample admin logs
print("\n=== Sample logs for admin role ===")
cur.execute("""
    SELECT action, log_type, role, purpose
    FROM access_logs 
    WHERE role = 'admin' 
    AND timestamp >= '2025-12-17'
    LIMIT 5
""")
for row in cur.fetchall():
    print(f"Action: {row[0]}, log_type: {row[1]}, role: {row[2]}, purpose: {row[3]}")

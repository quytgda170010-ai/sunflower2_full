import mysql.connector

# Connect to database
conn = mysql.connector.connect(
    host='localhost',
    port=3307,
    user='root',
    password='123456789',
    database='siem_db'
)
cursor = conn.cursor()

# Query logs for letan.hoa and dd.ha
query = """
SELECT id, user_id, action, log_type, rule_code, purpose, status
FROM access_logs 
WHERE (user_id LIKE '%letan%' OR user_id LIKE '%dd.%')
ORDER BY timestamp DESC
LIMIT 10
"""
cursor.execute(query)
rows = cursor.fetchall()

print("=== Logs for letan.hoa / dd.ha ===")
for row in rows:
    print(f"ID: {row[0]}")
    print(f"  user_id: {row[1]}")
    print(f"  action: {row[2]}")  
    print(f"  log_type: {row[3]}")
    print(f"  rule_code: {row[4]}")
    print(f"  purpose: {row[5]}")
    print(f"  status: {row[6]}")
    print("---")

cursor.close()
conn.close()

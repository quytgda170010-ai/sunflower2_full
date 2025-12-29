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

# Check logs with "Tạo mới" action - check patient_id values
print("=== Logs with 'Tạo mới' action ===")
cur.execute("""
    SELECT id, action, patient_id, patient_name, patient_code
    FROM access_logs 
    WHERE action LIKE '%Tạo mới%' OR action LIKE '%Tạo%patient%'
    ORDER BY timestamp DESC
    LIMIT 5
""")
for row in cur.fetchall():
    print(f"ID={row[0]}")
    print(f"  Action: {row[1][:80]}")
    print(f"  patient_id: {row[2]}")
    print(f"  patient_name: {row[3]}")
    print(f"  patient_code: {row[4]}")
    print()

# Check if there are any remaining broken font patterns in notes
print("\n=== Current notes values ===")
cur.execute("SELECT changed_fields FROM access_logs WHERE changed_fields LIKE '%notes%' LIMIT 5")
for row in cur.fetchall():
    if row[0]:
        try:
            data = json.loads(row[0])
            if 'content' in data and 'notes' in data['content']:
                print(f"notes: {data['content']['notes']}")
        except:
            pass

# Check request_body for broken patterns
print("\n=== Checking request_body for broken patterns ===")
cur.execute("SELECT request_body FROM access_logs WHERE request_body LIKE '%buổi%' LIMIT 3")
for row in cur.fetchall():
    if row[0]:
        try:
            data = json.loads(row[0])
            if 'notes' in data:
                print(f"notes in request_body: {data['notes']}")
            if 'content' in data and 'notes' in data.get('content', {}):
                print(f"content.notes: {data['content']['notes']}")
        except:
            pass

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

# Check record_type values
print("=== Logs with record_type in changed_fields ===")
cur.execute("SELECT id, action, changed_fields FROM access_logs WHERE changed_fields LIKE '%record_type%' LIMIT 5")
for row in cur.fetchall():
    print(f"ID: {row[0]}")
    print(f"Action: {row[1]}")
    if row[2]:
        data = json.loads(row[2])
        if 'record_type' in data:
            print(f"record_type: {data['record_type']}")
        if 'content' in data:
            if 'medications' in data.get('content', {}):
                print("Has medications: YES")
            if 'drug_name' in str(data.get('content', {})):
                print("Has drug_name: YES")
    print()

# Check if these logs are prescription
print("\n=== Checking if record_type = prescription ===")
cur.execute("SELECT action, changed_fields FROM access_logs WHERE changed_fields LIKE '%prescription%' AND changed_fields LIKE '%record_type%' LIMIT 3")
for row in cur.fetchall():
    data = json.loads(row[1])
    print(f"Action: {row[0]}")
    print(f"record_type: {data.get('record_type', 'N/A')}")
    print()

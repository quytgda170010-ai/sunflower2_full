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

# Check all logs with patient_id=None but action involves "Tạo"
print("=== Logs with action 'Tạo' and no patient info ===")
cur.execute("""
    SELECT id, action, patient_id, patient_name, patient_code, log_type
    FROM access_logs 
    WHERE (patient_id IS NULL OR patient_id = '') 
      AND (patient_name IS NULL OR patient_name = '')
      AND action LIKE '%Tạo%'
    ORDER BY timestamp DESC
    LIMIT 5
""")
for row in cur.fetchall():
    print(f"ID={row[0]}, log_type={row[5]}")
    print(f"  Action: {row[1]}")
    print(f"  patient_id: {row[2]}, patient_name: {row[3]}")
    print()

# Check logs with operation='create' and log_type 
print("\n=== Logs with operation 'create' ===")
cur.execute("""
    SELECT id, action, patient_id, patient_name, operation, log_type
    FROM access_logs 
    WHERE operation = 'create'
    ORDER BY timestamp DESC
    LIMIT 5
""")
for row in cur.fetchall():
    print(f"ID={row[0]}, op={row[4]}, log_type={row[5]}")
    print(f"  Action: {row[1][:60]}")
    print(f"  patient_id: {row[2]}, patient_name: {row[3]}")
    print()

# Check what happens when there's patient_id in changed_fields but not in the main record
print("\n=== Logs where changed_fields has patient_id ===")
cur.execute("""
    SELECT id, action, patient_id, patient_name, changed_fields
    FROM access_logs 
    WHERE changed_fields LIKE '%patient_id%'
      AND (patient_id IS NULL OR patient_id = '')
    ORDER BY timestamp DESC
    LIMIT 3
""")
for row in cur.fetchall():
    print(f"ID={row[0]}")
    print(f"  Action: {row[1][:80]}")
    print(f"  patient_id: {row[2]}, patient_name: {row[3]}")
    if row[4]:
        try:
            data = json.loads(row[4])
            if 'patient_id' in data:
                print(f"  changed_fields.patient_id: {data['patient_id']}")
        except:
            pass
    print()

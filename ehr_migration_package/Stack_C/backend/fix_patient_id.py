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

# Fix: Extract patient_id from changed_fields/request_body and update the main record
print("=== Fixing logs without patient_id but have it in changed_fields ===")

cur.execute("""
    SELECT id, changed_fields, request_body
    FROM access_logs 
    WHERE (patient_id IS NULL OR patient_id = '')
      AND (changed_fields LIKE '%patient_id%' OR request_body LIKE '%patient_id%')
""")
rows = cur.fetchall()
fixed_count = 0

for row in rows:
    log_id = row[0]
    changed_fields = row[1]
    request_body = row[2]
    
    patient_id = None
    
    # Try to extract patient_id from changed_fields
    if changed_fields:
        try:
            data = json.loads(changed_fields)
            if 'patient_id' in data:
                patient_id = data['patient_id']
        except:
            pass
    
    # Try to extract from request_body if not found
    if not patient_id and request_body:
        try:
            data = json.loads(request_body)
            if 'patient_id' in data:
                patient_id = data['patient_id']
        except:
            pass
    
    if patient_id:
        # Update the patient_id in the log
        cur.execute("""
            UPDATE access_logs SET patient_id = %s WHERE id = %s
        """, (patient_id, log_id))
        fixed_count += 1
        if fixed_count <= 5:
            print(f"Fixed log {log_id}: patient_id = {patient_id}")

conn.commit()
print(f"\n========== Total logs fixed with patient_id: {fixed_count} ==========")

# Verify
print("\n=== Verifying logs with action 'Create patient' ===")
cur.execute("""
    SELECT a.id, a.action, a.patient_id, p.full_name
    FROM access_logs a
    LEFT JOIN ehr_patients p ON a.patient_id COLLATE utf8mb4_unicode_ci = p.id
    WHERE a.action = 'Create patient'
    ORDER BY a.timestamp DESC
    LIMIT 3
""")
for row in cur.fetchall():
    print(f"Action: {row[1]}, patient_id: {row[2]}, full_name: {row[3]}")

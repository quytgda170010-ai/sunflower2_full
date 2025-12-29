import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Simulate the actual query from security_monitor.py
cur.execute("""
    SELECT 
        a.id,
        COALESCE(p.patient_code, a.patient_code) as patient_code,
        COALESCE(p.full_name, a.patient_name) as patient_name,
        CASE 
            WHEN COALESCE(p.patient_code, a.patient_code) IS NOT NULL AND LENGTH(COALESCE(p.patient_code, a.patient_code)) > 0
                 AND COALESCE(p.full_name, a.patient_name) IS NOT NULL AND LENGTH(COALESCE(p.full_name, a.patient_name)) > 0
            THEN CONCAT(COALESCE(p.patient_code, a.patient_code), ' - ', COALESCE(p.full_name, a.patient_name))
            ELSE NULL
        END as patient_display
    FROM access_logs a
    LEFT JOIN ehr_patients p ON a.patient_id COLLATE utf8mb4_unicode_ci = p.id
    WHERE a.log_type = 'emr_encryption'
    LIMIT 5
""")

print("emr_encryption logs patient_display:")
for r in cur.fetchall():
    print(f"  {r[3]}")

# Check raw ehr_patients data
cur.execute("SELECT patient_code, full_name FROM ehr_patients LIMIT 5")
print("\nehr_patients raw data:")
for r in cur.fetchall():
    print(f"  {r[0]} - {r[1]}")

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

# Fix remaining broken patterns
fixes = [
    # From screenshot
    ('Uống Hướ buổiv', 'Uống mỗi buổi'),
    ('Hướ buổiv', 'mỗi buổi'),
    ('buổiv', 'buổi'),
    ('Hướ ', 'mỗi '),  # might be wrong replacement
    
    # More broken patterns found
    ('Uống Hưống buổi', 'Uống mỗi buổi'),
]

# Fix all tables
tables_columns = [
    ('access_logs', 'changed_fields'),
    ('access_logs', 'request_body'),
    ('access_logs', 'response_body'),
]

total_fixed = 0
for table, col in tables_columns:
    for old, new in fixes:
        if old == new:
            continue
        try:
            sql = f"UPDATE {table} SET {col} = REPLACE({col}, %s, %s) WHERE {col} LIKE %s"
            cur.execute(sql, (old, new, f'%{old}%'))
            if cur.rowcount > 0:
                print(f"Fixed {cur.rowcount} in {table}.{col}: {repr(old)} -> {new}")
                total_fixed += cur.rowcount
        except Exception as e:
            pass

conn.commit()
print(f"\n========== Total font fixes: {total_fixed} ==========")

# Check why some "Tạo mới" logs don't show patient name
print("\n=== Checking logs without patient_name ===")
cur.execute("""
    SELECT a.id, a.action, a.patient_id, a.patient_name, a.patient_code, p.full_name as ehr_patient_name
    FROM access_logs a
    LEFT JOIN ehr_patients p ON a.patient_id = p.id
    WHERE a.action LIKE '%Tạo mới%' OR a.action LIKE '%Tạo%patient%'
    LIMIT 5
""")
for row in cur.fetchall():
    print(f"ID={row[0]}, Action={row[1][:50]}, patient_id={row[2]}, patient_name={row[3]}, ehr_name={row[5]}")

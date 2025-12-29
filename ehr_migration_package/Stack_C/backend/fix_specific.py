import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Specific fixes for remaining broken patterns
specific_fixes = [
    # Department names
    ('?đa khoa', 'Đa khoa'),
    ('?Da khoa', 'Đa khoa'),
    ('Nối khoa', 'Nội khoa'),
    ('nối khoa', 'nội khoa'),
    
    # Medical terms
    ('Huyễt ơp', 'Huyết áp'),
    ('huyễt ơp', 'huyết áp'),
    ('&uy dẫn', 'Huy dẫn'),  # or could be "Hướng dẫn"
    
    # Common broken patterns
    ('?ng', 'ông'),
    ('?a', 'đa'),
    ('?đ', 'Đ'),
    ('?ứ', 'Đứ'),
    ('?ố', 'Đố'),
    ('?ộ', 'Độ'),
    ('?ạ', 'Đạ'),
    ('?ặ', 'Đặ'),
    ('?ầ', 'Đầ'),
    ('?ấ', 'Đấ'),
    ('?i', 'Đi'),
    ('?o', 'Đo'),
    ('?u', 'Đu'),
    ('?ơ', 'Đơ'),
    ('?ư', 'Đư'),
    ('?ể', 'Để'),
    ('?ề', 'Đề'),
    ('?ế', 'Đế'),
    ('?ệ', 'Đệ'),
    ('?ư', 'Đư'),
    ('?ứ', 'Đứ'),
    ('?ừ', 'Đừ'),
    ('?ữ', 'Đữ'),
    ('?ự', 'Đự'),
    
    # Ư, Ơ patterns that may be broken
    ('ơp', 'áp'),
    ('Ơp', 'Áp'),
    ('ễt', 'ết'),
    
    # More broken "Đ"
    ('"?', '"Đ'),
    (':?', ':Đ'),
    (' ?', ' Đ'),
    ('\\n?', '\\nĐ'),
    
    # Fix remaining
    ('Khồng', 'Không'),
    ('khồng', 'không'),
]

# Fix all columns
columns_to_fix = [
    ('access_logs', 'action'),
    ('access_logs', 'actor_name'),
    ('access_logs', 'patient_name'),
    ('access_logs', 'purpose'),
    ('access_logs', 'details'),
    ('access_logs', 'changed_fields'),
    ('access_logs', 'request_body'),
    ('access_logs', 'response_body'),
    ('ehr_patients', 'full_name'),
    ('ehr_patients', 'address'),
    ('ehr_medical_records', 'notes'),
    ('ehr_medical_records', 'diagnosis'),
    ('ehr_appointments', 'notes'),
    ('ehr_departments', 'name'),
]

total_fixed = 0
for table, col in columns_to_fix:
    for old, new in specific_fixes:
        if old == new:
            continue
        try:
            sql = f"UPDATE {table} SET {col} = REPLACE({col}, %s, %s) WHERE {col} LIKE %s"
            cur.execute(sql, (old, new, f'%{old}%'))
            if cur.rowcount > 0:
                print(f"Fixed {cur.rowcount} in {table}.{col}: {repr(old)} -> {new}")
                total_fixed += cur.rowcount
        except Exception as e:
            pass  # Ignore errors for non-existent tables/columns

conn.commit()
print(f"\n========== Total records fixed: {total_fixed} ==========")

# Double-check the specific broken strings mentioned in screenshot
print("\n=== Verifying specific strings ===")
cur.execute("SELECT changed_fields FROM access_logs WHERE changed_fields LIKE '%department_name%' LIMIT 3")
for row in cur.fetchall():
    if row[0]:
        # Extract department_name value
        import json
        try:
            data = json.loads(row[0])
            if 'content' in data and 'department_name' in data['content']:
                print(f"department_name: {data['content']['department_name']}")
            elif 'department_name' in data:
                print(f"department_name: {data['department_name']}")
        except:
            pass

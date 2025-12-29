import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Fix remaining broken patterns found in scan
final_fixes = [
    # Names
    ('Nguyướn', 'Nguyễn'),
    ('nguyướn', 'nguyễn'),
    ('Nguyen', 'Nguyễn'),  # if English spelling exists
    
    # More patterns that might be broken
    ('ướn', 'ễn'),  # Nguyễn
    ('buổiv', 'buổi'),  # if exists
    
    # Follow-up and notes
    ('đẫn', 'dẫn'),  # sau dẫn, not đẫn
    ('Uống sau dẫn', 'Uống đều đặn'),  # proper phrase
    
    # More edge cases
    ('mỗi buổi', 'mỗi buổi'),  # ensure correct
]

# Fix all tables
tables_columns = [
    ('access_logs', 'changed_fields'),
    ('access_logs', 'request_body'),
    ('access_logs', 'response_body'),
    ('access_logs', 'details'),
    ('ehr_patients', 'full_name'),
]

total_fixed = 0
for table, col in tables_columns:
    for old, new in final_fixes:
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
print(f"\n========== Total records fixed: {total_fixed} ==========")

# Final verification
print("\n=== Final Verification ===")
cur.execute("SELECT changed_fields FROM access_logs WHERE changed_fields LIKE '%full_name%' LIMIT 3")
for row in cur.fetchall():
    if row[0]:
        import json
        try:
            data = json.loads(row[0])
            if 'content' in data and 'doctor' in data['content'] and 'full_name' in data['content']['doctor']:
                print(f"doctor.full_name: {data['content']['doctor']['full_name']}")
        except:
            pass

cur.execute("SELECT changed_fields FROM access_logs WHERE changed_fields LIKE '%notes%' LIMIT 3")
for row in cur.fetchall():
    if row[0]:
        import json
        try:
            data = json.loads(row[0])
            if 'content' in data and 'notes' in data['content']:
                print(f"notes: {data['content']['notes']}")
        except:
            pass

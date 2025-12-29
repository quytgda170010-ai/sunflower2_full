import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Fix the specific broken pattern found
fixes = [
    ('Hễng dẫn', 'Hướng dẫn'),
    ('Hễng', 'Hướng'),
    ('hễng', 'hướng'),
]

# Fix all tables
tables_columns = [
    ('access_logs', 'changed_fields'),
    ('access_logs', 'request_body'),
    ('access_logs', 'response_body'),
    ('access_logs', 'details'),
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
print(f"\n========== Total records fixed: {total_fixed} ==========")

# Verify
print("\n=== Verification ===")
cur.execute("SELECT changed_fields FROM access_logs WHERE changed_fields LIKE '%notes%' LIMIT 5")
for row in cur.fetchall():
    if row[0]:
        import json
        try:
            data = json.loads(row[0])
            if 'content' in data and 'notes' in data['content']:
                print(f"notes: {data['content']['notes']}")
        except:
            pass

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

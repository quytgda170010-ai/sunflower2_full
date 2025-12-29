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

# Fix broken font patterns
fixes = [
    ('Uống mỗi lười', 'Uống mỗi buổi'),
    ('mỗi lười', 'mỗi buổi'),
    ('lười', 'buổi'),  # if context-safe
]

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

# Verify notes values  
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

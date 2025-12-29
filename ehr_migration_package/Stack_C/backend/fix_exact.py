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

# These are EXACT broken strings found in the database - fix them completely
exact_fixes = [
    # Exact notes values
    ('ễơy đến', 'Hướng dẫn'),
    ('Uứng ơữu đến', 'Uống sau đẫn'),  
    ('ơữu đến', 'sau đẫn'),
    ('ễơy', 'Hướng'),
    
    # follow_up
    ('Khàng', 'Không'),
    ('khàng', 'không'),
    
    # More broken patterns from previous fixes  
    ('ễơ', 'Hướ'),
    ('ứng', 'ống'),
    ('ơữ', 'au'),
    ('àng', 'ông'),
    
    # Replace all remaining weird patterns
    ('ễ', 'ướ'),
    ('ữu', 'au'),
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
    for old, new in exact_fixes:
        if old == new:
            continue
        try:
            sql = f"UPDATE {table} SET {col} = REPLACE({col}, %s, %s) WHERE {col} LIKE %s"
            cur.execute(sql, (old, new, f'%{old}%'))
            if cur.rowcount > 0:
                print(f"Fixed {cur.rowcount} in {table}.{col}: {repr(old)} -> {new}")
                total_fixed += cur.rowcount
        except Exception as e:
            print(f"Error: {e}")

conn.commit()
print(f"\n========== Total records fixed: {total_fixed} ==========")

# Verify 
print("\n=== Verifying notes and follow_up ===")
cur.execute("SELECT changed_fields FROM access_logs WHERE changed_fields LIKE '%notes%' LIMIT 5")
for row in cur.fetchall():
    if row[0]:
        try:
            data = json.loads(row[0])
            if 'content' in data and 'notes' in data['content']:
                print(f"notes: {data['content']['notes']}")
            if 'content' in data and 'follow_up' in data['content']:
                print(f"follow_up: {data['content']['follow_up']}")    
        except:
            pass

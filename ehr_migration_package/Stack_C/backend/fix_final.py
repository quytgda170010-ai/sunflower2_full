import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Fix remaining specific broken patterns
final_fixes = [
    # Notes field fixes
    ('&oy dẫn', 'Hướng dẫn'),
    ('&oy', 'Hướ'),
    ('Uống cứu dẫn', 'Uống sau dẫn'),
    ('cứu dẫn', 'sau dẫn'),
    
    # follow_up field
    ('Khống', 'Không'),
    ('khống', 'không'),
    
    # More broken patterns with & 
    ('&u', 'Hú'),
    ('&a', 'Há'),
    ('&i', 'Hí'),
    ('&o', 'Hó'),
    ('&e', 'Hé'),
    ('&ư', 'Hư'),
    ('&ướ', 'Hướ'),
    
    # More fixes
    ('ống', 'ông'),  # Khống -> Không
    
    # Common broken characters
    ('ử', 'ữ'),  # in some contexts
]

# Fix in all text columns
tables_columns = [
    ('access_logs', 'changed_fields'),
    ('access_logs', 'request_body'),
    ('access_logs', 'response_body'),
    ('access_logs', 'details'),
    ('access_logs', 'action'),
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

# Verify notes and follow_up fields
print("\n=== Checking notes and follow_up values ===")
cur.execute("SELECT changed_fields FROM access_logs WHERE changed_fields LIKE '%notes%' OR changed_fields LIKE '%follow_up%' LIMIT 5")
for row in cur.fetchall():
    if row[0]:
        import json
        try:
            data = json.loads(row[0])
            if 'content' in data:
                content = data['content']
                if 'notes' in content:
                    print(f"notes: {content['notes']}")
                if 'follow_up' in content:
                    print(f"follow_up: {content['follow_up']}")
        except:
            pass

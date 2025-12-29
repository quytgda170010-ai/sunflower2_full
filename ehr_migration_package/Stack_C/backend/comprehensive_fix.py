import mysql.connector
import json
import re

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

print("=== COMPREHENSIVE SCAN FOR ALL BROKEN FONT PATTERNS ===\n")

# Scan ALL changed_fields records
cur.execute("SELECT id, changed_fields FROM access_logs WHERE changed_fields IS NOT NULL")
rows = cur.fetchall()

broken_values = set()

for row in rows:
    log_id, cf = row
    if not cf:
        continue
    try:
        data = json.loads(cf)
        
        # Recursively find all string values
        def find_strings(obj, path=""):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    yield from find_strings(v, f"{path}.{k}")
            elif isinstance(obj, list):
                for i, v in enumerate(obj):
                    yield from find_strings(v, f"{path}[{i}]")
            elif isinstance(obj, str):
                yield (path, obj)
        
        for path, value in find_strings(data):
            # Check for suspicious patterns - non-standard Vietnamese
            if value and any(c in value for c in ['ướu', 'ười', 'liướ', 'àng', 'ệnh', 'ướn']):
                broken_values.add((path, value))
                
            # Check for specific broken notes patterns
            if 'notes' in path.lower() and value:
                if any(x in value for x in ['liướu', 'lười', 'ướu', 'Hướ ', 'mỗi l']):
                    print(f"BROKEN notes found: {value}")
                    broken_values.add(('notes', value))
                    
    except json.JSONDecodeError:
        pass

print(f"\nFound {len(broken_values)} potentially broken values")
for path, value in list(broken_values)[:20]:
    print(f"  {path}: {value}")

# Now find exact broken strings and fix them
print("\n\n=== FIXING BROKEN PATTERNS ===")

# Specific fixes based on what we found
exact_fixes = [
    # Notes field fixes - exact strings found
    ('Uống mỗi liướu', 'Uống mỗi liều'),  # liướu -> liều
    ('mỗi liướu', 'mỗi liều'),
    ('liướu', 'liều'),
    ('ướu', 'ều'),
    
    # Other potential broken patterns
    ('Uống mỗi lười', 'Uống mỗi buổi'),
    ('mỗi lười', 'mỗi buổi'),
    ('Hướ buổi', 'mỗi buổi'),
    ('Hướ ', 'Uống mỗi '),
    
    # General Vietnamese fixes
    ('ướu', 'ều'),  # liều
    ('ười', 'ội'),  # buổi
]

tables_columns = [
    ('access_logs', 'changed_fields'),
    ('access_logs', 'request_body'),
    ('access_logs', 'response_body'),
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

# Final verification
print("\n=== FINAL VERIFICATION ===")
cur.execute("SELECT changed_fields FROM access_logs WHERE changed_fields LIKE '%notes%' LIMIT 10")
for row in cur.fetchall():
    if row[0]:
        try:
            data = json.loads(row[0])
            if 'content' in data and 'notes' in data['content']:
                notes = data['content']['notes']
                if notes:
                    print(f"notes: {notes}")
        except:
            pass

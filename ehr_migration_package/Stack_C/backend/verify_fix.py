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

print("=== Final verification ===\n")

# Check for any remaining ? or broken patterns in all relevant columns
columns = [
    ('access_logs', 'changed_fields'),
    ('access_logs', 'request_body'),
    ('access_logs', 'response_body'),
    ('access_logs', 'details'),
]

broken_count = 0
for table, col in columns:
    try:
        # Look for patterns like ?X where X is a letter
        cur.execute(f"SELECT {col} FROM {table} WHERE {col} REGEXP '\\\\?[a-zA-Z]' LIMIT 3")
        rows = cur.fetchall()
        if rows:
            print(f"Found broken patterns in {table}.{col}:")
            for row in rows:
                if row[0]:
                    import re
                    matches = re.findall(r'\?[a-zA-ZĐ]', row[0][:500])
                    if matches:
                        print(f"  Patterns: {set(matches)}")
                        broken_count += 1
    except Exception as e:
        pass

# Check ehr_departments 
print("\nehr_departments.name values:")
cur.execute("SELECT id, name FROM ehr_departments LIMIT 10")
for row in cur.fetchall():
    print(f"  {row[1]}")

# Check a sample changed_fields with doctor info
print("\nSample changed_fields doctor.full_name:")
cur.execute("SELECT changed_fields FROM access_logs WHERE changed_fields LIKE '%doctor%' AND changed_fields LIKE '%full_name%' LIMIT 3")
for row in cur.fetchall():
    if row[0]:
        try:
            data = json.loads(row[0])
            if 'content' in data and 'doctor' in data['content']:
                print(f"  {data['content']['doctor'].get('full_name', 'N/A')}")
            elif 'doctor' in data:
                print(f"  {data['doctor'].get('full_name', 'N/A')}")
        except:
            pass

if broken_count == 0:
    print("\n✅ No more broken patterns found!")
else:
    print(f"\n⚠️ Still have {broken_count} broken patterns")

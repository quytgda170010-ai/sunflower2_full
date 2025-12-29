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

# Find ALL records with 'notes' containing suspicious patterns
print("=== Searching ALL columns for 'notes' with broken patterns ===\n")

columns = ['changed_fields', 'request_body', 'response_body', 'details']

for col in columns:
    print(f"--- {col} ---")
    cur.execute(f"""
        SELECT id, {col} FROM access_logs 
        WHERE {col} LIKE '%notes%' 
        AND ({col} LIKE '%liướu%' OR {col} LIKE '%lười%' OR {col} LIKE '%ướu%' OR {col} LIKE '%Hướ %')
        LIMIT 5
    """)
    rows = cur.fetchall()
    if rows:
        for row in rows:
            print(f"  ID: {row[0]}")
            try:
                data = json.loads(row[1])
                if 'content' in data and 'notes' in data['content']:
                    print(f"    content.notes: {data['content']['notes']}")
                if 'notes' in data:
                    print(f"    notes: {data['notes']}")
            except:
                pass
    else:
        print("  No broken patterns found")
    print()

# Also check the exact log user is viewing (timestamp 17/12/2025 03:32:28)
print("=== Checking logs around 17/12/2025 ===")
cur.execute("""
    SELECT id, timestamp, changed_fields FROM access_logs 
    WHERE timestamp LIKE '%2025-12-17%' 
    AND changed_fields LIKE '%notes%'
    LIMIT 5
""")
for row in cur.fetchall():
    print(f"ID: {row[0]}, ts: {row[1]}")
    if row[2]:
        try:
            data = json.loads(row[2])
            if 'content' in data and 'notes' in data['content']:
                print(f"  notes: {data['content']['notes']}")
        except:
            pass

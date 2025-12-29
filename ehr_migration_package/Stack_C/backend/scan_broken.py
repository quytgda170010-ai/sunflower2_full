import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Find remaining broken patterns
print("=== Scanning for remaining broken patterns ===\n")

# Check changed_fields for any remaining issues
cur.execute("SELECT DISTINCT changed_fields FROM access_logs WHERE changed_fields IS NOT NULL LIMIT 20")
for row in cur.fetchall():
    if row[0] and ('?' in row[0] or '&' in row[0] or '\\u' in row[0]):
        # Find specific broken patterns
        import re
        matches = re.findall(r'[?&][a-zA-Z]+|\\u[0-9a-f]{4}', row[0])
        if matches:
            print(f"Broken patterns found: {matches[:5]}")
            print(f"Sample: {row[0][:300]}...")
            print("---")

# Check request_body
print("\n=== Checking request_body ===")
cur.execute("SELECT request_body FROM access_logs WHERE request_body IS NOT NULL AND (request_body LIKE '%?%' OR request_body LIKE '%&%') LIMIT 3")
for row in cur.fetchall():
    if row[0]:
        import re
        matches = re.findall(r'\?[a-zA-Z]{1,3}|&[a-zA-Z]{1,3}', row[0])
        if matches:
            print(f"Found in request_body: {set(matches)}")

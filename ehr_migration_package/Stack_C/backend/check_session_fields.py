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

# First get column names from access_logs
print("=== Columns in access_logs table ===")
cur.execute("DESCRIBE access_logs")
columns = [row[0] for row in cur.fetchall()]
print(columns)

# Get a sample session log with all columns
print("\n=== Sample Session Log ===")
cur.execute(f"""
    SELECT * FROM access_logs 
    WHERE action LIKE '%Đăng nhập%' OR log_type = 'system_auth'
    ORDER BY timestamp DESC
    LIMIT 1
""")
row = cur.fetchone()
if row:
    for i, col in enumerate(columns):
        value = row[i]
        if value and len(str(value)) > 100:
            value = str(value)[:100] + "..."
        print(f"{col}: {value}")

# Check details JSON
print("\n\n=== Session Log Details JSON ===")
cur.execute("""
    SELECT details FROM access_logs 
    WHERE log_type = 'system_auth' AND details IS NOT NULL
    LIMIT 1
""")
row = cur.fetchone()
if row and row[0]:
    try:
        details = json.loads(row[0])
        print(json.dumps(details, indent=2, ensure_ascii=False))
    except:
        print(row[0][:500])

import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Check logs with action containing "thuốc"
print("=== Logs with action containing 'thuốc' ===")
cur.execute("SELECT action FROM access_logs WHERE action LIKE '%thuốc%' LIMIT 10")
rows = cur.fetchall()
print(f"Found {len(rows)} logs with 'thuốc'")
for row in rows:
    print(f"  {row[0]}")

# Check logs related to prescription
print("\n=== Logs with action containing 'prescription' ===")
cur.execute("SELECT action FROM access_logs WHERE action LIKE '%prescription%' LIMIT 10")
rows = cur.fetchall()
print(f"Found {len(rows)} logs with 'prescription'")
for row in rows:
    print(f"  {row[0]}")

# Check all distinct actions that might relate to medication/drugs
print("\n=== All distinct actions related to drugs/medication ===")
cur.execute("""
    SELECT DISTINCT action 
    FROM access_logs 
    WHERE action LIKE '%drug%' 
       OR action LIKE '%medication%' 
       OR action LIKE '%thuốc%'
       OR action LIKE '%prescription%'
       OR action LIKE '%đơn%'
    LIMIT 20
""")
for row in cur.fetchall():
    print(f"  {row[0]}")

# Check changed_fields for prescription logs
print("\n=== Logs with changed_fields containing medication/prescription ===")
cur.execute("""
    SELECT action, changed_fields IS NOT NULL as has_cf
    FROM access_logs 
    WHERE changed_fields LIKE '%prescription%' 
       OR changed_fields LIKE '%medication%'
       OR changed_fields LIKE '%drug%'
    LIMIT 5
""")
for row in cur.fetchall():
    print(f"  Action: {row[0]}, has_changed_fields: {row[1]}")

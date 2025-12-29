import mysql.connector
conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Check brute-force logs
print("=== Brute-force logs ===")
cur.execute("""
    SELECT timestamp, action, log_type, user_id, role, purpose
    FROM access_logs 
    WHERE action LIKE '%BRUTE%' OR action LIKE '%thất bại%'
    ORDER BY timestamp DESC
    LIMIT 10
""")
for row in cur.fetchall():
    print(f"{row[0]}: {row[1][:50]}... | type={row[2]} | user={row[3]} | role={row[4]} | purpose={row[5]}")

# Check logs with role = 'user'
print("\n=== Logs with role='user' ===")
cur.execute("""
    SELECT COUNT(*) FROM access_logs WHERE role = 'user'
""")
print(f"Total: {cur.fetchone()[0]}")

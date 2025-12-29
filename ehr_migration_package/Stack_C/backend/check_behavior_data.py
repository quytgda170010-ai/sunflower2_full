import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Check total logs in date range
print("=== Total logs in date range 17-18/12/2025 ===")
cur.execute("""
    SELECT COUNT(*) FROM access_logs 
    WHERE timestamp >= '2025-12-17' AND timestamp < '2025-12-19'
""")
print(f"Total: {cur.fetchone()[0]}")

# Check distinct log_types
print("\n=== Distinct log_types ===")
cur.execute("""
    SELECT DISTINCT log_type, COUNT(*) as cnt
    FROM access_logs
    WHERE timestamp >= '2025-12-17' AND timestamp < '2025-12-19'
    GROUP BY log_type
""")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

# Check roles
print("\n=== Distinct roles ===")
cur.execute("""
    SELECT DISTINCT role, COUNT(*) as cnt
    FROM access_logs
    WHERE timestamp >= '2025-12-17' AND timestamp < '2025-12-19'
    GROUP BY role
""")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

import mysql.connector
from datetime import datetime, timedelta

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Check recent login failures
print("=== Recent login failures (status 401/403/423) ===")
cur.execute("""
    SELECT timestamp, action, status, user_id, ip_address, role
    FROM access_logs 
    WHERE status IN (401, 403, 423) 
    OR action LIKE '%sai%' 
    OR action LIKE '%thất bại%'
    OR action LIKE '%fail%'
    ORDER BY timestamp DESC
    LIMIT 20
""")
for row in cur.fetchall():
    print(f"{row[0]}: {row[1]} (status={row[2]}, user={row[3]}, ip={row[4]})")

# Check recent login attempts (any)
print("\n=== Recent login logs (last 1 hour) ===")
cur.execute("""
    SELECT timestamp, action, status, user_id, log_type
    FROM access_logs 
    WHERE (action LIKE '%đăng nhập%' OR action LIKE '%login%' OR log_type = 'SESSION_LOG')
    AND timestamp >= NOW() - INTERVAL 1 HOUR
    ORDER BY timestamp DESC
    LIMIT 20
""")
for row in cur.fetchall():
    print(f"{row[0]}: {row[1]} (status={row[2]}, user={row[3]}, type={row[4]})")

# Check if there are any logs from today
print("\n=== Total logs today ===")
cur.execute("SELECT COUNT(*) FROM access_logs WHERE DATE(timestamp) = CURDATE()")
print(f"Total: {cur.fetchone()[0]}")

# Check SECURITY_ALERT logs
print("\n=== SECURITY_ALERT logs ===")
cur.execute("""
    SELECT timestamp, action, log_type, details
    FROM access_logs 
    WHERE log_type = 'SECURITY_ALERT' OR log_type = 'SECURITY_INCIDENT'
    ORDER BY timestamp DESC
    LIMIT 10
""")
for row in cur.fetchall():
    print(f"{row[0]}: {row[1]} (type={row[2]})")

import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Check what logs are matching ENCOUNTER_LOG filter
print("=== Logs matching ENCOUNTER_LOG filter but shouldn't ===")
cur.execute("""
    SELECT id, action, uri, log_type
    FROM access_logs
    WHERE (
        (uri LIKE '%/doctor%' OR uri LIKE '%/doctor-first%' OR uri LIKE '%/medical-records%' OR action LIKE '%khám%')
        AND (log_type NOT IN ('system_tls', 'system_dlp', 'system_auth') OR log_type IS NULL)
        AND action NOT LIKE '%TLS%' AND action NOT LIKE '%DLP%'
    )
    AND (action LIKE '%Access%' OR action LIKE '%hàng chờ%')
    LIMIT 10
""")
for row in cur.fetchall():
    print(f"ID: {row[0]}")
    print(f"  Action: {row[1]}")
    print(f"  URI: {row[2]}")
    print(f"  log_type: {row[3]}")
    print()

# Check if there are distinct actions in ENCOUNTER_LOG filter
print("\n=== Distinct actions in current ENCOUNTER_LOG filter ===")
cur.execute("""
    SELECT DISTINCT action
    FROM access_logs
    WHERE (
        (uri LIKE '%/doctor%' OR uri LIKE '%/doctor-first%' OR uri LIKE '%/medical-records%' OR action LIKE '%khám%')
        AND (log_type NOT IN ('system_tls', 'system_dlp', 'system_auth') OR log_type IS NULL)
    )
    LIMIT 20
""")
for row in cur.fetchall():
    print(f"  {row[0]}")

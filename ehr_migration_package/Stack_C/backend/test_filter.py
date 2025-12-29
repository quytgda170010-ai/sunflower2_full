import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Check what the ENCOUNTER_LOG filter will return with the NEW filter
print("=== Testing new ENCOUNTER_LOG filter ===\n")
cur.execute("""
    SELECT a.action, a.uri, a.log_type, a.operation
    FROM access_logs a
    WHERE (
        (
            a.action LIKE '%prescription%' 
            OR a.action LIKE '%khám%'
            OR a.action LIKE '%Create prescription%'
            OR a.uri LIKE '%/medical-records/%'
            OR (a.log_type = 'emr_access_log' AND a.operation = 'create' AND a.changed_fields LIKE '%record_type%')
        )
        AND a.action NOT IN ('Access', 'Xem Access')
        AND a.action NOT LIKE '%hàng chờ%'
        AND a.action NOT LIKE '%queue%'
        AND (a.log_type NOT IN ('system_tls', 'system_dlp', 'system_auth', 'SYSTEM_TLS_LOG', 'SYSTEM_DLP_LOG', 'SYSTEM_AUTH_LOG') OR a.log_type IS NULL)
    )
    ORDER BY a.timestamp DESC
    LIMIT 10
""")
rows = cur.fetchall()
print(f"Found {len(rows)} rows matching new filter:\n")
for row in rows:
    print(f"  Action: {row[0]}")
    print(f"  URI: {row[1]}")
    print(f"  log_type: {row[2]}, operation: {row[3]}")
    print()

# Check logs with action 'Xem Access' - why might they appear
print("\n=== Checking 'Xem Access' logs ===")
cur.execute("""
    SELECT action, log_type, operation, changed_fields IS NOT NULL as has_cf
    FROM access_logs
    WHERE action = 'Xem Access'
    LIMIT 3
""")
for row in cur.fetchall():
    print(f"  Action: {row[0]}, log_type: {row[1]}, op: {row[2]}, has_cf: {row[3]}")

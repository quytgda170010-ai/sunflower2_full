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

# Check TLS log details
print("=" * 50)
print("TLS LOG (system_tls):")
print("=" * 50)
cur.execute("SELECT details FROM access_logs WHERE log_type = 'system_tls' AND details IS NOT NULL LIMIT 1")
result = cur.fetchone()
if result and result[0]:
    try:
        details = json.loads(result[0])
        for key, value in details.items():
            print(f"  {key}: {value}")
    except:
        print(f"Raw: {result[0][:300]}")

# Check SSO/Auth log details
print("\n" + "=" * 50)
print("SSO/AUTH LOG (system_auth):")
print("=" * 50)
cur.execute("SELECT details FROM access_logs WHERE log_type = 'system_auth' AND details IS NOT NULL LIMIT 1")
result = cur.fetchone()
if result and result[0]:
    try:
        details = json.loads(result[0])
        for key, value in details.items():
            print(f"  {key}: {value}")
    except:
        print(f"Raw: {result[0][:300]}")

# Check Encryption log details
print("\n" + "=" * 50)
print("ENCRYPTION LOG (emr_encryption):")
print("=" * 50)
cur.execute("SELECT details FROM access_logs WHERE log_type = 'emr_encryption' AND details IS NOT NULL LIMIT 1")
result = cur.fetchone()
if result and result[0]:
    try:
        details = json.loads(result[0])
        for key, value in details.items():
            print(f"  {key}: {value}")
    except:
        print(f"Raw: {result[0][:300]}")

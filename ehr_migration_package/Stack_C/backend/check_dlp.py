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

# Check DLP log details structure
cur.execute("SELECT details FROM access_logs WHERE log_type = 'system_dlp' AND details IS NOT NULL LIMIT 1")
result = cur.fetchone()
if result and result[0]:
    try:
        details = json.loads(result[0])
        print("DLP log details fields:")
        for key, value in details.items():
            print(f"  {key}: {value}")
    except:
        print(f"Raw details: {result[0][:500]}")

import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# List all tables
print("=== All tables in ehr_core ===")
cur.execute("SHOW TABLES")
for row in cur.fetchall():
    table_name = row[0]
    print(f"  {table_name}")
    
# Check compliance_rules if exists
print("\n=== Checking compliance_rules table ===")
try:
    cur.execute("SHOW COLUMNS FROM compliance_rules")
    for row in cur.fetchall():
        print(f"  Column: {row[0]}")
    cur.execute("SELECT rule_code, rule_name_vi, rule_name FROM compliance_rules LIMIT 10")
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]} | {row[2]}")
except Exception as e:
    print(f"  Error: {e}")

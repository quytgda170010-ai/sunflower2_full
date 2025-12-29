import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Check siem_law_rules
print("=== siem_law_rules columns ===")
cur.execute("SHOW COLUMNS FROM siem_law_rules")
for row in cur.fetchall():
    print(f"  {row[0]}")

print("\n=== R-SEC rules in siem_law_rules ===")
cur.execute("SELECT rule_code, rule_name FROM siem_law_rules WHERE rule_code LIKE 'R-SEC%'")
for row in cur.fetchall():
    print(f"{row[0]}: {row[1]}")

print("\n=== Broken patterns check ===")
cur.execute("SELECT rule_code, rule_name FROM siem_law_rules WHERE rule_name LIKE '%?%'")
for row in cur.fetchall():
    print(f"BROKEN: {row[0]}: {row[1]}")

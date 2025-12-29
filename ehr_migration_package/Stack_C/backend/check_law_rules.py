import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Check law_rules table
print("=== law_rules table samples ===")
cur.execute("SELECT rule_code, rule_name FROM law_rules WHERE rule_code LIKE 'R-SEC%' LIMIT 10")
for row in cur.fetchall():
    print(f"{row[0]}: {row[1]}")

# Check if there are broken patterns
print("\n=== Checking for broken patterns in rule_name ===")
cur.execute("""
    SELECT rule_code, rule_name FROM law_rules 
    WHERE rule_name LIKE '%?%' OR rule_name LIKE '%???%'
    LIMIT 20
""")
for row in cur.fetchall():
    print(f"{row[0]}: {row[1]}")

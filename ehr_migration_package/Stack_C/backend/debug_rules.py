
import mysql.connector
import os
import json

def check_rules():
    db_config = {
        'host': 'mariadb',
        'user': 'openemr',
        'password': 'Openemr!123',
        'database': 'ehr_core',
        'charset': 'utf8mb4'
    }
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    print("Fetching R-SEC-03 rule definition...")
    cursor.execute("SELECT * FROM law_rules WHERE rule_code IN ('R-SEC-03', 'R-SEC-01')")
    
    rules = cursor.fetchall()
    for rule in rules:
        print("-" * 50)
        print(f"Rule Code: {rule['rule_code']}")
        print(f"Name: {rule['rule_name']}")
        print(f"Group: {rule['functional_group']}")
        print(f"Required Fields: {rule['required_log_fields']}")
        print(f"Status: {rule['allowed_status']}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_rules()

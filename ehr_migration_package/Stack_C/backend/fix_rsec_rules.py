import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4',
    use_unicode=True
)
cur = conn.cursor()

# Additional replacements for remaining broken patterns
replacements = [
    # R-SEC specific
    ('Cờ bấn', 'Cơ bản'),
    ('Giờm sờt', 'Giám sát'),
    ('ấờ', 'ộ'),
    ('có?', 'cấ'),
    ('ờ', 'ơ'),  # careful with this one
    ('ờ?', 'ơ'),
    ('thuấ', 'thuộc'),
    ('bấ', 'bỏ'),
    ('thấ', 'thể'),
    ('dấn', 'dẫn'),
    ('hấ', 'hồ'),
    ('có?', 'cấ'),
    ('ầ', 'à'),
    ('ấ', 'ộ'),
    ('ờ', 'ơ'),
]

# Replace R-SEC rules specifically with correct names
correct_rules = {
    'R-SEC-01': 'Phát hiện tấn công SQL Injection (Cơ bản)',
    'R-SEC-02': 'Ngăn chặn tấn công SQL Injection (Nâng cao)',
    'R-SEC-03': 'Giám sát hành vi truy vấn bất thường',
    'R-SEC-04': 'Phòng chống tấn công mạng trái phép (Cyberattack Prevention)',
    'R-SEC-05': 'Quy trình xử lý khắc phục sự cố',
    'R-SEC-06': 'Kiểm soát xác thực & Chống Brute-force',
    'R-SEC-07': 'Secure Log-on Procedures (Quy trình đăng nhập an toàn)',
}

# Direct update for R-SEC rules
print("=== Fixing R-SEC rules directly ===")
for rule_code, rule_name in correct_rules.items():
    cur.execute(
        "UPDATE siem_law_rules SET rule_name = %s WHERE rule_code = %s",
        (rule_name, rule_code)
    )
    print(f"FIXED: {rule_code} -> {rule_name}")

conn.commit()

# Verify
print("\n=== Verification - R-SEC rules ===")
cur.execute("SELECT rule_code, rule_name FROM siem_law_rules WHERE rule_code LIKE 'R-SEC%'")
for row in cur.fetchall():
    print(f"{row[0]}: {row[1]}")

conn.close()

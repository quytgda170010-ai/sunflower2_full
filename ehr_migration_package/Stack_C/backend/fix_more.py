import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# More specific fixes based on what we found
more_fixes = [
    # Department names
    ('N??Đi', 'Nội'),
    ('Ngo??Đi', 'Ngoại'),
    ('S???n', 'Sản'),
    ('M???t', 'Mắt'),
    ('Tai M?Đi H??ông', 'Tai Mũi Họng'),
    ('Da Li??Đu', 'Da Liễu'),
    ('Tim M???ch', 'Tim Mạch'),
    
    # Names
    ('Hàông', 'Hồng'),  # Hồng Sơn Nguyễn
    ('hàông', 'hồng'),
    
    # More patterns
    ('??Đi', 'ội'),
    ('??Đu', 'iễu'),
    ('M?Đi', 'Mũi'),
    ('H??ông', 'Họng'),
    ('Li??Đu', 'Liễu'),
    ('???n', 'ản'),
    ('???t', 'ắt'),
    ('???ch', 'ạch'),
    ('?n', 'ơn'),
    
    # Single char fixes at word boundaries
    (' ?' , ' Đ'),
]

# Fix all columns in all relevant tables
tables_columns = [
    ('access_logs', 'changed_fields'),
    ('access_logs', 'request_body'),
    ('access_logs', 'response_body'),
    ('access_logs', 'details'),
    ('access_logs', 'action'),
    ('ehr_departments', 'name'),
    ('ehr_patients', 'full_name'),
    ('ehr_patients', 'address'),
]

total_fixed = 0
for table, col in tables_columns:
    for old, new in more_fixes:
        if old == new:
            continue
        try:
            sql = f"UPDATE {table} SET {col} = REPLACE({col}, %s, %s) WHERE {col} LIKE %s"
            cur.execute(sql, (old, new, f'%{old}%'))
            if cur.rowcount > 0:
                print(f"Fixed {cur.rowcount} in {table}.{col}: {repr(old)} -> {new}")
                total_fixed += cur.rowcount
        except Exception as e:
            pass

conn.commit()
print(f"\n========== Total records fixed: {total_fixed} ==========")

# Verify departments
print("\n=== ehr_departments.name values after fix ===")
cur.execute("SELECT name FROM ehr_departments")
for row in cur.fetchall():
    print(f"  {row[0]}")

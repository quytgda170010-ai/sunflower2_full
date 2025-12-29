import mysql.connector

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Complete Vietnamese character fixes
vietnamese_fixes = [
    # Common broken patterns -> correct Vietnamese
    ('Nguy???n', 'Nguyễn'),
    ('Vi???t', 'Việt'),
    ('Xu??n', 'Xuân'),
    ('Ho??ng', 'Hoàng'),
    ('Tr???n', 'Trần'),
    ('Qu??', 'Quý'),
    ('V??n', 'Văn'),
    ('Th???', 'Thị'),
    ('L??', 'Lê'),
    ('Ph???m', 'Phạm'),
    ('????o', 'Đào'),
    ('H????ng', 'Hương'),
    ('H???i', 'Hải'),
    ('????c', 'Đức'),
    ('Tu???n', 'Tuấn'),
    ('D????ng', 'Dương'),
    ('Ng???c', 'Ngọc'),
    ('H??', 'Hà'),
    ('Ph??c', 'Phúc'),
    ('B???o', 'Bảo'),
    ('b???nh', 'bệnh'),
    ('nh??n', 'nhân'),
    ('th???ng', 'thống'),
    ('h???', 'hệ'),
    ('li???u', 'liệu'),
    ('d???', 'dữ'),
    ('ng?????i', 'người'),
    ('d??ng', 'dùng'),
    ('th???i', 'thời'),
    ('gian', 'gian'),
    # More specific patterns
    ('????ng', 'Đăng'),
    ('nh???p', 'nhập'),
    ('xu???t', 'xuất'),
    ('th??nh', 'thành'),
    ('c??ng', 'công'),
    ('th???t', 'thất'),
    ('b???i', 'bại'),
    ('T??i', 'Tài'),
    ('kho???n', 'khoản'),
    ('kh??a', 'khóa'),
    ('b???', 'bị'),
    ('x??c', 'xác'),
    ('th???c', 'thực'),
    ('qu???n', 'quản'),
    ('l??', 'lý'),
    ('b??c', 'bác'),
    ('s??', 'sĩ'),
    ('l???', 'lễ'),
    ('t??n', 'tân'),
    ('d?????c', 'dược'),
    ('??i???u', 'điều'),
    ('d?????ng', 'dưỡng'),
    ('m???i', 'mới'),
    ('c???p', 'cập'),
    ('tra', 'tra'),
    ('c???u', 'cứu'),
    ('T???o', 'Tạo'),
    ('s???a', 'sửa'),
    ('x??a', 'xóa'),
    ('h???', 'hồ'),
    ('s??', 'sơ'),
    ('l???ch', 'lịch'),
    ('h???n', 'hẹn'),
    ('thu???c', 'thuốc'),
    ('kh??m', 'khám'),
    ('n???i', 'nội'),
    ('dung', 'dung'),
    ('kh???i', 'khởi'),
    ('ph???c', 'phục'),
    ('c???u', 'cấu'),
    ('h??nh', 'hình'),
    ('Ph??t', 'Phát'),
    ('hi???n', 'hiện'),
    ('m???t', 'mật'),
    ('kh???u', 'khẩu'),
    ('????i', 'Đổi'),
]

# Fix all tables and columns
tables_columns = [
    ('access_logs', ['action', 'actor_name', 'patient_name', 'purpose', 'details', 'changed_fields']),
    ('ehr_patients', ['full_name', 'address']),
]

total_fixed = 0
for table, columns in tables_columns:
    for col in columns:
        for old, new in vietnamese_fixes:
            try:
                sql = f"UPDATE {table} SET {col} = REPLACE({col}, %s, %s) WHERE {col} LIKE %s"
                cur.execute(sql, (old, new, f'%{old}%'))
                if cur.rowcount > 0:
                    print(f"Fixed {cur.rowcount} in {table}.{col}: {old} -> {new}")
                    total_fixed += cur.rowcount
            except Exception as e:
                pass  # Ignore errors for columns that don't exist

conn.commit()
print(f"\nTotal records fixed: {total_fixed}")

# Verify
cur.execute("SELECT full_name FROM ehr_patients LIMIT 5")
print("\nehr_patients.full_name:", [r[0] for r in cur.fetchall()])

cur.execute("SELECT DISTINCT action FROM access_logs WHERE action LIKE '%VIEW%' LIMIT 5")
print("Sample VIEW actions:", [r[0] for r in cur.fetchall()])

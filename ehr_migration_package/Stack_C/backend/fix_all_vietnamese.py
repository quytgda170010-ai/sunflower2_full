import mysql.connector
import json
import re

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

# Comprehensive Vietnamese character fixes - ALL possible broken patterns
vietnamese_fixes = [
    # Common names
    ('Nguy???n', 'Nguyễn'), ('nguy???n', 'nguyễn'),
    ('Vi???t', 'Việt'), ('vi???t', 'việt'),
    ('Xu??n', 'Xuân'), ('xu??n', 'xuân'),
    ('Ho??ng', 'Hoàng'), ('ho??ng', 'hoàng'),
    ('Tr???n', 'Trần'), ('tr???n', 'trần'),
    ('L??', 'Lê'), ('l??', 'lê'),
    ('Ph???m', 'Phạm'), ('ph???m', 'phạm'),
    ('V??', 'Vũ'), ('v??', 'vũ'),
    ('V??n', 'Văn'), ('v??n', 'văn'),
    ('Th???', 'Thị'), ('th???', 'thị'),
    ('H????ng', 'Hương'), ('h????ng', 'hương'),
    ('H???i', 'Hải'), ('h???i', 'hải'),
    ('????c', 'Đức'), ('????c', 'đức'),
    ('Tu???n', 'Tuấn'), ('tu???n', 'tuấn'),
    ('D????ng', 'Dương'), ('d????ng', 'dương'),
    ('Ng???c', 'Ngọc'), ('ng???c', 'ngọc'),
    ('Ph??c', 'Phúc'), ('ph??c', 'phúc'),
    ('B???o', 'Bảo'), ('b???o', 'bảo'),
    ('S??n', 'Sơn'), ('s??n', 'sơn'),
    ('Qu??', 'Quý'), ('qu??', 'quý'),
    ('????o', 'Đào'), ('????o', 'đào'),
    ('H??', 'Hà'), ('h??', 'hà'),
    
    # Common medical/department terms
    ('?7a', 'Đa'), ('?a', 'đa'),
    ('khoa', 'khoa'),
    ('Kh??ng', 'Không'), ('kh??ng', 'không'),
    ('sinh', 'sinh'),
    ('vi??n', 'viên'),
    ('U???NG', 'UỐNG'), ('u???ng', 'uống'),
    ('?????ng', 'Đừng'), ('?????ng', 'đừng'),
    ('?????n', 'đến'),
    ('thu???c', 'thuốc'),
    ('b???nh', 'bệnh'),
    ('nh??n', 'nhân'),
    ('kh??m', 'khám'),
    ('n???i', 'nội'),
    ('ngo???i', 'ngoại'),
    ('tim', 'tim'),
    ('m???ch', 'mạch'),
    ('th???n', 'thần'),
    ('kinh', 'kinh'),
    ('da', 'da'),
    ('li???u', 'liễu'),
    ('x????ng', 'xương'),
    ('kh???p', 'khớp'),
    ('m???t', 'mắt'),
    ('tai', 'tai'),
    ('m??i', 'mũi'),
    ('h???ng', 'họng'),
    ('r??ng', 'răng'),
    ('h??m', 'hàm'),
    
    # Common action words
    ('????ng', 'Đăng'), ('????ng', 'đăng'),
    ('nh???p', 'nhập'),
    ('xu???t', 'xuất'),
    ('th??nh', 'thành'),
    ('c??ng', 'công'),
    ('th???t', 'thất'),
    ('b???i', 'bại'),
    ('T??i', 'Tài'), ('t??i', 'tài'),
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
    ('nh???t', 'nhật'),
    ('tra', 'tra'),
    ('c???u', 'cứu'),
    ('T???o', 'Tạo'), ('t???o', 'tạo'),
    ('s???a', 'sửa'),
    ('x??a', 'xóa'),
    ('h???', 'hồ'),
    ('s??', 'sơ'),
    ('l???ch', 'lịch'),
    ('h???n', 'hẹn'),
    ('kh???i', 'khởi'),
    ('ph???c', 'phục'),
    ('c???u', 'cấu'),
    ('h??nh', 'hình'),
    ('Ph??t', 'Phát'), ('ph??t', 'phát'),
    ('hi???n', 'hiện'),
    ('m???t', 'mật'),
    ('kh???u', 'khẩu'),
    ('????i', 'Đổi'), ('????i', 'đổi'),
    
    # More patterns
    ('???i', 'ối'),
    ('???c', 'ức'),
    ('???n', 'ứn'),
    ('???ng', 'ứng'),
    ('???a', 'ưa'),
    ('???u', 'ữu'),
    ('???', 'ễ'),
    ('???', 'ệ'),
    ('???', 'ậ'),
    ('???', 'ấ'),
    ('???', 'ầ'),
    ('???', 'ẩ'),
    ('???', 'ẫ'),
    ('??', 'ơ'),
    ('??', 'ư'),
    ('??', 'ê'),
    ('??', 'ô'),
    ('??', 'â'),
    ('??', 'Đ'),
    ('??', 'đ'),
    ('??', 'á'),
    ('??', 'à'),
    ('??', 'ả'),
    ('??', 'ã'),
    ('??', 'ạ'),
    ('??', 'é'),
    ('??', 'è'),
    ('??', 'ẻ'),
    ('??', 'ẽ'),
    ('??', 'ẹ'),
    ('??', 'í'),
    ('??', 'ì'),
    ('??', 'ỉ'),
    ('??', 'ĩ'),
    ('??', 'ị'),
    ('??', 'ó'),
    ('??', 'ò'),
    ('??', 'ỏ'),
    ('??', 'õ'),
    ('??', 'ọ'),
    ('??', 'ú'),
    ('??', 'ù'),
    ('??', 'ủ'),
    ('??', 'ũ'),
    ('??', 'ụ'),
    ('??', 'ý'),
    ('??', 'ỳ'),
    ('??', 'ỷ'),
    ('??', 'ỹ'),
    ('??', 'ỵ'),
    
    # Fix remaining ? patterns
    ('?7a', 'Đa'),
    ('H???ng', 'Hồng'),
]

# Fix all columns that can contain text
columns_to_fix = [
    ('access_logs', 'action'),
    ('access_logs', 'actor_name'),
    ('access_logs', 'patient_name'),
    ('access_logs', 'purpose'),
    ('access_logs', 'details'),
    ('access_logs', 'changed_fields'),
    ('access_logs', 'request_body'),
    ('access_logs', 'response_body'),
    ('ehr_patients', 'full_name'),
    ('ehr_patients', 'address'),
]

total_fixed = 0
for table, col in columns_to_fix:
    for old, new in vietnamese_fixes:
        if old == new:
            continue
        try:
            sql = f"UPDATE {table} SET {col} = REPLACE({col}, %s, %s) WHERE {col} LIKE %s"
            cur.execute(sql, (old, new, f'%{old}%'))
            if cur.rowcount > 0:
                print(f"Fixed {cur.rowcount} in {table}.{col}: {repr(old)} -> {new}")
                total_fixed += cur.rowcount
        except Exception as e:
            pass  # Ignore errors for non-existent columns

conn.commit()
print(f"\n========== Total records fixed: {total_fixed} ==========")

# Verify
print("\n--- Verification ---")
cur.execute("SELECT changed_fields FROM access_logs WHERE changed_fields IS NOT NULL AND changed_fields LIKE '%???%' LIMIT 1")
result = cur.fetchone()
if result:
    print(f"Still broken: {result[0][:200]}...")
else:
    print("No more broken changed_fields found!")

import mysql.connector
import re

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4',
    use_unicode=True
)
cur = conn.cursor()

# Common broken patterns -> correct Vietnamese
replacements = {
    # Common patterns
    'Ph??t hi???n': 'Phát hiện',
    'Ng??n ch???n': 'Ngăn chặn',
    't???n c??ng': 'tấn công',
    'h??nh vi': 'hành vi',
    'truy v???n': 'truy vấn',
    'b???t th?????ng': 'bất thường',
    'Ph??ng ch???ng': 'Phòng chống',
    'm???ng': 'mạng',
    'tr??i ph??p': 'trái phép',
    'Quy tr??nh': 'Quy trình',
    'x??? l??': 'xử lý',
    'kh???c ph???c': 'khắc phục',
    's??? c???': 'sự cố',
    'Ki???m so??t': 'Kiểm soát',
    'x??c th???c': 'xác thực',
    'Ch???ng': 'Chống',
    '????ng nh???p': 'Đăng nhập',
    '????ng xu???t': 'Đăng xuất',
    'an to??n': 'an toàn',
    'c???p ph??p': 'cấp phép',
    'h??nh ngh???': 'hành nghề',
    'h???p l???': 'hợp lệ',
    'c???nh b??o': 'cảnh báo',
    'ch??? k??': 'chữ ký',
    'n???i dung': 'nội dung',
    '?????c quy???n': 'đặc quyền',
    'phi??n': 'phiên',
    'm???t kh???u': 'mật khẩu',
    'm?? h??a': 'mã hóa',
    'th???i gian': 'thời gian',
    'h??? th???ng': 'hệ thống',
    'd??? li???u': 'dữ liệu',
    'nh???n d???ng': 'nhận dạng',
    '?????ng b???': 'đồng bộ',
    't??i kho???n': 'tài khoản',
    'r???i ro': 'rủi ro',
    's??? d???ng': 's dụng',
    '?????nh k???': 'định kỳ',
    'nh??n vi??n': 'nhân viên',
    'tu??n th???': 'tuân thủ',
    'b??o c??o': 'báo cáo',
    'gi??m s??t': 'giám sát',
    '????nh gi??': 'đánh giá',
    'b???o m???t': 'bảo mật',
    'qu???n l??': 'quản lý',
    '????o t???o': 'đào tạo',
    'quy ch???': 'quy chế',
    'th??ng tin': 'thông tin',
    'y t???': 'y tế',
    'ph???n ???ng': 'phản ứng',
    'chia s???': 'chia sẻ',
    'xu???t': 'xuất',
    'nh???p': 'nhập',
    'l??u': 'lưu',
    'v??ng': 'vòng',
    'log': 'log',
    'ph???i': 'phải',
    'c??': 'có',
    'c???a': 'của',
    'v???i': 'với',
    'khi': 'khi',
    '???????c': 'được',
    'kh??ng': 'không',
    'tr??n': 'trên',
    'm???i': 'mỗi',
    '???': 'ở',
    'l???n': 'lần',
    'th??ng': 'tháng',
    'ng??y': 'ngày',
    'n??m': 'năm',
    'ho???t ?????ng': 'hoạt động',
    'li??n t???c': 'liên tục',
    'k??? ho???ch': 'kế hoạch',
    'th??nh l???p': 'thành lập',
    'ch??? ?????nh': 'chỉ định',
    'c??n b???': 'cán bộ',
    'ph??? tr??ch': 'phụ trách',
    'n???i b???': 'nội bộ',
    'truy c???p': 'truy cập',
    'to??n b???': 'toàn bộ',
    '????n v???': 'đơn vị',
    'thi???t b???': 'thiết bị',
    'ch??a duy???t': 'chưa duyệt',
    'c???p nh???t': 'cập nhật',
    'ch??nh s??ch': 'chính sách',
    'lu???t': 'luật',
    'thay ?????i': 'thay đổi',
    'm?? ph???ng': 'mô phỏng',
    'ch???ng ch???': 'chứng chỉ',
    'hi???u su???t': 'hiệu suất',
    'L??nh ?????o': 'Lãnh đạo',
    'tham gia': 'tham gia',
    'X??y d???ng': 'Xây dựng',
    'S??? Y t???': 'Sở Y tế',
    
    # Special R-SEC rules
    'C?? b???n': 'Cơ bản',
    'N??ng cao': 'Nâng cao',
    'Cyberattack': 'Cyberattack',
    'Prevention': 'Prevention',
    'Brute-force': 'Brute-force',
    'Secure Log-on Procedures': 'Secure Log-on Procedures',
    
    # General broken Vietnamese character patterns
    '???': 'ả',
    '???': 'ố',
    '???': 'ế',
    '???': 'ị',
    '???': 'ấ',
    '??': 'ủ',
    '??': 'ọ',
    '??': 'ù',
    '??': 'ễ',
    '??': 'ờ',
}

# Fix each broken rule
print("=== Fixing broken rules in siem_law_rules ===")
cur.execute("SELECT id, rule_code, rule_name FROM siem_law_rules WHERE rule_name LIKE '%?%'")
broken_rules = cur.fetchall()
print(f"Found {len(broken_rules)} broken rules")

fixed_count = 0
for rule_id, rule_code, rule_name in broken_rules:
    original_name = rule_name
    fixed_name = rule_name
    
    # Apply all replacements
    for broken, correct in replacements.items():
        fixed_name = fixed_name.replace(broken, correct)
    
    # If changed, update
    if fixed_name != original_name:
        try:
            cur.execute(
                "UPDATE siem_law_rules SET rule_name = %s WHERE id = %s",
                (fixed_name, rule_id)
            )
            fixed_count += 1
            print(f"FIXED {rule_code}: {original_name[:50]}... -> {fixed_name[:50]}...")
        except Exception as e:
            print(f"ERROR fixing {rule_code}: {e}")

conn.commit()
print(f"\n=== Fixed {fixed_count} rules ===")

# Verify
print("\n=== Verification - R-SEC rules after fix ===")
cur.execute("SELECT rule_code, rule_name FROM siem_law_rules WHERE rule_code LIKE 'R-SEC%'")
for row in cur.fetchall():
    print(f"{row[0]}: {row[1]}")

conn.close()

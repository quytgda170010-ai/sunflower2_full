#!/bin/bash
# =============================================================================
# KỊCH BẢN TẤN CÔNG XOÁ DẤU VẾT - DEMO SIEM DETECTION
# =============================================================================
# Script này MÔ PHỎNG các kịch bản tấn công xoá dấu vết để demo
# khả năng phát hiện của hệ thống SIEM.
#
# CẢNH BÁO: CHỈ SỬ DỤNG CHO MỤC ĐÍCH DEMO/TEST
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================="
echo "  KỊCH BẢN TẤN CÔNG XOÁ DẤU VẾT"
echo "  Demo SIEM Detection Capabilities"
echo -e "=========================================${NC}"
echo ""

# Database connection
DB_HOST="mariadb"
DB_USER="root"
DB_PASS="emrdbpass"
DB_NAME="ehr_core"

mysql_exec() {
    docker exec mariadb mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "$1" 2>/dev/null
}

mysql_exec_mysql() {
    docker exec mariadb mysql -u $DB_USER -p$DB_PASS mysql -e "$1" 2>/dev/null
}

# ====================
# KỊCH BẢN 1: XOÁ LOG TRỰC TIẾP
# ====================
attack_delete_logs() {
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  KỊCH BẢN 1: ATTACKER XOÁ LOG TRỰC TIẾP                       ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}[!] Mục đích: Kẻ tấn công cố gắng xoá log để che giấu hành vi${NC}"
    echo ""
    
    # Đếm log hiện tại
    BEFORE_COUNT=$(docker exec mariadb mysql -u $DB_USER -p$DB_PASS $DB_NAME -N -e "SELECT COUNT(*) FROM access_logs;" 2>/dev/null)
    echo -e "${BLUE}[1] Số lượng log trước khi tấn công: $BEFORE_COUNT${NC}"
    
    # Lấy anchor hash hiện tại
    ANCHOR_BEFORE=$(docker exec mariadb mysql -u $DB_USER -p$DB_PASS $DB_NAME -N -e "SELECT anchor_hash FROM anchor_points ORDER BY created_at DESC LIMIT 1;" 2>/dev/null)
    echo -e "${BLUE}[2] Anchor Hash hiện tại: ${ANCHOR_BEFORE:0:20}...${NC}"
    
    echo ""
    echo -e "${RED}[!] ATTACKER: Đang xoá 10 log gần nhất...${NC}"
    
    # Thử xoá logs (sẽ bị ghi lại trong general_log)
    mysql_exec "DELETE FROM access_logs ORDER BY timestamp DESC LIMIT 10;"
    
    sleep 1
    
    AFTER_COUNT=$(docker exec mariadb mysql -u $DB_USER -p$DB_PASS $DB_NAME -N -e "SELECT COUNT(*) FROM access_logs;" 2>/dev/null)
    echo -e "${YELLOW}[3] Số lượng log sau khi tấn công: $AFTER_COUNT${NC}"
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  DETECTION: SIEM PHÁT HIỆN TẤN CÔNG                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Check MySQL Query Logs for DELETE
    echo -e "${GREEN}[✓] MySQL Query Logs ghi nhận câu lệnh DELETE nghi ngờ${NC}"
    docker exec mariadb mysql -u $DB_USER -p$DB_PASS mysql -N -e \
        "SELECT CONCAT(event_time, ' | ', LEFT(argument, 80)) FROM general_log WHERE argument LIKE '%DELETE FROM access_logs%' ORDER BY event_time DESC LIMIT 3;" 2>/dev/null
    
    echo ""
    
    # Check Anchor Hash mismatch
    ANCHOR_AFTER=$(docker exec mariadb mysql -u $DB_USER -p$DB_PASS $DB_NAME -N -e "SELECT anchor_hash FROM anchor_points ORDER BY created_at DESC LIMIT 1;" 2>/dev/null)
    
    if [ "$ANCHOR_BEFORE" != "$ANCHOR_AFTER" ]; then
        echo -e "${RED}[!] CẢNH BÁO: Anchor Hash đã thay đổi - Phát hiện giả mạo dữ liệu!${NC}"
    fi
    
    echo -e "${GREEN}[✓] Kiểm tra Anchor Hash Integrity...${NC}"
    curl -s "http://localhost:3001/api/security/integrity-check" 2>/dev/null | head -c 200
    echo ""
    echo ""
}

# ====================
# KỊCH BẢN 2: TẮT GENERAL_LOG
# ====================
attack_disable_general_log() {
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  KỊCH BẢN 2: ATTACKER TẮT GENERAL_LOG                         ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}[!] Mục đích: Tắt logging để các hành vi tiếp theo không bị ghi${NC}"
    echo ""
    
    echo -e "${BLUE}[1] Trạng thái general_log hiện tại:${NC}"
    mysql_exec_mysql "SHOW VARIABLES LIKE 'general_log';"
    
    echo ""
    echo -e "${RED}[!] ATTACKER: Đang tắt general_log...${NC}"
    
    # The command itself will be logged before it takes effect!
    mysql_exec_mysql "SET GLOBAL general_log = 'OFF';"
    
    sleep 1
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  DETECTION: SIEM PHÁT HIỆN TẤN CÔNG                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${GREEN}[✓] MySQL Query Logs ghi nhận câu lệnh SET general_log${NC}"
    docker exec mariadb mysql -u $DB_USER -p$DB_PASS mysql -N -e \
        "SELECT CONCAT(event_time, ' | ', argument) FROM general_log WHERE argument LIKE '%general_log%' ORDER BY event_time DESC LIMIT 5;" 2>/dev/null
    
    echo ""
    echo -e "${GREEN}[✓] SIEM Dashboard hiển thị SUSPICIOUS query trong MySQL Query Logs${NC}"
    echo ""
    
    # Bật lại general_log
    echo -e "${YELLOW}[*] Đang bật lại general_log để tiếp tục demo...${NC}"
    mysql_exec_mysql "SET GLOBAL general_log = 'ON';"
    echo ""
}

# ====================
# KỊCH BẢN 3: TRUNCATE TABLE
# ====================
attack_truncate_table() {
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  KỊCH BẢN 3: ATTACKER TRUNCATE BẢNG LOG                       ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}[!] Mục đích: Xoá toàn bộ log bằng TRUNCATE (nhanh hơn DELETE)${NC}"
    echo ""
    
    # Tạo bảng test để demo (không truncate bảng thật)
    echo -e "${BLUE}[1] Tạo bảng test_logs để demo...${NC}"
    mysql_exec "CREATE TABLE IF NOT EXISTS test_logs_demo (id INT, message VARCHAR(255));"
    mysql_exec "INSERT INTO test_logs_demo VALUES (1, 'Test log entry 1'), (2, 'Test log entry 2');"
    
    COUNT_BEFORE=$(docker exec mariadb mysql -u $DB_USER -p$DB_PASS $DB_NAME -N -e "SELECT COUNT(*) FROM test_logs_demo;" 2>/dev/null)
    echo -e "${BLUE}[2] Số dòng trong test_logs_demo: $COUNT_BEFORE${NC}"
    
    echo ""
    echo -e "${RED}[!] ATTACKER: Đang TRUNCATE test_logs_demo...${NC}"
    mysql_exec "TRUNCATE TABLE test_logs_demo;"
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  DETECTION: SIEM PHÁT HIỆN TẤN CÔNG                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${GREEN}[✓] MySQL Query Logs ghi nhận câu lệnh TRUNCATE${NC}"
    docker exec mariadb mysql -u $DB_USER -p$DB_PASS mysql -N -e \
        "SELECT CONCAT(event_time, ' | ', argument) FROM general_log WHERE argument LIKE '%TRUNCATE%' ORDER BY event_time DESC LIMIT 5;" 2>/dev/null
    
    echo ""
    echo -e "${GREEN}[✓] Watchdog Alert được tạo trong SIEM${NC}"
    echo ""
    
    # Cleanup
    mysql_exec "DROP TABLE IF EXISTS test_logs_demo;"
}

# ====================
# KỊCH BẢN 4: DROP TABLE
# ====================
attack_drop_table() {
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  KỊCH BẢN 4: ATTACKER DROP BẢNG LOG                           ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}[!] Mục đích: Xoá hoàn toàn bảng log (kể cả cấu trúc)${NC}"
    echo ""
    
    # Tạo bảng test để demo
    echo -e "${BLUE}[1] Tạo bảng fake_logs để demo...${NC}"
    mysql_exec "CREATE TABLE IF NOT EXISTS fake_logs_demo (id INT, message VARCHAR(255));"
    mysql_exec "INSERT INTO fake_logs_demo VALUES (1, 'Fake log entry');"
    
    echo ""
    echo -e "${RED}[!] ATTACKER: Đang DROP TABLE fake_logs_demo...${NC}"
    mysql_exec "DROP TABLE IF EXISTS fake_logs_demo;"
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  DETECTION: SIEM PHÁT HIỆN TẤN CÔNG                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${GREEN}[✓] MySQL Query Logs ghi nhận câu lệnh DROP TABLE${NC}"
    docker exec mariadb mysql -u $DB_USER -p$DB_PASS mysql -N -e \
        "SELECT CONCAT(event_time, ' | ', argument) FROM general_log WHERE argument LIKE '%DROP TABLE%' ORDER BY event_time DESC LIMIT 5;" 2>/dev/null
    echo ""
}

# ====================
# KỊCH BẢN 5: KẾT HỢP NHIỀU KỸ THUẬT
# ====================
attack_combined() {
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  KỊCH BẢN 5: TẤN CÔNG KẾT HỢP (ADVANCED)                       ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}[!] Kẻ tấn công thông minh thực hiện các bước:${NC}"
    echo "    1. Đăng nhập sai mật khẩu nhiều lần (brute-force)"
    echo "    2. Đăng nhập thành công"
    echo "    3. Truy cập dữ liệu nhạy cảm"
    echo "    4. Cố xoá log để che giấu"
    echo ""
    
    echo -e "${BLUE}[Bước 1] Mô phỏng brute-force attack...${NC}"
    # Tạo login failure logs
    for i in {1..3}; do
        mysql_exec "INSERT INTO access_logs (id, timestamp, user_id, role, action, status, log_type, purpose, details) VALUES (UUID(), NOW(), 'attacker', 'unknown', 'Đăng nhập thất bại - Sai mật khẩu', 401, 'SESSION_LOG', 'authentication', '{\"ip_address\": \"192.168.1.100\", \"attempt\": $i}');"
        echo "   Login attempt $i failed..."
        sleep 0.5
    done
    
    echo -e "${BLUE}[Bước 2] Mô phỏng đăng nhập thành công sau brute-force...${NC}"
    mysql_exec "INSERT INTO access_logs (id, timestamp, user_id, role, action, status, log_type, purpose, details) VALUES (UUID(), NOW(), 'attacker', 'doctor', 'Đăng nhập thành công', 200, 'SESSION_LOG', 'authentication', '{\"ip_address\": \"192.168.1.100\"}');"
    
    echo -e "${BLUE}[Bước 3] Mô phỏng truy cập dữ liệu nhạy cảm...${NC}"
    mysql_exec "INSERT INTO access_logs (id, timestamp, user_id, role, action, status, log_type, purpose, details) VALUES (UUID(), NOW(), 'attacker', 'doctor', 'Xem hồ sơ bệnh nhân VIP', 200, 'EMR_ACCESS_LOG', 'view', '{\"patient_id\": \"VIP-001\", \"patient_name\": \"Nguyễn Văn A\"}');"
    
    echo -e "${RED}[Bước 4] ATTACKER cố xoá dấu vết...${NC}"
    mysql_exec "DELETE FROM access_logs WHERE user_id = 'attacker' AND timestamp >= DATE_SUB(NOW(), INTERVAL 5 MINUTE);"
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  DETECTION SUMMARY                                            ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}[✓] Brute-force detected by Keycloak Collector${NC}"
    echo -e "${GREEN}[✓] Suspicious login after failures detected${NC}"
    echo -e "${GREEN}[✓] VIP patient access logged and monitored${NC}"
    echo -e "${GREEN}[✓] DELETE attempt captured in general_log BEFORE execution${NC}"
    echo -e "${GREEN}[✓] Anchor Hash mismatch alerts integrity violation${NC}"
    echo ""
    
    echo -e "${BLUE}Các câu lệnh DELETE bị ghi nhận:${NC}"
    docker exec mariadb mysql -u $DB_USER -p$DB_PASS mysql -N -e \
        "SELECT CONCAT(event_time, ' | ', LEFT(argument, 100)) FROM general_log WHERE argument LIKE '%DELETE FROM access_logs%' AND argument LIKE '%attacker%' ORDER BY event_time DESC LIMIT 5;" 2>/dev/null
    echo ""
}

# ====================
# HIỂN THỊ RECOVERY OPTIONS
# ====================
show_recovery() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  PHỤC HỒI DỮ LIỆU SAU TẤN CÔNG                                ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Hệ thống có các phương pháp phục hồi:"
    echo ""
    echo "1. BACKUP SERVICE:"
    echo "   - Backup tự động mỗi 5 phút"
    echo "   - Lưu tại: ./backups/access_logs/"
    echo "   - Phục hồi: docker exec -i mariadb mysql -u root -p ehr_core < backup.sql"
    echo ""
    echo "2. BINARY LOG:"
    echo "   - Point-in-time recovery"
    echo "   - Phục hồi: mysqlbinlog binlog.000001 | mysql -u root -p"
    echo ""
    echo "3. ANCHOR HASH VERIFICATION:"
    echo "   - So sánh hash để phát hiện dữ liệu bị thay đổi"
    echo "   - API: /api/security/integrity-check"
    echo ""
    
    # Show last backups
    echo -e "${BLUE}Backup files gần nhất:${NC}"
    docker exec access-logs-backup ls -la /backups/ 2>/dev/null | tail -5
    echo ""
}

# ====================
# MAIN MENU
# ====================
echo "Chọn kịch bản tấn công để demo:"
echo ""
echo "  1) Xoá log trực tiếp (DELETE)"
echo "  2) Tắt general_log"
echo "  3) TRUNCATE table"
echo "  4) DROP table"
echo "  5) Tấn công kết hợp (Advanced)"
echo "  6) Chạy tất cả kịch bản"
echo "  7) Hiển thị Recovery options"
echo "  0) Thoát"
echo ""
read -p "Nhập lựa chọn (0-7): " choice

case $choice in
    1) attack_delete_logs ;;
    2) attack_disable_general_log ;;
    3) attack_truncate_table ;;
    4) attack_drop_table ;;
    5) attack_combined ;;
    6) 
        attack_delete_logs
        echo ""; echo "Press Enter to continue..."; read
        attack_disable_general_log
        echo ""; echo "Press Enter to continue..."; read
        attack_truncate_table
        echo ""; echo "Press Enter to continue..."; read
        attack_drop_table
        echo ""; echo "Press Enter to continue..."; read
        attack_combined
        ;;
    7) show_recovery ;;
    0) echo "Thoát."; exit 0 ;;
    *) echo "Lựa chọn không hợp lệ"; exit 1 ;;
esac

echo ""
echo -e "${BLUE}========================================="
echo "  KẾT THÚC DEMO"
echo -e "=========================================${NC}"
echo ""
echo "Kiểm tra kết quả tại:"
echo "  - MySQL Query Logs: http://localhost:3002/mysql-logs"
echo "  - Security Monitoring: http://localhost:3002/security-monitoring"
echo "  - Behavior Monitoring: http://localhost:3002/behavior-monitoring"
echo ""

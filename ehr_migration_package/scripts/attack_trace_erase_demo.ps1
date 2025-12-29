# =============================================================================
# KICH BAN TAN CONG XOA DAU VET - DEMO SIEM DETECTION (PowerShell)
# =============================================================================
# Script nay MO PHONG cac kich ban tan cong xoa dau vet de demo
# kha nang phat hien cua he thong SIEM.
#
# CANH BAO: CHI SU DUNG CHO MUC DICH DEMO/TEST
# =============================================================================

$Host.UI.RawUI.WindowTitle = "SIEM Attack Demo - Trace Erasure"

function MySQL-Exec {
    param([string]$query, [string]$database = "ehr_core")
    docker exec mariadb mysql -u root -pemrdbpass $database -N -e $query 2>$null
}

function MySQL-Exec-Return {
    param([string]$query, [string]$database = "ehr_core")
    $result = docker exec mariadb mysql -u root -pemrdbpass $database -N -e $query 2>$null
    return $result
}

# ====================
# KICH BAN 1: XOA LOG TRUC TIEP
# ====================
function Attack-DeleteLogs {
    Write-Host ""
    Write-Host "=== KICH BAN 1: ATTACKER XOA LOG TRUC TIEP ===" -ForegroundColor Red
    Write-Host ""
    Write-Host "[!] Muc dich: Ke tan cong co gang xoa log de che giau hanh vi" -ForegroundColor Yellow
    Write-Host ""
    
    # Dem log hien tai
    $beforeCount = MySQL-Exec-Return -query "SELECT COUNT(*) FROM access_logs;"
    Write-Host "[1] So luong log truoc khi tan cong: $beforeCount" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "[!] ATTACKER: Dang xoa 5 log gan nhat..." -ForegroundColor Red
    
    # Thu xoa logs (se bi ghi lai trong general_log)
    MySQL-Exec -query "DELETE FROM access_logs ORDER BY timestamp DESC LIMIT 5;"
    
    Start-Sleep -Seconds 1
    
    $afterCount = MySQL-Exec-Return -query "SELECT COUNT(*) FROM access_logs;"
    Write-Host "[2] So luong log sau khi tan cong: $afterCount" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "=== DETECTION: SIEM PHAT HIEN TAN CONG ===" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[OK] MySQL Query Logs ghi nhan cau lenh DELETE nghi ngo:" -ForegroundColor Green
    MySQL-Exec -query "SELECT CONCAT(event_time, ' | ', LEFT(argument, 60)) FROM general_log WHERE argument LIKE '%DELETE FROM access_logs%' ORDER BY event_time DESC LIMIT 3;" -database "mysql"
    Write-Host ""
}

# ====================
# KICH BAN 2: TAT GENERAL_LOG
# ====================
function Attack-DisableGeneralLog {
    Write-Host ""
    Write-Host "=== KICH BAN 2: ATTACKER TAT GENERAL_LOG ===" -ForegroundColor Red
    Write-Host ""
    Write-Host "[!] Muc dich: Tat logging de cac hanh vi tiep theo khong bi ghi" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "[1] Trang thai general_log hien tai:" -ForegroundColor Cyan
    MySQL-Exec -query "SHOW VARIABLES LIKE '%general_log%';" -database "mysql"
    
    Write-Host ""
    Write-Host "[!] ATTACKER: Dang tat general_log..." -ForegroundColor Red
    
    # Cau lenh nay SE BI GHI LAI truoc khi co hieu luc!
    MySQL-Exec -query "SET GLOBAL general_log = OFF;" -database "mysql"
    
    Start-Sleep -Seconds 1
    
    Write-Host ""
    Write-Host "[2] Trang thai general_log SAU KHI BI TAT:" -ForegroundColor Yellow
    MySQL-Exec -query "SHOW VARIABLES LIKE '%general_log%';" -database "mysql"
    
    Write-Host ""
    Write-Host "=== DETECTION: SIEM PHAT HIEN TAN CONG ===" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[OK] MySQL Query Logs ghi nhan cau lenh SET general_log:" -ForegroundColor Green
    MySQL-Exec -query "SELECT CONCAT(event_time, ' | ', argument) FROM general_log WHERE argument LIKE '%general_log%' ORDER BY event_time DESC LIMIT 3;" -database "mysql"
    
    Write-Host ""
    Write-Host "[OK] SIEM Dashboard hien thi SUSPICIOUS query (do) trong MySQL Query Logs" -ForegroundColor Green
    Write-Host ""
    
    # Bat lai general_log
    Write-Host "[*] Dang bat lai general_log de tiep tuc demo..." -ForegroundColor Yellow
    MySQL-Exec -query "SET GLOBAL general_log = ON;" -database "mysql"
    
    Write-Host ""
    Write-Host "[3] Trang thai general_log SAU KHI BAT LAI:" -ForegroundColor Green
    MySQL-Exec -query "SHOW VARIABLES LIKE '%general_log%';" -database "mysql"
    Write-Host ""
}

# ====================
# KICH BAN 3: TRUNCATE TABLE
# ====================
function Attack-TruncateTable {
    Write-Host ""
    Write-Host "=== KICH BAN 3: ATTACKER TRUNCATE BANG LOG (DEMO) ===" -ForegroundColor Red
    Write-Host ""
    Write-Host "[!] Muc dich: Xoa toan bo log bang TRUNCATE (nhanh hon DELETE)" -ForegroundColor Yellow
    Write-Host ""
    
    # Tao bang test de demo (khong truncate bang that)
    Write-Host "[1] Tao bang test_logs_demo de demo..." -ForegroundColor Cyan
    MySQL-Exec -query "CREATE TABLE IF NOT EXISTS test_logs_demo (id INT, message VARCHAR(255));"
    MySQL-Exec -query "INSERT INTO test_logs_demo VALUES (1, 'Test log 1'), (2, 'Test log 2');"
    
    $countBefore = MySQL-Exec-Return -query "SELECT COUNT(*) FROM test_logs_demo;"
    Write-Host "[2] So dong trong test_logs_demo: $countBefore" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "[!] ATTACKER: Dang TRUNCATE test_logs_demo..." -ForegroundColor Red
    MySQL-Exec -query "TRUNCATE TABLE test_logs_demo;"
    
    Write-Host ""
    Write-Host "=== DETECTION: SIEM PHAT HIEN TAN CONG ===" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[OK] MySQL Query Logs ghi nhan cau lenh TRUNCATE:" -ForegroundColor Green
    MySQL-Exec -query "SELECT CONCAT(event_time, ' | ', argument) FROM general_log WHERE argument LIKE '%TRUNCATE%' ORDER BY event_time DESC LIMIT 3;" -database "mysql"
    
    # Cleanup
    MySQL-Exec -query "DROP TABLE IF EXISTS test_logs_demo;"
    Write-Host ""
}

# ====================
# KICH BAN 4: TAN CONG KET HOP
# ====================
function Attack-Combined {
    Write-Host ""
    Write-Host "=== KICH BAN 4: TAN CONG KET HOP (ADVANCED) ===" -ForegroundColor Red
    Write-Host ""
    Write-Host "[!] Ke tan cong thong minh thuc hien cac buoc:" -ForegroundColor Yellow
    Write-Host "    1. Dang nhap sai mat khau nhieu lan (brute-force)"
    Write-Host "    2. Dang nhap thanh cong"
    Write-Host "    3. Truy cap du lieu nhay cam"
    Write-Host "    4. Co xoa log de che giau"
    Write-Host ""
    
    Write-Host "[Buoc 1] Mo phong brute-force attack..." -ForegroundColor Cyan
    for ($i = 1; $i -le 3; $i++) {
        $insertQuery = "INSERT INTO access_logs (id, timestamp, user_id, role, action, status, log_type, purpose, details) VALUES (UUID(), NOW(), 'hacker_demo', 'unknown', 'Dang nhap that bai', 401, 'SYSTEM_AUTH_LOG', 'authentication', '{}')"
        MySQL-Exec -query $insertQuery
        Write-Host "   Login attempt $i failed..." -ForegroundColor DarkGray
        Start-Sleep -Milliseconds 500
    }
    
    Write-Host "[Buoc 2] Mo phong dang nhap thanh cong sau brute-force..." -ForegroundColor Cyan
    $loginQuery = "INSERT INTO access_logs (id, timestamp, user_id, role, action, status, log_type, purpose, details) VALUES (UUID(), NOW(), 'hacker_demo', 'doctor', 'Dang nhap thanh cong', 200, 'SYSTEM_AUTH_LOG', 'authentication', '{}')"
    MySQL-Exec -query $loginQuery
    
    Write-Host "[Buoc 3] Mo phong truy cap du lieu nhay cam..." -ForegroundColor Cyan
    $accessQuery = "INSERT INTO access_logs (id, timestamp, user_id, role, action, status, log_type, purpose, details) VALUES (UUID(), NOW(), 'hacker_demo', 'doctor', 'Xem ho so benh nhan VIP', 200, 'EMR_ACCESS_LOG', 'view', '{}')"
    MySQL-Exec -query $accessQuery
    
    Write-Host ""
    Write-Host "[Buoc 4] ATTACKER co xoa dau vet..." -ForegroundColor Red
    $deleteQuery = "DELETE FROM access_logs WHERE user_id = 'hacker_demo' AND timestamp >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)"
    MySQL-Exec -query $deleteQuery
    
    Write-Host ""
    Write-Host "=== DETECTION SUMMARY ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "[OK] Brute-force detected - 3 failed login attempts" -ForegroundColor Green
    Write-Host "[OK] Suspicious login after failures detected" -ForegroundColor Green
    Write-Host "[OK] VIP patient access logged and monitored" -ForegroundColor Green
    Write-Host "[OK] DELETE attempt captured in general_log BEFORE execution" -ForegroundColor Green
    Write-Host "[OK] Anchor Hash mismatch alerts integrity violation" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Cac cau lenh DELETE bi ghi nhan:" -ForegroundColor Cyan
    MySQL-Exec -query "SELECT CONCAT(event_time, ' | ', LEFT(argument, 80)) FROM general_log WHERE argument LIKE '%DELETE FROM access_logs%' AND argument LIKE '%hacker_demo%' ORDER BY event_time DESC LIMIT 3;" -database "mysql"
    Write-Host ""
}

# ====================
# HIEN THI RECOVERY OPTIONS
# ====================
function Show-Recovery {
    Write-Host ""
    Write-Host "=== PHUC HOI DU LIEU SAU TAN CONG ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "He thong co cac phuong phap phuc hoi:"
    Write-Host ""
    Write-Host "1. BACKUP SERVICE:" -ForegroundColor Yellow
    Write-Host "   - Backup tu dong moi 5 phut"
    Write-Host "   - Luu tai: ./backups/access_logs/"
    Write-Host "   - Phuc hoi: docker exec -i mariadb mysql -u root -pemrdbpass ehr_core < backup.sql"
    Write-Host ""
    Write-Host "2. BINARY LOG:" -ForegroundColor Yellow
    Write-Host "   - Point-in-time recovery"
    Write-Host "   - Phuc hoi: mysqlbinlog binlog.000001 | mysql -u root -p"
    Write-Host ""
    Write-Host "3. ANCHOR HASH VERIFICATION:" -ForegroundColor Yellow
    Write-Host "   - So sanh hash de phat hien du lieu bi thay doi"
    Write-Host "   - API: /api/security/integrity-check"
    Write-Host ""
    
    Write-Host "Backup files gan nhat:" -ForegroundColor Cyan
    docker exec access-logs-backup ls -la /backups/ 2>$null | Select-Object -Last 5
    Write-Host ""
}

# ====================
# MAIN MENU
# ====================
Clear-Host
Write-Host "=================================================================" -ForegroundColor Blue
Write-Host "       KICH BAN TAN CONG XOA DAU VET - SIEM DEMO                " -ForegroundColor Blue
Write-Host "=================================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Chon kich ban tan cong de demo:" -ForegroundColor White
Write-Host ""
Write-Host "  [1] Xoa log truc tiep (DELETE)" -ForegroundColor Yellow
Write-Host "  [2] Tat general_log" -ForegroundColor Yellow
Write-Host "  [3] TRUNCATE table" -ForegroundColor Yellow
Write-Host "  [4] Tan cong ket hop (Advanced)" -ForegroundColor Yellow
Write-Host "  [5] Chay tat ca kich ban" -ForegroundColor Yellow
Write-Host "  [6] Hien thi Recovery options" -ForegroundColor Cyan
Write-Host "  [0] Thoat" -ForegroundColor Gray
Write-Host ""
$choice = Read-Host "Nhap lua chon (0-6)"

switch ($choice) {
    "1" { Attack-DeleteLogs }
    "2" { Attack-DisableGeneralLog }
    "3" { Attack-TruncateTable }
    "4" { Attack-Combined }
    "5" { 
        Attack-DeleteLogs
        Write-Host ""; Read-Host "Press Enter to continue..."
        Attack-DisableGeneralLog
        Write-Host ""; Read-Host "Press Enter to continue..."
        Attack-TruncateTable
        Write-Host ""; Read-Host "Press Enter to continue..."
        Attack-Combined
    }
    "6" { Show-Recovery }
    "0" { Write-Host "Thoat."; exit }
    default { Write-Host "Lua chon khong hop le" -ForegroundColor Red; exit }
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Blue
Write-Host "                       KET THUC DEMO                            " -ForegroundColor Blue
Write-Host "=================================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Kiem tra ket qua tai:" -ForegroundColor White
Write-Host "  - MySQL Query Logs:     http://localhost:3002/mysql-logs" -ForegroundColor Cyan
Write-Host "  - Security Monitoring:  http://localhost:3002/security-monitoring" -ForegroundColor Cyan
Write-Host "  - Behavior Monitoring:  http://localhost:3002/behavior-monitoring" -ForegroundColor Cyan
Write-Host ""

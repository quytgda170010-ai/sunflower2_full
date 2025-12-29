# =============================================================================
# SCRIPT KHOI PHUC DU LIEU - DATA RECOVERY TOOL
# =============================================================================
# Script nay khoi phuc du lieu access_logs tu cac nguon backup khac nhau:
# 1. Backup files tu dong (mysqldump)
# 2. Binary logs (point-in-time recovery)
# 
# CANH BAO: Chi su dung khi can thiet!
# =============================================================================

$Host.UI.RawUI.WindowTitle = "SIEM Data Recovery Tool"

# Configuration
$DB_HOST = "mariadb"
$DB_USER = "root"
$DB_PASS = "emrdbpass"
$DB_NAME = "ehr_core"
$BACKUP_DIR = ".\backups\access_logs"

function MySQL-Exec {
    param([string]$query, [string]$database = "ehr_core")
    docker exec mariadb mysql -u $DB_USER -p$DB_PASS $database -e $query 2>$null
}

function MySQL-Exec-Return {
    param([string]$query, [string]$database = "ehr_core")
    $result = docker exec mariadb mysql -u $DB_USER -p$DB_PASS $database -N -e $query 2>$null
    return $result
}

# ====================
# HIEN THI TRANG THAI HIEN TAI
# ====================
function Show-CurrentStatus {
    Write-Host ""
    Write-Host "=== TRANG THAI HIEN TAI CUA DU LIEU ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Dem logs hien tai
    $logCount = MySQL-Exec-Return -query "SELECT COUNT(*) FROM access_logs;"
    Write-Host "[1] So luong access_logs hien tai: $logCount" -ForegroundColor Yellow
    
    # Log cu nhat va moi nhat
    $oldest = MySQL-Exec-Return -query "SELECT MIN(timestamp) FROM access_logs;"
    $newest = MySQL-Exec-Return -query "SELECT MAX(timestamp) FROM access_logs;"
    Write-Host "[2] Log cu nhat: $oldest" -ForegroundColor Yellow
    Write-Host "[3] Log moi nhat: $newest" -ForegroundColor Yellow
    
    # Anchor hash
    $anchorCount = MySQL-Exec-Return -query "SELECT COUNT(*) FROM anchor_points;"
    Write-Host "[4] So anchor points: $anchorCount" -ForegroundColor Yellow
    
    Write-Host ""
}

# ====================
# LIET KE BACKUP FILES
# ====================
function List-Backups {
    Write-Host ""
    Write-Host "=== DANH SACH BACKUP FILES ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Liet ke tu container
    Write-Host "Backup files trong container (access-logs-backup):" -ForegroundColor Yellow
    Write-Host ""
    docker exec access-logs-backup ls -lah /backups/ 2>$null | Select-Object -Last 15
    
    Write-Host ""
    Write-Host "Tong so backup files:" -ForegroundColor Yellow
    docker exec access-logs-backup sh -c "ls /backups/*.sql 2>/dev/null | wc -l"
    
    # Tinh tong dung luong
    Write-Host ""
    Write-Host "Tong dung luong:" -ForegroundColor Yellow
    docker exec access-logs-backup du -sh /backups/ 2>$null
    
    Write-Host ""
}

# ====================
# KHOI PHUC TU BACKUP FILE GAN NHAT
# ====================
function Restore-FromLatestBackup {
    Write-Host ""
    Write-Host "=== KHOI PHUC TU BACKUP GAN NHAT ===" -ForegroundColor Green
    Write-Host ""
    
    # Lay file backup gan nhat
    $latestBackup = docker exec access-logs-backup sh -c "ls -t /backups/*.sql 2>/dev/null | head -1"
    
    if (-not $latestBackup) {
        Write-Host "[!] Khong tim thay backup file nao!" -ForegroundColor Red
        return
    }
    
    $latestBackup = $latestBackup.Trim()
    Write-Host "[1] File backup gan nhat: $latestBackup" -ForegroundColor Yellow
    
    # Lay thong tin file
    docker exec access-logs-backup ls -lh $latestBackup 2>$null
    
    Write-Host ""
    $confirm = Read-Host "Ban co chac muon khoi phuc? Du lieu hien tai se bi thay the! (yes/no)"
    
    if ($confirm -ne "yes") {
        Write-Host "Da huy." -ForegroundColor Yellow
        return
    }
    
    Write-Host ""
    Write-Host "[2] Dang khoi phuc du lieu..." -ForegroundColor Cyan
    
    # Backup du lieu hien tai truoc khi restore
    $currentTime = Get-Date -Format "yyyyMMdd_HHmmss"
    Write-Host "    - Backup du lieu hien tai truoc khi restore..." -ForegroundColor DarkGray
    docker exec mariadb mysqldump -u $DB_USER -p$DB_PASS $DB_NAME access_logs 2>$null | Out-File ".\backups\access_logs\pre_restore_$currentTime.sql" -Encoding UTF8
    
    # Xoa du lieu cu
    Write-Host "    - Xoa du lieu cu..." -ForegroundColor DarkGray
    MySQL-Exec -query "DELETE FROM access_logs;"
    
    # Import backup
    Write-Host "    - Import du lieu tu backup..." -ForegroundColor DarkGray
    
    # Copy file backup tu access-logs-backup container sang mariadb container
    docker cp access-logs-backup:$latestBackup ./temp_restore.sql 2>$null
    Get-Content ./temp_restore.sql | docker exec -i mariadb mysql -u $DB_USER -p$DB_PASS $DB_NAME 2>$null
    Remove-Item ./temp_restore.sql -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "[OK] KHOI PHUC HOAN TAT!" -ForegroundColor Green
    
    # Hien thi trang thai sau restore
    $afterCount = MySQL-Exec-Return -query "SELECT COUNT(*) FROM access_logs;"
    Write-Host ""
    Write-Host "So luong logs sau khoi phuc: $afterCount" -ForegroundColor Yellow
    Write-Host ""
}

# ====================
# KHOI PHUC TU FILE BACKUP CU THE
# ====================
function Restore-FromSpecificBackup {
    Write-Host ""
    Write-Host "=== KHOI PHUC TU BACKUP FILE CU THE ===" -ForegroundColor Green
    Write-Host ""
    
    # Liet ke backup files
    Write-Host "Danh sach backup files:" -ForegroundColor Yellow
    $backups = docker exec access-logs-backup sh -c "ls -t /backups/*.sql 2>/dev/null | head -20"
    $backupArray = $backups -split "`n"
    
    $i = 1
    foreach ($backup in $backupArray) {
        if ($backup.Trim()) {
            Write-Host "  [$i] $($backup.Trim())"
            $i++
        }
    }
    
    Write-Host ""
    $choice = Read-Host "Nhap so thu tu file muon khoi phuc (1-20)"
    
    $selectedIndex = [int]$choice - 1
    if ($selectedIndex -lt 0 -or $selectedIndex -ge $backupArray.Count) {
        Write-Host "Lua chon khong hop le!" -ForegroundColor Red
        return
    }
    
    $selectedBackup = $backupArray[$selectedIndex].Trim()
    Write-Host ""
    Write-Host "Da chon: $selectedBackup" -ForegroundColor Cyan
    
    $confirm = Read-Host "Xac nhan khoi phuc? (yes/no)"
    
    if ($confirm -ne "yes") {
        Write-Host "Da huy." -ForegroundColor Yellow
        return
    }
    
    Write-Host ""
    Write-Host "Dang khoi phuc..." -ForegroundColor Cyan
    
    # Backup hien tai
    $currentTime = Get-Date -Format "yyyyMMdd_HHmmss"
    docker exec mariadb mysqldump -u $DB_USER -p$DB_PASS $DB_NAME access_logs 2>$null | Out-File ".\backups\access_logs\pre_restore_$currentTime.sql" -Encoding UTF8
    
    # Xoa va import
    MySQL-Exec -query "DELETE FROM access_logs;"
    
    docker cp access-logs-backup:$selectedBackup ./temp_restore.sql 2>$null
    Get-Content ./temp_restore.sql | docker exec -i mariadb mysql -u $DB_USER -p$DB_PASS $DB_NAME 2>$null
    Remove-Item ./temp_restore.sql -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "[OK] KHOI PHUC HOAN TAT!" -ForegroundColor Green
    
    $afterCount = MySQL-Exec-Return -query "SELECT COUNT(*) FROM access_logs;"
    Write-Host "So luong logs sau khoi phuc: $afterCount" -ForegroundColor Yellow
    Write-Host ""
}

# ====================
# TAO BACKUP MANUAL
# ====================
function Create-ManualBackup {
    Write-Host ""
    Write-Host "=== TAO BACKUP THU CONG ===" -ForegroundColor Cyan
    Write-Host ""
    
    $currentTime = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = ".\backups\access_logs\manual_backup_$currentTime.sql"
    
    Write-Host "Dang tao backup..." -ForegroundColor Yellow
    
    docker exec mariadb mysqldump -u $DB_USER -p$DB_PASS $DB_NAME access_logs 2>$null | Out-File $backupFile -Encoding UTF8
    
    if (Test-Path $backupFile) {
        $fileSize = (Get-Item $backupFile).Length / 1KB
        Write-Host ""
        Write-Host "[OK] Backup da tao thanh cong!" -ForegroundColor Green
        Write-Host "    File: $backupFile" -ForegroundColor Cyan
        Write-Host "    Size: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Cyan
    }
    else {
        Write-Host "[!] Loi khi tao backup!" -ForegroundColor Red
    }
    Write-Host ""
}

# ====================
# TAI TAO ANCHOR POINTS
# ====================
function Regenerate-AnchorPoints {
    Write-Host ""
    Write-Host "=== TAI TAO ANCHOR POINTS (INTEGRITY HASH) ===" -ForegroundColor Magenta
    Write-Host ""
    
    Write-Host "[!] CANH BAO: Thao tac nay se tai tao toan bo Anchor Points!" -ForegroundColor Yellow
    Write-Host "    Chi thuc hien sau khi da khoi phuc du lieu thanh cong." -ForegroundColor Yellow
    Write-Host ""
    
    $confirm = Read-Host "Tiep tuc? (yes/no)"
    
    if ($confirm -ne "yes") {
        Write-Host "Da huy." -ForegroundColor Yellow
        return
    }
    
    Write-Host ""
    Write-Host "Dang tao Anchor Point moi..." -ForegroundColor Cyan
    
    # Tao anchor point moi bang SQL
    $logCount = MySQL-Exec-Return -query "SELECT COUNT(*) FROM access_logs;"
    $hashData = MySQL-Exec-Return -query "SELECT MD5(GROUP_CONCAT(id ORDER BY timestamp)) FROM access_logs;"
    
    $insertQuery = "INSERT INTO anchor_points (id, created_at, log_count, anchor_hash, description) VALUES (UUID(), NOW(), $logCount, '$hashData', 'Manual regeneration after restore')"
    MySQL-Exec -query $insertQuery
    
    Write-Host "[OK] Da tao anchor point moi!" -ForegroundColor Green
    Write-Host ""
}

# ====================
# KIEM TRA INTEGRITY
# ====================
function Check-Integrity {
    Write-Host ""
    Write-Host "=== KIEM TRA TINH TOAN VEN DU LIEU (INTEGRITY CHECK) ===" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Dang kiem tra..." -ForegroundColor Yellow
    
    # Lay thong tin tu database
    $logCount = MySQL-Exec-Return -query "SELECT COUNT(*) FROM access_logs;"
    $anchorCount = MySQL-Exec-Return -query "SELECT COUNT(*) FROM anchor_points;"
    $lastAnchor = MySQL-Exec-Return -query "SELECT created_at FROM anchor_points ORDER BY created_at DESC LIMIT 1;"
    
    Write-Host ""
    Write-Host "Ket qua:" -ForegroundColor Cyan
    Write-Host "  - Log count: $logCount" -ForegroundColor White
    Write-Host "  - Anchor points: $anchorCount" -ForegroundColor White
    Write-Host "  - Last anchor: $lastAnchor" -ForegroundColor White
    Write-Host ""
    
    if ([int]$anchorCount -gt 0) {
        Write-Host "[OK] He thong co anchor points de kiem tra integrity" -ForegroundColor Green
    }
    else {
        Write-Host "[!] Chua co anchor points - Hay tao anchor point moi" -ForegroundColor Yellow
    }
    Write-Host ""
}

# ====================
# KHOI PHUC HOAN TOAN (FULL RESET)
# ====================
function Full-Reset {
    Write-Host ""
    Write-Host "=== KHOI PHUC HOAN TOAN (FULL RESET) ===" -ForegroundColor Red
    Write-Host ""
    
    Write-Host "[!!!] CANH BAO NGHIEM TRONG:" -ForegroundColor Red
    Write-Host "      Thao tac nay se:" -ForegroundColor Yellow
    Write-Host "      1. Xoa TOAN BO du lieu hien tai" -ForegroundColor Yellow
    Write-Host "      2. Khoi phuc tu backup gan nhat" -ForegroundColor Yellow
    Write-Host "      3. Tai tao tat ca Anchor Points" -ForegroundColor Yellow
    Write-Host ""
    
    $confirm1 = Read-Host "Nhap 'CONFIRM' de tiep tuc"
    if ($confirm1 -ne "CONFIRM") {
        Write-Host "Da huy." -ForegroundColor Yellow
        return
    }
    
    $confirm2 = Read-Host "Nhap 'RESTORE' de xac nhan lan cuoi"
    if ($confirm2 -ne "RESTORE") {
        Write-Host "Da huy." -ForegroundColor Yellow
        return
    }
    
    Write-Host ""
    Write-Host "=== DANG THUC HIEN FULL RESET... ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Buoc 1: Backup hien tai
    Write-Host "[1/5] Tao emergency backup..." -ForegroundColor Yellow
    $currentTime = Get-Date -Format "yyyyMMdd_HHmmss"
    docker exec mariadb mysqldump -u $DB_USER -p$DB_PASS $DB_NAME access_logs 2>$null | Out-File ".\backups\access_logs\emergency_$currentTime.sql" -Encoding UTF8
    
    # Buoc 2: Lay backup gan nhat
    Write-Host "[2/5] Tim backup file gan nhat..." -ForegroundColor Yellow
    $latestBackup = docker exec access-logs-backup sh -c "ls -t /backups/*.sql 2>/dev/null | head -1"
    $latestBackup = $latestBackup.Trim()
    Write-Host "       Found: $latestBackup" -ForegroundColor DarkGray
    
    # Buoc 3: Xoa du lieu cu
    Write-Host "[3/5] Xoa du lieu cu..." -ForegroundColor Yellow
    MySQL-Exec -query "DELETE FROM access_logs;"
    MySQL-Exec -query "DELETE FROM anchor_points;"
    
    # Buoc 4: Import backup
    Write-Host "[4/5] Import backup..." -ForegroundColor Yellow
    docker cp access-logs-backup:$latestBackup ./temp_restore.sql 2>$null
    Get-Content ./temp_restore.sql | docker exec -i mariadb mysql -u $DB_USER -p$DB_PASS $DB_NAME 2>$null
    Remove-Item ./temp_restore.sql -ErrorAction SilentlyContinue
    
    # Buoc 5: Tai tao Anchor Point
    Write-Host "[5/5] Tai tao Anchor Points..." -ForegroundColor Yellow
    $logCount = MySQL-Exec-Return -query "SELECT COUNT(*) FROM access_logs;"
    $hashData = MySQL-Exec-Return -query "SELECT MD5(GROUP_CONCAT(id ORDER BY timestamp)) FROM access_logs;"
    $insertQuery = "INSERT INTO anchor_points (id, created_at, log_count, anchor_hash, description) VALUES (UUID(), NOW(), $logCount, '$hashData', 'Full restore - $currentTime')"
    MySQL-Exec -query $insertQuery
    
    Write-Host ""
    Write-Host "=== [OK] FULL RESET HOAN TAT! ===" -ForegroundColor Green
    Write-Host ""
    
    $afterCount = MySQL-Exec-Return -query "SELECT COUNT(*) FROM access_logs;"
    Write-Host "So luong logs sau khoi phuc: $afterCount" -ForegroundColor Yellow
    Write-Host "Emergency backup da luu tai: .\backups\access_logs\emergency_$currentTime.sql" -ForegroundColor Cyan
    Write-Host ""
}

# ====================
# MAIN MENU
# ====================
Clear-Host
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "       SIEM DATA RECOVERY TOOL - KHOI PHUC DU LIEU             " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Chon thao tac:" -ForegroundColor White
Write-Host ""
Write-Host "  [1] Xem trang thai hien tai" -ForegroundColor Yellow
Write-Host "  [2] Liet ke backup files" -ForegroundColor Yellow
Write-Host "  [3] Khoi phuc tu backup gan nhat" -ForegroundColor Green
Write-Host "  [4] Khoi phuc tu backup file cu the" -ForegroundColor Green
Write-Host "  [5] Tao backup thu cong" -ForegroundColor Cyan
Write-Host "  [6] Tai tao Anchor Points" -ForegroundColor Magenta
Write-Host "  [7] Kiem tra tinh toan ven (Integrity Check)" -ForegroundColor Cyan
Write-Host "  [8] FULL RESET (Khoi phuc hoan toan)" -ForegroundColor Red
Write-Host "  [0] Thoat" -ForegroundColor Gray
Write-Host ""
$choice = Read-Host "Nhap lua chon (0-8)"

switch ($choice) {
    "1" { Show-CurrentStatus }
    "2" { List-Backups }
    "3" { Restore-FromLatestBackup }
    "4" { Restore-FromSpecificBackup }
    "5" { Create-ManualBackup }
    "6" { Regenerate-AnchorPoints }
    "7" { Check-Integrity }
    "8" { Full-Reset }
    "0" { Write-Host "Thoat."; exit }
    default { Write-Host "Lua chon khong hop le" -ForegroundColor Red; exit }
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "                       HOAN TAT                                 " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# Hướng dẫn tạo bằng chứng cho Chapter 4
# Chạy các lệnh này để lấy số liệu thật từ hệ thống

# =====================================================
# 1. ĐẾM SỐ QUY TẮC TRONG DATABASE
# =====================================================
Write-Host "=== 1. TỔNG SỐ QUY TẮC ===" -ForegroundColor Green
$ruleCount = (Get-Content "c:\Users\Admin\OneDrive\Documents\GitHub\sunflower2_full\backups\siem_rules_only.sql" | Select-String "INSERT INTO \`siem_law_rules\`" | Measure-Object).Count
Write-Host "Tổng số quy tắc trong database: $ruleCount" -ForegroundColor Yellow

# =====================================================
# 2. ĐẾM SỐ VAI TRÒ TRONG POLICY.REGO
# =====================================================
Write-Host "`n=== 2. SỐ VAI TRÒ TRONG HỆ THỐNG ===" -ForegroundColor Green
$policyFile = "c:\Users\Admin\OneDrive\Documents\GitHub\sunflower2_full\ehr_migration_package\ehr-gw\opa\policies\policy.rego"
$roles = Get-Content $policyFile | Select-String "is_\w+ if \{ roles\[_\] ==" 
Write-Host "Các vai trò:" -ForegroundColor Yellow
$roles | ForEach-Object { Write-Host "  - $_" }
Write-Host "Tổng số vai trò: $($roles.Count)" -ForegroundColor Yellow

# =====================================================
# 3. ĐẾM SỐ BACKUP ACCESS LOGS
# =====================================================
Write-Host "`n=== 3. SỐ FILE ACCESS LOGS BACKUP ===" -ForegroundColor Green
$logBackups = Get-ChildItem "c:\Users\Admin\OneDrive\Documents\GitHub\sunflower2_full\ehr_migration_package\backups\access_logs" -Filter "*.sql" -ErrorAction SilentlyContinue
Write-Host "Số file backup access logs: $($logBackups.Count)" -ForegroundColor Yellow

# =====================================================
# 4. PHÂN LOẠI QUY TẮC THEO NHÓM
# =====================================================
Write-Host "`n=== 4. PHÂN LOẠI QUY TẮC THEO NHÓM ===" -ForegroundColor Green
$sqlContent = Get-Content "c:\Users\Admin\OneDrive\Documents\GitHub\sunflower2_full\backups\siem_rules_only.sql" -Raw
$groups = @{}
$matches = [regex]::Matches($sqlContent, "PHẦN [IVX]+ – ([^']+)")
foreach ($match in $matches) {
    $groupName = $match.Groups[1].Value.Trim()
    if ($groups.ContainsKey($groupName)) {
        $groups[$groupName]++
    } else {
        $groups[$groupName] = 1
    }
}
$groups.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Host "  $($_.Key): $($_.Value) quy tắc" -ForegroundColor Yellow
}

# =====================================================
# 5. XUẤT KẾT QUẢ RA FILE EVIDENCE
# =====================================================
Write-Host "`n=== 5. XUẤT KẾT QUẢ RA FILE ===" -ForegroundColor Green
$outputFile = "c:\Users\Admin\OneDrive\Documents\GitHub\sunflower2_full\CHAPTER4_EVIDENCE_REPORT.txt"
@"
===============================================
BÁO CÁO MINH CHỨNG SỐ LIỆU CHAPTER 4
Ngày tạo: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
===============================================

1. TỔNG SỐ QUY TẮC: $ruleCount

2. SỐ VAI TRÒ: $($roles.Count)

3. SỐ FILE BACKUP LOGS: $($logBackups.Count)

4. PHÂN LOẠI QUY TẮC THEO NHÓM:
$($groups.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { "   - $($_.Key): $($_.Value) quy tắc" } | Out-String)

===============================================
Chữ ký số liệu (Hash):
$(Get-FileHash "c:\Users\Admin\OneDrive\Documents\GitHub\sunflower2_full\backups\siem_rules_only.sql" -Algorithm SHA256 | Select-Object -ExpandProperty Hash)
===============================================
"@ | Out-File $outputFile -Encoding UTF8

Write-Host "Đã xuất báo cáo ra: $outputFile" -ForegroundColor Cyan
Write-Host "`nHoàn tất! Bạn có thể dùng file này làm minh chứng cho hội đồng." -ForegroundColor Green

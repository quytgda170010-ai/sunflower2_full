# ===== SETUP TASK SCHEDULER =====
# PHAI CHAY VOI QUYEN ADMINISTRATOR!

Write-Host "=== Tao Task Scheduler ===" -ForegroundColor Cyan

# 1. Tao task Watchdog (moi phut)
Write-Host "`n[1] Tao MySQL_Log_Watchdog..." -ForegroundColor Yellow

$action1 = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File G:\DoAnVV\sunflower2_full\scripts\watchdog_mysql_log.ps1"

$trigger1 = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 1) `
    -RepetitionDuration (New-TimeSpan -Days 9999)

$principal1 = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

try {
    Register-ScheduledTask -TaskName "MySQL_Log_Watchdog" `
        -Action $action1 -Trigger $trigger1 -Principal $principal1 -Force
    Write-Host "    MySQL_Log_Watchdog - THANH CONG!" -ForegroundColor Green
}
catch {
    Write-Host "    LOI: $_" -ForegroundColor Red
}

# 2. Tao task Email Anchor Hash (moi gio)
Write-Host "`n[2] Tao EHR_Anchor_Hash_Email..." -ForegroundColor Yellow

$action2 = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File G:\DoAnVV\sunflower2_full\scripts\send_anchor_hash.ps1"

$trigger2 = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Hours 1) `
    -RepetitionDuration (New-TimeSpan -Days 9999)

$principal2 = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

try {
    Register-ScheduledTask -TaskName "EHR_Anchor_Hash_Email" `
        -Action $action2 -Trigger $trigger2 -Principal $principal2 -Force
    Write-Host "    EHR_Anchor_Hash_Email - THANH CONG!" -ForegroundColor Green
}
catch {
    Write-Host "    LOI: $_" -ForegroundColor Red
}

# 3. Kiem tra
Write-Host "`n=== Kiem tra Tasks ===" -ForegroundColor Cyan
Get-ScheduledTask | Where-Object { $_.TaskName -like "*MySQL*" -or $_.TaskName -like "*EHR*" } | 
Format-Table TaskName, State -AutoSize

Write-Host "`nHOAN TAT! Tasks se chay tu dong." -ForegroundColor Green

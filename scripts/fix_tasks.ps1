# Fix Task Scheduler - chay duoi tai khoan nguoi dung hien tai (de Docker hoat dong)
# PHAI CHAY VOI QUYEN ADMINISTRATOR!

Write-Host "=== Fix Task Scheduler ===" -ForegroundColor Cyan

# Xoa tasks cu
Write-Host "Xoa tasks cu..." -ForegroundColor Yellow
Unregister-ScheduledTask -TaskName "MySQL_Log_Watchdog" -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName "EHR_Anchor_Hash_Email" -Confirm:$false -ErrorAction SilentlyContinue

# 1. Watchdog - moi 1 phut (chay duoi tai khoan nguoi dung)
Write-Host "`n[1] Tao MySQL_Log_Watchdog (moi 1 phut)..." -ForegroundColor Yellow

$action1 = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File G:\DoAnVV\sunflower2_full\scripts\watchdog_mysql_log.ps1"

$trigger1 = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 1) `
    -RepetitionDuration (New-TimeSpan -Days 9999)

$settings1 = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "MySQL_Log_Watchdog" `
    -Action $action1 -Trigger $trigger1 -Settings $settings1 `
    -User $env:USERNAME -RunLevel Highest -Force

Write-Host "    MySQL_Log_Watchdog - OK!" -ForegroundColor Green

# 2. Email - moi 5 phut (demo)
Write-Host "`n[2] Tao EHR_Anchor_Hash_Email (moi 5 phut)..." -ForegroundColor Yellow

$action2 = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File G:\DoAnVV\sunflower2_full\scripts\send_anchor_hash.ps1"

$trigger2 = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 5) `
    -RepetitionDuration (New-TimeSpan -Days 9999)

$settings2 = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "EHR_Anchor_Hash_Email" `
    -Action $action2 -Trigger $trigger2 -Settings $settings2 `
    -User $env:USERNAME -RunLevel Highest -Force

Write-Host "    EHR_Anchor_Hash_Email - OK!" -ForegroundColor Green

# Kiem tra
Write-Host "`n=== Ket qua ===" -ForegroundColor Cyan
Get-ScheduledTask | Where-Object { $_.TaskName -like "*MySQL*" -or $_.TaskName -like "*EHR*" } | 
Format-Table TaskName, State -AutoSize

Write-Host "`nHOAN TAT! Tasks se tu dong chay." -ForegroundColor Green
Write-Host "- Watchdog: moi 1 phut" -ForegroundColor Gray
Write-Host "- Email: moi 5 phut" -ForegroundColor Gray

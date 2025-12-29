# Cap nhat Task Email - 1 gio
# PHAI CHAY VOI QUYEN ADMINISTRATOR!

Write-Host "Dang cap nhat EHR_Anchor_Hash_Email -> 1 gio..." -ForegroundColor Yellow

# Xoa task cu neu co
Unregister-ScheduledTask -TaskName "EHR_Anchor_Hash_Email" -Confirm:$false -ErrorAction SilentlyContinue

# Tao task moi - 1 gio
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File G:\DoAnVV\sunflower2_full\scripts\send_anchor_hash.ps1"

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 60) `
    -RepetitionDuration (New-TimeSpan -Days 9999)

$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName "EHR_Anchor_Hash_Email" `
    -Action $action -Trigger $trigger -Principal $principal -Force

Write-Host "THANH CONG! Email se gui moi 1 gio." -ForegroundColor Green


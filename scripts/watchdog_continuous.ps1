# Watchdog chay lien tuc - kiem tra moi 10 giay
Write-Host "MySQL Log Watchdog - Dang chay (kiem tra moi 10 giay)..." -ForegroundColor Green
Write-Host "Nhan Ctrl+C de dung" -ForegroundColor Yellow

while ($true) {
    $status = docker exec mariadb mysql -u root -pemrdbpass -N -e "SELECT @@general_log" 2>$null
    
    if ($status -eq "0") {
        # Log bi tat - BAT LAI
        docker exec mariadb mysql -u root -pemrdbpass -e "SET GLOBAL general_log = 'ON';"
        
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $msg = "$timestamp - ALERT: general_log was OFF, re-enabled!"
        Write-Host $msg -ForegroundColor Red
        Add-Content -Path "G:\DoAnVV\sunflower2_full\scripts\watchdog.log" -Value $msg
    }
    else {
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Log ON" -ForegroundColor Gray
    }
    
    Start-Sleep -Seconds 10
}

# Watchdog: Tu dong bat lai general_log neu bi tat
$status = docker exec mariadb mysql -u root -pemrdbpass -N -e "SELECT @@general_log"

if ($status -eq "0") {
    # Log bi tat - BAT LAI
    docker exec mariadb mysql -u root -pemrdbpass -e "SET GLOBAL general_log = 'ON';"
    
    # Ghi log canh bao
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path "G:\DoAnVV\sunflower2_full\scripts\watchdog.log" -Value "$timestamp - ALERT: general_log was OFF, re-enabled!"
}

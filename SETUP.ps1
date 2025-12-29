# Script thiết lập tự động cho Sunflower2 EHR
# Chạy script này sau khi giải nén file ZIP

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUNFLOWER2 EHR - AUTO SETUP SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Docker
Write-Host "[1/6] Kiểm tra Docker..." -ForegroundColor Yellow
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "ERROR: Docker chưa được cài đặt!" -ForegroundColor Red
    Write-Host "Vui lòng cài Docker Desktop từ: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Docker đã sẵn sàng" -ForegroundColor Green

# Chuyển đến thư mục ehr_migration_package
Write-Host "[2/6] Khởi động Docker containers..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\ehr_migration_package"
docker-compose up -d

# Đợi containers khởi động
Write-Host "[3/6] Đợi containers khởi động (60 giây)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Import database EHR Core
Write-Host "[4/6] Import database EHR Core..." -ForegroundColor Yellow
Get-Content "..\database_backup.sql" | docker exec -i mariadb mysql -u root -proot123 ehr_core
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Database EHR Core đã được import" -ForegroundColor Green
}
else {
    Write-Host "WARNING: Có lỗi khi import EHR Core database" -ForegroundColor Yellow
}

# Import database Keycloak
Write-Host "[5/6] Import database Keycloak..." -ForegroundColor Yellow
Get-Content "..\keycloak_backup.sql" | docker exec -i pg-keycloak psql -U keycloak keycloak
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Database Keycloak đã được import" -ForegroundColor Green
}
else {
    Write-Host "WARNING: Có lỗi khi import Keycloak database" -ForegroundColor Yellow
}

# Restart Keycloak
Write-Host "[6/6] Restart Keycloak..." -ForegroundColor Yellow
docker restart keycloak
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SETUP HOÀN TẤT!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Truy cập hệ thống:" -ForegroundColor Cyan
Write-Host "  - SIEM Dashboard: http://localhost:3000" -ForegroundColor White
Write-Host "  - Keycloak Admin: http://localhost:8080 (admin / Admin123!ChangeMe)" -ForegroundColor White
Write-Host "  - OpenEMR:        http://localhost" -ForegroundColor White
Write-Host ""

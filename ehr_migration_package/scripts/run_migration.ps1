# Script to run database migration for adding cccd and bhyt columns (Windows PowerShell)

Write-Host "Running migration to add cccd and bhyt columns..." -ForegroundColor Yellow

# Get database credentials from environment or use defaults
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "mariadb" }
$DB_NAME = if ($env:MARIADB_DATABASE) { $env:MARIADB_DATABASE } else { "ehr_core" }
$DB_USER = if ($env:MARIADB_USER) { $env:MARIADB_USER } else { "openemr" }
$DB_PASS = if ($env:MARIADB_PASSWORD) { $env:MARIADB_PASSWORD } else { "Openemr!123" }

# Run migration
Get-Content migrations/add_cccd_bhyt_to_patients.sql | docker exec -i mariadb mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Migration failed. Please check the error above." -ForegroundColor Red
    exit 1
}





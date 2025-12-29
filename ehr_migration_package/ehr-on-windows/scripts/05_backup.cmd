@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%\..") do set "PROJECT_ROOT=%%~fI"
set "BACKUP_DIR=%PROJECT_ROOT%\backups"
if not exist "%BACKUP_DIR%" (
  mkdir "%BACKUP_DIR%"
  if errorlevel 1 (
    echo [ERROR] Unable to create backups directory.
    exit /b 1
  )
)
echo [INFO] Dumping ehr_core database from mariadb container...
docker exec mariadb sh -c "mysqldump -uopenemr -pOpenemr\!123 ehr_core > /tmp/ehr_core.sql"
if errorlevel 1 (
  echo [ERROR] mysqldump failed.
  exit /b 1
)
echo [INFO] Copying SQL dump to host backups folder...
docker cp mariadb:/tmp/ehr_core.sql "%BACKUP_DIR%\ehr_core.sql"
if errorlevel 1 (
  echo [ERROR] Failed to copy SQL dump to host.
  exit /b 1
)
echo [INFO] Snapshotting keyring (if present)...
docker exec mariadb sh -c "if [ -s /var/lib/mysql-keyring/keyring ]; then tar czf /tmp/keyring.tgz -C /var/lib mysql-keyring; else rm -f /tmp/keyring.tgz 2>/dev/null; fi"
if errorlevel 1 (
  echo [ERROR] Failed to archive keyring.
  exit /b 1
)
docker exec mariadb sh -c "test -s /tmp/keyring.tgz"
if errorlevel 1 (
  echo [INFO] No keyring archive generated (at-rest encryption likely disabled).
) else (
  docker cp mariadb:/tmp/keyring.tgz "%BACKUP_DIR%\keyring.tgz"
  if errorlevel 1 (
    echo [ERROR] Failed to copy keyring.tgz to host.
    exit /b 1
  )
  echo [OK] Saved keyring archive to backups\keyring.tgz.
)
echo [OK] Backup complete: backups\ehr_core.sql
exit /b 0

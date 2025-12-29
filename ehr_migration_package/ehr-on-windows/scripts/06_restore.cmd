@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%\..") do set "PROJECT_ROOT=%%~fI"
set "BACKUP_DIR=%PROJECT_ROOT%\backups"
set "SQL_BACKUP=%BACKUP_DIR%\ehr_core.sql"
if not exist "%SQL_BACKUP%" (
  echo [ERROR] Missing backups\ehr_core.sql. Run scripts\05_backup.cmd first.
  exit /b 1
)
echo [INFO] Copying SQL backup into mariadb container...
docker cp "%SQL_BACKUP%" mariadb:/tmp/ehr_core.sql
if errorlevel 1 (
  echo [ERROR] Failed to copy SQL backup into container.
  exit /b 1
)
if exist "%BACKUP_DIR%\keyring.tgz" (
  echo [INFO] Restoring keyring archive into container...
  docker cp "%BACKUP_DIR%\keyring.tgz" mariadb:/tmp/keyring.tgz
  if errorlevel 1 (
    echo [ERROR] Failed to copy keyring archive into container.
    exit /b 1
  )
  docker exec mariadb sh -c "tar xzf /tmp/keyring.tgz -C /var/lib && chown -R mysql:mysql /var/lib/mysql-keyring && chmod 600 /var/lib/mysql-keyring/keyring"
  if errorlevel 1 (
    echo [ERROR] Failed to restore keyring archive.
    exit /b 1
  )
) else (
  echo [INFO] No keyring archive found; skipping keyring restore.
)
echo [INFO] Recreating ehr_core schema...
docker exec mariadb sh -c "mysql -uroot -pStrongRoot\!123 -e \"DROP DATABASE IF EXISTS ehr_core; CREATE DATABASE ehr_core; GRANT ALL PRIVILEGES ON ehr_core.* TO 'openemr'@'%'; FLUSH PRIVILEGES;\""
if errorlevel 1 (
  echo [ERROR] Failed to recreate database or grant privileges.
  exit /b 1
)
echo [INFO] Importing SQL backup...
docker exec mariadb sh -c "mysql -uroot -pStrongRoot\!123 ehr_core < /tmp/ehr_core.sql"
if errorlevel 1 (
  echo [ERROR] Failed to import database backup.
  exit /b 1
)
echo [OK] Restore completed successfully.
exit /b 0

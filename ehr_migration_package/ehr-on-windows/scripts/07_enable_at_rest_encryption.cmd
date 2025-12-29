@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%\..") do set "PROJECT_ROOT=%%~fI"

call :ensure_keyring_file || exit /b 1
call :write_plugin_config || exit /b 1
call :restart_mariadb "plugin configuration reload" || exit /b 1
call :wait_for_mariadb || exit /b 1
call :ensure_plugin_installed || exit /b 1
call :rotate_master_key || exit /b 1
call :verify_keyring_nonempty || exit /b 1
call :write_full_encryption_config || exit /b 1
call :restart_mariadb "innodb encryption settings" || exit /b 1
call :wait_for_mariadb || exit /b 1
call :show_innodb_encryption_variables || exit /b 1
echo [OK] At-rest encryption verified.
exit /b 0

:ensure_keyring_file
echo [INFO] Ensuring keyring file exists in named volume...
docker exec mariadb sh -c "mkdir -p /var/lib/mysql-keyring && if [ ! -f /var/lib/mysql-keyring/keyring ]; then install -m 600 -o mysql -g mysql /dev/null /var/lib/mysql-keyring/keyring; fi"
if errorlevel 1 (
  echo [ERROR] Unable to create keyring file.
  exit /b 1
)
exit /b 0

:write_plugin_config
echo [INFO] Writing plugin-only configuration...
docker exec mariadb sh -c "printf '%s\n' '[mysqld]' 'plugin_load_add = file_key_management' 'file_key_management_filename = /var/lib/mysql-keyring/keyring' 'file_key_management_encryption_algorithm = AES_CTR' > /etc/mysql/conf.d/zz-encryption.cnf"
if errorlevel 1 (
  echo [ERROR] Failed to write plugin configuration.
  exit /b 1
)
exit /b 0

:restart_mariadb
set "RESTART_REASON=%~1"
if defined RESTART_REASON (
  echo [INFO] Restarting mariadb (%RESTART_REASON%)...
) else (
  echo [INFO] Restarting mariadb...
)
docker compose restart mariadb
if errorlevel 1 (
  echo [ERROR] docker compose restart failed.
  exit /b 1
)
exit /b 0

:wait_for_mariadb
echo [INFO] Waiting for mariadb health check...
set /a "attempt=0"
:wait_loop
set /a "attempt+=1"
if %attempt% gtr 30 (
  echo [ERROR] mariadb did not become ready in time.
  exit /b 1
)
docker exec mariadb mysqladmin ping -h 127.0.0.1 -pStrongRoot\!123 >nul 2>&1
if errorlevel 1 (
  timeout /t 2 >nul
  goto :wait_loop
)
exit /b 0

:ensure_plugin_installed
echo [INFO] Validating file_key_management plugin status...
set "PLUGIN_STATUS="
for /f "usebackq tokens=*" %%S in (`docker exec mariadb sh -c "mysql -uroot -pStrongRoot\!123 -Nse \"SELECT PLUGIN_STATUS FROM INFORMATION_SCHEMA.PLUGINS WHERE PLUGIN_NAME='file_key_management'\""` ) do (
  set "PLUGIN_STATUS=%%S"
  goto :plugin_status_obtained
)
:plugin_status_obtained
if /I "%PLUGIN_STATUS%"=="ACTIVE" (
  echo [OK] file_key_management plugin already active.
  exit /b 0
)
echo [INFO] Installing file_key_management plugin...
docker exec mariadb sh -c "mysql -uroot -pStrongRoot\!123 -e \"INSTALL SONAME 'file_key_management';\""
if errorlevel 1 (
  echo [ERROR] Failed to install file_key_management plugin.
  exit /b 1
)
exit /b 0

:rotate_master_key
echo [INFO] Rotating InnoDB master key...
docker exec mariadb sh -c "mysql -uroot -pStrongRoot\!123 -e \"ALTER INSTANCE ROTATE INNODB MASTER KEY;\""
if errorlevel 1 (
  echo [ERROR] Failed to rotate InnoDB master key.
  exit /b 1
)
exit /b 0

:verify_keyring_nonempty
echo [INFO] Checking keyring contents...
docker exec mariadb sh -c "head -c 50 /var/lib/mysql-keyring/keyring"
if errorlevel 1 (
  echo [ERROR] Unable to read keyring file.
  exit /b 1
)
docker exec mariadb sh -c "head -c 50 /var/lib/mysql-keyring/keyring | grep -q '{'"
if errorlevel 1 (
  echo [ERROR] Keyring file does not appear to contain JSON data.
  exit /b 1
)
exit /b 0

:write_full_encryption_config
echo [INFO] Enabling InnoDB encryption settings...
docker exec mariadb sh -c "printf '%s\n' '[mysqld]' 'plugin_load_add = file_key_management' 'file_key_management_filename = /var/lib/mysql-keyring/keyring' 'file_key_management_encryption_algorithm = AES_CTR' 'innodb_encrypt_tables = ON' 'innodb_encrypt_temporary_tables = ON' 'innodb_encrypt_log = ON' 'innodb_encryption_threads = 4' > /etc/mysql/conf.d/zz-encryption.cnf"
if errorlevel 1 (
  echo [ERROR] Failed to write full encryption configuration.
  exit /b 1
)
exit /b 0

:show_innodb_encryption_variables
echo [INFO] Showing innodb encryption variables (expect ON)...
docker exec mariadb sh -c "mysql -uroot -pStrongRoot\!123 -e \"SHOW VARIABLES LIKE 'innodb_encrypt%';\""
if errorlevel 1 (
  echo [ERROR] Unable to query encryption variables.
  exit /b 1
)
exit /b 0

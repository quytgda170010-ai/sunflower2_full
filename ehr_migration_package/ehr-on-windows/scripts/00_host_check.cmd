@echo off
setlocal
echo [INFO] HOSTS FILE CHECK
echo 1) Open Notepad as Administrator.
echo 2) Open C:\Windows\System32\drivers\etc\hosts.
echo 3) Add the line: 127.0.0.1    local.ehr
echo 4) Save and close the file.
echo.
echo [INFO] Flushing DNS cache...
ipconfig /flushdns
if errorlevel 1 (
  echo [ERROR] ipconfig /flushdns failed. Run this script in an elevated CMD prompt.
  exit /b 1
)
echo.
echo [INFO] Pinging local.ehr (expected 127.0.0.1)...
ping -n 1 local.ehr
if errorlevel 1 (
  echo [ERROR] Ping to local.ehr failed. Re-check hosts entry and network.
  exit /b 1
)
echo.
echo [INFO] Fetching HTTPS headers from https://local.ehr (self-signed cert allowed)...
curl -kI https://local.ehr
if errorlevel 1 (
  echo [WARN] Unable to reach https://local.ehr. If nginx is not up yet, start services with scripts\01_up.cmd first.
) else (
  echo [OK] HTTPS response received from local.ehr.
)
exit /b 0

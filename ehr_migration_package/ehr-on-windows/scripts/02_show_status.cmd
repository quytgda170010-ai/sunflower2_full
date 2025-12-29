@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%\..") do set "PROJECT_ROOT=%%~fI"
pushd "%PROJECT_ROOT%" >nul 2>&1 || (
  echo [ERROR] Unable to change directory to project root.
  exit /b 1
)
echo [INFO] docker compose service status:
docker compose ps -a
if errorlevel 1 (
  echo [ERROR] docker compose ps failed.
  popd >nul
  exit /b 1
)
echo.
echo [INFO] Validating nginx configuration inside container...
docker exec nginx nginx -t
if errorlevel 1 (
  echo [ERROR] nginx configuration test failed.
  popd >nul
  exit /b 1
)
echo [OK] nginx configuration syntax is valid.
popd >nul
exit /b 0

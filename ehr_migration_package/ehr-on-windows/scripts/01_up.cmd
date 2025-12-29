@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%\..") do set "PROJECT_ROOT=%%~fI"
pushd "%PROJECT_ROOT%" >nul 2>&1 || (
  echo [ERROR] Unable to change directory to project root.
  exit /b 1
)
echo [INFO] Building and starting containers...
docker compose up -d --build
if errorlevel 1 (
  echo [ERROR] docker compose up failed.
  popd >nul
  exit /b 1
)
echo [OK] Services are up. Use scripts\02_show_status.cmd to verify health.
popd >nul
exit /b 0

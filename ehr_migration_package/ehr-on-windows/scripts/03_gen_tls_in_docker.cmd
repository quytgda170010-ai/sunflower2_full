@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%\..") do set "PROJECT_ROOT=%%~fI"
set "CERT_DIR=%PROJECT_ROOT%\nginx\certs"
if not exist "%CERT_DIR%" (
  mkdir "%CERT_DIR%"
  if errorlevel 1 (
    echo [ERROR] Unable to create nginx\certs directory.
    exit /b 1
  )
)
if exist "%CERT_DIR%\local.ehr.crt" del /q "%CERT_DIR%\local.ehr.crt"
if exist "%CERT_DIR%\local.ehr.key" del /q "%CERT_DIR%\local.ehr.key"
echo [INFO] Generating self-signed certificate for local.ehr inside Alpine container...
docker run --rm -v "%CERT_DIR%:/certs" -w /certs alpine sh -c "apk add --no-cache openssl >/dev/null 2>&1; openssl req -x509 -nodes -newkey rsa:4096 -keyout local.ehr.key -out local.ehr.crt -days 825 -subj \"/CN=local.ehr\"; chmod 600 local.ehr.key local.ehr.crt"
if errorlevel 1 (
  echo [ERROR] Failed to generate certificate.
  exit /b 1
)
if not exist "%CERT_DIR%\local.ehr.crt" (
  echo [ERROR] Certificate file not found after generation.
  exit /b 1
)
if not exist "%CERT_DIR%\local.ehr.key" (
  echo [ERROR] Key file not found after generation.
  exit /b 1
)
echo [OK] Generated nginx/certs/local.ehr.crt and nginx/certs/local.ehr.key.
exit /b 0

@echo off
setlocal
set "TMP_DIR=%TEMP%"
set "PING_FILE=%TMP_DIR%\ehr_ping_%RANDOM%.json"
set "PATIENTS_FILE=%TMP_DIR%\ehr_patients_%RANDOM%.json"
set "ENC_FILE=%TMP_DIR%\ehr_enc_%RANDOM%.json"

echo [INFO] Testing API over TLS at https://local.ehr ...
echo.

echo [STEP] GET /api/ping
curl -k -s https://local.ehr/api/ping > "%PING_FILE%"
if errorlevel 1 (
  echo [FAIL] /api/ping request failed.
  type "%PING_FILE%" 2>nul
  call :cleanup
  exit /b 1
)
type "%PING_FILE%"
findstr /C:"{\"db\":\"ok\"}" "%PING_FILE%" >nul
if errorlevel 1 (
  echo [FAIL] Expected {"db":"ok"} in /api/ping response.
  call :cleanup
  exit /b 1
) else (
  echo [PASS] /api/ping returned {"db":"ok"}.
)
echo.

echo [STEP] GET /api/patients
curl -k -s https://local.ehr/api/patients > "%PATIENTS_FILE%"
if errorlevel 1 (
  echo [FAIL] /api/patients request failed.
  type "%PATIENTS_FILE%" 2>nul
  call :cleanup
  exit /b 1
)
type "%PATIENTS_FILE%"
findstr /C:"\"id\":1" "%PATIENTS_FILE%" >nul
if errorlevel 1 (
  echo [FAIL] Expected patient data with \"id\":1 in response.
  call :cleanup
  exit /b 1
) else (
  echo [PASS] /api/patients returned seeded data.
)
echo.

echo [STEP] POST /api/enc-demo
curl -k -s -X POST https://local.ehr/api/enc-demo -H "Content-Type: application/json" -d "{\"text\":\"Hello AES-GCM\"}" > "%ENC_FILE%"
if errorlevel 1 (
  echo [FAIL] /api/enc-demo request failed.
  type "%ENC_FILE%" 2>nul
  call :cleanup
  exit /b 1
)
type "%ENC_FILE%"
findstr /C:"\"ciphertext\"" "%ENC_FILE%" >nul
if errorlevel 1 (
  echo [FAIL] Expected ciphertext field in /api/enc-demo response.
  call :cleanup
  exit /b 1
) else (
  echo [PASS] /api/enc-demo returned ciphertext payload.
)
echo.

echo [OK] API smoke test completed successfully.
call :cleanup
exit /b 0

:cleanup
if exist "%PING_FILE%" del /q "%PING_FILE%"
if exist "%PATIENTS_FILE%" del /q "%PATIENTS_FILE%"
if exist "%ENC_FILE%" del /q "%ENC_FILE%"
exit /b 0

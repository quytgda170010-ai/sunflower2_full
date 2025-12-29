@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%\..") do set "PROJECT_ROOT=%%~fI"
set "TMP_SCRIPT=%PROJECT_ROOT%\scripts\__rotate_tmp.py"
set "TMP_OUTPUT=%PROJECT_ROOT%\scripts\__rotate_tmp.out"
echo [INFO] Preparing secret rotation helper...
> "%TMP_SCRIPT%" (
  echo import base64
  echo import os
  echo import pathlib
  echo
  echo env_path = pathlib.Path("/work/.env")
  echo if not env_path.exists():
  echo     raise SystemExit("Missing /work/.env")
  echo lines = env_path.read_text().splitlines()
  echo new_key = base64.b64encode(os.urandom(32)).decode("utf-8")
  echo kid = None
  echo new_lines = []
  echo for line in lines:
  echo     if line.startswith("EHR_CORE_SECRET_KID="):
  echo         try:
  echo             kid = int(line.split("=", 1)[1].strip())
  echo         except ValueError:
  echo             kid = 1
  echo         kid += 1
  echo         new_lines.append(f"EHR_CORE_SECRET_KID={kid}")
  echo     elif line.startswith("EHR_CORE_SECRET="):
  echo         new_lines.append(f"EHR_CORE_SECRET={new_key}")
  echo     else:
  echo         new_lines.append(line)
  echo if kid is None:
  echo     kid = 2
  echo     new_lines.append(f"EHR_CORE_SECRET_KID={kid}")
  echo if not any(item.startswith("EHR_CORE_SECRET=") for item in new_lines):
  echo     new_lines.append(f"EHR_CORE_SECRET={new_key}")
  echo env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
  echo print(f"ROTATE_RESULT|{kid}|{new_key}")
)
docker run --rm -v "%PROJECT_ROOT%:/work" python:3.11-slim python /work/scripts/__rotate_tmp.py > "%TMP_OUTPUT%"
if errorlevel 1 (
  echo [ERROR] Failed to update .env via Python helper.
  del /q "%TMP_SCRIPT%" >nul 2>&1
  del /q "%TMP_OUTPUT%" >nul 2>&1
  exit /b 1
)
set "NEW_KID="
set "NEW_SECRET="
for /f "usebackq tokens=1-3 delims=|" %%A in ("%TMP_OUTPUT%") do (
  if "%%A"=="ROTATE_RESULT" (
    set "NEW_KID=%%B"
    set "NEW_SECRET=%%C"
  )
)
del /q "%TMP_SCRIPT%" >nul 2>&1
del /q "%TMP_OUTPUT%" >nul 2>&1
if not defined NEW_KID (
  echo [ERROR] Unable to parse rotation result.
  exit /b 1
)
set /a OLD_KID=%NEW_KID%-1 >nul
echo [OK] Updated .env with EHR_CORE_SECRET_KID=%NEW_KID%.
echo [INFO] New secret: %NEW_SECRET%
echo [NEXT] Deploy the change (scripts\01_up.cmd) and call POST https://local.ehr/api/admin/re_encrypt with ^{"legacy_secret_kid": "%OLD_KID%", "legacy_secret_b64": "<old_key>"} if you need to migrate stored notes. Enable the route by setting EHR_CORE_ENABLE_REENCRYPT_DEMO=1 in .env when running the migration.
exit /b 0

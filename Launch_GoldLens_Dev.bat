@echo off
setlocal enabledelayedexpansion
title GoldLens — Development Mode (Vite + FastAPI)
cd /d "%~dp0"

echo ===============================================================================
echo   GoldLens — Development Mode Launch (Vite Dev Server)
echo ===============================================================================
echo.

set "PYTHON_EXE=c:\Users\rahul\anaconda3\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python.exe"

:: 1. Ensure backend is running on 8000
set "BACKEND_RUNNING=0"
for /f "tokens=5" %%p in ('netstat -aon ^| findstr "LISTENING" ^| findstr ":8000 "') do (
    set "BACKEND_RUNNING=1"
)

if %BACKEND_RUNNING% EQU 0 (
    echo [*] Starting FastAPI backend on http://127.0.0.1:8000 ...
    start "GoldLens_Backend" /min "%PYTHON_EXE%" -m uvicorn main:app --app-dir "%~dp0backend" --host 127.0.0.1 --port 8000
) else (
    echo [*] Backend is already running on port 8000.
)

:: 2. Ensure Vite dev server is running on 5173
set "VITE_RUNNING=0"
for /f "tokens=5" %%p in ('netstat -aon ^| findstr "LISTENING" ^| findstr ":5173 "') do (
    set "VITE_RUNNING=1"
)

if %VITE_RUNNING% EQU 0 (
    echo [*] Starting Vite development server on http://127.0.0.1:5173 ...
    start "GoldLens_Frontend_Dev" /min cmd /c "set PATH=c:\Users\rahul\nodejs_bin;!PATH! && cd /d %~dp0frontend && node node_modules\vite\dist\node\cli.js --port 5173 --host 127.0.0.1"
) else (
    echo [*] Vite dev server is already running on port 5173.
)

:: Wait for Vite dev server readiness
echo [*] Waiting for Vite dev server to be ready...
set "MAX_TRIES=15"
set "TRY_COUNT=0"

:WAIT_DEV_READY
set /a TRY_COUNT+=1
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $res = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/' -UseBasicParsing -TimeoutSec 2; if ($res.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1

if !ERRORLEVEL! EQU 0 (
    echo [OK] Vite development server is ready.
    goto LAUNCH_DEV_BROWSER
)

if !TRY_COUNT! GEQ !MAX_TRIES! (
    echo [WARNING] Vite dev server initialization taking longer than usual.
    goto LAUNCH_DEV_BROWSER
)

timeout /t 1 /nobreak >nul
goto WAIT_DEV_READY

:LAUNCH_DEV_BROWSER
echo.
echo [*] Opening Vite dev application in default Windows browser...
start "" "http://127.0.0.1:5173/"

echo.
echo Development mode active at http://127.0.0.1:5173/
timeout /t 4 /nobreak >nul
exit /b 0

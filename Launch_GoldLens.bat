@echo off
title GoldLens — Commodity Derivatives Intelligence Platform
cd /d "%~dp0"

set "PYTHON_EXE=c:\Users\rahul\anaconda3\python.exe"
if not exist "%PYTHON_EXE%" (
    where python.exe >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set "PYTHON_EXE=python.exe"
    ) else (
        echo [ERROR] Python not found. Please install Python.
        pause
        exit /b 1
    )
)

"%PYTHON_EXE%" "%~dp0launcher.py"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Launcher encountered an issue.
    pause
) else (
    ping 127.0.0.1 -n 3 >nul
)

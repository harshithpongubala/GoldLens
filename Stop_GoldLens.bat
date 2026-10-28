@echo off
title Stop GoldLens Server
echo ===============================================================================
echo   Stopping GoldLens Application Services...
echo ===============================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = @(8000, 5173); foreach ($p in $ports) { try { $pids = (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique; foreach ($procId in $pids) { if ($procId -and $procId -ne 0) { Write-Host \"Terminating process on port $p (PID: $procId)...\"; Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } } } catch {} }"

echo.
echo [OK] GoldLens application processes stopped successfully.
ping 127.0.0.1 -n 3 >nul
exit /b 0

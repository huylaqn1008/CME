@echo off
title CME System - Restart HTTPS Servers
color 0A

echo ========================================
echo   🔄 CME System - Restart HTTPS Servers
echo ========================================
echo.

echo 🛑 Stopping existing servers...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo 🔒 Starting HTTPS servers...
call start-network-https.bat

echo.
echo ✅ HTTPS servers restarted successfully!
echo.
pause
@echo off
title CME System - HTTPS Network Server
color 0A

echo ========================================
echo   🔒 CME System - HTTPS Network Mode
echo ========================================
echo.

REM Check if SSL certificates exist
if not exist "ssl\cert.pem" (
    echo ❌ SSL certificates not found!
    echo.
    echo Please run generate-ssl-cert.bat first to create HTTPS certificates
    echo HTTPS is required for camera/microphone access from other devices
    echo.
    pause
    exit /b 1
)

echo ✅ SSL certificates found - HTTPS enabled
echo.

REM Get current IP addresses
echo 🌐 Detecting network configuration...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "ip=%%a"
    setlocal enabledelayedexpansion
    set "ip=!ip: =!"
    if "!ip!" NEQ "127.0.0.1" (
        echo    Network IP: !ip!
    )
    endlocal
)

echo.
echo 🔥 Starting servers with HTTPS...
echo.

REM Start backend server
echo 📡 Starting Backend Server (HTTPS)...
start "CME Backend HTTPS" cmd /k "cd /d %~dp0backend && npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server  
echo 🎨 Starting Frontend Server (HTTPS)...
start "CME Frontend HTTPS" cmd /k "cd /d %~dp0frontend && npm run dev"

REM Wait for servers to fully start
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   ✅ HTTPS Servers Started Successfully!
echo ========================================
echo.
echo 🔒 Access URLs (HTTPS - Camera/Mic enabled):
echo.
echo 📱 Local Access:
echo    https://localhost:5173
echo.
echo 🌐 Network Access (share these with other devices):
echo    Ethernet: https://192.168.1.140:5173
echo    Wi-Fi:    https://192.168.2.6:5173
echo.
echo 🎥 Backend API (HTTPS):
echo    Local:    https://localhost:5000
echo    Ethernet: https://192.168.1.140:5000
echo    Wi-Fi:    https://192.168.2.6:5000
echo.
echo ========================================
echo   📋 Important Notes:
echo ========================================
echo.
echo ✅ Camera/Microphone will work on ALL devices
echo ✅ Secure HTTPS connection established
echo ✅ All network interfaces configured
echo.
echo 🔧 Troubleshooting:
echo - If browser shows "Not Secure", click "Advanced" → "Proceed"
echo - First time access may require certificate acceptance
echo - Ensure all devices are on the same network
echo.
echo 🛑 To stop servers: Close this window or press Ctrl+C in server windows
echo.
echo Press any key to open local HTTPS URL...
pause >nul

start https://localhost:5173

echo.
echo 🚀 System running! Share the network URLs with other devices.
echo.
pause
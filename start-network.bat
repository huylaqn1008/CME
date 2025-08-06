@echo off
echo ========================================
echo   CME System - Network Access Setup
echo ========================================
echo.

echo Getting your IP addresses...
echo.

echo === NETWORK INFORMATION ===
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo IP Address: %%b
    )
)

echo.
echo === CHECKING SSL CERTIFICATES ===
if exist "ssl\cert.pem" (
    echo ✅ SSL certificates found - HTTPS will be enabled
    set PROTOCOL=https
) else (
    echo ⚠️  No SSL certificates found - using HTTP
    echo    Camera/microphone may be blocked on other devices
    echo    To enable HTTPS: run generate-ssl-cert.bat first
    set PROTOCOL=http
)

echo.
echo === STARTING SERVERS ===
echo.

echo Starting Backend Server...
start "CME Backend" cmd /k "cd /d backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "CME Frontend" cmd /k "cd /d frontend && npm run dev"

echo.
echo ========================================
echo   ACCESS INFORMATION
echo ========================================
echo.
echo LOCAL ACCESS (on this computer):
echo   Frontend: %PROTOCOL%://localhost:5173
echo   Backend:  %PROTOCOL%://localhost:5000
echo.
echo NETWORK ACCESS (from other devices):
echo   Use one of these Frontend URLs:
echo   - %PROTOCOL%://192.168.1.140:5173  (Ethernet)
echo   - %PROTOCOL%://192.168.2.6:5173    (Wi-Fi)
echo.
echo   Backend URLs (for reference):
echo   - %PROTOCOL%://192.168.1.140:5000  (Ethernet)
echo   - %PROTOCOL%://192.168.2.6:5000    (Wi-Fi)
echo.
echo ========================================
echo   CAMERA/MICROPHONE ACCESS
echo ========================================
echo.
if "%PROTOCOL%"=="https" (
    echo ✅ HTTPS enabled - camera/microphone should work on all devices
) else (
    echo ⚠️  HTTP only - camera/microphone may be blocked on other devices
    echo.
    echo To enable camera/microphone on other devices:
    echo 1. Run generate-ssl-cert.bat to create SSL certificates
    echo 2. Restart the servers
    echo 3. Use https:// URLs instead of http://
    echo.
    echo Alternative: Manually allow camera/mic in browser:
    echo - Chrome: Click lock icon → Allow camera/microphone
    echo - Firefox: Click shield icon → Allow camera/microphone
)
echo.
echo ========================================
echo   TROUBLESHOOTING
echo ========================================
echo.
echo If login fails from other devices:
echo 1. Make sure firewall is configured (run setup-firewall.bat as Admin)
echo 2. Check that all devices are on the same network
echo 3. Try both IP addresses above
echo 4. Check browser console for error messages
echo.
echo If camera/microphone doesn't work:
echo 1. Enable HTTPS by running generate-ssl-cert.bat
echo 2. Or manually allow in browser settings
echo 3. Refresh the page after allowing permissions
echo.
echo ========================================
echo.
echo Servers are starting... Please wait a moment for them to fully load.
echo You can close this window once both servers are running.
echo.
pause
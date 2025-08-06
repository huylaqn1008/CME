@echo off
echo ========================================
echo   CME System - Firewall Setup
echo ========================================
echo.
echo This script will add firewall rules to allow network access.
echo Please run this script as Administrator.
echo.

echo Adding firewall rule for Frontend (port 5173)...
netsh advfirewall firewall add rule name="CME Frontend" dir=in action=allow protocol=TCP localport=5173

echo Adding firewall rule for Backend (port 5000)...
netsh advfirewall firewall add rule name="CME Backend" dir=in action=allow protocol=TCP localport=5000

echo.
echo ========================================
echo   Firewall rules added successfully!
echo ========================================
echo.
echo Now you can run start-network.bat to start the servers.
echo.
pause
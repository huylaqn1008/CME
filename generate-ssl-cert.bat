@echo off
echo ========================================
echo   CME System - SSL Certificate Setup
echo ========================================
echo.
echo This script will generate SSL certificates for HTTPS access
echo HTTPS is required for camera/microphone access from other devices
echo.

echo Checking for mkcert installation...
where mkcert >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ mkcert not found. Installing via Chocolatey...
    echo.
    
    where choco >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo Installing Chocolatey first...
        powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
        if %ERRORLEVEL% NEQ 0 (
            echo ❌ Failed to install Chocolatey
            echo Please install mkcert manually:
            echo 1. Download from: https://github.com/FiloSottile/mkcert/releases
            echo 2. Extract to a folder in your PATH
            echo 3. Run this script again
            pause
            exit /b 1
        )
        echo ✅ Chocolatey installed successfully
    )
    
    echo Installing mkcert...
    choco install mkcert -y
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install mkcert via Chocolatey
        echo Please install manually from: https://github.com/FiloSottile/mkcert/releases
        pause
        exit /b 1
    )
    echo ✅ mkcert installed successfully
)

echo.
echo Creating certificates directory...
if not exist "ssl" mkdir ssl
cd ssl

echo.
echo Installing local CA (Certificate Authority)...
mkcert -install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install local CA
    pause
    exit /b 1
)

echo.
echo Generating certificates for all network interfaces...
echo - localhost (127.0.0.1)
echo - Ethernet: 192.168.1.140
echo - Wi-Fi: 192.168.2.6
echo - IPv6 localhost (::1)

mkcert localhost 127.0.0.1 192.168.1.140 192.168.2.6 ::1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Certificate generation failed
    pause
    exit /b 1
)

echo.
echo Renaming certificate files...
for %%f in (localhost*.pem) do (
    if not exist cert.pem (
        ren "%%f" cert.pem
        echo ✅ Certificate renamed to cert.pem
    )
)

for %%f in (localhost*-key.pem) do (
    if not exist key.pem (
        ren "%%f" key.pem
        echo ✅ Private key renamed to key.pem
    )
)

if not exist cert.pem (
    echo ❌ Certificate file not found
    pause
    exit /b 1
)

if not exist key.pem (
    echo ❌ Private key file not found
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo   ✅ SSL Setup Complete!
echo ========================================
echo.
echo Certificates created in ssl/ directory:
echo - ssl/cert.pem (certificate)
echo - ssl/key.pem (private key)
echo.
echo 🔒 HTTPS will be enabled for:
echo - https://localhost:5173 (local access)
echo - https://192.168.1.140:5173 (Ethernet network)
echo - https://192.168.2.6:5173 (Wi-Fi network)
echo.
echo 📱 Camera/Microphone will now work on all devices!
echo.
echo Next: Run start-network-https.bat to start with HTTPS
echo.
pause
@echo off
echo ========================================
echo   Manual mkcert Installation
echo ========================================
echo.
echo Downloading mkcert for Windows...

REM Create temp directory
if not exist "temp" mkdir temp
cd temp

echo Downloading mkcert v1.4.4...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe' -OutFile 'mkcert.exe'"

if not exist "mkcert.exe" (
    echo ❌ Download failed. Please download manually from:
    echo https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe
    echo Save as mkcert.exe in this folder
    pause
    exit /b 1
)

echo ✅ mkcert downloaded successfully

REM Move to parent directory
move mkcert.exe ..\mkcert.exe
cd ..
rmdir /s /q temp

echo.
echo ✅ mkcert installed in current directory
echo Now you can run: .\generate-ssl-cert-simple.bat
echo.
pause
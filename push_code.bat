@echo off
setlocal
title MC-SERVER-PRO - Git Push Automation Tool
cls
echo ============================================================================== 
echo     DANG KHOI CHAY TIEN TRINH DAY CODE LEN GITHUB (MC-SERVER-PRO)...
echo ============================================================================== 
echo.

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0push_code.ps1" %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [LOI] Co loi xay ra trong qua trinh chay.
    pause
)
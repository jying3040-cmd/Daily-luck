@echo off
cd /d "%~dp0"

if not exist "node_modules" call npm.cmd install
if errorlevel 1 exit /b 1

call npm.cmd run build
if errorlevel 1 exit /b 1

start "" "http://127.0.0.1:3000"
call npm.cmd start

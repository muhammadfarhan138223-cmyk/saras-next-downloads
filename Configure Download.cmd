@echo off
cd /d "%~dp0"
node scripts\configure-download.mjs
if errorlevel 1 goto end
call npm run build
if errorlevel 1 goto end
call npm run check
if errorlevel 1 goto end
call npm test
:end
pause

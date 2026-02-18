@echo off
title 90s Collage Maker (Production)

cd /d "%~dp0"

echo Building project...
npm install
npm run build

echo.
echo Launching preview server...
npm run preview

pause

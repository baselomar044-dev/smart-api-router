@echo off
title Try-It! AI Platform
echo.
echo ========================================
echo    Try-It! AI Platform - Starting...
echo ========================================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo [1/2] Installing dependencies...
    call npm install
    echo.
)

echo [2/2] Starting servers...
echo.
echo    Server: http://localhost:3001
echo    App:    http://localhost:5173
echo.
echo ========================================
echo    Opening browser in 5 seconds...
echo ========================================
echo.

:: Start the app and open browser
start "" http://localhost:5173
npm run dev

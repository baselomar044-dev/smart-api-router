@echo off
title Solve It! - Deploy Online
color 0B

echo.
echo  ========================================
echo     SOLVE IT! - Deploy to Vercel
echo  ========================================
echo.

:: Check if Vercel CLI is installed
where vercel >nul 2>nul
if errorlevel 1 (
    echo  [1/3] Installing Vercel CLI...
    call npm install -g vercel
    if errorlevel 1 (
        echo  ERROR: Failed to install Vercel CLI
        pause
        exit /b 1
    )
    echo  [OK] Vercel CLI installed!
    echo.
) else (
    echo  [OK] Vercel CLI found
    echo.
)

echo  [2/3] Logging in to Vercel...
echo       (Browser will open for login)
echo.
call vercel login

echo.
echo  [3/3] Deploying...
echo.
call vercel --prod

echo.
echo  ========================================
echo       DEPLOYMENT COMPLETE!
echo  ========================================
echo.
echo  Your app is now live on Vercel!
echo.
pause

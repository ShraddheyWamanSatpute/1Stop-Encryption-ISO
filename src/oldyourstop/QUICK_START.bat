@echo off
echo ========================================
echo    Book My Table - Quick Start
echo ========================================
echo.

echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies!
    pause
    exit /b 1
)

echo.
echo Installing frontend dependencies...
cd ../frontend
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies!
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo To start the application:
echo 1. Open two command prompts
echo 2. In first prompt: cd backend && npm run dev
echo 3. In second prompt: cd frontend && npm run dev
echo 4. Open browser to http://localhost:3000
echo.
echo Press any key to exit...
pause > nul

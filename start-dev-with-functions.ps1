# Start Development Environment with Firebase Functions Emulator
# This script starts both the Firebase Functions emulator and the Vite dev server

Write-Host "Starting 1Stop Development Environment with Firebase Functions..." -ForegroundColor Green
Write-Host ""

# Get the script directory
$projectRoot = $PSScriptRoot

# Start Firebase Functions Emulator in background
Write-Host "Starting Firebase Functions Emulator..." -ForegroundColor Cyan
$emulatorJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location "$root\functions"
    npm run serve
} -ArgumentList $projectRoot

Write-Host "✓ Firebase Emulator starting in background" -ForegroundColor Green
Write-Host ""

# Wait a bit for emulator to initialize
Write-Host "Waiting for emulator to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Vite Dev Server
Write-Host "Starting Vite Development Server..." -ForegroundColor Cyan
Write-Host ""
Set-Location $projectRoot
npm run dev

# Cleanup function
Write-Host ""
Write-Host "Shutting down..." -ForegroundColor Yellow
Stop-Job $emulatorJob
Remove-Job $emulatorJob
Write-Host "✓ All services stopped" -ForegroundColor Green


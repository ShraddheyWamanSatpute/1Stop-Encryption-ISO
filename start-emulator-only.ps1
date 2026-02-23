# Start Firebase Functions Emulator Only
# Use this if you want to run the emulator separately from the dev server

Write-Host "Starting Firebase Functions Emulator..." -ForegroundColor Green
Write-Host ""

# Get the script directory
$projectRoot = $PSScriptRoot

# Navigate to functions directory and start emulator
Set-Location "$projectRoot\functions"
npm run serve


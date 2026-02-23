# Setup script for development environment
# Installs dependencies for both main app and YourStop

Write-Host "Setting up 1Stop Development Environment..." -ForegroundColor Green
Write-Host ""

# Install main app dependencies
Write-Host "Installing main app dependencies..." -ForegroundColor Cyan
npm install

# Install YourStop frontend dependencies
Write-Host "Installing YourStop frontend dependencies..." -ForegroundColor Cyan
Set-Location "src\yourstop\frontend"
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "YourStop dependencies already installed" -ForegroundColor Yellow
}

# Install YourStop backend dependencies (if needed)
Write-Host "Installing YourStop backend dependencies..." -ForegroundColor Cyan
Set-Location "..\backend"
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "YourStop backend dependencies already installed" -ForegroundColor Yellow
}

# Return to root
Set-Location "..\..\..\.."

Write-Host ""
Write-Host "✓ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start both apps, run:" -ForegroundColor Cyan
Write-Host "  npm run dev:all" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or start separately:" -ForegroundColor Cyan
Write-Host "  npm run dev          (main app)" -ForegroundColor Yellow
Write-Host "  npm run dev:yourstop (YourStop)" -ForegroundColor Yellow


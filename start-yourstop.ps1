# PowerShell script to start YourStop Next.js app
# Run this in a separate terminal while the main app is running

Write-Host "Starting YourStop Next.js Application..." -ForegroundColor Green
Write-Host ""

# Navigate to YourStop frontend directory
Set-Location "src\yourstop\frontend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the Next.js development server
Write-Host "Starting Next.js dev server on http://localhost:3000" -ForegroundColor Cyan
Write-Host "Access YourStop at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Or via main app: http://localhost:5173/YourStop" -ForegroundColor Cyan
Write-Host ""

npm run dev


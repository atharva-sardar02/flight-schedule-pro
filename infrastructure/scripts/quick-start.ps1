# Quick Start Script for Windows (PowerShell)
# Flight Schedule Pro - Local Development Setup

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Flight Schedule Pro - Quick Start" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "[WARN] .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item env.template .env
    Write-Host "[INFO] .env file created. Please edit it with your values." -ForegroundColor Green
    Write-Host ""
    Write-Host "[WARN] MINIMUM required values for local dev:" -ForegroundColor Yellow
    Write-Host "  - DATABASE_PASSWORD"
    Write-Host "  - COGNITO_USER_POOL_ID (after Cognito deployment)"
    Write-Host "  - COGNITO_CLIENT_ID (after Cognito deployment)"
    Write-Host ""
    Read-Host "Press Enter to continue after editing .env"
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "[INFO] Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
try {
    $pgVersion = psql --version
    Write-Host "[INFO] PostgreSQL version: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] PostgreSQL is not installed. Please install PostgreSQL 14+ first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[INFO] Step 1: Installing dependencies..." -ForegroundColor Green
npm run install:all

Write-Host ""
Write-Host "[INFO] Step 2: Setting up database..." -ForegroundColor Green

# Check if database exists
$dbExists = psql -lqt | Select-String "flight_schedule_pro"
if ($dbExists) {
    Write-Host "[INFO] Database 'flight_schedule_pro' already exists" -ForegroundColor Green
    $recreate = Read-Host "Do you want to recreate it? (y/N)"
    if ($recreate -eq "y" -or $recreate -eq "Y") {
        dropdb flight_schedule_pro
        npm run db:setup
    }
} else {
    npm run db:setup
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Next steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Configure AWS Cognito (if not using mock auth):"
Write-Host "   See docs\LOCAL_DEVELOPMENT_GUIDE.md for AWS deployment"
Write-Host ""
Write-Host "2. Start backend server (Terminal 1):"
Write-Host "   npm run dev:backend" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Start frontend server (Terminal 2):"
Write-Host "   npm run dev:frontend" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Visit http://localhost:3000"
Write-Host ""
Write-Host "[WARN] Note: Authentication requires Cognito deployment or mock mode" -ForegroundColor Yellow
Write-Host "[INFO] See docs\LOCAL_DEVELOPMENT_GUIDE.md for full instructions" -ForegroundColor Green



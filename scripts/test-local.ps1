# Local Testing Script for Flight Schedule Pro
# Tests backend, frontend, and their connection

Write-Host "=========================================="
Write-Host "Flight Schedule Pro - Local Testing"
Write-Host "=========================================="
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env from template..." -ForegroundColor Yellow
    Copy-Item "env.template" ".env"
    Write-Host "✅ .env created. Please update it with your values." -ForegroundColor Green
    Write-Host ""
}

# Check Node.js
Write-Host "Checking Node.js..."
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found! Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..."
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Checking Dependencies"
Write-Host "=========================================="

# Check backend dependencies
if (-not (Test-Path "backend/node_modules")) {
    Write-Host "⚠️  Backend dependencies not installed" -ForegroundColor Yellow
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
}

# Check frontend dependencies
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "⚠️  Frontend dependencies not installed" -ForegroundColor Yellow
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Environment Check"
Write-Host "=========================================="

# Load .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Check critical environment variables
$requiredVars = @(
    "DATABASE_HOST",
    "DATABASE_NAME",
    "DATABASE_USER",
    "COGNITO_USER_POOL_ID",
    "COGNITO_CLIENT_ID"
)

$missingVars = @()
foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if ($value) {
        Write-Host "✅ $var is set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $var is not set" -ForegroundColor Yellow
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Some environment variables are missing. Please update .env file." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Ready to Test!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Next steps:"
Write-Host ""
Write-Host "1. Start Backend (Terminal 1):"
Write-Host "   cd backend"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "2. Start Frontend (Terminal 2):"
Write-Host "   cd frontend"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "3. Test Backend Health:"
Write-Host "   Open: http://localhost:3001/health"
Write-Host ""
Write-Host "4. Test Frontend:"
Write-Host "   Open: http://localhost:3000"
Write-Host ""
Write-Host "5. Test CORS (from browser console on localhost:3000):"
Write-Host "   fetch('http://localhost:3001/health').then(r => r.json()).then(console.log)"
Write-Host ""


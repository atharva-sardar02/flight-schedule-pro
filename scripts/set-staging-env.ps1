# Flight Schedule Pro - Staging Environment Variables Setup
# Run this script to set all required environment variables for staging deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Staging Environment Variables Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# AWS Configuration
$env:AWS_REGION = "us-east-1"
$env:AWS_PROFILE = "default"

Write-Host "✓ AWS Region set to: $env:AWS_REGION" -ForegroundColor Green
Write-Host "✓ AWS Profile set to: $env:AWS_PROFILE" -ForegroundColor Green
Write-Host ""

# API Keys - User will need to provide these
Write-Host "Please provide the following API keys:" -ForegroundColor Yellow
Write-Host ""

# OpenWeatherMap API Key
$openWeatherKey = Read-Host "Enter OpenWeatherMap API Key"
if ($openWeatherKey) {
    $env:OPENWEATHERMAP_API_KEY = $openWeatherKey
    Write-Host "✓ OpenWeatherMap API Key set" -ForegroundColor Green
} else {
    Write-Host "⚠ OpenWeatherMap API Key not provided" -ForegroundColor Yellow
}

# WeatherAPI.com API Key (optional - can use OpenWeatherMap only)
$weatherApiKey = Read-Host "Enter WeatherAPI.com API Key (optional, press Enter to skip)"
if ($weatherApiKey) {
    $env:WEATHERAPI_COM_KEY = $weatherApiKey
    Write-Host "✓ WeatherAPI.com API Key set" -ForegroundColor Green
} else {
    Write-Host "⚠ WeatherAPI.com API Key not provided (will use OpenWeatherMap only)" -ForegroundColor Yellow
}

# Anthropic API Key
$anthropicKey = Read-Host "Enter Anthropic API Key (for AI rescheduling)"
if ($anthropicKey) {
    $env:ANTHROPIC_API_KEY = $anthropicKey
    Write-Host "✓ Anthropic API Key set" -ForegroundColor Green
} else {
    Write-Host "⚠ Anthropic API Key not provided" -ForegroundColor Yellow
}

# Database Password
Write-Host ""
Write-Host "Database Password Requirements:" -ForegroundColor Yellow
Write-Host "  - Minimum 8 characters" -ForegroundColor Yellow
Write-Host "  - Contains uppercase letters" -ForegroundColor Yellow
Write-Host "  - Contains lowercase letters" -ForegroundColor Yellow
Write-Host "  - Contains numbers" -ForegroundColor Yellow
Write-Host "  - Contains special characters (!@#\$%^&*)" -ForegroundColor Yellow
Write-Host ""

$dbPassword = Read-Host "Enter Database Master Password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
$env:DB_MASTER_PASSWORD = $dbPasswordPlain

Write-Host "✓ Database password set" -ForegroundColor Green
Write-Host ""

# Verify all variables
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Environment Variables Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS_REGION: $env:AWS_REGION" -ForegroundColor White
Write-Host "AWS_PROFILE: $env:AWS_PROFILE" -ForegroundColor White
Write-Host "OPENWEATHERMAP_API_KEY: $(if ($env:OPENWEATHERMAP_API_KEY) { '***SET***' } else { 'NOT SET' })" -ForegroundColor $(if ($env:OPENWEATHERMAP_API_KEY) { 'Green' } else { 'Red' })
Write-Host "WEATHERAPI_COM_KEY: $(if ($env:WEATHERAPI_COM_KEY) { '***SET***' } else { 'NOT SET' })" -ForegroundColor $(if ($env:WEATHERAPI_COM_KEY) { 'Green' } else { 'Yellow' })
Write-Host "ANTHROPIC_API_KEY: $(if ($env:ANTHROPIC_API_KEY) { '***SET***' } else { 'NOT SET' })" -ForegroundColor $(if ($env:ANTHROPIC_API_KEY) { 'Green' } else { 'Red' })
Write-Host "DB_MASTER_PASSWORD: $(if ($env:DB_MASTER_PASSWORD) { '***SET***' } else { 'NOT SET' })" -ForegroundColor $(if ($env:DB_MASTER_PASSWORD) { 'Green' } else { 'Red' })
Write-Host ""

# Save to file for reference (without sensitive values)
$envSummary = @"
# Staging Environment Variables
# Set these in your PowerShell session before deployment

`$env:AWS_REGION = "$env:AWS_REGION"
`$env:AWS_PROFILE = "$env:AWS_PROFILE"
`$env:OPENWEATHERMAP_API_KEY = "YOUR_KEY_HERE"
`$env:WEATHERAPI_COM_KEY = "YOUR_KEY_HERE"
`$env:ANTHROPIC_API_KEY = "YOUR_KEY_HERE"
`$env:DB_MASTER_PASSWORD = "YOUR_PASSWORD_HERE"
"@

$envSummary | Out-File -FilePath ".env.staging.template" -Encoding UTF8
Write-Host "✓ Environment template saved to .env.staging.template" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Step: Validate CloudFormation Templates" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: These environment variables are set for this PowerShell session only." -ForegroundColor Yellow
Write-Host "If you open a new terminal, you'll need to set them again." -ForegroundColor Yellow
Write-Host ""


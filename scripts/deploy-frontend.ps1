# Simple Frontend Deployment Script (PowerShell)
# Usage: .\deploy-frontend.ps1 -EC2IP <IP> -S3Bucket <BUCKET>

param(
    [Parameter(Mandatory=$true)]
    [string]$EC2IP,
    
    [Parameter(Mandatory=$true)]
    [string]$S3Bucket
)

Write-Host "=========================================="
Write-Host "Deploying Frontend to S3"
Write-Host "=========================================="
Write-Host "EC2 IP: $EC2IP"
Write-Host "S3 Bucket: $S3Bucket"
Write-Host ""

# Navigate to frontend directory
$frontendDir = Join-Path $PSScriptRoot "..\frontend"
Set-Location $frontendDir

# Create production environment file
Write-Host "Creating .env.production..."
$envContent = "VITE_API_BASE_URL=http://${EC2IP}:3001"
Set-Content -Path .env.production -Value $envContent -Encoding utf8 -NoNewline
Write-Host "✅ Environment file created: $envContent"

# Build frontend
Write-Host ""
Write-Host "Building frontend..."
npm run build
Write-Host "✅ Build complete"

# Check if dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "❌ Error: dist folder not found. Build may have failed." -ForegroundColor Red
    exit 1
}

# Upload to S3
Write-Host ""
Write-Host "Uploading to S3..."
$syncResult = aws s3 sync dist/ "s3://$S3Bucket" --delete 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error uploading to S3:" -ForegroundColor Red
    Write-Host $syncResult
    exit 1
}
Write-Host "✅ Upload complete"

# Set proper content types (only if file exists)
Write-Host ""
Write-Host "Setting content types..."
$cpResult = aws s3 cp "s3://$S3Bucket/index.html" "s3://$S3Bucket/index.html" --content-type "text/html" --metadata-directive REPLACE 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Could not set content type for index.html (file may not exist yet)" -ForegroundColor Yellow
    Write-Host $cpResult
}

# Get region (with error handling)
Write-Host ""
Write-Host "Getting bucket region..."
$regionResult = aws s3api get-bucket-location --bucket $S3Bucket --query LocationConstraint --output text 2>&1
if ($LASTEXITCODE -eq 0 -and $regionResult) {
    $region = $regionResult
    if ($region -eq "None" -or $region -eq "") {
        $region = "us-east-1"
    }
} else {
    Write-Host "⚠️  Warning: Could not determine bucket region, defaulting to us-east-1" -ForegroundColor Yellow
    $region = "us-east-1"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "✅ Deployment Complete!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Frontend URL: http://$S3Bucket.s3-website-$region.amazonaws.com"
Write-Host ""
Write-Host "Make sure to:"
Write-Host "1. Enable static website hosting on the S3 bucket"
Write-Host "2. Update CORS in backend to allow this domain"
Write-Host "3. Restart backend: pm2 restart flight-api"
Write-Host ""


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
"VITE_API_BASE_URL=http://$EC2IP:3001" | Out-File -FilePath .env.production -Encoding utf8
Write-Host "✅ Environment file created"

# Build frontend
Write-Host ""
Write-Host "Building frontend..."
npm run build
Write-Host "✅ Build complete"

# Upload to S3
Write-Host ""
Write-Host "Uploading to S3..."
aws s3 sync dist/ "s3://$S3Bucket" --delete
Write-Host "✅ Upload complete"

# Set proper content types
Write-Host ""
Write-Host "Setting content types..."
aws s3 cp "s3://$S3Bucket/index.html" "s3://$S3Bucket/index.html" --content-type "text/html" --metadata-directive REPLACE

# Get region
$region = (aws s3api get-bucket-location --bucket $S3Bucket --query LocationConstraint --output text)
if ($region -eq "None") {
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


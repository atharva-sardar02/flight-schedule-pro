# Quick Repackage Script
# Run this to fix the Lambda handler error

Write-Host "`n=== Repackaging Lambda Code ===" -ForegroundColor Cyan

cd D:\gauntlet-ai\flight-schedule-pro\backend

# Step 1: Clean up
Write-Host "`n1. Cleaning up old package..." -ForegroundColor Yellow
Remove-Item "lambda-package" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "lambda-package.zip" -Force -ErrorAction SilentlyContinue

# Step 2: Create fresh package
Write-Host "2. Creating fresh package directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path lambda-package -Force | Out-Null

# Step 3: Copy files
Write-Host "3. Copying compiled files..." -ForegroundColor Yellow
Copy-Item -Path "dist\*" -Destination "lambda-package" -Recurse -Force

# Step 4: Copy node_modules
Write-Host "4. Copying node_modules..." -ForegroundColor Yellow
$nodeModulesDest = Join-Path "lambda-package" "node_modules"
Copy-Item -Path "node_modules" -Destination $nodeModulesDest -Recurse -Force

# Step 5: Verify structure
Write-Host "5. Verifying structure..." -ForegroundColor Yellow
$authPath = Join-Path "lambda-package" -ChildPath "functions\api\auth.js"
if (Test-Path $authPath) {
    Write-Host "   ✓ auth.js found" -ForegroundColor Green
} else {
    Write-Host "   ✗ auth.js NOT found!" -ForegroundColor Red
    exit 1
}

# Step 6: Create ZIP
Write-Host "6. Creating ZIP file..." -ForegroundColor Yellow
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory("lambda-package", "lambda-package.zip")

$zipSize = (Get-Item "lambda-package.zip").Length / 1MB
Write-Host "   ✓ Created lambda-package.zip ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green

# Step 7: Upload to S3
Write-Host "`n7. Uploading to S3..." -ForegroundColor Yellow
aws s3 cp lambda-package.zip s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip --region us-east-1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "   ✗ Upload failed!" -ForegroundColor Red
    exit 1
}

# Step 8: Update Lambda
Write-Host "`n8. Updating Lambda function..." -ForegroundColor Yellow
aws lambda update-function-code --function-name flight-schedule-pro-staging-api --s3-bucket flight-schedule-pro-lambda-code --s3-key staging/lambda-code.zip --region us-east-1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Lambda updated" -ForegroundColor Green
} else {
    Write-Host "   ✗ Lambda update failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "`nWait 10-15 seconds for Lambda to update, then test the API again.`n" -ForegroundColor Cyan

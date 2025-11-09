# Lambda Packaging Script for Windows PowerShell
# Packages compiled TypeScript code + production dependencies for AWS Lambda

Write-Host "`n=== Lambda Packaging Script ===" -ForegroundColor Cyan
Write-Host "Packaging Lambda code for deployment...`n" -ForegroundColor Yellow

# Step 1: Check if dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "✗ ERROR: dist/ folder not found!" -ForegroundColor Red
    Write-Host "   Run 'npm run build' first to compile TypeScript." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Step 1: dist/ folder found" -ForegroundColor Green

# Step 2: Install production dependencies only
Write-Host "`nStep 2: Installing production dependencies..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "  Removing existing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules
}

npm install --production
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ERROR: Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Production dependencies installed" -ForegroundColor Green

# Step 3: Create package directory
$packageDir = "lambda-package"
if (Test-Path $packageDir) {
    Write-Host "`n  Removing existing $packageDir..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $packageDir
}
New-Item -ItemType Directory -Path $packageDir | Out-Null
Write-Host "✓ Step 3: Created package directory" -ForegroundColor Green

# Step 4: Copy compiled JavaScript files from dist/
Write-Host "`nStep 4: Copying compiled files from dist/..." -ForegroundColor Cyan
Copy-Item -Path "dist\*" -Destination $packageDir -Recurse -Force
Write-Host "✓ Compiled files copied" -ForegroundColor Green

# Step 5: Copy node_modules (production only)
Write-Host "`nStep 5: Copying production node_modules..." -ForegroundColor Cyan
Copy-Item -Path "node_modules" -Destination "$packageDir\node_modules" -Recurse -Force
Write-Host "✓ node_modules copied" -ForegroundColor Green

# Step 6: Create zip file
Write-Host "`nStep 6: Creating zip file..." -ForegroundColor Cyan
$zipFile = "lambda-package.zip"
if (Test-Path $zipFile) {
    Remove-Item -Force $zipFile
    Write-Host "  Removed existing $zipFile" -ForegroundColor Yellow
}

# Use .NET compression (available on Windows)
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($packageDir, $zipFile)

$zipSize = (Get-Item $zipFile).Length / 1MB
Write-Host "✓ Created $zipFile ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green

# Step 7: Summary
Write-Host "`n=== Packaging Complete ===" -ForegroundColor Green
Write-Host "Package location: $PWD\$zipFile" -ForegroundColor Cyan
Write-Host "Package size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Upload $zipFile to your S3 bucket" -ForegroundColor White
Write-Host "2. Note the S3 object key (e.g., s3://your-bucket/lambda-package.zip)" -ForegroundColor White
Write-Host "3. Use this S3 location in your CloudFormation Lambda deployment`n" -ForegroundColor White



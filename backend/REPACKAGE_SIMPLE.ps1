Write-Host "Repackaging Lambda Code" -ForegroundColor Cyan

$backendDir = "D:\gauntlet-ai\flight-schedule-pro\backend"
cd $backendDir

# Clean up - check both backend and parent directory
Remove-Item "$backendDir\lambda-package" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$backendDir\lambda-package.zip" -Force -ErrorAction SilentlyContinue
Remove-Item "D:\gauntlet-ai\flight-schedule-pro\lambda-package.zip" -Force -ErrorAction SilentlyContinue

New-Item -ItemType Directory -Path "$backendDir\lambda-package" -Force | Out-Null

# Copy compiled code
Copy-Item -Path "$backendDir\dist\*" -Destination "$backendDir\lambda-package" -Recurse -Force

# Copy package.json and package-lock.json for npm install
Copy-Item -Path "$backendDir\package.json" -Destination "$backendDir\lambda-package\package.json" -Force
if (Test-Path "$backendDir\package-lock.json") {
    Copy-Item -Path "$backendDir\package-lock.json" -Destination "$backendDir\lambda-package\package-lock.json" -Force
}

Write-Host "Installing production dependencies..." -ForegroundColor Yellow
Push-Location "$backendDir\lambda-package"
npm install --production --legacy-peer-deps --no-audit --no-fund
Pop-Location

Write-Host "Creating ZIP..." -ForegroundColor Yellow
$packageDir = "$backendDir\lambda-package"
$zipFile = "$backendDir\lambda-package.zip"
Remove-Item $zipFile -Force -ErrorAction SilentlyContinue
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($packageDir, $zipFile)

Write-Host "Package created. Uploading to S3..." -ForegroundColor Yellow

aws s3 cp $zipFile s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip --region us-east-1

Write-Host "Updating Lambda..." -ForegroundColor Yellow

aws lambda update-function-code --function-name flight-schedule-pro-staging-api --s3-bucket flight-schedule-pro-lambda-code --s3-key staging/lambda-code.zip --region us-east-1

Write-Host "Done! Wait 15 seconds then test." -ForegroundColor Green


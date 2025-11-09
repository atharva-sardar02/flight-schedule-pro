# Repackage Lambda - Fix Handler Error

## Problem
Lambda can't find the handler file even though handler is set to `functions.api.auth.handler`.

## Solution: Repackage and Re-upload

### Step 1: Recreate Package Directory

```powershell
cd D:\gauntlet-ai\flight-schedule-pro\backend

# Remove old package
Remove-Item "lambda-package" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "lambda-package.zip" -Force -ErrorAction SilentlyContinue

# Create fresh package
New-Item -ItemType Directory -Path lambda-package -Force

# Copy compiled files
Copy-Item -Path "dist\*" -Destination "lambda-package\" -Recurse -Force

# Copy node_modules
Copy-Item -Path "node_modules" -Destination "lambda-package\node_modules" -Recurse -Force
```

### Step 2: Verify Structure

```powershell
# Check auth.js exists
Test-Path "lambda-package\functions\api\auth.js"

# Should return: True
```

### Step 3: Create ZIP

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory("lambda-package", "lambda-package.zip")
```

### Step 4: Upload to S3

```powershell
aws s3 cp lambda-package.zip s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip --region us-east-1
```

### Step 5: Update Lambda

```powershell
aws lambda update-function-code --function-name flight-schedule-pro-staging-api --s3-bucket flight-schedule-pro-lambda-code --s3-key staging/lambda-code.zip --region us-east-1
```

### Step 6: Verify Handler

Make sure handler is: `functions.api.auth.handler`

```powershell
aws lambda get-function-configuration --function-name flight-schedule-pro-staging-api --region us-east-1 --query 'Handler' --output text
```

---

## Alternative: Check Current Package in S3

The issue might be that the uploaded package has wrong structure. Let's verify what's actually in S3:

```powershell
# Download and check
aws s3 cp s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip C:\temp\check-package.zip --region us-east-1

# Extract to check (requires 7-Zip or similar)
# Or just repackage fresh
```

---

## Quick One-Liner to Repackage

```powershell
cd D:\gauntlet-ai\flight-schedule-pro\backend; Remove-Item "lambda-package","lambda-package.zip" -Recurse -Force -ErrorAction SilentlyContinue; New-Item -ItemType Directory -Path lambda-package -Force | Out-Null; Copy-Item -Path "dist\*" -Destination "lambda-package\" -Recurse -Force; Copy-Item -Path "node_modules" -Destination "lambda-package\node_modules" -Recurse -Force; Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory("lambda-package", "lambda-package.zip"); Write-Host "Package recreated. Now upload to S3." -ForegroundColor Green
```


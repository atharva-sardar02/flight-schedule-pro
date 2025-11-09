# Verify Package Structure

## The Problem

Error: `Cannot find module '/var/task/functions'`

This means Lambda can't find the handler file. The handler `functions.api.auth.handler` expects:
- File: `functions/api/auth.js` 
- Export: `handler`

## Check Package Structure

The zip file should have this structure:
```
lambda-package.zip
├── functions/
│   ├── api/
│   │   ├── auth.js
│   │   ├── bookings.js
│   │   └── ...
│   └── ...
├── services/
├── utils/
├── middleware/
└── node_modules/
```

## Quick Fix: Verify Handler Path

The handler format is: `folder.file.export`

For `functions.api.auth.handler`:
- Folder: `functions`
- File: `api/auth.js` (no extension, dots separate path)
- Export: `handler`

## Solution: Repackage and Verify

1. **Check if lambda-package directory exists:**
   ```powershell
   Test-Path D:\gauntlet-ai\flight-schedule-pro\backend\lambda-package
   ```

2. **If it doesn't exist, recreate it:**
   ```powershell
   cd D:\gauntlet-ai\flight-schedule-pro\backend
   New-Item -ItemType Directory -Path lambda-package -Force
   Copy-Item -Path "dist\*" -Destination "lambda-package\" -Recurse -Force
   Copy-Item -Path "node_modules" -Destination "lambda-package\node_modules" -Recurse -Force
   ```

3. **Verify structure:**
   ```powershell
   Test-Path "lambda-package\functions\api\auth.js"
   ```

4. **Repackage:**
   ```powershell
   Add-Type -AssemblyName System.IO.Compression.FileSystem
   Remove-Item "lambda-package.zip" -ErrorAction SilentlyContinue
   [System.IO.Compression.ZipFile]::CreateFromDirectory("lambda-package", "lambda-package.zip")
   ```

5. **Re-upload to S3:**
   ```powershell
   aws s3 cp lambda-package.zip s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip --region us-east-1
   ```

6. **Update Lambda code:**
   ```powershell
   aws lambda update-function-code --function-name flight-schedule-pro-staging-api --s3-bucket flight-schedule-pro-lambda-code --s3-key staging/lambda-code.zip --region us-east-1
   ```




# Manual Lambda Packaging Guide

This guide shows you how to package your compiled Lambda code for AWS deployment.

## Prerequisites
- ✅ TypeScript code compiled to `dist/` folder (already done!)
- ✅ Node.js and npm installed

## Step-by-Step Instructions

### Option 1: Using the Automated Script (Recommended)

1. **Open PowerShell** in the `backend` directory:
   ```powershell
   cd D:\gauntlet-ai\flight-schedule-pro\backend
   ```

2. **Run the packaging script**:
   ```powershell
   .\package-lambda.ps1
   ```

   This script will:
   - Install production dependencies only
   - Copy compiled files from `dist/`
   - Copy `node_modules/` (production only)
   - Create `lambda-package.zip`

### Option 2: Manual Steps

#### Step 1: Install Production Dependencies Only

```powershell
cd D:\gauntlet-ai\flight-schedule-pro\backend

# Remove existing node_modules if you want a clean install
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Install only production dependencies (excludes devDependencies)
npm install --production
```

#### Step 2: Create Package Directory

```powershell
# Create a temporary directory for packaging
New-Item -ItemType Directory -Path lambda-package -Force | Out-Null
```

#### Step 3: Copy Compiled Files

```powershell
# Copy all compiled JavaScript files from dist/
Copy-Item -Path "dist\*" -Destination "lambda-package\" -Recurse -Force
```

#### Step 4: Copy Production node_modules

```powershell
# Copy node_modules (contains only production dependencies)
Copy-Item -Path "node_modules" -Destination "lambda-package\node_modules" -Recurse -Force
```

#### Step 5: Create ZIP File

```powershell
# Create zip file using .NET compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory("lambda-package", "lambda-package.zip")

# Check the file size
$zipSize = (Get-Item "lambda-package.zip").Length / 1MB
Write-Host "Created lambda-package.zip ($([math]::Round($zipSize, 2)) MB)"
```

#### Step 6: Clean Up (Optional)

```powershell
# Remove the temporary package directory
Remove-Item -Recurse -Force lambda-package
```

## What Gets Packaged

✅ **Included:**
- All compiled JavaScript files from `dist/`
- Production `node_modules/` (AWS SDK, pg, winston, etc.)
- All necessary dependencies for Lambda runtime

❌ **Excluded:**
- TypeScript source files (`.ts`)
- Development dependencies (TypeScript, Jest, ESLint, etc.)
- Test files
- Source maps (`.map` files) - optional, can be included if needed

## Package Size

Expected size: **15-30 MB** (depending on dependencies)

AWS Lambda limits:
- Deployment package: 50 MB (zipped)
- Unzipped: 250 MB

## Next Steps

1. **Upload to S3:**
   ```powershell
   aws s3 cp lambda-package.zip s3://your-bucket-name/lambda-package.zip
   ```

2. **Note the S3 location** for CloudFormation:
   - S3 Bucket: `your-bucket-name`
   - S3 Key: `lambda-package.zip`

3. **Use in CloudFormation** Lambda function `Code` property:
   ```yaml
   Code:
     S3Bucket: your-bucket-name
     S3Key: lambda-package.zip
   ```

## Troubleshooting

### "npm install --production" fails
- Make sure you're in the `backend` directory
- Check that `package.json` exists

### ZIP file is too large (>50MB)
- Check if dev dependencies were included
- Remove source maps: `Remove-Item -Recurse -Force lambda-package\**\*.map`
- Consider using Lambda Layers for large dependencies

### Missing modules at runtime
- Ensure all production dependencies are in `package.json` `dependencies` (not `devDependencies`)
- Re-run `npm install --production` before packaging




# Upload Lambda Package to S3 - Step by Step

## ✅ What's in Your Package?

Your `lambda-package.zip` contains **EVERYTHING** needed for Lambda:

### ✅ Included:
1. **All compiled JavaScript files** from `dist/` folder
   - All your Lambda handlers (API, weather monitor, notifications)
   - All services (database, weather, AI rescheduling)
   - All utilities and middleware
   - All type definitions

2. **Production node_modules/** 
   - AWS SDK (`@aws-sdk/client-*`)
   - PostgreSQL client (`pg`)
   - OpenAI SDK (`@langchain/openai`)
   - Winston logger
   - Axios for HTTP
   - date-fns for date handling
   - All runtime dependencies

3. **Complete folder structure**
   - Maintains the same structure as your source code
   - Lambda can find all imports correctly

### ❌ Excluded (not needed):
- TypeScript source files (`.ts`)
- Development dependencies (TypeScript compiler, Jest, ESLint)
- Test files
- Source maps (`.map` files) - optional

**Result:** ~6.5 MB package with everything Lambda needs to run!

---

## Step-by-Step Upload Instructions

### Step 1: Verify Your Package Exists

```powershell
cd D:\gauntlet-ai\flight-schedule-pro\backend
Get-Item lambda-package.zip
```

**Expected output:**
```
    Directory: D:\gauntlet-ai\flight-schedule-pro\backend

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         11/8/2025   2:06 PM      6531823 lambda-package.zip
```

### Step 2: Verify AWS Credentials

```powershell
aws sts get-caller-identity
```

**Expected output:**
```
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

If this fails, configure AWS CLI:
```powershell
aws configure
```

### Step 3: Create S3 Bucket (if it doesn't exist)

```powershell
aws s3 mb s3://flight-schedule-pro-lambda-code --region us-east-1
```

**If bucket already exists, you'll see:**
```
make_bucket failed: s3://flight-schedule-pro-lambda-code An error occurred (BucketAlreadyExists) when calling the CreateBucket operation: The requested bucket name is not available.
```

**That's OK!** Just verify it exists:
```powershell
aws s3 ls s3://flight-schedule-pro-lambda-code
```

### Step 4: Upload the Package

```powershell
aws s3 cp lambda-package.zip s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip --region us-east-1
```

**Expected output:**
```
upload: backend/lambda-package.zip to s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip
```

**Progress indicator:**
- For 6.5 MB, upload should take 5-15 seconds
- You'll see progress if it takes longer

### Step 5: Verify Upload Success

```powershell
aws s3 ls s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip
```

**Expected output:**
```
2025-11-08 14:06:00    6531823 staging/lambda-code.zip
```

**Or get detailed info:**
```powershell
aws s3api head-object --bucket flight-schedule-pro-lambda-code --key staging/lambda-code.zip --region us-east-1
```

**Expected output:**
```json
{
    "AcceptRanges": "bytes",
    "LastModified": "2025-11-08T14:06:00.000Z",
    "ContentLength": 6531823,
    "ETag": "\"abc123...\"",
    "ContentType": "application/zip",
    "Metadata": {}
}
```

### Step 6: Verify Package Contents (Optional)

You can download and check what's inside:

```powershell
# Download to temp location
aws s3 cp s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip C:\temp\check-package.zip

# Extract and check (requires 7-Zip or similar)
# Or just trust that it contains everything from lambda-package/ directory
```

---

## Complete Upload Command (One-Liner)

If you want to do it all at once:

```powershell
cd D:\gauntlet-ai\flight-schedule-pro\backend; aws s3 cp lambda-package.zip s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip --region us-east-1; aws s3 ls s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip
```

---

## What Happens After Upload?

Once uploaded, you can:

1. **Deploy via CloudFormation** - The Lambda stack will use this S3 location
2. **Update Lambda directly** - Use AWS CLI to update function code
3. **Version control** - S3 keeps versions if versioning is enabled

---

## Troubleshooting

### Error: "Access Denied"
```powershell
# Check your AWS credentials
aws sts get-caller-identity

# Check bucket permissions
aws s3api get-bucket-policy --bucket flight-schedule-pro-lambda-code --region us-east-1
```

### Error: "Bucket does not exist"
```powershell
# Create the bucket
aws s3 mb s3://flight-schedule-pro-lambda-code --region us-east-1

# Or check if it exists with different name
aws s3 ls | Select-String "lambda"
```

### Upload is Slow
- 6.5 MB should upload in 5-15 seconds on normal internet
- If slow, check your connection
- S3 uploads are resumable if interrupted

### Want to See What's Inside the Zip?

If you want to verify the package contents before uploading:

```powershell
# Extract to temp location
Expand-Archive -Path lambda-package.zip -DestinationPath C:\temp\lambda-check -Force

# Check contents
Get-ChildItem C:\temp\lambda-check -Recurse | Select-Object FullName, Length | Format-Table

# Check node_modules exists
Test-Path C:\temp\lambda-check\node_modules

# Clean up
Remove-Item C:\temp\lambda-check -Recurse -Force
```

---

## Summary

**Your `lambda-package.zip` contains:**
- ✅ All compiled JavaScript code
- ✅ All production node_modules
- ✅ Complete folder structure
- ✅ Everything Lambda needs to run

**To upload:**
```powershell
aws s3 cp lambda-package.zip s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip --region us-east-1
```

**That's it!** The package is ready for deployment.


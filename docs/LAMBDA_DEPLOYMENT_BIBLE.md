# Lambda Deployment Bible
## Complete Guide: Package → Upload → Deploy

This is your complete reference guide for packaging and deploying Lambda functions to AWS.

---

## PART 1: PACKAGING LAMBDA CODE

### Prerequisites
- ✅ TypeScript code compiled to `dist/` folder
- ✅ Node.js and npm installed
- ✅ AWS CLI configured with credentials

### Step-by-Step Packaging

#### 1. Navigate to Backend Directory
```powershell
cd D:\gauntlet-ai\flight-schedule-pro\backend
```

#### 2. Install Production Dependencies Only
```powershell
npm install --production
```
**What this does:** Installs only runtime dependencies (excludes TypeScript, Jest, ESLint, etc.)

#### 3. Clean Up Old Package Files (if any)
```powershell
Remove-Item "lambda-package.zip" -ErrorAction SilentlyContinue
Remove-Item "lambda-package" -Recurse -Force -ErrorAction SilentlyContinue
```

#### 4. Create Package Directory
```powershell
New-Item -ItemType Directory -Path lambda-package -Force
```

#### 5. Copy Compiled JavaScript Files
```powershell
Copy-Item -Path "dist\*" -Destination "lambda-package\" -Recurse -Force
```
**What this copies:** All compiled `.js` files from `dist/` folder

#### 6. Copy Production node_modules
```powershell
Copy-Item -Path "node_modules" -Destination "lambda-package\node_modules" -Recurse -Force
```
**What this copies:** Only production dependencies (AWS SDK, pg, winston, OpenAI, etc.)

#### 7. Create ZIP File
```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$packagePath = Join-Path $PWD "lambda-package"
$zipPath = Join-Path $PWD "lambda-package.zip"
[System.IO.Compression.ZipFile]::CreateFromDirectory($packagePath, $zipPath)
```

#### 8. Verify Package
```powershell
Get-Item lambda-package.zip | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB, 2)}}
```
**Expected output:** ~6.5 MB

#### 9. Clean Up Temporary Directory (Optional)
```powershell
Remove-Item -Recurse -Force lambda-package
```

---

## PART 2: UPLOAD TO S3

### Step 1: Verify AWS Credentials
```powershell
aws sts get-caller-identity
```
**Expected:** Returns your AWS account ID and user ARN

### Step 2: Create S3 Bucket for Lambda Code (if it doesn't exist)
```powershell
aws s3 mb s3://flight-schedule-pro-lambda-code --region us-east-1
```

**Or if bucket already exists, verify:**
```powershell
aws s3 ls s3://flight-schedule-pro-lambda-code
```

### Step 3: Upload Lambda Package
```powershell
aws s3 cp lambda-package.zip s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip --region us-east-1
```

**Expected output:**
```
upload: backend/lambda-package.zip to s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip
```

### Step 4: Verify Upload
```powershell
aws s3 ls s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip
```

**Expected output:**
```
2025-11-08 14:06:00    6531823 lambda-package.zip
```

### Step 5: Get S3 Object Version (for versioning)
```powershell
aws s3api head-object --bucket flight-schedule-pro-lambda-code --key staging/lambda-code.zip --region us-east-1
```

**Note the S3 location:**
- **Bucket:** `flight-schedule-pro-lambda-code`
- **Key:** `staging/lambda-code.zip`
- **Region:** `us-east-1`
- **Full S3 URI:** `s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip`

---

## PART 3: DEPLOY LAMBDA FUNCTIONS

### Option A: Deploy via CloudFormation (Recommended)

#### 1. Update CloudFormation Template with S3 Location

Edit `infrastructure/cloudformation/lambda.yaml` and ensure the Code section references S3:

```yaml
Resources:
  ApiHandlerFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: flight-schedule-pro-staging-api
      Runtime: nodejs20.x
      Handler: functions.api.handler
      Code:
        S3Bucket: flight-schedule-pro-lambda-code
        S3Key: staging/lambda-code.zip
      Environment:
        Variables:
          NODE_ENV: staging
          DATABASE_HOST: !GetAtt DatabaseInstance.Endpoint.Address
          DATABASE_NAME: flight_schedule_pro
          # ... other environment variables
```

#### 2. Deploy Lambda Stack
```powershell
cd D:\gauntlet-ai\flight-schedule-pro\infrastructure\cloudformation

aws cloudformation deploy `
  --template-file lambda.yaml `
  --stack-name flight-schedule-pro-staging-lambda `
  --capabilities CAPABILITY_IAM `
  --region us-east-1 `
  --parameter-overrides `
    DatabaseHost=flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com `
    DatabaseName=flight_schedule_pro `
    DatabaseUser=postgres `
    CognitoUserPoolId=YOUR_COGNITO_POOL_ID `
    CognitoClientId=YOUR_COGNITO_CLIENT_ID `
    OpenAIApiKeySecretArn=YOUR_SECRET_ARN `
    OpenWeatherMapApiKeySecretArn=YOUR_SECRET_ARN `
    WeatherApiKeySecretArn=YOUR_SECRET_ARN `
    SesRegion=us-east-1
```

### Option B: Deploy Individual Lambda Functions via AWS CLI

#### 1. Update API Handler Function
```powershell
aws lambda update-function-code `
  --function-name flight-schedule-pro-staging-api `
  --s3-bucket flight-schedule-pro-lambda-code `
  --s3-key staging/lambda-code.zip `
  --region us-east-1
```

#### 2. Update Weather Monitor Function
```powershell
aws lambda update-function-code `
  --function-name flight-schedule-pro-staging-weather-monitor `
  --s3-bucket flight-schedule-pro-lambda-code `
  --s3-key staging/lambda-code.zip `
  --region us-east-1
```

#### 3. Update Notification Handler Function
```powershell
aws lambda update-function-code `
  --function-name flight-schedule-pro-staging-notifications `
  --s3-bucket flight-schedule-pro-lambda-code `
  --s3-key staging/lambda-code.zip `
  --region us-east-1
```

#### 4. Verify Deployment
```powershell
aws lambda get-function --function-name flight-schedule-pro-staging-api --region us-east-1
```

**Check the response for:**
- `LastUpdateStatus: Successful`
- `CodeSize:` (should match your package size)
- `LastModified:` (should be recent)

---

## PART 4: UPDATE ENVIRONMENT VARIABLES

### Get Required Values

#### 1. Get RDS Endpoint
```powershell
aws rds describe-db-instances `
  --db-instance-identifier flight-schedule-pro-staging-db `
  --region us-east-1 `
  --query 'DBInstances[0].Endpoint.Address' `
  --output text
```

**Expected:** `flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com`

#### 2. Get Cognito User Pool ID
```powershell
aws cognito-idp list-user-pools --max-results 10 --region us-east-1
```

**Look for:** Pool with name containing `flight-schedule-pro-staging`

#### 3. Get Cognito Client ID
```powershell
aws cognito-idp list-user-pool-clients `
  --user-pool-id YOUR_POOL_ID `
  --region us-east-1
```

#### 4. Get Secrets Manager ARNs
```powershell
aws secretsmanager list-secrets `
  --region us-east-1 `
  --filters Key=name,Values=flight-schedule-pro-staging
```

### Update Lambda Environment Variables

```powershell
aws lambda update-function-configuration `
  --function-name flight-schedule-pro-staging-api `
  --environment Variables="{
    NODE_ENV=staging,
    DATABASE_HOST=flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com,
    DATABASE_NAME=flight_schedule_pro,
    DATABASE_USER=postgres,
    DATABASE_PASSWORD_SECRET_ARN=arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:flight-schedule-pro-staging-db-password,
    COGNITO_USER_POOL_ID=YOUR_POOL_ID,
    COGNITO_CLIENT_ID=YOUR_CLIENT_ID,
    OPENAI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:flight-schedule-pro-staging-openai-key,
    OPENWEATHERMAP_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:flight-schedule-pro-staging-openweather-key,
    WEATHERAPI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:flight-schedule-pro-staging-weatherapi-key,
    SES_REGION=us-east-1,
    LOG_LEVEL=info
  }" `
  --region us-east-1
```

---

## PART 5: VERIFY DEPLOYMENT

### 1. Test Lambda Function Invocation
```powershell
aws lambda invoke `
  --function-name flight-schedule-pro-staging-api `
  --payload '{"httpMethod":"GET","path":"/health"}' `
  --region us-east-1 `
  response.json

Get-Content response.json
```

### 2. Check Lambda Logs
```powershell
aws logs tail /aws/lambda/flight-schedule-pro-staging-api --follow --region us-east-1
```

### 3. Test API Endpoint (if API Gateway is configured)
```powershell
# Get API Gateway URL
aws apigatewayv2 get-apis --region us-east-1

# Test endpoint
Invoke-WebRequest -Uri "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/staging/health" -Method GET
```

---

## QUICK REFERENCE: ALL COMMANDS IN ONE PLACE

### Complete Packaging & Deployment Script

```powershell
# ============================================
# LAMBDA PACKAGING & DEPLOYMENT
# ============================================

# 1. PACKAGE
cd D:\gauntlet-ai\flight-schedule-pro\backend
npm install --production
Remove-Item "lambda-package.zip","lambda-package" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path lambda-package -Force | Out-Null
Copy-Item -Path "dist\*" -Destination "lambda-package\" -Recurse -Force
Copy-Item -Path "node_modules" -Destination "lambda-package\node_modules" -Recurse -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory("$PWD\lambda-package", "$PWD\lambda-package.zip")
Write-Host "Package created: $((Get-Item lambda-package.zip).Length / 1MB) MB" -ForegroundColor Green

# 2. UPLOAD TO S3
aws s3 cp lambda-package.zip s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip --region us-east-1
aws s3 ls s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip

# 3. UPDATE LAMBDA FUNCTIONS
aws lambda update-function-code --function-name flight-schedule-pro-staging-api --s3-bucket flight-schedule-pro-lambda-code --s3-key staging/lambda-code.zip --region us-east-1
aws lambda update-function-code --function-name flight-schedule-pro-staging-weather-monitor --s3-bucket flight-schedule-pro-lambda-code --s3-key staging/lambda-code.zip --region us-east-1
aws lambda update-function-code --function-name flight-schedule-pro-staging-notifications --s3-bucket flight-schedule-pro-lambda-code --s3-key staging/lambda-code.zip --region us-east-1

# 4. VERIFY
aws lambda get-function --function-name flight-schedule-pro-staging-api --region us-east-1 --query 'Configuration.[FunctionName,LastUpdateStatus,CodeSize]' --output table
```

---

## TROUBLESHOOTING

### Package Size Too Large (>50MB)
```powershell
# Check what's taking space
Get-ChildItem lambda-package -Recurse | Measure-Object -Property Length -Sum

# Remove source maps if included
Remove-Item -Path "lambda-package\**\*.map" -Recurse -Force
```

### Upload Fails
```powershell
# Check AWS credentials
aws sts get-caller-identity

# Check bucket exists
aws s3 ls s3://flight-schedule-pro-lambda-code

# Check permissions
aws s3api get-bucket-policy --bucket flight-schedule-pro-lambda-code --region us-east-1
```

### Lambda Update Fails
```powershell
# Check function exists
aws lambda get-function --function-name flight-schedule-pro-staging-api --region us-east-1

# Check IAM permissions
aws iam get-user
```

### Lambda Runtime Errors
```powershell
# Check logs
aws logs tail /aws/lambda/flight-schedule-pro-staging-api --since 10m --region us-east-1

# Check environment variables
aws lambda get-function-configuration --function-name flight-schedule-pro-staging-api --region us-east-1 --query 'Environment'
```

---

## FILE LOCATIONS

- **Package:** `D:\gauntlet-ai\flight-schedule-pro\backend\lambda-package.zip`
- **S3 Location:** `s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip`
- **CloudFormation Templates:** `D:\gauntlet-ai\flight-schedule-pro\infrastructure\cloudformation\`
- **Deployment Scripts:** `D:\gauntlet-ai\flight-schedule-pro\infrastructure\scripts\`

---

## NOTES

- **Package Size:** ~6.5 MB (well under 50 MB limit)
- **Region:** `us-east-1`
- **Runtime:** Node.js 20.x
- **Handler:** `functions.api.handler` (for API functions)
- **Update Frequency:** Re-package and upload whenever backend code changes

---

**Last Updated:** 2025-11-08  
**Package Version:** 1.0.0  
**Status:** ✅ Ready for Production Deployment


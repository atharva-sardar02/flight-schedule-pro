# Next Steps After S3 Upload

✅ **Lambda package uploaded to S3:**
- **Location:** `s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip`
- **Size:** ~6.5 MB
- **Status:** Ready for deployment

---

## Option 1: Deploy via CloudFormation (Recommended)

If you have a Lambda CloudFormation stack, it will automatically use this S3 location.

### Check if Lambda Stack Exists

```powershell
aws cloudformation describe-stacks --stack-name flight-schedule-pro-staging-lambda --region us-east-1
```

### Deploy/Update Lambda Stack

```powershell
cd D:\gauntlet-ai\flight-schedule-pro\infrastructure\cloudformation

aws cloudformation deploy `
  --template-file lambda.yaml `
  --stack-name flight-schedule-pro-staging-lambda `
  --capabilities CAPABILITY_IAM `
  --region us-east-1 `
  --parameter-overrides `
    Environment=staging `
    ProjectName=flight-schedule-pro `
    LambdaCodeBucket=flight-schedule-pro-lambda-code `
    LambdaCodeKey=staging/lambda-code.zip
```

---

## Option 2: Update Lambda Functions Directly

If Lambda functions already exist, update them with the new code:

### 1. Update API Handler Function

```powershell
aws lambda update-function-code `
  --function-name flight-schedule-pro-staging-api `
  --s3-bucket flight-schedule-pro-lambda-code `
  --s3-key staging/lambda-code.zip `
  --region us-east-1
```

### 2. Update Weather Monitor Function

```powershell
aws lambda update-function-code `
  --function-name flight-schedule-pro-staging-weather-monitor `
  --s3-bucket flight-schedule-pro-lambda-code `
  --s3-key staging/lambda-code.zip `
  --region us-east-1
```

### 3. Update Notification Handler Function

```powershell
aws lambda update-function-code `
  --function-name flight-schedule-pro-staging-notifications `
  --s3-bucket flight-schedule-pro-lambda-code `
  --s3-key staging/lambda-code.zip `
  --region us-east-1
```

---

## Verify Deployment

### Check Function Status

```powershell
aws lambda get-function --function-name flight-schedule-pro-staging-api --region us-east-1 --query 'Configuration.[FunctionName,LastUpdateStatus,CodeSize,LastModified]' --output table
```

**Expected output:**
- `LastUpdateStatus: Successful`
- `CodeSize:` should match your package size
- `LastModified:` should be recent

### Test Lambda Function

```powershell
aws lambda invoke `
  --function-name flight-schedule-pro-staging-api `
  --payload '{"httpMethod":"GET","path":"/health"}' `
  --region us-east-1 `
  response.json

Get-Content response.json
```

---

## Check Lambda Logs

```powershell
aws logs tail /aws/lambda/flight-schedule-pro-staging-api --follow --region us-east-1
```

---

## What's Deployed

Your Lambda package includes:
- ✅ All API endpoints (auth, bookings, availability, reschedule)
- ✅ AI rescheduling engine (OpenAI/ChatGPT)
- ✅ Weather monitoring service
- ✅ Notification handlers
- ✅ All database services
- ✅ All production dependencies

---

## Troubleshooting

### Function Not Found
- Lambda functions may not exist yet
- Deploy via CloudFormation first (Option 1)

### Update Fails
- Check S3 file exists: `aws s3 ls s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip`
- Check function name is correct
- Check IAM permissions

### Runtime Errors
- Check CloudWatch logs
- Verify environment variables are set
- Check database connection settings

---

## Summary

**Completed:**
- ✅ TypeScript code compiled
- ✅ Lambda package created (6.5 MB)
- ✅ Package uploaded to S3

**Next:**
- ⏳ Deploy/update Lambda functions
- ⏳ Verify deployment
- ⏳ Test endpoints

---

**Ready to deploy!** Choose Option 1 (CloudFormation) or Option 2 (Direct update) above.




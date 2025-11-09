# Deploy Lambda Functions via AWS Console

## Step-by-Step Guide

### Step 1: Open AWS Lambda Console

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Sign in with your AWS account
3. In the search bar at the top, type **"Lambda"**
4. Click on **"Lambda"** service

---

## Option A: Update Existing Lambda Functions

### Step 2: Find Your Lambda Function

1. In the Lambda dashboard, you'll see a list of functions
2. Look for functions with names like:
   - `flight-schedule-pro-staging-api`
   - `flight-schedule-pro-staging-weather-monitor`
   - `flight-schedule-pro-staging-notifications`

**If you don't see them:**
- Use the search bar to filter
- Check you're in the correct region (`us-east-1` - shown in top right)

### Step 3: Update Function Code

1. **Click on the function name** (e.g., `flight-schedule-pro-staging-api`)
2. Scroll down to the **"Code"** section
3. Click the **"Upload from"** dropdown button
4. Select **"Amazon S3 location"**

### Step 4: Enter S3 Location

1. In the **"Amazon S3 link URL"** field, enter:
   ```
   s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip
   ```

   **OR** click **"Browse S3"** and navigate to:
   - Bucket: `flight-schedule-pro-lambda-code`
   - Folder: `staging`
   - File: `lambda-code.zip`

2. Click **"Save"** button

### Step 5: Wait for Update

- You'll see a progress indicator
- Status will change to "In progress" then "Successful"
- Takes about 10-30 seconds

### Step 6: Repeat for Other Functions

Repeat Steps 3-5 for:
- `flight-schedule-pro-staging-weather-monitor`
- `flight-schedule-pro-staging-notifications`

---

## Option B: Create New Lambda Function

### Step 2: Create Function

1. Click **"Create function"** button
2. Choose **"Author from scratch"**
3. Fill in:
   - **Function name:** `flight-schedule-pro-staging-api`
   - **Runtime:** `Node.js 20.x`
   - **Architecture:** `x86_64`
4. Click **"Create function"**

### Step 3: Upload Code

1. Scroll to **"Code source"** section
2. Click **"Upload from"** → **"Amazon S3 location"**
3. Enter S3 URL:
   ```
   s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip
   ```
4. Click **"Save"**

### Step 4: Configure Handler

1. Scroll to **"Runtime settings"**
2. Click **"Edit"**
3. Set **Handler:**
   - For API: `functions.api.handler`
   - For Weather Monitor: `functions.scheduler.weatherMonitor.handler`
   - For Notifications: `functions.notifications.handler`
4. Click **"Save"**

### Step 5: Configure Environment Variables

1. Scroll to **"Configuration"** tab
2. Click **"Environment variables"** → **"Edit"**
3. Add these variables:

```
NODE_ENV = staging
DATABASE_HOST = flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com
DATABASE_NAME = flight_schedule_pro
DATABASE_USER = postgres
DATABASE_PASSWORD_SECRET_ARN = arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:flight-schedule-pro-staging-db-password
COGNITO_USER_POOL_ID = YOUR_POOL_ID
COGNITO_CLIENT_ID = YOUR_CLIENT_ID
OPENAI_API_KEY_SECRET_ARN = arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:flight-schedule-pro-staging-openai-key
OPENWEATHERMAP_API_KEY_SECRET_ARN = arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:flight-schedule-pro-staging-openweather-key
WEATHERAPI_API_KEY_SECRET_ARN = arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:flight-schedule-pro-staging-weatherapi-key
SES_REGION = us-east-1
LOG_LEVEL = info
```

4. Click **"Save"**

### Step 6: Configure IAM Role

1. Scroll to **"Configuration"** tab
2. Click **"Permissions"**
3. Click on the **Execution role** name
4. This opens IAM - attach policies:
   - `AWSLambdaVPCAccessExecutionRole` (if using VPC)
   - `SecretsManagerReadWrite` (for API keys)
   - Custom policy for RDS access

---

## Verify Deployment

### Check Function Status

1. Go back to Lambda function page
2. Look at **"Code"** section
3. Check:
   - **Last modified:** Should be today's date/time
   - **Code size:** Should be ~6.5 MB
   - **Status:** Should show "Successful"

### Test Function

1. Click **"Test"** tab
2. Click **"Create new test event"**
3. Use this test event:
   ```json
   {
     "httpMethod": "GET",
     "path": "/health"
   }
   ```
4. Click **"Test"**
5. Check the response - should return success

### Check Logs

1. Click **"Monitor"** tab
2. Click **"View CloudWatch logs"**
3. Check for any errors

---

## Quick Checklist

### For Each Lambda Function:

- [ ] Function exists or created
- [ ] Code uploaded from S3: `s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip`
- [ ] Handler configured correctly
- [ ] Environment variables set
- [ ] IAM role has correct permissions
- [ ] Function tested successfully
- [ ] Logs checked for errors

---

## Functions to Deploy

1. **API Handler**
   - Name: `flight-schedule-pro-staging-api`
   - Handler: `functions.api.handler`
   - Timeout: 30 seconds
   - Memory: 512 MB

2. **Weather Monitor**
   - Name: `flight-schedule-pro-staging-weather-monitor`
   - Handler: `functions.scheduler.weatherMonitor.handler`
   - Timeout: 5 minutes
   - Memory: 256 MB

3. **Notifications**
   - Name: `flight-schedule-pro-staging-notifications`
   - Handler: `functions.notifications.handler`
   - Timeout: 30 seconds
   - Memory: 256 MB

---

## Troubleshooting

### S3 URL Not Found
- Verify file exists: Go to S3 console and check `flight-schedule-pro-lambda-code/staging/lambda-code.zip`
- Check bucket name spelling
- Check region matches

### Handler Not Found
- Verify handler path: `functions.api.handler`
- Check the zip file structure matches
- Handler should match the exported function name

### Environment Variables Missing
- Go to Configuration → Environment variables
- Add all required variables
- Use Secrets Manager ARNs for sensitive values

### Permission Errors
- Check IAM role has:
  - S3 read permissions (for code)
  - Secrets Manager read (for API keys)
  - RDS access (if using VPC)
  - CloudWatch logs write

### Function Times Out
- Increase timeout in Configuration → General configuration
- Check database connection
- Check external API calls (weather, OpenAI)

---

## Visual Guide

```
AWS Console
  └─ Lambda Service
      └─ Functions
          ├─ flight-schedule-pro-staging-api
          │   └─ Code → Upload from S3
          │       └─ s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip
          │
          ├─ flight-schedule-pro-staging-weather-monitor
          │   └─ Code → Upload from S3
          │       └─ s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip
          │
          └─ flight-schedule-pro-staging-notifications
              └─ Code → Upload from S3
                  └─ s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip
```

---

## Summary

**S3 Package Location:**
```
s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip
```

**Steps:**
1. Open Lambda Console
2. Select function (or create new)
3. Upload code from S3
4. Configure handler
5. Set environment variables
6. Test function

**That's it!** Your Lambda functions are now deployed with the latest code. 🚀




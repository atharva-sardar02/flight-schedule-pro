# Complete Lambda Setup: Environment Variables & Triggers

## Part 1: Environment Variables

You need to add environment variables to **all 3 Lambda functions**.

### Step 1: Get Required Values

Before setting environment variables, you need to gather these values:

#### A. Database Connection
```powershell
# Get RDS endpoint
aws rds describe-db-instances --db-instance-identifier flight-schedule-pro-staging-db --region us-east-1 --query 'DBInstances[0].Endpoint.Address' --output text
```
**Expected:** `flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com`

#### B. Cognito User Pool ID
```powershell
# List user pools
aws cognito-idp list-user-pools --max-results 10 --region us-east-1 --query 'UserPools[?contains(Name, `flight-schedule-pro`)].{Name:Name,Id:Id}' --output table
```

#### C. Cognito Client ID
```powershell
# Replace YOUR_POOL_ID with the ID from above
aws cognito-idp list-user-pool-clients --user-pool-id YOUR_POOL_ID --region us-east-1 --query 'UserPoolClients[0].ClientId' --output text
```

#### D. Secrets Manager ARNs
```powershell
# List all secrets
aws secretsmanager list-secrets --region us-east-1 --query 'SecretList[?contains(Name, `flight-schedule-pro-staging`)].{Name:Name,ARN:ARN}' --output table
```

---

### Step 2: Add Environment Variables to Each Function

**For ALL 3 functions, go to:

1. **Lambda Console** → Select function
2. **Configuration** tab → **Environment variables** → **Edit**
3. Click **"Add environment variable"** for each one

#### Required Environment Variables:

```
NODE_ENV = staging

DATABASE_HOST = flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com
DATABASE_NAME = flight_schedule_pro
DATABASE_USER = postgres
DATABASE_PASSWORD_SECRET_ARN = arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:flight-schedule-pro-staging-db-password-XXXXX

COGNITO_USER_POOL_ID = us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID = xxxxxxxxxxxxxxxxxxxxxxxxxxxx

OPENAI_API_KEY_SECRET_ARN = arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:flight-schedule-pro-staging-openai-key-XXXXX
OPENWEATHERMAP_API_KEY_SECRET_ARN = arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:flight-schedule-pro-staging-openweather-key-XXXXX
WEATHERAPI_API_KEY_SECRET_ARN = arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:flight-schedule-pro-staging-weatherapi-key-XXXXX

SES_REGION = us-east-1
LOG_LEVEL = info
```

**Replace:**
- `ACCOUNT_ID` with your AWS account ID
- `XXXXX` with the actual secret suffix
- `XXXXXXXXX` with actual Cognito IDs

4. Click **"Save"**

**Repeat for all 3 functions!**

---

## Part 2: Configure Triggers

Each function needs different triggers:

---

### Function 1: API Handler (`flight-schedule-pro-staging-api`)

**Trigger: API Gateway**

#### Option A: If API Gateway Already Exists

1. Go to **Lambda function** → **Configuration** tab → **Triggers**
2. Click **"Add trigger"**
3. Select **"API Gateway"**
4. Choose:
   - **API:** Select your existing API Gateway
   - **Deployment stage:** `staging` or `prod`
   - **Security:** `Open` (or configure CORS later)
5. Click **"Add"**

#### Option B: Create API Gateway from Lambda

1. Go to **Lambda function** → **Configuration** tab → **Triggers**
2. Click **"Add trigger"**
3. Select **"API Gateway"**
4. Choose **"Create an API"**
5. Select:
   - **API type:** REST API
   - **Security:** Open (for now, can secure later)
6. Click **"Add"**
7. Note the API endpoint URL (you'll need this for frontend)

---

### Function 2: Weather Monitor (`flight-schedule-pro-staging-weather-monitor`)

**Trigger: EventBridge (Schedule)**

1. Go to **Lambda function** → **Configuration** tab → **Triggers**
2. Click **"Add trigger"**
3. Select **"EventBridge (CloudWatch Events)"**
4. Configure:
   - **Rule:** Create new rule
   - **Rule name:** `flight-schedule-pro-staging-weather-monitor-schedule`
   - **Rule type:** Schedule expression
   - **Schedule expression:** `rate(10 minutes)`
     - This runs every 10 minutes
5. Click **"Add"**

**Alternative schedule expressions:**
- `rate(10 minutes)` - Every 10 minutes
- `cron(*/10 * * * ? *)` - Every 10 minutes (cron format)
- `rate(5 minutes)` - Every 5 minutes (for testing)

---

### Function 3: Notifications (`flight-schedule-pro-staging-notifications`)

**Trigger: SNS Topic**

#### Option A: If SNS Topic Exists

1. Go to **Lambda function** → **Configuration** tab → **Triggers**
2. Click **"Add trigger"**
3. Select **"SNS"**
4. Choose your SNS topic (e.g., `flight-schedule-pro-staging-notifications`)
5. Click **"Add"**

#### Option B: Create SNS Topic First

1. Go to **SNS Console** → **Topics** → **Create topic**
2. Name: `flight-schedule-pro-staging-notifications`
3. Click **"Create topic"**
4. Go back to Lambda → Add trigger → Select the SNS topic

---

## Part 3: Configure IAM Permissions

Each function needs IAM permissions. Check the execution role:

### For All Functions:

1. Go to **Configuration** tab → **Permissions**
2. Click on the **Execution role** name (opens IAM)
3. Attach these policies:
   - `AWSLambdaVPCAccessExecutionRole` (if Lambda needs VPC access for RDS)
   - `SecretsManagerReadWrite` (to read API keys from Secrets Manager)
   - `AmazonSESFullAccess` (for sending emails)
   - `AmazonSNSFullAccess` (for notifications)

### Custom Policy for RDS Access (if needed):

If Lambda is in a VPC, create a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds-db:connect"
      ],
      "Resource": "arn:aws:rds-db:us-east-1:ACCOUNT_ID:dbuser:DB_INSTANCE_ID/postgres"
    }
  ]
}
```

---

## Part 4: Configure Function Settings

### For API Handler:
- **Timeout:** 30 seconds
- **Memory:** 512 MB
- **Reserved concurrency:** 10 (optional)

### For Weather Monitor:
- **Timeout:** 5 minutes (300 seconds)
- **Memory:** 256 MB
- **Reserved concurrency:** 1 (only one instance needed)

### For Notifications:
- **Timeout:** 30 seconds
- **Memory:** 256 MB

**To change:**
1. **Configuration** tab → **General configuration** → **Edit**
2. Adjust settings
3. Click **"Save"**

---

## Quick Checklist

### Environment Variables (All 3 Functions):
- [ ] NODE_ENV
- [ ] DATABASE_HOST
- [ ] DATABASE_NAME
- [ ] DATABASE_USER
- [ ] DATABASE_PASSWORD_SECRET_ARN
- [ ] COGNITO_USER_POOL_ID
- [ ] COGNITO_CLIENT_ID
- [ ] OPENAI_API_KEY_SECRET_ARN
- [ ] OPENWEATHERMAP_API_KEY_SECRET_ARN
- [ ] WEATHERAPI_API_KEY_SECRET_ARN
- [ ] SES_REGION
- [ ] LOG_LEVEL

### Triggers:
- [ ] API Handler → API Gateway trigger
- [ ] Weather Monitor → EventBridge schedule (every 10 minutes)
- [ ] Notifications → SNS topic

### IAM Permissions:
- [ ] All functions have Secrets Manager access
- [ ] All functions have SES access (for emails)
- [ ] API Handler has API Gateway permissions
- [ ] Weather Monitor has EventBridge permissions
- [ ] Notifications has SNS permissions

---

## Testing After Setup

### Test API Handler:
```powershell
aws lambda invoke --function-name flight-schedule-pro-staging-api --payload '{"httpMethod":"GET","path":"/health"}' --region us-east-1 response.json
Get-Content response.json
```

### Test Weather Monitor:
- Wait for scheduled trigger (or trigger manually)
- Check CloudWatch logs

### Test Notifications:
- Send test SNS message
- Check CloudWatch logs

---

## Troubleshooting

### Environment Variables Not Working
- Check variable names match exactly (case-sensitive)
- Verify Secrets Manager ARNs are correct
- Check IAM role has Secrets Manager permissions

### Trigger Not Firing
- Check trigger is enabled
- Verify schedule expression is correct
- Check CloudWatch logs for errors

### Can't Connect to Database
- Verify Lambda is in correct VPC (if RDS is private)
- Check security group allows Lambda → RDS
- Verify DATABASE_HOST is correct

---

**Once all 3 functions are configured, your backend is fully deployed!** 🚀



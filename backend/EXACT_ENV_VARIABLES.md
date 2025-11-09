# Exact Environment Variables for Lambda Functions

## ✅ Values Retrieved from AWS

### Database
- **RDS Endpoint:** `flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com`
- **Database Name:** `flight_schedule_pro`
- **Database User:** `postgres`
- **Database Password Secret ARN:** `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/database-credentials-gYqeBF`

### Secrets Manager ARNs
- **OpenAI API Key:** `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openai-api-key-2Si5nA`
- **OpenWeatherMap API Key:** `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openweathermap-api-key-0pDF8m`
- **WeatherAPI.com Key:** `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/weatherapi-com-key-a5RNBd`

### AWS Account ID
- **Account ID:** `971422717446`

---

## 📋 Exact Environment Variables to Add

**Copy and paste these EXACTLY into each Lambda function's environment variables:**

### For ALL 3 Functions:

```
NODE_ENV = staging

DATABASE_HOST = flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com
DATABASE_NAME = flight_schedule_pro
DATABASE_USER = postgres
DATABASE_PASSWORD_SECRET_ARN = arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/database-credentials-gYqeBF

COGNITO_USER_POOL_ID = [TO BE FILLED - see below]
COGNITO_CLIENT_ID = [TO BE FILLED - see below]

OPENAI_API_KEY_SECRET_ARN = arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openai-api-key-2Si5nA
OPENWEATHERMAP_API_KEY_SECRET_ARN = arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openweathermap-api-key-0pDF8m
WEATHERAPI_API_KEY_SECRET_ARN = arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/weatherapi-com-key-a5RNBd

SES_REGION = us-east-1
LOG_LEVEL = info
```

---

## ⚠️ Missing Values - Need to Get Cognito Info

**Run these commands to get Cognito values:**

```powershell
# Get all Cognito User Pools
aws cognito-idp list-user-pools --max-results 20 --region us-east-1 --query 'UserPools[].{Name:Name,Id:Id}' --output table

# Once you have the Pool ID, get the Client ID (replace YOUR_POOL_ID)
aws cognito-idp list-user-pool-clients --user-pool-id YOUR_POOL_ID --region us-east-1 --query 'UserPoolClients[0].{ClientId:ClientId,ClientName:ClientName}' --output table
```

**Or check in AWS Console:**
1. Go to **Cognito** service
2. Click **User pools**
3. Find pool with name containing `flight-schedule-pro` or `staging`
4. Copy the **User pool ID** (format: `us-east-1_XXXXXXXXX`)
5. Click **App integration** tab
6. Under **App clients**, copy the **Client ID**

---

## 📝 Step-by-Step: Adding to Lambda Console

### For Each Function (API, Weather Monitor, Notifications):

1. **Open Lambda Console** → Select function
2. **Configuration** tab → **Environment variables** → **Edit**
3. Click **"Add environment variable"** for each one below
4. **Copy EXACTLY as shown** (case-sensitive!)

### Variable List (Add One by One):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `staging` |
| `DATABASE_HOST` | `flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com` |
| `DATABASE_NAME` | `flight_schedule_pro` |
| `DATABASE_USER` | `postgres` |
| `DATABASE_PASSWORD_SECRET_ARN` | `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/database-credentials-gYqeBF` |
| `COGNITO_USER_POOL_ID` | `[Get from Cognito Console]` |
| `COGNITO_CLIENT_ID` | `[Get from Cognito Console]` |
| `OPENAI_API_KEY_SECRET_ARN` | `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openai-api-key-2Si5nA` |
| `OPENWEATHERMAP_API_KEY_SECRET_ARN` | `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openweathermap-api-key-0pDF8m` |
| `WEATHERAPI_API_KEY_SECRET_ARN` | `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/weatherapi-com-key-a5RNBd` |
| `SES_REGION` | `us-east-1` |
| `LOG_LEVEL` | `info` |

5. Click **"Save"**

---

## ✅ Quick Copy-Paste Format

**For easy copy-paste, here's the format:**

```
NODE_ENV=staging
DATABASE_HOST=flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com
DATABASE_NAME=flight_schedule_pro
DATABASE_USER=postgres
DATABASE_PASSWORD_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/database-credentials-gYqeBF
COGNITO_USER_POOL_ID=[GET FROM COGNITO]
COGNITO_CLIENT_ID=[GET FROM COGNITO]
OPENAI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openai-api-key-2Si5nA
OPENWEATHERMAP_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openweathermap-api-key-0pDF8m
WEATHERAPI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/weatherapi-com-key-a5RNBd
SES_REGION=us-east-1
LOG_LEVEL=info
```

---

## 🔍 How to Get Cognito Values

### Option 1: AWS Console
1. Go to **Cognito** service
2. Click **User pools**
3. Find your pool (look for `flight-schedule-pro` or `staging` in the name)
4. Click on the pool name
5. Copy the **User pool ID** (shown at top, format: `us-east-1_XXXXXXXXX`)
6. Go to **App integration** tab
7. Under **App clients**, copy the **Client ID**

### Option 2: AWS CLI
```powershell
# List all pools
aws cognito-idp list-user-pools --max-results 20 --region us-east-1

# Get client ID (replace YOUR_POOL_ID)
aws cognito-idp list-user-pool-clients --user-pool-id YOUR_POOL_ID --region us-east-1
```

---

**Once you have Cognito values, add them to all 3 Lambda functions!**


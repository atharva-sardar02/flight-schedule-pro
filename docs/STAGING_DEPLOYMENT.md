# Staging Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying Flight Schedule Pro to the staging environment and conducting comprehensive testing.

---

## Pre-Deployment Checklist

### Prerequisites

- [ ] AWS CLI v2+ installed and configured
- [ ] AWS account with staging environment access
- [ ] All API keys obtained:
  - [ ] OpenWeatherMap API key
  - [ ] WeatherAPI.com API key
  - [ ] Anthropic API key
- [ ] Database password meets AWS RDS requirements:
  - [ ] Minimum 8 characters
  - [ ] Contains uppercase, lowercase, numbers, and symbols
- [ ] Domain/email verified in SES (if using custom domain)
- [ ] Git repository cloned and up to date
- [ ] All dependencies installed locally

### Environment Variables

Set the following environment variables:

```bash
# AWS Configuration
export AWS_REGION='us-east-1'
export AWS_PROFILE='staging'  # Or 'default' if using default profile

# Database
export DB_MASTER_PASSWORD='YourSecurePassword123!'

# Weather APIs
export OPENWEATHERMAP_API_KEY='your-openweathermap-key'
export WEATHERAPI_COM_KEY='your-weatherapi-key'

# AI Service
export ANTHROPIC_API_KEY='your-anthropic-key'
```

---

## Deployment Steps

### Step 1: Validate CloudFormation Templates

```bash
# Validate all templates
cd infrastructure
for template in cloudformation/*.yaml; do
  echo "Validating $(basename $template)..."
  aws cloudformation validate-template \
    --template-body file://$template \
    --profile $AWS_PROFILE \
    --region $AWS_REGION
done
```

**Expected Result:** All templates validate successfully

---

### Step 2: Deploy Infrastructure Stack

```bash
# Run deployment script
cd infrastructure/scripts
./deploy-staging.sh
```

**Deployment Order:**
1. SNS (notification topics)
2. Secrets Manager (API keys)
3. Cognito (user authentication)
4. RDS (PostgreSQL database)
5. Lambda (backend functions)
6. API Gateway (REST + WebSocket APIs)
7. EventBridge (scheduled triggers)
8. SES (email service)
9. S3 (frontend hosting)
10. CloudFront (CDN)
11. CloudWatch (monitoring)

**Expected Duration:** 30-45 minutes

**Monitor Progress:**
```bash
# Watch stack events
aws cloudformation describe-stack-events \
  --stack-name flight-schedule-pro-staging-sns \
  --max-items 10 \
  --profile $AWS_PROFILE \
  --region $AWS_REGION
```

---

### Step 3: Get Stack Outputs

After deployment, retrieve important outputs:

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name flight-schedule-pro-staging-rds \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text \
  --profile $AWS_PROFILE \
  --region $AWS_REGION)

# Get API Gateway URL
API_URL=$(aws cloudformation describe-stacks \
  --stack-name flight-schedule-pro-staging-api-gateway \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text \
  --profile $AWS_PROFILE \
  --region $AWS_REGION)

# Get Cognito User Pool ID
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name flight-schedule-pro-staging-cognito \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text \
  --profile $AWS_PROFILE \
  --region $AWS_REGION)

# Get Cognito Client ID
CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name flight-schedule-pro-staging-cognito \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text \
  --profile $AWS_PROFILE \
  --region $AWS_REGION)

# Get CloudFront URL
FRONTEND_URL=$(aws cloudformation describe-stacks \
  --stack-name flight-schedule-pro-staging-cloudfront \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionUrl`].OutputValue' \
  --output text \
  --profile $AWS_PROFILE \
  --region $AWS_REGION)

echo "RDS Endpoint: $RDS_ENDPOINT"
echo "API URL: $API_URL"
echo "User Pool ID: $USER_POOL_ID"
echo "Client ID: $CLIENT_ID"
echo "Frontend URL: $FRONTEND_URL"
```

**Save these values** - you'll need them for configuration.

---

### Step 4: Run Database Migrations

```bash
# Set database password
export PGPASSWORD=$DB_MASTER_PASSWORD

# Connect and run migrations
psql -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro -f database/migrations/001_create_users.sql
psql -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro -f database/migrations/002_create_bookings.sql
psql -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro -f database/migrations/003a_create_availability_tables.sql
psql -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro -f database/migrations/003b_create_availability_patterns.sql
psql -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro -f database/migrations/004_create_rescheduling_tables.sql
psql -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro -f database/migrations/005_create_notifications.sql
psql -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro -f database/migrations/006_create_audit_log.sql
```

**Verify migrations:**
```sql
-- Connect to database
psql -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro

-- List all tables
\dt

-- Should see: users, bookings, availability_patterns, availability_overrides, 
-- reschedule_options, preference_rankings, notifications, audit_log
```

---

### Step 5: Load Seed Data

```bash
# Load seed data (optional, for testing)
psql -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro -f database/seeds/dev_users.sql
psql -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro -f database/seeds/dev_bookings.sql
psql -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro -f database/seeds/dev_availability.sql
```

**Note:** Seed data is for testing only. Use production-like data for staging.

---

### Step 6: Configure Lambda Environment Variables

```bash
# Update Lambda environment variables
aws lambda update-function-configuration \
  --function-name flight-schedule-pro-staging-weather-monitor \
  --environment Variables="{
    DATABASE_HOST=$RDS_ENDPOINT,
    DATABASE_NAME=flight_schedule_pro,
    DATABASE_USER=postgres,
    DATABASE_PASSWORD=$DB_MASTER_PASSWORD,
    COGNITO_USER_POOL_ID=$USER_POOL_ID,
    COGNITO_CLIENT_ID=$CLIENT_ID,
    AWS_REGION=$AWS_REGION
  }" \
  --profile $AWS_PROFILE \
  --region $AWS_REGION

# Repeat for other Lambda functions:
# - flight-schedule-pro-staging-api-handler
# - flight-schedule-pro-staging-reschedule-engine
```

**Or use Secrets Manager:**
- Lambda functions should retrieve secrets from Secrets Manager
- Verify secrets are accessible:
```bash
aws secretsmanager get-secret-value \
  --secret-id flight-schedule-pro-staging/openweathermap-key \
  --profile $AWS_PROFILE \
  --region $AWS_REGION
```

---

### Step 7: Deploy Lambda Code

```bash
# Build backend
cd backend
npm install
npm run build

# Package Lambda functions
zip -r lambda-code.zip dist/ node_modules/

# Upload to S3
aws s3 cp lambda-code.zip s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip \
  --profile $AWS_PROFILE \
  --region $AWS_REGION

# Update Lambda function code
aws lambda update-function-code \
  --function-name flight-schedule-pro-staging-weather-monitor \
  --s3-bucket flight-schedule-pro-lambda-code \
  --s3-key staging/lambda-code.zip \
  --profile $AWS_PROFILE \
  --region $AWS_REGION

# Repeat for other Lambda functions
```

---

### Step 8: Deploy Frontend

```bash
# Build frontend
cd frontend
npm install
npm run build

# Update environment variables in build
# Edit dist/index.html or use environment-specific build

# Upload to S3
aws s3 sync dist/ s3://flight-schedule-pro-staging-frontend \
  --delete \
  --profile $AWS_PROFILE \
  --region $AWS_REGION

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*" \
  --profile $AWS_PROFILE \
  --region $AWS_REGION
```

---

### Step 9: Configure SES Email Domain

```bash
# Verify email domain (if using custom domain)
aws ses verify-domain-identity \
  --domain staging.flightschedulepro.com \
  --profile $AWS_PROFILE \
  --region $AWS_REGION

# Add DKIM records to DNS
aws ses get-identity-dkim-attributes \
  --identities staging.flightschedulepro.com \
  --profile $AWS_PROFILE \
  --region $AWS_REGION

# Request production access (if in sandbox)
aws ses get-account-sending-enabled \
  --profile $AWS_PROFILE \
  --region $AWS_REGION
```

---

### Step 10: Verify Deployment

```bash
# Health check
curl $API_URL/health

# Expected response:
# {"status":"healthy","service":"flight-schedule-pro-backend","timestamp":"..."}

# Test API endpoint
curl $API_URL/api

# Should return API info with list of endpoints
```

---

## Post-Deployment Verification

### 1. Infrastructure Verification

- [ ] All CloudFormation stacks created successfully
- [ ] RDS instance is running and accessible
- [ ] Lambda functions deployed and configured
- [ ] API Gateway endpoints responding
- [ ] CloudFront distribution active
- [ ] EventBridge rule created
- [ ] CloudWatch dashboard accessible

### 2. Database Verification

- [ ] All migrations applied successfully
- [ ] All tables created
- [ ] Indexes created
- [ ] Seed data loaded (if applicable)
- [ ] Can connect from Lambda functions

### 3. Service Verification

- [ ] Health check endpoint responds
- [ ] API endpoints accessible
- [ ] Frontend loads correctly
- [ ] CloudWatch logs flowing
- [ ] Alarms configured

---

## Configuration Summary

After deployment, document these values:

```yaml
Staging Environment Configuration:
  RDS Endpoint: <rds-endpoint>
  API Gateway URL: <api-url>
  Frontend URL: <frontend-url>
  Cognito User Pool ID: <user-pool-id>
  Cognito Client ID: <client-id>
  CloudFront Distribution ID: <distribution-id>
  S3 Bucket: flight-schedule-pro-staging-frontend
  Lambda Code Bucket: flight-schedule-pro-lambda-code
```

---

## Next Steps

After successful deployment:

1. **Run Acceptance Criteria Tests** (see `docs/STAGING_TESTING.md`)
2. **Monitor for 24 hours** to verify stability
3. **Document any issues** (see `docs/STAGING_ISSUES.md`)
4. **Prepare for PR #21** (Bug Fixes from Staging)

---

## Troubleshooting

### Common Deployment Issues

**Stack Creation Fails:**
- Check CloudFormation events for specific error
- Verify all environment variables are set
- Ensure no resource name conflicts
- Check IAM permissions

**Lambda Can't Connect to RDS:**
- Verify Lambda is in correct VPC subnets
- Check security group rules allow Lambda → RDS
- Verify RDS endpoint is correct
- Check database password

**API Gateway Returns 403:**
- Verify Cognito authorizer configuration
- Check user pool ID matches
- Ensure CORS is configured

See `docs/TROUBLESHOOTING.md` for detailed troubleshooting.

---

**Last Updated:** November 2024  
**Version:** 1.0.0


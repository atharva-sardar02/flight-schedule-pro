# Deployment Guide

## Overview

This guide covers deploying Flight Schedule Pro to AWS infrastructure using CloudFormation templates and deployment scripts.

---

## Prerequisites

### Required Tools
- **AWS CLI v2+** installed and configured
- **Node.js 18+** and npm 9+
- **PostgreSQL 14+** (for local development)
- **Git**
- **AWS Account** with appropriate permissions

### Required AWS Permissions
- CloudFormation (create/update/delete stacks)
- Lambda (create/update/delete functions)
- RDS (create/update/delete databases)
- API Gateway (create/update/delete APIs)
- Cognito (create/update user pools)
- S3 (create/update buckets)
- CloudFront (create distributions)
- EventBridge (create rules)
- SES (configure email)
- Secrets Manager (store/retrieve secrets)
- CloudWatch (create logs, alarms, dashboards)
- IAM (create roles and policies)

### Required API Keys
- **OpenWeatherMap API Key** - [Sign up here](https://openweathermap.org/api)
- **WeatherAPI.com API Key** - [Sign up here](https://www.weatherapi.com/)
- **Anthropic API Key** - [Sign up here](https://www.anthropic.com/)

---

## Environment Setup

### 1. Configure AWS CLI

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (`json`)

### 2. Set Environment Variables

Create a `.env` file in the project root:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=default

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=flight_schedule_pro
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DB_MASTER_PASSWORD=YourSecurePassword123!

# Cognito
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_CLIENT_ID=your-client-id

# Weather APIs
OPENWEATHERMAP_API_KEY=your-openweathermap-key
WEATHERAPI_COM_KEY=your-weatherapi-key

# AI Service
ANTHROPIC_API_KEY=your-anthropic-key

# Frontend
VITE_API_BASE_URL=http://localhost:3001

# Email (SES)
SES_FROM_EMAIL=noreply@yourdomain.com
SES_REPLY_TO=support@yourdomain.com
FRONTEND_URL=http://localhost:3000
```

---

## Local Development Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Set Up Database

```bash
# Create database
createdb flight_schedule_pro

# Or using psql
psql -U postgres -c "CREATE DATABASE flight_schedule_pro;"

# Run migrations
psql -U postgres -d flight_schedule_pro -f database/migrations/001_create_users.sql
psql -U postgres -d flight_schedule_pro -f database/migrations/002_create_bookings.sql
psql -U postgres -d flight_schedule_pro -f database/migrations/003a_create_availability_tables.sql
psql -U postgres -d flight_schedule_pro -f database/migrations/003b_create_availability_patterns.sql
psql -U postgres -d flight_schedule_pro -f database/migrations/004_create_rescheduling_tables.sql
psql -U postgres -d flight_schedule_pro -f database/migrations/005_create_notifications.sql
psql -U postgres -d flight_schedule_pro -f database/migrations/006_create_audit_log.sql

# Load seed data (optional)
psql -U postgres -d flight_schedule_pro -f database/seeds/dev_users.sql
psql -U postgres -d flight_schedule_pro -f database/seeds/dev_bookings.sql
```

**Windows PowerShell:**
```powershell
$env:PGPASSWORD = "your_password"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
& $psql -U postgres -d flight_schedule_pro -f database/migrations/001_create_users.sql
# ... repeat for each migration
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## Staging Deployment

### 1. Pre-Deployment Checklist

- [ ] AWS CLI configured with staging credentials
- [ ] All environment variables set
- [ ] API keys obtained and stored securely
- [ ] CloudFormation templates validated
- [ ] Database password meets AWS RDS requirements (8+ chars, mixed case, numbers, symbols)

### 2. Deploy Infrastructure

```bash
# Set environment variables
export AWS_REGION=us-east-1
export AWS_PROFILE=staging
export DB_MASTER_PASSWORD='YourSecurePassword123!'
export OPENWEATHERMAP_API_KEY='your-key'
export WEATHERAPI_COM_KEY='your-key'
export ANTHROPIC_API_KEY='your-key'

# Run deployment script
./infrastructure/scripts/deploy-staging.sh
```

**What the script does:**
1. Validates all CloudFormation templates
2. Deploys infrastructure in dependency order:
   - Cognito (user pools)
   - RDS (database)
   - Secrets Manager (API keys)
   - Lambda functions
   - API Gateway
   - S3 buckets
   - CloudFront distribution
   - EventBridge rules
   - SES configuration
   - CloudWatch alarms
3. Outputs stack information and endpoints

### 3. Run Database Migrations

After infrastructure is deployed:

```bash
# Get RDS endpoint from CloudFormation output
RDS_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name flight-schedule-pro-staging \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text)

# Connect and run migrations
psql -h $RDS_ENDPOINT -U postgres -d flight_schedule_pro -f database/migrations/001_create_users.sql
# ... repeat for all migrations
```

### 4. Configure SES Email Domain

```bash
# Verify email domain in SES
aws ses verify-domain-identity --domain yourdomain.com --region us-east-1

# Add DKIM records to your DNS
aws ses get-identity-dkim-attributes --identities yourdomain.com --region us-east-1
```

### 5. Deploy Lambda Functions

```bash
cd backend

# Package Lambda functions
npm run build

# Deploy using AWS SAM or Serverless Framework
sam deploy --stack-name flight-schedule-pro-staging \
  --s3-bucket your-deployment-bucket \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

### 6. Deploy Frontend

```bash
cd frontend

# Build production bundle
npm run build

# Upload to S3
aws s3 sync dist/ s3://flight-schedule-pro-staging-frontend --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### 7. Verify Deployment

```bash
# Check API Gateway endpoint
curl https://api-staging.flightschedulepro.com/health

# Check frontend
open https://staging.flightschedulepro.com

# Check CloudWatch logs
aws logs tail /aws/lambda/weather-monitor --follow
```

---

## Production Deployment

### 1. Pre-Deployment Checklist

- [ ] All staging tests passed
- [ ] Database backups configured
- [ ] CloudWatch alarms configured
- [ ] On-call rotation set up
- [ ] Rollback plan documented
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled (if needed)

### 2. Deploy Infrastructure

```bash
# Set production environment variables
export AWS_REGION=us-east-1
export AWS_PROFILE=production
export DB_MASTER_PASSWORD='YourProductionPassword123!'
export OPENWEATHERMAP_API_KEY='your-production-key'
export WEATHERAPI_COM_KEY='your-production-key'
export ANTHROPIC_API_KEY='your-production-key'

# Run production deployment script
./infrastructure/scripts/deploy-production.sh
```

**Production deployment includes:**
- Blue/green deployment strategy
- Change set review before applying
- Manual approval step
- Database read replica (optional)
- Enhanced monitoring and alarms
- WAF rules for security

### 3. Database Migration Strategy

**Option 1: Zero-Downtime Migration**
```bash
# Create read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier flight-schedule-pro-prod-replica \
  --source-db-instance-identifier flight-schedule-pro-prod

# Run migrations on replica
# Promote replica to primary
# Update application connection strings
```

**Option 2: Maintenance Window**
```bash
# Schedule maintenance window
# Run migrations during window
# Verify data integrity
# Resume service
```

### 4. Post-Deployment Verification

```bash
# Health checks
curl https://api.flightschedulepro.com/health

# Smoke tests
npm run test:smoke

# Load test
npm run test:load

# Monitor CloudWatch dashboards
# Check error rates
# Verify EventBridge scheduler
```

---

## Deployment Order

### Critical Path

1. **Cognito** - User authentication (required first)
2. **RDS** - Database (required for all services)
3. **Secrets Manager** - API keys (required for Lambda)
4. **Lambda Functions** - Core logic
5. **API Gateway** - API endpoints
6. **EventBridge** - Scheduled triggers
7. **S3 + CloudFront** - Frontend hosting
8. **SES** - Email notifications
9. **CloudWatch** - Monitoring

### Deployment Scripts

The deployment scripts handle this order automatically:

```bash
# Staging
./infrastructure/scripts/deploy-staging.sh

# Production
./infrastructure/scripts/deploy-production.sh
```

---

## Rollback Procedures

### Infrastructure Rollback

```bash
# Delete CloudFormation stack (reverts all changes)
aws cloudformation delete-stack \
  --stack-name flight-schedule-pro-staging

# Or rollback to previous version
aws cloudformation update-stack \
  --stack-name flight-schedule-pro-staging \
  --template-body file://infrastructure/cloudformation/previous-version.yaml
```

### Database Rollback

```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier flight-schedule-pro-staging \
  --db-snapshot-identifier snapshot-before-migration

# Or restore from point-in-time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier flight-schedule-pro-staging \
  --target-db-instance-identifier flight-schedule-pro-staging-rollback \
  --restore-time 2024-11-08T10:00:00Z
```

### Lambda Rollback

```bash
# Deploy previous version
aws lambda update-function-code \
  --function-name weather-monitor \
  --zip-file fileb://previous-version.zip
```

---

## Environment-Specific Configuration

### Staging
- **Database:** t3.micro instance
- **Lambda:** 512 MB memory, 30s timeout
- **API Gateway:** Throttling: 500 req/sec
- **CloudWatch:** 7-day log retention
- **Domain:** staging.flightschedulepro.com

### Production
- **Database:** t3.small instance with read replica
- **Lambda:** 1024 MB memory, 60s timeout, provisioned concurrency
- **API Gateway:** Throttling: 1000 req/sec
- **CloudWatch:** 90-day log retention
- **Domain:** app.flightschedulepro.com
- **WAF:** Enabled with rate limiting rules

---

## Monitoring Deployment

### CloudWatch Dashboards

After deployment, access CloudWatch dashboards:

```bash
# Get dashboard URL
aws cloudwatch get-dashboard \
  --dashboard-name FlightSchedulePro-Main \
  --region us-east-1
```

**Key Metrics to Monitor:**
- Lambda invocations and errors
- API Gateway 4xx/5xx errors
- RDS CPU and connections
- Weather API success rate
- Notification delivery rate

### CloudWatch Alarms

Critical alarms configured:
- Lambda error rate > 5%
- API Gateway 5xx > 5%
- RDS CPU > 80%
- Weather API failures > 5%
- Notification delivery < 90%

---

## Troubleshooting Deployment

### Common Issues

**1. CloudFormation Stack Fails**
```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name flight-schedule-pro-staging

# Common causes:
# - IAM permissions insufficient
# - Resource limits exceeded
# - Invalid parameter values
```

**2. Lambda Function Fails to Deploy**
```bash
# Check Lambda logs
aws logs tail /aws/lambda/weather-monitor --follow

# Verify environment variables
aws lambda get-function-configuration \
  --function-name weather-monitor
```

**3. Database Connection Fails**
```bash
# Check security group rules
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=flight-schedule-pro-rds-sg"

# Verify VPC configuration
aws rds describe-db-instances \
  --db-instance-identifier flight-schedule-pro-staging
```

**4. API Gateway Returns 502**
```bash
# Check Lambda function logs
# Verify Lambda timeout settings
# Check API Gateway integration configuration
```

See `docs/TROUBLESHOOTING.md` for detailed troubleshooting steps.

---

## Security Considerations

### Secrets Management

All sensitive data stored in AWS Secrets Manager:

```bash
# Store API keys
aws secretsmanager create-secret \
  --name flight-schedule-pro/openweathermap-key \
  --secret-string "your-api-key"

# Retrieve in Lambda
const secret = await secretsManager.getSecretValue({
  SecretId: 'flight-schedule-pro/openweathermap-key'
}).promise();
```

### Network Security

- **RDS:** Private subnets only, no public access
- **Lambda:** VPC configuration for database access
- **API Gateway:** WAF rules enabled in production
- **CloudFront:** HTTPS only, security headers

### Access Control

- **IAM Roles:** Least privilege principle
- **Cognito:** MFA required for admin roles
- **API Gateway:** JWT token validation
- **Database:** Parameterized queries only

---

## Cost Optimization

### Staging Environment
- **Estimated Monthly Cost:** $50-100
  - RDS t3.micro: ~$15/month
  - Lambda: ~$5/month (low usage)
  - API Gateway: ~$5/month
  - CloudWatch: ~$10/month
  - S3 + CloudFront: ~$5/month
  - Other services: ~$10/month

### Production Environment
- **Estimated Monthly Cost:** $200-400
  - RDS t3.small + replica: ~$60/month
  - Lambda (with provisioned concurrency): ~$50/month
  - API Gateway: ~$20/month
  - CloudWatch: ~$30/month
  - S3 + CloudFront: ~$20/month
  - Other services: ~$20/month

### Cost Reduction Tips

1. **Use Reserved Instances** for RDS (1-year term)
2. **Enable Lambda provisioned concurrency** only for critical functions
3. **Set CloudWatch log retention** to 7 days (staging) / 30 days (production)
4. **Use S3 lifecycle policies** for old logs
5. **Monitor and optimize** Lambda memory allocation

---

## Post-Deployment Tasks

### 1. Verify All Services

```bash
# Health check
curl https://api.flightschedulepro.com/health

# Test authentication
curl -X POST https://api.flightschedulepro.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test booking creation
# Test availability calendar
# Test rescheduling flow
```

### 2. Configure Monitoring

- Set up CloudWatch dashboards
- Configure SNS alerts
- Set up on-call rotation
- Test alarm notifications

### 3. Load Testing

```bash
# Run load tests
npm run test:load

# Monitor during test
# Check for errors
# Verify performance targets
```

### 4. Documentation

- Update API documentation with production URLs
- Document any environment-specific configurations
- Create runbook for common operations

---

## Maintenance Windows

### Scheduled Maintenance

**Weekly:**
- Review CloudWatch logs
- Check error rates
- Review cost reports

**Monthly:**
- Database backup verification
- Security patch updates
- Performance optimization review

**Quarterly:**
- Infrastructure review
- Cost optimization audit
- Security audit

---

## Support & Resources

### Documentation
- **API Docs:** `docs/API.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING.md`
- **Operations:** `docs/OPERATIONS.md`

### AWS Resources
- [CloudFormation Docs](https://docs.aws.amazon.com/cloudformation/)
- [Lambda Docs](https://docs.aws.amazon.com/lambda/)
- [RDS Docs](https://docs.aws.amazon.com/rds/)
- [API Gateway Docs](https://docs.aws.amazon.com/apigateway/)

---

**Last Updated:** November 2024  
**Version:** 0.1.0


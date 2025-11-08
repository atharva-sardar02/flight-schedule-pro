# Flight Schedule Pro - AWS Infrastructure

This directory contains AWS CloudFormation templates and deployment scripts for the Flight Schedule Pro infrastructure.

## Directory Structure

```
infrastructure/
├── cloudformation/        # CloudFormation templates
│   ├── cognito.yaml       # User authentication
│   ├── rds.yaml           # PostgreSQL database
│   ├── lambda.yaml        # Lambda functions
│   ├── api-gateway.yaml   # REST + WebSocket APIs
│   ├── s3.yaml            # Frontend hosting
│   ├── cloudfront.yaml    # CDN distribution
│   ├── eventbridge.yaml   # Scheduled events
│   ├── ses.yaml           # Email service
│   ├── cloudwatch.yaml    # Monitoring & alarms
│   ├── secrets.yaml       # API keys & secrets
│   └── sns.yaml           # Notifications
└── scripts/               # Deployment scripts
    ├── deploy-staging.sh  # Deploy to staging
    ├── deploy-production.sh  # Deploy to production
    └── setup-local.sh     # Local dev setup
```

## Prerequisites

- AWS CLI v2+ installed and configured
- AWS account with appropriate permissions
- Node.js 18+ and npm 9+
- PostgreSQL 14+ (for local development)
- Git

## Environment Setup

### Required Environment Variables

Before deploying, set these environment variables:

```bash
# Database
export DB_MASTER_PASSWORD='YourSecurePassword123!'

# Weather APIs
export OPENWEATHERMAP_API_KEY='your-openweathermap-key'
export WEATHERAPI_COM_KEY='your-weatherapi-key'

# AI Service
export ANTHROPIC_API_KEY='your-anthropic-key'

# AWS Configuration
export AWS_REGION='us-east-1'
export AWS_PROFILE='default'
```

## Local Development

To set up your local development environment:

```bash
# Run the setup script
./infrastructure/scripts/setup-local.sh

# Or run manually:
npm run install:all
npm run db:setup
```

This will:
1. Install all dependencies (frontend + backend)
2. Create the PostgreSQL database
3. Run migrations
4. Load seed data

## Deployment

### Deploy to Staging

```bash
# Set environment variables
export AWS_REGION='us-east-1'
export AWS_PROFILE='default'
export DB_MASTER_PASSWORD='YourPassword'
export OPENWEATHERMAP_API_KEY='your-key'
export WEATHERAPI_COM_KEY='your-key'
export ANTHROPIC_API_KEY='your-key'

# Run deployment
./infrastructure/scripts/deploy-staging.sh
```

### Deploy to Production

```bash
# Set environment variables
export AWS_REGION='us-east-1'
export AWS_PROFILE='production'
export DB_MASTER_PASSWORD='YourProductionPassword'
export OPENWEATHERMAP_API_KEY='your-key'
export WEATHERAPI_COM_KEY='your-key'
export ANTHROPIC_API_KEY='your-key'

# Run deployment with approval steps
./infrastructure/scripts/deploy-production.sh
```

**Note:** Production deployment includes:
- Pre-deployment checks
- Change set review before execution
- Manual approval steps
- Enhanced monitoring
- Multi-AZ RDS deployment
- Deletion protection on critical resources

## CloudFormation Stack Dependencies

Stacks must be deployed in this order:

1. **SNS** - Notification topics (required by CloudWatch)
2. **Secrets Manager** - API keys and credentials
3. **Cognito** - User authentication
4. **RDS** - PostgreSQL database (includes VPC)
5. **Lambda** - Backend functions (requires RDS VPC)
6. **API Gateway** - REST + WebSocket APIs (requires Lambda & Cognito)
7. **EventBridge** - Scheduled triggers (requires Lambda)
8. **SES** - Email notifications
9. **S3** - Frontend hosting
10. **CloudFront** - CDN (requires S3)
11. **CloudWatch** - Monitoring (requires SNS)

## Stack Management

### Validate Templates

```bash
# Validate all templates
for template in infrastructure/cloudformation/*.yaml; do
  aws cloudformation validate-template \
    --template-body file://$template \
    --region us-east-1
done
```

### Deploy Individual Stack

```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/cognito.yaml \
  --stack-name flight-schedule-pro-dev-cognito \
  --parameter-overrides Environment=dev ProjectName=flight-schedule-pro \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Delete Stack

```bash
aws cloudformation delete-stack \
  --stack-name flight-schedule-pro-dev-cognito \
  --region us-east-1
```

### View Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name flight-schedule-pro-dev-cognito \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Monitoring

### CloudWatch Dashboard

After deployment, access the CloudWatch dashboard:

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=flight-schedule-pro-{env}-dashboard
```

### Alarms

The following alarms are configured:
- Lambda error rates (>3%)
- API Gateway 5xx errors (>5%)
- RDS CPU utilization (>80%)
- RDS connection count (>80)

Alarm notifications are sent to the email configured in SNS.

## Cost Optimization

### Development Environment

For `dev` environment, minimal resources are used:
- RDS: `db.t3.micro` (single AZ)
- Lambda: 512MB memory
- No deletion protection

**Estimated cost:** ~$20-30/month

### Production Environment

For `production` environment:
- RDS: `db.t3.small` (Multi-AZ)
- Lambda: Higher memory allocation
- Deletion protection enabled
- Enhanced monitoring

**Estimated cost:** ~$100-150/month

## Security

### Network Security
- RDS in private subnets
- Lambda functions in VPC
- Security groups restrict access
- No public database access

### Data Security
- Secrets in AWS Secrets Manager
- Database encryption at rest
- SSL/TLS for all connections
- S3 bucket encryption

### Access Control
- Cognito for user authentication
- IAM roles with least privilege
- API Gateway authorizers
- CloudTrail logging enabled

## Troubleshooting

### Common Issues

**Stack creation fails:**
- Check CloudFormation events in AWS Console
- Verify all environment variables are set
- Ensure no resource name conflicts

**Lambda can't connect to RDS:**
- Verify Lambda is in correct VPC subnets
- Check security group rules
- Confirm RDS endpoint is correct

**API Gateway returns 403:**
- Verify Cognito authorizer configuration
- Check if user is authenticated
- Ensure correct user pool ID

### Useful Commands

```bash
# View CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name flight-schedule-pro-dev-cognito \
  --max-items 10

# View Lambda logs
aws logs tail /aws/lambda/flight-schedule-pro-dev-weather-monitor \
  --follow

# Test API endpoint
curl -X GET https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/health

# Check RDS connection
psql -h your-rds-endpoint.rds.amazonaws.com \
  -U postgres -d flight_schedule_pro
```

## Backup & Recovery

### Database Backups
- Automated daily backups (7-day retention)
- Manual snapshots before major changes
- Point-in-time recovery enabled

### Disaster Recovery
- RDS snapshots stored in S3
- CloudFormation templates in version control
- Regular backup testing recommended

## Additional Resources

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [AWS RDS PostgreSQL Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)

## Support

For issues or questions:
- Check the main project README.md
- Review CloudWatch logs
- Contact DevOps team



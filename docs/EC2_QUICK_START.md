# EC2 Quick Start Guide

## Prerequisites
- AWS account with EC2 access
- RDS database already created
- SSH key pair

## 1. Create EC2 Instance (Console)

1. Go to EC2 Console → Launch Instance
2. **Name**: `flight-schedule-pro-api`
3. **AMI**: Amazon Linux 2023 (free tier)
4. **Instance Type**: `t3.micro` (free tier eligible)
5. **Key Pair**: Create new or select existing
6. **Network Settings**:
   - Create security group
   - Allow inbound: Port 3001 from your IP (or 0.0.0.0/0 for demo)
7. **Launch Instance**

## 2. Connect to EC2

```bash
ssh -i your-key.pem ec2-user@<EC2-PUBLIC-IP>
```

## 3. One-Command Setup Script

Run this on EC2:

```bash
# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

# Install PM2
sudo npm install -g pm2

# Clone repo (or upload code)
git clone <your-repo-url>
cd flight-schedule-pro/backend

# Install dependencies
npm install

# Create .env file (see below)
nano .env

# Start with PM2
pm2 start src/dev-server.ts --name flight-api --interpreter ts-node
pm2 save
pm2 startup  # Follow instructions
```

## 4. Environment Variables (.env)

Create `.env` file in `backend/` directory:

```env
NODE_ENV=production
PORT=3001
AWS_REGION=us-east-1

DATABASE_HOST=flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com
DATABASE_NAME=flight_schedule_pro
DATABASE_USER=postgres
DATABASE_PASSWORD=Databasemaster2000

COGNITO_USER_POOL_ID=us-east-1_f6h1XdY8u
COGNITO_CLIENT_ID=28tqtmpt1s0mrkcj4p5divnlh8

OPENAI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openai-api-key-2Si5nA
WEATHERAPI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/weatherapi-com-key-a5RNBd
OPENWEATHERMAP_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openweathermap-api-key-0pDF8m
DATABASE_PASSWORD_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/database-credentials-gYqeBF

SES_REGION=us-east-1
LOG_LEVEL=info
```

## 5. Update RDS Security Group

1. Go to RDS Console → Your database → Connectivity & security
2. Click on Security Group
3. Edit inbound rules
4. Add rule:
   - Type: PostgreSQL
   - Source: EC2 Security Group (select your EC2 security group)

## 6. Test Backend

```bash
# On EC2, check if running
pm2 status
pm2 logs flight-api

# From your local machine
curl http://<EC2-PUBLIC-IP>:3001/health
```

## 7. Deploy Frontend to S3

```bash
# On your local machine
cd frontend

# Update API URL
echo "VITE_API_BASE_URL=http://<EC2-PUBLIC-IP>:3001" > .env.production

# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-s3-bucket-name --delete

# Enable static hosting
aws s3 website s3://your-s3-bucket-name \
  --index-document index.html \
  --error-document index.html
```

## 8. Update CORS in Backend

Edit `backend/src/dev-server.ts`:

```typescript
app.use(cors({
  origin: [
    'http://your-s3-bucket.s3-website-us-east-1.amazonaws.com',
    'http://<EC2-PUBLIC-IP>:3001',  // For testing
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Then restart:
```bash
pm2 restart flight-api
```

## Done! 🎉

- Backend: `http://<EC2-PUBLIC-IP>:3001`
- Frontend: `http://your-s3-bucket.s3-website-us-east-1.amazonaws.com`

## Useful Commands

```bash
# View logs
pm2 logs flight-api

# Restart
pm2 restart flight-api

# Stop
pm2 stop flight-api

# Status
pm2 status
```


# Simple Deployment Guide

## Architecture Overview

```
┌─────────────┐
│  S3 Bucket  │  Frontend (React static files)
│  (Static)   │
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼──────┐
│  EC2 (API)  │  Backend (Express/Node.js on port 3001)
│  Port 3001  │
└──────┬──────┘
       │
       │ PostgreSQL
       │
┌──────▼──────┐
│     RDS     │  Database (PostgreSQL)
└─────────────┘
```

## Prerequisites

- AWS account with EC2, S3, and RDS access
- RDS database already created
- SSH key pair for EC2 access
- AWS CLI configured (for S3 deployment)

## Step 1: Create EC2 Instance

### Via AWS Console:

1. Go to **EC2 Console** → **Launch Instance**
2. **Name**: `flight-schedule-pro-api`
3. **AMI**: Amazon Linux 2023 (or Ubuntu 22.04 LTS)
4. **Instance Type**: `t3.micro` (free tier eligible)
5. **Key Pair**: Create new or select existing
6. **Network Settings**:
   - Create security group: `flight-api-sg`
   - Allow inbound: **Port 3001** from your IP (or `0.0.0.0/0` for testing)
   - Allow SSH: **Port 22** from your IP
7. **Launch Instance**

### Note EC2 Details:
- **Public IP**: `x.x.x.x` (you'll need this)
- **Security Group ID**: `sg-xxxxx` (you'll need this for RDS)

## Step 2: Configure RDS Security Group

1. Go to **RDS Console** → Your database → **Connectivity & security**
2. Click on the **Security Group**
3. **Edit inbound rules**
4. **Add rule**:
   - Type: **PostgreSQL**
   - Port: **5432**
   - Source: **Custom** → Select your EC2 security group (`flight-api-sg`)

## Step 3: Setup Backend on EC2

### Connect to EC2:

```bash
ssh -i your-key.pem ec2-user@<EC2-PUBLIC-IP>
```

### Run Setup Script:

```bash
# Install Node.js 20, PM2, and dependencies
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git
sudo npm install -g pm2 typescript ts-node

# Clone repository (or upload code)
git clone <your-repo-url>
cd flight-schedule-pro/backend

# Install dependencies
npm install
```

### Create Environment File:

```bash
nano .env
```

Paste this (update values as needed):

```env
NODE_ENV=production
PORT=3001
AWS_REGION=us-east-1

# Database
DATABASE_HOST=flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com
DATABASE_NAME=flight_schedule_pro
DATABASE_USER=postgres
DATABASE_PASSWORD=your-db-password

# Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx

# Secrets Manager ARNs (for API keys)
OPENAI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:...
WEATHERAPI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:...
OPENWEATHERMAP_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:...

# SES
SES_REGION=us-east-1
LOG_LEVEL=info
```

### Start Backend:

```bash
# Start with PM2
pm2 start src/dev-server.ts --name flight-api --interpreter ts-node

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it prints

# Check status
pm2 status
pm2 logs flight-api
```

### Test Backend:

```bash
# On EC2
curl http://localhost:3001/health

# From your local machine
curl http://<EC2-PUBLIC-IP>:3001/health
```

## Step 4: Create S3 Bucket for Frontend

### Via AWS Console:

1. Go to **S3 Console** → **Create bucket**
2. **Bucket name**: `flight-schedule-pro-frontend` (must be globally unique)
3. **Region**: Same as EC2 (e.g., `us-east-1`)
4. **Block Public Access**: **Uncheck** (we need public access for static hosting)
5. **Create bucket**

### Enable Static Website Hosting:

1. Click on your bucket → **Properties** tab
2. Scroll to **Static website hosting**
3. **Edit** → **Enable**
4. **Index document**: `index.html`
5. **Error document**: `index.html` (for React routing)
6. **Save changes**

### Note S3 Website URL:
- **Website endpoint**: `http://flight-schedule-pro-frontend.s3-website-us-east-1.amazonaws.com`

## Step 5: Deploy Frontend to S3

### On Your Local Machine:

```bash
cd frontend

# Create production environment file
echo "VITE_API_BASE_URL=http://<EC2-PUBLIC-IP>:3001" > .env.production

# Build frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://flight-schedule-pro-frontend --delete

# Set proper permissions
aws s3 cp dist/index.html s3://flight-schedule-pro-frontend/index.html --content-type "text/html"
```

### Or Use the Deployment Script:

```bash
# From project root
./scripts/deploy-frontend.sh <EC2-PUBLIC-IP> <S3-BUCKET-NAME>
```

## Step 6: Update CORS in Backend

Edit `backend/src/dev-server.ts` to allow your S3 domain:

```typescript
app.use(cors({
  origin: [
    'http://flight-schedule-pro-frontend.s3-website-us-east-1.amazonaws.com',
    'http://<EC2-PUBLIC-IP>:3001',  // For testing
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Then restart:

```bash
# On EC2
pm2 restart flight-api
```

## Step 7: Test Everything

1. **Backend Health**: `http://<EC2-PUBLIC-IP>:3001/health`
2. **Frontend**: `http://flight-schedule-pro-frontend.s3-website-us-east-1.amazonaws.com`
3. **Login**: Test authentication flow
4. **API Calls**: Test booking creation, etc.

## Useful Commands

### Backend Management (on EC2):

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

### Frontend Deployment:

```bash
# Rebuild and deploy
cd frontend
npm run build
aws s3 sync dist/ s3://flight-schedule-pro-frontend --delete
```

## Troubleshooting

### Backend not accessible:
- Check EC2 security group allows port 3001
- Check EC2 instance is running
- Check PM2 logs: `pm2 logs flight-api`

### Database connection fails:
- Verify RDS security group allows EC2 security group
- Check DATABASE_HOST in .env
- Test connection: `psql -h $DATABASE_HOST -U postgres -d flight_schedule_pro`

### CORS errors:
- Update CORS origin in `dev-server.ts`
- Check frontend `VITE_API_BASE_URL` matches EC2 IP
- Restart backend: `pm2 restart flight-api`

### Frontend not loading:
- Check S3 bucket public access is enabled
- Verify static website hosting is enabled
- Check bucket policy allows public read access

## Cost Estimate

- **EC2 t3.micro**: ~$7-10/month (or free tier)
- **RDS**: Already running
- **S3**: ~$0.50/month for static hosting
- **Data Transfer**: Minimal

**Total**: ~$8-11/month (or free tier eligible)

## Next Steps (Optional)

1. **Add Domain**: Use Route 53 or CloudFront for custom domain
2. **HTTPS**: Add SSL certificate via ACM + CloudFront
3. **Monitoring**: Set up CloudWatch alarms
4. **Backups**: Configure RDS automated backups


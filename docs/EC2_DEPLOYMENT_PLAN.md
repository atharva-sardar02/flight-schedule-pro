# EC2 Deployment Plan - Simplified Approach

## Overview
Deploy Flight Schedule Pro using:
- **Backend**: EC2 instance running Node.js/Express
- **Database**: AWS RDS (already set up)
- **Frontend**: S3 bucket + CloudFront (optional)

## Why This Approach?
✅ Much simpler than Lambda packaging  
✅ Same codebase as local development  
✅ Easier debugging and monitoring  
✅ No cold starts  
✅ Can use existing dev-server.ts with minimal changes  
✅ Lower complexity for demo/prototype  

## Architecture

```
┌─────────────┐
│   S3 + CF   │  Frontend (React)
│  (Static)   │
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼──────┐
│  EC2 (API)  │  Backend (Express/Node.js)
│  Port 3001  │
└──────┬──────┘
       │
       │ PostgreSQL
       │
┌──────▼──────┐
│     RDS     │  Database (already set up)
└─────────────┘
```

## Prerequisites
- ✅ RDS database already created: `flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com`
- ✅ AWS account with EC2 access
- ✅ Security groups configured
- ✅ Environment variables ready

## Step-by-Step Deployment

### Step 1: Create EC2 Instance

**Instance Type**: `t3.micro` or `t3.small` (free tier eligible)
**AMI**: Amazon Linux 2023 or Ubuntu 22.04 LTS
**Security Group**: 
- Inbound: Port 3001 from your IP (or 0.0.0.0/0 for demo)
- Outbound: All traffic

**Key Pair**: Create or use existing

### Step 2: Connect to EC2

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### Step 3: Install Dependencies on EC2

```bash
# Update system
sudo yum update -y  # Amazon Linux
# OR
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# OR for Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo yum install -y git  # Amazon Linux
# OR
sudo apt install -y git  # Ubuntu

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 4: Clone and Setup Backend

```bash
# Clone repository (or upload code)
git clone <your-repo-url>
cd flight-schedule-pro/backend

# Install dependencies
npm install

# Create .env file
nano .env
```

**Environment Variables (.env)**:
```env
NODE_ENV=production
PORT=3001
AWS_REGION=us-east-1

# Database (from existing RDS)
DATABASE_HOST=flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com
DATABASE_NAME=flight_schedule_pro
DATABASE_USER=postgres
DATABASE_PASSWORD=Databasemaster2000

# Cognito (already set up)
COGNITO_USER_POOL_ID=us-east-1_f6h1XdY8u
COGNITO_CLIENT_ID=28tqtmpt1s0mrkcj4p5divnlh8

# Secrets Manager ARNs (for API keys)
OPENAI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openai-api-key-2Si5nA
WEATHERAPI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/weatherapi-com-key-a5RNBd
OPENWEATHERMAP_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openweathermap-api-key-0pDF8m
DATABASE_PASSWORD_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/database-credentials-gYqeBF

# SES
SES_REGION=us-east-1

# Logging
LOG_LEVEL=info
```

### Step 5: Configure Security Group

**RDS Security Group**: Allow inbound PostgreSQL (port 5432) from EC2 security group

**EC2 Security Group**: 
- Inbound: Port 3001 from your IP or 0.0.0.0/0
- Outbound: All traffic

### Step 6: Start Backend with PM2

```bash
# Start with PM2
pm2 start src/dev-server.ts --name flight-api --interpreter ts-node

# OR if you build first:
npm run build
pm2 start dist/dev-server.js --name flight-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it prints
```

### Step 7: Deploy Frontend to S3

```bash
# On your local machine
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-frontend-bucket-name --delete

# Enable static website hosting
aws s3 website s3://your-frontend-bucket-name \
  --index-document index.html \
  --error-document index.html
```

**Update frontend API URL**:
- Edit `frontend/.env.production`:
  ```
  VITE_API_BASE_URL=http://your-ec2-ip:3001
  ```

### Step 8: Configure CORS

Update `backend/src/dev-server.ts` CORS to allow your S3 domain:

```typescript
app.use(cors({
  origin: [
    'http://your-s3-bucket.s3-website-us-east-1.amazonaws.com',
    'http://your-cloudfront-url.cloudfront.net',
    // Add other origins as needed
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Monitoring & Maintenance

### View Logs
```bash
pm2 logs flight-api
```

### Restart Service
```bash
pm2 restart flight-api
```

### Stop Service
```bash
pm2 stop flight-api
```

### Check Status
```bash
pm2 status
```

## Optional: Add Nginx Reverse Proxy

For production, add Nginx in front:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Cost Estimate

- **EC2 t3.micro**: ~$7-10/month (or free tier)
- **RDS**: Already running
- **S3**: ~$0.50/month for static hosting
- **Data Transfer**: Minimal for demo

**Total**: ~$8-11/month (or free tier eligible)

## Next Steps

1. ✅ Create EC2 instance
2. ✅ Install Node.js and dependencies
3. ✅ Clone/setup backend code
4. ✅ Configure environment variables
5. ✅ Start backend with PM2
6. ✅ Deploy frontend to S3
7. ✅ Test endpoints
8. ✅ Configure domain (optional)

## Troubleshooting

**Backend not accessible**:
- Check security group inbound rules
- Check EC2 instance status
- Check PM2 logs: `pm2 logs flight-api`

**Database connection issues**:
- Verify RDS security group allows EC2
- Check DATABASE_HOST in .env
- Test connection: `psql -h $DATABASE_HOST -U postgres -d flight_schedule_pro`

**CORS errors**:
- Update CORS origin in dev-server.ts
- Check frontend API_BASE_URL


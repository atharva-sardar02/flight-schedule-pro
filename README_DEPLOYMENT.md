# Simple Deployment Guide

This project uses a straightforward deployment architecture:

- **Backend**: EC2 instance running Express/Node.js with PM2
- **Frontend**: S3 bucket with static website hosting
- **Database**: AWS RDS PostgreSQL

## 🚀 Quick Deployment Commands

**For quick reference, see:** [`DEPLOY_COMMANDS.md`](./DEPLOY_COMMANDS.md)

### Backend Deployment (EC2)

SSH to EC2, then:
```bash
cd ~/flight-schedule-pro
git pull
cd backend
npm run build
pm2 restart flight-api
```

### Frontend Deployment (Local)

From your local machine:
```powershell
cd D:\gauntlet-ai\flight-schedule-pro
.\scripts\deploy-frontend.ps1 -EC2IP 3.87.74.62 -S3Bucket flight-schedule-pro-frontend
```

## Architecture

```
Frontend (S3) → Backend (EC2) → Database (RDS)
```

## Key Files

- **`DEPLOY_COMMANDS.md`** - ⚡ Quick reference for deployment commands
- `docs/SIMPLE_DEPLOYMENT.md` - Complete deployment guide
- `scripts/deploy-frontend.sh` - Frontend deployment script (Linux/Mac)
- `scripts/deploy-frontend.ps1` - Frontend deployment script (Windows)
- `scripts/ec2-setup.sh` - EC2 backend setup script

## Environment Variables

### Backend (.env on EC2)

```env
NODE_ENV=production
PORT=3001
AWS_REGION=us-east-1

# Database
DATABASE_HOST=your-rds-endpoint.rds.amazonaws.com
DATABASE_NAME=flight_schedule_pro
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password

# Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx

# CORS (comma-separated)
CORS_ALLOWED_ORIGINS=http://your-s3-bucket.s3-website-us-east-1.amazonaws.com

# Secrets Manager ARNs
OPENAI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:...
WEATHERAPI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:...
OPENWEATHERMAP_API_KEY_SECRET_ARN=arn:aws:secretsmanager:...
```

### Frontend (.env.production)

```env
VITE_API_BASE_URL=http://your-ec2-ip:3001
```

## Deployment Commands

### Backend (on EC2)

**After making changes:**
```bash
cd ~/flight-schedule-pro
git pull
cd backend
npm run build
pm2 restart flight-api
```

**Initial setup (one-time):**
```bash
# Build and start
cd ~/flight-schedule-pro/backend
npm run build
pm2 start dist/dev-server.js --name flight-api

# Save and enable on boot
pm2 save
pm2 startup
```

### Frontend (from local machine)

**Windows:**
```powershell
cd D:\gauntlet-ai\flight-schedule-pro
.\scripts\deploy-frontend.ps1 -EC2IP 3.87.74.62 -S3Bucket flight-schedule-pro-frontend
```

**Linux/Mac:**
```bash
cd ~/flight-schedule-pro
./scripts/deploy-frontend.sh 3.87.74.62 flight-schedule-pro-frontend
```

**See [`DEPLOY_COMMANDS.md`](./DEPLOY_COMMANDS.md) for quick reference.**

## Troubleshooting

- **Backend not accessible**: Check EC2 security group allows port 3001
- **Database connection fails**: Verify RDS security group allows EC2 security group
- **CORS errors**: Update `CORS_ALLOWED_ORIGINS` in backend .env and restart
- **Frontend not loading**: Enable static website hosting on S3 bucket

See `docs/SIMPLE_DEPLOYMENT.md` for detailed troubleshooting.


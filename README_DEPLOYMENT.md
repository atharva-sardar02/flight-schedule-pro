# Simple Deployment Guide

This project uses a straightforward deployment architecture:

- **Backend**: EC2 instance running Express/Node.js
- **Frontend**: S3 bucket with static website hosting
- **Database**: AWS RDS PostgreSQL

## Quick Start

1. **Read the full guide**: See `docs/SIMPLE_DEPLOYMENT.md` for complete instructions
2. **Deploy backend**: Follow EC2 setup steps
3. **Deploy frontend**: Use `scripts/deploy-frontend.sh` or `scripts/deploy-frontend.ps1`

## Architecture

```
Frontend (S3) → Backend (EC2) → Database (RDS)
```

## Key Files

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

```bash
# Start
pm2 start src/dev-server.ts --name flight-api --interpreter ts-node

# Or build first
npm run build
pm2 start dist/dev-server.js --name flight-api

# Save and enable on boot
pm2 save
pm2 startup
```

### Frontend (from local machine)

```bash
# Linux/Mac
./scripts/deploy-frontend.sh <EC2-IP> <S3-BUCKET>

# Windows
.\scripts\deploy-frontend.ps1 -EC2IP <EC2-IP> -S3Bucket <S3-BUCKET>
```

## Troubleshooting

- **Backend not accessible**: Check EC2 security group allows port 3001
- **Database connection fails**: Verify RDS security group allows EC2 security group
- **CORS errors**: Update `CORS_ALLOWED_ORIGINS` in backend .env and restart
- **Frontend not loading**: Enable static website hosting on S3 bucket

See `docs/SIMPLE_DEPLOYMENT.md` for detailed troubleshooting.


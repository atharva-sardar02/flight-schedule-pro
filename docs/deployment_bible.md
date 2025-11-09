# Deployment Guide

Quick reference for deploying the Flight Schedule Pro application.

## Prerequisites

- EC2 instance running
- S3 bucket created for frontend
- RDS database configured
- AWS credentials configured
- SSH key file (`.pem`)

---

## 1. SSH to EC2

```bash
ssh -i path/to/your-key.pem ec2-user@YOUR_EC2_IP
```

**Example:**
```bash
ssh -i flight-schedule-pro-key.pem ec2-user@3.87.74.62
```

---

## 2. Deploy Backend

### On EC2 Instance:

```bash
# Navigate to project directory
cd ~/flight-schedule-pro

# Pull latest code
git pull

# Navigate to backend
cd backend

# Install dependencies (if needed)
npm install

# Build TypeScript
npm run build

# Restart PM2
pm2 restart flight-api

# Check status
pm2 status
pm2 logs flight-api --lines 50
```

### Verify Backend is Running:

```bash
# Health check
curl http://localhost:3001/health

# Or from your local machine
curl http://YOUR_EC2_IP:3001/health
```

---

## 3. Deploy Frontend

### On Your Local Machine (Windows PowerShell):

```powershell
# Navigate to project root
cd D:\gauntlet-ai\flight-schedule-pro

# Run deployment script
.\scripts\deploy-frontend.ps1 -EC2IP YOUR_EC2_IP -S3Bucket YOUR_S3_BUCKET_NAME
```

**Example:**
```powershell
.\scripts\deploy-frontend.ps1 -EC2IP 3.87.74.62 -S3Bucket flight-schedule-pro-frontend
```

### What the Script Does:

1. Creates `.env.production` with API URL
2. Builds the frontend (`npm run build`)
3. Uploads files to S3 bucket
4. Sets correct content types

### Frontend URL:

After deployment, access your frontend at:
```
http://YOUR_S3_BUCKET_NAME.s3-website-us-east-1.amazonaws.com
```

---

## Quick Commands Reference

### Backend (on EC2):
```bash
cd ~/flight-schedule-pro/backend
git pull && npm run build && pm2 restart flight-api
```

### Frontend (local):
```powershell
.\scripts\deploy-frontend.ps1 -EC2IP 3.87.74.62 -S3Bucket flight-schedule-pro-frontend
```

### Check Backend Logs:
```bash
pm2 logs flight-api --lines 50
```

### Restart Backend:
```bash
pm2 restart flight-api
```

---

## Troubleshooting

### Backend not starting:
- Check PM2 logs: `pm2 logs flight-api`
- Verify `.env` file exists with correct values
- Check database connection

### Frontend build fails:
- Ensure Node.js and npm are installed
- Run `npm install` in `frontend/` directory
- Check for TypeScript errors

### S3 upload fails:
- Verify AWS credentials are configured
- Check S3 bucket name is correct
- Ensure bucket has public read access for static hosting

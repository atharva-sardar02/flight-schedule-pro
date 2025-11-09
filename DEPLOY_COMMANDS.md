# Quick Deployment Commands

Quick reference for deploying Flight Schedule Pro after making changes.

## 🔌 Connect to EC2

**Windows (PowerShell):**
```powershell
ssh -i "D:\gauntlet-ai\flight-schedule-pro-key.pem" ec2-user@3.87.74.62
```

**Linux/Mac:**
```bash
ssh -i ~/path/to/flight-schedule-pro-key.pem ec2-user@3.87.74.62
```

## 🔄 Backend Deployment (EC2)

**SSH to EC2 first, then run:**

```bash
cd ~/flight-schedule-pro
git pull
cd backend
npm run build
pm2 restart flight-api
```

**Check logs if needed:**
```bash
pm2 logs flight-api
```

## 🎨 Frontend Deployment (Local Machine)

**From your local Windows machine:**

```powershell
cd D:\gauntlet-ai\flight-schedule-pro
.\scripts\deploy-frontend.ps1 -EC2IP 3.87.74.62 -S3Bucket flight-schedule-pro-frontend
```

**Or from Linux/Mac:**

```bash
cd ~/flight-schedule-pro
./scripts/deploy-frontend.sh 3.87.74.62 flight-schedule-pro-frontend
```

## 📋 Full Deployment Workflow

1. **Make changes locally**
2. **Commit and push to GitHub:**
   ```bash
   git add -A
   git commit -m "feat: your changes"
   git push
   ```

3. **Deploy backend (SSH to EC2):**
   ```bash
   cd ~/flight-schedule-pro
   git pull
   cd backend
   npm run build
   pm2 restart flight-api
   ```

4. **Deploy frontend (from local machine):**
   ```powershell
   cd D:\gauntlet-ai\flight-schedule-pro
   .\scripts\deploy-frontend.ps1 -EC2IP 3.87.74.62 -S3Bucket flight-schedule-pro-frontend
   ```

## 🔍 Verify Deployment

- **Backend:** Check PM2 status: `pm2 status`
- **Frontend:** Visit: `http://flight-schedule-pro-frontend.s3-website-us-east-1.amazonaws.com`
- **API Health:** `http://3.87.74.62:3001/health`

## 🛠️ Common Operations

### Restart Backend Only
```bash
pm2 restart flight-api
```

### View Backend Logs
```bash
pm2 logs flight-api --lines 50
```

### Check Backend Status
```bash
pm2 status
```

### Rebuild Backend (if TypeScript errors)
```bash
cd ~/flight-schedule-pro/backend
npm run build
pm2 restart flight-api
```

### Frontend Only (no backend changes)
```powershell
cd D:\gauntlet-ai\flight-schedule-pro
.\scripts\deploy-frontend.ps1 -EC2IP 3.87.74.62 -S3Bucket flight-schedule-pro-frontend
```

## 📝 Notes

- **Backend IP:** `3.87.74.62:3001`
- **Frontend URL:** `http://flight-schedule-pro-frontend.s3-website-us-east-1.amazonaws.com`
- **S3 Bucket:** `flight-schedule-pro-frontend`
- Always pull latest code before deploying
- Check PM2 logs if backend doesn't start
- Frontend deployment script handles build and S3 upload automatically


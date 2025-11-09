# Frontend Setup Guide

This guide helps you set up the frontend for deployment to S3 while the backend is being configured on EC2.

## Prerequisites

- AWS CLI configured with credentials
- Node.js 18+ installed locally
- EC2 public IP address (you'll need this for the API URL)

## Quick Setup Steps

### 1. Create S3 Bucket

**Option A: Using the setup script (Recommended)**

```bash
# Linux/Mac
./scripts/setup-s3-frontend.sh flight-schedule-pro-frontend us-east-1

# Windows PowerShell
.\scripts\setup-s3-frontend.ps1 -BucketName flight-schedule-pro-frontend -Region us-east-1
```

**Option B: Manual setup via AWS Console**

1. Go to **S3 Console** → **Create bucket**
2. **Bucket name**: `flight-schedule-pro-frontend` (must be globally unique)
3. **Region**: Same as EC2 (e.g., `us-east-1`)
4. **Block Public Access**: **Uncheck all** (we need public access for static hosting)
5. **Create bucket**

6. **Enable Static Website Hosting**:
   - Click on bucket → **Properties** tab
   - Scroll to **Static website hosting**
   - **Edit** → **Enable**
   - **Index document**: `index.html`
   - **Error document**: `index.html` (for React routing)
   - **Save changes**

7. **Set Bucket Policy** (for public read access):
   - Click on bucket → **Permissions** tab
   - **Bucket policy** → **Edit**
   - Paste this policy (replace `BUCKET-NAME` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET-NAME/*"
    }
  ]
}
```

### 2. Prepare Frontend Build

The frontend is already configured to build for production. You just need:

1. **Get EC2 IP address** (from your EC2 setup)
2. **Build and deploy** (see step 3)

### 3. Deploy Frontend to S3

**Option A: Using the deployment script (Recommended)**

```bash
# Linux/Mac
./scripts/deploy-frontend.sh <EC2-PUBLIC-IP> flight-schedule-pro-frontend

# Windows PowerShell
.\scripts\deploy-frontend.ps1 -EC2IP <EC2-PUBLIC-IP> -S3Bucket flight-schedule-pro-frontend
```

**Option B: Manual deployment**

```bash
cd frontend

# Create production environment file
echo "VITE_API_BASE_URL=http://<EC2-PUBLIC-IP>:3001" > .env.production

# Build frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://flight-schedule-pro-frontend --delete

# Set proper content types
aws s3 cp s3://flight-schedule-pro-frontend/index.html \
  s3://flight-schedule-pro-frontend/index.html \
  --content-type "text/html" --metadata-directive REPLACE
```

### 4. Configure Backend CORS

Once you have the S3 website URL, add it to your backend `.env` file on EC2:

```bash
# On EC2
nano backend/.env
```

Add or update:

```env
CORS_ALLOWED_ORIGINS=http://flight-schedule-pro-frontend.s3-website-us-east-1.amazonaws.com,http://localhost:3000
```

Then restart the backend:

```bash
pm2 restart flight-api
```

### 5. Test Frontend

1. **Open frontend URL**: `http://flight-schedule-pro-frontend.s3-website-us-east-1.amazonaws.com`
2. **Test login**: Try logging in with test credentials
3. **Test API calls**: Create a booking or check availability

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. **Check CORS configuration** in backend `.env`:
   ```env
   CORS_ALLOWED_ORIGINS=http://your-s3-url.s3-website-region.amazonaws.com
   ```

2. **Restart backend**:
   ```bash
   pm2 restart flight-api
   ```

3. **Verify S3 URL** matches exactly (including `http://` and no trailing slash)

### Frontend Not Loading

1. **Check S3 bucket**:
   - Static website hosting is enabled
   - Bucket policy allows public read access
   - Block Public Access is disabled

2. **Check files uploaded**:
   ```bash
   aws s3 ls s3://flight-schedule-pro-frontend/
   ```
   Should see `index.html` and `assets/` directory

### API Connection Errors

1. **Check EC2 IP** in `.env.production`:
   ```env
   VITE_API_BASE_URL=http://<EC2-IP>:3001
   ```

2. **Rebuild and redeploy**:
   ```bash
   cd frontend
   npm run build
   aws s3 sync dist/ s3://flight-schedule-pro-frontend --delete
   ```

3. **Check backend is running**:
   ```bash
   # On EC2
   pm2 status
   curl http://localhost:3001/health
   ```

## Updating Frontend

To update the frontend after making changes:

```bash
# Rebuild
cd frontend
npm run build

# Redeploy
aws s3 sync dist/ s3://flight-schedule-pro-frontend --delete
```

Or use the deployment script:

```bash
./scripts/deploy-frontend.sh <EC2-IP> flight-schedule-pro-frontend
```

## Next Steps

After frontend is deployed:

1. ✅ Test all features (login, bookings, availability, rescheduling)
2. ✅ Set up CloudFront (optional, for HTTPS and custom domain)
3. ✅ Configure custom domain (optional)
4. ✅ Set up monitoring and alerts

## Cost Estimate

- **S3 Storage**: ~$0.023/GB/month (minimal for static files)
- **S3 Requests**: ~$0.0004 per 1,000 GET requests
- **Data Transfer**: First 1GB free, then ~$0.09/GB

**Total**: ~$0.50-2/month for typical usage




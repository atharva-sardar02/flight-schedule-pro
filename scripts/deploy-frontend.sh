#!/bin/bash
# Simple Frontend Deployment Script
# Usage: ./deploy-frontend.sh <EC2-PUBLIC-IP> <S3-BUCKET-NAME>

set -e

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <EC2-PUBLIC-IP> <S3-BUCKET-NAME>"
    echo "Example: $0 54.123.45.67 flight-schedule-pro-frontend"
    exit 1
fi

EC2_IP=$1
S3_BUCKET=$2

echo "=========================================="
echo "Deploying Frontend to S3"
echo "=========================================="
echo "EC2 IP: $EC2_IP"
echo "S3 Bucket: $S3_BUCKET"
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend" || exit 1

# Create production environment file
echo "Creating .env.production..."
echo "VITE_API_BASE_URL=http://$EC2_IP:3001" > .env.production
echo "✅ Environment file created"

# Build frontend
echo ""
echo "Building frontend..."
npm run build
echo "✅ Build complete"

# Upload to S3
echo ""
echo "Uploading to S3..."
aws s3 sync dist/ s3://$S3_BUCKET --delete
echo "✅ Upload complete"

# Set proper content types
echo ""
echo "Setting content types..."
aws s3 cp s3://$S3_BUCKET/index.html s3://$S3_BUCKET/index.html --content-type "text/html" --metadata-directive REPLACE

# Get website URL
REGION=$(aws s3api get-bucket-location --bucket $S3_BUCKET --query LocationConstraint --output text)
if [ "$REGION" == "None" ]; then
    REGION="us-east-1"
fi

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Frontend URL: http://$S3_BUCKET.s3-website-$REGION.amazonaws.com"
echo ""
echo "Make sure to:"
echo "1. Enable static website hosting on the S3 bucket"
echo "2. Update CORS in backend to allow this domain"
echo "3. Restart backend: pm2 restart flight-api"
echo ""


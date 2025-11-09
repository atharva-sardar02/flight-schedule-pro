#!/bin/bash
# Setup S3 Bucket for Frontend Hosting
# Usage: ./setup-s3-frontend.sh <BUCKET-NAME> <REGION>

set -e

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <BUCKET-NAME> [REGION]"
    echo "Example: $0 flight-schedule-pro-frontend us-east-1"
    exit 1
fi

BUCKET_NAME=$1
REGION=${2:-us-east-1}

echo "=========================================="
echo "Setting up S3 Bucket for Frontend"
echo "=========================================="
echo "Bucket Name: $BUCKET_NAME"
echo "Region: $REGION"
echo ""

# Create bucket
echo "Creating S3 bucket..."
if [ "$REGION" == "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
else
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" --create-bucket-configuration LocationConstraint="$REGION"
fi
echo "✅ Bucket created"

# Enable static website hosting
echo ""
echo "Enabling static website hosting..."
aws s3 website s3://"$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html
echo "✅ Static website hosting enabled"

# Set bucket policy for public read access
echo ""
echo "Setting bucket policy for public read access..."
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file:///tmp/bucket-policy.json
rm /tmp/bucket-policy.json
echo "✅ Bucket policy set"

# Disable Block Public Access (required for static website hosting)
echo ""
echo "Disabling Block Public Access..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
echo "✅ Block Public Access disabled"

# Get website URL
echo ""
echo "=========================================="
echo "✅ S3 Bucket Setup Complete!"
echo "=========================================="
echo ""
echo "Bucket Name: $BUCKET_NAME"
echo "Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo ""
echo "Next steps:"
echo "1. Deploy frontend: ./scripts/deploy-frontend.sh <EC2-IP> $BUCKET_NAME"
echo "2. Add CORS_ALLOWED_ORIGINS to backend .env: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo "3. Restart backend: pm2 restart flight-api"
echo ""


# Setup S3 Bucket for Frontend Hosting (PowerShell)
# Usage: .\setup-s3-frontend.ps1 -BucketName <BUCKET-NAME> [-Region <REGION>]

param(
    [Parameter(Mandatory=$true)]
    [string]$BucketName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "=========================================="
Write-Host "Setting up S3 Bucket for Frontend"
Write-Host "=========================================="
Write-Host "Bucket Name: $BucketName"
Write-Host "Region: $Region"
Write-Host ""

# Create bucket
Write-Host "Creating S3 bucket..."
if ($Region -eq "us-east-1") {
    aws s3api create-bucket --bucket $BucketName --region $Region
} else {
    aws s3api create-bucket --bucket $BucketName --region $Region --create-bucket-configuration LocationConstraint=$Region
}
Write-Host "✅ Bucket created"

# Enable static website hosting
Write-Host ""
Write-Host "Enabling static website hosting..."
aws s3 website "s3://$BucketName" --index-document index.html --error-document index.html
Write-Host "✅ Static website hosting enabled"

# Set bucket policy for public read access
Write-Host ""
Write-Host "Setting bucket policy for public read access..."
$policyJson = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BucketName/*"
    }
  ]
}
"@

# Use a temporary file in current directory (works better with AWS CLI on Windows)
$tempFile = "bucket-policy-temp.json"
$policyJson | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline

try {
    # Use file:// protocol with relative path
    aws s3api put-bucket-policy --bucket $BucketName --policy "file://$tempFile" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Bucket policy set"
    } else {
        Write-Host "⚠️  Error setting bucket policy. You may need to set it manually via AWS Console."
        Write-Host "   Go to S3 → $BucketName → Permissions → Bucket policy"
    }
} catch {
    Write-Host "⚠️  Error setting bucket policy. You may need to set it manually via AWS Console."
    Write-Host "   Go to S3 → $BucketName → Permissions → Bucket policy"
} finally {
    Remove-Item $tempFile -ErrorAction SilentlyContinue
}

# Disable Block Public Access (required for static website hosting)
Write-Host ""
Write-Host "Disabling Block Public Access..."
aws s3api put-public-access-block `
    --bucket $BucketName `
    --public-access-block-configuration `
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
Write-Host "✅ Block Public Access disabled"

# Get website URL
Write-Host ""
Write-Host "=========================================="
Write-Host "✅ S3 Bucket Setup Complete!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Bucket Name: $BucketName"
Write-Host "Website URL: http://$BucketName.s3-website-$Region.amazonaws.com"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Deploy frontend: .\scripts\deploy-frontend.ps1 -EC2IP <IP> -S3Bucket $BucketName"
Write-Host "2. Add CORS_ALLOWED_ORIGINS to backend .env: http://$BucketName.s3-website-$Region.amazonaws.com"
Write-Host "3. Restart backend: pm2 restart flight-api"
Write-Host ""


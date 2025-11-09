# Upload Lambda Package to S3

Your `lambda-package.zip` (6.53 MB) is ready to upload to AWS S3.

## Step 1: Upload to S3

Replace `your-bucket-name` with your actual S3 bucket name:

```powershell
aws s3 cp lambda-package.zip s3://your-bucket-name/lambda-package.zip
```

**Example:**
```powershell
aws s3 cp lambda-package.zip s3://flight-schedule-pro-staging-code/lambda-package.zip
```

## Step 2: Verify Upload

```powershell
aws s3 ls s3://your-bucket-name/lambda-package.zip
```

## Step 3: Note the S3 Location

You'll need this information for CloudFormation:

- **S3 Bucket:** `your-bucket-name`
- **S3 Key:** `lambda-package.zip`
- **S3 URI:** `s3://your-bucket-name/lambda-package.zip`

## Step 4: Use in CloudFormation

In your Lambda CloudFormation template, use:

```yaml
Code:
  S3Bucket: your-bucket-name
  S3Key: lambda-package.zip
```

Or if using AWS CLI to update Lambda:

```powershell
aws lambda update-function-code `
  --function-name your-function-name `
  --s3-bucket your-bucket-name `
  --s3-key lambda-package.zip
```

## Troubleshooting

### "Access Denied" error
- Check your AWS credentials: `aws sts get-caller-identity`
- Verify bucket permissions
- Ensure bucket exists: `aws s3 ls s3://your-bucket-name`

### "Bucket does not exist"
- Create the bucket first: `aws s3 mb s3://your-bucket-name`
- Or use an existing bucket

### Upload is slow
- 6.53 MB should upload quickly
- Check your internet connection
- Consider using `--storage-class STANDARD_IA` for cost savings (if not frequently accessed)



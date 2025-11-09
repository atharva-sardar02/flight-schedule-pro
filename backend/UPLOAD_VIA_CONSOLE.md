# Upload Lambda Package to S3 via AWS Console

## Step-by-Step Guide

### Step 1: Open AWS S3 Console

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Sign in with your AWS account
3. In the search bar at the top, type **"S3"**
4. Click on **"S3"** service

### Step 2: Navigate to Your Bucket

1. In the S3 buckets list, find: **`flight-schedule-pro-lambda-code`**
2. Click on the bucket name to open it

**If the bucket doesn't exist:**
- Click **"Create bucket"** button
- Bucket name: `flight-schedule-pro-lambda-code`
- AWS Region: `us-east-1`
- Click **"Create bucket"** at the bottom

### Step 3: Create the `staging` Folder

1. Inside the bucket, click **"Create folder"** button
2. Folder name: `staging`
3. Click **"Create folder"**

**Note:** If the `staging` folder already exists, skip this step.

### Step 4: Upload the ZIP File

1. Click into the **`staging`** folder
2. Click **"Upload"** button (top right)
3. Click **"Add files"** or **"Add folder"**
4. Navigate to: `D:\gauntlet-ai\flight-schedule-pro\backend\`
5. Select: **`lambda-package.zip`**
6. Click **"Open"**

### Step 5: Rename the File (Important!)

**Before uploading**, you need to rename it:

1. In the upload dialog, you'll see the file listed
2. Click on the file name or the **"Actions"** button next to it
3. Change the name from `lambda-package.zip` to **`lambda-code.zip`**
4. Or after upload, you can rename it:
   - Select the file
   - Click **"Actions"** → **"Rename"**
   - Change to: `lambda-code.zip`

### Step 6: Configure Upload Settings (Optional)

1. Scroll down in the upload dialog
2. **Storage class:** Leave as "Standard" (default)
3. **Encryption:** Leave as default (or choose "Server-side encryption with Amazon S3 managed keys")
4. **Permissions:** Leave as default (bucket owner gets full control)

### Step 7: Upload

1. Scroll to bottom of upload dialog
2. Click **"Upload"** button
3. Wait for upload to complete (should take 5-15 seconds for 6.5 MB)

**You'll see:**
- Progress bar showing upload status
- "Upload succeeded" message when done

### Step 8: Verify Upload

1. You should see **`lambda-code.zip`** in the `staging` folder
2. Check the file size: Should be **6,531,823 bytes** (6.23 MB)
3. Check the "Last modified" date: Should be today's date/time

---

## Visual Guide

```
AWS Console
  └─ S3 Service
      └─ flight-schedule-pro-lambda-code (bucket)
          └─ staging (folder)
              └─ lambda-code.zip ✅ (your file)
```

---

## Quick Checklist

- [ ] Opened S3 Console
- [ ] Found/created bucket: `flight-schedule-pro-lambda-code`
- [ ] Created/opened `staging` folder
- [ ] Uploaded `lambda-package.zip` from `D:\gauntlet-ai\flight-schedule-pro\backend\`
- [ ] Renamed file to `lambda-code.zip`
- [ ] Verified file size: ~6.5 MB
- [ ] Verified location: `s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip`

---

## What Your File Contains

✅ **All compiled JavaScript code** from `dist/`  
✅ **All production node_modules** (AWS SDK, PostgreSQL, OpenAI, etc.)  
✅ **Complete folder structure**  
✅ **Everything Lambda needs to run**

---

## After Upload

Once uploaded, your Lambda functions can use this package:

**S3 Location:**
- **Bucket:** `flight-schedule-pro-lambda-code`
- **Key:** `staging/lambda-code.zip`
- **Full URI:** `s3://flight-schedule-pro-lambda-code/staging/lambda-code.zip`

**Next Steps:**
1. Deploy Lambda stack via CloudFormation (it will reference this S3 location)
2. Or update Lambda functions directly using this S3 location

---

## Troubleshooting

### Can't Find the Bucket
- Make sure you're in the correct AWS region (`us-east-1`)
- Check if you have permissions to view S3 buckets
- Try creating a new bucket with the name: `flight-schedule-pro-lambda-code`

### Upload Fails
- Check file size (should be ~6.5 MB)
- Check your internet connection
- Try uploading again
- Check if you have write permissions to the bucket

### Wrong File Name
- After upload, select the file
- Click **"Actions"** → **"Rename"**
- Change to: `lambda-code.zip`

### Want to Verify Contents
- You can download the file back to verify
- Or check the file size matches (6,531,823 bytes)

---

**That's it!** Your Lambda package is now in S3 and ready for deployment. 🚀




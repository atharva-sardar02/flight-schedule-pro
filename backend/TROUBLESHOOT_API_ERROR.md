# Troubleshooting "Internal server error"

## Common Causes

### 1. Timeout Too Low (Most Likely!)
Your API function has only **3 seconds timeout** - this is too low!

**Fix:**
- Lambda Console → API function → Configuration → General configuration → Edit
- Change **Timeout** from `3 seconds` to `30 seconds`
- Click **Save**

### 2. Database Connection Issues
Lambda can't connect to RDS.

**Check:**
- Is Lambda in the same VPC as RDS?
- Are security groups configured correctly?
- Is RDS endpoint correct?

### 3. Missing Environment Variables
Some required env vars might be missing.

**Verify:**
- Lambda Console → Configuration → Environment variables
- Check all 12 variables are present

### 4. Code Error
Lambda function is crashing.

**Check CloudWatch Logs:**
```powershell
aws logs tail /aws/lambda/flight-schedule-pro-staging-api --follow --region us-east-1
```

### 5. Handler Path Issue
Handler might not be finding the function.

**Verify:**
- Handler should be: `functions.api.handler`
- Check in Runtime settings

---

## Quick Fix Steps

### Step 1: Check Logs
```powershell
aws logs tail /aws/lambda/flight-schedule-pro-staging-api --since 10m --region us-east-1
```

### Step 2: Update Timeout (CRITICAL!)
1. Lambda Console → `flight-schedule-pro-staging-api`
2. Configuration → General configuration → Edit
3. Timeout: `3 seconds` → `30 seconds`
4. Memory: `128 MB` → `512 MB`
5. Save

### Step 3: Test Again
- Refresh the browser
- Check if error is resolved

### Step 4: If Still Failing
- Check CloudWatch logs for specific error message
- Look for database connection errors
- Check environment variables

---

## Most Likely Issue

**Timeout is too low (3 seconds)** - API calls to database take longer than 3 seconds, causing timeout.

**Fix immediately:** Update timeout to 30 seconds!


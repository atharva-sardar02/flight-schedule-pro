# Next Steps After Triggers Configuration

## ✅ What's Done

- ✅ Lambda functions created (3 functions)
- ✅ Code uploaded from S3
- ✅ Handlers configured
- ✅ Environment variables set
- ✅ Triggers configured (API Gateway, EventBridge, SNS)

---

## 🔧 Step 1: Update Function Settings (Important!)

Your functions currently have low timeout and memory. Update them:

### For API Function (`flight-schedule-pro-staging-api`):

1. **Lambda Console** → Select function
2. **Configuration** tab → **General configuration** → **Edit**
3. Update:
   - **Timeout:** Change from `3 seconds` to `30 seconds`
   - **Memory:** Change from `128 MB` to `512 MB`
4. Click **"Save"**

### For Weather Monitor (`flight-schedule-pro-staging-weather-monitor`):

1. **Lambda Console** → Select function
2. **Configuration** tab → **General configuration** → **Edit**
3. Update:
   - **Timeout:** Change from `3 seconds` to `5 minutes` (300 seconds)
   - **Memory:** Change from `128 MB` to `256 MB`
4. Click **"Save"**

### For Notifications (`flight-schedule-pro-staging-notifications`):

1. **Lambda Console** → Select function
2. **Configuration** tab → **General configuration** → **Edit**
3. Update:
   - **Timeout:** Change from `3 seconds` to `30 seconds`
   - **Memory:** Change from `128 MB` to `256 MB`
4. Click **"Save"**

---

## 🧪 Step 2: Test Your Functions

### Test API Function:

1. **Get API Gateway URL:**
   - Go to Lambda function → **Configuration** → **Triggers**
   - Click on the API Gateway trigger
   - Copy the **API endpoint** URL
   - Format: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/staging`

2. **Test Health Endpoint:**
   ```powershell
   # Replace YOUR_API_URL with the actual URL
   Invoke-WebRequest -Uri "YOUR_API_URL/health" -Method GET
   ```

   Or test in browser:
   - Open: `https://YOUR_API_URL/health`
   - Should return success response

### Test Weather Monitor:

1. **Check CloudWatch Logs:**
   ```powershell
   aws logs tail /aws/lambda/flight-schedule-pro-staging-weather-monitor --follow --region us-east-1
   ```

2. **Or trigger manually:**
   - Lambda Console → Select function
   - **Test** tab → Create test event → **Test**

### Test Notifications:

1. **Send test SNS message:**
   ```powershell
   aws sns publish `
     --topic-arn arn:aws:sns:us-east-1:971422717446:flight-schedule-pro-staging-alerts `
     --message "Test notification" `
     --region us-east-1
   ```

2. **Check Lambda logs:**
   ```powershell
   aws logs tail /aws/lambda/flight-schedule-pro-staging-notifications --follow --region us-east-1
   ```

---

## 🔐 Step 3: Configure API Gateway Routes (If Needed)

If your API Gateway doesn't have routes configured:

1. **Go to API Gateway Console**
   - Search for "API Gateway" in AWS Console
   - Find your API (created by Lambda trigger)

2. **Create Routes:**
   - Click on your API
   - Create routes for:
     - `GET /health`
     - `POST /auth/login`
     - `POST /auth/register`
     - `GET /bookings`
     - `POST /bookings`
     - etc.

3. **Deploy API:**
   - Click **"Deploy"** button
   - Select stage: `staging`
   - Click **"Deploy"**

---

## 📊 Step 4: Verify Everything Works

### Quick Health Check:

```powershell
# Test API endpoint
$apiUrl = "YOUR_API_GATEWAY_URL"
Invoke-WebRequest -Uri "$apiUrl/health" -Method GET

# Check Lambda logs
aws logs tail /aws/lambda/flight-schedule-pro-staging-api --since 5m --region us-east-1
```

### Check Function Status:

```powershell
# Check all functions
aws lambda get-function --function-name flight-schedule-pro-staging-api --region us-east-1 --query 'Configuration.[FunctionName,LastUpdateStatus,State]' --output table
aws lambda get-function --function-name flight-schedule-pro-staging-weather-monitor --region us-east-1 --query 'Configuration.[FunctionName,LastUpdateStatus,State]' --output table
aws lambda get-function --function-name flight-schedule-pro-staging-notifications --region us-east-1 --query 'Configuration.[FunctionName,LastUpdateStatus,State]' --output table
```

---

## 🎯 Step 5: Connect Frontend (If Ready)

1. **Update Frontend API URL:**
   - Get API Gateway URL from Lambda trigger
   - Update frontend `.env` or config file
   - Point to: `https://YOUR_API_URL/staging`

2. **Update Cognito Settings:**
   - User Pool ID: `us-east-1_f6h1XdY8u`
   - Client ID: `28tqtmpt1s0mrkcj4p5divnlh8`

---

## 📝 Step 6: Monitor and Debug

### View Logs:

```powershell
# API logs
aws logs tail /aws/lambda/flight-schedule-pro-staging-api --follow --region us-east-1

# Weather monitor logs
aws logs tail /aws/lambda/flight-schedule-pro-staging-weather-monitor --follow --region us-east-1

# Notifications logs
aws logs tail /aws/lambda/flight-schedule-pro-staging-notifications --follow --region us-east-1
```

### Check Metrics:

1. **Lambda Console** → Select function
2. **Monitor** tab
3. View:
   - Invocations
   - Duration
   - Errors
   - Throttles

---

## ✅ Final Checklist

- [ ] Updated timeout and memory for all 3 functions
- [ ] Tested API endpoint (health check works)
- [ ] Verified EventBridge schedule is running
- [ ] Tested SNS trigger
- [ ] API Gateway routes configured (if needed)
- [ ] Frontend connected (if ready)
- [ ] Logs are being generated
- [ ] No errors in CloudWatch logs

---

## 🚨 Common Issues to Check

### API Returns 502/503:
- Check Lambda timeout (should be 30 seconds)
- Check Lambda memory (should be 512 MB)
- Check CloudWatch logs for errors

### Weather Monitor Not Running:
- Check EventBridge rule is enabled
- Check schedule expression: `rate(10 minutes)`
- Check CloudWatch logs

### Notifications Not Working:
- Check SNS topic exists
- Check Lambda has SNS permission
- Check CloudWatch logs

---

## 🎉 You're Almost Done!

Once you've:
1. Updated function settings (timeout/memory)
2. Tested the endpoints
3. Verified logs

**Your Lambda backend is fully deployed and ready!** 🚀

Next: Test the full application flow (register → login → create booking → etc.)


# Configure Lambda Triggers via AWS Console - Exact Steps

## Trigger 1: API Gateway for API Function

### Function: `flight-schedule-pro-staging-api`

#### Step-by-Step:

1. **Open Lambda Console**
   - Go to [AWS Console](https://console.aws.amazon.com/)
   - Search for "Lambda" and click it
   - Make sure region is `us-east-1` (top right)

2. **Select the Function**
   - Click on function name: `flight-schedule-pro-staging-api`

3. **Add Trigger**
   - Click **"Configuration"** tab (top menu)
   - Click **"Triggers"** in the left sidebar
   - Click **"Add trigger"** button (top right)

4. **Configure API Gateway**
   - **Trigger configuration:** Select **"API Gateway"**
   - **API:** Select **"Create an API"** (if you don't have one yet)
   - **API type:** Select **"REST API"**
   - **Security:** Select **"Open"** (for now - you can secure later with Cognito)
   - **Deployment stage:** Leave as `default` or type `staging`
   - **Description:** (optional) "API Gateway for Flight Schedule Pro staging"

5. **Create**
   - Click **"Add"** button (bottom right)

6. **Note the API Endpoint**
   - After creation, you'll see the API endpoint URL
   - It will look like: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/staging`
   - **Copy this URL** - you'll need it for the frontend!

---

## Trigger 2: EventBridge Schedule for Weather Monitor

### Function: `flight-schedule-pro-staging-weather-monitor`

#### Step-by-Step:

1. **Open Lambda Console**
   - Go to Lambda service
   - Click on function: `flight-schedule-pro-staging-weather-monitor`

2. **Add Trigger**
   - Click **"Configuration"** tab
   - Click **"Triggers"** in left sidebar
   - Click **"Add trigger"** button

3. **Configure EventBridge**
   - **Trigger configuration:** Select **"EventBridge (CloudWatch Events)"**
   - **Rule:** Select **"Create new rule"**
   - **Rule name:** Type `flight-schedule-pro-staging-weather-monitor-schedule`
   - **Rule description:** (optional) "Runs weather monitor every 10 minutes"
   - **Rule type:** Select **"Schedule expression"**
   - **Schedule expression:** Type `rate(10 minutes)`
     - Alternative: `cron(*/10 * * * ? *)` (same thing, cron format)

4. **Enable Trigger**
   - Make sure **"Enable trigger"** checkbox is checked (should be by default)

5. **Create**
   - Click **"Add"** button

6. **Verify**
   - You should see the trigger listed under "Triggers"
   - Status should be "Enabled"
   - Next execution time will be shown

---

## Trigger 3: SNS Topic for Notifications

### Function: `flight-schedule-pro-staging-notifications`

#### Step-by-Step:

### Option A: If SNS Topic Already Exists

1. **Open Lambda Console**
   - Go to Lambda service
   - Click on function: `flight-schedule-pro-staging-notifications`

2. **Add Trigger**
   - Click **"Configuration"** tab
   - Click **"Triggers"** in left sidebar
   - Click **"Add trigger"** button

3. **Configure SNS**
   - **Trigger configuration:** Select **"SNS"**
   - **SNS topic:** Select your existing topic from dropdown
     - Look for: `flight-schedule-pro-staging-notifications` or similar
   - **Enable trigger:** Checked (default)

4. **Create**
   - Click **"Add"** button

### Option B: Create SNS Topic First (if it doesn't exist)

#### Part 1: Create SNS Topic

1. **Open SNS Console**
   - Go to [AWS Console](https://console.aws.amazon.com/)
   - Search for "SNS" and click it
   - Make sure region is `us-east-1`

2. **Create Topic**
   - Click **"Topics"** in left sidebar
   - Click **"Create topic"** button

3. **Configure Topic**
   - **Type:** Select **"Standard"**
   - **Name:** Type `flight-schedule-pro-staging-notifications`
   - **Display name:** (optional) `Flight Schedule Pro Staging Notifications`
   - **Encryption:** Leave as default (no encryption) or configure if needed

4. **Create**
   - Click **"Create topic"** button (bottom right)

5. **Note the Topic ARN**
   - Copy the Topic ARN (you'll see it after creation)
   - Format: `arn:aws:sns:us-east-1:971422717446:flight-schedule-pro-staging-notifications`

#### Part 2: Connect Lambda to SNS

1. **Go Back to Lambda**
   - Return to Lambda Console
   - Click on function: `flight-schedule-pro-staging-notifications`

2. **Add Trigger**
   - Click **"Configuration"** tab
   - Click **"Triggers"** in left sidebar
   - Click **"Add trigger"** button

3. **Configure SNS**
   - **Trigger configuration:** Select **"SNS"**
   - **SNS topic:** Select the topic you just created: `flight-schedule-pro-staging-notifications`
   - **Enable trigger:** Checked**

4. **Create**
   - Click **"Add"** button

5. **Confirm Permission**
   - AWS will automatically add permission for SNS to invoke Lambda
   - You may see a confirmation dialog - click **"Add"** or **"OK"**

---

## Visual Guide: Where to Click

### For All Triggers:

```
Lambda Console
  └─ Select Function
      └─ Configuration Tab (top menu)
          └─ Triggers (left sidebar)
              └─ Add trigger (top right button)
                  └─ Select trigger type
                      └─ Configure
                          └─ Add button
```

---

## Verification Checklist

After setting up all triggers, verify:

### API Function:
- [ ] Trigger shows "API Gateway" type
- [ ] API endpoint URL is visible
- [ ] Status is "Enabled"
- [ ] Note the API endpoint URL for frontend

### Weather Monitor:
- [ ] Trigger shows "EventBridge (CloudWatch Events)" type
- [ ] Rule name: `flight-schedule-pro-staging-weather-monitor-schedule`
- [ ] Schedule: `rate(10 minutes)`
- [ ] Status is "Enabled"
- [ ] Next execution time is shown

### Notifications:
- [ ] Trigger shows "SNS" type
- [ ] Topic name: `flight-schedule-pro-staging-notifications`
- [ ] Status is "Enabled"
- [ ] Permission granted (should be automatic)

---

## Troubleshooting

### API Gateway: "Permission denied"
- Lambda needs permission to be invoked by API Gateway
- This is usually automatic, but if it fails:
  - Go to IAM Console
  - Find the Lambda execution role
  - Add API Gateway invoke permission

### EventBridge: "Rule not found"
- Make sure you selected "Create new rule"
- Check the rule name doesn't have special characters
- Verify schedule expression syntax: `rate(10 minutes)`

### SNS: "Topic not found"
- Make sure you created the SNS topic first
- Check you're in the same region (`us-east-1`)
- Verify topic name matches exactly

### SNS: "Permission denied"
- Lambda needs permission to be invoked by SNS
- This should be automatic when adding trigger
- If it fails, manually add permission in SNS topic → Subscriptions

---

## Quick Reference: Schedule Expressions

For EventBridge, you can use:

- `rate(10 minutes)` - Every 10 minutes
- `rate(5 minutes)` - Every 5 minutes (for testing)
- `rate(1 hour)` - Every hour
- `cron(*/10 * * * ? *)` - Every 10 minutes (cron format)
- `cron(0 * * * ? *)` - Every hour at minute 0

---

## Next Steps After Triggers

Once all triggers are configured:

1. **Test API Gateway**
   - Use the API endpoint URL
   - Test with: `GET /health` endpoint

2. **Test Weather Monitor**
   - Wait for scheduled execution (or trigger manually)
   - Check CloudWatch logs

3. **Test Notifications**
   - Send test SNS message
   - Check Lambda logs

---

**Follow these exact steps and all triggers will be configured!** 🚀




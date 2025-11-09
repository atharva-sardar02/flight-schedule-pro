# ✅ Complete Environment Variables - READY TO COPY

## All Values Retrieved from AWS

✅ **All values confirmed and ready to use!**

---

## 📋 EXACT Environment Variables for ALL 3 Lambda Functions

**Copy these EXACTLY into each Lambda function's environment variables:**

### For: `flight-schedule-pro-staging-api`
### For: `flight-schedule-pro-staging-weather-monitor`  
### For: `flight-schedule-pro-staging-notifications`

---

## 🔥 Copy-Paste Ready Values

**Add these one by one in Lambda Console:**

| Key | Value |
|-----|-------|
| `NODE_ENV` | `staging` |
| `DATABASE_HOST` | `flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com` |
| `DATABASE_NAME` | `flight_schedule_pro` |
| `DATABASE_USER` | `postgres` |
| `DATABASE_PASSWORD_SECRET_ARN` | `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/database-credentials-gYqeBF` |
| `COGNITO_USER_POOL_ID` | `us-east-1_f6h1XdY8u` |
| `COGNITO_CLIENT_ID` | `28tqtmpt1s0mrkcj4p5divnlh8` |
| `OPENAI_API_KEY_SECRET_ARN` | `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openai-api-key-2Si5nA` |
| `OPENWEATHERMAP_API_KEY_SECRET_ARN` | `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openweathermap-api-key-0pDF8m` |
| `WEATHERAPI_API_KEY_SECRET_ARN` | `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/weatherapi-com-key-a5RNBd` |
| `SES_REGION` | `us-east-1` |
| `LOG_LEVEL` | `info` |

---

## 📝 Step-by-Step Instructions

### For Each of the 3 Functions:

1. **Open Lambda Console** → Select function
2. **Configuration** tab → **Environment variables** → **Edit**
3. Click **"Add environment variable"** for each row above
4. **Copy EXACTLY** as shown (case-sensitive, no extra spaces!)
5. Click **"Save"**

**Repeat for all 3 functions:**
- ✅ `flight-schedule-pro-staging-api`
- ✅ `flight-schedule-pro-staging-weather-monitor`
- ✅ `flight-schedule-pro-staging-notifications`

---

## ✅ Verification

After adding, verify:
- [ ] All 12 variables added to each function
- [ ] No typos in values
- [ ] All ARNs start with `arn:aws:secretsmanager:`
- [ ] Cognito IDs match exactly

---

## 🎯 Summary

**Database:**
- Host: `flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com`
- Password Secret: `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/database-credentials-gYqeBF`

**Cognito:**
- User Pool ID: `us-east-1_f6h1XdY8u`
- Client ID: `28tqtmpt1s0mrkcj4p5divnlh8`

**Secrets:**
- OpenAI: `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openai-api-key-2Si5nA`
- OpenWeatherMap: `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openweathermap-api-key-0pDF8m`
- WeatherAPI: `arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/weatherapi-com-key-a5RNBd`

---

**All values are ready! Copy them into Lambda Console now!** 🚀


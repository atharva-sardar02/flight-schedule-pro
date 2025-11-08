# Staging Environment Variables Setup

## Step 1.3: Create .env File for Staging

Since you want to use a `.env` file, let's create one for staging deployment.

### Option 1: Copy from Template (Recommended)

**In PowerShell, run:**

```powershell
# Copy the template
Copy-Item env.template .env

# Edit .env file with your values
notepad .env
```

### Option 2: Create Manually

Create a file named `.env` in the project root with these values:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=default

# Weather APIs
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key_here
# WEATHERAPI_COM_KEY=your_weatherapi_com_key_here  (optional)

# AI Service
OPENAI_API_KEY=your_openai_api_key_here

# Database (will be set after RDS deployment)
# DATABASE_HOST=your-rds-endpoint.rds.amazonaws.com
# DATABASE_PASSWORD=YourSecurePassword123!

# Cognito (will be set after Cognito deployment)
# COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
# COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Application Settings
NODE_ENV=staging
WEATHER_CHECK_INTERVAL_MINUTES=10
RESCHEDULING_WINDOW_DAYS=7
```

---

## Quick Setup Commands

**PowerShell:**

```powershell
# 1. Copy template
Copy-Item env.template .env

# 2. Set your API keys (replace with your actual keys)
(Get-Content .env) -replace 'your_openweathermap_api_key_here', 'YOUR_ACTUAL_KEY' | Set-Content .env
(Get-Content .env) -replace 'your_openai_api_key_here', 'YOUR_ACTUAL_KEY' | Set-Content .env

# 3. Set database password
(Get-Content .env) -replace 'your_password_here', 'YourSecurePassword123!' | Set-Content .env
```

**Or manually edit `.env` file:**
- Open `.env` in your editor
- Replace placeholder values with your actual keys
- Save the file

---

## Verify .env File

After creating `.env`, verify it's loaded:

```powershell
# Check if .env exists
Test-Path .env

# View (without showing secrets)
Get-Content .env | Select-String -Pattern "API_KEY|PASSWORD" -NotMatch
```

---

## Important Notes

1. **`.env` is in `.gitignore`** - It won't be committed to Git ✅
2. **Backend loads `.env` automatically** - The dev-server.ts uses `dotenv.config()`
3. **For deployment scripts** - We'll export these as environment variables for CloudFormation
4. **Keep it secure** - Never share your `.env` file or commit it

---

## Next Step

Once your `.env` file is created with at least:
- `OPENWEATHERMAP_API_KEY`
- `OPENAI_API_KEY`  
- `DB_MASTER_PASSWORD` (for RDS)

Reply with **"env file ready"** and we'll proceed to Step 2: Validate CloudFormation Templates.


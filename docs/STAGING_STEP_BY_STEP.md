# Staging Deployment - Step by Step Guide

## Current Step: Step 3 - Deploy Infrastructure Stacks (IN PROGRESS)

✅ Step 1.3 Complete: Environment variables configured (OpenWeatherMap, WeatherAPI.com, OpenAI)
✅ Step 2 Complete: All 11 CloudFormation templates validated successfully

### Step 3 Progress:
✅ Stack 1: SNS (Notifications) - **DEPLOYED**
✅ Stack 2: Secrets Manager (API Keys) - **DEPLOYED**
✅ Stack 3: Cognito (Authentication) - **DEPLOYED** (Fixed SMS MFA issue)
⏸️ Stack 4: RDS (Database) - **FAILED** (Need to check error and fix)
⏳ Stack 5: Lambda (Backend Functions) - Pending
⏳ Stack 6: API Gateway (REST API) - Pending
⏳ Stack 7: EventBridge (Scheduler) - Pending
⏳ Stack 8: SES (Email Service) - Pending
⏳ Stack 9: S3 (Frontend Hosting) - Pending
⏳ Stack 10: CloudFront (CDN) - Pending
⏳ Stack 11: CloudWatch (Monitoring) - Pending

---

## Step 1: Pre-Deployment Verification

Before we begin deployment, let's verify all prerequisites are met.

### 1.1 Check AWS CLI Installation

**Action:** Verify AWS CLI is installed and configured

**Command:**
```bash
aws --version
```

**Expected Output:**
```
aws-cli/2.x.x Python/3.x.x ...
```

**If not installed:**
- Download from: https://aws.amazon.com/cli/
- Or install via: `pip install awscli`

**Your Result:** [Please paste the output here]

---

### 1.2 Verify AWS Credentials

**Action:** Check if AWS credentials are configured

**Command:**
```bash
aws sts get-caller-identity
```

**Expected Output:**
```json
{
    "UserId": "...",
    "Account": "...",
    "Arn": "..."
}
```

**If not configured:**
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter default region (e.g., us-east-1)
# Enter default output format (json)
```

**Your Result:** [Please paste the output here]

---

### 1.3 Check Required Environment Variables

**Action:** Verify you have all required API keys and passwords

**Checklist:**
- [ ] OpenWeatherMap API key
- [ ] WeatherAPI.com API key
- [ ] Anthropic API key
- [ ] Database password (meets AWS RDS requirements)

**Database Password Requirements:**
- Minimum 8 characters
- Contains uppercase letters
- Contains lowercase letters
- Contains numbers
- Contains special characters (!@#$%^&*)

**Action:** Set these as environment variables (we'll use them later):

```bash
# Windows PowerShell
$env:OPENWEATHERMAP_API_KEY = "your-key-here"
$env:WEATHERAPI_COM_KEY = "your-key-here"
$env:ANTHROPIC_API_KEY = "your-key-here"
$env:DB_MASTER_PASSWORD = "YourSecurePassword123!"
$env:AWS_REGION = "us-east-1"
$env:AWS_PROFILE = "default"
```

**Status:** [ ] All keys obtained [ ] Need to get keys

---

### 1.4 Verify Git Repository

**Action:** Ensure you're on the latest code

**Command:**
```bash
git status
```

**Expected:** Clean working directory or know what changes you have

**Command:**
```bash
git pull origin main
```

**Your Result:** [Please confirm you're up to date]

---

### 1.5 Check Node.js Installation

**Action:** Verify Node.js 18+ is installed

**Command:**
```bash
node --version
```

**Expected Output:**
```
v18.x.x or higher
```

**Your Result:** [Please paste the version]

---

## ✅ Step 1 Complete Checklist

Before proceeding to Step 2, confirm:

- [ ] AWS CLI installed and configured
- [ ] AWS credentials working (`aws sts get-caller-identity` succeeds)
- [ ] All API keys obtained (OpenWeatherMap, WeatherAPI.com, Anthropic)
- [ ] Database password ready (meets requirements)
- [ ] Git repository up to date
- [ ] Node.js 18+ installed

---

**Once you've completed Step 1, reply with "step 1 done" and I'll guide you to Step 2.**


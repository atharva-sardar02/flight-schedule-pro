# Local Development Setup Guide - Step by Step

## Prerequisites Check
Before starting, verify you have:
- ✅ Node.js 18+ installed
- ✅ PostgreSQL 14+ installed and running
- ✅ AWS CLI configured (optional for local dev)
- ✅ Git repository initialized

## Step 1: Install Dependencies

```bash
# Install all dependencies (root, frontend, backend)
npm run install:all

# Or manually:
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

## Step 2: Setup Local Database

```bash
# Create database
createdb flight_schedule_pro

# Run migrations
npm run db:migrate

# Load seed data
npm run db:seed

# Or use the setup script:
npm run db:setup
```

**Verify database:**
```bash
psql -d flight_schedule_pro -c "\dt"
```

You should see tables: users, bookings, instructor_availability, student_availability, availability_overrides, notifications, audit_log

## Step 3: Configure Environment Variables (Local Development)

For **local development without AWS**, you can skip Cognito deployment and use mock values:

1. Copy the template:
```bash
cp env.template .env
```

2. Edit `.env` and set these MINIMUM values for local dev:

```bash
# Database (local PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=flight_schedule_pro
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# AWS Region (required even for local)
AWS_REGION=us-east-1

# Cognito (use mock values for local dev until deployed)
COGNITO_USER_POOL_ID=local-dev-pool
COGNITO_CLIENT_ID=local-dev-client

# Frontend
VITE_API_BASE_URL=http://localhost:3001

# Node Environment
NODE_ENV=development
```

3. Create `frontend/.env.local`:
```bash
VITE_API_BASE_URL=http://localhost:3001
```

## Step 4: Test Backend Server

```bash
# Terminal 1: Start backend
npm run dev:backend

# Expected output:
# [INFO] Backend dev server listening on port 3001
```

**Verify backend is running:**
```bash
curl http://localhost:3001/
# Should return: "Flight Schedule Pro Backend is running!"
```

## Step 5: Test Frontend

```bash
# Terminal 2: Start frontend
npm run dev:frontend

# Expected output:
# VITE ready in XXX ms
# ➜  Local:   http://localhost:3000/
```

**Visit:** http://localhost:3000

You should see the login page!

## Step 6: Test Without AWS Cognito (Optional)

Since Cognito requires AWS deployment, you have two options:

### Option A: Deploy Cognito First (Recommended)
Follow the AWS deployment steps below.

### Option B: Use Mock Authentication (For Testing UI Only)
Temporarily modify `backend/src/services/authService.ts` to bypass Cognito:

```typescript
// Add this mock mode for local testing
static async login(credentials: LoginRequest): Promise<AuthTokens> {
  if (process.env.NODE_ENV === 'development' && process.env.MOCK_AUTH === 'true') {
    // Mock tokens for local testing
    return {
      accessToken: 'mock-access-token',
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    };
  }
  // ... rest of actual implementation
}
```

Add to `.env`:
```bash
MOCK_AUTH=true
```

## AWS Deployment Steps (For Full Testing)

### Step 1: Prepare AWS Credentials

```bash
# Configure AWS CLI (if not already done)
aws configure

# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (us-east-1)
# - Default output format (json)

# Verify:
aws sts get-caller-identity
```

### Step 2: Set Required Environment Variables for Deployment

```bash
# Export these before deployment
export DB_MASTER_PASSWORD='YourSecurePassword123!'
export OPENWEATHERMAP_API_KEY='your-key-here'
export WEATHERAPI_COM_KEY='your-key-here'
export ANTHROPIC_API_KEY='your-key-here'
```

### Step 3: Deploy SNS First (Required by CloudWatch)

```bash
cd infrastructure/scripts

# Deploy just SNS
aws cloudformation deploy \
  --template-file ../cloudformation/sns.yaml \
  --stack-name flight-schedule-pro-dev-sns \
  --parameter-overrides \
    Environment=dev \
    ProjectName=flight-schedule-pro \
    AlertEmail=your-email@example.com \
  --region us-east-1
```

### Step 4: Deploy Cognito Stack

```bash
aws cloudformation deploy \
  --template-file ../cloudformation/cognito.yaml \
  --stack-name flight-schedule-pro-dev-cognito \
  --parameter-overrides \
    Environment=dev \
    ProjectName=flight-schedule-pro \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

**Wait for completion** (takes 2-3 minutes)

### Step 5: Get Cognito Credentials

```bash
# Get User Pool ID
aws cloudformation describe-stacks \
  --stack-name flight-schedule-pro-dev-cognito \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text \
  --region us-east-1

# Get Client ID
aws cloudformation describe-stacks \
  --stack-name flight-schedule-pro-dev-cognito \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text \
  --region us-east-1
```

### Step 6: Update .env with Real Cognito Values

Update your `.env` file:
```bash
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX  # From previous command
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx     # From previous command
COGNITO_REGION=us-east-1
AWS_REGION=us-east-1
```

Also create/update `frontend/.env.local`:
```bash
VITE_API_BASE_URL=http://localhost:3001
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
```

### Step 7: Restart Both Servers

```bash
# Stop both servers (Ctrl+C)

# Restart backend (Terminal 1)
npm run dev:backend

# Restart frontend (Terminal 2)
npm run dev:frontend
```

## Testing the Authentication Flow

### 1. Register a New User

1. Go to http://localhost:3000/register
2. Fill in the form:
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@example.com
   - Phone: +1234567890 (optional)
   - Role: Student Pilot
   - Training Level: Student Pilot
   - Password: Test1234!
   - Confirm Password: Test1234!
3. Click "Create account"

**Expected:** Success message, redirect to login

### 2. Login

1. Go to http://localhost:3000/login
2. Enter:
   - Email: john.doe@example.com
   - Password: Test1234!
3. Click "Sign in"

**Expected:** Redirect to dashboard at /dashboard

### 3. Verify Protected Route

1. After login, you should see the dashboard
2. Try logging out and accessing /dashboard directly
3. **Expected:** Redirect back to login

### 4. Check Database

```bash
psql -d flight_schedule_pro -c "SELECT id, email, first_name, last_name, role FROM users;"
```

You should see the registered user in the database!

## Troubleshooting

### Backend Issues

**"Cannot connect to database"**
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep flight_schedule_pro
```

**"Cognito error: User pool not found"**
- Verify COGNITO_USER_POOL_ID is correct
- Check AWS region matches
- Ensure Cognito stack deployed successfully

### Frontend Issues

**"Network Error" when trying to login**
- Check backend is running on port 3001
- Verify VITE_API_BASE_URL is set correctly
- Check browser console for CORS errors

**"Cannot read property 'user' of undefined"**
- Make sure App.tsx wraps routes with AuthProvider
- Check useAuth hook is being called within AuthProvider

### AWS Deployment Issues

**"Stack creation failed"**
```bash
# Check stack events for errors
aws cloudformation describe-stack-events \
  --stack-name flight-schedule-pro-dev-cognito \
  --region us-east-1 \
  --max-items 10
```

**"Insufficient permissions"**
- Ensure your AWS user has CloudFormation, Cognito, and IAM permissions
- Check IAM policies attached to your user

## Quick Commands Reference

```bash
# Database
npm run db:setup         # Create DB, run migrations, seed data
npm run db:migrate       # Run migrations only
npm run db:seed          # Load seed data only

# Development
npm run dev:backend      # Start backend on :3001
npm run dev:frontend     # Start frontend on :3000

# Testing
npm run test             # Run all tests
npm run test:backend     # Backend tests only
npm run test:frontend    # Frontend tests only

# Linting & Formatting
npm run lint             # Check code style
npm run lint:fix         # Fix code style issues
npm run format           # Format all code

# Building
npm run build:all        # Build frontend and backend
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only
```

## What's Next?

Once authentication is working:
1. ✅ Users can register and login
2. ✅ Protected routes work
3. ✅ JWT tokens are validated
4. ⏭️ **Next PR #5:** Weather Service Integration
5. ⏭️ **Next PR #6:** Booking Management System

---

**Need Help?**
- Check CloudWatch logs for backend errors (if deployed to AWS)
- Check browser console for frontend errors
- Review memory bank files in `memory-bank/` for architecture details



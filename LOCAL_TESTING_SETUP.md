# Local Testing Setup - Mock Authentication

## Quick Setup for Testing Without Cognito

Since Cognito requires AWS deployment, you can use **mock authentication** for local testing.

### Step 1: Enable Mock Auth

Add this to your `.env` file in the project root:

```env
MOCK_AUTH=true
NODE_ENV=development
```

### Step 2: Restart Backend

Stop the backend (Ctrl+C) and restart it:

```powershell
cd backend
npm run dev
```

### Step 3: Test Login

Now you can login with **any email and password** - it will work with mock authentication!

Try logging in with:
- Email: `test@example.com`
- Password: `anything` (doesn't matter in mock mode)

### Step 4: Test API Endpoints

Once logged in, test the bookings endpoint:

```javascript
// In browser console (on localhost:3000)
const token = localStorage.getItem('flight_schedule_access_token');
fetch('http://localhost:3001/bookings', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
  .then(r => r.json())
  .then(data => console.log('✅ Bookings:', data))
  .catch(err => console.error('❌ Error:', err))
```

## What Mock Auth Does

- ✅ Allows login with any credentials
- ✅ Generates mock JWT tokens
- ✅ Bypasses Cognito verification
- ✅ Works for local development only

## When to Use Real Cognito

- Before deploying to staging/production
- When testing actual AWS integration
- When testing email verification flows

## Disable Mock Auth

To use real Cognito, remove or set:

```env
MOCK_AUTH=false
```

And make sure your Cognito User Pool is deployed and configured correctly.


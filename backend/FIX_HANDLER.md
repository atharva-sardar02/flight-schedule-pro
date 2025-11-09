# Fix: "Cannot find module '/var/task/functions'"

## Problem
The handler `functions.api.handler` doesn't exist. Each API file has its own handler.

## Quick Fix: Change Handler in Lambda Console

### Option 1: Use Auth Handler (Temporary - for testing)

1. **Lambda Console** → `flight-schedule-pro-staging-api`
2. **Configuration** tab → **Runtime settings** → **Edit**
3. Change **Handler** from:
   - `functions.api.handler`
   - To: `functions.api.auth.handler`
4. Click **"Save"**

This will route all requests through the auth handler (good for testing `/health` endpoint).

### Option 2: Use Bookings Handler (Better for API)

1. **Lambda Console** → `flight-schedule-pro-staging-api`
2. **Configuration** tab → **Runtime settings** → **Edit**
3. Change **Handler** from:
   - `functions.api.handler`
   - To: `functions.api.bookings.handler`
4. Click **"Save"**

### Option 3: Create Main Handler (Proper Solution)

We need to rebuild the package with a main handler file. But for now, use Option 1 or 2 to get it working.

---

## Test After Fix

1. Change handler to `functions.api.auth.handler`
2. Test: `https://YOUR_API_URL/health`
3. Should return success instead of error

---

## Proper Solution (Later)

We need to:
1. Create `handler.ts` file (already created)
2. Rebuild: `npm run build`
3. Repackage Lambda
4. Upload to S3
5. Update Lambda code
6. Change handler back to `functions.api.handler`

But for now, **use Option 1 to get it working!**


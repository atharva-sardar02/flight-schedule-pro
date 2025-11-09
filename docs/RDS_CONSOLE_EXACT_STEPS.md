# RDS Console Setup - Exact Step-by-Step Instructions

## Step 1: Navigate to RDS Console
1. Go to: https://console.aws.amazon.com/rds/
2. Click the **"Create database"** button (orange button, top right)

## Step 2: Choose Database Creation Method
- ✅ Select **"Standard create"** (should already be selected)
- ❌ Do NOT select "Easy create"

## Step 3: Engine Options
- ✅ **Engine type:** Click **"PostgreSQL"** (should already be selected)
- ✅ **Version:** Click the dropdown, select **"PostgreSQL 14.19"** (or latest 14.x available)
- ✅ **Templates:** Select **"Free tier"** (should already be selected)

## Step 4: Availability and Durability
- ❌ **Multi-AZ DB instance** - Click to **UNSELECT** this
- ✅ **Single DB instance** - Click to **SELECT** this
  - This is for demo - saves cost and is simpler

## Step 5: Settings
1. **DB instance identifier:**
   - Clear the default "database-1"
   - Type: `flight-schedule-pro-staging-db`

2. **Master username:**
   - Should already show: `postgres`
   - If not, type: `postgres`

3. **Master password:**
   - Click in the password field
   - Type: `Databasemaster2000`

4. **Confirm password:**
   - Click in the confirm password field
   - Type again: `Databasemaster2000`

5. **Auto generate a password:**
   - ❌ **UNCHECK** this box (we're using our own password)

## Step 6: Instance Configuration
1. **DB instance class:**
   - Click the dropdown
   - Under **"Burstable classes (includes t classes)"** section
   - Select: **`db.t3.micro`** (Free tier eligible)

2. **Storage:**
   - **Storage type:** Should show "General Purpose SSD (gp3)" - leave as is
   - **Allocated storage:** Should show "20" - leave as is (or type `20`)
   - **Storage autoscaling:**
     - ❌ **UNCHECK** this box (for demo, we don't need autoscaling)

## Step 7: Connectivity
1. **Virtual private cloud (VPC):**
   - Click the dropdown
   - Select: **"default"** (should be something like "vpc-xxxxx (default)")

2. **DB subnet group:**
   - Leave as default (should auto-populate)

3. **Public access:**
   - ✅ Select **"Yes"** (should already be selected)
   - This allows access from outside AWS

4. **VPC security group (firewall):**
   - ✅ Select **"Create new"** (should already be selected)
   - **New VPC security group name:** Type: `flight-schedule-pro-staging-db-sg`

5. **Availability Zone:**
   - Leave as **"No preference"** (default)

6. **Database port:**
   - Should show `5432` - leave as is

## Step 8: Database Authentication
- ✅ **Password authentication** - Should already be selected
- ❌ Do NOT select Kerberos or IAM authentication

## Step 9: Additional Configuration
Click to expand this section:

1. **Initial database name:**
   - Type: `flight_schedule_pro`

2. **DB parameter group:**
   - Leave as **"default.postgres14"** (default)

3. **Backup:**
   - **Backup retention period:** Select **"7 days"** from dropdown
   - **Backup window:** Leave as "No preference"

4. **Encryption:**
   - ✅ **Enable encryption** - CHECK this box

5. **Performance Insights:**
   - ❌ **Enable Performance Insights** - UNCHECK (not needed for demo)

6. **Enhanced monitoring:**
   - ❌ **Enable Enhanced monitoring** - UNCHECK (not needed for demo)

7. **Log exports:**
   - ✅ **postgresql** - CHECK this box (optional, for debugging)

8. **Maintenance:**
   - **Auto minor version upgrade:** ✅ CHECK this box
   - **Maintenance window:** Leave as "No preference"

9. **Deletion protection:**
   - ❌ **Enable deletion protection** - **UNCHECK** this box
   - Important: Uncheck this so you can delete it easily later for demo cleanup

## Step 10: Tags (Optional)
- You can skip this section for demo
- Or add:
  - Key: `Project`, Value: `flight-schedule-pro`
  - Key: `Environment`, Value: `staging`

## Step 11: Create Database
1. Scroll to the bottom
2. Review your settings
3. Click the **"Create database"** button (orange button, bottom right)

## Step 12: Wait for Creation
- You'll see: "Creating database..."
- This takes **10-15 minutes**
- You can close the page and come back later
- Status will change from "Creating" → "Available"

## Step 13: After Database is Available

1. **Get the Endpoint:**
   - Click on your database name: `flight-schedule-pro-staging-db`
   - Find **"Endpoint & port"** section
   - Copy the **Endpoint** (looks like: `flight-schedule-pro-staging-db.xxxxx.us-east-1.rds.amazonaws.com`)
   - Note the **Port:** `5432`

2. **Update Security Group (IMPORTANT):**
   - Scroll down to **"Connectivity & security"** section
   - Click on the **Security group** link (e.g., `flight-schedule-pro-staging-db-sg`)
   - In the Security Group page:
     - Click **"Edit inbound rules"**
     - Click **"Add rule"**
     - **Type:** Select "PostgreSQL" from dropdown
     - **Port:** Should auto-fill `5432`
     - **Source:** Select "Anywhere-IPv4" (or type `0.0.0.0/0`)
     - **Description:** Type: `Allow PostgreSQL for demo`
     - Click **"Save rules"**

## Step 14: Verify Connection Info

You should now have:
- ✅ **Endpoint:** `flight-schedule-pro-staging-db.xxxxx.us-east-1.rds.amazonaws.com`
- ✅ **Port:** `5432`
- ✅ **Database name:** `flight_schedule_pro`
- ✅ **Username:** `postgres`
- ✅ **Password:** `Databasemaster2000`
- ✅ **Security group:** Allows port 5432 from anywhere

## Next Steps

Once you have the endpoint, tell me and we'll:
1. Continue with remaining CloudFormation stacks
2. Configure Lambda to connect to RDS
3. Run database migrations
4. Test the connection

---

## Troubleshooting

**If you can't find "default" VPC:**
- Go to VPC Console: https://console.aws.amazon.com/vpc/
- Look for VPC with "default" in the name
- Note the VPC ID
- Come back to RDS and select it from dropdown

**If "Public access" is grayed out:**
- Make sure you selected a VPC that has an Internet Gateway
- Default VPC should have this automatically

**If database creation fails:**
- Check the error message
- Common issues:
  - VPC limit reached (we're using default, so shouldn't happen)
  - Invalid password format (should be fine with our password)
  - Insufficient permissions (check IAM permissions)


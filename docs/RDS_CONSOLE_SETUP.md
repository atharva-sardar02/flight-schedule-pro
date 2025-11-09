# RDS Setup via AWS Console (Simplified for Demo)

## Quick Setup Steps

### 1. Go to RDS Console
- Navigate to: https://console.aws.amazon.com/rds/
- Click **"Create database"**

### 2. Database Configuration

**Engine Options:**
- ✅ **Engine type:** PostgreSQL
- ✅ **Version:** PostgreSQL 14.19 (or latest 14.x available)
- ✅ **Templates:** Free tier (or Production if you want)

**Settings:**
- **DB instance identifier:** `flight-schedule-pro-staging-db`
- **Master username:** `postgres`
- **Master password:** `Databasemaster2000`
- ✅ **Auto generate a password:** Unchecked (we're using our own)

**Instance Configuration:**
- **Instance class:** `db.t3.micro` (Free tier eligible)
- ✅ **Storage type:** General Purpose SSD (gp3)
- **Allocated storage:** `20 GB`
- ✅ **Storage autoscaling:** Unchecked (for demo)

**Connectivity:**
- **Virtual private cloud (VPC):** Select your **default VPC** (should be pre-selected)
- **Subnet group:** Use default (or create one with 2+ subnets)
- **Public access:** ✅ **Yes** (for demo - easier to connect)
- **VPC security group:** Create new
  - **New VPC security group name:** `flight-schedule-pro-staging-db-sg`
- **Availability Zone:** No preference
- **Database port:** `5432` (default)

**Database Authentication:**
- ✅ **Password authentication**

**Additional Configuration:**
- **Initial database name:** `flight_schedule_pro`
- **DB parameter group:** default.postgres14
- **Backup retention period:** `7 days`
- **Backup window:** No preference
- **Enable encryption:** ✅ Yes
- **Enable Enhanced monitoring:** Unchecked (for demo)
- **Enable Performance Insights:** Unchecked (for demo)
- **Deletion protection:** ❌ **Unchecked** (for demo - easier to delete later)

**Monitoring:**
- **Enable CloudWatch logs:** ✅ `postgresql` (optional)

### 3. Create Database
- Click **"Create database"**
- Wait 10-15 minutes for creation

### 4. After Creation - Get Connection Info

Once the database is **Available**, note:
- **Endpoint:** (e.g., `flight-schedule-pro-staging-db.xxxxx.us-east-1.rds.amazonaws.com`)
- **Port:** `5432`
- **Database name:** `flight_schedule_pro`
- **Username:** `postgres`
- **Password:** `Databasemaster2000`

### 5. Update Security Group (Allow Access)

1. Go to **EC2 Console** → **Security Groups**
2. Find `flight-schedule-pro-staging-db-sg`
3. Click **"Edit inbound rules"**
4. Add rule:
   - **Type:** PostgreSQL
   - **Port:** 5432
   - **Source:** `0.0.0.0/0` (for demo - allows from anywhere)
   - **Description:** "Allow PostgreSQL for demo"
5. Click **"Save rules"**

## Connection String Format

After setup, your connection string will be:
```
postgresql://postgres:Databasemaster2000@<ENDPOINT>:5432/flight_schedule_pro
```

Replace `<ENDPOINT>` with the actual endpoint from the console.

## Next Steps

Once RDS is created:
1. ✅ Note the endpoint
2. ✅ Update Lambda environment variables with RDS endpoint
3. ✅ Continue with remaining CloudFormation stacks
4. ✅ Run database migrations

## Troubleshooting

**If you can't find default VPC:**
- Go to VPC Console
- Look for VPC with "default" in the name
- Note the VPC ID

**If public access doesn't work:**
- Check security group rules
- Ensure inbound rule allows port 5432 from 0.0.0.0/0
- Check RDS instance shows "Publicly accessible: Yes"



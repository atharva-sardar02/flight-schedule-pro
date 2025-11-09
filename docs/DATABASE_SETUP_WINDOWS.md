# Database Setup Guide for Windows
## Step-by-Step Instructions to Run PostgreSQL Database

---

## Prerequisites

1. **PostgreSQL 14+ Installed**
   - Download from: https://www.postgresql.org/download/windows/
   - Or use: `winget install PostgreSQL.PostgreSQL`
   - Default installation path: `C:\Program Files\PostgreSQL\18\`

2. **PostgreSQL Service Running**
   - Check if running: Open Services (Win+R → `services.msc`)
   - Look for "postgresql-x64-18" service
   - If not running, right-click → Start

3. **PostgreSQL in PATH** (Optional but recommended)
   - Add to PATH: `C:\Program Files\PostgreSQL\18\bin`
   - Or use full path: `"C:\Program Files\PostgreSQL\18\bin\psql.exe"`

---

## Step 1: Verify PostgreSQL is Running

### Option A: Check Service
```powershell
# Open PowerShell as Administrator
Get-Service -Name postgresql*
```

### Option B: Test Connection
```powershell
# Using full path (if not in PATH)
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "SELECT version();"
```

### Option C: Check if psql is accessible
```powershell
psql --version
```

**If you get "command not found":**
- Use full path: `"C:\Program Files\PostgreSQL\18\bin\psql.exe"`
- Or add PostgreSQL bin to your PATH environment variable

---

## Step 2: Set PostgreSQL Password (If Not Set)

```powershell
# Connect to PostgreSQL
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres

# In psql prompt, run:
ALTER USER postgres PASSWORD 'your_password_here';
\q
```

**Note**: Remember this password - you'll need it for the `.env` file.

---

## Step 3: Create Database

### Option A: Using psql (Recommended)
```powershell
# Set password as environment variable (for this session)
$env:PGPASSWORD = "your_password_here"

# Create database
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres flight_schedule_pro
```

### Option B: Using psql SQL Command
```powershell
$env:PGPASSWORD = "your_password_here"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE flight_schedule_pro;"
```

### Option C: Interactive psql
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```
Then in psql:
```sql
CREATE DATABASE flight_schedule_pro;
\q
```

---

## Step 4: Run Migrations

Run migrations in order (001 through 006, plus 003b and 004 for performance):

```powershell
# Set password for all commands
$env:PGPASSWORD = "2000"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

# Run migrations in order
& $psql -U postgres -d flight_schedule_pro -f database\migrations\001_create_users_table.sql
& $psql -U postgres -d flight_schedule_pro -f database\migrations\002_create_bookings_table.sql
& $psql -U postgres -d flight_schedule_pro -f database\migrations\003_create_availability_tables.sql
& $psql -U postgres -d flight_schedule_pro -f database\migrations\003b_create_availability_patterns.sql
& $psql -U postgres -d flight_schedule_pro -f database\migrations\004_create_notifications_table.sql
& $psql -U postgres -d flight_schedule_pro -f database\migrations\005_create_audit_log_table.sql
& $psql -U postgres -d flight_schedule_pro -f database\migrations\006_create_indexes.sql
& $psql -U postgres -d flight_schedule_pro -f database\migrations\004_performance_indexes.sql
```

**Expected Output**: Each command should complete without errors.

---

## Step 5: Load Seed Data (Optional but Recommended for Testing)

```powershell
# Continue using same session with $env:PGPASSWORD set
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

# Load seed data
& $psql -U postgres -d flight_schedule_pro -f database\seeds\dev_users.sql
& $psql -U postgres -d flight_schedule_pro -f database\seeds\dev_bookings.sql
& $psql -U postgres -d flight_schedule_pro -f database\seeds\dev_availability.sql
```

**Note**: Seed data includes test users, bookings, and availability patterns for testing.

---

## Step 6: Verify Database Setup

### Check Tables
```powershell
$env:PGPASSWORD = "your_password_here"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d flight_schedule_pro -c "\dt"
```

**Expected Tables**:
- users
- bookings
- availability_patterns
- availability_overrides
- reschedule_options
- preference_rankings
- notifications
- audit_log

### Check Users (Seed Data)
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d flight_schedule_pro -c "SELECT id, email, role, first_name, last_name FROM users LIMIT 5;"
```

### Check Bookings (Seed Data)
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d flight_schedule_pro -c "SELECT id, status, training_level, scheduled_datetime FROM bookings LIMIT 5;"
```

---

## Step 7: Configure .env File

Create or update `.env` file in project root:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=flight_schedule_pro
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password_here

# AWS Configuration (for local dev, use mock values)
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=local-dev-pool
COGNITO_CLIENT_ID=local-dev-client

# API Keys (get from respective services)
OPENWEATHERMAP_API_KEY=your_key_here
WEATHERAPI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Frontend
VITE_API_BASE_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

---

## Quick Setup Script (PowerShell)

Save this as `setup-database.ps1` in project root:

```powershell
# Database Setup Script for Windows
param(
    [string]$Password = "postgres"
)

$env:PGPASSWORD = $Password
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "Creating database..." -ForegroundColor Green
& $psql -U postgres -c "CREATE DATABASE flight_schedule_pro;" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database created!" -ForegroundColor Green
} else {
    Write-Host "Database may already exist, continuing..." -ForegroundColor Yellow
}

Write-Host "Running migrations..." -ForegroundColor Green
$migrations = @(
    "database\migrations\001_create_users_table.sql",
    "database\migrations\002_create_bookings_table.sql",
    "database\migrations\003_create_availability_tables.sql",
    "database\migrations\003b_create_availability_patterns.sql",
    "database\migrations\004_create_notifications_table.sql",
    "database\migrations\005_create_audit_log_table.sql",
    "database\migrations\006_create_indexes.sql",
    "database\migrations\004_performance_indexes.sql"
)

foreach ($migration in $migrations) {
    if (Test-Path $migration) {
        Write-Host "Running $migration..." -ForegroundColor Cyan
        & $psql -U postgres -d flight_schedule_pro -f $migration
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error running $migration" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Warning: $migration not found" -ForegroundColor Yellow
    }
}

Write-Host "Loading seed data..." -ForegroundColor Green
$seeds = @(
    "database\seeds\dev_users.sql",
    "database\seeds\dev_bookings.sql",
    "database\seeds\dev_availability.sql"
)

foreach ($seed in $seeds) {
    if (Test-Path $seed) {
        Write-Host "Loading $seed..." -ForegroundColor Cyan
        & $psql -U postgres -d flight_schedule_pro -f $seed
    }
}

Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host "Verify with: psql -U postgres -d flight_schedule_pro -c '\dt'" -ForegroundColor Cyan
```

**Usage:**
```powershell
# Run with default password
.\setup-database.ps1

# Run with custom password
.\setup-database.ps1 -Password "your_password"
```

---

## Troubleshooting

### Issue: "psql: command not found"
**Solution**: Use full path or add to PATH
```powershell
# Use full path
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres

# Or add to PATH permanently
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\PostgreSQL\18\bin", "User")
```

### Issue: "password authentication failed"
**Solution**: 
1. Check password in `.env` matches PostgreSQL password
2. Reset password:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
# Then: ALTER USER postgres PASSWORD 'new_password';
```

### Issue: "database does not exist"
**Solution**: Create database first (Step 3)

### Issue: "relation already exists" (migration errors)
**Solution**: 
- Database may already be set up
- Or drop and recreate:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "DROP DATABASE flight_schedule_pro;"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE flight_schedule_pro;"
# Then run migrations again
```

### Issue: "permission denied"
**Solution**: 
- Run PowerShell as Administrator
- Or ensure postgres user has permissions

---

## Verify Database is Ready

Run this command to verify everything is set up:

```powershell
$env:PGPASSWORD = "your_password"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d flight_schedule_pro -c "
SELECT 
    'Tables: ' || COUNT(*) as status
FROM information_schema.tables 
WHERE table_schema = 'public';

SELECT 
    'Users: ' || COUNT(*) as status
FROM users;

SELECT 
    'Bookings: ' || COUNT(*) as status
FROM bookings;
"
```

**Expected Output**:
```
 status  
--------
 Tables: 8

 status  
--------
 Users: 6

 status  
--------
 Bookings: 5
```

---

## Next Steps

Once database is set up:

1. ✅ **Start Backend**: `cd backend && npm run dev`
2. ✅ **Start Frontend**: `cd frontend && npm run dev`
3. ✅ **Test Connection**: Backend should connect to database on startup
4. ✅ **Follow Testing Plan**: Use `docs/FRONTEND_TESTING_PLAN.md`

---

## Quick Reference Commands

```powershell
# Connect to database
$env:PGPASSWORD = "your_password"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d flight_schedule_pro

# List all tables
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d flight_schedule_pro -c "\dt"

# Get user IDs for testing
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d flight_schedule_pro -c "SELECT id, email, role FROM users;"

# Check database size
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d flight_schedule_pro -c "SELECT pg_size_pretty(pg_database_size('flight_schedule_pro'));"
```

---

**Database is ready when:**
- ✅ PostgreSQL service is running
- ✅ Database `flight_schedule_pro` exists
- ✅ All migrations completed successfully
- ✅ Seed data loaded (optional)
- ✅ `.env` file configured with database credentials
- ✅ Backend can connect (check backend logs)




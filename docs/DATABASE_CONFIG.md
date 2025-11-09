# Database Configuration Guide

## Two Database Setup

### 1. Local PostgreSQL Database
- **Purpose**: Local development and testing
- **Host**: localhost
- **Port**: 5432
- **Database**: flight_schedule_pro (or flight_schedule_pro_test for tests)
- **User**: postgres
- **Password**: (your local password)

### 2. AWS RDS Database
- **Purpose**: Staging and production
- **Host**: flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com
- **Port**: 5432
- **Database**: flight_schedule_pro
- **User**: postgres
- **Password**: Databasemaster2000

## Environment Variables

### For Local Development (.env)
```env
# Local Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=flight_schedule_pro
DATABASE_USER=postgres
DATABASE_PASSWORD=your_local_password

# Test Database (for automated tests)
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=flight_schedule_pro_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=your_local_password
```

### For Staging/Production (.env.production)
```env
# AWS RDS Database
DATABASE_HOST=flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=flight_schedule_pro
DATABASE_USER=postgres
DATABASE_PASSWORD=Databasemaster2000
```

## Usage

### Local Development
- Backend connects to: `localhost:5432/flight_schedule_pro`
- Run migrations on local database
- Test with local data

### Running Tests
- Tests use: `localhost:5432/flight_schedule_pro_test`
- Tests create/clean their own test database
- Requires local PostgreSQL running

### Staging/Production
- Backend connects to: AWS RDS
- Use environment variables from Secrets Manager
- All production data stored in RDS

## Switching Between Databases

### Use Local Database
```bash
# In .env file
DATABASE_HOST=localhost
DATABASE_PASSWORD=your_local_password
```

### Use AWS RDS
```bash
# In .env file
DATABASE_HOST=flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com
DATABASE_PASSWORD=Databasemaster2000
```

## Test Database Setup

For automated tests to work, create a test database:

```sql
CREATE DATABASE flight_schedule_pro_test;
```

Then tests will automatically:
1. Connect to test database
2. Run migrations
3. Load test fixtures
4. Run tests
5. Clean up


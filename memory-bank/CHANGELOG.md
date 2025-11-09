# Memory Bank Changelog

## November 2024

### 2024-11-08 - Deployment Strategy Update
- **Changed:** Deployment approach from Lambda to EC2
- **Reason:** Simplified deployment process, easier debugging, same codebase as local dev
- **Impact:** 
  - Created EC2 deployment documentation
  - Updated techContext.md with EC2 deployment details
  - Created automated EC2 setup script
  - Configured local development to use AWS RDS database

### 2024-11-08 - Database Configuration Update
- **Changed:** Local development now connects to AWS RDS
- **Reason:** Test with same database as staging/production
- **Impact:**
  - Updated .env to use AWS RDS connection string
  - Created DATABASE_CONFIG.md documentation
  - Local PostgreSQL still available for automated tests

### 2024-11-08 - AI Provider Migration
- **Changed:** AI provider from Anthropic Claude to OpenAI ChatGPT
- **Reason:** User preference and availability
- **Impact:**
  - Updated rescheduleEngine.ts to use ChatOpenAI
  - Updated package.json dependencies
  - Updated environment variables and Secrets Manager configuration
  - Updated deployment scripts

### 2024-11-08 - PR #19 Completion
- **Completed:** Documentation & Deployment Guide
- **Deliverables:**
  - Comprehensive API documentation
  - Deployment guides (local, staging, production)
  - Architecture documentation
  - Database schema documentation
  - Troubleshooting guide
  - Operations runbook
  - User guide
  - Demo script

### 2024-11-08 - PR #20 In Progress
- **Status:** Staging Deployment & Testing
- **Current Work:**
  - EC2 deployment approach finalized
  - Local testing with AWS RDS database
  - EC2 setup scripts created
  - Deployment documentation created



# Technical Context

## Technology Stack

### Frontend
**React 18+ with TypeScript + Vite**
- **Why:** Type safety for complex flight data structures, component reusability, strong ecosystem
- **Build Tool:** Vite (replaced react-scripts for better performance and latest TypeScript support)
- **UI Framework:** shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Key Libraries:**
  - `react-router-dom` (v6+): Client-side routing
  - `axios`: HTTP client for API calls
  - `@aws-amplify/auth`: Cognito integration
  - `date-fns`: Date manipulation and timezone handling
  - `tailwindcss`: Utility-first CSS framework
  - `tailwindcss-animate`: Animation utilities
  - `class-variance-authority`: Component variant management
  - `clsx` + `tailwind-merge`: Conditional class utilities
  - `lucide-react`: Icon library
  - `react-day-picker`: Date picker component
  - `react-beautiful-dnd`: Drag-and-drop for preference ranking (to be added)
  - `recharts`: Dashboard metrics visualization (to be added)

### Backend
**TypeScript on AWS Lambda**
- **Why:** Type safety across full stack, serverless scaling, pay-per-use pricing
- **Runtime:** Node.js 18.x
- **Local Development:** Express server with ts-node-dev (simpler than SAM CLI)
- **Key Libraries:**
  - `express`: Local development server
  - `ts-node-dev`: Hot-reload TypeScript development
  - `@aws-sdk/client-ses`: Email notifications
  - `@aws-sdk/client-secrets-manager`: API key management
  - `@langchain/core` + `langchain`: AI workflow orchestration
  - `pg` + `pg-pool`: PostgreSQL driver with connection pooling
  - `axios`: Weather API HTTP client
  - `date-fns` + `date-fns-tz`: Timezone-aware date handling
  - `joi`: Input validation
  - `winston`: Structured logging

### Database
**PostgreSQL 14+ on AWS RDS**
- **Why:** ACID compliance for booking operations, complex query support, mature ecosystem
- **Instance Type:** 
  - Staging: t3.micro (2 vCPU, 1 GB RAM)
  - Production: t3.small (2 vCPU, 2 GB RAM)
- **Features Used:**
  - Composite indexes for performance
  - Foreign key constraints for data integrity
  - JSONB columns for flexible metadata
  - Connection pooling via RDS Proxy (optional for scale)

### AI/ML
**LangGraph with LangChain TypeScript SDK**
- **Why:** Graph-based workflow for multi-step constraint solving, clear workflow visualization
- **LLM Provider:** Anthropic Claude (via API)
- **Key Capabilities:**
  - Multi-step reasoning for schedule optimization
  - State management across workflow nodes
  - Timeout handling (15-second max)
  - Fallback to simpler logic on failure

### Cloud Infrastructure
**AWS (Amazon Web Services)**
- **Compute:**
  - Lambda: Serverless functions (API, scheduler, AI)
  - Provisioned concurrency for critical functions (scheduler, AI engine)
- **Storage:**
  - RDS PostgreSQL: Primary database
  - S3: Frontend static hosting, logs archive
- **Networking:**
  - API Gateway: REST API + WebSocket API
  - CloudFront: CDN for frontend
  - VPC: Secure network for RDS
- **Security:**
  - Cognito: User authentication (user pools)
  - Secrets Manager: API key storage with rotation
  - IAM: Role-based access control
- **Monitoring:**
  - CloudWatch: Logs, metrics, dashboards, alarms
  - CloudWatch Logs Insights: Log querying
- **Scheduling:**
  - EventBridge: 10-minute weather monitoring trigger
- **Notifications:**
  - SES: Transactional email delivery
  - SNS: CloudWatch alarm notifications to ops team

### External APIs
**Weather Data (Dual Provider)**
1. **OpenWeatherMap**
   - API: Current Weather Data + 5-Day Forecast
   - Rate Limit: 1M calls/month (free tier)
   - Cost: $0 within free tier, $40/month for 10M calls
   
2. **WeatherAPI.com**
   - API: Current Weather + Forecast
   - Rate Limit: 1M calls/month (free tier)
   - Cost: $0 within free tier, $20/month for 5M calls

**AI/LLM**
- **Anthropic Claude API**
  - Model: Claude 3 (Sonnet or Opus)
  - Cost: ~$0.15 per scheduling request
  - Estimated monthly: $30-50 (10-15 conflicts/day)

## Development Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 14+ (local or Docker)
- AWS CLI configured with credentials
- Git

### Environment Variables
See `.env.template` for complete list. Critical variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/flight_schedule_pro

# AWS
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx

# Weather APIs
OPENWEATHERMAP_API_KEY=your_key
WEATHERAPI_COM_KEY=your_key

# AI
ANTHROPIC_API_KEY=your_key

# Application
WEATHER_CHECK_INTERVAL_MINUTES=10
WEATHER_CACHE_TTL_MINUTES=5
RESCHEDULING_WINDOW_DAYS=7
PREFERENCE_DEADLINE_HOURS=12
PREFERENCE_DEADLINE_MIN_BEFORE_FLIGHT_MINUTES=30
```

### Local Development Workflow
1. **Initial Setup:**
   ```bash
   # Install all dependencies
   npm run install:all
   
   # Or use setup script
   ./infrastructure/scripts/setup-local.sh
   ```

2. **Database Setup:**
   ```bash
   # Create database and run migrations
   npm run db:setup
   
   # Or manually:
   createdb flight_schedule_pro
   npm run db:migrate
   npm run db:seed
   ```

3. **Backend Setup:**
   ```bash
   cd backend
   npm install
   npm run dev  # Express dev server on localhost:3001 (ts-node-dev)
   npm run build  # Compile TypeScript
   npm test   # Run unit tests
   ```

4. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev  # Vite dev server on localhost:3000
   npm run build  # Production build
   npm test  # Run tests (Vitest)
   ```

5. **Run Both:**
   ```bash
   # From root directory
   npm run dev:frontend  # Terminal 1
   npm run dev:backend   # Terminal 2
   ```

6. **Lambda Local Testing:**
   ```bash
   # Use SAM CLI or Serverless Framework for local Lambda invocation
   sam local invoke weatherMonitor -e events/test-event.json
   ```

## Technical Constraints

### AWS Lambda Limits
- **Max Execution Time:** 15 minutes (we use 30-second timeout for fail-fast)
- **Memory:** 128 MB - 10 GB (we use 512 MB for API, 1 GB for AI)
- **Deployment Package:** 50 MB zipped, 250 MB unzipped
- **Concurrent Executions:** 1000 default (request increase if needed)
- **Cold Start:** 1-3 seconds (mitigated with provisioned concurrency)

### Database Connection Limits
- **RDS t3.micro:** ~80 connections max
- **Lambda Connection Pooling:** Max 5 connections per function instance
- **Strategy:** Reuse connections across invocations, aggressive timeout

### Weather API Rate Limits
- **OpenWeatherMap:** 60 calls/minute, 1M calls/month free
- **WeatherAPI.com:** 60 calls/minute, 1M calls/month free
- **Strategy:** 5-minute caching, distribute load across both providers

### EventBridge Scheduling
- **Minimum Frequency:** 1 minute (we use 10 minutes)
- **Accuracy:** ~1 second variance
- **Cron Expression:** AWS-specific format (UTC timezone)

### PostgreSQL Performance
- **Max Query Time Target:** <100ms for simple queries, <1s for complex
- **Indexing Strategy:** Composite indexes on (scheduledDate, status), (user_id, day_of_week, start_time)
- **Connection Pooling:** Required for Lambda to avoid exhaustion

## Testing Strategy

### Unit Tests (Jest + ts-jest)
- **Target Coverage:** >70% for business logic
- **Focus Areas:**
  - Weather service (API integration, caching, failover)
  - Corridor calculator (coordinate math)
  - Deadline calculator (edge cases)
  - Conflict detector (availability logic)
  - Training level minimums validation

### Integration Tests
- **Focus Areas:**
  - Weather monitoring end-to-end (EventBridge → Lambda → Database)
  - AI rescheduling flow (triggers → suggestions → notifications)
  - Availability calendar sync with booking system
  - Notification delivery (SES + WebSocket)

### End-to-End Tests
- **Scenarios:**
  - Complete flow: booking → conflict → AI suggestions → preferences → confirmation
  - Deadline enforcement (on-time, late, missed)
  - Instructor priority resolution
  - All options unavailable → regeneration

### Load Tests
- **Tool:** Artillery or k6
- **Scenarios:**
  - 100 concurrent flights being monitored
  - 20 simultaneous reschedule requests
  - Dashboard under load (50 concurrent users)
- **Targets:**
  - <3 minute notification delivery
  - <10 second dashboard load
  - <3% Lambda error rate

## Deployment Strategy

### CI/CD Pipeline (GitHub Actions or AWS CodePipeline)
```yaml
stages:
  - lint: ESLint + Prettier check
  - test: Run unit tests
  - build: Compile TypeScript, bundle frontend
  - deploy-staging: CloudFormation stack update
  - integration-test: Run tests against staging
  - deploy-production: Manual approval + CloudFormation
  - smoke-test: Verify production health
```

### Infrastructure as Code
- **Tool:** AWS CloudFormation (YAML templates)
- **Location:** `infrastructure/cloudformation/`
- **Stack Structure (11 templates):**
  - `cognito.yaml`: User pools, groups, identity pool
  - `rds.yaml`: PostgreSQL database with VPC, subnets, security groups
  - `lambda.yaml`: Three Lambda functions (weather monitor, reschedule engine, API handler)
  - `api-gateway.yaml`: REST and WebSocket APIs with Cognito authorizers
  - `eventbridge.yaml`: Scheduled rule for 10-minute weather monitoring
  - `ses.yaml`: Email service configuration
  - `cloudwatch.yaml`: Alarms and dashboards for monitoring
  - `secrets.yaml`: Secrets Manager for API keys and credentials
  - `sns.yaml`: Alert notification topics
  - `s3.yaml`: Frontend hosting bucket + logs bucket
  - `cloudfront.yaml`: CDN distribution for frontend

### Deployment Scripts
**Location:** `infrastructure/scripts/`

```bash
# Local development setup
./infrastructure/scripts/setup-local.sh
# - Checks prerequisites (Node.js, PostgreSQL, AWS CLI)
# - Installs all dependencies
# - Creates database and runs migrations
# - Loads seed data

# Staging deployment
./infrastructure/scripts/deploy-staging.sh
# - Validates all CloudFormation templates
# - Deploys infrastructure stacks in correct order
# - Requires environment variables: DB_MASTER_PASSWORD, API keys
# - Includes error handling and logging

# Production deployment
./infrastructure/scripts/deploy-production.sh
# - Pre-deployment checks (Git status, branch validation)
# - Uses CloudFormation change sets for safety
# - Manual approval steps
# - Enhanced monitoring and rollback capabilities
```

### Blue/Green Deployment (Lambda)
- Use Lambda aliases (blue = current, green = new version)
- Shift traffic gradually: 10% → 50% → 100%
- Monitor error rates at each stage
- Automatic rollback if errors exceed 3%

## Monitoring & Observability

### CloudWatch Metrics
**Custom Metrics:**
- `WeatherCheckCycleCount`: Count of monitoring cycles
- `ConflictsDetected`: Count of weather conflicts per cycle
- `AISchedulingDuration`: Time to generate suggestions
- `PreferenceSubmissionRate`: % submitted before deadline
- `ManualEscalationRate`: % requiring manual intervention
- `NotificationDeliverySuccess`: % successful email deliveries

**AWS Metrics:**
- Lambda: Invocations, Errors, Duration, Throttles, ConcurrentExecutions
- API Gateway: Count, Latency, 4xx, 5xx errors
- RDS: CPUUtilization, DatabaseConnections, FreeStorageSpace

### CloudWatch Alarms
```yaml
Alarms:
  - Lambda errors >3%: Page on-call engineer
  - API Gateway 5xx >5%: Page on-call engineer  
  - RDS CPU >80%: Alert ops team
  - Weather API failures >5%: Alert dev team
  - Notification delivery <90%: Alert ops team
  - EventBridge missed executions: Critical page
```

### Structured Logging
```typescript
logger.info('Weather monitoring cycle started', {
  cycleId: event.id,
  bookingCount: bookings.length,
  timestamp: new Date().toISOString()
});

logger.error('Weather API failure', {
  provider: 'OpenWeatherMap',
  coords: { lat: 37.7749, lon: -122.4194 },
  error: error.message,
  correlationId: requestId
});
```

**Log Aggregation:**
- All logs go to CloudWatch Logs
- Log groups per Lambda function
- Retention: 30 days for operational logs, 90 days for audit logs
- CloudWatch Logs Insights for querying

## Security Considerations

### Authentication & Authorization
- **Cognito User Pools:** Separate pools for staging and production
- **JWT Tokens:** 12-hour expiration, httpOnly cookies
- **Lambda Authorizers:** Validate JWT on every API request
- **Role-Based Access Control:** Students, Instructors, Admins with different permissions

### API Security
- **HTTPS Only:** Enforced via API Gateway
- **CORS:** Restricted to known frontend domains
- **Rate Limiting:** 1000 requests/second per user (API Gateway throttling)
- **Input Validation:** Joi schema validation on all inputs
- **SQL Injection Prevention:** Parameterized queries only

### Secret Management
- **Secrets Manager:** All API keys and credentials
- **Rotation Policy:** 90-day automatic rotation
- **IAM Policies:** Least privilege for Lambda execution roles
- **No Hardcoding:** Never commit secrets to repository

### Data Privacy
- **Encryption at Rest:** RDS and S3 with AWS KMS
- **Encryption in Transit:** TLS 1.2+ for all connections
- **PII Logging:** Never log email addresses or personal data in plain text
- **Access Logging:** All database queries logged for audit

## Performance Optimization

### Frontend
- **Code Splitting:** React.lazy() for route-based splitting
- **Tree Shaking:** Remove unused code in production build
- **Asset Optimization:** Minify JS/CSS, compress images
- **CDN:** CloudFront for global low-latency delivery
- **Caching:** Aggressive caching for static assets (1 year TTL)

### Backend
- **Lambda Cold Start Mitigation:**
  - Provisioned concurrency for scheduler and AI engine
  - Optimize package size (exclude dev dependencies)
  - Use AWS SDK v3 (modular imports)
  
- **Database Query Optimization:**
  - Composite indexes on frequently queried columns
  - EXPLAIN ANALYZE for slow queries
  - Connection pooling to reduce overhead
  - Read replicas for dashboard queries (if needed)

- **Weather API Optimization:**
  - 5-minute in-memory cache (aligned with 10-min cycle)
  - Batch requests for nearby locations (if API supports)
  - Parallel requests to both providers

- **AI Optimization:**
  - Set aggressive timeout (15 seconds)
  - Fallback to simpler rule-based logic
  - Cache availability calendar queries

## Cost Optimization

### Estimated Monthly Costs
- **Lambda:** $20-30 (with provisioned concurrency)
- **RDS:** $25-30 (t3.small production, t3.micro staging)
- **S3:** $2-5 (frontend + logs)
- **CloudWatch:** $5-10 (logs and metrics)
- **AI API:** $30-50 (Anthropic Claude)
- **Weather APIs:** $0 (within free tier)
- **SES:** $5 (5000 emails)
- **CloudFront:** $5
- **Total:** ~$100-150/month

### Cost Reduction Strategies
- Stay within weather API free tiers (1M calls/month each)
- Use Lambda free tier (1M requests/month)
- Aggressive caching to reduce API calls
- CloudWatch Logs retention: 7 days for non-critical logs
- S3 lifecycle policies: Move old logs to Glacier

## Disaster Recovery

### Backup Strategy
- **RDS Automated Backups:** Daily snapshots, 7-day retention
- **Manual Snapshots:** Before major deployments
- **Database Migrations:** Versioned, reversible
- **Code Repository:** GitHub as source of truth

### Recovery Procedures
- **RDS Failure:** Restore from latest snapshot (5-10 minute RPO)
- **Lambda Failure:** Automatic retry (3 attempts), dead letter queue
- **API Gateway Failure:** AWS handles redundancy
- **Complete Region Failure:** Manual deployment to alternate region (60-minute RTO)

### Rollback Plan
1. Identify issue in production
2. Check CloudWatch alarms and logs
3. If critical: Switch API Gateway stage to previous version
4. If database migration issue: Run rollback migration
5. Notify stakeholders
6. Post-mortem within 48 hours

## Known Technical Debt & Future Improvements

### Phase 1 (Current Scope)
- Basic in-memory caching (no Redis/Elasticache)
- Single-region deployment
- Manual scaling thresholds (no auto-tuning)
- Basic error handling (no circuit breakers)

### Phase 2 (Post-Launch)
- Redis/Elasticache for distributed caching
- Multi-region deployment for high availability
- Advanced AI model fine-tuning based on historical data
- WebSocket push notifications (replace polling)
- SMS notifications via SNS
- Google Calendar integration

### Phase 3 (Future Enhancements)
- Predictive cancellation using ML
- Native mobile apps (iOS/Android)
- Historical weather analytics dashboard
- Instructor workload balancing algorithms
- Integration with aircraft maintenance scheduling


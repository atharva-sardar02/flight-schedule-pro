# System Architecture

## Overview

Flight Schedule Pro is a serverless, event-driven system built on AWS that automatically monitors weather conditions for flight training lessons and uses AI to reschedule affected flights.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  React + Vite + shadcn/ui (S3/CloudFront)                      │
│  - Dashboard, Booking Management, Availability Calendar         │
│  - Rescheduling UI, Preference Ranking                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                      API Gateway Layer                           │
│  - REST API Endpoints (Cognito JWT validation)                  │
│  - WebSocket API for real-time notifications                    │
│  - Rate limiting (1000/500 req/sec)                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      Lambda Functions                            │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ API Handler     │  │ Weather Monitor  │  │ Reschedule     │ │
│  │ - auth.ts       │  │ - weatherMonitor │  │ Engine         │ │
│  │ - bookings.ts   │  │   (10-min cycle) │  │ - reschedule   │ │
│  │ - availability  │  │                  │  │ - validator    │ │
│  │ - preferences   │  │                  │  │ - conflict     │ │
│  │ - reschedule    │  └──────────────────┘  └────────────────┘ │
│  └─────────────────┘                                            │
└──────────┬───────────────────┬───────────────────┬──────────────┘
           │                   │                   │
┌──────────▼──────┐  ┌─────────▼────────┐  ┌──────▼──────────────┐
│  PostgreSQL RDS │  │  AWS Services    │  │ External APIs       │
│  - Users        │  │  - Cognito       │  │ - OpenWeatherMap    │
│  - Bookings     │  │  - SES (email)   │  │ - WeatherAPI.com    │
│  - Availability │  │  - Secrets Mgr   │  │ - Anthropic (AI)    │
│  - Notifications│  │  - EventBridge   │  │                     │
│  - Audit Logs   │  │  - SNS (alerts)  │  │                     │
└─────────────────┘  └──────────────────┘  └─────────────────────┘
```

---

## System Design Philosophy

### 1. Serverless-First
- **Lambda functions** for automatic scaling and cost efficiency
- **EventBridge** for scheduled triggers (no EC2 instances)
- **API Gateway** for HTTP/WebSocket APIs
- **Pay-per-use** model reduces costs

### 2. Event-Driven
- **EventBridge** triggers weather monitoring every 10 minutes
- **Weather conflicts** trigger AI rescheduling automatically
- **Preference submissions** trigger resolution workflow
- **Asynchronous processing** for non-critical operations

### 3. AI-Augmented
- **LangGraph workflow** for complex multi-constraint optimization
- **Anthropic Claude** for intelligent reasoning
- **7-day window search** with weather/availability validation
- **Confidence scoring** for option ranking

### 4. Safety-Critical
- **Multiple validation layers** (weather, availability, schedule)
- **Training-level-aware** weather minimums
- **Real-time weather re-validation** before confirmation
- **Never skip safety checks**

### 5. Resilient
- **Dual weather providers** (OpenWeatherMap + WeatherAPI.com)
- **Automatic failover** when primary provider fails
- **Graceful degradation** (partial success allowed)
- **Retry logic** with exponential backoff
- **Circuit breaker** pattern for external APIs

---

## Component Architecture

### Frontend Layer

**Technology Stack:**
- React 18+ with TypeScript
- Vite for build tooling
- shadcn/ui for UI components (Radix UI + Tailwind CSS)
- React Router for navigation
- Axios for API calls
- WebSocket for real-time updates

**Key Components:**
- `Dashboard` - Main overview with metrics and alerts
- `BookingList` - List and calendar views of bookings
- `CreateBooking` - Booking creation form
- `AvailabilityCalendar` - Availability management
- `ReschedulePage` - AI rescheduling workflow
- `PreferenceRanking` - Drag-and-drop preference selection

**State Management:**
- React Context for authentication (`useAuth`)
- Custom hooks for data fetching (`useAvailability`, `useNotifications`)
- Local state for component-specific data

**Code Splitting:**
- Route-based lazy loading for optimal performance
- Separate chunks for vendor libraries

---

### Backend Layer (Lambda Functions)

#### API Handler Functions

**`auth.ts`** - Authentication
- User registration (Cognito + database)
- User login (JWT token generation)
- Token refresh
- Current user info

**`bookings.ts`** - Booking Management
- CRUD operations for bookings
- Weather validation on creation
- Status management (CONFIRMED, AT_RISK, etc.)
- Role-based filtering

**`availability.ts`** - Availability Calendar
- Recurring pattern management
- One-time override management
- Computed availability generation
- Conflict detection

**`reschedule.ts`** - AI Rescheduling
- Generate reschedule options (triggers LangGraph)
- Get existing options
- Confirm reschedule (with weather re-validation)

**`preferences.ts`** - Preference Ranking
- Submit preference rankings
- Deadline enforcement
- Instructor priority resolution
- Manual escalation (admin)

#### Scheduled Functions

**`weatherMonitor.ts`** - Weather Monitoring
- Triggered by EventBridge every 10 minutes
- Checks all bookings within 48 hours
- Validates weather at 5 locations (departure + 3 waypoints + arrival)
- Updates booking status (CONFIRMED ↔ AT_RISK)
- **Automatically triggers AI rescheduling** when conflicts persist
- Sends notifications for conflicts and cleared conditions

#### AI Functions

**`rescheduleEngine.ts`** - AI Rescheduling Engine
- LangGraph workflow for multi-constraint optimization
- 7-day window search
- Weather validation for all candidates
- Availability checking (instructor + student)
- Ranking and selection of top 3 options

**`conflictDetector.ts`** - Conflict Detection
- Schedule conflict detection
- Weather conflict detection
- Training-level-aware validation

**`weatherValidator.ts`** - Weather Validation
- Multi-location weather checking
- Training-level minimums enforcement
- Weather forecast validation

---

### Data Layer

#### PostgreSQL Database (RDS)

**Tables:**
- `users` - User accounts (linked to Cognito)
- `bookings` - Flight bookings
- `availability_patterns` - Recurring availability
- `availability_overrides` - One-time availability changes
- `reschedule_options` - AI-generated reschedule options
- `preference_rankings` - User preference submissions
- `notifications` - In-app notifications
- `audit_log` - Immutable audit trail

**Key Design Decisions:**
- UUID primary keys throughout
- Foreign key constraints for data integrity
- Composite indexes for performance
- Optimistic locking (version columns)
- JSONB for flexible metadata

**Connection Pooling:**
- Global connection pool reused across Lambda invocations
- Max 5 connections per Lambda instance
- Connection timeout: 30 seconds
- Statement timeout: 10 seconds

---

### External Services

#### AWS Cognito
- User authentication and authorization
- JWT token generation and validation
- User pools for students, instructors, admins
- MFA support for admin roles

#### AWS SES
- Email notifications (weather alerts, options available, reminders, confirmations)
- HTML and plain text templates
- Bounce and complaint handling

#### AWS EventBridge
- Scheduled rule: Every 10 minutes
- Triggers `weatherMonitor` Lambda
- CloudWatch Events for monitoring

#### AWS Secrets Manager
- Stores API keys (OpenWeatherMap, WeatherAPI.com, Anthropic)
- Automatic rotation for database credentials (90 days)
- Encrypted at rest

#### AWS CloudWatch
- Logging for all Lambda functions
- Custom metrics (EMF format)
- Alarms for error rates, performance
- Dashboards for monitoring

---

## Data Flow Diagrams

### Weather Conflict Detection Flow

```
EventBridge (10-min trigger)
    ↓
weatherMonitor Lambda
    ↓
Query bookings (next 48 hours)
    ↓
For each booking:
    ├─→ Calculate flight corridor (3 waypoints)
    ├─→ Fetch weather (5 locations)
    ├─→ Apply training-level minimums
    └─→ If conflict:
        ├─→ Update status to AT_RISK
        ├─→ Log to audit_log
        ├─→ Send notifications
        └─→ If critical or persistent:
            └─→ Auto-trigger AI rescheduling
```

### AI Rescheduling Flow

```
Weather conflict detected
    ↓
rescheduleEngine Lambda (triggered automatically or manually)
    ↓
LangGraph Workflow:
    1. Find candidate slots (7-day window)
    2. Check weather for all slots
    3. Check availability (instructor + student)
    4. Rank and select top 3
    ↓
Save options to database
    ↓
Update booking status to RESCHEDULING
    ↓
Send notifications (options available)
```

### Preference Submission Flow

```
User receives notification
    ↓
Opens rescheduling page
    ↓
Views 3 AI-generated options
    ↓
Ranks preferences (drag-and-drop)
    ↓
Submits preferences
    ↓
API validates deadline not passed
    ↓
Save to database
    ↓
If both parties submitted:
    ├─→ Resolve using instructor priority
    ├─→ Re-validate weather
    ├─→ Update booking
    └─→ Send confirmation
```

---

## Security Architecture

### Authentication & Authorization

**Authentication:**
- AWS Cognito for user management
- JWT tokens for API access
- Token refresh mechanism
- MFA for admin roles

**Authorization:**
- Role-based access control (RBAC)
- Students: See own bookings only
- Instructors: See assigned bookings
- Admins: Full access

**API Security:**
- JWT validation on all endpoints
- CORS configuration
- Rate limiting (API Gateway)
- Input validation (Joi schemas)
- SQL injection prevention (parameterized queries)

### Data Security

**Encryption:**
- At rest: RDS encryption, S3 encryption
- In transit: TLS 1.2+ for all connections
- Secrets: AWS Secrets Manager (encrypted)

**Network Security:**
- RDS in private subnets
- Lambda in VPC for database access
- Security groups restrict access
- WAF rules in production

---

## Scalability & Performance

### Auto-Scaling

**Lambda:**
- Automatic scaling based on request volume
- Provisioned concurrency for critical functions (eliminates cold starts)
- Concurrent execution limits per function

**RDS:**
- Read replicas for production (read-heavy workloads)
- Connection pooling to manage connections
- Auto-scaling storage

**API Gateway:**
- Automatic scaling
- Throttling: 1000 burst, 500 sustained req/sec

### Performance Optimizations

**Database:**
- 15+ indexes for query optimization
- Composite indexes for common queries
- Partial indexes for filtered queries

**Caching:**
- Weather API caching (5-minute TTL)
- Coordinate rounding for better cache hit rate
- In-memory cache within Lambda execution context

**Frontend:**
- Code splitting (route-based)
- Tree shaking
- CloudFront CDN for static assets
- 1-year TTL for immutable assets

**Lambda:**
- Provisioned concurrency for critical functions
- Optimized memory allocation
- Connection pooling for database

---

## Monitoring & Observability

### CloudWatch Logs

**Structured Logging:**
- JSON format for all logs
- Correlation IDs for request tracing
- Log levels: ERROR, WARN, INFO, DEBUG

**Log Groups:**
- `/aws/lambda/weather-monitor`
- `/aws/lambda/api-handler`
- `/aws/lambda/reschedule-engine`

### CloudWatch Metrics

**Custom Metrics (EMF):**
- Weather checks count
- Weather conflicts detected
- Bookings created/updated
- Reschedule success rate
- Notification delivery rate
- API response times

**AWS Metrics:**
- Lambda invocations, errors, duration
- API Gateway 4xx/5xx errors, latency
- RDS CPU, connections, memory

### CloudWatch Alarms

**Critical Alarms:**
- Lambda error rate > 5%
- API Gateway 5xx > 5%
- RDS CPU > 80%
- Weather API failures > 5%
- Notification delivery < 90%

**Alarm Actions:**
- SNS topic for on-call notifications
- Auto-scaling triggers (if configured)

### CloudWatch Dashboards

**Main Dashboard:**
- Lambda metrics (9 widgets)
- API Gateway metrics
- RDS performance
- Custom business metrics
- Recent error logs

---

## Error Handling & Resilience

### Error Handling Strategy

**Centralized Error Handler:**
- `lambdaErrorHandler.ts` for consistent error responses
- Retryable vs non-retryable errors
- User-friendly error messages
- Detailed logging for debugging

**Graceful Degradation:**
- Weather monitor continues with partial failures
- Non-critical operations don't block main flow
- 207 Multi-Status for degraded operations

### Resilience Patterns

**Dual Provider:**
- Primary: OpenWeatherMap
- Secondary: WeatherAPI.com
- Automatic failover on failure
- Cross-validation for confidence

**Retry Logic:**
- Exponential backoff (1s, 2s, 4s)
- Max 3 retries
- Circuit breaker pattern

**Dead Letter Queues:**
- Failed Lambda invocations
- Manual review and retry

---

## Integration Points

### Weather APIs

**OpenWeatherMap:**
- Primary provider
- Current weather + forecasts
- Rate limit: 1000 calls/day

**WeatherAPI.com:**
- Secondary provider (backup)
- Current weather + forecasts
- Rate limit: 1 million calls/month

**Integration Pattern:**
- Parallel queries to both providers
- Cross-validation for confidence
- Failover to secondary on primary failure

### AI Service

**Anthropic Claude:**
- LangGraph workflow execution
- Multi-constraint optimization
- Reasoning for option selection

**Integration Pattern:**
- Async invocation for long-running workflows
- 15-second timeout
- Fallback to rule-based scheduling on timeout

---

## Database Schema Overview

### Core Tables

**users**
- User accounts linked to Cognito
- Roles: STUDENT, INSTRUCTOR, ADMIN
- Training levels for students

**bookings**
- Flight bookings
- Status: CONFIRMED, AT_RISK, RESCHEDULING, CANCELLED, COMPLETED
- Links to student and instructor

**availability_patterns**
- Weekly recurring availability
- Day of week, start time, end time
- Active/inactive flag

**availability_overrides**
- One-time availability changes
- Block or add availability
- Date-specific

**reschedule_options**
- AI-generated reschedule suggestions
- Weather scores, confidence, reasoning
- Links to booking

**preference_rankings**
- User preference submissions
- Option rankings (1st, 2nd, 3rd)
- Deadline tracking

**notifications**
- In-app notifications
- Read/unread status
- Links to bookings

**audit_log**
- Immutable event log
- All significant actions
- Compliance and debugging

See `docs/DATABASE_SCHEMA.md` for detailed schema documentation.

---

## Deployment Architecture

### Infrastructure as Code

**CloudFormation Templates:**
- 11 templates for all AWS resources
- Parameterized for environment-specific config
- Dependency management between stacks

**Deployment Scripts:**
- Automated deployment to staging/production
- Validation and rollback support
- Blue/green deployment for production

### Environment Separation

**Development:**
- Local PostgreSQL
- Local Express server
- Local React dev server

**Staging:**
- AWS RDS t3.micro
- Lambda functions
- Separate Cognito user pool
- Test API keys

**Production:**
- AWS RDS t3.small + read replica
- Lambda with provisioned concurrency
- Production Cognito user pool
- Production API keys
- WAF rules enabled

---

## Technology Decisions

### Why Serverless?
- **Cost Efficiency:** Pay only for actual usage
- **Auto-Scaling:** Handles traffic spikes automatically
- **No Infrastructure Management:** Focus on business logic
- **High Availability:** Built-in redundancy

### Why LangGraph?
- **Complex Workflows:** Multi-step decision making
- **State Management:** Tracks workflow state
- **Error Handling:** Built-in retry and error recovery
- **Observability:** Workflow visualization

### Why PostgreSQL?
- **ACID Compliance:** Data integrity guarantees
- **Relational Model:** Natural fit for bookings/availability
- **JSONB Support:** Flexible metadata storage
- **Performance:** Excellent query performance with indexes

### Why Dual Weather Providers?
- **Resilience:** No single point of failure
- **Accuracy:** Cross-validation increases confidence
- **Rate Limits:** Distribute load across providers

---

## Future Considerations

### Potential Enhancements

1. **SMS Notifications:** Add Twilio integration
2. **Google Calendar Sync:** Two-way sync with Google Calendar
3. **Mobile App:** React Native mobile application
4. **Advanced Analytics:** ML-based demand forecasting
5. **Multi-Region:** Deploy to multiple AWS regions

### Scalability Limits

**Current Capacity:**
- 1000+ concurrent users
- 10,000+ bookings
- 100+ weather checks per cycle

**Scaling Path:**
- Add read replicas for database
- Increase Lambda concurrency
- Add CloudFront edge locations
- Implement Redis caching layer

---

**Last Updated:** November 2024  
**Version:** 0.1.0


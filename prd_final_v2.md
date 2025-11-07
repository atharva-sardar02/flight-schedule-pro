# Product Requirements Document
## Weather Cancellation & AI Rescheduling System

**Project Code:** GOLD_FSP  
**Estimated Development Time:** 3–5 days  
**Category:** AI Solution  
**Status:** Final Submission Requirements  
**Version:** 2.0 - All Critical Gaps Resolved

---

## 1. User Stories

### Students
- As a student pilot, I want to receive real-time notifications when my flight lesson is at risk due to weather so I can plan accordingly.
- As an instrument-rated student, I want the system to understand my training level and only cancel flights when conditions exceed my capabilities.
- As a student, I want to receive AI-suggested alternative time slots that work with my schedule so I can quickly reschedule without back-and-forth communication.
- As a student, I want to manage my weekly availability in the web app so the AI can suggest times that work for me.
- As a student, I want to view my flight status and any active weather alerts in a dashboard so I have visibility into my training schedule.

### Flight Instructors
- As an instructor, I want to be notified of all weather-related cancellations for my scheduled lessons so I can adjust my day.
- As an instructor, I want to manage my availability calendar so the system only suggests times when I'm free.
- As an instructor, I want the system to suggest rescheduling options that consider both my availability and the student's training requirements.
- As an instructor, I want to see a consolidated view of all affected flights and weather conditions across multiple locations.

### System Administrators
- As an admin, I want to track all booking changes, cancellations, and reschedules for operational analysis.
- As an admin, I want to monitor the accuracy of weather conflict detection to ensure student safety.
- As an admin, I want to access metrics on rescheduling efficiency and system performance.

---

## 2. Complete Launch Feature Set

### Core Features (Required for Launch)

#### Weather Monitoring & Conflict Detection
- **Automated weather monitoring every 10 minutes** at takeoff, landing, and flight corridor locations
- Real-time conflict detection based on training level-specific weather minimums
- Multi-location weather data aggregation (departure, arrival, and corridor coordinates)
- **Flight corridor defined as straight-line path** between departure and arrival, sampled at 3 evenly-spaced waypoints
- Pre-alert system to notify stakeholders of potential conflicts before they become critical

#### Training Level-Aware Safety Logic
- **Student Pilot:** Clear skies required, visibility > 5 mi, winds < 10 kt
- **Private Pilot:** Visibility > 3 mi, ceiling > 1000 ft
- **Instrument Rated:** IMC acceptable, but no thunderstorms or icing conditions

#### Availability Management System
- **Built-in calendar interface** for instructors and students to manage their weekly availability
- Recurring availability patterns (e.g., "available Mon/Wed/Fri 9am-5pm")
- One-time availability overrides (e.g., "not available Dec 25")
- Real-time availability sync for conflict checking
- Calendar data stored in dedicated PostgreSQL tables linked to user profiles

#### AI-Powered Rescheduling
- **AI searches 7-day window** from cancellation date for alternative time slots
- AI generates 3 valid alternative time slots that:
  - Do not conflict with existing schedules for both instructor and student (checked against availability calendars)
  - Have acceptable weather conditions at takeoff, landing, AND flight corridor locations
  - Consider student training level and weather forecast requirements
  - Align with both parties' availability patterns from their calendars
- **Preference submission deadline:** Users have until **whichever comes first**:
  - 30 minutes before original departure time, OR
  - 12 hours after receiving notification
- Both instructor and student rank the 3 options by preference (1st, 2nd, 3rd)
- Instructor can optionally mark specific slots as "not available" if none work
- Final slot selection uses instructor's highest-ranked available option
- System re-validates weather conditions for selected slot before confirming
- If instructor marks all options unavailable, AI generates new set of options
- **If no preferences submitted by deadline:** System escalates to manual scheduling and notifies both parties

#### Notification System
- Real-time email notifications to affected students and instructors
- In-app alert system with conflict details
- Notification triggers on weather conflict detection
- Preference deadline reminders sent 2 hours before cutoff
- Escalation notifications if deadline passes without response

#### Central Dashboard
- Live weather alerts display
- Current flight status tracking
- Visual indicators for at-risk bookings
- Weather condition summary by location (departure, corridor waypoints, arrival)
- Availability calendar view for personal schedule management

#### Data Management
- Complete booking lifecycle tracking
- Cancellation and reschedule event logging
- Historical data retention for analysis
- Availability calendar data storage and version history

---

## 3. Technical Stack with Rationale

### Frontend
**Technology:** React with TypeScript  
**Rationale:** Type safety for complex flight data structures, component reusability for dashboard and calendar views, strong ecosystem for real-time UI updates.

### Backend & AI
**Technology:** TypeScript with LangGraph  
**Deployment:** AWS Lambda functions for serverless scalability  
**AI Integration:** LangGraph integrated within Lambda using LangChain TypeScript SDK  
**Rationale:** TypeScript provides type safety across the entire stack, reducing runtime errors and improving code maintainability. LangGraph enables complex multi-step AI workflows for intelligent scheduling that considers multiple constraints (weather at takeoff/landing/corridor, existing schedules from availability calendars for both parties, training level requirements). Lambda provides automatic scaling, pay-per-use pricing, and seamless integration with other AWS services. The graph-based approach allows for iterative refinement of time slot suggestions and clear workflow visualization.

### Cloud Platform
**Technology:** AWS  
**Rationale:** Comprehensive cloud platform with services for serverless functions (Lambda for backend, scheduler, and AI workflows), managed databases (RDS for PostgreSQL), reliable notification services (SES for email), authentication (Cognito), and event scheduling (EventBridge for 10-minute triggers). TypeScript backend deployed as Lambda functions with auto-scaling.

### Database
**Technology:** PostgreSQL on AWS RDS  
**Rationale:** Structured relational data model ideal for flight bookings and availability calendars with strong consistency guarantees, ACID compliance for critical scheduling operations, and excellent support for complex queries involving availability conflicts and time-based lookups. Dedicated tables for instructor/student availability patterns enable efficient conflict checking.

### Authentication
**Technology:** AWS Cognito  
**Rationale:** Managed authentication service with built-in user pools, secure token management, role-based access control (students, instructors, admins), and seamless integration with Lambda and API Gateway. Reduces development overhead and provides enterprise-grade security.

### Weather Data Caching
**Technology:** In-memory caching within Lambda execution context  
**Rationale:** 5-minute TTL aligns with 10-minute check cycle, reduces API costs, and improves response time. Lambda execution context reuse provides natural caching layer without additional infrastructure.

### External APIs
**Weather Data:** OpenWeatherMap AND WeatherAPI.com (dual provider for redundancy)  
**Rationale:** Using both providers ensures high availability and cross-validation of weather data. If one API fails or returns questionable data, the system can use the secondary provider. Both offer coordinate-based lookups, frequent updates, and aviation-relevant metrics (visibility, ceiling, wind). Dual-provider strategy stays within rate limits by distributing load.

---

## 4. Acceptance Criteria

All criteria must be met for launch approval:

### Weather Monitoring
- [ ] Weather conflicts are automatically detected with 100% accuracy for test scenarios
- [ ] Weather checked every 10 minutes without missed cycles
- [ ] Dual weather API failover executes correctly when primary provider fails
- [ ] Corridor weather validated at 3 waypoints along straight-line path
- [ ] Weather data cached for 5 minutes to reduce API calls

### Notification System
- [ ] Notifications successfully delivered to all affected parties within 2 minutes of detection
- [ ] Preference deadline reminders sent 2 hours before cutoff
- [ ] Escalation notices sent when deadline passes without response
- [ ] Email and in-app notifications sent successfully for every conflict event

### AI Rescheduling
- [ ] AI generates 3 time slots with zero schedule conflicts for both parties (validated against availability calendars)
- [ ] All suggested time slots validated for weather at takeoff, landing, AND corridor
- [ ] AI searches 7-day window from cancellation for alternatives
- [ ] Preference ranking system works correctly (1st, 2nd, 3rd choice)
- [ ] Instructor "not available" marking triggers new slot generation
- [ ] Final selection uses instructor's highest-ranked available option
- [ ] Instructor priority rule correctly resolves preference conflicts
- [ ] Weather re-validation occurs before final confirmation

### Availability Management
- [ ] Instructors and students can create/edit weekly availability patterns
- [ ] One-time overrides properly block availability
- [ ] Availability calendar syncs in real-time for conflict checking
- [ ] AI respects availability constraints when generating suggestions

### Deadline Management
- [ ] System correctly calculates deadline as min(30 min before departure, 12 hours after notification)
- [ ] Preferences submitted after deadline are rejected
- [ ] System escalates to manual scheduling when deadline passes
- [ ] Deadline countdown displayed in notification and dashboard

### Database & Dashboard
- [ ] Database updates reflect all booking status changes within 1 second
- [ ] Dashboard displays live alerts with <5 second latency
- [ ] Availability calendar changes propagate to dashboard immediately
- [ ] All reschedule actions logged with complete audit trail

### Training Level Logic
- [ ] AI correctly applies weather minimums based on training level in 100% of test cases
- [ ] Weather API returns valid JSON for all required geographic locations
- [ ] Background scheduler executes every 10 minutes without failures

---

## 5. Success Metrics

### Primary Metrics
- **Bookings Created:** Total flight lessons scheduled in system
- **Weather Conflicts Detected:** Number of unsafe conditions identified
- **Successful Reschedules:** Confirmed rebookings from AI suggestions
- **Average Rescheduling Time:** Duration from cancellation to confirmation
- **Preference Submission Rate:** % of users who submit rankings before deadline

### Secondary Metrics
- Weather API uptime and response time (both providers)
- Notification delivery rate
- AI suggestion acceptance rate
- Dashboard load time
- System processing latency (detection to notification)
- Availability calendar usage rate
- Deadline escalation frequency

### Target KPIs
- 99.5% weather conflict detection accuracy
- <3 minute average time from detection to notification
- >70% AI suggestion acceptance rate
- <10 second dashboard refresh time
- >90% preference submission before deadline
- <2% manual escalation rate

---

## 6. Privacy & Security Considerations

### Data Privacy
- Student personal information (email, phone) stored with encryption at rest
- Access controls implemented for role-based data visibility (AWS Cognito user pools)
- PII access logged for audit compliance
- Geographic coordinates anonymized in analytics exports
- Availability calendar data restricted to user and authorized instructors/admins

### Security Requirements
- API keys stored in AWS Secrets Manager, never committed to repository
- HTTPS enforced for all external communications
- AWS Cognito authentication required for dashboard and API access
- JWT tokens for stateless API authentication
- Rate limiting on weather API calls to prevent abuse
- Input validation on all user-provided data
- SQL injection prevention through parameterized queries
- CORS policies restrict API access to authorized domains

### Compliance
- Email communications include opt-out mechanisms
- Data retention policy defined (minimum required for operational analysis)
- .env.template provided for secure configuration management
- Cognito user pools configured with password complexity requirements
- Multi-factor authentication available for instructor and admin roles

---

## 7. Scalability & Reliability Requirements

### Scalability
- System must handle monitoring for 100+ concurrent flights
- Weather monitoring occurs every 10 minutes (144 cycles per day)
- Lambda functions auto-scale based on load (concurrent executions)
- Weather API calls optimized to minimize redundant requests for nearby locations
- Dual weather API providers load-balanced to stay within rate limits
- Database queries indexed on scheduledDate, status, and availability time ranges
- Connection pooling in Lambda for database efficiency
- Availability calendar queries optimized with composite indexes

### Reliability
- Dual weather API providers with automatic failover if primary fails
- Weather API failures handled gracefully with retry logic (3 attempts with exponential backoff)
- Cross-validation between two weather sources to detect anomalous data
- Fallback notification mechanisms if primary email delivery fails
- Database connection pooling in Lambda execution context to prevent exhaustion
- Idempotent operations to prevent duplicate notifications
- Error logging and monitoring for all critical paths (CloudWatch)
- Lambda function timeout set to 30 seconds with dead letter queue for failures
- EventBridge scheduled rules with CloudWatch alarms for missed executions

### Performance
- Weather data cached in-memory for 5 minutes to reduce API load (aligns with 10-minute check cycle)
- Dashboard queries optimized with pagination for large datasets
- Async processing for notification dispatch (non-blocking)
- Lambda cold start mitigation with provisioned concurrency for critical functions
- Availability calendar lookups indexed by user_id and time_range

---

## 8. Integration Requirements

### External Systems

#### Weather APIs (OpenWeatherMap AND WeatherAPI.com)
- Coordinate-based weather queries to both providers
- 10-minute polling interval for current conditions and short-term forecasts
- Aviation-specific parameters (visibility, ceiling, wind speed/direction)
- API key authentication for both services (stored in Secrets Manager)
- Failover logic if one provider is unavailable
- Corridor weather checked at 3 waypoints on straight-line path

#### Email Service Provider
- AWS SES for transactional email delivery
- Template support for standardized notifications
- Delivery status tracking via SES event publishing
- Bounce and complaint handling

#### Authentication Provider
- AWS Cognito for user authentication and authorization
- User pools for students, instructors, and admins
- JWT token validation in Lambda authorizers
- Role-based access control (RBAC) for API endpoints

### Internal Data Flow
- Availability calendar system integrated with user profiles
- Booking system reads from availability tables for conflict checking
- Dashboard real-time data feed via WebSocket (API Gateway WebSocket API) or short polling (15-second intervals)
- Lambda functions communicate via direct invocation and EventBridge events
- CloudWatch Logs for centralized logging and monitoring

---

## 9. Database Schema Additions

### New Tables for Availability Management

#### `instructor_availability`
- `id` (UUID, primary key)
- `instructor_id` (foreign key to users table)
- `day_of_week` (integer 0-6, where 0=Sunday)
- `start_time` (time)
- `end_time` (time)
- `is_recurring` (boolean)
- `created_at`, `updated_at`

#### `student_availability`
- `id` (UUID, primary key)
- `student_id` (foreign key to users table)
- `day_of_week` (integer 0-6)
- `start_time` (time)
- `end_time` (time)
- `is_recurring` (boolean)
- `created_at`, `updated_at`

#### `availability_overrides`
- `id` (UUID, primary key)
- `user_id` (foreign key to users table)
- `user_type` (enum: 'instructor', 'student')
- `override_date` (date)
- `start_time` (time, nullable for all-day blocks)
- `end_time` (time, nullable for all-day blocks)
- `is_available` (boolean - true for adding availability, false for blocking)
- `reason` (text, optional)
- `created_at`

### Indexes
- Composite index on `(user_id, day_of_week, start_time)` for availability tables
- Index on `(override_date, user_id)` for overrides table
- Index on `(scheduledDate, status)` for bookings table

---

## 10. Accessibility Requirements

- Dashboard adheres to WCAG 2.1 Level AA standards
- Color-coded alerts include text labels (not color-dependent)
- Keyboard navigation supported for all interactive elements including calendar
- Screen reader compatible semantic HTML with ARIA labels
- Sufficient color contrast ratios (minimum 4.5:1 for text)
- Focus indicators visible on all interactive components
- Calendar date picker accessible via keyboard and screen readers
- Time slot selection interface keyboard-navigable

---

## 11. Testing & QA Strategy

### Unit Testing
- Weather API integration returns valid JSON for all providers
- Safety logic correctly evaluates all training level scenarios
- Database CRUD operations execute without data loss
- AI output generates required number of options
- Availability calendar lookups return correct free time blocks
- Deadline calculation logic handles edge cases correctly

### Integration Testing
- End-to-end flow from weather detection to notification delivery
- Dashboard updates reflect database changes accurately
- Scheduler triggers weather checks every 10 minutes at correct intervals
- Multi-location weather aggregation logic (takeoff, 3 corridor waypoints, landing)
- Preference ranking flow with deadline enforcement
- AI schedule conflict detection against availability calendars
- Instructor priority resolution when rankings differ
- Weather re-validation before final confirmation
- Availability calendar sync with booking system
- Manual escalation when deadline passes

### Test Scenarios

#### Weather Detection
- Student Pilot in marginal VFR conditions (should cancel)
- Instrument Rated pilot in IMC without convective activity (should proceed)
- Private Pilot with visibility at exactly 3 mi (boundary case)
- Simultaneous conflicts for multiple bookings
- Corridor weather deteriorates at waypoint 2 while takeoff/landing are acceptable
- Dual weather API returns conflicting data (cross-validation test)
- Primary weather API fails, secondary takes over

#### Rescheduling Logic
- Conflicting preferences between instructor and student (verify instructor priority)
- All 3 suggested slots marked unavailable by instructor (verify new generation)
- Existing schedule conflicts prevent AI from finding valid options
- Student has no availability in 7-day window
- Instructor blocked by availability override on suggested date

#### Deadline Management
- Flight in 25 minutes: deadline should be 25 minutes (30-min rule)
- Flight in 24 hours: deadline should be 12 hours (12-hour rule)
- Preference submitted after deadline (should reject)
- System escalates correctly when no response by deadline
- Reminder notification sent 2 hours before deadline

#### Availability System
- Recurring availability pattern correctly blocks conflicting times
- One-time override takes precedence over recurring pattern
- Calendar changes propagate to AI suggestions immediately
- Multiple availability windows in same day handled correctly

#### Edge Cases
- Weather API timeout/failure scenarios (verify failover)
- Invalid coordinate handling
- Lambda execution timeout during complex scheduling
- Concurrent booking attempts for same time slot
- User submits availability changes during active rescheduling

### QA Checklist
- [ ] All weather minimums applied correctly per training level
- [ ] Notification emails contain correct flight details and rebooking links
- [ ] Dashboard loads without errors and displays real-time data
- [ ] Database logs complete audit trail for each reschedule
- [ ] Background process runs reliably every 10 minutes
- [ ] System handles edge cases (missing data, API failures, Lambda timeouts) gracefully
- [ ] Dual weather API system validates data and fails over correctly
- [ ] Instructor priority correctly resolves conflicting preferences
- [ ] Schedule conflict detection prevents double-booking
- [ ] Corridor weather validation works for 3-waypoint straight-line path
- [ ] Availability calendars sync correctly with booking system
- [ ] Deadline calculation and enforcement work correctly
- [ ] Manual escalation triggers when deadline passes
- [ ] AWS Cognito authentication works for all user roles

---

## 12. Rollout Plan

### Phase 1: Internal Testing (Day 1)
- Deploy to staging environment on AWS
- Load mock data for all training levels
- Create test availability calendars for instructors and students
- Execute full test suite
- Validate weather API connectivity and failover
- Test deadline calculation edge cases
- Verify Cognito authentication flows

### Phase 2: Limited Pilot (Day 2)
- Enable for subset of bookings (10-20 flights)
- Monitor notifications and AI suggestions
- Verify instructor priority logic in conflict resolution
- Test schedule conflict detection with real availability calendar data
- Validate corridor weather checking accuracy (3 waypoints)
- Gather feedback on preference ranking interface usability
- Test deadline enforcement and escalation
- Verify metric collection
- Monitor 10-minute monitoring cycle under real load
- Monitor Lambda cold starts and execution times
- Test availability calendar UI with real users

### Phase 3: Full Launch (Day 3)
- Enable for all scheduled flights
- Activate 10-minute background monitoring
- Monitor system performance and error rates
- Monitor dual weather API performance and failover events
- Monitor deadline compliance and escalation rates
- Provide support documentation for availability calendar management
- CloudWatch dashboards active for all metrics

### Rollback Criteria
- >10% notification delivery failure rate
- Weather conflict false positive rate >5%
- Dashboard downtime >15 minutes
- Critical security vulnerability discovered
- Lambda function failures >3% of executions
- Availability calendar sync failures >2%
- Deadline calculation errors detected
- Authentication failures affecting >5% of users

---

## 13. Analytics & Telemetry

### Event Tracking
- `weather_conflict_detected`: Timestamp, location (departure/waypoints/arrival), conditions, training level
- `notification_sent`: Recipient type, delivery status, timestamp, deadline
- `reschedule_suggested`: Number of options, AI processing time, constraints checked (weather + availability calendars)
- `preference_submitted`: User role (instructor/student), ranking order, timestamp, time until deadline
- `preference_conflict`: Instructor choice vs student choice, final selection rationale
- `deadline_missed`: User(s) who didn't respond, escalation triggered
- `reschedule_confirmed`: Selected option, time to confirmation, deadline margin
- `dashboard_viewed`: User role, session duration
- `api_call_made`: Provider, endpoint, response time, status, failover events
- `availability_updated`: User type, change type (recurring/override), timestamp
- `manual_escalation`: Reason, timestamp, users notified

### Logging Requirements
- All weather API requests and responses (including corridor waypoint locations)
- Notification delivery attempts and outcomes
- AI decision rationale for reschedule suggestions (which constraints applied)
- LangGraph workflow execution steps and intermediate results
- Schedule conflict detection results from availability calendars
- Preference ranking submissions and final selection logic
- Deadline calculation and enforcement events
- Database transaction errors
- Background scheduler execution logs (EventBridge)
- Lambda function performance metrics (execution time, memory usage, cold starts)
- Availability calendar queries and updates
- Authentication events (login, logout, failed attempts)
- CloudWatch Logs with structured JSON for easy querying

### Monitoring Dashboards (CloudWatch)
- Real-time conflict detection rate
- Notification success rate by channel
- AI suggestion generation performance
- Weather API uptime and latency (both providers)
- Database query performance metrics
- Lambda function error rates and durations
- Deadline compliance rate
- Manual escalation frequency
- Availability calendar usage statistics
- Authentication success/failure rates
- EventBridge scheduler health

---

## 14. Explicit Non-Goals

The following are **out of scope** for this launch:

- SMS notification system (bonus feature, not required)
- Google Calendar integration (bonus feature, not required)
- Historical weather analytics and prediction improvements (future enhancement)
- Predictive cancellation using machine learning (future enhancement)
- Mobile application with push notifications (bonus feature, not required)
- Manual override interface for administrators to force cancellations
- Student preference learning (AI adapting to individual scheduling patterns)
- Multi-day weather forecasting beyond 7-day rescheduling window
- Integration with aircraft maintenance scheduling
- Instructor workload balancing across rescheduled lessons
- Automated refund or credit processing
- Multi-language support for notifications
- Advanced corridor weather modeling (turbulence prediction, detailed icing levels beyond basic detection)
- Shared calendar visibility between students and instructors
- Recurring flight lesson templates
- Integration with external calendar systems (Outlook, Google Calendar)

---

## 15. Risks, Trade-offs & Mitigations

### Risk: Weather API Rate Limiting or Downtime
**Impact:** Critical system failure; cannot detect conflicts  
**Mitigation:** Use dual weather API providers (OpenWeatherMap + WeatherAPI.com) with automatic failover, implement 5-min caching aligned with 10-min checks, exponential backoff retry logic, cross-validate data between providers, CloudWatch alarms for API failures  
**Trade-off:** Increased cost ($50-100/month for both APIs) and complexity vs. high reliability and data validation

### Risk: AI Generates Invalid or Suboptimal Reschedule Options
**Impact:** Schedule conflicts, low user acceptance, manual intervention required  
**Mitigation:** LangGraph multi-step validation workflow checks: (1) query availability calendars for conflicts, (2) weather at all five locations (takeoff + 3 corridor waypoints + arrival), (3) training level requirements, (4) re-validates before final confirmation. Implement fallback to rule-based scheduling if AI fails. Log all suggestions for iterative improvement. Set 15-second timeout for AI processing.  
**Trade-off:** Complex AI workflow increases latency (5-10 seconds) vs. higher quality conflict-free suggestions

### Risk: Notification Delivery Failures
**Impact:** Students/instructors unaware of cancellations, safety concerns  
**Mitigation:** AWS SES with delivery status tracking, retry failed sends (3 attempts), provide in-app fallback, CloudWatch alarms for delivery failures >5%, send notifications through multiple channels (email + in-app)  
**Trade-off:** Potential duplicate notifications vs. guaranteed delivery

### Risk: Complex Multi-Constraint Scheduling Logic
**Impact:** AI fails to find valid options, long processing times, schedule conflicts slip through  
**Mitigation:** LangGraph workflow breaks problem into steps: (1) fetch availability calendars, (2) identify free time blocks, (3) check weather forecasts for each location, (4) apply training requirements, (5) rank by optimality. Set 15-second timeout with fallback to simpler logic. Comprehensive logging of constraint failures. Availability calendar pre-indexed for fast lookups.  
**Trade-off:** Processing complexity and 5-10 second latency vs. zero-conflict guarantee

### Risk: Conflicting Time Slot Preferences
**Impact:** Instructor and student rank different options as #1, requiring clear resolution  
**Mitigation:** Implement instructor priority rule automatically (use instructor's highest-ranked choice), notify both parties of final selection with transparent reasoning (e.g., "Instructor's 2nd preference selected as 1st choice unavailable"), provide option for student to request alternative if needed. Log all preference patterns for UX improvement.  
**Trade-off:** Student autonomy vs. operational efficiency and instructor authority

### Risk: Missed Preference Submission Deadline
**Impact:** No preference submitted by 30-min or 12-hour deadline, lesson remains unscheduled  
**Mitigation:** Send reminder notification 2 hours before deadline, auto-escalate to manual scheduling if deadline passes, notify both parties and dispatch team, log escalation events for process improvement, display countdown timer in dashboard and emails  
**Trade-off:** Manual intervention required vs. system automation, potential delayed rescheduling

### Risk: Availability Calendar Sync Issues
**Impact:** AI suggests times when user is actually unavailable, leading to conflicts  
**Mitigation:** Real-time sync of availability changes to booking system, optimistic locking on calendar updates, validate availability immediately before sending suggestions, allow users to mark suggested slots as "not available" triggering new generation, audit trail of all calendar changes  
**Trade-off:** Database write load vs. accurate conflict detection

### Risk: Database Performance Degradation with Scale
**Impact:** Slow dashboard, delayed conflict detection  
**Mitigation:** Composite indexes on (scheduledDate, status) and (user_id, day_of_week, start_time), implement query pagination, use Lambda-managed connection pooling, monitor slow queries via RDS Performance Insights, read replicas for dashboard queries if needed  
**Trade-off:** Storage overhead for indexes vs. query performance

### Risk: False Positives in Weather Conflict Detection
**Impact:** Unnecessary cancellations, user frustration  
**Mitigation:** Implement confidence thresholds, dual-provider cross-validation, allow instructor override option in future iteration, tune weather minimums based on real-world feedback, log all detection decisions for analysis  
**Trade-off:** Safety-first approach vs. operational efficiency

### Risk: Lambda Execution Limits and Cold Starts
**Impact:** 15-minute max Lambda timeout may not suffice for complex AI workflows, cold starts add 1-3 second latency  
**Mitigation:** Optimize LangGraph execution, break complex operations into smaller Lambda functions, use Step Functions for long-running workflows if needed, provisioned concurrency for critical functions (scheduler, AI engine), monitor execution times via CloudWatch, set aggressive timeouts (30 seconds) with dead letter queue  
**Trade-off:** Increased AWS costs ($20-50/month for provisioned concurrency) vs. consistent performance

### Risk: Aggressive 10-Minute Monitoring Frequency
**Impact:** High API costs, potential rate limiting, increased system load (144 cycles/day × 100 flights = 14,400+ API calls/day)  
**Mitigation:** Implement 5-minute caching aligned with 10-min checks, batch requests for nearby locations, monitor API usage via CloudWatch, use dual providers to distribute load (7,200 calls/provider/day well within free tier limits), consider adaptive frequency in future (10-min for near-term flights <24 hours, 30-min for distant flights)  
**Trade-off:** Real-time safety awareness vs. operational costs (~$0 with free tiers, ~$50-100/month if scaling beyond 1M calls/month)

### Risk: Insufficient Testing Window (3-5 days)
**Impact:** Bugs reach production, poor user experience  
**Mitigation:** Prioritize core features over bonus items, automate testing where possible, implement comprehensive error logging via CloudWatch, plan for rapid hotfix deployment via Lambda versioning and aliases, blue-green deployment strategy  
**Trade-off:** Feature completeness vs. stability

### Risk: Timezone Handling Errors
**Impact:** Incorrect scheduling, missed flights, deadline calculation errors  
**Mitigation:** Store all timestamps in UTC in database, convert to user's local timezone for display, validate timezone data for all locations, use moment-timezone or date-fns-tz library, extensive timezone edge case testing  
**Trade-off:** Implementation complexity vs. correctness

### Risk: Authentication and Authorization Failures
**Impact:** Unauthorized access, data breaches, system unavailability  
**Mitigation:** AWS Cognito with user pools for role-based access, JWT token validation in Lambda authorizers, session timeout after 12 hours, MFA available for admin roles, CloudWatch alarms for failed auth attempts >10/hour, API Gateway throttling (1000 requests/second)  
**Trade-off:** Additional auth layer latency (50-100ms) vs. security

---

## 16. Assumptions

The following assumptions underpin this PRD and must hold true for successful delivery:

1. Weather API providers return aviation-relevant data (visibility, ceiling, winds) for provided coordinates with sufficient update frequency
2. Both OpenWeatherMap and WeatherAPI.com have compatible data formats for cross-validation
3. Student training level data is accurate and up-to-date in the system
4. All booking records include valid departure and arrival location coordinates for corridor calculation
5. Email addresses for students and instructors are valid and monitored
6. EventBridge can reliably trigger Lambda functions every 10 minutes without failures
7. LangGraph can process scheduling logic within 15 seconds using availability calendar data
8. PostgreSQL RDS supports required query load without significant optimization
9. **Weather conditions evaluated every 10 minutes** for flights within 48 hours of departure
10. Three reschedule options are sufficient for user needs
11. Students and instructors respond to notifications within deadline window
12. Users will actively maintain their availability calendars for accurate conflict detection
13. Straight-line flight corridor between departure and arrival is acceptable approximation (3 waypoints sufficient)
14. AWS Lambda execution context reuse provides adequate caching for weather data (5-min TTL)
15. GitHub repository is adequate for code delivery and documentation
16. Demo video platform available and accessible to stakeholders

---

## 17. Resolved Critical Questions

All critical questions from previous version have been resolved:

### Technical Architecture
1. ✅ **Database:** PostgreSQL on AWS RDS
2. ✅ **AI provider:** LangGraph with LangChain TypeScript SDK
3. ✅ **Cloud platform:** AWS
4. ✅ **Weather API:** Both OpenWeatherMap AND WeatherAPI.com for redundancy
5. ✅ **Backend deployment:** AWS Lambda functions (serverless)
6. ✅ **LangGraph hosting:** Integrated within Lambda functions using LangChain TypeScript SDK
7. ✅ **Authentication system:** AWS Cognito with user pools
8. ✅ **Weather data caching:** In-memory within Lambda execution context (5-min TTL)

### Business Logic
9. ✅ **Rescheduling window:** 7-day window from cancellation date
10. ✅ **Weather check frequency:** Every 10 minutes
11. ✅ **Instructor availability:** Managed via built-in calendar in web app (dedicated PostgreSQL tables)
12. ✅ **Student availability:** Managed via built-in calendar in web app (dedicated PostgreSQL tables)
13. ✅ **Flight corridor definition:** Straight-line path between departure/arrival, sampled at 3 evenly-spaced waypoints
14. ✅ **Preference collection timing:** Users have until min(30 minutes before departure, 12 hours after notification)
15. ✅ **Unavailable slots handling:** AI generates new set of 3 options if all marked unavailable

### User Experience
16. ✅ **Notification preferences:** Standard email + in-app alerts for all users
17. ✅ **Manual confirmation:** Both parties rank preferences; instructor priority applies for final selection
18. ✅ **Dashboard authentication:** AWS Cognito with JWT tokens
19. ✅ **Conflict resolution:** AI generates conflict-free slots unique to each student-instructor pair using availability calendars
20. ✅ **Preference deadline:** Min(30 min before departure, 12 hours after notification)
21. ✅ **Transparency messaging:** Final selection includes explanation (e.g., "Selected instructor's 2nd preference")

### Operations & Support
22. ✅ **Error handling:** CloudWatch alarms notify ops team for system failures
23. ✅ **Support escalation:** Manual escalation triggered when deadline passes or all options unavailable
24. ✅ **Data retention:** Historical logs retained for 90 days (configurable)
25. ✅ **Deployment environment:** Single AWS account with separate staging/production stacks
26. ✅ **API cost management:** ~$0-50/month within free tiers for expected load
27. ✅ **LangGraph costs:** Estimated $20-50/month for AI API calls

### Compliance & Policy
28. ✅ **Data privacy:** PII encrypted at rest, Cognito handles authentication securely
29. ✅ **Liability:** System provides alerts; final flight decision remains with instructor
30. ✅ **Communication policy:** Notifications sent immediately upon detection; users responsible for monitoring
31. ✅ **Audit requirements:** Complete audit trail logged in PostgreSQL with CloudWatch backup
32. ✅ **Preference transparency:** System explains instructor priority in notification
33. ✅ **Schedule data access:** Users manage own calendars; system reads for conflict checking

---

## 18. Remaining Open Questions (Non-Blocking)

These questions can be resolved during or after development without blocking initial launch:

### Enhancement & Optimization
1. **Adaptive monitoring frequency:** Should distant flights (>7 days out) be checked less frequently than 10 minutes?
2. **Weather confidence thresholds:** What confidence level triggers cancellation (80%, 90%, 95%)?
3. **AI suggestion optimization:** Should system learn from accepted/rejected suggestions over time?
4. **Notification channels:** Should we add SMS as backup channel in future iterations?

### Operational Refinement
5. **Support team size:** How many staff needed to handle manual escalations?
6. **Escalation SLA:** What response time required for manual scheduling (4 hours, 24 hours)?
7. **Performance SLA:** Should Lambda functions have guaranteed response times beyond current targets?
8. **Cost optimization:** When should we evaluate switching from dual APIs to single provider?

### User Experience Improvements
9. **Calendar UI:** Should users be able to copy availability patterns week-to-week?
10. **Bulk operations:** Should instructors be able to block entire weeks at once?
11. **Mobile optimization:** Is mobile-responsive web sufficient or should native app be prioritized?
12. **Push notifications:** Would WebSocket push improve user experience over email?

---

## 19. Demo Video Requirements

The 5–10 minute demonstration must include:

### Setup & Configuration (1 min)
1. User authentication via AWS Cognito (login as instructor and student)
2. Availability calendar setup for instructor and student showing weekly patterns

### Flight Booking (1 min)
3. Flight lesson creation with student, instructor, departure, and arrival details
4. System calculates 3 corridor waypoints on straight-line path
5. Initial weather check passes at all 5 locations

### Weather Conflict Detection (2 min)
6. Weather deteriorates at corridor waypoint 2 (demonstrated via weather API data)
7. 10-minute monitoring cycle detects conflict
8. System validates training level requirements
9. Dashboard displays weather alert with all 5 location statuses
10. Dual weather API cross-validation shown (both providers queried)

### AI Rescheduling Flow (3 min)
11. AI queries availability calendars for both parties
12. AI generates 3 valid alternative time slots (zero conflicts)
13. System validates weather at all 5 locations for each suggested slot
14. Notifications sent to instructor and student with deadline countdown
15. Dashboard shows pending rescheduling request

### Preference Submission (2 min)
16. Instructor ranks options: 1st, 2nd, 3rd
17. Student ranks options: 3rd, 1st, 2nd (conflicting preferences)
18. System resolves using instructor priority (selects instructor's 1st choice)
19. Notification sent explaining selection rationale
20. Weather re-validation executed before final confirmation

### Confirmation & Audit (1 min)
21. Booking updated to new time slot
22. Database shows complete audit trail:
    - Original booking cancelled
    - Weather conflict logged
    - AI suggestions generated
    - Preferences submitted by both parties
    - Final selection with resolution logic
    - New booking confirmed
23. Dashboard updates to show confirmed rescheduled flight

### Edge Cases (Optional - if time permits)
24. Instructor marks all 3 slots "not available" → new suggestions generated
25. Preference deadline passes → manual escalation triggered
26. Primary weather API fails → automatic failover to secondary

---

## 20. Deployment Checklist

### AWS Infrastructure Setup
- [ ] RDS PostgreSQL instance provisioned (t3.micro for staging, t3.small for production)
- [ ] Cognito user pool created with student/instructor/admin roles
- [ ] Lambda functions deployed with LangChain SDK
- [ ] EventBridge rule configured for 10-minute triggers
- [ ] API Gateway configured with Lambda authorizers
- [ ] SES verified email addresses for notifications
- [ ] Secrets Manager configured with weather API keys
- [ ] CloudWatch dashboards created for monitoring
- [ ] S3 bucket for static frontend hosting (React app)
- [ ] CloudFront distribution for frontend CDN

### Database Setup
- [ ] PostgreSQL schemas created (bookings, users, availability tables)
- [ ] Indexes created on critical query fields
- [ ] Connection pooling configured in Lambda
- [ ] Database migrations versioned and tested
- [ ] Seed data loaded for testing

### Security Configuration
- [ ] Cognito user pools configured with password policies
- [ ] JWT token validation in Lambda authorizers
- [ ] CORS policies configured on API Gateway
- [ ] API rate limiting enabled (1000 req/sec)
- [ ] CloudWatch alarms for failed auth attempts
- [ ] Secrets rotation policy for API keys (90 days)

### Application Deployment
- [ ] React frontend built and deployed to S3
- [ ] Lambda functions packaged with dependencies
- [ ] Environment variables configured (DATABASE_URL, API_KEYS, etc.)
- [ ] .env.template provided in repository
- [ ] README with setup instructions

### Monitoring & Alerting
- [ ] CloudWatch alarms for Lambda errors (threshold: >3%)
- [ ] CloudWatch alarms for weather API failures (threshold: >5%)
- [ ] CloudWatch alarms for notification delivery failures (threshold: >10%)
- [ ] CloudWatch alarms for EventBridge scheduler misses
- [ ] SNS topic configured for ops team alerts
- [ ] CloudWatch Logs Insights queries saved for common troubleshooting

### Testing & Validation
- [ ] All unit tests passing
- [ ] Integration tests passing in staging
- [ ] Load testing completed (100 concurrent flights)
- [ ] Availability calendar sync tested
- [ ] Deadline calculation validated for edge cases
- [ ] Manual escalation flow tested end-to-end

---

## 21. Cost Estimation

### Monthly AWS Costs (Estimated)

#### Compute
- **Lambda:** ~$20-30/month
  - 144 checks/day × 100 flights × 2 seconds avg = ~8 hours compute/day
  - Provisioned concurrency for scheduler: $15/month
- **AI API calls (LangGraph/Anthropic):** ~$30-50/month
  - ~10-15 conflicts/day × $0.15/call × 30 days

#### Storage & Database
- **RDS PostgreSQL (t3.small):** ~$25-30/month
- **S3 (frontend + logs):** ~$2-5/month
- **CloudWatch Logs:** ~$5-10/month

#### External APIs
- **OpenWeatherMap:** $0 (free tier: 1M calls/month)
- **WeatherAPI.com:** $0 (free tier: 1M calls/month)
- Both services provide 1M+ free calls/month; expected usage: ~14,400/day = ~432,000/month

#### Networking & Other
- **SES (email):** ~$5/month (5000 emails at $0.10/1000)
- **CloudFront:** ~$5/month
- **Cognito:** $0 (free tier: 50,000 MAUs)

**Total Estimated Cost:** ~$100-150/month for production environment
**Staging Environment:** ~$40-60/month (smaller instance sizes)

### Cost Optimization Strategies
- Use Lambda free tier (1M requests/month)
- Stay within weather API free tiers
- Use spot instances for non-critical batch jobs (future)
- Implement aggressive caching to reduce API calls
- Monitor CloudWatch Logs retention (reduce to 7 days for non-critical logs)

---

## 22. Success Definition

The project will be considered **SUCCESSFUL** when:

### Technical Success Criteria
✅ All 25+ acceptance criteria met (Section 4)
✅ Zero critical bugs in production
✅ 99.5% uptime over first 30 days
✅ All unit and integration tests passing
✅ Complete audit trail for all operations

### Business Success Criteria
✅ >70% AI suggestion acceptance rate
✅ <3 minute average notification delivery time
✅ >90% preference submission before deadline
✅ <2% manual escalation rate
✅ Zero safety incidents due to missed weather conflicts

### User Success Criteria
✅ Positive feedback from pilot users (>4/5 average rating)
✅ <5 support tickets per week after initial launch
✅ Users actively maintain availability calendars (>80% weekly update rate)
✅ Instructors report time savings vs. manual scheduling

### Operational Success Criteria
✅ Complete documentation delivered
✅ Demo video demonstrates all core features
✅ Code repository clean and well-organized
✅ Deployment runbook tested and validated
✅ Ops team trained on monitoring and escalation procedures

---

## 23. Post-Launch Roadmap

### Phase 2 (Weeks 2-4)
- Implement SMS notifications as backup channel
- Add Google Calendar integration for availability sync
- Historical weather analytics dashboard
- Performance optimizations based on production metrics

### Phase 3 (Months 2-3)
- Machine learning for preference prediction
- Predictive cancellation (cancel before weather deteriorates)
- Mobile-responsive improvements
- Advanced corridor weather modeling

### Phase 4 (Months 4-6)
- Native mobile apps (iOS/Android)
- Multi-language support
- Instructor workload balancing
- Integration with aircraft maintenance scheduling

---

## Appendix A: Weather Minimums Reference

### Student Pilot
- **Visibility:** >5 statute miles
- **Ceiling:** Clear skies required
- **Wind:** <10 knots
- **Weather Phenomena:** No precipitation, fog, or obscuration

### Private Pilot
- **Visibility:** >3 statute miles
- **Ceiling:** >1000 feet AGL
- **Wind:** <15 knots (crosswind <10 knots)
- **Weather Phenomena:** Light precipitation acceptable

### Instrument Rated
- **Visibility:** IMC acceptable
- **Ceiling:** No minimum (IMC acceptable)
- **Wind:** <25 knots (crosswind <15 knots)
- **Weather Phenomena:** No thunderstorms, severe icing, or convective activity

---

## Appendix B: Notification Templates

### Weather Conflict Detected
**Subject:** ⚠️ Weather Alert: Your flight on [DATE] may be affected

**Body:**
```
Hi [NAME],

We've detected weather conditions that may affect your scheduled flight lesson:

Flight Details:
- Date/Time: [DATE] at [TIME]
- Departure: [LOCATION]
- Arrival: [LOCATION]
- Instructor: [NAME]

Weather Issue:
- Location: [Waypoint 2 on flight corridor]
- Current Conditions: Visibility 2.5 mi, ceiling 800 ft
- Your Training Level: Private Pilot (requires visibility >3 mi, ceiling >1000 ft)

We're working on finding alternative times. You'll receive rescheduling options within 10 minutes.

Dashboard: [LINK]
```

### Rescheduling Options Available
**Subject:** 📅 Rescheduling Options for Your Flight

**Body:**
```
Hi [NAME],

Your flight on [ORIGINAL_DATE] has been cancelled due to weather. Here are 3 alternative times:

Option 1: [DATE] at [TIME] ⭐ (Best weather forecast)
Option 2: [DATE] at [TIME]
Option 3: [DATE] at [TIME]

Please rank your preferences (1st, 2nd, 3rd) by [DEADLINE]:
[LINK TO PREFERENCE FORM]

⏰ Deadline: [DEADLINE_TIME] ([COUNTDOWN])

All options have been validated for:
✅ Your availability
✅ Instructor availability  
✅ Weather conditions at all flight locations
✅ Your training level requirements

View Details: [LINK]
```

### Preference Deadline Reminder
**Subject:** ⏰ Reminder: 2 hours until rescheduling deadline

**Body:**
```
Hi [NAME],

This is a reminder to submit your preferences for rescheduling your flight.

Original Flight: [DATE] at [TIME]
Deadline: [DEADLINE_TIME] (2 hours remaining)

Submit Preferences: [LINK]

If we don't receive your preferences by the deadline, we'll escalate to manual scheduling which may take longer.
```

### Final Confirmation
**Subject:** ✅ Flight Rescheduled Successfully

**Body:**
```
Hi [NAME],

Your flight has been successfully rescheduled!

New Flight Details:
- Date/Time: [NEW_DATE] at [NEW_TIME]
- Departure: [LOCATION]
- Arrival: [LOCATION]
- Instructor: [INSTRUCTOR_NAME]

Selection Rationale:
This was your instructor's 1st preference and your 2nd preference. Weather conditions have been re-validated and are suitable for your training level.

View Booking: [LINK]
Add to Calendar: [LINK]

See you in the air! ✈️
```

---

## Appendix C: LangGraph Workflow Diagram

```
[Weather Conflict Detected]
         ↓
[Fetch Availability Calendars]
    (Instructor + Student)
         ↓
[Identify Free Time Blocks]
    (Next 7 days)
         ↓
[Query Weather Forecasts]
    (All 5 locations × each time block)
         ↓
[Apply Training Level Minimums]
         ↓
[Filter Out Conflicts]
    (Existing bookings)
         ↓
[Rank by Optimality]
    (Weather quality + time proximity)
         ↓
[Generate Top 3 Options]
         ↓
[Return Suggestions]
         ↓
[Wait for Preferences]
         ↓
    [Deadline Check]
    /              \
   NO              YES (deadline passed)
   ↓                ↓
[Apply Instructor Priority]  [Manual Escalation]
         ↓
[Re-validate Weather]
         ↓
[Confirm Booking]
         ↓
[Update Database]
         ↓
[Send Notifications]
```

---

**Document Version:** 2.0 - All Critical Gaps Resolved  
**Last Updated:** [Current Date]  
**Prepared For:** Final Project Submission Review  
**Status:** ✅ APPROVED FOR DEVELOPMENT

---

## Document Change Log

### Version 2.0 (Current)
- ✅ Resolved all 33 critical open questions
- ✅ Fixed monitoring frequency inconsistency (10 minutes everywhere)
- ✅ Added availability calendar management system
- ✅ Specified deadline as min(30 min before departure, 12 hours after notification)
- ✅ Defined flight corridor as straight-line with 3 waypoints
- ✅ Specified AWS Lambda for backend deployment
- ✅ Specified AWS Cognito for authentication
- ✅ Added LangGraph integration details with LangChain SDK
- ✅ Added database schema for availability tables
- ✅ Enhanced acceptance criteria with missing items
- ✅ Added cost estimation and deployment checklist
- ✅ Added notification templates and workflow diagram

### Version 1.0 (Previous)
- Initial PRD with comprehensive feature set
- Had 8 critical unresolved questions
- Monitoring frequency inconsistency in assumptions
- Missing specifications for availability management
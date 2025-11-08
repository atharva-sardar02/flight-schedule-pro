# Active Context

## Current Status
**Phase:** AI & Frontend Development - AI Rescheduling Complete  
**Date:** November 2024  
**Status:** PRs #1-9 Complete, Ready for PR #10 (Notification System)  

## What Just Happened
- ✅ **PR #1 Completed:** Monorepo structure initialized with frontend (React + Vite + shadcn/ui) and backend (TypeScript + Express dev server)
- ✅ **PR #2 Completed:** PostgreSQL database schema designed and implemented with 6 migrations and seed data
- ✅ **PR #3 Completed:** Complete AWS infrastructure CloudFormation templates created (11 templates + 3 deployment scripts)
- ✅ **PR #4 Completed:** Authentication system fully implemented and tested - AWS Cognito deployed, user registration and login working, database integration complete
- ✅ **PR #5 Completed:** Weather service with dual-provider integration (OpenWeatherMap + WeatherAPI.com), failover, caching, corridor calculation
- ✅ **PR #6 Completed:** Booking management system with full CRUD operations, weather validation, authentication, and UI components
- ✅ **PR #7 Completed:** Availability calendar system with recurring patterns, one-time overrides, conflict checking, and visual calendar grid
- ✅ **PR #8 Completed:** Weather monitoring scheduler with automated 10-minute checks, conflict detection, audit logging, and notification triggers
- ✅ **PR #9 Completed:** AI rescheduling engine with LangGraph workflow, 3 optimal slot generation, weather/availability validation, and instructor priority resolution

## Current Work Focus

### Immediate Next Steps
1. **PR #10: Notification System** - Email (SES) and in-app notifications for weather alerts and options
2. **PR #11: Preference Ranking System** - Frontend UI for preference submission and deadline countdown
3. **PR #12: Dashboard & UI Components** - Complete dashboard with weather alerts, flight status, and metrics

### What We're Building Right Now
Ready to start PR #10: Notification System with email (AWS SES) and real-time in-app notifications.

## Recent Decisions

### Architecture Decisions (from PRD)
1. **Dual Weather Provider:** Using both OpenWeatherMap AND WeatherAPI.com for redundancy
2. **Lambda Deployment:** Serverless architecture for automatic scaling
3. **LangGraph for AI:** Multi-step workflow for complex scheduling constraints
4. **Built-in Calendar:** Custom availability system (not external calendar integration)
5. **Instructor Priority:** Clear rule for preference conflict resolution
6. **PostgreSQL on RDS:** Relational database for ACID compliance

### User Experience Decisions
1. **Deadline Formula:** min(30 min before flight, 12 hours after notification)
2. **Number of Options:** Always 3 alternative time slots
3. **Monitoring Frequency:** Every 10 minutes for flights within 48 hours
4. **Rescheduling Window:** 7 days from cancellation date
5. **Corridor Definition:** Straight-line path with 3 evenly-spaced waypoints

### Technical Decisions
1. **TypeScript Full Stack:** Type safety across frontend and backend
2. **EventBridge Scheduling:** 10-minute triggered Lambda for weather monitoring
3. **In-Memory Caching:** 5-minute TTL within Lambda execution context
4. **Connection Pooling:** Global pool reused across Lambda invocations
5. **Optimistic Locking:** Version-based concurrency control for availability updates

## Active Considerations

### Questions to Answer During Development
1. **Weather Confidence Thresholds:** What confidence level triggers cancellation (80%, 90%, 95%)?
   - *Defer to first staging tests with real data*
   
2. **AI Timeout Behavior:** If 15-second timeout exceeds, what's the fallback logic?
   - *Implement simple rule-based scheduling as fallback*
   
3. **Cache Invalidation:** How to handle weather cache when user manually refreshes?
   - *Force refresh option in UI, bypass cache*
   
4. **Notification Retry Logic:** How many retries for failed email delivery?
   - *3 attempts with exponential backoff (1s, 2s, 4s)*

### Technical Risks Being Monitored
1. **Lambda Cold Starts:** May impact user experience
   - *Mitigation: Provisioned concurrency for critical functions*
   
2. **Database Connection Exhaustion:** Lambda scaling could exhaust RDS connections
   - *Mitigation: Conservative max connections (5 per instance), connection pooling*
   
3. **Weather API Rate Limits:** Could hit limits during high-traffic periods
   - *Mitigation: Dual providers, aggressive caching, monitoring*
   
4. **AI Timeout Frequency:** Complex constraints might cause frequent timeouts
   - *Mitigation: 15-second timeout, fallback logic, monitoring*

## Development Roadmap

### Week 1: Foundation (PRs #1-3) ✅ COMPLETE
- [x] Read and understand PRD
- [x] Read and understand task list
- [x] Initialize memory bank
- [x] Set up monorepo structure (frontend + backend workspaces)
- [x] Design database schema (6 migrations + seed data)
- [x] Create CloudFormation templates (11 templates + 3 scripts)

### Week 2: Core Backend (PRs #4-8)
- [x] Implement authentication (Cognito integration) ✅
- [x] Build weather service (dual provider) ✅
- [x] Create booking management system ✅
- [x] Build availability calendar system ✅
- [x] Implement weather monitoring scheduler ✅

### Week 3: AI & Frontend (PRs #9-12)
- [x] Integrate LangGraph AI engine ✅
- [ ] Build notification system
- [ ] Implement preference ranking system
- [ ] Create dashboard and UI components

### Week 4: Polish & Launch (PRs #13-25)
- [ ] Weather re-validation flow
- [ ] Audit logging and analytics
- [ ] Complete integration testing
- [ ] Error handling and resilience
- [ ] Security hardening
- [ ] Performance optimization
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Demo video creation

## Key Interfaces & Contracts

### Weather Service Interface
```typescript
interface WeatherService {
  getWeather(coords: Coordinates): Promise<WeatherData>;
  getWeatherForPath(path: FlightPath): Promise<WeatherData[]>; // 5 locations
  validateWeather(weather: WeatherData, level: TrainingLevel): ValidationResult;
}
```

### AI Scheduling Interface
```typescript
interface SchedulingEngine {
  generateOptions(
    booking: Booking,
    instructorAvail: Availability[],
    studentAvail: Availability[],
    windowDays: number
  ): Promise<TimeSlot[]>; // Returns 3 options
  
  revalidateSlot(slot: TimeSlot, path: FlightPath): Promise<boolean>;
}
```

### Notification Service Interface
```typescript
interface NotificationService {
  sendWeatherAlert(booking: Booking, conflict: WeatherConflict): Promise<void>;
  sendRescheduleOptions(booking: Booking, options: TimeSlot[]): Promise<void>;
  sendDeadlineReminder(booking: Booking, deadline: Date): Promise<void>;
  sendConfirmation(booking: Booking, finalSlot: TimeSlot): Promise<void>;
}
```

## Environment Specifics

### Development Environment
- **Database:** Local PostgreSQL on localhost:5432 (flight_schedule_pro database)
- **Weather APIs:** Test API keys (low rate limits) - configured in env.template
- **AWS Services:** LocalStack or SAM Local for Lambda testing (when needed)
- **Frontend:** React + Vite dev server on localhost:3000 (npm run dev:frontend)
- **Backend:** Express dev server on localhost:3001 (npm run dev:backend) using ts-node-dev
- **UI Components:** shadcn/ui with Tailwind CSS and Radix UI primitives

### Staging Environment
- **AWS Account:** Separate staging account or staging namespace
- **Database:** RDS t3.micro
- **Weather APIs:** Production keys but monitored usage
- **Domain:** staging.flightschedulepro.com
- **Monitoring:** CloudWatch with relaxed alarm thresholds

### Production Environment
- **AWS Account:** Production account with strict IAM policies
- **Database:** RDS t3.small with automated backups
- **Weather APIs:** Production keys with quota monitoring
- **Domain:** app.flightschedulepro.com
- **Monitoring:** CloudWatch with strict alarm thresholds and on-call paging

## Critical Path Items

### Blockers (None Currently)
No blockers at this stage.

### Dependencies Waiting On
1. **AWS Account Setup:** Need credentials and account access
   - *Action: Obtain AWS account credentials*
   
2. **Weather API Keys:** Need to register for API keys
   - *Action: Sign up for OpenWeatherMap and WeatherAPI.com*
   
3. **Anthropic API Key:** Need for LangGraph/Claude integration
   - *Action: Sign up for Anthropic Claude API*
   
4. **Email Domain:** Need verified domain for SES
   - *Action: Configure SES with email domain*

### Unblocking Others
No dependencies currently.

## Files & Locations

### Memory Bank (Current Location)
- `memory-bank/projectbrief.md` - Core requirements and objectives
- `memory-bank/productContext.md` - User needs and experience goals
- `memory-bank/systemPatterns.md` - Architecture and design patterns
- `memory-bank/techContext.md` - Technology stack and constraints
- `memory-bank/activeContext.md` - This file (current work focus)
- `memory-bank/progress.md` - Implementation status tracking

### Source Documents (Reference Only)
- `prd_final_v2.md` - Complete Product Requirements Document v2.0
- `project_tasklist.md` - 25-PR implementation roadmap with file structure

## Testing Approach

### Testing Priorities for Each PR
1. **Weather Service:** Unit tests for dual-provider failover, caching, corridor calculation
2. **AI Engine:** Integration tests for constraint validation, timeout handling
3. **Deadline Logic:** Unit tests for edge cases (flight soon, flight far away)
4. **Availability Calendar:** Integration tests for concurrent updates, conflict detection
5. **Notification System:** Integration tests for delivery, retry logic
6. **Preference Resolution:** Unit tests for instructor priority, all-unavailable scenario

### Acceptance Criteria Tracking
Total: 25+ acceptance criteria from PRD Section 4
Status: None started yet (tracked in progress.md when work begins)

## Communication Patterns

### Notification Flow
1. Weather conflict detected → AI generates options
2. Options ready → Send email with 3 choices + deadline
3. 2 hours before deadline → Send reminder
4. Deadline passes without response → Escalate to manual
5. Preferences collected → Send confirmation

### Data Update Flow
1. User updates availability calendar → Database write with optimistic lock
2. Change triggers real-time sync → Invalidate cached availability
3. If booking in progress → Warn user of potential impact
4. Audit log records change → Complete trail for accountability

## Next Session Preparation

### Before Starting PR #1
1. Ensure AWS credentials configured
2. PostgreSQL installed locally
3. Node.js 18+ installed
4. Git repository initialized
5. Weather API keys obtained
6. All prerequisites from techContext.md verified

### When Resuming Work
1. Read this file (activeContext.md) first
2. Check progress.md for completed items
3. Review relevant sections of systemPatterns.md for architecture guidance
4. Reference techContext.md for technical constraints
5. Consult projectbrief.md for requirements clarification

## Important Notes

### Scope Management
- Focus on core features first (no bonus features like SMS, Google Calendar)
- All 25+ acceptance criteria must be met for launch
- Demo video must show edge cases (not just happy path)
- Complete audit trail is non-negotiable requirement

### Safety Considerations
- Weather minimums are safety-critical (never relax)
- Multi-location validation is required (all 5 points)
- Dual weather APIs provide redundancy (don't skip)
- Training level must always be validated

### User Experience Priorities
1. **Speed:** <3 minute notification delivery
2. **Clarity:** Transparent explanations for all decisions
3. **Control:** Users manage their own availability
4. **Trust:** Complete audit trail builds confidence
5. **Efficiency:** Minimal interactions to complete rescheduling

## Memory Bank Maintenance

This active context will be updated:
- At the start of each PR (record what's being worked on)
- When major decisions are made (document rationale)
- When blockers are encountered (track resolution)
- At the end of each PR (update progress, carry forward learnings)

**Last Updated:** November 2024 (PRs #1-9 Complete)  
**Next Update:** When PR #10 begins (notification system)


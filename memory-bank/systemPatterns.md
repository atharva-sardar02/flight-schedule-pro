# System Patterns
## Architecture Overview

### System Design Philosophy
- **Serverless-First:** Lambda functions for automatic scaling and cost efficiency
- **Event-Driven:** EventBridge triggers monitoring, events drive workflow
- **AI-Augmented:** LangGraph handles complex multi-constraint scheduling
- **Safety-Critical:** Multiple validation layers, never skip checks
- **Resilient:** Dual providers, retry logic, graceful degradation

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  React + TypeScript (S3/CloudFront)                             │
│  - Dashboard, Booking, Availability Calendar, Preferences        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                      API Gateway Layer                           │
│  - REST API Endpoints                                            │
│  - Lambda Authorizers (Cognito JWT validation)                  │
│  - WebSocket API for real-time notifications                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      Lambda Functions                            │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ API Functions   │  │ Scheduler        │  │ AI Engine      │ │
│  │ - auth.ts       │  │ - weatherMonitor │  │ - reschedule   │ │
│  │ - bookings.ts   │  │   (10-min cycle) │  │ - validator    │ │
│  │ - availability  │  │                  │  │ - conflict     │ │
│  │ - preferences   │  │                  │  │   detector     │ │
│  └─────────────────┘  └──────────────────┘  └────────────────┘ │
└──────────┬───────────────────┬───────────────────┬──────────────┘
           │                   │                   │
┌──────────▼──────┐  ┌─────────▼────────┐  ┌──────▼──────────────┐
│  PostgreSQL RDS │  │  AWS Services    │  │ External APIs       │
│  - Users        │  │  - Cognito       │  │ - OpenWeatherMap    │
│  - Bookings     │  │  - SES (email)   │  │ - WeatherAPI.com    │
│  - Availability │  │  - Secrets Mgr   │  │ - Anthropic (AI)    │
│  - Audit Logs   │  │  - EventBridge   │  │                     │
└─────────────────┘  └──────────────────┘  └─────────────────────┘
```

## Key Architectural Patterns

### 1. Dual Weather Provider Pattern

**Problem:** Single weather API is single point of failure  
**Solution:** Query both providers, cross-validate, automatic failover

```typescript
async function getWeatherData(coords: Coordinates): Promise<WeatherData> {
  try {
    const [primary, secondary] = await Promise.allSettled([
      openWeatherMap.fetch(coords),
      weatherAPI.fetch(coords)
    ]);
    
    // If both succeed, cross-validate
    if (primary.status === 'fulfilled' && secondary.status === 'fulfilled') {
      return crossValidate(primary.value, secondary.value);
    }
    
    // If one fails, use the other
    if (primary.status === 'fulfilled') return primary.value;
    if (secondary.status === 'fulfilled') return secondary.value;
    
    throw new Error('Both weather APIs failed');
  } catch (error) {
    logger.error('Weather API failure', { coords, error });
    throw error;
  }
}
```

**Key Points:**
- Always query both providers in parallel
- Cross-validate when both succeed (detect anomalies)
- Automatic failover if one provider down
- 5-minute in-memory cache aligned with 10-minute check cycle

### 2. Multi-Location Weather Validation Pattern

**Problem:** Weather at departure doesn't guarantee safe corridor  
**Solution:** Validate 5 locations (takeoff + 3 waypoints + landing)

```typescript
interface FlightPath {
  departure: Coordinates;
  arrival: Coordinates;
  waypoints: Coordinates[]; // 3 waypoints on straight-line path
}

async function validateFlightWeather(
  path: FlightPath, 
  trainingLevel: TrainingLevel
): Promise<ValidationResult> {
  const locations = [
    { name: 'Departure', coords: path.departure },
    { name: 'Waypoint 1', coords: path.waypoints[0] },
    { name: 'Waypoint 2', coords: path.waypoints[1] },
    { name: 'Waypoint 3', coords: path.waypoints[2] },
    { name: 'Arrival', coords: path.arrival }
  ];
  
  const weatherData = await Promise.all(
    locations.map(loc => getWeatherData(loc.coords))
  );
  
  // Check if ALL locations meet minimums
  for (let i = 0; i < locations.length; i++) {
    const result = checkWeatherMinimums(weatherData[i], trainingLevel);
    if (!result.safe) {
      return {
        safe: false,
        failedLocation: locations[i].name,
        conditions: weatherData[i],
        reason: result.reason
      };
    }
  }
  
  return { safe: true };
}
```

**Key Points:**
- Straight-line path calculation (not actual flight route)
- 3 evenly-spaced waypoints between departure and arrival
- Failure at ANY location triggers cancellation
- Log which location failed for transparency

### 3. LangGraph AI Scheduling Workflow

**Problem:** Complex multi-constraint optimization (weather + availability + conflicts)  
**Solution:** Multi-step graph workflow with validation at each stage

```typescript
// LangGraph workflow structure
const schedulingWorkflow = {
  nodes: {
    'fetch_availability': async (state) => {
      // Query both calendars
      const instructorAvail = await getAvailability(state.instructorId);
      const studentAvail = await getAvailability(state.studentId);
      return { ...state, instructorAvail, studentAvail };
    },
    
    'find_free_blocks': async (state) => {
      // Find overlapping free time in 7-day window
      const freeBlocks = findOverlappingTimes(
        state.instructorAvail, 
        state.studentAvail,
        state.searchStartDate,
        7 // days
      );
      return { ...state, freeBlocks };
    },
    
    'validate_weather': async (state) => {
      // Check weather forecast for each free block
      const validBlocks = await Promise.all(
        state.freeBlocks.map(async (block) => {
          const forecast = await getWeatherForecast(
            state.flightPath,
            block.datetime
          );
          const isValid = validateForecast(forecast, state.trainingLevel);
          return { block, isValid, forecast };
        })
      );
      return { ...state, validBlocks: validBlocks.filter(b => b.isValid) };
    },
    
    'check_conflicts': async (state) => {
      // Ensure no existing bookings at these times
      const conflictFree = await Promise.all(
        state.validBlocks.map(async (block) => {
          const hasConflict = await checkBookingConflicts(
            state.instructorId,
            state.studentId,
            block.datetime
          );
          return { ...block, hasConflict };
        })
      );
      return { ...state, conflictFree: conflictFree.filter(b => !b.hasConflict) };
    },
    
    'rank_options': async (state) => {
      // Score by weather quality + time proximity
      const ranked = state.conflictFree
        .map(opt => ({
          ...opt,
          score: calculateScore(opt, state.originalDatetime)
        }))
        .sort((a, b) => b.score - a.score);
      
      return { ...state, topOptions: ranked.slice(0, 3) };
    }
  },
  
  edges: {
    'fetch_availability' -> 'find_free_blocks',
    'find_free_blocks' -> 'validate_weather',
    'validate_weather' -> 'check_conflicts',
    'check_conflicts' -> 'rank_options'
  }
};
```

**Key Points:**
- Each node validates one constraint type
- State flows through graph with accumulated data
- 15-second timeout for entire workflow
- Fallback to simpler logic if timeout occurs
- Complete logging of each step for debugging

### 4. Deadline Calculation Pattern

**Problem:** Need consistent deadline across timezones  
**Solution:** min(30 min before flight, 12 hours after notification)

```typescript
function calculatePreferenceDeadline(
  flightDatetime: Date,
  notificationSent: Date
): Date {
  // Option 1: 30 minutes before flight
  const thirtyMinBeforeFlight = new Date(flightDatetime);
  thirtyMinBeforeFlight.setMinutes(thirtyMinBeforeFlight.getMinutes() - 30);
  
  // Option 2: 12 hours after notification
  const twelveHoursAfterNotif = new Date(notificationSent);
  twelveHoursAfterNotif.setHours(twelveHoursAfterNotif.getHours() + 12);
  
  // Return whichever comes first
  const deadline = thirtyMinBeforeFlight < twelveHoursAfterNotif
    ? thirtyMinBeforeFlight
    : twelveHoursAfterNotif;
  
  return deadline;
}
```

**Key Points:**
- All times stored in UTC in database
- Convert to user timezone for display only
- Deadline enforced server-side (don't trust client)
- Log which rule applied for transparency

### 5. Instructor Priority Resolution Pattern

**Problem:** Conflicting preferences need deterministic resolution  
**Solution:** Always use instructor's highest-ranked available option

```typescript
function resolvePreferences(
  instructorRanking: [string, string, string], // [optionId1, optionId2, optionId3]
  studentRanking: [string, string, string],
  instructorUnavailable: string[] = []
): { selected: string; reason: string } {
  // Remove options marked unavailable by instructor
  const availableOptions = instructorRanking.filter(
    id => !instructorUnavailable.includes(id)
  );
  
  if (availableOptions.length === 0) {
    return {
      selected: null,
      reason: 'Instructor marked all options unavailable - generating new suggestions'
    };
  }
  
  // Use instructor's highest-ranked available option
  const selected = availableOptions[0];
  
  // Build explanation
  const instructorRank = instructorRanking.indexOf(selected) + 1;
  const studentRank = studentRanking.indexOf(selected) + 1;
  
  const reason = instructorRank === studentRank
    ? `Both parties ranked this as #${instructorRank} choice`
    : `Instructor's #${instructorRank} choice (student's #${studentRank} choice)`;
  
  return { selected, reason };
}
```

**Key Points:**
- Instructor priority is non-negotiable (business rule)
- Transparent explanation always provided
- If all marked unavailable, trigger new generation
- Log both rankings for analytics

### 6. Event-Driven Monitoring Pattern

**Problem:** Need continuous monitoring without manual triggers  
**Solution:** EventBridge scheduled rule triggers Lambda every 10 minutes

```typescript
// EventBridge rule: rate(10 minutes)
export async function weatherMonitorHandler(event: ScheduledEvent) {
  const startTime = Date.now();
  
  try {
    // Get all bookings within 48 hours
    const upcomingBookings = await getBookingsInWindow(48); // hours
    
    logger.info('Weather monitoring cycle started', {
      bookingCount: upcomingBookings.length,
      cycleId: event.id
    });
    
    // Check each booking (parallel processing)
    const results = await Promise.allSettled(
      upcomingBookings.map(booking => checkBookingWeather(booking))
    );
    
    // Separate conflicts from safe flights
    const conflicts = results
      .filter(r => r.status === 'fulfilled' && !r.value.safe)
      .map(r => r.value);
    
    // Trigger AI rescheduling for conflicts
    await Promise.all(
      conflicts.map(conflict => triggerRescheduling(conflict))
    );
    
    logger.info('Weather monitoring cycle completed', {
      duration: Date.now() - startTime,
      checked: upcomingBookings.length,
      conflicts: conflicts.length
    });
    
  } catch (error) {
    logger.error('Weather monitoring cycle failed', { error });
    // CloudWatch alarm will trigger on errors
    throw error;
  }
}
```

**Key Points:**
- Only check bookings within 48 hours (optimization)
- Parallel processing for performance
- Log every cycle for reliability tracking
- CloudWatch alarms on failures

### 7. Database Connection Pooling Pattern

**Problem:** Lambda creates new DB connections, exhausting pool  
**Solution:** Reuse connections across Lambda invocations

```typescript
// Global scope (outside handler)
let dbPool: Pool | null = null;

function getDbPool(): Pool {
  if (!dbPool) {
    dbPool = new Pool({
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      max: 5, // Conservative max connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: { rejectUnauthorized: true }
    });
    
    logger.info('Database pool created');
  }
  
  return dbPool;
}

// Handler function
export async function handler(event: APIGatewayEvent) {
  const pool = getDbPool(); // Reuses existing pool
  const client = await pool.connect();
  
  try {
    // Use client for queries
    const result = await client.query('SELECT * FROM bookings WHERE id = $1', [id]);
    return result.rows[0];
  } finally {
    client.release(); // Return to pool, don't close
  }
}
```

**Key Points:**
- Pool created once per Lambda container
- Reused across invocations in same container
- Conservative max connections (5) to avoid exhaustion
- Always release client, never close pool

### 8. Optimistic Locking for Availability Updates

**Problem:** Concurrent updates to availability calendar cause conflicts  
**Solution:** Version-based optimistic locking

```typescript
interface AvailabilityRecord {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  version: number; // Optimistic lock version
}

async function updateAvailability(
  id: string,
  updates: Partial<AvailabilityRecord>,
  expectedVersion: number
): Promise<AvailabilityRecord> {
  const result = await db.query(
    `UPDATE availability 
     SET start_time = $1, end_time = $2, version = version + 1
     WHERE id = $3 AND version = $4
     RETURNING *`,
    [updates.startTime, updates.endTime, id, expectedVersion]
  );
  
  if (result.rowCount === 0) {
    throw new ConflictError('Availability record was updated by another process');
  }
  
  return result.rows[0];
}
```

**Key Points:**
- Version increments on every update
- Update only succeeds if version matches expected
- Prevents lost updates in concurrent scenarios
- Client must retry with fresh version

### 9. Audit Trail Pattern

**Problem:** Need complete history of all decisions for accountability  
**Solution:** Event-sourced audit log with immutable records

```typescript
interface AuditEvent {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  userId: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    correlationId: string;
  };
}

async function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
  await db.query(
    `INSERT INTO audit_log 
     (event_type, entity_type, entity_id, user_id, timestamp, data, metadata)
     VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
    [
      event.eventType,
      event.entityType,
      event.entityId,
      event.userId,
      JSON.stringify(event.data),
      JSON.stringify(event.metadata)
    ]
  );
}

// Usage examples
await logAuditEvent({
  eventType: 'WEATHER_CONFLICT_DETECTED',
  entityType: 'booking',
  entityId: bookingId,
  userId: 'system',
  data: { failedLocation: 'Waypoint 2', conditions: weatherData },
  metadata: { correlationId: cycleId }
});

await logAuditEvent({
  eventType: 'PREFERENCE_SUBMITTED',
  entityType: 'booking',
  entityId: bookingId,
  userId: userId,
  data: { ranking: [opt1, opt2, opt3], submittedAt: new Date() },
  metadata: { correlationId: notificationId, ipAddress: req.ip }
});
```

**Key Points:**
- Every significant action logged
- Immutable records (no updates or deletes)
- Correlation IDs link related events
- Queryable for analytics and debugging

## Component Relationships

### Data Flow: Weather Conflict Detection
1. EventBridge triggers `weatherMonitor` Lambda (every 10 minutes)
2. Lambda queries `bookings` table for upcoming flights
3. For each booking, calculates 5 locations (corridor calculator)
4. Calls weather service (dual providers) for each location
5. Applies training-level minimums from `constants`
6. If conflict → writes to `audit_log` and triggers AI engine
7. AI engine invoked asynchronously (separate Lambda)

### Data Flow: AI Rescheduling
1. `rescheduleEngine` Lambda receives booking details
2. Queries `instructor_availability` and `student_availability` tables
3. Finds overlapping free time blocks
4. For each block, queries weather forecast APIs
5. Checks `bookings` table for existing conflicts
6. Ranks options by score algorithm
7. Writes suggestions to database
8. Triggers notification service

### Data Flow: Preference Collection
1. User clicks link in email notification
2. Frontend loads preference ranking UI
3. User drags options to rank (1, 2, 3)
4. Frontend calls API Gateway `/preferences` endpoint
5. Lambda authorizer validates Cognito JWT
6. `preferences` Lambda validates deadline not passed
7. Writes ranking to database
8. If both parties submitted → triggers resolution Lambda
9. Resolution Lambda applies instructor priority
10. Re-validates weather before final confirmation
11. Updates booking record
12. Triggers confirmation notification

## Design Patterns Summary

| Pattern | Purpose | Implementation |
|---------|---------|----------------|
| Dual Provider | Weather API resilience | Parallel queries, cross-validation, failover |
| Multi-Location Validation | Flight corridor safety | 5-point check (takeoff + 3 waypoints + landing) |
| LangGraph Workflow | Complex AI scheduling | Multi-step graph with state management |
| Event-Driven Monitoring | Automated continuous checks | EventBridge + Lambda every 10 minutes |
| Connection Pooling | Database efficiency | Global pool reused across invocations |
| Optimistic Locking | Concurrent update safety | Version-based conflict detection |
| Audit Trail | Complete accountability | Immutable event log for all actions |
| Instructor Priority | Preference resolution | Deterministic rule-based selection |
| Deadline Enforcement | Timely decision making | Server-side validation with escalation |


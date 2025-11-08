# Analytics & Audit Logging Guide

## Overview

Flight Schedule Pro implements comprehensive audit logging and analytics to provide full visibility into system operations, user actions, and business metrics. This guide covers:

- **Audit Trail**: Immutable log of all system events
- **CloudWatch Logs**: Structured application logging
- **CloudWatch Metrics**: Custom business and performance metrics
- **CloudWatch Dashboard**: Real-time monitoring and visualization
- **Analytics Queries**: Pre-built queries for common analysis tasks

---

## 1. Audit Trail (Database)

### Schema

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    user_id UUID REFERENCES users(id),
    data JSONB,
    metadata JSONB
);
```

### Event Types

| Event Type | Description | Entity Type |
|------------|-------------|-------------|
| `WEATHER_CHECK` | Weather validation performed | `booking` |
| `CONFLICT_DETECTED` | Weather conflict identified | `booking` |
| `STATUS_CHANGE` | Booking status updated | `booking` |
| `NOTIFICATION_SENT` | Notification delivered | `notification` |
| `RESCHEDULE_GENERATED` | AI generated reschedule options | `booking` |
| `RESCHEDULE_PREFERENCE_SUBMITTED` | User submitted preferences | `booking` |
| `RESCHEDULE_CONFIRMED` | Reschedule applied | `booking` |
| `RESCHEDULE_WEATHER_REVALIDATED` | Pre-confirmation weather check | `booking` |
| `AVAILABILITY_CREATED` | Availability pattern created | `availability` |
| `AVAILABILITY_UPDATED` | Availability pattern updated | `availability` |
| `AVAILABILITY_DELETED` | Availability pattern deleted | `availability` |
| `BOOKING_CREATED` | New booking created | `booking` |
| `BOOKING_UPDATED` | Booking details updated | `booking` |
| `BOOKING_CANCELLED` | Booking cancelled | `booking` |
| `USER_LOGIN` | User authenticated | `user` |
| `USER_REGISTERED` | New user account created | `user` |

### Querying the Audit Trail

#### Get full history for a booking
```sql
SELECT 
    timestamp,
    event_type,
    user_id,
    data,
    metadata
FROM audit_log
WHERE entity_type = 'booking' 
  AND entity_id = '<booking-uuid>'
ORDER BY timestamp DESC;
```

#### Get all weather conflicts in the last 24 hours
```sql
SELECT 
    al.timestamp,
    al.entity_id as booking_id,
    al.data->>'reason' as conflict_reason,
    b.departure_airport,
    b.arrival_airport,
    b.scheduled_departure,
    u.name as student_name
FROM audit_log al
JOIN bookings b ON al.entity_id = b.id
JOIN users u ON b.student_id = u.id
WHERE al.event_type = 'CONFLICT_DETECTED'
  AND al.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY al.timestamp DESC;
```

#### Track reschedule journey for a booking
```sql
SELECT 
    timestamp,
    event_type,
    data
FROM audit_log
WHERE entity_type = 'booking' 
  AND entity_id = '<booking-uuid>'
  AND event_type LIKE 'RESCHEDULE_%'
ORDER BY timestamp ASC;
```

#### Count events by type (last 7 days)
```sql
SELECT 
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT entity_id) as unique_entities,
    COUNT(DISTINCT user_id) as unique_users
FROM audit_log
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY event_count DESC;
```

#### User activity summary
```sql
SELECT 
    u.name,
    u.email,
    u.role,
    COUNT(*) as total_actions,
    COUNT(DISTINCT DATE(al.timestamp)) as active_days,
    MAX(al.timestamp) as last_activity
FROM audit_log al
JOIN users u ON al.user_id = u.id
WHERE al.timestamp > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name, u.email, u.role
ORDER BY total_actions DESC;
```

---

## 2. CloudWatch Logs

### Log Groups

- `/aws/lambda/flight-schedule-pro-{env}-weather-monitor`
- `/aws/lambda/flight-schedule-pro-{env}-api-handler`
- `/aws/lambda/flight-schedule-pro-{env}-reschedule-engine`

### Log Types

All logs are structured JSON with the following fields:

```json
{
  "timestamp": "2024-11-08T10:30:45.123Z",
  "level": "info",
  "message": "Weather check: VALID",
  "service": "flight-schedule-pro",
  "environment": "production",
  "version": "1.0.0",
  "logType": "weather_check",
  "bookingId": "uuid",
  "status": "VALID",
  "functionName": "weather-monitor"
}
```

### CloudWatch Logs Insights Queries

#### 1. Recent Errors (Last 1 Hour)
```
fields @timestamp, @message, functionName, error.message, error.stack
| filter logType = "error"
| sort @timestamp desc
| limit 50
```

#### 2. Performance - Slow Lambda Executions (>5 seconds)
```
fields @timestamp, functionName, duration, timerName
| filter logType = "performance" and duration > 5000
| sort duration desc
| limit 20
```

#### 3. Weather Check Success Rate
```
fields @timestamp, bookingId, status
| filter logType = "weather_check"
| stats count() as total, 
        count_if(status = "VALID") as valid,
        count_if(status = "INVALID") as invalid
  by bin(1h)
```

#### 4. API Latency by Endpoint
```
fields @timestamp, endpoint, method, duration
| filter logType = "api_call"
| stats avg(duration) as avg_latency, 
        max(duration) as max_latency,
        count() as request_count
  by endpoint, method
| sort avg_latency desc
```

#### 5. Notifications Sent (Success vs Failure)
```
fields @timestamp, type, success
| filter logType = "notification"
| stats count() as total,
        count_if(success = true) as successful,
        count_if(success = false) as failed
  by type
```

#### 6. Lambda Cold Starts
```
fields @timestamp, functionName, @duration
| filter @type = "REPORT"
| filter @initDuration > 0
| stats count() as cold_starts,
        avg(@initDuration) as avg_init_duration
  by functionName
```

#### 7. Booking Creation Rate
```
fields @timestamp, bookingId, trainingLevel
| filter logType = "booking_created"
| stats count() as bookings_created by bin(1h), trainingLevel
```

#### 8. Reschedule Success Rate
```
fields @timestamp, bookingId, success
| filter logType = "reschedule"
| stats count() as total_attempts,
        count_if(success = true) as successful,
        count_if(success = false) as failed
  by bin(1h)
```

#### 9. Weather Conflicts by Reason
```
fields @timestamp, bookingId, reason
| filter logType = "conflict"
| stats count() as conflict_count by reason
| sort conflict_count desc
```

#### 10. Lambda Function Performance Summary (Last 24h)
```
fields functionName, @duration, @memorySize, @billedDuration
| filter @type = "REPORT"
| stats avg(@duration) as avg_duration,
        max(@duration) as max_duration,
        avg(@memorySize) as avg_memory,
        count() as invocation_count
  by functionName
```

---

## 3. CloudWatch Custom Metrics

### Metric Namespace: `FlightSchedulePro`

### Available Metrics

| Metric Name | Unit | Dimensions | Description |
|-------------|------|------------|-------------|
| `LambdaInvocation` | Count | FunctionName | Lambda function invoked |
| `LambdaDuration` | Milliseconds | FunctionName | Lambda execution time |
| `LambdaSuccess` | Count | FunctionName | Successful Lambda execution |
| `LambdaError` | Count | FunctionName | Lambda execution error |
| `WeatherCheck` | Count | Status | Weather validation performed |
| `WeatherConflict` | Count | Reason | Weather conflict detected |
| `BookingCreated` | Count | TrainingLevel | New booking created |
| `RescheduleAttempt` | Count | Success | Reschedule attempt |
| `NotificationSent` | Count | Type, Success | Notification delivered |
| `APICall` | Count | Endpoint, Method, StatusCode | API request |
| `APILatency` | Milliseconds | Endpoint | API response time |
| `PerformanceTimer` | Milliseconds | TimerName | Custom performance metric |

### Querying Metrics

#### Via AWS CLI
```bash
# Get weather checks in the last hour
aws cloudwatch get-metric-statistics \
  --namespace FlightSchedulePro \
  --metric-name WeatherCheck \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Get average API latency for bookings endpoint
aws cloudwatch get-metric-statistics \
  --namespace FlightSchedulePro \
  --metric-name APILatency \
  --dimensions Name=Endpoint,Value=/bookings \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum
```

#### Via CloudWatch Console
1. Navigate to CloudWatch → Metrics → All metrics
2. Select `FlightSchedulePro` namespace
3. Choose metric and dimensions
4. Add to graph and configure

---

## 4. CloudWatch Dashboard

### Access
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=flight-schedule-pro-{env}-dashboard
```

### Widgets

1. **Lambda - Weather Monitor**: Invocations, Errors, Duration
2. **API Gateway Metrics**: Request count, 4xx/5xx errors, Latency
3. **RDS Performance**: CPU, Connections, Memory
4. **Custom Metrics - Weather Checks**: Weather validation count over time
5. **Custom Metrics - Weather Conflicts**: Conflict detection over time
6. **Custom Metrics - Bookings**: Booking creation rate
7. **Custom Metrics - Reschedule Success Rate**: Success vs failure
8. **Custom Metrics - Notifications**: Notification delivery rate
9. **Recent Error Logs**: Last 20 error entries

---

## 5. Embedded Metric Format (EMF)

### What is EMF?

EMF allows publishing custom metrics directly from CloudWatch Logs without using the PutMetricData API. Metrics are extracted automatically.

### Example EMF Log Entry

```json
{
  "_aws": {
    "Timestamp": 1699449045000,
    "CloudWatchMetrics": [
      {
        "Namespace": "FlightSchedulePro",
        "Dimensions": [["Status"]],
        "Metrics": [
          {
            "Name": "WeatherCheck",
            "Unit": "Count"
          }
        ]
      }
    ]
  },
  "Status": "VALID",
  "WeatherCheck": 1
}
```

This log entry automatically creates a metric in CloudWatch Metrics.

---

## 6. Performance Tracking

### Using Performance Timers

```typescript
import { startPerformanceTimer, endPerformanceTimer } from '../utils/logger';

// Start timer
startPerformanceTimer('weather-api-call');

// Perform operation
const weather = await weatherService.getWeather(coords);

// End timer (automatically logs and records metric)
const duration = endPerformanceTimer('weather-api-call', {
  provider: 'OpenWeatherMap',
  coords: coords
});
```

### Lambda Function Telemetry

```typescript
import { logLambdaStart, logLambdaEnd } from '../utils/logger';

export const handler = async (event: any) => {
  logLambdaStart('weather-monitor', event);
  
  try {
    // Function logic
    const result = await processWeatherCheck();
    
    logLambdaEnd('weather-monitor', true, 200);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    logLambdaEnd('weather-monitor', false, 500);
    throw error;
  }
};
```

---

## 7. Business Metrics Tracking

### Track Booking Creation
```typescript
import { logBookingCreated } from '../utils/logger';

logBookingCreated(bookingId, trainingLevel);
```

### Track Reschedule Attempts
```typescript
import { logRescheduleAttempt } from '../utils/logger';

logRescheduleAttempt(bookingId, success);
```

### Track Notifications
```typescript
import { logNotificationSent } from '../utils/logger';

logNotificationSent('WEATHER_CONFLICT', userEmail, success);
```

---

## 8. Alerting Best Practices

### Critical Alerts

1. **Lambda Error Rate > 3%**
   - Indicates system instability
   - Investigate immediately

2. **API Gateway 5xx > 5%**
   - Backend service issues
   - Check Lambda logs and RDS health

3. **RDS CPU > 80%**
   - Database performance degradation
   - Consider scaling or optimization

4. **RDS Connections > 80**
   - Connection pool exhaustion
   - Check for connection leaks

### Warning Alerts

1. **Weather API Failover**
   - Primary provider unreachable
   - Monitor secondary provider

2. **Notification Delivery Failures**
   - SES issues or invalid emails
   - Review bounce/complaint rates

---

## 9. Compliance & Data Retention

### Audit Log Retention
- **Database**: Indefinite (unless manually purged)
- **Compliance**: GDPR/SOC2 compliant
- **Immutable**: `audit_log` table has no UPDATE capability

### CloudWatch Logs Retention
- **Development**: 7 days
- **Staging**: 30 days
- **Production**: 90 days (configurable)

### CloudWatch Metrics Retention
- High-resolution (1-minute): 15 days
- Standard (5-minute): 63 days
- Aggregated (1-hour): 15 months

---

## 10. Troubleshooting Scenarios

### Scenario 1: Missing Weather Checks
**Symptom**: Bookings not being validated

**Investigation**:
```sql
-- Check if weather monitor is running
SELECT COUNT(*) 
FROM audit_log 
WHERE event_type = 'WEATHER_CHECK' 
  AND timestamp > NOW() - INTERVAL '30 minutes';
```

**CloudWatch Query**:
```
fields @timestamp, bookingId, status
| filter logType = "weather_check"
| stats count() by bin(10m)
```

### Scenario 2: High API Latency
**Symptom**: Dashboard slow to load

**Investigation**:
```
fields endpoint, method, duration
| filter logType = "api_call" and duration > 1000
| stats avg(duration), max(duration), count() by endpoint
| sort avg(duration) desc
```

### Scenario 3: Reschedule Failures
**Symptom**: AI not generating options

**Investigation**:
```sql
SELECT 
    timestamp,
    data->>'error' as error_message,
    data->>'details' as details
FROM audit_log
WHERE event_type LIKE 'RESCHEDULE_%'
  AND data->>'success' = 'false'
ORDER BY timestamp DESC
LIMIT 10;
```

**CloudWatch Query**:
```
fields @timestamp, @message, error.message
| filter functionName = "reschedule-engine" and logType = "error"
| sort @timestamp desc
```

### Scenario 4: Notification Delivery Issues
**Symptom**: Users not receiving emails

**Investigation**:
```
fields @timestamp, type, recipient, success
| filter logType = "notification"
| stats count() as total,
        count_if(success = true) as delivered,
        count_if(success = false) as failed
  by type
```

**Audit Trail**:
```sql
SELECT 
    timestamp,
    data->>'notificationType' as type,
    data->>'details' as details
FROM audit_log
WHERE event_type = 'NOTIFICATION_SENT'
  AND timestamp > NOW() - INTERVAL '1 hour'
  AND data->>'success' = 'false';
```

---

## 11. Key Performance Indicators (KPIs)

### Operational KPIs
- **Weather Check Cycle Time**: Target <10 minutes
- **Notification Delivery Time**: Target <3 minutes
- **Dashboard Load Time**: Target <10 seconds
- **AI Suggestion Generation**: Target <15 seconds
- **API Latency (p95)**: Target <500ms

### Business KPIs
- **Booking Creation Rate**: Track daily/weekly trends
- **Weather Conflict Rate**: % of bookings affected
- **Reschedule Success Rate**: % of conflicts resolved
- **Preference Submission Rate**: % of users responding
- **Manual Escalation Rate**: % requiring admin intervention

### Query for KPI Dashboard
```sql
WITH kpis AS (
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'BOOKING_CREATED') as bookings_created,
    COUNT(*) FILTER (WHERE event_type = 'CONFLICT_DETECTED') as conflicts_detected,
    COUNT(*) FILTER (WHERE event_type = 'RESCHEDULE_CONFIRMED') as reschedules_confirmed,
    COUNT(*) FILTER (WHERE event_type LIKE 'RESCHEDULE_PREFERENCE%') as preferences_submitted
  FROM audit_log
  WHERE timestamp > NOW() - INTERVAL '7 days'
)
SELECT 
  bookings_created,
  conflicts_detected,
  ROUND(100.0 * conflicts_detected / NULLIF(bookings_created, 0), 2) as conflict_rate_pct,
  reschedules_confirmed,
  ROUND(100.0 * reschedules_confirmed / NULLIF(conflicts_detected, 0), 2) as resolution_rate_pct,
  preferences_submitted
FROM kpis;
```

---

## 12. Cost Optimization

### CloudWatch Logs
- Use Log Insights queries instead of exporting to S3 for ad-hoc analysis
- Set appropriate retention periods per environment
- Filter logs before ingestion (only log necessary data)

### CloudWatch Metrics
- Use EMF for high-volume metrics (more cost-effective than PutMetricData)
- Aggregate metrics where possible
- Use standard resolution (1-minute) only when needed

### Database Audit Log
- Implement archival strategy for old audit records (>1 year)
- Partition `audit_log` table by timestamp for better query performance
- Consider archiving to S3 for long-term retention

---

## Summary

This analytics infrastructure provides:
- ✅ Full audit trail of all system actions
- ✅ Structured application logging
- ✅ Custom business metrics
- ✅ Real-time monitoring dashboard
- ✅ Pre-built queries for common analysis tasks
- ✅ Performance tracking and optimization insights
- ✅ Compliance-ready data retention

For support or questions, refer to the main documentation or contact the development team.

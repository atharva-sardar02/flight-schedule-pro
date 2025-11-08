# Staging Testing Checklist

## Overview

This document provides a comprehensive testing checklist for validating all acceptance criteria on the staging environment.

**Testing Duration:** 2-3 days  
**Testers:** Development team + QA  
**Environment:** Staging (staging.flightschedulepro.com)

---

## Pre-Testing Setup

### Test Accounts

Create the following test accounts:

1. **Student Pilot**
   - Email: `student@staging.flightschedulepro.com`
   - Role: STUDENT
   - Training Level: STUDENT_PILOT

2. **Private Pilot**
   - Email: `private@staging.flightschedulepro.com`
   - Role: STUDENT
   - Training Level: PRIVATE_PILOT

3. **Instrument Rated**
   - Email: `instrument@staging.flightschedulepro.com`
   - Role: STUDENT
   - Training Level: INSTRUMENT_RATED

4. **Instructor**
   - Email: `instructor@staging.flightschedulepro.com`
   - Role: INSTRUCTOR

5. **Admin**
   - Email: `admin@staging.flightschedulepro.com`
   - Role: ADMIN

---

## Acceptance Criteria Testing

### Weather Monitoring (5 criteria)

#### AC-1: Weather conflicts detected with 100% accuracy

**Test Steps:**
1. Create booking with invalid weather conditions
2. Wait for weather monitor cycle (10 minutes)
3. Verify booking status changes to AT_RISK
4. Check CloudWatch logs for conflict detection

**Expected Result:** Booking status = AT_RISK, conflict logged

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-2: Weather checked every 10 minutes without missed cycles

**Test Steps:**
1. Monitor EventBridge rule execution
2. Check CloudWatch logs for weather monitor invocations
3. Verify execution every 10 minutes for 2 hours
4. Check for any missed cycles

**Expected Result:** Weather monitor executes every 10 minutes, no missed cycles

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-3: Dual weather API failover works correctly

**Test Steps:**
1. Simulate OpenWeatherMap API failure (or use invalid key)
2. Verify system uses WeatherAPI.com
3. Restore OpenWeatherMap, verify system uses both
4. Check logs for failover messages

**Expected Result:** System automatically fails over to secondary provider

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-4: Corridor weather validated at 3 waypoints

**Test Steps:**
1. Create booking with long route (e.g., KJFK → KLAX)
2. Check weather monitor logs
3. Verify weather checked at 5 locations (departure + 3 waypoints + arrival)
4. Verify waypoint coordinates are correct

**Expected Result:** Weather checked at all 5 locations, waypoints evenly spaced

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-5: Weather data cached for 5 minutes

**Test Steps:**
1. Create two bookings with same coordinates
2. Check weather API call count
3. Verify second booking uses cached data
4. Wait 6 minutes, verify cache expired

**Expected Result:** Weather API called once, cached for subsequent requests

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

### Notification System (4 criteria)

#### AC-6: Notifications delivered within 2 minutes

**Test Steps:**
1. Trigger weather conflict
2. Record timestamp of conflict detection
3. Check email delivery timestamp
4. Verify delivery within 2 minutes

**Expected Result:** Email delivered within 2 minutes

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-7: Preference deadline reminders sent 2 hours before cutoff

**Test Steps:**
1. Generate reschedule options
2. Calculate deadline
3. Wait until 2 hours before deadline
4. Verify reminder email sent

**Expected Result:** Reminder email sent exactly 2 hours before deadline

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-8: Escalation notices sent when deadline passes

**Test Steps:**
1. Generate reschedule options
2. Don't submit preferences
3. Wait for deadline to pass
4. Verify escalation notification sent

**Expected Result:** Escalation notification sent to admin

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-9: Email and in-app notifications for every conflict

**Test Steps:**
1. Trigger weather conflict
2. Check email inbox
3. Check in-app notifications
4. Verify both student and instructor notified

**Expected Result:** Both email and in-app notifications sent

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

### AI Rescheduling (9 criteria)

#### AC-10: AI generates 3 time slots with zero schedule conflicts

**Test Steps:**
1. Trigger AI rescheduling
2. Verify exactly 3 options generated
3. Check each option against availability calendars
4. Verify no conflicts with existing bookings

**Expected Result:** 3 options, all conflict-free

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-11: All suggested slots validated for weather (5 locations)

**Test Steps:**
1. Generate reschedule options
2. Check weather validation logs
3. Verify weather checked at 5 locations for each option
4. Verify all options have valid weather

**Expected Result:** All options validated at 5 locations

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-12: AI searches 7-day window

**Test Steps:**
1. Create booking for today
2. Trigger rescheduling
3. Check option dates
4. Verify all options within 7 days

**Expected Result:** All options within 7-day window

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-13: Preference ranking system works (1st, 2nd, 3rd)

**Test Steps:**
1. Generate reschedule options
2. Submit preferences (rank 1st, 2nd, 3rd)
3. Verify preferences saved correctly
4. Check database for correct ranking

**Expected Result:** Preferences saved with correct ranking

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-14: Instructor "not available" marking triggers new generation

**Test Steps:**
1. Generate reschedule options
2. Mark all options as unavailable
3. Verify new options generated automatically
4. Check logs for regeneration trigger

**Expected Result:** New options generated when all marked unavailable

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-15: Final selection uses instructor's highest-ranked option

**Test Steps:**
1. Generate reschedule options
2. Student ranks: Option A (1st), Option B (2nd), Option C (3rd)
3. Instructor ranks: Option C (1st), Option A (2nd), Option B (3rd)
4. Submit both preferences
5. Verify Option C selected (instructor's #1)

**Expected Result:** Instructor's #1 choice selected

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-16: Instructor priority resolves conflicts correctly

**Test Steps:**
1. Generate reschedule options
2. Create conflicting preferences
3. Submit both preferences
4. Verify instructor priority applied

**Expected Result:** Instructor's preference wins

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-17: Weather re-validation before confirmation

**Test Steps:**
1. Generate reschedule options
2. Select an option
3. Attempt confirmation
4. Check logs for weather re-validation
5. Verify weather checked immediately before confirmation

**Expected Result:** Weather re-validated before confirmation

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-18: Availability constraints respected

**Test Steps:**
1. Set availability patterns
2. Generate reschedule options
3. Verify all options within availability windows
4. Check for options outside availability

**Expected Result:** All options respect availability constraints

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

### Availability Management (4 criteria)

#### AC-19: Create/edit weekly availability patterns

**Test Steps:**
1. Create recurring availability pattern
2. Edit pattern
3. Verify changes saved
4. Check calendar view shows pattern

**Expected Result:** Patterns created and edited successfully

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-20: One-time overrides block availability

**Test Steps:**
1. Create availability override (block)
2. Verify override appears on calendar
3. Verify blocked time not available for booking
4. Check AI rescheduling respects override

**Expected Result:** Overrides block availability correctly

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-21: Real-time sync for conflict checking

**Test Steps:**
1. Create availability pattern
2. Create booking immediately
3. Verify booking respects availability
4. Update availability, verify booking still valid

**Expected Result:** Availability changes reflected immediately

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-22: AI respects availability constraints

**Test Steps:**
1. Set limited availability
2. Trigger AI rescheduling
3. Verify all options within availability
4. Check no options outside availability

**Expected Result:** All AI options respect availability

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

### Deadline Management (4 criteria)

#### AC-23: Deadline calculated as min(30 min before departure, 12 hours after notification)

**Test Steps:**
1. Create booking 2 hours from now
2. Trigger rescheduling
3. Calculate deadline
4. Verify deadline = 30 minutes before departure

**Test Steps (Alternative):**
1. Create booking 24 hours from now
2. Trigger rescheduling
3. Calculate deadline
4. Verify deadline = 12 hours after notification

**Expected Result:** Deadline calculated correctly

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-24: Preferences submitted after deadline rejected

**Test Steps:**
1. Generate reschedule options
2. Wait for deadline to pass
3. Attempt to submit preferences
4. Verify 403 Forbidden response

**Expected Result:** Late submissions rejected

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-25: System escalates when deadline passes

**Test Steps:**
1. Generate reschedule options
2. Don't submit preferences
3. Wait for deadline to pass
4. Verify escalation notification sent
5. Check admin can manually escalate

**Expected Result:** Escalation triggered when deadline passes

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-26: Deadline countdown displayed

**Test Steps:**
1. Generate reschedule options
2. View preference ranking page
3. Verify countdown timer displayed
4. Verify timer updates in real-time
5. Verify timer changes color at 2 hours remaining

**Expected Result:** Countdown timer displayed and accurate

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

### Database & Dashboard (4 criteria)

#### AC-27: Database updates reflect changes within 1 second

**Test Steps:**
1. Create booking
2. Immediately query database
3. Verify booking exists
4. Measure time between create and query

**Expected Result:** Changes visible within 1 second

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-28: Dashboard displays alerts with <5 second latency

**Test Steps:**
1. Trigger weather conflict
2. Open dashboard
3. Measure time until alert appears
4. Verify alert appears within 5 seconds

**Expected Result:** Alerts appear within 5 seconds

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-29: Availability changes propagate immediately

**Test Steps:**
1. Create availability pattern
2. Immediately check calendar
3. Verify pattern appears
4. Update pattern, verify change appears

**Expected Result:** Changes appear immediately

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-30: All reschedule actions logged

**Test Steps:**
1. Generate reschedule options
2. Submit preferences
3. Confirm reschedule
4. Check audit_log table
5. Verify all actions logged

**Expected Result:** All actions in audit log

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

### Training Level Logic (3 criteria)

#### AC-31: Weather minimums applied correctly (100% of test cases)

**Test Steps:**
1. Create booking for Student Pilot
2. Verify weather minimums: 5mi visibility, 15kt wind, 3000ft ceiling
3. Create booking for Private Pilot
4. Verify weather minimums: 3mi visibility, 20kt wind, 1000ft ceiling
5. Create booking for Instrument Rated
6. Verify weather minimums: 0.5mi visibility, 30kt wind, 200ft ceiling

**Expected Result:** Correct minimums applied for each level

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-32: Weather API returns valid JSON for all locations

**Test Steps:**
1. Create booking with 5 locations
2. Check weather API responses
3. Verify all responses are valid JSON
4. Verify all locations have weather data

**Expected Result:** All API responses valid JSON

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

#### AC-33: Background scheduler executes every 10 minutes

**Test Steps:**
1. Monitor EventBridge rule
2. Check CloudWatch logs
3. Verify execution every 10 minutes
4. Monitor for 2 hours

**Expected Result:** Scheduler executes every 10 minutes

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

## Additional Testing

### EventBridge Scheduler Verification

**Duration:** 2 hours

**Test Steps:**
1. Monitor EventBridge rule execution
2. Check CloudWatch logs every 10 minutes
3. Verify weather monitor Lambda invoked
4. Check for any missed executions
5. Verify bookings checked correctly

**Expected Result:** Scheduler executes every 10 minutes, no missed cycles

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

### Email Delivery Testing

**Test Steps:**
1. Trigger weather alert
2. Verify email received
3. Check email formatting (HTML + plain text)
4. Verify links work
5. Test all notification types:
   - Weather alert
   - Options available
   - Deadline reminder
   - Confirmation

**Expected Result:** All emails delivered correctly

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

### Dual Weather API Integration

**Test Steps:**
1. Verify both APIs configured
2. Check API keys in Secrets Manager
3. Trigger weather check
4. Verify both APIs called (or failover works)
5. Check logs for API usage

**Expected Result:** Both APIs working or failover functional

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

### Cognito Authentication Flows

**Test Steps:**
1. Register new user
2. Verify email confirmation
3. Login with credentials
4. Verify JWT token received
5. Test protected routes
6. Test token refresh
7. Test logout

**Expected Result:** All authentication flows work

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

### CloudWatch Dashboards and Alarms

**Test Steps:**
1. Access CloudWatch dashboard
2. Verify all widgets display data
3. Check Lambda metrics
4. Check API Gateway metrics
5. Check RDS metrics
6. Check custom metrics
7. Verify alarms configured
8. Test alarm notification (if possible)

**Expected Result:** All dashboards and alarms working

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

### Load Testing

**Test:** 20 concurrent bookings

**Test Steps:**
1. Run load test script (see `tests/load/loadTest.js`)
2. Create 20 bookings simultaneously
3. Monitor system performance
4. Check for errors
5. Verify all bookings created
6. Check response times

**Expected Result:** System handles 20 concurrent bookings

**Status:** [ ] Pass [ ] Fail [ ] N/A

**Notes:**

---

## Test Summary

### Overall Results

**Total Criteria Tested:** 33  
**Passed:** ___  
**Failed:** ___  
**N/A:** ___

### Critical Issues

[List any critical issues found]

### Major Issues

[List any major issues found]

### Minor Issues

[List any minor issues found]

---

## Sign-Off

**Tester Name:** _________________  
**Date:** _________________  
**Status:** [ ] Ready for Production [ ] Needs Fixes

**Notes:**

---

**Last Updated:** November 2024  
**Version:** 1.0.0


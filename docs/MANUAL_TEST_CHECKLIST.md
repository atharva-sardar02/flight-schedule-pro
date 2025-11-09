# Manual Test Checklist - Flight Schedule Pro

## Prerequisites
- Backend server running on http://localhost:3001
- Frontend running on http://localhost:3000
- Database connected and migrations run
- Cognito configured

## Test Categories

### 1. Authentication & User Management

#### Registration
- [ ] Register new student user
- [ ] Register new instructor user
- [ ] Register new admin user
- [ ] Verify email confirmation (or auto-confirm in dev)

#### Login
- [ ] Login with student credentials
- [ ] Login with instructor credentials
- [ ] Login with admin credentials
- [ ] Verify token storage
- [ ] Verify user role in dashboard

#### Token Refresh
- [ ] Refresh access token
- [ ] Verify token expiration handling

### 2. Availability Management

#### Instructor Availability
- [ ] View availability calendar
- [ ] Create recurring weekly pattern
- [ ] Update recurring pattern
- [ ] Delete recurring pattern
- [ ] Create one-time override (block time)
- [ ] Create one-time override (add time)
- [ ] View availability on calendar grid

#### Student Availability
- [ ] View availability calendar
- [ ] Create recurring weekly pattern
- [ ] Update/delete patterns

### 3. Booking Management

#### Create Booking
- [ ] Student creates booking
- [ ] Verify booking appears in list
- [ ] Verify booking appears on calendar
- [ ] Verify booking shows on availability calendar (blocked)
- [ ] Instructor creates booking for student
- [ ] Admin creates booking

#### View Bookings
- [ ] Student sees only their bookings
- [ ] Instructor sees bookings assigned to them
- [ ] Admin sees all bookings
- [ ] View booking details
- [ ] View bookings on calendar view

#### Update Booking
- [ ] Update booking details
- [ ] Cancel booking
- [ ] Verify status changes

### 4. Rescheduling Flow

#### Manual Rescheduling (Instructor/Admin)
- [ ] Generate reschedule options
- [ ] View 3 AI-generated options
- [ ] Verify options respect availability
- [ ] Verify options have weather validation
- [ ] Submit preference ranking
- [ ] Confirm reschedule selection
- [ ] Verify booking updated

#### Automatic AI Rescheduling (Weather)
- [ ] Create booking with weather risk
- [ ] Verify weather monitor detects risk
- [ ] Verify AI generates options automatically
- [ ] Verify notifications sent
- [ ] Test preference deadline
- [ ] Test automatic escalation if deadline passes

### 5. Weather Monitoring

#### Weather Checks
- [ ] Verify weather data fetched for locations
- [ ] Verify dual API failover (if primary fails)
- [ ] Verify weather validation for training levels
- [ ] Test student pilot restrictions (clear skies)
- [ ] Test private pilot restrictions
- [ ] Test instrument rated allowances

#### Weather Conflicts
- [ ] Create booking with bad weather
- [ ] Verify AT_RISK status
- [ ] Verify automatic rescheduling triggered
- [ ] Verify notifications sent

### 6. Notifications

#### In-App Notifications
- [ ] Verify notifications appear in UI
- [ ] Verify notification types (weather, reschedule, etc.)
- [ ] Mark notification as read
- [ ] Delete notification

#### Email Notifications
- [ ] Verify email sent on booking creation
- [ ] Verify email sent on weather risk
- [ ] Verify email sent on reschedule options
- [ ] Verify email sent on reschedule confirmation

### 7. API Endpoints

#### Health Check
- [ ] GET /health returns 200
- [ ] GET / returns health status

#### Auth Endpoints
- [ ] POST /auth/register - Create user
- [ ] POST /auth/login - Authenticate
- [ ] POST /auth/refresh - Refresh token
- [ ] GET /auth/me - Get current user

#### Booking Endpoints
- [ ] GET /bookings - List bookings
- [ ] POST /bookings - Create booking
- [ ] GET /bookings/:id - Get booking
- [ ] PUT /bookings/:id - Update booking
- [ ] DELETE /bookings/:id - Delete booking

#### Availability Endpoints
- [ ] GET /availability - Get availability
- [ ] POST /availability/recurring - Create pattern
- [ ] PUT /availability/recurring/:id - Update pattern
- [ ] DELETE /availability/recurring/:id - Delete pattern

#### Reschedule Endpoints
- [ ] POST /reschedule/generate/:bookingId - Generate options
- [ ] GET /reschedule/options/:bookingId - Get options
- [ ] POST /preferences/submit - Submit preferences
- [ ] POST /reschedule/confirm/:bookingId - Confirm reschedule

### 8. Frontend Functionality

#### Navigation
- [ ] All routes accessible
- [ ] Protected routes require auth
- [ ] Role-based navigation works
- [ ] Logout clears session

#### Forms
- [ ] Form validation works
- [ ] Error messages display
- [ ] Success messages display
- [ ] Loading states show

#### Calendar Views
- [ ] Availability calendar displays correctly
- [ ] Bookings calendar displays correctly
- [ ] Date navigation works
- [ ] Time slots display correctly
- [ ] Blocked slots show in red

### 9. Error Handling

#### API Errors
- [ ] 400 errors display user-friendly messages
- [ ] 401 errors redirect to login
- [ ] 404 errors display correctly
- [ ] 500 errors show generic message

#### Network Errors
- [ ] Offline handling
- [ ] Timeout handling
- [ ] Retry logic

### 10. Performance

#### Load Times
- [ ] Dashboard loads < 2s
- [ ] Calendar loads < 3s
- [ ] API responses < 1s

#### Database Queries
- [ ] No N+1 queries
- [ ] Efficient pagination
- [ ] Proper indexing used

## Test Results

Date: ___________
Tester: ___________

### Summary
- Total Tests: ___
- Passed: ___
- Failed: ___
- Skipped: ___

### Critical Issues
1. 
2. 
3. 

### Notes
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________




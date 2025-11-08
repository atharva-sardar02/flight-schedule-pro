# Frontend Testing Plan
## Flight Schedule Pro - User Flow Testing Guide

This document provides a step-by-step plan to test all major user flows in the Flight Schedule Pro frontend application.

---

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd backend
   npm run dev
   # Should be running on http://localhost:3001
   ```

2. **Frontend Server Running**
   ```bash
   cd frontend
   npm run dev
   # Should be running on http://localhost:3000
   ```

3. **Database Running**
   - PostgreSQL should be running
   - Database should be initialized with migrations
   - Seed data should be loaded (optional but helpful)

4. **Environment Variables**
   - Check `.env` file in backend has all required variables
   - Check `frontend/.env` has `VITE_API_BASE_URL=http://localhost:3001`

---

## Test User Accounts

### Option 1: Use Existing Seed Data
Check `database/seeds/dev_users.sql` for test users.

### Option 2: Register New Users
You'll need to register users with different roles:
- **Student**: Role = `STUDENT`
- **Instructor**: Role = `INSTRUCTOR`
- **Admin**: Role = `ADMIN`

**Note**: For local development, you may need to manually confirm users in Cognito or use a local auth bypass.

---

## Testing Flows

### 🔐 Flow 1: Authentication

#### 1.1 Registration
1. Navigate to `http://localhost:3000/register`
2. Fill in registration form:
   - Email: `test.student@example.com`
   - Password: `TestPassword123!` (must meet Cognito requirements)
   - First Name: `Test`
   - Last Name: `Student`
   - Role: `STUDENT`
3. Click "Register"
4. **Expected**: Success message or redirect to login
5. **Check**: User created in database

#### 1.2 Login
1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   - Email: `test.student@example.com`
   - Password: `TestPassword123!`
3. Click "Login"
4. **Expected**: Redirect to `/dashboard`
5. **Check**: User data displayed in dashboard/navbar

#### 1.3 Logout
1. Click user menu/logout button (if available)
2. **Expected**: Redirect to `/login`
3. **Check**: Token cleared from localStorage

---

### 📊 Flow 2: Dashboard

#### 2.1 View Dashboard
1. Login as any user
2. Navigate to `/dashboard` (should be default after login)
3. **Expected**: Dashboard loads with:
   - Metrics panel (Total Flights, Active Alerts, etc.)
   - Weather alerts section
   - Flight status section
   - Quick action buttons
4. **Check**: 
   - All sections render correctly
   - Loading spinner appears during data fetch
   - No console errors

#### 2.2 Dashboard Refresh
1. On dashboard, click refresh button (if available)
2. **Expected**: Data refreshes, loading indicator shows
3. **Check**: Updated timestamp changes

#### 2.3 Dashboard Navigation
1. Click "Schedule New Flight" button
   - **Expected**: Navigate to `/bookings/new`
2. Click "View All Bookings" button
   - **Expected**: Navigate to `/bookings`
3. Click "Manage Availability" button
   - **Expected**: Navigate to `/availability`
4. Click "System Settings" button
   - **Expected**: Navigate to `/settings`

---

### ✈️ Flow 3: Booking Management

#### 3.1 Create Booking
1. Navigate to `/bookings/new`
2. Fill in booking form:
   - Student ID: (UUID from users table)
   - Instructor ID: (UUID from users table)
   - Departure Airport: Select from dropdown (e.g., `KJFK`)
   - Arrival Airport: Select from dropdown (e.g., `KBOS`)
   - Scheduled Date & Time: Future date/time
   - Training Level: Select from dropdown
   - Duration: 60 minutes
   - Aircraft ID: `N12345` (optional)
3. Click "Schedule Flight"
4. **Expected**: 
   - Success message
   - Redirect to booking details page
   - Booking created in database
5. **Check**: 
   - Weather validation runs (check backend logs)
   - Booking status is `CONFIRMED` or `WEATHER_CONFLICT`

#### 3.2 View Booking List
1. Navigate to `/bookings`
2. **Expected**: List of bookings displayed in table
3. **Check**:
   - Pagination controls visible (if >20 bookings)
   - Filters work (Status, Training Level, Date Range)
   - Each booking shows: Route, Date, Status, Training Level, Duration
   - "View" button for each booking

#### 3.3 Filter Bookings
1. On `/bookings` page
2. Test filters:
   - **Status Filter**: Select `CONFIRMED`
     - **Expected**: Only confirmed bookings shown
   - **Training Level Filter**: Select `PRIVATE_PILOT`
     - **Expected**: Only private pilot bookings shown
   - **Date Range**: Select start and end dates
     - **Expected**: Only bookings in date range shown
3. **Check**: Results update correctly, pagination resets

#### 3.4 Pagination
1. On `/bookings` page (ensure >20 bookings exist)
2. Click "Next" button
   - **Expected**: Next 20 bookings loaded
   - Page number updates
3. Click "Previous" button
   - **Expected**: Previous 20 bookings loaded
4. **Check**: 
   - Results count updates
   - "Previous" disabled on first page
   - "Next" disabled on last page

#### 3.5 View Booking Details
1. Navigate to `/bookings` and click "View" on any booking
2. **Expected**: Booking details page shows:
   - Full booking information
   - Student and instructor details
   - Weather information (if available)
   - Status badge
   - Actions (Cancel, Reschedule if applicable)
3. **Check**: All data displays correctly

#### 3.6 Cancel Booking
1. Navigate to booking details page
2. Click "Cancel Booking" button
3. Confirm cancellation
4. **Expected**: 
   - Booking status changes to `CANCELLED`
   - Success message displayed
   - Redirect to bookings list or details page
5. **Check**: Status updated in database

---

### 📅 Flow 4: Availability Management

#### 4.1 View Availability Calendar
1. Navigate to `/availability`
2. **Expected**: Calendar view with tabs:
   - "Recurring Availability" tab
   - "One-Time Overrides" tab
   - "Calendar View" tab (if available)
3. **Check**: All tabs render correctly

#### 4.2 Create Recurring Availability
1. On `/availability` page, "Recurring Availability" tab
2. Click "Add Pattern" or similar button
3. Fill in form:
   - Day of Week: Select (e.g., Monday)
   - Start Time: `09:00`
   - End Time: `17:00`
4. Click "Save"
5. **Expected**: 
   - Pattern added to list
   - Success message
   - Pattern visible in calendar view
6. **Check**: Pattern saved in database

#### 4.3 Edit Recurring Availability
1. On recurring availability list, click "Edit" on a pattern
2. Modify time (e.g., change to `10:00 - 18:00`)
3. Click "Save"
4. **Expected**: Pattern updated, changes reflected in calendar
5. **Check**: Database updated

#### 4.4 Delete Recurring Availability
1. On recurring availability list, click "Delete" on a pattern
2. Confirm deletion
3. **Expected**: Pattern removed from list and calendar
4. **Check**: Database record deleted

#### 4.5 Create One-Time Override
1. Switch to "One-Time Overrides" tab
2. Click "Add Override" button
3. Fill in form:
   - Date: Select future date
   - Start Time: `08:00` (optional - to block)
   - End Time: `12:00` (optional - to block)
   - Type: Block or Available
4. Click "Save"
5. **Expected**: Override added, visible in calendar
6. **Check**: Override saved in database

#### 4.6 View Calendar Grid
1. Switch to "Calendar View" tab (if available)
2. **Expected**: Visual calendar showing:
   - Available time slots (green/highlighted)
   - Blocked time slots (red/gray)
   - Recurring patterns
   - One-time overrides
3. **Check**: Calendar accurately reflects availability patterns

---

### 🔄 Flow 5: Rescheduling Flow

#### 5.1 Generate Reschedule Options
1. Navigate to a booking with status `AT_RISK` or `WEATHER_CONFLICT`
2. Click "Reschedule" or "Generate Options" button
3. **Expected**: 
   - Loading indicator
   - AI generates 3 reschedule options
   - Options displayed with:
     - Suggested date/time
     - Weather validation status
     - Instructor availability
     - Student availability
     - Confidence score
     - AI reasoning
4. **Check**: 
   - Options are valid (future dates, within 7 days)
   - Weather validated for each option
   - Availability checked

#### 5.2 View Reschedule Options
1. After options generated, view the list
2. **Expected**: Each option shows:
   - Date and time
   - Route (departure → arrival)
   - Weather badges (Valid/Conflict)
   - Availability badges
   - Confidence score
   - "Select" button
3. **Check**: All information accurate

#### 5.3 Rank Preferences (Student)
1. If preference ranking UI exists, drag and drop options
2. Or select options in order (1st, 2nd, 3rd choice)
3. Click "Submit Preferences"
4. **Expected**: 
   - Preferences saved
   - Success message
   - Deadline countdown visible (if applicable)
5. **Check**: Preferences saved in database

#### 5.4 Rank Preferences (Instructor)
1. Login as instructor
2. Navigate to same booking
3. Rank preferences (instructor priority)
4. **Expected**: Instructor preferences saved
5. **Check**: Instructor priority applied

#### 5.5 View Deadline Countdown
1. After preferences submitted, check deadline countdown
2. **Expected**: 
   - Countdown timer visible
   - Shows time remaining
   - Updates in real-time
3. **Check**: Deadline calculated correctly (min(30 min before departure, 12 hours after notification))

#### 5.6 Confirm Reschedule
1. After preferences submitted by both student and instructor
2. Navigate to booking details
3. Click "Confirm Reschedule" or similar
4. **Expected**: 
   - Confirmation screen shows:
     - Old scheduled time
     - New scheduled time
     - Route details
     - Weather re-validation status
   - Click "Confirm Reschedule"
5. **Expected**: 
   - Booking updated with new time
   - Weather re-validated
   - Email notifications sent
   - Success message
6. **Check**: 
   - Database updated
   - Audit log entry created
   - Notifications sent

---

### 🔔 Flow 6: Notifications

#### 6.1 View Notifications
1. Check notification bell/icon in navbar (if available)
2. **Expected**: 
   - Notification count badge
   - Dropdown/list of notifications
3. **Check**: Notifications display correctly

#### 6.2 Mark Notification as Read
1. Click on a notification
2. **Expected**: 
   - Notification marked as read
   - Badge count decreases
   - Notification styling changes
3. **Check**: Database updated

#### 6.3 Delete Notification
1. Click delete/close on a notification
2. **Expected**: Notification removed from list
3. **Check**: Database record deleted

---

### ⚙️ Flow 7: Settings

#### 7.1 View Settings
1. Navigate to `/settings`
2. **Expected**: Settings page with sections:
   - Profile Settings
   - Notification Preferences
   - Flight Preferences
   - Security Settings
3. **Check**: All sections render

#### 7.2 Update Profile
1. In Profile Settings, update:
   - First Name
   - Last Name
   - Phone Number
2. Click "Save"
3. **Expected**: Profile updated, success message
4. **Check**: Database updated

#### 7.3 Update Notification Preferences
1. In Notification Preferences, toggle:
   - Email notifications
   - In-app notifications
   - Weather alerts
2. Click "Save"
3. **Expected**: Preferences saved
4. **Check**: Database updated

---

### 🚨 Flow 8: Error Handling

#### 8.1 Network Error
1. Stop backend server
2. Try to create a booking
3. **Expected**: 
   - User-friendly error message
   - "Network Error" or "Service Unavailable" message
   - Retry option (if available)
4. **Check**: Error boundary catches error

#### 8.2 Validation Error
1. Try to create booking with invalid data:
   - Past date
   - Invalid airport code
   - Missing required fields
2. **Expected**: 
   - Validation errors displayed
   - Form highlights invalid fields
   - Error messages clear and helpful
3. **Check**: Errors prevent submission

#### 8.3 401 Unauthorized
1. Let token expire or manually remove from localStorage
2. Try to access protected route
3. **Expected**: 
   - Redirect to login
   - Error message about session expired
4. **Check**: Token cleared, user logged out

#### 8.4 404 Not Found
1. Navigate to `/bookings/invalid-id`
2. **Expected**: 
   - 404 error message
   - Option to go back or navigate home
3. **Check**: Error handled gracefully

---

### 🎨 Flow 9: UI/UX Testing

#### 9.1 Responsive Design
1. Test on different screen sizes:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)
2. **Expected**: 
   - Layout adapts correctly
   - Navigation works on mobile
   - Forms usable on small screens
3. **Check**: No horizontal scrolling, text readable

#### 9.2 Loading States
1. Trigger slow operations (create booking, generate options)
2. **Expected**: 
   - Loading spinners appear
   - Buttons disabled during loading
   - Progress indicators (if available)
3. **Check**: User feedback clear

#### 9.3 Empty States
1. Navigate to empty lists:
   - No bookings
   - No availability patterns
   - No notifications
2. **Expected**: 
   - Helpful empty state messages
   - Call-to-action buttons
   - No errors
3. **Check**: UI handles empty states gracefully

---

## Quick Test Checklist

Use this checklist for quick smoke testing:

- [ ] Login works
- [ ] Dashboard loads
- [ ] Create booking works
- [ ] View bookings list works
- [ ] Pagination works
- [ ] Filters work
- [ ] View booking details works
- [ ] Create recurring availability works
- [ ] Create override works
- [ ] Generate reschedule options works
- [ ] Submit preferences works
- [ ] Confirm reschedule works
- [ ] Settings page loads
- [ ] Error messages display correctly
- [ ] Loading spinners appear
- [ ] Navigation works
- [ ] Responsive design works

---

## Common Issues & Solutions

### Issue: "Cannot connect to backend"
- **Solution**: Check backend is running on port 3001
- **Check**: `http://localhost:3001/health` (if health endpoint exists)

### Issue: "CORS error"
- **Solution**: Backend CORS should allow `http://localhost:3000`
- **Check**: `backend/src/dev-server.ts` has CORS configured

### Issue: "401 Unauthorized"
- **Solution**: Check token in localStorage, try logging in again
- **Check**: Backend auth middleware working

### Issue: "Validation errors not showing"
- **Solution**: Check browser console for errors
- **Check**: Form validation logic in component

### Issue: "Pagination not working"
- **Solution**: Check backend returns correct limit/offset
- **Check**: Frontend pagination state management

---

## Test Data Setup

### Create Test Bookings
Use the booking creation form or insert directly into database:

```sql
-- Get user IDs first
SELECT id, email, role FROM users;

-- Create test booking (replace UUIDs with actual user IDs)
INSERT INTO bookings (
  id, student_id, instructor_id, departure_airport, arrival_airport,
  departure_latitude, departure_longitude, arrival_latitude, arrival_longitude,
  scheduled_datetime, status, training_level, duration_minutes
) VALUES (
  gen_random_uuid(),
  'student-uuid-here',
  'instructor-uuid-here',
  'KJFK', 'KBOS',
  40.6413, -73.7781, 42.3656, -71.0096,
  NOW() + INTERVAL '2 days',
  'CONFIRMED',
  'PRIVATE_PILOT',
  60
);
```

### Create Test Availability
Use the availability calendar UI or insert directly:

```sql
-- Create recurring pattern (replace user_id)
INSERT INTO availability_patterns (
  user_id, day_of_week, start_time, end_time, is_active
) VALUES (
  'user-uuid-here',
  1, -- Monday
  '09:00:00',
  '17:00:00',
  true
);
```

---

## Performance Testing

While testing, also check:

1. **Page Load Time**
   - Dashboard: Should load in <10 seconds
   - Booking list: Should load in <5 seconds
   - Booking details: Should load in <3 seconds

2. **API Response Time**
   - Open browser DevTools → Network tab
   - Check API call durations
   - Should be <500ms for most calls

3. **Bundle Size**
   - Check Network tab for JS bundle sizes
   - Should be <1MB per chunk (after code splitting)

4. **Cache Hit Rate**
   - Check if static assets (JS, CSS) are cached
   - Subsequent page loads should be faster

---

## Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

---

## Next Steps After Testing

1. **Document Issues**: Note any bugs or UX issues
2. **Performance Notes**: Record any slow operations
3. **Feature Requests**: Note any missing features
4. **UI Improvements**: Suggest UI/UX enhancements

---

**Happy Testing! 🚀**


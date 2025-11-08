# Quick Frontend Testing Guide
## Step-by-Step Testing Checklist

---

## 🚀 Setup (One-Time)

0. **Setup Database** (First Time Only)
   - PostgreSQL must be installed and running
   - **See**: `docs/DATABASE_SETUP_WINDOWS.md` for complete instructions
   - Quick commands:
     ```powershell
     # Create database
     $env:PGPASSWORD = "your_password"
     & "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres flight_schedule_pro
     
     # Run migrations (see DATABASE_SETUP_WINDOWS.md for full list)
     & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d flight_schedule_pro -f database\migrations\001_create_users_table.sql
     # ... (run all migrations in order)
     ```

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   # Should see: "Server running on http://localhost:3001"
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   # Should see: "Local: http://localhost:3000"
   ```

3. **Verify Backend Health**
   - Open: `http://localhost:3001/health`
   - Should return: `{"status":"healthy",...}`

---

## ✅ Quick Test Flows (15 minutes)

### Test 1: Authentication (2 min)
- [ ] Go to `http://localhost:3000/register`
- [ ] Register new user (email, password, name, role=STUDENT)
- [ ] Should redirect to login or dashboard
- [ ] Login with credentials
- [ ] Should see dashboard

### Test 2: Dashboard (1 min)
- [ ] Dashboard loads with metrics
- [ ] Click "Schedule New Flight" → goes to `/bookings/new`
- [ ] Click "View All Bookings" → goes to `/bookings`
- [ ] Click "Manage Availability" → goes to `/availability`

### Test 3: Create Booking (3 min)
- [ ] Go to `/bookings/new`
- [ ] Fill form:
  - Student ID: (get from database or use existing UUID)
  - Instructor ID: (get from database or use existing UUID)
  - Departure: `KJFK` (New York)
  - Arrival: `KBOS` (Boston)
  - Date: Tomorrow, 10:00 AM
  - Training Level: `PRIVATE_PILOT`
  - Duration: `60`
- [ ] Click "Schedule Flight"
- [ ] Should see success → redirect to booking details

### Test 4: View Bookings (2 min)
- [ ] Go to `/bookings`
- [ ] See list of bookings in table
- [ ] Test filters:
  - Change Status filter → results update
  - Change Training Level → results update
- [ ] If >20 bookings, test pagination:
  - Click "Next" → next page loads
  - Click "Previous" → previous page loads

### Test 5: Booking Details (1 min)
- [ ] Click "View" on any booking
- [ ] See full booking details
- [ ] Check all information displays correctly

### Test 6: Availability - Recurring (3 min)
- [ ] Go to `/availability`
- [ ] Click "Recurring Availability" tab
- [ ] Click "Add Pattern" (or similar)
- [ ] Fill:
  - Day: Monday
  - Start: `09:00`
  - End: `17:00`
- [ ] Save
- [ ] Pattern appears in list

### Test 7: Availability - Override (2 min)
- [ ] Click "One-Time Overrides" tab
- [ ] Click "Add Override"
- [ ] Fill:
  - Date: Tomorrow
  - Start: `08:00`
  - End: `12:00`
- [ ] Save
- [ ] Override appears in list

### Test 8: Settings (1 min)
- [ ] Go to `/settings`
- [ ] See settings page
- [ ] Try updating profile (if form exists)
- [ ] Save changes

---

## 🔍 Detailed Test Scenarios

### Scenario A: Complete Booking Flow
1. Register/Login as Student
2. Create a new booking
3. View booking in list
4. Open booking details
5. Verify all data correct

### Scenario B: Availability Management
1. Login as Instructor
2. Create recurring availability (Monday-Friday, 9-5)
3. Create one-time override (block next Tuesday)
4. View calendar (if available)
5. Verify patterns and overrides display correctly

### Scenario C: Rescheduling Flow (if implemented)
1. Find booking with `AT_RISK` status
2. Click "Reschedule" or "Generate Options"
3. Wait for AI to generate 3 options
4. View options with weather/availability status
5. Rank preferences (drag-drop or select)
6. Submit preferences
7. See deadline countdown
8. Confirm reschedule (if both parties submitted)

### Scenario D: Error Handling
1. Stop backend server
2. Try to create booking
3. Should see error message (not crash)
4. Restart backend
5. Retry → should work

---

## 🐛 Common Issues to Check

### Issue: "Cannot connect to backend"
**Fix**: 
- Check backend is running: `http://localhost:3001/health`
- Check frontend `.env` has: `VITE_API_BASE_URL=http://localhost:3001`

### Issue: "CORS error"
**Fix**: 
- Backend CORS should allow `http://localhost:3000`
- Check `backend/src/dev-server.ts` line 32-37

### Issue: "401 Unauthorized"
**Fix**: 
- Token might be expired
- Try logging in again
- Check browser console for auth errors

### Issue: "Validation errors"
**Fix**: 
- Check form validation messages
- Ensure all required fields filled
- Check date is in future
- Check UUIDs are valid format

---

## 📝 Test Data Quick Reference

### Get User IDs from Database
```sql
SELECT id, email, role FROM users;
```

### Create Test Booking (SQL)
```sql
-- Replace UUIDs with actual user IDs from above
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

### Common Airport Codes
- `KJFK` - New York JFK
- `KBOS` - Boston
- `KLAX` - Los Angeles
- `KORD` - Chicago O'Hare
- `KDFW` - Dallas Fort Worth
- `KATL` - Atlanta

---

## 🎯 What to Look For

### ✅ Good Signs
- Pages load quickly (<5 seconds)
- Forms validate before submit
- Error messages are clear
- Loading spinners appear
- Navigation works smoothly
- Data persists after refresh

### ⚠️ Issues to Report
- Pages take >10 seconds to load
- Forms submit invalid data
- Error messages are unclear
- Navigation breaks
- Data doesn't save
- Console errors (check DevTools)

---

## 📊 Performance Checks

While testing, open **Browser DevTools** (F12):

1. **Network Tab**
   - Check API call durations
   - Should be <500ms for most calls
   - Check bundle sizes (<1MB per chunk)

2. **Console Tab**
   - Should have minimal errors
   - Check for warnings

3. **Performance Tab**
   - Record page load
   - Check for slow operations

---

## 🎨 UI/UX Checks

- [ ] Buttons are clickable and responsive
- [ ] Forms are easy to fill
- [ ] Error messages are helpful
- [ ] Loading states are clear
- [ ] Empty states show helpful messages
- [ ] Mobile view works (resize browser)
- [ ] Navigation is intuitive

---

## 📋 Test Results Template

```
Date: ___________
Tester: ___________

✅ Working:
- [List what works well]

❌ Issues Found:
- [List bugs/issues]

💡 Suggestions:
- [List improvements]

Performance Notes:
- Dashboard load: ___ seconds
- Booking list load: ___ seconds
- API response avg: ___ ms
```

---

**Ready to test? Start with Test 1 and work through the list! 🚀**


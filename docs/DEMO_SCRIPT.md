# Demo Video Script

## Overview

This script guides the creation of a comprehensive demo video showcasing Flight Schedule Pro's key features, including edge cases and the flagship automatic AI rescheduling feature.

**Target Duration:** 10-15 minutes  
**Audience:** Stakeholders, potential users, technical reviewers

---

## Scene 1: Introduction (30 seconds)

**Visual:** Dashboard overview

**Narration:**
> "Welcome to Flight Schedule Pro, an intelligent system that automatically monitors weather conditions for flight training lessons and uses AI to reschedule affected flights. Today, I'll demonstrate how the system works from booking creation through automatic rescheduling."

**Actions:**
- Show dashboard with metrics
- Highlight key features visually

---

## Scene 2: User Registration & Login (1 minute)

**Visual:** Registration and login flow

**Narration:**
> "First, let's create accounts for a student and an instructor. The system uses AWS Cognito for secure authentication with role-based access control."

**Actions:**
1. Register as Student Pilot
   - Email: student@demo.com
   - Role: STUDENT
   - Training Level: STUDENT_PILOT
2. Register as Instructor
   - Email: instructor@demo.com
   - Role: INSTRUCTOR
3. Login as student
4. Show dashboard

**Key Points:**
- Secure authentication
- Role-based access
- Training level selection

---

## Scene 3: Availability Calendar Setup (2 minutes)

**Visual:** Availability calendar management

**Narration:**
> "Both students and instructors manage their weekly availability using the built-in calendar system. This availability is used by the AI to find suitable rescheduling options."

**Actions:**
1. Login as Instructor
2. Go to Availability page
3. Create recurring pattern:
   - Monday-Friday: 9:00 AM - 5:00 PM
4. Create one-time override:
   - Block December 25 (Holiday)
5. Show calendar view with patterns
6. Login as Student
7. Create student availability:
   - Monday, Wednesday, Friday: 10:00 AM - 3:00 PM

**Key Points:**
- Recurring weekly patterns
- One-time overrides
- Visual calendar display
- Real-time sync

---

## Scene 4: Booking Creation (1.5 minutes)

**Visual:** Create booking form

**Narration:**
> "Now let's create a flight booking. The system automatically validates weather conditions when creating a booking and sets the status to AT_RISK if weather is invalid."

**Actions:**
1. Login as Student
2. Go to Bookings → Create Booking
3. Fill form:
   - Instructor: Select instructor
   - Departure: KJFK (New York)
   - Arrival: KLAX (Los Angeles)
   - Date/Time: November 12, 2025, 3:23 PM
   - Training Level: STUDENT_PILOT
   - Duration: 60 minutes
4. Submit booking
5. Show booking in list (status: CONFIRMED or AT_RISK)

**Key Points:**
- Automatic weather validation
- Status reflects weather conditions
- Form validation

---

## Scene 5: Weather Monitoring & Automatic Detection (2 minutes)

**Visual:** Weather monitoring in action

**Narration:**
> "The system monitors weather every 10 minutes for all upcoming flights. When a weather conflict is detected, the booking status automatically changes to AT_RISK, and if conditions are critical or persist, the system automatically generates AI rescheduling options."

**Actions:**
1. Show booking with CONFIRMED status
2. Explain: "The weather monitor runs every 10 minutes"
3. Simulate weather conflict (or wait for actual conflict)
4. Show booking status change to AT_RISK
5. **Highlight:** Automatic AI rescheduling trigger
6. Show booking status change to RESCHEDULING
7. Show notification: "Rescheduling options available"

**Key Points:**
- Automated 10-minute monitoring
- Automatic status updates
- **Automatic AI rescheduling** (flagship feature)
- Real-time notifications

---

## Scene 6: AI Rescheduling Options (2 minutes)

**Visual:** Reschedule options page

**Narration:**
> "The AI has automatically generated 3 optimal rescheduling options. Each option has been validated for weather at all 5 locations, checked against both calendars for availability, and ranked by confidence score."

**Actions:**
1. Click notification or go to Reschedule page
2. Show 3 AI-generated options:
   - Option 1: High confidence, excellent weather
   - Option 2: Medium confidence, good weather
   - Option 3: Lower confidence, fair weather
3. Show details for each:
   - Date and time
   - Weather score
   - Confidence score
   - Reasoning
4. Explain: "All options are conflict-free and weather-validated"

**Key Points:**
- 3 options always generated
- Weather validated at 5 locations
- Availability checked
- Confidence scoring

---

## Scene 7: Preference Ranking (2 minutes)

**Visual:** Preference ranking interface

**Narration:**
> "Both the student and instructor rank these options by preference. The instructor's highest-ranked available option will be used for the final selection."

**Actions:**
1. Show Preference Ranking page
2. Show deadline countdown timer
3. Drag options to rank:
   - 1st choice: Option 1
   - 2nd choice: Option 2
   - 3rd choice: Option 3
4. Mark one option as unavailable (if needed)
5. Submit preferences
6. Show: "Waiting for instructor preferences"
7. Login as Instructor
8. Show instructor ranking (different order)
9. Submit instructor preferences

**Key Points:**
- Drag-and-drop interface
- Deadline enforcement
- Instructor priority
- Both parties must submit

---

## Scene 8: Confirmation & Weather Re-validation (1.5 minutes)

**Visual:** Confirmation screen

**Narration:**
> "When both preferences are submitted, the system resolves using instructor priority, then re-validates weather conditions immediately before confirming. This ensures conditions haven't changed since options were generated."

**Actions:**
1. Show confirmation screen
2. Display:
   - Original time: November 12, 3:23 PM
   - New time: November 13, 2:00 PM (instructor's #1 choice)
   - Route: KJFK → KLAX
3. Click "Confirm Reschedule"
4. Show: "Validating Weather..."
5. Show success: "Reschedule confirmed"
6. Show booking updated with new time
7. Show confirmation notifications

**Key Points:**
- Instructor priority resolution
- Real-time weather re-validation
- Booking automatically updated
- Notifications sent

---

## Scene 9: Edge Cases (2 minutes)

**Visual:** Various edge case scenarios

**Narration:**
> "Let's explore some edge cases to demonstrate the system's robustness."

**Edge Case 1: Weather Re-validation Fails**
1. Show option selected
2. Attempt confirmation
3. Show error: "Weather conditions no longer suitable"
4. Show: "Generate New Options" button
5. Generate new options

**Edge Case 2: Deadline Passes**
1. Show booking with deadline approaching
2. Wait for deadline to pass (or simulate)
3. Show: "Deadline has passed"
4. Show escalation notification
5. Login as Admin
6. Show manual escalation option

**Edge Case 3: All Options Unavailable**
1. Show instructor marking all options unavailable
2. Show: "Generate New Options" automatically triggered
3. Show new set of options

**Key Points:**
- Graceful error handling
- Automatic recovery
- Manual escalation support

---

## Scene 10: Calendar Integration (1 minute)

**Visual:** Availability calendar with bookings

**Narration:**
> "The availability calendar shows both availability patterns and booked flights. Bookings appear as blocked slots in red, making it easy to see when you're already scheduled."

**Actions:**
1. Go to Availability page
2. Show calendar with:
   - Green slots: Available
   - Red slots: Booked flights
3. Show booking details on hover/click
4. Explain: "Students and instructors both see their bookings on the calendar"

**Key Points:**
- Visual calendar integration
- Bookings shown as blocked
- Flight details displayed

---

## Scene 11: Dashboard & Metrics (1 minute)

**Visual:** Dashboard overview

**Narration:**
> "The dashboard provides real-time visibility into system health, weather conflicts, and booking status."

**Actions:**
1. Show dashboard metrics:
   - Total bookings
   - At-risk bookings
   - Successful reschedules
   - Active patterns
2. Show weather alerts
3. Show upcoming flights
4. Explain auto-refresh (every 5 minutes)

**Key Points:**
- Real-time metrics
- Weather alerts
- Flight status tracking

---

## Scene 12: Manual Rescheduling (1 minute)

**Visual:** Manual reschedule option

**Narration:**
> "Instructors and admins can also manually trigger rescheduling at any time, not just when weather conflicts are detected."

**Actions:**
1. Go to booking details
2. Click "Reschedule Flight" button
3. Show manual reschedule flow
4. Generate options manually
5. Complete reschedule

**Key Points:**
- Manual rescheduling available
- Same AI engine used
- Available to instructors and admins

---

## Scene 13: Summary & Closing (30 seconds)

**Visual:** System overview

**Narration:**
> "Flight Schedule Pro automatically monitors weather, detects conflicts, and uses AI to generate optimal rescheduling options. The system ensures zero schedule conflicts and validates weather at all locations. Thank you for watching!"

**Key Highlights:**
- ✅ Automatic weather monitoring (10-minute cycles)
- ✅ Automatic AI rescheduling (flagship feature)
- ✅ Zero-conflict guarantee
- ✅ Multi-location weather validation
- ✅ Instructor priority resolution
- ✅ Real-time notifications
- ✅ Manual rescheduling option

---

## Production Notes

### Recording Setup
- **Screen Resolution:** 1920x1080
- **Frame Rate:** 30 FPS
- **Audio:** Clear narration, no background noise
- **Browser:** Chrome (latest version)
- **Zoom:** 125% for better visibility

### Data Preparation
- Create test accounts (student, instructor, admin)
- Set up availability patterns
- Create bookings with various statuses
- Prepare weather conflict scenarios (or simulate)

### Editing Tips
- Add text overlays for key points
- Highlight important UI elements
- Add transitions between scenes
- Include timestamps for key moments
- Add background music (optional, low volume)

### Post-Production
- Add title screen with logo
- Add chapter markers
- Add captions/subtitles
- Export in multiple formats (MP4, WebM)
- Upload to YouTube/Vimeo

---

## Script Timing Breakdown

| Scene | Duration | Description |
|-------|----------|-------------|
| 1. Introduction | 0:30 | Overview |
| 2. Registration | 1:00 | User accounts |
| 3. Availability | 2:00 | Calendar setup |
| 4. Booking | 1:30 | Create booking |
| 5. Weather Monitoring | 2:00 | **Automatic detection & rescheduling** |
| 6. AI Options | 2:00 | View options |
| 7. Preferences | 2:00 | Rank options |
| 8. Confirmation | 1:30 | Confirm reschedule |
| 9. Edge Cases | 2:00 | Error handling |
| 10. Calendar | 1:00 | Integration |
| 11. Dashboard | 1:00 | Metrics |
| 12. Manual | 1:00 | Manual reschedule |
| 13. Summary | 0:30 | Closing |
| **Total** | **18:00** | **Full demo** |

**Note:** Actual recording may vary. Target 10-15 minutes for final edited version.

---

**Last Updated:** November 2024  
**Version:** 1.0.0


# User Guide - Availability Calendar

## Overview

The Availability Calendar allows instructors and students to manage their weekly availability patterns and one-time overrides. This availability is used by the AI rescheduling system to find suitable alternative time slots.

---

## Getting Started

### Accessing the Calendar

1. Log in to Flight Schedule Pro
2. Navigate to **Availability** in the main menu
3. You'll see three tabs:
   - **Calendar View** - Visual calendar showing availability
   - **Weekly Patterns** - Manage recurring availability
   - **Overrides** - Manage one-time availability changes

---

## Weekly Patterns

### Creating a Recurring Pattern

**Step 1:** Go to the **Weekly Patterns** tab

**Step 2:** Click **"Add Pattern"**

**Step 3:** Fill in the form:
- **Day of Week:** Select the day (Sunday = 0, Monday = 1, ..., Saturday = 6)
- **Start Time:** Enter start time (e.g., "09:00" for 9:00 AM)
- **End Time:** Enter end time (e.g., "17:00" for 5:00 PM)

**Step 4:** Click **"Save Pattern"**

**Example:**
- Monday through Friday: 9:00 AM - 5:00 PM
- Create 5 separate patterns (one for each day)

### Editing a Pattern

1. Find the pattern in the list
2. Click **"Edit"**
3. Modify the times
4. Click **"Save"**

### Deactivating a Pattern

1. Find the pattern in the list
2. Toggle the **"Active"** switch to OFF
3. Pattern remains in database but won't be used for availability

### Deleting a Pattern

1. Find the pattern in the list
2. Click **"Delete"**
3. Confirm deletion

**Note:** Deleting a pattern permanently removes it. Consider deactivating instead if you might need it later.

---

## One-Time Overrides

### Blocking Availability

**Use Case:** You're not available on a specific date (e.g., holiday, vacation)

**Steps:**
1. Go to the **Overrides** tab
2. Click **"Add Override"**
3. Fill in the form:
   - **Date:** Select the date
   - **Block Entire Day:** Check this box (or specify times)
   - **Reason:** Enter reason (e.g., "Holiday", "Vacation")
4. Click **"Save Override"**

**Example:**
- Date: December 25, 2025
- Block Entire Day: Yes
- Reason: "Christmas Holiday"

### Adding Availability

**Use Case:** You're available outside your normal hours (e.g., weekend availability)

**Steps:**
1. Go to the **Overrides** tab
2. Click **"Add Override"**
3. Fill in the form:
   - **Date:** Select the date
   - **Start Time:** Enter start time
   - **End Time:** Enter end time
   - **Block Entire Day:** Leave unchecked
   - **Reason:** Enter reason (e.g., "Weekend availability")
4. Click **"Save Override"**

**Example:**
- Date: November 15, 2025
- Start Time: 10:00
- End Time: 14:00
- Reason: "Weekend availability"

### Editing an Override

1. Find the override in the list
2. Click **"Edit"**
3. Modify the details
4. Click **"Save"**

### Deleting an Override

1. Find the override in the list
2. Click **"Delete"**
3. Confirm deletion

---

## Calendar View

### Understanding the Calendar

The **Calendar View** shows:
- **Green slots:** Available time
- **Red slots:** Booked flights (blocked)
- **Gray slots:** Not available (no pattern or blocked)

### Viewing Availability

1. Go to the **Calendar View** tab
2. Use the navigation arrows to move between months
3. Click on a date to see details
4. Hover over slots to see time ranges

### Date Range

- Calendar shows current month by default
- Use navigation to view other months
- Availability is computed for the visible date range

---

## Best Practices

### Setting Up Weekly Patterns

1. **Be Specific:** Set exact times you're available
2. **Include Buffer Time:** Add 30 minutes before/after for preparation
3. **Update Regularly:** Keep patterns current
4. **Use Overrides:** Don't delete patterns for temporary changes

### Managing Overrides

1. **Plan Ahead:** Add holiday blocks in advance
2. **Be Descriptive:** Use clear reasons for overrides
3. **Remove When Done:** Delete overrides after they've passed
4. **Check Conflicts:** Ensure overrides don't conflict with bookings

### Calendar Maintenance

1. **Review Monthly:** Check calendar at start of each month
2. **Update Patterns:** Adjust patterns as schedule changes
3. **Clean Up:** Remove old overrides
4. **Verify Accuracy:** Check calendar view matches your actual availability

---

## Common Scenarios

### Scenario 1: Standard Work Week

**Goal:** Available Monday-Friday, 9 AM - 5 PM

**Steps:**
1. Create 5 weekly patterns:
   - Monday: 09:00 - 17:00
   - Tuesday: 09:00 - 17:00
   - Wednesday: 09:00 - 17:00
   - Thursday: 09:00 - 17:00
   - Friday: 09:00 - 17:00

### Scenario 2: Holiday Block

**Goal:** Block December 25 (Christmas)

**Steps:**
1. Go to Overrides tab
2. Add override:
   - Date: December 25, 2025
   - Block Entire Day: Yes
   - Reason: "Christmas Holiday"

### Scenario 3: Temporary Schedule Change

**Goal:** Available on Saturday this week only

**Steps:**
1. Go to Overrides tab
2. Add override:
   - Date: November 15, 2025
   - Start Time: 10:00
   - End Time: 14:00
   - Reason: "Weekend availability this week"

### Scenario 4: Vacation Block

**Goal:** Block entire week for vacation

**Steps:**
1. Go to Overrides tab
2. Add overrides for each day:
   - November 20: Block entire day, Reason: "Vacation"
   - November 21: Block entire day, Reason: "Vacation"
   - November 22: Block entire day, Reason: "Vacation"
   - (Repeat for each day)

---

## Troubleshooting

### Pattern Not Showing on Calendar

**Possible Causes:**
1. Pattern is inactive (check Active toggle)
2. Pattern is outside visible date range
3. Override is blocking the time

**Solution:**
1. Check pattern is active
2. Navigate to correct month
3. Check for conflicting overrides

### Override Not Working

**Possible Causes:**
1. Override date is in the past
2. Override conflicts with booking
3. Time format incorrect

**Solution:**
1. Verify override date is correct
2. Check for existing bookings
3. Use 24-hour format (HH:MM)

### Calendar Shows Wrong Availability

**Possible Causes:**
1. Patterns not saved correctly
2. Overrides conflicting
3. Timezone issues

**Solution:**
1. Verify patterns in Weekly Patterns tab
2. Check overrides in Overrides tab
3. Ensure times are in correct timezone

---

## Tips & Tricks

### Quick Pattern Creation

- Create patterns for common schedules first
- Copy patterns for similar days
- Use consistent time formats

### Efficient Override Management

- Create holiday blocks at start of year
- Use descriptive reasons for easy identification
- Group related overrides (e.g., vacation week)

### Calendar Navigation

- Use keyboard arrows to navigate months
- Click today's date to jump to current month
- Use date picker for specific dates

---

## Integration with Bookings

### How Availability Affects Bookings

- **Booking Creation:** System checks availability before confirming
- **AI Rescheduling:** System uses availability to find alternative times
- **Calendar Display:** Bookings appear as blocked slots (red)

### Viewing Bookings on Calendar

- Bookings automatically appear on calendar
- Red slots indicate booked time
- Hover/click to see booking details

---

## Support

### Getting Help

- **Documentation:** See `docs/` directory
- **Troubleshooting:** See `docs/TROUBLESHOOTING.md`
- **API Reference:** See `docs/API.md`

### Reporting Issues

- Check browser console for errors
- Verify you're using latest browser version
- Clear browser cache if issues persist

---

**Last Updated:** November 2024  
**Version:** 1.0.0


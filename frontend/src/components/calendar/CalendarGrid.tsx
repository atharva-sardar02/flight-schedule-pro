/**
 * CalendarGrid Component
 * Visual calendar displaying availability slots
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AvailabilitySlot } from '../../types/availability';
import { Booking } from '../../types/booking';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { format } from 'date-fns';

interface CalendarGridProps {
  slots: AvailabilitySlot[];
  startDate: Date;
  endDate: Date;
  bookings?: Booking[];
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ slots, startDate, endDate, bookings = [] }) => {
  const navigate = useNavigate();
  // Generate all dates in range
  const generateDateRange = (): Date[] => {
    const dates: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const dates = generateDateRange();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper to format date in local timezone (YYYY-MM-DD)
  const formatDateLocal = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const dateKey = formatDateLocal(slot.date);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  // Convert bookings to blocked slots and group by date
  // Store booking ID mapping for navigation
  const bookingIdBySlotKey: Record<string, string> = {};
  
  const bookingSlotsByDate = bookings.reduce((acc, booking) => {
    try {
      const bookingDate = new Date(booking.scheduledDatetime);
      if (isNaN(bookingDate.getTime())) {
        console.warn('Invalid booking date:', booking.scheduledDatetime, booking.id);
        return acc;
      }
      // Use local date formatting to avoid timezone issues
      const dateKey = formatDateLocal(bookingDate);
      
      // Calculate end time from duration
      const endTime = new Date(bookingDate);
      endTime.setMinutes(endTime.getMinutes() + (booking.durationMinutes || 60));
      
      // Format time as HH:MM
      const formatTime = (date: Date): string => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };
      
      const startTimeStr = formatTime(bookingDate);
      const endTimeStr = formatTime(endTime);
      
      // Create a blocked slot for this booking
      const bookingSlot: AvailabilitySlot = {
        date: dateKey,
        startTime: startTimeStr,
        endTime: endTimeStr,
        isAvailable: false,
        source: 'override', // Use override source to indicate it's from a booking
        reason: `${booking.departureAirport} → ${booking.arrivalAirport}`,
      };
      
      // Store booking ID for this slot (use date + time as key)
      const slotKey = `${dateKey}-${startTimeStr}-${endTimeStr}`;
      bookingIdBySlotKey[slotKey] = booking.id;
      
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(bookingSlot);
    } catch (error) {
      console.error('Error processing booking for calendar:', booking.id, error);
    }
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  // Merge availability slots with booking slots (bookings take precedence as blocked)
  const allSlotsByDate: Record<string, AvailabilitySlot[]> = {};
  
  // First, add all availability slots
  Object.keys(slotsByDate).forEach(dateKey => {
    allSlotsByDate[dateKey] = [...slotsByDate[dateKey]];
  });
  
  // Then, add booking slots (these will show as blocked)
  Object.keys(bookingSlotsByDate).forEach(dateKey => {
    if (!allSlotsByDate[dateKey]) {
      allSlotsByDate[dateKey] = [];
    }
    // Add booking slots - they represent blocked times
    allSlotsByDate[dateKey].push(...bookingSlotsByDate[dateKey]);
  });

  const formatDate = (date: Date) => {
    return formatDateLocal(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Organize dates by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  const firstDayOfWeek = dates[0].getDay();

  // Add empty slots for alignment
  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyDate = new Date(dates[0]);
    emptyDate.setDate(emptyDate.getDate() - (firstDayOfWeek - i));
    currentWeek.push(emptyDate);
  }

  dates.forEach((date) => {
    currentWeek.push(date);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Add remaining days to last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      const lastDate = currentWeek[currentWeek.length - 1];
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 1);
      currentWeek.push(nextDate);
    }
    weeks.push(currentWeek);
  }

  // Get month name for display
  const currentMonth = format(startDate, 'MMMM yyyy');
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Availability Calendar</CardTitle>
          <div className="text-lg font-semibold text-gray-700">
            {currentMonth}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} className="text-center font-semibold p-2 text-sm">
              {day}
            </div>
          ))}

          {/* Calendar cells */}
          {weeks.map((week, weekIndex) =>
            week.map((date, dayIndex) => {
              const dateKey = formatDate(date);
              const daySlots = allSlotsByDate[dateKey] || [];
              const isInRange = date >= startDate && date <= endDate;
              const availableSlots = daySlots.filter((slot) => slot.isAvailable);
              const blockedSlots = daySlots.filter((slot) => !slot.isAvailable);

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`
                    min-h-[100px] p-2 border rounded-lg
                    ${!isInRange ? 'bg-gray-50 text-gray-400' : ''}
                    ${isToday(date) ? 'ring-2 ring-blue-500' : ''}
                    ${isInRange && availableSlots.length > 0 && blockedSlots.length === 0 ? 'bg-green-50' : ''}
                    ${isInRange && availableSlots.length === 0 && daySlots.length === 0 ? 'bg-gray-50' : ''}
                    ${isInRange && blockedSlots.length > 0 ? 'bg-red-50 border-red-200' : ''}
                    ${isInRange && availableSlots.length > 0 && blockedSlots.length > 0 ? 'bg-yellow-50 border-yellow-200' : ''}
                  `}
                >
                  <div className="text-sm font-semibold mb-2">{date.getDate()}</div>
                  
                  {/* Show slots if there are any, prioritizing blocked slots */}
                  {isInRange && (daySlots.length > 0 || blockedSlots.length > 0) && (
                    <div className="space-y-1">
                      {/* Show blocked slots first, then available slots */}
                      {[...blockedSlots, ...availableSlots].slice(0, 3).map((slot, idx) => {
                        // Check if this is a booking slot (blocked)
                        const slotKey = `${dateKey}-${slot.startTime}-${slot.endTime}`;
                        const bookingId = bookingIdBySlotKey[slotKey];
                        const isBooking = !slot.isAvailable && bookingId;
                        
                        const slotContent = (
                          <>
                            <div className="font-mono text-[10px]">
                              {slot.startTime} - {slot.endTime}
                            </div>
                            {slot.reason && (
                              <div className="truncate font-semibold" title={slot.reason}>
                                {slot.reason}
                              </div>
                            )}
                          </>
                        );
                        
                        if (isBooking) {
                          return (
                            <div
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/bookings/${bookingId}`);
                              }}
                              className={`text-xs p-1 rounded cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                                slot.isAvailable ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                              title="Click to view booking details"
                            >
                              {slotContent}
                            </div>
                          );
                        }
                        
                        return (
                          <div
                            key={idx}
                            className={`text-xs p-1 rounded ${
                              slot.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {slotContent}
                          </div>
                        );
                      })}
                      {(blockedSlots.length + availableSlots.length) > 3 && (
                        <div className="text-xs text-gray-500">
                          +{(blockedSlots.length + availableSlots.length) - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-6 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
            <span>No Pattern Set</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


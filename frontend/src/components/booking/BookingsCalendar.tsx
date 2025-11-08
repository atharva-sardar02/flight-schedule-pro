/**
 * BookingsCalendar Component
 * Displays bookings on a calendar grid
 */

import React from 'react';
import { Booking } from '../../types/booking';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface BookingsCalendarProps {
  bookings: Booking[];
  startDate: Date;
  endDate: Date;
  onBookingClick?: (booking: Booking) => void;
}

export const BookingsCalendar: React.FC<BookingsCalendarProps> = ({
  bookings,
  startDate,
  endDate,
  onBookingClick,
}) => {

  // Format date as YYYY-MM-DD, handling timezone correctly
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Normalize dates to midnight for comparison (remove time component)
  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

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

  // Group bookings by date
  const bookingsByDate = bookings.reduce((acc, booking) => {
    try {
      const bookingDate = new Date(booking.scheduledDatetime);
      if (isNaN(bookingDate.getTime())) {
        console.warn('Invalid booking date:', booking.scheduledDatetime, booking.id);
        return acc;
      }
      // Use formatDate to ensure consistent date formatting
      const dateKey = formatDate(bookingDate);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(booking);
      console.log(`BookingsCalendar - Added booking ${booking.id} to date ${dateKey} (from ${booking.scheduledDatetime})`);
    } catch (error) {
      console.error('Error processing booking date:', booking.id, error);
    }
    return acc;
  }, {} as Record<string, Booking[]>);
  
  // Debug: Log bookings and date range
  console.log('=== BookingsCalendar Debug ===');
  console.log('Total bookings received:', bookings.length);
  console.log('Date range:', formatDate(startDate), 'to', formatDate(endDate));
  console.log('Bookings by date keys:', Object.keys(bookingsByDate));
  
  if (bookings.length > 0) {
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.scheduledDatetime);
      const formattedDate = formatDate(bookingDate);
      console.log(`Booking ${booking.id}:`, {
        scheduledDatetime: booking.scheduledDatetime,
        formattedDate: formattedDate,
        departureAirport: booking.departureAirport,
        arrivalAirport: booking.arrivalAirport,
        inDateRange: formattedDate >= formatDate(startDate) && formattedDate <= formatDate(endDate)
      });
    });
  } else {
    console.warn('No bookings passed to calendar component!');
  }
  console.log('=== End Debug ===');

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'AT_RISK':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'RESCHEDULING':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings Calendar</CardTitle>
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
              const dayBookings = bookingsByDate[dateKey] || [];
              // Normalize dates for comparison (ignore time component)
              const normalizedDate = normalizeDate(date);
              const normalizedStart = normalizeDate(startDate);
              const normalizedEnd = normalizeDate(endDate);
              const isInRange = normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
              
              // Debug: Log if we have bookings for this date
              if (dayBookings.length > 0) {
                console.log(`✓ Rendering ${dayBookings.length} booking(s) for ${dateKey}`, {
                  date: date.toISOString(),
                  inRange: isInRange,
                  bookings: dayBookings.map(b => `${b.departureAirport}→${b.arrivalAirport}`)
                });
              }
              
              // Debug: Log November 12 specifically
              if (date.getMonth() === 10 && date.getDate() === 12 && date.getFullYear() === 2025) {
                console.log(`🔍 November 12, 2025 cell:`, {
                  dateKey,
                  dayBookings: dayBookings.length,
                  bookingsByDateKeys: Object.keys(bookingsByDate),
                  isInRange,
                  normalizedDate: normalizedDate.toISOString(),
                  normalizedStart: normalizedStart.toISOString(),
                  normalizedEnd: normalizedEnd.toISOString()
                });
              }

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`
                    min-h-[100px] p-2 border rounded-lg
                    ${!isInRange ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                    ${isToday(date) ? 'ring-2 ring-blue-500' : ''}
                    ${isInRange && dayBookings.length > 0 ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="text-sm font-semibold mb-2">{date.getDate()}</div>
                  
                  {isInRange && dayBookings.length > 0 && (
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => (
                        <div
                          key={booking.id}
                          onClick={() => onBookingClick?.(booking)}
                          className={`
                            text-xs p-1 rounded border cursor-pointer hover:opacity-80
                            ${getStatusColor(booking.status)}
                          `}
                          title={`${booking.departureAirport} → ${booking.arrivalAirport} - ${formatTime(booking.scheduledDatetime)}`}
                        >
                          <div className="font-semibold truncate">
                            {booking.departureAirport} → {booking.arrivalAirport}
                          </div>
                          <div className="font-mono text-[10px]">
                            {formatTime(booking.scheduledDatetime)}
                          </div>
                          <div className="text-[10px] opacity-75">
                            {booking.status.replace('_', ' ')}
                          </div>
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayBookings.length - 3} more
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
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></div>
            <span>At Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
            <span>Rescheduling</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
            <span>Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-blue-500"></div>
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


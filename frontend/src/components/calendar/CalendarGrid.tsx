/**
 * CalendarGrid Component
 * Visual calendar displaying availability slots
 */

import React from 'react';
import { AvailabilitySlot } from '../../types/availability';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface CalendarGridProps {
  slots: AvailabilitySlot[];
  startDate: Date;
  endDate: Date;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ slots, startDate, endDate }) => {
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

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const dateKey = new Date(slot.date).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Calendar</CardTitle>
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
              const daySlots = slotsByDate[dateKey] || [];
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
                    ${isInRange && availableSlots.length > 0 ? 'bg-green-50' : ''}
                    ${isInRange && availableSlots.length === 0 && daySlots.length === 0 ? 'bg-gray-50' : ''}
                    ${isInRange && blockedSlots.length > 0 && availableSlots.length === 0 ? 'bg-red-50' : ''}
                  `}
                >
                  <div className="text-sm font-semibold mb-2">{date.getDate()}</div>
                  
                  {isInRange && daySlots.length > 0 && (
                    <div className="space-y-1">
                      {daySlots.slice(0, 3).map((slot, idx) => (
                        <div
                          key={idx}
                          className={`text-xs p-1 rounded ${
                            slot.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <div className="font-mono text-[10px]">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          {slot.reason && (
                            <div className="truncate" title={slot.reason}>
                              {slot.reason}
                            </div>
                          )}
                        </div>
                      ))}
                      {daySlots.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{daySlots.length - 3} more
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


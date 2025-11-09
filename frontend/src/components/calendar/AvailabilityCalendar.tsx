/**
 * AvailabilityCalendar Component
 * Main component that combines all availability management features
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAvailability } from '../../hooks/useAvailability';
import { RecurringAvailability } from './RecurringAvailability';
import { AvailabilityOverride } from './AvailabilityOverride';
import { CalendarGrid } from './CalendarGrid';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Calendar, List, Clock } from 'lucide-react';
import BookingService from '../../services/booking';
import { Booking } from '../../types/booking';
import { UserRole } from '../../types/user';

export const AvailabilityCalendar: React.FC = () => {
  const { user } = useAuth();
  const { availability, loading, error, fetchAvailability, clearError } = useAvailability();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toISOString().split('T')[0];
    })(),
  });

  useEffect(() => {
    if (user) {
      loadAvailability();
      loadBookings();
    }
  }, [user, dateRange]);

  const loadAvailability = () => {
    if (user) {
      fetchAvailability(user.id, dateRange.startDate, dateRange.endDate);
    }
  };

  const loadBookings = async () => {
    if (!user) return;

    try {
      setBookingsLoading(true);
      let bookingData: Booking[] = [];
      
      // Load bookings based on user role
      if (user.role === UserRole.INSTRUCTOR) {
        // For instructors, show bookings where they are the instructor
        bookingData = await BookingService.listBookings({
          instructorId: user.id,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 1000, // Load all bookings in range
        });
      } else if (user.role === UserRole.STUDENT) {
        // For students, show bookings where they are the student
        bookingData = await BookingService.listBookings({
          studentId: user.id,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 1000, // Load all bookings in range
        });
      } else if (user.role === 'ADMIN' || user.role === 'admin') {
        // For admins, show all bookings in the date range
        bookingData = await BookingService.listBookings({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 1000, // Load all bookings in range
        });
      }
      
      setBookings(bookingData);
    } catch (err) {
      console.error('Failed to load bookings for availability calendar:', err);
      // Don't show error to user - bookings are optional for availability view
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleDateRangeChange = (range: 'week' | 'month' | '3months') => {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    let endDate: Date;

    switch (range) {
      case 'week':
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'month':
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);
        break;
      case '3months':
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 90);
        break;
    }

    setDateRange({
      startDate,
      endDate: endDate.toISOString().split('T')[0],
    });
  };

  if (!user) {
    return (
      <Alert>
        <AlertDescription>Please log in to manage your availability.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Availability Management</h1>
        <p className="text-gray-600">
          Manage your weekly recurring availability and one-time overrides
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </Alert>
      )}

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="recurring">
            <Clock className="w-4 h-4 mr-2" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="overrides">
            <List className="w-4 h-4 mr-2" />
            Overrides
          </TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Availability Overview</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateRangeChange('week')}
                  >
                    1 Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateRangeChange('month')}
                  >
                    1 Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateRangeChange('3months')}
                  >
                    3 Months
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : availability ? (
                <CalendarGrid
                  slots={availability.slots}
                  startDate={new Date(dateRange.startDate)}
                  endDate={new Date(dateRange.endDate)}
                  bookings={bookings}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No availability data to display
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          {availability && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {availability.slots.filter((s) => s.isAvailable).length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Available Slots</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {availability.recurringPatterns.filter((p) => p.isActive).length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Active Patterns</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {availability.overrides.filter((o) => o.isBlocked).length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Blocked Days</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Recurring Availability Tab */}
        <TabsContent value="recurring">
          <RecurringAvailability onPatternChange={loadAvailability} />
        </TabsContent>

        {/* Availability Overrides Tab */}
        <TabsContent value="overrides">
          <AvailabilityOverride />
        </TabsContent>
      </Tabs>
    </div>
  );
};


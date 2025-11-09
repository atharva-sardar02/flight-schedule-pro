/**
 * Dashboard Component
 * Main dashboard view with weather alerts, flight status, and metrics
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WeatherAlerts } from './WeatherAlerts';
import { FlightStatus } from './FlightStatus';
import { MetricsPanel } from './MetricsPanel';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import BookingService from '@/services/booking';
import { Booking, BookingStatus } from '@/types/booking';
import { UserRole } from '@/types/user';

interface DashboardData {
  metrics: Array<{
    label: string;
    value: string | number;
    change?: {
      value: number;
      trend: 'up' | 'down' | 'neutral';
    };
    icon?: React.ReactNode;
    description?: string;
  }>;
  weatherAlerts: Array<any>;
  bookings: Array<any>;
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    metrics: [],
    weatherAlerts: [],
    bookings: [],
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
      
      // Auto-refresh every 5 minutes
      const interval = setInterval(() => {
        handleRefresh();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.error('User not available');
        return;
      }

      const now = new Date();
      
      // Build filters based on user role (no date restrictions)
      const filters: any = {
        limit: 1000, // Get all bookings
      };

      if (user.role === UserRole.STUDENT) {
        filters.studentId = user.id;
      } else if (user.role === UserRole.INSTRUCTOR) {
        filters.instructorId = user.id;
      }
      // Admins see all bookings (no filter)

      // Fetch all bookings (no date restriction)
      const bookings = await BookingService.listBookings(filters);

      // For successful reschedules, fetch ALL rescheduled bookings (not just current month)
      // This ensures we count all reschedules regardless of when they were rescheduled
      const rescheduleFilters: any = {
        limit: 1000, // Get all reschedules
      };
      if (user.role === UserRole.STUDENT) {
        rescheduleFilters.studentId = user.id;
      } else if (user.role === UserRole.INSTRUCTOR) {
        rescheduleFilters.instructorId = user.id;
      }
      rescheduleFilters.status = BookingStatus.RESCHEDULED;
      const allRescheduledBookings = await BookingService.listBookings(rescheduleFilters);

      // Calculate metrics
      const totalFlights = bookings.length;
      const activeAlerts = bookings.filter(b => b.status === BookingStatus.AT_RISK).length;
      const successfulReschedules = allRescheduledBookings.length; // Count all reschedules, not just current month
      const confirmedFlights = bookings.filter(b => b.status === BookingStatus.CONFIRMED).length;
      
      // No date restrictions - show all-time data
      // For comparison, we'll use the same data (no previous month comparison)
      const prevTotalFlights = bookings.length;
      const prevActiveAlerts = bookings.filter(b => b.status === BookingStatus.AT_RISK).length;
      const prevReschedules = allRescheduledBookings.length;

      // No date restrictions - show all-time data
      // Change indicators are neutral since we're showing all-time data (not month-over-month)
      const totalFlightsChange = 0;
      const alertsChange = 0;
      const reschedulesChange = 0;

      // Get upcoming bookings (next 7 days) for flight status
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const upcomingBookings = bookings
        .filter(b => {
          const scheduledDate = new Date(b.scheduledDatetime);
          return scheduledDate >= now && scheduledDate <= nextWeek && b.status !== BookingStatus.CANCELLED;
        })
        .sort((a, b) => new Date(a.scheduledDatetime).getTime() - new Date(b.scheduledDatetime).getTime())
        .slice(0, 5); // Show top 5 upcoming

      // Map bookings to flight status format
      const flightStatusBookings = upcomingBookings.map(booking => ({
        id: booking.id,
        scheduledTime: booking.scheduledDatetime,
        status: booking.status as any,
        departureAirport: booking.departureAirport,
        arrivalAirport: booking.arrivalAirport,
        studentName: 'Student', // TODO: Fetch user details
        instructorName: 'Instructor', // TODO: Fetch user details
        aircraftType: booking.aircraftId || 'N/A',
        trainingLevel: booking.trainingLevel,
      }));

      // Map AT_RISK bookings to weather alerts
      const weatherAlerts = bookings
        .filter(b => b.status === BookingStatus.AT_RISK)
        .map(booking => ({
          id: booking.id,
          bookingId: booking.id,
          flightInfo: {
            scheduledTime: booking.scheduledDatetime,
            route: `${booking.departureAirport} → ${booking.arrivalAirport}`,
            trainingLevel: booking.trainingLevel,
          },
          weather: {
            visibility: 0, // TODO: Fetch actual weather data
            windSpeed: 0,
            ceiling: 0,
            conditions: 'Unknown',
          },
          severity: 'warning' as const,
          detectedAt: booking.updatedAt,
        }));

      setDashboardData({
        metrics: [
          {
            label: 'Total Flights',
            value: totalFlights,
            change: { 
              value: 0, 
              trend: 'neutral' as const 
            },
            description: 'All bookings',
          },
          {
            label: 'Active Alerts',
            value: activeAlerts,
            change: { 
              value: 0, 
              trend: 'neutral' as const 
            },
            description: 'Weather conflicts detected',
          },
          {
            label: 'Successful Reschedules',
            value: successfulReschedules,
            change: { 
              value: 0, 
              trend: 'neutral' as const 
            },
            description: 'All-time reschedules',
          },
          {
            label: 'Confirmed Flights',
            value: confirmedFlights,
            change: { 
              value: 0, 
              trend: 'neutral' as const 
            },
            description: 'All confirmed bookings',
          },
        ],
        weatherAlerts,
        bookings: flightStatusBookings,
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set empty data on error
      setDashboardData({
        metrics: [],
        weatherAlerts: [],
        bookings: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewBookingDetails = (bookingId: string) => {
    navigate(`/bookings/${bookingId}`);
  };

  const handleScheduleNewFlight = () => {
    navigate('/bookings/new');
  };

  const handleManageAvailability = () => {
    navigate('/availability');
  };

  const handleViewAllBookings = () => {
    navigate('/bookings');
  };

  const handleSystemSettings = () => {
    navigate('/settings');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metrics Panel */}
        <MetricsPanel metrics={dashboardData.metrics} />

        {/* Weather Alerts and Flight Status */}
        <div className="grid gap-6 lg:grid-cols-2">
          <WeatherAlerts alerts={dashboardData.weatherAlerts} />
          <FlightStatus
            bookings={dashboardData.bookings}
            onViewDetails={handleViewBookingDetails}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleScheduleNewFlight}>Schedule New Flight</Button>
            <Button variant="outline" onClick={handleManageAvailability}>Manage Availability</Button>
            <Button variant="outline" onClick={handleViewAllBookings}>View All Bookings</Button>
            <Button variant="outline" onClick={handleSystemSettings}>System Settings</Button>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
            <p className="text-sm font-medium">
              Weather monitoring active • Checking every 10 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


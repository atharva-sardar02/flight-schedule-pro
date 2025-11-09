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

      // Calculate date range for this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      // Build filters based on user role
      const filters: any = {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
        limit: 100, // Get all bookings for the month
      };

      if (user.role === UserRole.STUDENT) {
        filters.studentId = user.id;
      } else if (user.role === UserRole.INSTRUCTOR) {
        filters.instructorId = user.id;
      }
      // Admins see all bookings (no filter)

      // Fetch bookings
      const bookings = await BookingService.listBookings(filters);

      // Calculate metrics
      const totalFlights = bookings.length;
      const activeAlerts = bookings.filter(b => b.status === BookingStatus.AT_RISK).length;
      const successfulReschedules = bookings.filter(b => b.originalBookingId).length;
      const confirmedFlights = bookings.filter(b => b.status === BookingStatus.CONFIRMED).length;
      
      // Get previous month for comparison (simplified - just show current month data)
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      
      const prevFilters = {
        ...filters,
        startDate: previousMonthStart.toISOString().split('T')[0],
        endDate: previousMonthEnd.toISOString().split('T')[0],
      };
      
      let previousBookings: Booking[] = [];
      try {
        previousBookings = await BookingService.listBookings(prevFilters);
      } catch (err) {
        console.warn('Could not fetch previous month data:', err);
      }

      const prevTotalFlights = previousBookings.length;
      const prevActiveAlerts = previousBookings.filter(b => b.status === BookingStatus.AT_RISK).length;
      const prevReschedules = previousBookings.filter(b => b.originalBookingId).length;

      // Calculate changes
      const totalFlightsChange = prevTotalFlights > 0 
        ? Math.round(((totalFlights - prevTotalFlights) / prevTotalFlights) * 100)
        : totalFlights > 0 ? 100 : 0;
      
      const alertsChange = prevActiveAlerts > 0
        ? Math.round(((activeAlerts - prevActiveAlerts) / prevActiveAlerts) * 100)
        : activeAlerts > 0 ? 100 : 0;

      const reschedulesChange = prevReschedules > 0
        ? Math.round(((successfulReschedules - prevReschedules) / prevReschedules) * 100)
        : successfulReschedules > 0 ? 100 : 0;

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
              value: Math.abs(totalFlightsChange), 
              trend: totalFlightsChange >= 0 ? 'up' : 'down' 
            },
            description: 'Scheduled this month',
          },
          {
            label: 'Active Alerts',
            value: activeAlerts,
            change: { 
              value: Math.abs(alertsChange), 
              trend: alertsChange <= 0 ? 'down' : 'up' 
            },
            description: 'Weather conflicts detected',
          },
          {
            label: 'Successful Reschedules',
            value: successfulReschedules,
            change: { 
              value: Math.abs(reschedulesChange), 
              trend: reschedulesChange >= 0 ? 'up' : 'down' 
            },
            description: 'Completed this month',
          },
          {
            label: 'Confirmed Flights',
            value: confirmedFlights,
            change: { 
              value: 0, 
              trend: 'neutral' as const 
            },
            description: 'Ready to fly',
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


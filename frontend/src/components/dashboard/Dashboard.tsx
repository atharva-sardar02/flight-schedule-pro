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
    loadDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setDashboardData({
        metrics: [
          {
            label: 'Total Flights',
            value: 24,
            change: { value: 12, trend: 'up' },
            description: 'Scheduled this month',
          },
          {
            label: 'Active Alerts',
            value: 3,
            change: { value: -25, trend: 'down' },
            description: 'Weather conflicts detected',
          },
          {
            label: 'Successful Reschedules',
            value: 18,
            change: { value: 8, trend: 'up' },
            description: 'Completed this month',
          },
          {
            label: 'Avg Response Time',
            value: '4.2h',
            change: { value: -15, trend: 'down' },
            description: 'Preference submission time',
          },
        ],
        weatherAlerts: [],
        bookings: [],
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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


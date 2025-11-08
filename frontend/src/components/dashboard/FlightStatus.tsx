/**
 * FlightStatus Component
 * Displays current bookings and their status
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, User, Plane, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatDateTime, getRelativeTime, isDateToday, isDateTomorrow } from '@/utils/dateUtils';

interface Booking {
  id: string;
  scheduledTime: string;
  status: 'CONFIRMED' | 'AT_RISK' | 'CANCELLED' | 'PENDING_RESCHEDULE' | 'ESCALATED';
  departureAirport: string;
  arrivalAirport: string;
  studentName: string;
  instructorName: string;
  aircraftType: string;
  trainingLevel: string;
}

interface FlightStatusProps {
  bookings?: Booking[];
  loading?: boolean;
  onViewDetails?: (bookingId: string) => void;
}

export function FlightStatus({ bookings = [], loading = false, onViewDetails }: FlightStatusProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'AT_RISK':
        return <Badge className="bg-yellow-500">At Risk</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-500">Cancelled</Badge>;
      case 'PENDING_RESCHEDULE':
        return <Badge className="bg-blue-500">Pending Reschedule</Badge>;
      case 'ESCALATED':
        return <Badge className="bg-red-500">Escalated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'AT_RISK':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'CANCELLED':
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
      case 'PENDING_RESCHEDULE':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'ESCALATED':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Plane className="h-5 w-5 text-gray-600" />;
    }
  };

  const getDateLabel = (date: string) => {
    if (isDateToday(date)) {
      return <Badge variant="outline" className="text-blue-600 border-blue-600">Today</Badge>;
    }
    if (isDateTomorrow(date)) {
      return <Badge variant="outline" className="text-purple-600 border-purple-600">Tomorrow</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flight Status</CardTitle>
          <CardDescription>Loading bookings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flight Status</CardTitle>
          <CardDescription>No upcoming flights scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-gray-600">
            <Plane className="h-12 w-12 mb-3" />
            <p className="font-medium">No Upcoming Flights</p>
            <p className="text-sm text-gray-500 mt-1">
              Schedule a new flight to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Flight Status</CardTitle>
            <CardDescription>
              {bookings.length} upcoming flight{bookings.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(booking.status)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">
                        {booking.departureAirport} → {booking.arrivalAirport}
                      </h4>
                      {getDateLabel(booking.scheduledTime)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(booking.scheduledTime)} ({getRelativeTime(booking.scheduledTime)})
                    </p>
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-600">Student</p>
                    <p className="font-medium">{booking.studentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-600">Instructor</p>
                    <p className="font-medium">{booking.instructorName}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-gray-600">
                  <span className="flex items-center gap-1">
                    <Plane className="h-4 w-4" />
                    {booking.aircraftType}
                  </span>
                  <Badge variant="outline">{booking.trainingLevel}</Badge>
                </div>
                {onViewDetails && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(booking.id)}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


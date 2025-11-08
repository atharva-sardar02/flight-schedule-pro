/**
 * ConfirmationScreen Component
 * Displays final confirmation after reschedule selection
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Calendar, MapPin, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

interface ConfirmationScreenProps {
  bookingDetails: {
    id: string;
    studentName: string;
    instructorName: string;
    aircraftType: string;
    trainingLevel: string;
  };
  oldScheduledTime: string | Date;
  newScheduledTime: string | Date;
  route: {
    departureAirport: string;
    arrivalAirport: string;
  };
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function ConfirmationScreen({
  bookingDetails,
  oldScheduledTime,
  newScheduledTime,
  route,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationScreenProps) {
  const oldDate = new Date(oldScheduledTime);
  const newDate = new Date(newScheduledTime);

  return (
    <div className="space-y-6">
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-800">
            <CheckCircle2 className="h-8 w-8" />
            <div>
              <h3 className="font-semibold text-lg">Reschedule Confirmed!</h3>
              <p className="text-sm">Your flight has been rescheduled to a new time.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Change Summary</CardTitle>
          <CardDescription>
            Review the details of your rescheduled flight
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Old vs New Time */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Original Time</Badge>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(oldDate, 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="mr-2 h-4 w-4" />
                  {format(oldDate, 'h:mm a')}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">New Time</Badge>
              </div>
              <div className="p-4 bg-green-100 rounded-lg border-2 border-green-300">
                <div className="flex items-center text-sm text-green-800 mb-1 font-medium">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(newDate, 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="flex items-center text-sm text-green-800 font-medium">
                  <Clock className="mr-2 h-4 w-4" />
                  {format(newDate, 'h:mm a')}
                </div>
              </div>
            </div>
          </div>

          {/* Flight Details */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-gray-900">Flight Details</h4>
            
            <div className="grid gap-3">
              <div className="flex items-center">
                <MapPin className="mr-3 h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 w-32">Route:</span>
                <span className="text-sm font-medium">
                  {route.departureAirport} → {route.arrivalAirport}
                </span>
              </div>

              <div className="flex items-center">
                <Users className="mr-3 h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 w-32">Student:</span>
                <span className="text-sm font-medium">{bookingDetails.studentName}</span>
              </div>

              <div className="flex items-center">
                <Users className="mr-3 h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 w-32">Instructor:</span>
                <span className="text-sm font-medium">{bookingDetails.instructorName}</span>
              </div>

              <div className="flex items-center">
                <span className="mr-3 h-4 w-4"></span>
                <span className="text-sm text-gray-600 w-32">Aircraft:</span>
                <span className="text-sm font-medium">{bookingDetails.aircraftType}</span>
              </div>

              <div className="flex items-center">
                <span className="mr-3 h-4 w-4"></span>
                <span className="text-sm text-gray-600 w-32">Training Level:</span>
                <Badge variant="outline">{bookingDetails.trainingLevel}</Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              All participants have been notified of this change.
            </p>
            <div className="flex gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={loading}>
                  Back to Bookings
                </Button>
              )}
              <Button onClick={onConfirm} disabled={loading}>
                {loading ? 'Processing...' : 'Finalize Reschedule'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">What's Next?</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Weather will continue to be monitored leading up to the flight</li>
              <li>You'll receive notifications of any status changes</li>
              <li>Both student and instructor have access to this updated schedule</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


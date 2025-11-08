/**
 * ConfirmationScreen Component
 * Displays final confirmation after reschedule selection with weather re-validation
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Calendar, MapPin, Clock, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { getUserFriendlyError, showErrorNotification } from '../../utils/errorHandling';

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
  onConfirm: () => Promise<{ success: boolean; error?: string; requiresNewOptions?: boolean }>;
  onCancel?: () => void;
  onRequestNewOptions?: () => void;
  loading?: boolean;
}

export function ConfirmationScreen({
  bookingDetails,
  oldScheduledTime,
  newScheduledTime,
  route,
  onConfirm,
  onCancel,
  onRequestNewOptions,
  loading = false,
}: ConfirmationScreenProps) {
  const [confirming, setConfirming] = useState(false);
  const [revalidationError, setRevalidationError] = useState<{
    message: string;
    requiresNewOptions: boolean;
  } | null>(null);

  const oldDate = new Date(oldScheduledTime);
  const newDate = new Date(newScheduledTime);

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      setRevalidationError(null);

      const result = await onConfirm();

      if (!result.success) {
        if (result.requiresNewOptions) {
          setRevalidationError({
            message: result.error || 'Weather conditions have changed',
            requiresNewOptions: true,
          });
        } else {
          setRevalidationError({
            message: result.error || 'Failed to confirm reschedule',
            requiresNewOptions: false,
          });
        }
      }
    } catch (error: any) {
      const friendlyError = getUserFriendlyError(error);
      setRevalidationError({
        message: friendlyError.message,
        requiresNewOptions: false,
      });
      showErrorNotification(error, 'confirm-reschedule');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      {!revalidationError && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-green-800">
              <CheckCircle2 className="h-8 w-8" />
              <div>
                <h3 className="font-semibold text-lg">Ready to Confirm Reschedule</h3>
                <p className="text-sm">Weather will be re-validated before final confirmation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {revalidationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            <p className="font-semibold mb-2">{revalidationError.message}</p>
            {revalidationError.requiresNewOptions && (
              <p className="text-sm mb-3">
                The selected time slot no longer meets weather requirements. New options need to be generated.
              </p>
            )}
            {revalidationError.requiresNewOptions && onRequestNewOptions && (
              <Button
                onClick={onRequestNewOptions}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate New Options
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

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
              Weather will be checked immediately before confirmation
            </p>
            <div className="flex gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={confirming}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleConfirm} disabled={confirming || loading}>
                {confirming ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Validating Weather...
                  </>
                ) : (
                  'Confirm Reschedule'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">What Happens Next?</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Weather conditions will be re-validated in real-time</li>
              <li>If conditions are suitable, the booking will be updated</li>
              <li>Both student and instructor will receive email confirmation</li>
              <li>Weather monitoring will continue for the new time slot</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


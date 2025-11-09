/**
 * Active Reschedules Component
 * Shows all bookings currently in the rescheduling process
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Calendar, MapPin, Clock, AlertCircle } from 'lucide-react';
import BookingService from '../../services/booking';
import { Booking, BookingStatus } from '../../types/booking';
import { format } from 'date-fns';
import { getRescheduleOptions, getPreferences } from '../../services/rescheduling';
import { useAuth } from '../../hooks/useAuth';

interface RescheduleStatus {
  bookingId: string;
  booking: Booking;
  hasOptions: boolean;
  hasMyPreference: boolean;
  hasBothPreferences: boolean;
  deadline?: string;
  status: 'options_generated' | 'waiting_my_preference' | 'waiting_other_preference' | 'ready_to_confirm' | 'unknown';
}

export default function ActiveReschedules() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reschedules, setReschedules] = useState<RescheduleStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActiveReschedules();
  }, [user]);

  const loadActiveReschedules = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all bookings with RESCHEDULING status
      const bookings = await BookingService.listBookings({
        status: BookingStatus.RESCHEDULING,
        limit: 100,
      });

      // Filter bookings where user is student or instructor
      const userBookings = bookings.filter(
        (b) => b.studentId === user.id || b.instructorId === user.id
      );

      // Check status for each booking
      const rescheduleStatuses: RescheduleStatus[] = await Promise.all(
        userBookings.map(async (booking) => {
          try {
            // Check if options exist
            let hasOptions = false;
            let hasMyPreference = false;
            let hasBothPreferences = false;
            let deadline: string | undefined;
            let status: RescheduleStatus['status'] = 'unknown';

            try {
              const options = await getRescheduleOptions(booking.id);
              hasOptions = options.length > 0;

              if (hasOptions) {
                try {
                  // Get all preferences for this booking
                  const allPreferences = await getPreferences(booking.id);
                  
                  // Check if current user has submitted preference
                  const myPreference = allPreferences.find(p => p.userId === user.id);
                  hasMyPreference = !!myPreference;
                  
                  // Check if both student and instructor have submitted
                  // A booking should have exactly 2 preferences (student + instructor)
                  hasBothPreferences = allPreferences.length >= 2 && 
                    allPreferences.every(p => p.submittedAt); // Both must be submitted

                  if (hasMyPreference) {
                    status = hasBothPreferences ? 'ready_to_confirm' : 'waiting_other_preference';
                  } else {
                    status = 'waiting_my_preference';
                  }
                  
                  // Get deadline from preference if available
                  if (myPreference?.deadline) {
                    deadline = myPreference.deadline;
                  } else if (allPreferences.length > 0 && allPreferences[0].deadline) {
                    deadline = allPreferences[0].deadline;
                  }
                } catch (err) {
                  // No preferences yet or error fetching
                  status = 'waiting_my_preference';
                }
              } else {
                status = 'options_generated'; // Actually no options, but this shouldn't happen
              }
            } catch (err) {
              // No options yet - shouldn't happen for RESCHEDULING status
              status = 'unknown';
            }

            return {
              bookingId: booking.id,
              booking,
              hasOptions,
              hasMyPreference,
              hasBothPreferences,
              deadline,
              status,
            };
          } catch (err) {
            // Error checking this booking, skip it
            return null;
          }
        })
      );

      // Filter out nulls
      const validReschedules = rescheduleStatuses.filter(
        (r): r is RescheduleStatus => r !== null
      );

      setReschedules(validReschedules);
    } catch (err: any) {
      setError(err.message || 'Failed to load active reschedules');
      console.error('Error loading active reschedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: RescheduleStatus['status']) => {
    switch (status) {
      case 'options_generated':
        return <Badge className="bg-blue-500">Options Generated</Badge>;
      case 'waiting_my_preference':
        return <Badge className="bg-yellow-500">Waiting for Your Preference</Badge>;
      case 'waiting_other_preference':
        return <Badge className="bg-orange-500">Waiting for Other User</Badge>;
      case 'ready_to_confirm':
        return <Badge className="bg-green-500">Ready to Confirm</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const getStatusMessage = (status: RescheduleStatus['status']) => {
    switch (status) {
      case 'options_generated':
        return 'Reschedule options have been generated. Please review and submit your preferences.';
      case 'waiting_my_preference':
        return 'Reschedule options are available. Please submit your preference ranking.';
      case 'waiting_other_preference':
        return 'You have submitted your preferences. Waiting for the other user to submit theirs.';
      case 'ready_to_confirm':
        return 'Both users have submitted preferences. Ready to confirm the reschedule.';
      default:
        return 'Status unknown.';
    }
  };

  const handleContinue = (bookingId: string) => {
    navigate(`/bookings/${bookingId}/reschedule`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading active reschedules...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Active Reschedules</h1>
        <p className="text-gray-600 mt-2">
          Bookings currently in the rescheduling process. Continue where you left off.
        </p>
      </div>

      {reschedules.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No active reschedules</p>
              <p className="text-sm text-gray-500 mt-2">
                All your bookings are up to date.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reschedules.map((reschedule) => (
            <Card key={reschedule.bookingId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {reschedule.booking.departureAirport} → {reschedule.booking.arrivalAirport}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center text-sm">
                          <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                          <span>
                            Original: {format(new Date(reschedule.booking.scheduledDatetime), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                          <span>{reschedule.booking.trainingLevel}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(reschedule.status)}
                    <Button
                      onClick={() => handleContinue(reschedule.bookingId)}
                      size="sm"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    {getStatusMessage(reschedule.status)}
                  </p>
                </div>
                {reschedule.deadline && (
                  <div className="mt-3 text-xs text-gray-500">
                    Deadline: {format(new Date(reschedule.deadline), 'MMM d, yyyy h:mm a')}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


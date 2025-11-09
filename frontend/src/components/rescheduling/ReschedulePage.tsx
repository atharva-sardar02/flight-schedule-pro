/**
 * ReschedulePage Component
 * Main page for rescheduling a booking with AI-generated options
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { RescheduleOptions } from './RescheduleOptions';
import { PreferenceRanking } from './PreferenceRanking';
import { ConfirmationScreen } from './ConfirmationScreen';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import BookingService from '../../services/booking';
import { Booking } from '../../types/booking';
import {
  getRescheduleOptions,
  submitPreference,
  getMyPreference,
  confirmReschedule,
  RescheduleOption,
} from '../../services/rescheduling';
import { getUserFriendlyError, showErrorNotification } from '../../utils/errorHandling';

type RescheduleStep = 'options' | 'preferences' | 'confirmation';

export default function ReschedulePage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [options, setOptions] = useState<RescheduleOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<RescheduleOption | null>(null);
  const [step, setStep] = useState<RescheduleStep>('options');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRanking, setExistingRanking] = useState<{
    option1Id?: string;
    option2Id?: string;
    option3Id?: string;
    unavailableOptionIds: string[];
  } | null>(null);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    if (!bookingId) return;

    try {
      setLoading(true);
      setError(null);
      const bookingData = await BookingService.getBooking(bookingId);
      setBooking(bookingData);

      // Load existing options
      try {
        const existingOptions = await getRescheduleOptions(bookingId);
        setOptions(existingOptions);

        // Load existing preferences if any
        try {
          const preferenceData = await getMyPreference(bookingId);
          if (preferenceData.preference) {
            setExistingRanking({
              option1Id: preferenceData.preference.option1Id,
              option2Id: preferenceData.preference.option2Id,
              option3Id: preferenceData.preference.option3Id,
              unavailableOptionIds: preferenceData.preference.unavailableOptionIds || [],
            });
            // If preferences already submitted, find the selected option and go to confirmation
            const selectedId = preferenceData.preference.option1Id || preferenceData.preference.option2Id || preferenceData.preference.option3Id;
            if (selectedId && existingOptions.length > 0) {
              const selected = existingOptions.find((opt) => opt.id === selectedId);
              if (selected) {
                setSelectedOption(selected);
                setStep('confirmation');
              } else {
                // Preferences submitted but option not found, go to preferences to re-select
                setStep('preferences');
              }
            } else if (existingOptions.length > 0) {
              // Options exist but no preferences yet, stay on options step to show them first
              // User can then continue to preferences
              setStep('options');
            }
          } else if (existingOptions.length > 0) {
            // Options exist but no preferences yet, stay on options step
            setStep('options');
          }
        } catch (err) {
          // No existing preferences, that's okay
          // If options exist, stay on options step to show them
          if (existingOptions.length > 0) {
            setStep('options');
          }
        }
      } catch (err) {
        // No options yet, user will need to generate them
        // Stay on options step
        setStep('options');
      }
    } catch (err: any) {
      const friendlyError = getUserFriendlyError(err);
      setError(friendlyError.message);
      showErrorNotification(err, 'load-booking');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionsLoaded = (loadedOptions: RescheduleOption[]) => {
    setOptions(loadedOptions);
    // Don't automatically move to preferences - let user see options first
    // They can continue to preferences from the options view
    // Only auto-advance if preferences were already submitted
    if (loadedOptions.length > 0 && existingRanking) {
      const selectedId = existingRanking.option1Id || existingRanking.option2Id || existingRanking.option3Id;
      if (selectedId) {
        const selected = loadedOptions.find((opt) => opt.id === selectedId);
        if (selected) {
          setSelectedOption(selected);
          setStep('confirmation');
        } else {
          setStep('preferences');
        }
      } else {
        setStep('preferences');
      }
    }
    // Otherwise, stay on options step to show them
  };

  const handleSubmitPreferences = async (ranking: {
    option1Id?: string;
    option2Id?: string;
    option3Id?: string;
    unavailableOptionIds: string[];
  }) => {
    if (!bookingId) return;

    try {
      setSubmitting(true);
      setError(null);
      await submitPreference({
        bookingId,
        ...ranking,
      });
      setExistingRanking(ranking);

      // Get the selected option (highest ranked)
      const selectedId = ranking.option1Id || ranking.option2Id || ranking.option3Id;
      if (selectedId) {
        const selected = options.find((opt) => opt.id === selectedId);
        if (selected) {
          setSelectedOption(selected);
          setStep('confirmation');
        }
      }
    } catch (err: any) {
      const friendlyError = getUserFriendlyError(err);
      setError(friendlyError.message);
      showErrorNotification(err, 'submit-preferences');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReschedule = async (): Promise<{ success: boolean; error?: string; requiresNewOptions?: boolean }> => {
    if (!bookingId || !selectedOption) {
      return { success: false, error: 'Missing booking ID or selected option' };
    }

    try {
      setSubmitting(true);
      setError(null);
      const result = await confirmReschedule(bookingId);

      if (result.success) {
        // Navigate back to booking details
        navigate(`/bookings/${bookingId}`);
        return { success: true };
      } else {
        if (result.requiresNewOptions) {
          setError(result.error || 'Weather conditions have changed. Please generate new options.');
          setStep('options');
          return { success: false, error: result.error, requiresNewOptions: true };
        } else {
          setError(result.error || 'Failed to confirm reschedule');
          return { success: false, error: result.error };
        }
      }
    } catch (err: any) {
      const friendlyError = getUserFriendlyError(err);
      setError(friendlyError.message);
      showErrorNotification(err, 'confirm-reschedule');
      return { success: false, error: friendlyError.message };
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading booking details...</span>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link to="/bookings" className="text-blue-600 hover:text-blue-800">
            ← Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center text-gray-600">Booking not found</div>
        <div className="mt-4 text-center">
          <Link to="/bookings" className="text-blue-600 hover:text-blue-800">
            ← Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={`/bookings/${bookingId}`}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-flex items-center"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Booking Details
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Reschedule Flight</h2>
          <p className="text-gray-600">
            {booking.departureAirport} → {booking.arrivalAirport}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step === 'options' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'options' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2">Generate Options</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step === 'preferences' ? 'text-blue-600 font-semibold' : step === 'confirmation' ? 'text-gray-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preferences' ? 'bg-blue-600 text-white' : step === 'confirmation' ? 'bg-gray-400 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2">Rank Preferences</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step === 'confirmation' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirmation' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2">Confirm</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step content */}
      {step === 'options' && (
        <RescheduleOptions
          bookingId={bookingId!}
          onOptionsLoaded={handleOptionsLoaded}
          onContinue={() => {
            if (options.length > 0) {
              setStep('preferences');
            }
          }}
        />
      )}

      {step === 'preferences' && options.length > 0 && (
        <PreferenceRanking
          options={options}
          onSubmit={handleSubmitPreferences}
          loading={submitting}
          existingRanking={existingRanking || undefined}
        />
      )}

      {step === 'confirmation' && selectedOption && booking && (
        <ConfirmationScreen
          bookingDetails={{
            id: booking.id,
            studentName: 'Student', // TODO: Load from booking.studentId
            instructorName: 'Instructor', // TODO: Load from booking.instructorId
            aircraftType: booking.aircraftId || 'Aircraft', // TODO: Load from booking.aircraftId
            trainingLevel: booking.trainingLevel || 'student_pilot',
          }}
          oldScheduledTime={booking.scheduledDatetime}
          newScheduledTime={selectedOption.suggestedDatetime}
          route={{
            departureAirport: booking.departureAirport,
            arrivalAirport: booking.arrivalAirport,
          }}
          onConfirm={handleConfirmReschedule}
          onCancel={() => setStep('preferences')}
          loading={submitting}
        />
      )}
    </div>
  );
}


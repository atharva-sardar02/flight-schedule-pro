/**
 * CreateBooking Component
 * Form for creating a new flight booking
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingService from '../../services/booking';
import { CreateBookingData } from '../../types/booking';
import { TrainingLevel } from '../../types/weather';
import { UserRole } from '../../types/user';
import { useAuth } from '../../hooks/useAuth';
import { getUserFriendlyError, showErrorNotification } from '../../utils/errorHandling';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Common US airports for demo
const AIRPORTS = [
  { code: 'KJFK', name: 'New York JFK', lat: 40.6413, lon: -73.7781 },
  { code: 'KLAX', name: 'Los Angeles', lat: 33.9416, lon: -118.4085 },
  { code: 'KORD', name: 'Chicago O\'Hare', lat: 41.9786, lon: -87.9048 },
  { code: 'KDFW', name: 'Dallas Fort Worth', lat: 32.8998, lon: -97.0403 },
  { code: 'KATL', name: 'Atlanta', lat: 33.6407, lon: -84.4277 },
  { code: 'KBOS', name: 'Boston', lat: 42.3656, lon: -71.0096 },
  { code: 'KSEA', name: 'Seattle', lat: 47.4502, lon: -122.3088 },
  { code: 'KLAS', name: 'Las Vegas', lat: 36.0840, lon: -115.1537 },
];

export default function CreateBooking() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Partial<CreateBookingData>>({
    trainingLevel: TrainingLevel.STUDENT_PILOT,
    durationMinutes: 60,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-populate studentId or instructorId based on user role
  useEffect(() => {
    if (user && user.id) {
      console.log('Auto-populating user ID:', user.id, 'Role:', user.role);
      // Normalize role to uppercase for comparison (API may return lowercase)
      const normalizedRole = user.role?.toUpperCase();
      if (normalizedRole === 'STUDENT' || user.role === UserRole.STUDENT) {
        setFormData((prev) => ({
          ...prev,
          studentId: user.id,
        }));
        console.log('Set studentId to:', user.id);
      } else if (normalizedRole === 'INSTRUCTOR' || user.role === UserRole.INSTRUCTOR) {
        setFormData((prev) => ({
          ...prev,
          instructorId: user.id,
        }));
        console.log('Set instructorId to:', user.id);
      } else {
        console.log('Role not matched:', user.role, 'normalized:', normalizedRole);
      }
    } else {
      console.log('User not available yet:', user);
    }
  }, [user]);

  // Auto-populate coordinates when airports are selected
  useEffect(() => {
    if (formData.departureAirport) {
      const airport = AIRPORTS.find((a) => a.code === formData.departureAirport);
      if (airport) {
        setFormData((prev) => ({
          ...prev,
          departureLatitude: airport.lat,
          departureLongitude: airport.lon,
        }));
      }
    }
  }, [formData.departureAirport]);

  useEffect(() => {
    if (formData.arrivalAirport) {
      const airport = AIRPORTS.find((a) => a.code === formData.arrivalAirport);
      if (airport) {
        setFormData((prev) => ({
          ...prev,
          arrivalLatitude: airport.lat,
          arrivalLongitude: airport.lon,
        }));
      }
    }
  }, [formData.arrivalAirport]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.studentId || !formData.instructorId) {
      setError('Student and Instructor are required');
      return;
    }

    if (!formData.departureAirport || !formData.arrivalAirport) {
      setError('Departure and arrival airports are required');
      return;
    }

    if (!formData.scheduledDatetime) {
      setError('Scheduled date and time is required');
      return;
    }

    if (
      !formData.departureLatitude ||
      !formData.departureLongitude ||
      !formData.arrivalLatitude ||
      !formData.arrivalLongitude
    ) {
      setError('Airport coordinates are missing');
      return;
    }

    try {
      setLoading(true);

      // Convert datetime-local to ISO 8601 string
      const scheduledDate = formData.scheduledDatetime
        ? new Date(formData.scheduledDatetime).toISOString()
        : null;

      if (!scheduledDate) {
        setError('Scheduled date and time is required');
        return;
      }

      // Prepare booking data
      const bookingData: any = {
        studentId: formData.studentId!.trim(),
        instructorId: formData.instructorId!.trim(),
        departureAirport: formData.departureAirport!,
        arrivalAirport: formData.arrivalAirport!,
        departureLatitude: Number(formData.departureLatitude!),
        departureLongitude: Number(formData.departureLongitude!),
        arrivalLatitude: Number(formData.arrivalLatitude!),
        arrivalLongitude: Number(formData.arrivalLongitude!),
        scheduledDatetime: scheduledDate,
        trainingLevel: formData.trainingLevel || TrainingLevel.STUDENT_PILOT,
        durationMinutes: Number(formData.durationMinutes || 60),
      };

      // Only include aircraftId if it's provided and not empty
      // Don't include it at all if it's empty to avoid validation errors
      const trimmedAircraftId = formData.aircraftId?.trim();
      if (trimmedAircraftId && trimmedAircraftId.length > 0) {
        bookingData.aircraftId = trimmedAircraftId;
      }

      const booking = await BookingService.createBooking(bookingData);

      navigate(`/bookings/${booking.id}`);
    } catch (err: any) {
      // Extract detailed error message
      let errorMessage = 'Failed to create booking';
      
      if (err?.response?.data) {
        const data = err.response.data;
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.join('. ');
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      } else {
        const friendlyError = getUserFriendlyError(err);
        errorMessage = friendlyError.message;
      }
      
      setError(errorMessage);
      showErrorNotification(err, 'create-booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Booking</h2>
        <p className="text-gray-600">Schedule a new flight training session</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          {/* Student & Instructor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student ID *
              </label>
              <input
                type="text"
                name="studentId"
                required
                value={formData.studentId || ''}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter student UUID"
              />
              <p className="mt-1 text-xs text-gray-500">
                UUID of the student (from users table)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructor ID *
              </label>
              <input
                type="text"
                name="instructorId"
                required
                value={formData.instructorId || ''}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter instructor UUID"
              />
              <p className="mt-1 text-xs text-gray-500">
                UUID of the instructor (from users table)
              </p>
            </div>
          </div>

          {/* Flight Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departure Airport *
              </label>
              <select
                name="departureAirport"
                required
                value={formData.departureAirport || ''}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                {AIRPORTS.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.code} - {airport.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arrival Airport *
              </label>
              <select
                name="arrivalAirport"
                required
                value={formData.arrivalAirport || ''}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                {AIRPORTS.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.code} - {airport.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aircraft ID
              </label>
              <input
                type="text"
                name="aircraftId"
                value={formData.aircraftId || ''}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="N12345"
              />
            </div>
          </div>

          {/* Schedule & Training */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                name="scheduledDatetime"
                required
                value={formData.scheduledDatetime || ''}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Level *
              </label>
              <select
                name="trainingLevel"
                required
                value={formData.trainingLevel || TrainingLevel.STUDENT_PILOT}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {Object.values(TrainingLevel).map((level) => (
                  <option key={level} value={level}>
                    {level.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                name="durationMinutes"
                required
                min="15"
                max="480"
                value={formData.durationMinutes || 60}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Coordinates (Auto-filled) */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Coordinates (Auto-filled)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Departure Lat
                </label>
                <input
                  type="number"
                  step="0.0001"
                  name="departureLatitude"
                  value={formData.departureLatitude || ''}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Departure Lon
                </label>
                <input
                  type="number"
                  step="0.0001"
                  name="departureLongitude"
                  value={formData.departureLongitude || ''}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Arrival Lat
                </label>
                <input
                  type="number"
                  step="0.0001"
                  name="arrivalLatitude"
                  value={formData.arrivalLatitude || ''}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Arrival Lon
                </label>
                <input
                  type="number"
                  step="0.0001"
                  name="arrivalLongitude"
                  value={formData.arrivalLongitude || ''}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm text-sm"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}


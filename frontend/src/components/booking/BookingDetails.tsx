/**
 * BookingDetails Component
 * Displays detailed information about a booking with actions
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import BookingService from '../../services/booking';
import { BookingWithUsers, BookingStatus } from '../../types/booking';

export default function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingWithUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadBooking();
    }
  }, [id]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BookingService.getBooking(id!);
      setBooking(data as BookingWithUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setActionLoading(true);
      await BookingService.cancelBooking(id!);
      await loadBooking(); // Reload to show updated status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete this booking? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      await BookingService.deleteBooking(id!);
      navigate('/bookings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete booking');
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'bg-green-100 text-green-800';
      case BookingStatus.AT_RISK:
        return 'bg-yellow-100 text-yellow-800';
      case BookingStatus.RESCHEDULING:
        return 'bg-blue-100 text-blue-800';
      case BookingStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case BookingStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading booking details...</div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
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
      <div className="flex justify-between items-start">
        <div>
          <Link to="/bookings" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to Bookings
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
          <p className="text-gray-600">
            {booking.departureAirport} → {booking.arrivalAirport}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
            booking.status
          )}`}
        >
          {booking.status.replace('_', ' ')}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Flight Information */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Flight Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">
              Departure
            </label>
            <div className="mt-1 text-base text-gray-900">
              {booking.departureAirport}
            </div>
            <div className="text-sm text-gray-500">
              {booking.departureLatitude.toFixed(4)},{' '}
              {booking.departureLongitude.toFixed(4)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">
              Arrival
            </label>
            <div className="mt-1 text-base text-gray-900">
              {booking.arrivalAirport}
            </div>
            <div className="text-sm text-gray-500">
              {booking.arrivalLatitude.toFixed(4)},{' '}
              {booking.arrivalLongitude.toFixed(4)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">
              Scheduled Date & Time
            </label>
            <div className="mt-1 text-base text-gray-900">
              {formatDate(booking.scheduledDatetime)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">
              Duration
            </label>
            <div className="mt-1 text-base text-gray-900">
              {booking.durationMinutes} minutes
            </div>
          </div>

          {booking.aircraftId && (
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Aircraft
              </label>
              <div className="mt-1 text-base text-gray-900">
                {booking.aircraftId}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-500">
              Training Level
            </label>
            <div className="mt-1 text-base text-gray-900">
              {booking.trainingLevel.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Participants
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">
              Student
            </label>
            <div className="mt-1 text-base text-gray-900">
              {booking.student
                ? `${booking.student.firstName} ${booking.student.lastName}`
                : 'Loading...'}
            </div>
            {booking.student && (
              <div className="text-sm text-gray-500">{booking.student.email}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">
              Instructor
            </label>
            <div className="mt-1 text-base text-gray-900">
              {booking.instructor
                ? `${booking.instructor.firstName} ${booking.instructor.lastName}`
                : 'Loading...'}
            </div>
            {booking.instructor && (
              <div className="text-sm text-gray-500">
                {booking.instructor.email}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">
              Booking ID
            </label>
            <div className="mt-1 text-sm text-gray-900 font-mono">
              {booking.id}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">
              Created At
            </label>
            <div className="mt-1 text-sm text-gray-900">
              {formatDate(booking.createdAt)}
            </div>
          </div>

          {booking.originalBookingId && (
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Original Booking
              </label>
              <Link
                to={`/bookings/${booking.originalBookingId}`}
                className="mt-1 text-sm text-blue-600 hover:text-blue-800"
              >
                View Original
              </Link>
            </div>
          )}

          {booking.rescheduledToDatetime && (
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Rescheduled To
              </label>
              <div className="mt-1 text-sm text-gray-900">
                {formatDate(booking.rescheduledToDatetime)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        <div className="flex flex-wrap gap-4">
          {booking.status !== BookingStatus.CANCELLED &&
            booking.status !== BookingStatus.COMPLETED && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Cancel Booking'}
              </button>
            )}

          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {actionLoading ? 'Processing...' : 'Delete Booking'}
          </button>

          <Link
            to={`/bookings/${booking.id}/edit`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Edit Booking
          </Link>
        </div>
      </div>
    </div>
  );
}


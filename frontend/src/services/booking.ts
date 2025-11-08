/**
 * Booking API Service (Frontend)
 */

import api from './api';
import {
  Booking,
  CreateBookingData,
  UpdateBookingData,
  BookingListFilters,
} from '../types/booking';

export default class BookingService {
  /**
   * List bookings with optional filters
   */
  static async listBookings(filters?: BookingListFilters): Promise<Booking[]> {
    const params = new URLSearchParams();

    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.instructorId) params.append('instructorId', filters.instructorId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.trainingLevel) params.append('trainingLevel', filters.trainingLevel);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await api.get<{ bookings: Booking[] }>(
      `/bookings?${params.toString()}`
    );
    return response.data.bookings;
  }

  /**
   * Get booking by ID
   */
  static async getBooking(id: string): Promise<Booking> {
    const response = await api.get<{ booking: Booking }>(`/bookings/${id}`);
    return response.data.booking;
  }

  /**
   * Create a new booking
   */
  static async createBooking(data: CreateBookingData): Promise<Booking> {
    const response = await api.post<{ booking: Booking }>('/bookings', data);
    return response.data.booking;
  }

  /**
   * Update booking
   */
  static async updateBooking(
    id: string,
    data: UpdateBookingData
  ): Promise<Booking> {
    const response = await api.put<{ booking: Booking }>(
      `/bookings/${id}`,
      data
    );
    return response.data.booking;
  }

  /**
   * Delete booking
   */
  static async deleteBooking(id: string): Promise<void> {
    await api.delete(`/bookings/${id}`);
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(id: string): Promise<Booking> {
    const response = await api.post<{ booking: Booking }>(
      `/bookings/${id}/cancel`
    );
    return response.data.booking;
  }
}


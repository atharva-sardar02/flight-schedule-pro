/**
 * Booking Types and Interfaces (Frontend)
 */

import { TrainingLevel } from './weather';

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  AT_RISK = 'AT_RISK',
  RESCHEDULING = 'RESCHEDULING',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface Booking {
  id: string;
  studentId: string;
  instructorId: string;
  aircraftId?: string;
  departureAirport: string;
  arrivalAirport: string;
  departureLatitude: number;
  departureLongitude: number;
  arrivalLatitude: number;
  arrivalLongitude: number;
  scheduledDatetime: string; // ISO string
  status: BookingStatus;
  trainingLevel: TrainingLevel;
  durationMinutes: number;
  originalBookingId?: string;
  rescheduledToDatetime?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface CreateBookingData {
  studentId: string;
  instructorId: string;
  aircraftId?: string;
  departureAirport: string;
  arrivalAirport: string;
  departureLatitude: number;
  departureLongitude: number;
  arrivalLatitude: number;
  arrivalLongitude: number;
  scheduledDatetime: string; // ISO string
  trainingLevel: TrainingLevel;
  durationMinutes?: number;
}

export interface UpdateBookingData {
  aircraftId?: string;
  scheduledDatetime?: string; // ISO string
  status?: BookingStatus;
  durationMinutes?: number;
}

export interface BookingWithUsers extends Booking {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface BookingListFilters {
  studentId?: string;
  instructorId?: string;
  status?: BookingStatus;
  trainingLevel?: TrainingLevel;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  limit?: number;
  offset?: number;
}


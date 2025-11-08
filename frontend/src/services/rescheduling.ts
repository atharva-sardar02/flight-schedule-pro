/**
 * Rescheduling Service
 * Handles API calls for AI rescheduling and preference submission
 */

import api from './api';

export interface RescheduleOption {
  id: string;
  bookingId: string;
  suggestedDatetime: string;
  departureAirport: string;
  arrivalAirport: string;
  weatherScore: number;
  confidence: number;
  reasoning: string;
  createdAt: string;
}

export interface PreferenceRanking {
  id: string;
  bookingId: string;
  userId: string;
  option1Id?: string;
  option2Id?: string;
  option3Id?: string;
  unavailableOptionIds: string[];
  deadline: string;
  submittedAt?: string;
  createdAt: string;
}

export interface SubmitPreferenceRequest {
  bookingId: string;
  option1Id?: string;
  option2Id?: string;
  option3Id?: string;
  unavailableOptionIds?: string[];
}

export interface SubmitPreferenceResponse {
  success: boolean;
  preference: PreferenceRanking;
  bothSubmitted: boolean;
}

/**
 * Generate reschedule options using AI
 */
export async function generateRescheduleOptions(
  bookingId: string
): Promise<RescheduleOption[]> {
  const response = await api.post(`/reschedule/generate/${bookingId}`);
  return response.data.options;
}

/**
 * Get existing reschedule options for a booking
 */
export async function getRescheduleOptions(
  bookingId: string
): Promise<RescheduleOption[]> {
  const response = await api.get(`/reschedule/options/${bookingId}`);
  return response.data.options;
}

/**
 * Submit preference ranking
 */
export async function submitPreference(
  request: SubmitPreferenceRequest
): Promise<SubmitPreferenceResponse> {
  const response = await api.post('/preferences/submit', request);
  return response.data;
}

/**
 * Get all preferences for a booking (student and instructor)
 */
export async function getPreferences(
  bookingId: string
): Promise<PreferenceRanking[]> {
  const response = await api.get(`/preferences/booking/${bookingId}`);
  return response.data.preferences;
}

/**
 * Get current user's preference for a booking
 */
export async function getMyPreference(bookingId: string): Promise<{
  preference: PreferenceRanking;
  options: RescheduleOption[];
}> {
  const response = await api.get(`/preferences/my/${bookingId}`);
  return response.data;
}

/**
 * Confirm reschedule and finalize the booking update
 */
export async function confirmReschedule(bookingId: string): Promise<{
  success: boolean;
  newScheduledTime?: string;
  weatherRevalidated?: boolean;
  notificationsSent?: boolean;
  error?: string;
  requiresNewOptions?: boolean;
}> {
  try {
    const response = await api.post(`/reschedule/confirm/${bookingId}`);
    return {
      success: true,
      ...response.data,
    };
  } catch (error: any) {
    if (error.response?.status === 409) {
      // Weather re-validation failed
      return {
        success: false,
        error: error.response.data.error || 'Weather conditions no longer suitable',
        requiresNewOptions: error.response.data.requiresNewOptions || false,
      };
    }
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to confirm reschedule',
    };
  }
}

/**
 * Manual escalation (admin only)
 */
export async function escalateBooking(
  bookingId: string,
  resolution: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/preferences/escalate/${bookingId}`, {
    resolution,
    notes,
  });
  return response.data;
}


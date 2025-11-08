/**
 * Frontend Availability API Service
 * Handles API calls for availability management
 */

import api from './api';
import {
  RecurringAvailability,
  AvailabilityOverride,
  AvailabilityResponse,
  RecurringAvailabilityFormData,
  AvailabilityOverrideFormData,
} from '../types/availability';

/**
 * Get computed availability for a user within a date range
 */
export const getAvailability = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilityResponse> => {
  const response = await api.get('/availability', {
    params: { userId, startDate, endDate },
  });
  return response.data;
};

// ============================================================================
// RECURRING AVAILABILITY
// ============================================================================

/**
 * Get all recurring availability patterns
 */
export const getRecurringAvailability = async (): Promise<RecurringAvailability[]> => {
  const response = await api.get('/availability/recurring');
  return response.data;
};

/**
 * Create a new recurring availability pattern
 */
export const createRecurringAvailability = async (
  data: RecurringAvailabilityFormData
): Promise<RecurringAvailability> => {
  const response = await api.post('/availability/recurring', data);
  return response.data;
};

/**
 * Update a recurring availability pattern
 */
export const updateRecurringAvailability = async (
  id: string,
  data: Partial<RecurringAvailabilityFormData> & { isActive?: boolean }
): Promise<RecurringAvailability> => {
  const response = await api.put(`/availability/recurring/${id}`, data);
  return response.data;
};

/**
 * Delete a recurring availability pattern
 */
export const deleteRecurringAvailability = async (id: string): Promise<void> => {
  await api.delete(`/availability/recurring/${id}`);
};

// ============================================================================
// AVAILABILITY OVERRIDES
// ============================================================================

/**
 * Get availability overrides within a date range
 */
export const getAvailabilityOverrides = async (
  startDate: string,
  endDate: string
): Promise<AvailabilityOverride[]> => {
  const response = await api.get('/availability/overrides', {
    params: { startDate, endDate },
  });
  return response.data;
};

/**
 * Create a new availability override
 */
export const createAvailabilityOverride = async (
  data: AvailabilityOverrideFormData
): Promise<AvailabilityOverride> => {
  const response = await api.post('/availability/overrides', data);
  return response.data;
};

/**
 * Update an availability override
 */
export const updateAvailabilityOverride = async (
  id: string,
  data: Partial<AvailabilityOverrideFormData>
): Promise<AvailabilityOverride> => {
  const response = await api.put(`/availability/overrides/${id}`, data);
  return response.data;
};

/**
 * Delete an availability override
 */
export const deleteAvailabilityOverride = async (id: string): Promise<void> => {
  await api.delete(`/availability/overrides/${id}`);
};


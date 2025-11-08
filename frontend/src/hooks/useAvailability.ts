/**
 * useAvailability Hook
 * Custom React hook for managing availability state
 */

import { useState, useCallback } from 'react';
import {
  RecurringAvailability,
  AvailabilityOverride,
  AvailabilityResponse,
  RecurringAvailabilityFormData,
  AvailabilityOverrideFormData,
} from '../types/availability';
import * as availabilityService from '../services/availability';

interface UseAvailabilityReturn {
  // State
  availability: AvailabilityResponse | null;
  recurringPatterns: RecurringAvailability[];
  overrides: AvailabilityOverride[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchAvailability: (userId: string, startDate: string, endDate: string) => Promise<void>;
  fetchRecurringPatterns: () => Promise<void>;
  fetchOverrides: (startDate: string, endDate: string) => Promise<void>;
  
  createRecurringPattern: (data: RecurringAvailabilityFormData) => Promise<void>;
  updateRecurringPattern: (id: string, data: Partial<RecurringAvailabilityFormData> & { isActive?: boolean }) => Promise<void>;
  deleteRecurringPattern: (id: string) => Promise<void>;
  
  createOverride: (data: AvailabilityOverrideFormData) => Promise<void>;
  updateOverride: (id: string, data: Partial<AvailabilityOverrideFormData>) => Promise<void>;
  deleteOverride: (id: string) => Promise<void>;
  
  clearError: () => void;
}

export const useAvailability = (): UseAvailabilityReturn => {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringAvailability[]>([]);
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // FETCH OPERATIONS
  // ============================================================================

  const fetchAvailability = useCallback(async (userId: string, startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await availabilityService.getAvailability(userId, startDate, endDate);
      setAvailability(data);
      setRecurringPatterns(data.recurringPatterns);
      setOverrides(data.overrides);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch availability');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecurringPatterns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await availabilityService.getRecurringAvailability();
      setRecurringPatterns(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recurring patterns');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOverrides = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await availabilityService.getAvailabilityOverrides(startDate, endDate);
      setOverrides(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch overrides');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // RECURRING PATTERN OPERATIONS
  // ============================================================================

  const createRecurringPattern = useCallback(async (data: RecurringAvailabilityFormData) => {
    setLoading(true);
    setError(null);
    try {
      const newPattern = await availabilityService.createRecurringAvailability(data);
      setRecurringPatterns((prev) => [...prev, newPattern]);
    } catch (err: any) {
      setError(err.message || 'Failed to create recurring pattern');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRecurringPattern = useCallback(
    async (id: string, data: Partial<RecurringAvailabilityFormData> & { isActive?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const updatedPattern = await availabilityService.updateRecurringAvailability(id, data);
        setRecurringPatterns((prev) =>
          prev.map((pattern) => (pattern.id === id ? updatedPattern : pattern))
        );
      } catch (err: any) {
        setError(err.message || 'Failed to update recurring pattern');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteRecurringPattern = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await availabilityService.deleteRecurringAvailability(id);
      setRecurringPatterns((prev) => prev.filter((pattern) => pattern.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete recurring pattern');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // OVERRIDE OPERATIONS
  // ============================================================================

  const createOverride = useCallback(async (data: AvailabilityOverrideFormData) => {
    setLoading(true);
    setError(null);
    try {
      const newOverride = await availabilityService.createAvailabilityOverride(data);
      setOverrides((prev) => [...prev, newOverride]);
    } catch (err: any) {
      setError(err.message || 'Failed to create override');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOverride = useCallback(async (id: string, data: Partial<AvailabilityOverrideFormData>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedOverride = await availabilityService.updateAvailabilityOverride(id, data);
      setOverrides((prev) =>
        prev.map((override) => (override.id === id ? updatedOverride : override))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update override');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOverride = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await availabilityService.deleteAvailabilityOverride(id);
      setOverrides((prev) => prev.filter((override) => override.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete override');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // UTILITY
  // ============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    availability,
    recurringPatterns,
    overrides,
    loading,
    error,
    fetchAvailability,
    fetchRecurringPatterns,
    fetchOverrides,
    createRecurringPattern,
    updateRecurringPattern,
    deleteRecurringPattern,
    createOverride,
    updateOverride,
    deleteOverride,
    clearError,
  };
};


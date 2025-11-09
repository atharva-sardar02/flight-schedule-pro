/**
 * AvailabilityOverride Component
 * Manages one-time availability overrides (blocks or adds availability)
 */

import React, { useState, useEffect } from 'react';
import { useAvailability } from '../../hooks/useAvailability';
import { AvailabilityOverride as AvailabilityOverrideType } from '../../types/availability';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Trash2, Plus, Check, X, Ban, CalendarPlus } from 'lucide-react';

export const AvailabilityOverride: React.FC = () => {
  const {
    overrides,
    loading,
    error,
    fetchOverrides,
    createOverride,
    deleteOverride,
    clearError,
  } = useAvailability();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    overrideDate: '',
    startTime: '',
    endTime: '',
    isBlocked: true,
    reason: '',
  });

  // Helper to format date in local timezone (YYYY-MM-DD)
  // Handles both Date objects and date strings
  const formatDateLocal = (input: Date | string): string => {
    let date: Date;
    
    if (input instanceof Date) {
      date = input;
    } else if (typeof input === 'string') {
      // If it's already in YYYY-MM-DD format, use it directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        return input;
      }
      // Otherwise, parse the string
      date = new Date(input);
    } else {
      date = new Date(input);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch overrides for the next 90 days
  useEffect(() => {
    // Use local dates to avoid timezone shifts
    const today = formatDateLocal(new Date());
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    const endDate = formatDateLocal(futureDate);
    fetchOverrides(today, endDate);
  }, [fetchOverrides]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOverride({
        overrideDate: formData.overrideDate,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        isBlocked: formData.isBlocked,
        reason: formData.reason || undefined,
      });
      setShowForm(false);
      setFormData({
        overrideDate: '',
        startTime: '',
        endTime: '',
        isBlocked: true,
        reason: '',
      });
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this override?')) {
      try {
        await deleteOverride(id);
      } catch (err) {
        // Error handled by hook
      }
    }
  };

  const formatDate = (dateString: string) => {
    // Use the local date string to avoid timezone issues
    const localDate = formatDateLocal(dateString);
    const [year, month, day] = localDate.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sortedOverrides = [...overrides].sort(
    (a, b) => {
      // Sort by date string directly to avoid timezone issues
      const dateA = formatDateLocal(a.overrideDate);
      const dateB = formatDateLocal(b.overrideDate);
      return dateA.localeCompare(dateB);
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Overrides</CardTitle>
        <CardDescription>
          Block or add availability for specific dates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </Alert>
        )}

        {/* Add New Override Button */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Override
          </Button>
        )}

        {/* Add New Override Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 p-4 border rounded-lg">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="overrideDate">Date</Label>
                <Input
                  id="overrideDate"
                  type="date"
                  value={formData.overrideDate}
                  onChange={(e) => setFormData({ ...formData, overrideDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <Label>Type</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="isBlocked"
                      checked={formData.isBlocked}
                      onChange={() => setFormData({ ...formData, isBlocked: true })}
                    />
                    <Ban className="w-4 h-4 text-red-500" />
                    <span>Block (Not Available)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="isBlocked"
                      checked={!formData.isBlocked}
                      onChange={() => setFormData({ ...formData, isBlocked: false })}
                    />
                    <CalendarPlus className="w-4 h-4 text-green-500" />
                    <span>Add (Available)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time (optional)</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time (optional)</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Leave times empty to apply to the entire day
              </p>

              <div>
                <Label htmlFor="reason">Reason (optional)</Label>
                <Input
                  id="reason"
                  type="text"
                  placeholder="e.g., Vacation, Conference, etc."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  <Check className="w-4 h-4 mr-2" />
                  Add Override
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Existing Overrides List */}
        <div className="space-y-3">
          {sortedOverrides.map((override) => (
            <div
              key={override.id}
              className={`p-4 rounded-lg border ${
                override.isBlocked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {override.isBlocked ? (
                      <Ban className="w-5 h-5 text-red-600" />
                    ) : (
                      <CalendarPlus className="w-5 h-5 text-green-600" />
                    )}
                    <span className="font-semibold">
                      {override.isBlocked ? 'Blocked' : 'Available'}
                    </span>
                  </div>

                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Date:</strong> {formatDate(override.overrideDate)}
                    </div>
                    {(override.startTime || override.endTime) && (
                      <div>
                        <strong>Time:</strong> {override.startTime || '00:00'} -{' '}
                        {override.endTime || '23:59'}
                      </div>
                    )}
                    {override.reason && (
                      <div>
                        <strong>Reason:</strong> {override.reason}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(override.id)}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {overrides.length === 0 && !showForm && (
          <div className="text-center py-8 text-gray-500">
            No overrides set. Click "Add Override" to block or add availability for specific dates.
          </div>
        )}
      </CardContent>
    </Card>
  );
};


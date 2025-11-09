/**
 * RecurringAvailability Component
 * Manages weekly recurring availability patterns
 */

import React, { useState, useEffect } from 'react';
import { useAvailability } from '../../hooks/useAvailability';
import { useAuth } from '../../hooks/useAuth';
import { DayOfWeek, getDayName, RecurringAvailability as RecurringAvailabilityType } from '../../types/availability';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';

interface RecurringAvailabilityProps {
  onPatternChange?: () => void;
}

export const RecurringAvailability: React.FC<RecurringAvailabilityProps> = ({ onPatternChange }) => {
  const {
    recurringPatterns,
    loading,
    error,
    fetchRecurringPatterns,
    createRecurringPattern,
    updateRecurringPattern,
    deleteRecurringPattern,
    clearError,
    fetchAvailability,
  } = useAvailability();
  
  const { user } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: '09:00',
    endTime: '17:00',
  });

  useEffect(() => {
    fetchRecurringPatterns();
  }, [fetchRecurringPatterns]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure dayOfWeek is a valid number (0-6)
      const dayOfWeek = typeof formData.dayOfWeek === 'number' 
        ? formData.dayOfWeek 
        : parseInt(String(formData.dayOfWeek), 10);
      
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new Error('Invalid day of week selected');
      }
      
      await createRecurringPattern({
        ...formData,
        dayOfWeek,
      });
      setShowForm(false);
      setFormData({ dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '17:00' });
      // Refresh calendar view if user is available
      if (user && onPatternChange) {
        onPatternChange();
      }
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleToggleActive = async (pattern: RecurringAvailabilityType) => {
    try {
      await updateRecurringPattern(pattern.id, { isActive: !pattern.isActive });
      // Refresh calendar view
      if (user && onPatternChange) {
        onPatternChange();
      }
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this availability pattern?')) {
      try {
        await deleteRecurringPattern(id);
        // Refresh calendar view
        if (user && onPatternChange) {
          onPatternChange();
        }
      } catch (err) {
        // Error handled by hook
      }
    }
  };

  const groupedPatterns = recurringPatterns.reduce((acc, pattern) => {
    const day = pattern.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(pattern);
    return acc;
  }, {} as Record<number, RecurringAvailabilityType[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Availability</CardTitle>
        <CardDescription>
          Set your recurring weekly availability patterns
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

        {/* Add New Pattern Button */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Availability Pattern
          </Button>
        )}

        {/* Add New Pattern Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 p-4 border rounded-lg">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <select
                  id="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={(e) =>
                    setFormData({ ...formData, dayOfWeek: parseInt(e.target.value, 10) })
                  }
                  className="w-full p-2 border rounded"
                >
                  {[
                    { value: DayOfWeek.SUNDAY, label: 'Sunday' },
                    { value: DayOfWeek.MONDAY, label: 'Monday' },
                    { value: DayOfWeek.TUESDAY, label: 'Tuesday' },
                    { value: DayOfWeek.WEDNESDAY, label: 'Wednesday' },
                    { value: DayOfWeek.THURSDAY, label: 'Thursday' },
                    { value: DayOfWeek.FRIDAY, label: 'Friday' },
                    { value: DayOfWeek.SATURDAY, label: 'Saturday' },
                  ].map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  <Check className="w-4 h-4 mr-2" />
                  Add Pattern
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Existing Patterns by Day */}
        <div className="space-y-4">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => {
            const dayPatterns = groupedPatterns[day] || [];
            if (dayPatterns.length === 0) return null;

            return (
              <div key={day} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">{getDayName(day as DayOfWeek)}</h3>
                <div className="space-y-2">
                  {dayPatterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className={`flex items-center justify-between p-3 rounded ${
                        pattern.isActive ? 'bg-green-50' : 'bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono">
                          {pattern.startTime} - {pattern.endTime}
                        </span>
                        {!pattern.isActive && (
                          <span className="text-sm text-gray-500">(Inactive)</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(pattern)}
                          disabled={loading}
                        >
                          {pattern.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(pattern.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {recurringPatterns.length === 0 && !showForm && (
          <div className="text-center py-8 text-gray-500">
            No availability patterns set. Click "Add Availability Pattern" to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
};


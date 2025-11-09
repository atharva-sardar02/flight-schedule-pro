/**
 * PreferenceRanking Component
 * Drag-and-drop interface for ranking reschedule options
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { GripVertical, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { RescheduleOption } from '@/services/rescheduling';
import { format } from 'date-fns';

// Helper function to safely format dates
const safeFormatDate = (dateString: string | null | undefined, formatString: string): string => {
  if (!dateString) return 'Date not available';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  return format(date, formatString);
};

interface PreferenceRankingProps {
  options: RescheduleOption[];
  onSubmit: (ranking: {
    option1Id?: string;
    option2Id?: string;
    option3Id?: string;
    unavailableOptionIds: string[];
  }) => void;
  loading?: boolean;
  existingRanking?: {
    option1Id?: string;
    option2Id?: string;
    option3Id?: string;
    unavailableOptionIds: string[];
  };
}

export function PreferenceRanking({
  options,
  onSubmit,
  loading = false,
  existingRanking,
}: PreferenceRankingProps) {
  const [rankedOptions, setRankedOptions] = useState<(RescheduleOption | null)[]>([null, null, null]);
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Initialize from existing ranking
  useEffect(() => {
    if (existingRanking && options.length > 0) {
      const ranked: (RescheduleOption | null)[] = [null, null, null];
      
      if (existingRanking.option1Id) {
        ranked[0] = options.find(o => o.id === existingRanking.option1Id) || null;
      }
      if (existingRanking.option2Id) {
        ranked[1] = options.find(o => o.id === existingRanking.option2Id) || null;
      }
      if (existingRanking.option3Id) {
        ranked[2] = options.find(o => o.id === existingRanking.option3Id) || null;
      }
      
      setRankedOptions(ranked);
      setUnavailableIds(new Set(existingRanking.unavailableOptionIds || []));
    }
  }, [existingRanking, options]);

  const availableOptions = options.filter(
    (option) =>
      !rankedOptions.some((ranked) => ranked?.id === option.id) &&
      !unavailableIds.has(option.id)
  );

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null) return;

    const newRanked = [...rankedOptions];
    const draggedOption = rankedOptions[draggedIndex];
    newRanked[draggedIndex] = newRanked[targetIndex];
    newRanked[targetIndex] = draggedOption;

    setRankedOptions(newRanked);
    setDraggedIndex(null);
  };

  const handleSelectOption = (option: RescheduleOption, rank: number) => {
    const newRanked = [...rankedOptions];
    newRanked[rank] = option;
    setRankedOptions(newRanked);
  };

  const handleRemoveOption = (rank: number) => {
    const newRanked = [...rankedOptions];
    newRanked[rank] = null;
    setRankedOptions(newRanked);
  };

  const handleToggleUnavailable = (optionId: string) => {
    const newUnavailable = new Set(unavailableIds);
    if (newUnavailable.has(optionId)) {
      newUnavailable.delete(optionId);
    } else {
      newUnavailable.add(optionId);
      // Remove from ranked if it was there
      setRankedOptions(rankedOptions.map(opt => opt?.id === optionId ? null : opt));
    }
    setUnavailableIds(newUnavailable);
  };

  const handleSubmit = () => {
    onSubmit({
      option1Id: rankedOptions[0]?.id,
      option2Id: rankedOptions[1]?.id,
      option3Id: rankedOptions[2]?.id,
      unavailableOptionIds: Array.from(unavailableIds),
    });
  };

  const canSubmit = rankedOptions.some((opt) => opt !== null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rank Your Preferences</CardTitle>
          <CardDescription>
            Drag options to rank them in order of preference, or mark options as unavailable.
            Your #1 choice will be given the highest weight in the final selection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ranked slots */}
          <div className="space-y-3">
            {rankedOptions.map((option, index) => (
              <div
                key={index}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[80px] bg-gray-50"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'} Choice
                  </span>
                  {option && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                {option ? (
                  <div
                    className="bg-white border rounded-lg p-3 cursor-move"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center text-sm font-medium">
                          <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                          {safeFormatDate(option.suggestedDatetime, 'EEE, MMM d')} at{' '}
                          {safeFormatDate(option.suggestedDatetime, 'h:mm a')}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                          {option.departureAirport} → {option.arrivalAirport}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Drag an option here or select from below
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available options */}
      <Card>
        <CardHeader>
          <CardTitle>Available Options</CardTitle>
          <CardDescription>
            Select options to add to your ranking, or mark them as unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableOptions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              All options have been ranked or marked unavailable
            </p>
          ) : (
            <div className="space-y-2">
              {availableOptions.map((option, index) => (
                <div
                  key={option.id}
                  className="border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`unavailable-${option.id}`}
                      checked={unavailableIds.has(option.id)}
                      onCheckedChange={() => handleToggleUnavailable(option.id)}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center text-sm font-medium">
                        <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                        {safeFormatDate(option.suggestedDatetime, 'EEEE, MMMM d, yyyy')} at{' '}
                        {safeFormatDate(option.suggestedDatetime, 'h:mm a')}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                        {option.departureAirport} → {option.arrivalAirport}
                      </div>
                      <p className="text-xs text-gray-500">{option.reasoning}</p>
                      <div className="flex gap-2">
                        {[0, 1, 2].map((rank) => (
                          <Button
                            key={rank}
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectOption(option, rank)}
                            disabled={rankedOptions[rank] !== null}
                          >
                            Set as #{rank + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unavailable options */}
          {unavailableIds.size > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" />
                Unavailable Options
              </h4>
              <div className="space-y-2">
                {options
                  .filter((opt) => unavailableIds.has(opt.id))
                  .map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center justify-between text-sm text-gray-600 p-2 bg-gray-100 rounded"
                    >
                      <span>
                        {safeFormatDate(option.suggestedDatetime, 'MMM d, h:mm a')}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleUnavailable(option.id)}
                      >
                        Mark Available
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!canSubmit || loading} size="lg">
          {loading ? 'Submitting...' : 'Submit Preferences'}
        </Button>
      </div>

      {!canSubmit && (
        <p className="text-sm text-red-600 text-center">
          Please rank at least one option before submitting
        </p>
      )}
    </div>
  );
}


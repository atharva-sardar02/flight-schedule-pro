/**
 * RescheduleOptions Component
 * Displays AI-generated reschedule options
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, MapPin, Cloud } from 'lucide-react';
import { generateRescheduleOptions, getRescheduleOptions, RescheduleOption } from '@/services/rescheduling';
import { format } from 'date-fns';
import { getUserFriendlyError, showErrorNotification } from '../../utils/errorHandling';

interface RescheduleOptionsProps {
  bookingId: string;
  onOptionsLoaded?: (options: RescheduleOption[]) => void;
}

export function RescheduleOptions({ bookingId, onOptionsLoaded }: RescheduleOptionsProps) {
  const [options, setOptions] = useState<RescheduleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOptions();
  }, [bookingId]);

  const loadOptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRescheduleOptions(bookingId);
      setOptions(data);
      if (onOptionsLoaded) {
        onOptionsLoaded(data);
      }
    } catch (err: any) {
      const friendlyError = getUserFriendlyError(err);
      setError(friendlyError.message);
      showErrorNotification(err, 'load-reschedule-options');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      const data = await generateRescheduleOptions(bookingId);
      setOptions(data);
      if (onOptionsLoaded) {
        onOptionsLoaded(data);
      }
    } catch (err: any) {
      const friendlyError = getUserFriendlyError(err);
      setError(friendlyError.message);
      showErrorNotification(err, 'generate-reschedule-options');
    } finally {
      setGenerating(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-500">High Confidence</Badge>;
    } else if (confidence >= 0.6) {
      return <Badge className="bg-yellow-500">Medium Confidence</Badge>;
    } else {
      return <Badge className="bg-orange-500">Low Confidence</Badge>;
    }
  };

  const getWeatherScoreBadge = (score: number) => {
    if (score >= 0.8) {
      return <Badge className="bg-blue-500">Excellent Weather</Badge>;
    } else if (score >= 0.6) {
      return <Badge className="bg-blue-400">Good Weather</Badge>;
    } else {
      return <Badge className="bg-gray-500">Fair Weather</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading options...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <p className="mb-2">{error}</p>
          <Button onClick={loadOptions} variant="outline" size="sm">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (options.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Reschedule Options</CardTitle>
          <CardDescription>
            Generate new options using our AI scheduling assistant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Options
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Available Reschedule Options</h3>
        <Button onClick={handleGenerate} disabled={generating} variant="outline" size="sm">
          {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Regenerate
        </Button>
      </div>

      <div className="grid gap-4">
        {options.map((option, index) => (
          <Card key={option.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Option {index + 1}</CardTitle>
                <div className="flex gap-2">
                  {getConfidenceBadge(option.confidence)}
                  {getWeatherScoreBadge(option.weatherScore)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                <span className="font-medium">
                  {format(new Date(option.suggestedDatetime), 'EEEE, MMMM d, yyyy')}
                </span>
                <span className="ml-2 text-gray-600">
                  at {format(new Date(option.suggestedDatetime), 'h:mm a')}
                </span>
              </div>

              <div className="flex items-center text-sm">
                <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                <span>
                  {option.departureAirport} → {option.arrivalAirport}
                </span>
              </div>

              <div className="flex items-start text-sm">
                <Cloud className="mr-2 h-4 w-4 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-700">{option.reasoning}</p>
                </div>
              </div>

              <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t">
                <span>Weather Score: {(option.weatherScore * 100).toFixed(0)}%</span>
                <span>Confidence: {(option.confidence * 100).toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


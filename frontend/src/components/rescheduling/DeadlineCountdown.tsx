/**
 * DeadlineCountdown Component
 * Real-time countdown timer for preference submission deadline
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

interface DeadlineCountdownProps {
  deadline: string | Date;
  onDeadlinePassed?: () => void;
}

export function DeadlineCountdown({ deadline, onDeadlinePassed }: DeadlineCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const diff = deadlineTime - now;

      if (diff <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        });
        if (onDeadlinePassed) {
          onDeadlinePassed();
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        total: diff,
      });
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [deadline, onDeadlinePassed]);

  if (!timeRemaining) {
    return null;
  }

  const isUrgent = timeRemaining.total <= 2 * 60 * 60 * 1000; // Less than 2 hours
  const isPassed = timeRemaining.total <= 0;

  const getUrgencyColor = () => {
    if (isPassed) return 'bg-red-100 border-red-300';
    if (isUrgent) return 'bg-orange-100 border-orange-300';
    return 'bg-blue-100 border-blue-300';
  };

  const getTextColor = () => {
    if (isPassed) return 'text-red-800';
    if (isUrgent) return 'text-orange-800';
    return 'text-blue-800';
  };

  if (isPassed) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3 text-red-800">
            <AlertTriangle className="h-6 w-6" />
            <div className="text-center">
              <p className="font-semibold text-lg">Deadline Has Passed</p>
              <p className="text-sm">Preferences can no longer be submitted</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={getUrgencyColor()}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${getTextColor()}`} />
            <span className={`font-medium ${getTextColor()}`}>
              {isUrgent ? 'Deadline Approaching' : 'Time Remaining'}
            </span>
          </div>
          {isUrgent && (
            <Badge className="bg-orange-500">
              Urgent
            </Badge>
          )}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {timeRemaining.days > 0 && (
            <div className="text-center">
              <div className={`text-3xl font-bold ${getTextColor()}`}>
                {timeRemaining.days}
              </div>
              <div className="text-xs text-gray-600">
                {timeRemaining.days === 1 ? 'Day' : 'Days'}
              </div>
            </div>
          )}
          <div className="text-center">
            <div className={`text-3xl font-bold ${getTextColor()}`}>
              {timeRemaining.hours.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-600">Hours</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getTextColor()}`}>
              {timeRemaining.minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-600">Minutes</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getTextColor()}`}>
              {timeRemaining.seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-600">Seconds</div>
          </div>
        </div>

        {isUrgent && (
          <div className="mt-4 text-center">
            <p className="text-sm text-orange-700 font-medium">
              Submit your preferences soon!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


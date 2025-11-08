/**
 * MetricsPanel Component
 * Displays key performance indicators and statistics
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Plane, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface Metric {
  label: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  description?: string;
}

interface MetricsPanelProps {
  metrics?: Metric[];
  loading?: boolean;
}

const defaultMetrics: Metric[] = [
  {
    label: 'Total Flights',
    value: 0,
    icon: <Plane className="h-5 w-5 text-blue-600" />,
    description: 'Scheduled this month',
  },
  {
    label: 'Active Alerts',
    value: 0,
    icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    description: 'Weather conflicts detected',
  },
  {
    label: 'Successful Reschedules',
    value: 0,
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    description: 'Completed this month',
  },
  {
    label: 'Avg Response Time',
    value: '--',
    icon: <Clock className="h-5 w-5 text-purple-600" />,
    description: 'Preference submission time',
  },
];

export function MetricsPanel({ metrics = defaultMetrics, loading = false }: MetricsPanelProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">
                {metric.label}
              </CardDescription>
              {metric.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-1">
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change && (
                <div className={`flex items-center text-sm ${getTrendColor(metric.change.trend)}`}>
                  {getTrendIcon(metric.change.trend)}
                  <span className="ml-1">
                    {metric.change.value > 0 ? '+' : ''}
                    {metric.change.value}%
                  </span>
                </div>
              )}
            </div>
            {metric.description && (
              <p className="text-xs text-gray-600">{metric.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


/**
 * WeatherAlerts Component
 * Displays live weather alerts and conflicts
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Cloud, CheckCircle } from 'lucide-react';
import { getWeatherEmoji, getWeatherSeverity, getWeatherSeverityColor } from '@/utils/weatherUtils';
import { formatDateTime, getRelativeTime } from '@/utils/dateUtils';

interface WeatherAlert {
  id: string;
  bookingId: string;
  flightInfo: {
    scheduledTime: string;
    route: string;
    trainingLevel: string;
  };
  weather: {
    visibility: number;
    windSpeed: number;
    ceiling: number;
    conditions: string;
  };
  severity: 'critical' | 'warning' | 'info';
  detectedAt: string;
}

interface WeatherAlertsProps {
  alerts?: WeatherAlert[];
  loading?: boolean;
}

export function WeatherAlerts({ alerts = [], loading = false }: WeatherAlertsProps) {
  const [localAlerts, setLocalAlerts] = useState<WeatherAlert[]>(alerts);

  useEffect(() => {
    setLocalAlerts(alerts);
  }, [alerts]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <Cloud className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <Cloud className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case 'info':
        return <Badge className="bg-blue-500">Info</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather Alerts</CardTitle>
          <CardDescription>Loading weather alerts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (localAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather Alerts</CardTitle>
          <CardDescription>All flights are clear of weather conflicts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-green-600">
            <CheckCircle className="h-12 w-12 mb-3" />
            <p className="font-medium">No Active Weather Alerts</p>
            <p className="text-sm text-gray-600 mt-1">
              All upcoming flights meet weather minimums
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Weather Alerts</CardTitle>
            <CardDescription>
              {localAlerts.length} active alert{localAlerts.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {localAlerts.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {localAlerts.map((alert) => {
            const weatherSeverity = getWeatherSeverity(
              alert.weather.visibility,
              alert.weather.windSpeed,
              alert.weather.ceiling,
              alert.weather.conditions
            );
            const severityColor = getWeatherSeverityColor(weatherSeverity);

            return (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 ${severityColor}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(alert.severity)}
                    <h4 className="font-semibold">{alert.flightInfo.route}</h4>
                  </div>
                  {getSeverityBadge(alert.severity)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <span className="text-gray-600">Scheduled:</span>
                    <p className="font-medium">
                      {formatDateTime(alert.flightInfo.scheduledTime)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Training Level:</span>
                    <p className="font-medium">{alert.flightInfo.trainingLevel}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    {getWeatherEmoji(alert.weather.conditions)}
                    <span className="font-medium">{alert.weather.conditions}</span>
                  </span>
                  <span>Vis: {alert.weather.visibility}mi</span>
                  <span>Wind: {alert.weather.windSpeed}kt</span>
                  <span>Ceiling: {alert.weather.ceiling}ft</span>
                </div>

                <p className="text-xs text-gray-600 mt-2">
                  Detected {getRelativeTime(alert.detectedAt)}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


// Common type definitions shared across backend
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface FlightPath {
  departure: Coordinates;
  arrival: Coordinates;
  waypoints: Coordinates[]; // 3 waypoints on straight-line path
}

export enum TrainingLevel {
  STUDENT_PILOT = 'STUDENT_PILOT',
  PRIVATE_PILOT = 'PRIVATE_PILOT',
  INSTRUMENT_RATED = 'INSTRUMENT_RATED',
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  AT_RISK = 'AT_RISK',
  RESCHEDULING = 'RESCHEDULING',
  CANCELLED = 'CANCELLED',
}

export enum NotificationType {
  WEATHER_ALERT = 'WEATHER_ALERT',
  OPTIONS_AVAILABLE = 'OPTIONS_AVAILABLE',
  DEADLINE_REMINDER = 'DEADLINE_REMINDER',
  CONFIRMATION = 'CONFIRMATION',
}

export interface WeatherData {
  temperature: number;
  visibility: number; // in statute miles
  ceiling?: number; // in feet AGL
  windSpeed: number; // in knots
  windDirection: number; // in degrees
  precipitation: boolean;
  phenomena: string[]; // fog, rain, thunderstorm, etc.
  timestamp: Date;
}

export interface ValidationResult {
  safe: boolean;
  failedLocation?: string;
  conditions?: WeatherData;
  reason?: string;
}


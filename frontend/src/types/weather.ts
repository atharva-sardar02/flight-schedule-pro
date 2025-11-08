/**
 * Weather Types and Interfaces (Frontend)
 */

export enum TrainingLevel {
  STUDENT_PILOT = 'STUDENT_PILOT',
  PRIVATE_PILOT = 'PRIVATE_PILOT',
  INSTRUMENT_RATED = 'INSTRUMENT_RATED',
}

export enum WeatherProvider {
  OPENWEATHERMAP = 'openweathermap',
  WEATHERAPI = 'weatherapi',
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  location: Coordinates;
  timestamp: string; // ISO string
  visibility: number; // statute miles
  ceiling?: number; // feet AGL
  windSpeed: number; // knots
  windDirection: number; // degrees
  crosswind?: number; // knots
  temperature: number; // Fahrenheit
  humidity: number; // percentage
  pressure: number; // inches of mercury
  conditions: WeatherCondition[];
  provider: WeatherProvider;
}

export interface WeatherCondition {
  type: WeatherConditionType;
  intensity?: 'light' | 'moderate' | 'heavy';
  description: string;
}

export enum WeatherConditionType {
  CLEAR = 'clear',
  CLOUDS = 'clouds',
  RAIN = 'rain',
  SNOW = 'snow',
  FOG = 'fog',
  MIST = 'mist',
  HAZE = 'haze',
  THUNDERSTORM = 'thunderstorm',
  ICE = 'ice',
  CONVECTIVE = 'convective',
}

export interface ValidationResult {
  isValid: boolean;
  violations: WeatherViolation[];
  confidence: number; // 0-100
}

export interface WeatherViolation {
  type: ViolationType;
  location: Coordinates;
  actual: number | WeatherConditionType;
  required: number | WeatherConditionType[];
  severity: 'critical' | 'warning';
}

export enum ViolationType {
  VISIBILITY = 'visibility',
  CEILING = 'ceiling',
  WIND_SPEED = 'wind_speed',
  CROSSWIND = 'crosswind',
  PROHIBITED_CONDITION = 'prohibited_condition',
}

export interface FlightPath {
  departure: Coordinates;
  arrival: Coordinates;
  waypoints: Coordinates[]; // 3 waypoints
}

export interface WeatherCheckResult {
  path: FlightPath;
  weatherData: WeatherData[];
  validation: ValidationResult;
  trainingLevel: TrainingLevel;
  timestamp: string; // ISO string
}


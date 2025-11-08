/**
 * Weather Types and Interfaces (Backend)
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
  timestamp: Date;
  visibility: number; // statute miles
  ceiling?: number; // feet AGL (undefined if clear skies)
  windSpeed: number; // knots
  windDirection: number; // degrees (0-360)
  crosswind?: number; // knots (calculated)
  temperature: number; // Fahrenheit
  humidity: number; // percentage
  pressure: number; // inches of mercury
  conditions: WeatherCondition[];
  provider: WeatherProvider;
  rawData?: any; // Original API response for debugging
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

export interface WeatherMinimums {
  visibility: number; // statute miles
  ceiling?: number; // feet AGL (undefined = clear skies required)
  windSpeed: number; // knots
  crosswind?: number; // knots (optional)
  allowedConditions: WeatherConditionType[];
  prohibitedConditions: WeatherConditionType[];
}

export interface ValidationResult {
  isValid: boolean;
  violations: WeatherViolation[];
  confidence: number; // 0-100, based on provider agreement
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
  waypoints: Coordinates[]; // 3 waypoints along straight-line path
}

export interface WeatherCheckResult {
  path: FlightPath;
  weatherData: WeatherData[]; // One per location (departure, 3 waypoints, arrival)
  validation: ValidationResult;
  trainingLevel: TrainingLevel;
  timestamp: Date;
}

/**
 * Get weather minimums for a training level
 */
export function getWeatherMinimums(level: TrainingLevel): WeatherMinimums {
  switch (level) {
    case TrainingLevel.STUDENT_PILOT:
      return {
        visibility: 5,
        ceiling: undefined, // Clear skies required
        windSpeed: 10,
        crosswind: undefined,
        allowedConditions: [WeatherConditionType.CLEAR],
        prohibitedConditions: [
          WeatherConditionType.RAIN,
          WeatherConditionType.SNOW,
          WeatherConditionType.FOG,
          WeatherConditionType.MIST,
          WeatherConditionType.HAZE,
          WeatherConditionType.THUNDERSTORM,
          WeatherConditionType.ICE,
        ],
      };

    case TrainingLevel.PRIVATE_PILOT:
      return {
        visibility: 3,
        ceiling: 1000,
        windSpeed: 15,
        crosswind: 10,
        allowedConditions: [
          WeatherConditionType.CLEAR,
          WeatherConditionType.CLOUDS,
          WeatherConditionType.RAIN, // Light only
        ],
        prohibitedConditions: [
          WeatherConditionType.THUNDERSTORM,
          WeatherConditionType.ICE,
          WeatherConditionType.CONVECTIVE,
        ],
      };

    case TrainingLevel.INSTRUMENT_RATED:
      return {
        visibility: 0, // IMC acceptable
        ceiling: undefined, // No minimum
        windSpeed: 25,
        crosswind: 15,
        allowedConditions: [
          WeatherConditionType.CLEAR,
          WeatherConditionType.CLOUDS,
          WeatherConditionType.RAIN,
          WeatherConditionType.SNOW,
          WeatherConditionType.FOG,
          WeatherConditionType.MIST,
          WeatherConditionType.HAZE,
        ],
        prohibitedConditions: [
          WeatherConditionType.THUNDERSTORM,
          WeatherConditionType.ICE,
          WeatherConditionType.CONVECTIVE,
        ],
      };

    default:
      // Default to most restrictive (Student Pilot)
      return getWeatherMinimums(TrainingLevel.STUDENT_PILOT);
  }
}


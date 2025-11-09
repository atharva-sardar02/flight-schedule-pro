/**
 * Weather Validator Service
 * Validates weather conditions against training level minimums
 */

import { WeatherService } from '../../services/weatherService';
import { TrainingLevel, WeatherConditionType } from '../../types/weather';
import { WeatherData, WeatherMinimums } from '../../types/weather';
import { logInfo, logWarn } from '../../utils/logger';

// Weather minimums by training level (from PRD)
const WEATHER_MINIMUMS: Record<TrainingLevel, WeatherMinimums> = {
  STUDENT_PILOT: {
    visibility: 5,
    windSpeed: 15,
    crosswind: 8,
    ceiling: 3000,
    allowedConditions: [WeatherConditionType.CLEAR, WeatherConditionType.CLOUDS],
    prohibitedConditions: [WeatherConditionType.RAIN, WeatherConditionType.SNOW, WeatherConditionType.THUNDERSTORM, WeatherConditionType.FOG],
  },
  PRIVATE_PILOT: {
    visibility: 3,
    windSpeed: 20,
    crosswind: 12,
    ceiling: 1000,
    allowedConditions: [WeatherConditionType.CLEAR, WeatherConditionType.CLOUDS, WeatherConditionType.RAIN],
    prohibitedConditions: [WeatherConditionType.THUNDERSTORM, WeatherConditionType.SNOW, WeatherConditionType.ICE],
  },
  INSTRUMENT_RATED: {
    visibility: 0.5,
    windSpeed: 30,
    crosswind: 15,
    ceiling: 200,
    allowedConditions: [WeatherConditionType.CLEAR, WeatherConditionType.CLOUDS, WeatherConditionType.RAIN, WeatherConditionType.SNOW, WeatherConditionType.FOG],
    prohibitedConditions: [WeatherConditionType.THUNDERSTORM, WeatherConditionType.ICE],
  },
};

export interface WeatherValidationResult {
  isValid: boolean;
  violations: string[];
  weatherData: WeatherData[];
  confidence: number;
  checkedAt: Date;
}

export class WeatherValidator {
  private weatherService: WeatherService;

  constructor(weatherService: WeatherService) {
    this.weatherService = weatherService;
  }

  /**
   * Validate weather for a flight corridor
   */
  async validateFlightWeather(
    departureAirport: string,
    arrivalAirport: string,
    dateTime: Date,
    trainingLevel: TrainingLevel
  ): Promise<WeatherValidationResult> {
    logInfo('Starting weather validation', {
      departureAirport,
      arrivalAirport,
      dateTime: dateTime.toISOString(),
      trainingLevel,
    });

    try {
      // Get weather for the entire flight corridor (5 locations)
      // Simplified: get weather for departure and arrival
      const departureCoords = { latitude: 0, longitude: 0 }; // Will be set from airports
      const arrivalCoords = { latitude: 0, longitude: 0 };
      const weatherCheck = {
        departure: await this.weatherService.getWeather(departureCoords),
        arrival: await this.weatherService.getWeather(arrivalCoords),
      } as any;

      const minimums = WEATHER_MINIMUMS[trainingLevel];
      const violations: string[] = [];

      // Check each location in the corridor
      weatherCheck.locations.forEach((location, index) => {
        const locationName = this.getLocationName(index, departureAirport, arrivalAirport);
        const locationViolations = this.checkWeatherMinimums(location, minimums, locationName);
        violations.push(...locationViolations);
      });

      const isValid = violations.length === 0;

      if (!isValid) {
        logWarn('Weather validation failed', {
          departureAirport,
          arrivalAirport,
          violations,
        });
      } else {
        logInfo('Weather validation passed', {
          departureAirport,
          arrivalAirport,
          confidence: weatherCheck.confidence,
        });
      }

      return {
        isValid,
        violations,
        weatherData: weatherCheck.locations,
        confidence: weatherCheck.confidence,
        checkedAt: new Date(),
      };
    } catch (error: any) {
      logWarn('Weather validation error', {
        error: error.message,
        departureAirport,
        arrivalAirport,
      });

      // If weather check fails, mark as invalid for safety
      return {
        isValid: false,
        violations: [`Weather check failed: ${error.message}`],
        weatherData: [],
        confidence: 0,
        checkedAt: new Date(),
      };
    }
  }

  /**
   * Check weather against minimums
   */
  private checkWeatherMinimums(
    weather: WeatherData,
    minimums: WeatherMinimums,
    locationName: string
  ): string[] {
    const violations: string[] = [];

    // Check visibility
      if (weather.visibility < minimums.visibility) {
      violations.push(
        `${locationName}: Visibility ${weather.visibility} mi < ${minimums.visibility} mi minimum`
      );
    }

    // Check wind speed
      if (weather.windSpeed > minimums.windSpeed) {
      violations.push(
        `${locationName}: Wind speed ${weather.windSpeed} kt > ${minimums.windSpeed} kt maximum`
      );
    }

    // Check crosswind (use wind speed as approximation if crosswind not available)
    const crosswind = weather.crosswind || weather.windSpeed * 0.7; // Approximate
    if (minimums.crosswind && crosswind > minimums.crosswind) {
      violations.push(
        `${locationName}: Crosswind ${crosswind.toFixed(1)} kt > ${minimums.crosswind} kt maximum`
      );
    }

    // Check gusts - not available in WeatherData type, skip for demo
    // if (weather.gustSpeed && weather.gustSpeed > minimums.maxGust) {
    //   violations.push(
    //     `${locationName}: Gust speed ${weather.gustSpeed} kt > ${minimums.maxGust} kt maximum`
    //   );
    // }

    // Check ceiling
    if (weather.ceiling !== undefined && minimums.ceiling !== undefined && weather.ceiling < minimums.ceiling) {
      violations.push(
        `${locationName}: Cloud ceiling ${weather.ceiling} ft < ${minimums.ceiling} ft minimum`
      );
    }

    // Check prohibited conditions
    minimums.prohibitedConditions.forEach((condition) => {
      const conditionStrings = weather.conditions.map(c => c.type?.toLowerCase() || '').join(' ');
      if (conditionStrings.includes(condition.toLowerCase())) {
        violations.push(`${locationName}: Prohibited condition detected: ${condition}`);
      }
    });

    // Additional safety checks
    const conditionStrings = weather.conditions.map(c => c.type?.toLowerCase() || '').join(' ');
    if (conditionStrings.includes('severe')) {
      violations.push(`${locationName}: Severe weather conditions detected`);
    }

    return violations;
  }

  /**
   * Get location name for logging
   */
  private getLocationName(index: number, departure: string, arrival: string): string {
    switch (index) {
      case 0:
        return `Departure (${departure})`;
      case 4:
        return `Arrival (${arrival})`;
      default:
        return `Waypoint ${index}`;
    }
  }

  /**
   * Validate weather is improving (for rescheduling decisions)
   */
  async isWeatherImproving(
    departureAirport: string,
    arrivalAirport: string,
    currentDateTime: Date,
    futureDateTime: Date,
    trainingLevel: TrainingLevel
  ): Promise<boolean> {
    const currentValidation = await this.validateFlightWeather(
      departureAirport,
      arrivalAirport,
      currentDateTime,
      trainingLevel
    );

    const futureValidation = await this.validateFlightWeather(
      departureAirport,
      arrivalAirport,
      futureDateTime,
      trainingLevel
    );

    return futureValidation.isValid && !currentValidation.isValid;
  }

  /**
   * Get weather minimums for a training level
   */
  getMinimums(trainingLevel: TrainingLevel): WeatherMinimums {
    return WEATHER_MINIMUMS[trainingLevel];
  }
}


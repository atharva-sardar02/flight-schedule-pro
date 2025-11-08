/**
 * Weather Validator Service
 * Validates weather conditions against training level minimums
 */

import { WeatherService } from '../../services/weatherService';
import { TrainingLevel } from '../../types/booking';
import { WeatherData, WeatherMinimums } from '../../types/weather';
import { logInfo, logWarn } from '../../utils/logger';

// Weather minimums by training level (from PRD)
const WEATHER_MINIMUMS: Record<TrainingLevel, WeatherMinimums> = {
  STUDENT_PILOT: {
    minVisibility: 5,
    maxWindSpeed: 15,
    maxCrosswind: 8,
    maxGust: 5,
    ceilingMinimum: 3000,
    prohibitedConditions: ['rain', 'snow', 'thunderstorm', 'fog'],
  },
  PRIVATE_PILOT: {
    minVisibility: 3,
    maxWindSpeed: 20,
    maxCrosswind: 12,
    maxGust: 10,
    ceilingMinimum: 1000,
    prohibitedConditions: ['thunderstorm', 'snow', 'ice'],
  },
  INSTRUMENT_RATED: {
    minVisibility: 0.5,
    maxWindSpeed: 30,
    maxCrosswind: 15,
    maxGust: 15,
    ceilingMinimum: 200,
    prohibitedConditions: ['thunderstorm', 'ice'],
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
      const weatherCheck = await this.weatherService.checkFlightWeather(
        departureAirport,
        arrivalAirport,
        dateTime
      );

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
    if (weather.visibility < minimums.minVisibility) {
      violations.push(
        `${locationName}: Visibility ${weather.visibility} mi < ${minimums.minVisibility} mi minimum`
      );
    }

    // Check wind speed
    if (weather.windSpeed > minimums.maxWindSpeed) {
      violations.push(
        `${locationName}: Wind speed ${weather.windSpeed} kt > ${minimums.maxWindSpeed} kt maximum`
      );
    }

    // Check crosswind (use wind speed as approximation if crosswind not available)
    const crosswind = weather.crosswind || weather.windSpeed * 0.7; // Approximate
    if (crosswind > minimums.maxCrosswind) {
      violations.push(
        `${locationName}: Crosswind ${crosswind.toFixed(1)} kt > ${minimums.maxCrosswind} kt maximum`
      );
    }

    // Check gusts
    if (weather.gustSpeed && weather.gustSpeed > minimums.maxGust) {
      violations.push(
        `${locationName}: Gust speed ${weather.gustSpeed} kt > ${minimums.maxGust} kt maximum`
      );
    }

    // Check ceiling
    if (weather.cloudCeiling && weather.cloudCeiling < minimums.ceilingMinimum) {
      violations.push(
        `${locationName}: Cloud ceiling ${weather.cloudCeiling} ft < ${minimums.ceilingMinimum} ft minimum`
      );
    }

    // Check prohibited conditions
    minimums.prohibitedConditions.forEach((condition) => {
      if (weather.conditions.toLowerCase().includes(condition.toLowerCase())) {
        violations.push(`${locationName}: Prohibited condition detected: ${condition}`);
      }
    });

    // Additional safety checks
    if (weather.conditions.toLowerCase().includes('severe')) {
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


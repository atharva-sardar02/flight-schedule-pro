/**
 * Weather Service
 * Dual-provider integration with OpenWeatherMap and WeatherAPI.com
 * Implements failover, cross-validation, and caching
 */

import axios, { AxiosError } from 'axios';
import {
  Coordinates,
  WeatherData,
  WeatherProvider,
  WeatherMinimums,
  ValidationResult,
  WeatherViolation,
  ViolationType,
  WeatherConditionType,
  FlightPath,
  WeatherCheckResult,
  TrainingLevel,
  getWeatherMinimums,
} from '../types/weather';
import { getWeatherConfig } from '../config/weather';
import { weatherCache } from '../utils/weatherCache';
import { calculateFlightPath, getWeatherCheckLocations } from '../utils/corridor';
import logger from '../utils/logger';
import { retryWithJitter, CircuitBreaker } from '../utils/retry';

export class WeatherService {
  private config = getWeatherConfig();
  private openWeatherMapCircuit: CircuitBreaker;
  private weatherAPICircuit: CircuitBreaker;

  constructor() {
    // Initialize circuit breakers for each provider
    this.openWeatherMapCircuit = new CircuitBreaker('OpenWeatherMap', {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
    });

    this.weatherAPICircuit = new CircuitBreaker('WeatherAPI', {
      failureThreshold: 5,
      resetTimeout: 60000,
    });
  }

  /**
   * Get weather for a single location
   * Tries primary provider first, falls back to secondary on failure
   */
  async getWeather(coords: Coordinates): Promise<WeatherData> {
    // Check cache first
    const cached = weatherCache.get(coords);
    if (cached) {
      logger.debug('Weather cache hit', { coords });
      return cached;
    }

    // Try OpenWeatherMap first (primary) with circuit breaker and retry
    try {
      const data = await this.openWeatherMapCircuit.execute(() =>
        retryWithJitter(() => this.getWeatherFromOpenWeatherMap(coords), {
          maxRetries: 2,
          initialDelay: 500,
        })
      );
      weatherCache.set(coords, data);
      return data;
    } catch (error) {
      logger.warn('OpenWeatherMap failed, trying WeatherAPI', {
        coords,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to WeatherAPI.com (secondary) with circuit breaker and retry
      try {
        const data = await this.weatherAPICircuit.execute(() =>
          retryWithJitter(() => this.getWeatherFromWeatherAPI(coords), {
            maxRetries: 2,
            initialDelay: 500,
          })
        );
        weatherCache.set(coords, data);
        return data;
      } catch (fallbackError) {
        logger.error('Both weather providers failed', {
          coords,
          primaryError: error instanceof Error ? error.message : 'Unknown',
          fallbackError:
            fallbackError instanceof Error
              ? fallbackError.message
              : 'Unknown',
        });
        throw new Error(
          'Weather service unavailable: both providers failed'
        );
      }
    }
  }

  /**
   * Get weather for a flight path (departure, 3 waypoints, arrival)
   */
  async getWeatherForPath(path: FlightPath): Promise<WeatherData[]> {
    const locations = getWeatherCheckLocations(path);
    const weatherPromises = locations.map((loc) => this.getWeather(loc));

    try {
      return await Promise.all(weatherPromises);
    } catch (error) {
      logger.error('Failed to get weather for flight path', {
        path,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Validate weather against training level minimums
   */
  validateWeather(
    weather: WeatherData,
    minimums: WeatherMinimums
  ): ValidationResult {
    const violations: WeatherViolation[] = [];

    // Check visibility
    if (weather.visibility < minimums.visibility) {
      violations.push({
        type: ViolationType.VISIBILITY,
        location: weather.location,
        actual: weather.visibility,
        required: minimums.visibility,
        severity: 'critical',
      });
    }

    // Check ceiling (if required)
    if (minimums.ceiling !== undefined) {
      if (weather.ceiling === undefined || weather.ceiling < minimums.ceiling) {
        violations.push({
          type: ViolationType.CEILING,
          location: weather.location,
          actual: weather.ceiling ?? 0,
          required: minimums.ceiling,
          severity: 'critical',
        });
      }
    }

    // Check wind speed
    if (weather.windSpeed > minimums.windSpeed) {
      violations.push({
        type: ViolationType.WIND_SPEED,
        location: weather.location,
        actual: weather.windSpeed,
        required: minimums.windSpeed,
        severity: 'critical',
      });
    }

    // Check crosswind (if specified)
    if (minimums.crosswind !== undefined && weather.crosswind !== undefined) {
      if (weather.crosswind > minimums.crosswind) {
        violations.push({
          type: ViolationType.CROSSWIND,
          location: weather.location,
          actual: weather.crosswind,
          required: minimums.crosswind,
          severity: 'critical',
        });
      }
    }

    // Check prohibited conditions
    for (const condition of weather.conditions) {
      if (minimums.prohibitedConditions.includes(condition.type)) {
        violations.push({
          type: ViolationType.PROHIBITED_CONDITION,
          location: weather.location,
          actual: condition.type,
          required: minimums.allowedConditions,
          severity: 'critical',
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      confidence: 100, // Single provider, no cross-validation
    };
  }

  /**
   * Get weather with cross-validation from both providers
   * Returns data with confidence score based on provider agreement
   */
  async getWeatherWithValidation(
    coords: Coordinates
  ): Promise<WeatherData & { confidence: number }> {
    const results: WeatherData[] = [];

    // Try both providers
    const promises = [
      this.getWeatherFromOpenWeatherMap(coords).catch((err) => {
        logger.warn('OpenWeatherMap failed in cross-validation', {
          coords,
          error: err instanceof Error ? err.message : 'Unknown',
        });
        return null;
      }),
      this.getWeatherFromWeatherAPI(coords).catch((err) => {
        logger.warn('WeatherAPI failed in cross-validation', {
          coords,
          error: err instanceof Error ? err.message : 'Unknown',
        });
        return null;
      }),
    ];

    const [openWeatherData, weatherApiData] = await Promise.all(promises);

    if (openWeatherData) results.push(openWeatherData);
    if (weatherApiData) results.push(weatherApiData);

    if (results.length === 0) {
      throw new Error('Both weather providers failed');
    }

    // Calculate confidence based on agreement
    const confidence = this.calculateConfidence(results);

    // Use primary provider's data (or first available)
    const primaryData = openWeatherData || weatherApiData!;

    // Cache the result
    weatherCache.set(coords, primaryData);

    return {
      ...primaryData,
      confidence,
    };
  }

  /**
   * Check weather for a flight path with validation
   */
  async checkWeatherForFlight(
    path: FlightPath,
    trainingLevel: TrainingLevel
  ): Promise<WeatherCheckResult> {
    const minimums = getWeatherMinimums(trainingLevel);
    const weatherData = await this.getWeatherForPath(path);

    // Validate each location
    const validations = weatherData.map((weather) =>
      this.validateWeather(weather, minimums)
    );

    // Overall validation (all locations must be valid)
    const allValid = validations.every((v) => v.isValid);
    const allViolations = validations.flatMap((v) => v.violations);

    // Calculate average confidence
    const avgConfidence =
      validations.reduce((sum, v) => sum + v.confidence, 0) /
      validations.length;

    return {
      path,
      weatherData,
      validation: {
        isValid: allValid,
        violations: allViolations,
        confidence: Math.round(avgConfidence),
      },
      trainingLevel,
      timestamp: new Date(),
    };
  }

  /**
   * Get weather from OpenWeatherMap API
   */
  private async getWeatherFromOpenWeatherMap(
    coords: Coordinates
  ): Promise<WeatherData> {
    if (!this.config.openweathermap.apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    const url = `${this.config.openweathermap.baseUrl}/weather`;
    const params = {
      lat: coords.latitude,
      lon: coords.longitude,
      appid: this.config.openweathermap.apiKey,
      units: 'imperial', // Get data in imperial units
    };

    try {
      const response = await axios.get(url, {
        params,
        timeout: this.config.openweathermap.timeout,
      });

      return this.parseOpenWeatherMapResponse(response.data, coords);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          `OpenWeatherMap API error: ${error.response?.status} ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get weather from WeatherAPI.com
   */
  private async getWeatherFromWeatherAPI(
    coords: Coordinates
  ): Promise<WeatherData> {
    if (!this.config.weatherapi.apiKey) {
      throw new Error('WeatherAPI.com API key not configured');
    }

    const url = `${this.config.weatherapi.baseUrl}/current.json`;
    const params = {
      key: this.config.weatherapi.apiKey,
      q: `${coords.latitude},${coords.longitude}`,
    };

    try {
      const response = await axios.get(url, {
        params,
        timeout: this.config.weatherapi.timeout,
      });

      return this.parseWeatherAPIResponse(response.data, coords);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          `WeatherAPI.com error: ${error.response?.status} ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Parse OpenWeatherMap API response
   */
  private parseOpenWeatherMapResponse(
    data: any,
    coords: Coordinates
  ): WeatherData {
    // Convert visibility from meters to statute miles
    const visibilityMiles = data.visibility
      ? (data.visibility * 0.000621371).toFixed(2)
      : 10; // Default if not provided

    // Calculate ceiling from clouds (if available)
    const ceiling = data.clouds?.all
      ? this.estimateCeilingFromCloudCover(data.clouds.all)
      : undefined;

    // Extract conditions
    const conditions = this.parseOpenWeatherConditions(data.weather || []);

    // Calculate crosswind (simplified - would need runway heading in real scenario)
    const crosswind = this.calculateCrosswind(
      data.wind?.speed || 0,
      data.wind?.deg || 0
    );

    return {
      location: coords,
      timestamp: new Date(),
      visibility: parseFloat(String(visibilityMiles)),
      ceiling,
      windSpeed: data.wind?.speed || 0, // Already in knots from imperial units
      windDirection: data.wind?.deg || 0,
      crosswind,
      temperature: data.main?.temp || 0,
      humidity: data.main?.humidity || 0,
      pressure: (data.main?.pressure || 0) * 0.02953, // Convert hPa to inHg
      conditions,
      provider: WeatherProvider.OPENWEATHERMAP,
      rawData: data,
    };
  }

  /**
   * Parse WeatherAPI.com response
   */
  private parseWeatherAPIResponse(
    data: any,
    coords: Coordinates
  ): WeatherData {
    const current = data.current || {};

    // Visibility is already in miles
    const visibility = current.vis_miles || 10;

    // Estimate ceiling from cloud cover
    const ceiling = current.cloud
      ? this.estimateCeilingFromCloudCover(current.cloud)
      : undefined;

    // Wind speed conversion (mph to knots)
    const windSpeedKnots = (current.wind_mph || 0) * 0.868976;

    // Extract conditions
    const conditions = this.parseWeatherAPIConditions(current.condition || {});

    // Calculate crosswind
    const crosswind = this.calculateCrosswind(
      windSpeedKnots,
      current.wind_degree || 0
    );

    return {
      location: coords,
      timestamp: new Date(),
      visibility,
      ceiling,
      windSpeed: windSpeedKnots,
      windDirection: current.wind_degree || 0,
      crosswind,
      temperature: current.temp_f || 0,
      humidity: current.humidity || 0,
      pressure: (current.pressure_in || 0), // Already in inHg
      conditions,
      provider: WeatherProvider.WEATHERAPI,
      rawData: data,
    };
  }

  /**
   * Parse weather conditions from OpenWeatherMap
   */
  private parseOpenWeatherConditions(weatherArray: any[]): Array<{
    type: WeatherConditionType;
    intensity?: 'light' | 'moderate' | 'heavy';
    description: string;
  }> {
    return weatherArray.map((w) => {
      const main = (w.main || '').toLowerCase();
      const description = w.description || '';

      let type: WeatherConditionType;
      let intensity: 'light' | 'moderate' | 'heavy' | undefined;

      if (main.includes('clear')) {
        type = WeatherConditionType.CLEAR;
      } else if (main.includes('cloud')) {
        type = WeatherConditionType.CLOUDS;
      } else if (main.includes('rain')) {
        type = WeatherConditionType.RAIN;
        if (description.includes('light')) intensity = 'light';
        else if (description.includes('heavy')) intensity = 'heavy';
        else intensity = 'moderate';
      } else if (main.includes('snow')) {
        type = WeatherConditionType.SNOW;
      } else if (main.includes('fog') || main.includes('mist')) {
        type = main.includes('fog') ? WeatherConditionType.FOG : WeatherConditionType.MIST;
      } else if (main.includes('haze')) {
        type = WeatherConditionType.HAZE;
      } else if (main.includes('thunderstorm')) {
        type = WeatherConditionType.THUNDERSTORM;
      } else {
        type = WeatherConditionType.CLEAR; // Default
      }

      return { type, intensity, description };
    });
  }

  /**
   * Parse weather conditions from WeatherAPI.com
   */
  private parseWeatherAPIConditions(condition: any): Array<{
    type: WeatherConditionType;
    intensity?: 'light' | 'moderate' | 'heavy';
    description: string;
  }> {
    const text = (condition.text || '').toLowerCase();
    const code = condition.code || 0;

    let type: WeatherConditionType;
    let intensity: 'light' | 'moderate' | 'heavy' | undefined;

    // WeatherAPI.com condition codes
    if (code === 1000) {
      type = WeatherConditionType.CLEAR;
    } else if (code >= 1003 && code <= 1009) {
      type = WeatherConditionType.CLOUDS;
    } else if (code >= 1063 && code <= 1087) {
      type = WeatherConditionType.RAIN;
      if (code <= 1069) intensity = 'light';
      else if (code >= 1080) intensity = 'heavy';
      else intensity = 'moderate';
    } else if (code >= 1114 && code <= 1117) {
      type = WeatherConditionType.SNOW;
    } else if (code === 1030 || code === 1135) {
      type = WeatherConditionType.FOG;
    } else if (code === 1087 || code >= 1273) {
      type = WeatherConditionType.THUNDERSTORM;
    } else {
      type = WeatherConditionType.CLEAR; // Default
    }

    return [{ type, intensity, description: condition.text || '' }];
  }

  /**
   * Estimate ceiling from cloud cover percentage
   * This is a simplified estimation - real ceiling requires cloud base data
   */
  private estimateCeilingFromCloudCover(cloudCover: number): number | undefined {
    if (cloudCover === 0) {
      return undefined; // Clear skies
    }
    // Rough estimation: higher cloud cover = lower ceiling
    // This is approximate and would need actual cloud base data in production
    if (cloudCover < 25) return 5000;
    if (cloudCover < 50) return 3000;
    if (cloudCover < 75) return 1500;
    return 1000;
  }

  /**
   * Calculate crosswind component
   * Simplified calculation (would need runway heading in real scenario)
   */
  private calculateCrosswind(
    windSpeed: number,
    windDirection: number
  ): number {
    // Simplified: assume 90-degree crosswind for now
    // In production, would calculate based on runway heading
    return windSpeed * Math.sin((windDirection * Math.PI) / 180);
  }

  /**
   * Calculate confidence score based on provider agreement
   */
  private calculateConfidence(results: WeatherData[]): number {
    if (results.length === 1) {
      return 80; // Single provider, moderate confidence
    }

    // Compare key metrics between providers
    const [primary, secondary] = results;

    let agreement = 0;
    let checks = 0;

    // Compare visibility (within 10% difference)
    if (Math.abs(primary.visibility - secondary.visibility) < primary.visibility * 0.1) {
      agreement++;
    }
    checks++;

    // Compare wind speed (within 15% difference)
    if (Math.abs(primary.windSpeed - secondary.windSpeed) < primary.windSpeed * 0.15) {
      agreement++;
    }
    checks++;

    // Compare temperature (within 5% difference)
    if (Math.abs(primary.temperature - secondary.temperature) < Math.abs(primary.temperature) * 0.05) {
      agreement++;
    }
    checks++;

    // Calculate confidence percentage
    const confidence = (agreement / checks) * 100;
    return Math.round(confidence);
  }
}

export default new WeatherService();


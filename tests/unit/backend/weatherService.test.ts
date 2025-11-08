/**
 * Unit tests for weather service
 */

import WeatherService from '../../../../backend/src/services/weatherService';
import {
  Coordinates,
  TrainingLevel,
  WeatherProvider,
  getWeatherMinimums,
} from '../../../../backend/src/types/weather';
import { calculateFlightPath } from '../../../../backend/src/utils/corridor';

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger
jest.mock('../../../../backend/src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock weather cache
jest.mock('../../../../backend/src/utils/weatherCache', () => ({
  weatherCache: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
  },
}));

describe('WeatherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set mock environment variables
    process.env.OPENWEATHERMAP_API_KEY = 'test-openweather-key';
    process.env.WEATHERAPI_API_KEY = 'test-weatherapi-key';
  });

  describe('getWeather', () => {
    it('should fetch weather from OpenWeatherMap successfully', async () => {
      const coords: Coordinates = { latitude: 40.7128, longitude: -74.006 };
      const mockResponse = {
        data: {
          coord: { lat: coords.latitude, lon: coords.longitude },
          weather: [{ main: 'Clear', description: 'clear sky' }],
          main: {
            temp: 70,
            humidity: 60,
            pressure: 1013,
          },
          visibility: 10000, // meters
          wind: {
            speed: 5, // knots (imperial)
            deg: 180,
          },
          clouds: {
            all: 0,
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await WeatherService.getWeather(coords);

      expect(result.provider).toBe(WeatherProvider.OPENWEATHERMAP);
      expect(result.location).toEqual(coords);
      expect(result.visibility).toBeGreaterThan(0);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should fallback to WeatherAPI when OpenWeatherMap fails', async () => {
      const coords: Coordinates = { latitude: 40.7128, longitude: -74.006 };

      // OpenWeatherMap fails
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      // WeatherAPI succeeds
      const mockWeatherAPIResponse = {
        data: {
          location: {
            lat: coords.latitude,
            lon: coords.longitude,
          },
          current: {
            temp_f: 70,
            humidity: 60,
            pressure_in: 29.92,
            vis_miles: 10,
            wind_mph: 5,
            wind_degree: 180,
            cloud: 0,
            condition: {
              text: 'Clear',
              code: 1000,
            },
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockWeatherAPIResponse);

      const result = await WeatherService.getWeather(coords);

      expect(result.provider).toBe(WeatherProvider.WEATHERAPI);
      expect(result.location).toEqual(coords);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error when both providers fail', async () => {
      const coords: Coordinates = { latitude: 40.7128, longitude: -74.006 };

      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(WeatherService.getWeather(coords)).rejects.toThrow(
        'Weather service unavailable'
      );
    });
  });

  describe('validateWeather', () => {
    it('should validate weather against Student Pilot minimums', () => {
      const minimums = getWeatherMinimums(TrainingLevel.STUDENT_PILOT);
      const weather = {
        location: { latitude: 40.7128, longitude: -74.006 },
        timestamp: new Date(),
        visibility: 6, // Above 5 mile minimum
        ceiling: undefined, // Clear skies
        windSpeed: 8, // Below 10 knot maximum
        windDirection: 180,
        crosswind: undefined,
        temperature: 70,
        humidity: 60,
        pressure: 29.92,
        conditions: [{ type: 'clear' as any, description: 'Clear sky' }],
        provider: WeatherProvider.OPENWEATHERMAP,
      };

      const result = WeatherService.validateWeather(weather, minimums);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect visibility violation', () => {
      const minimums = getWeatherMinimums(TrainingLevel.STUDENT_PILOT);
      const weather = {
        location: { latitude: 40.7128, longitude: -74.006 },
        timestamp: new Date(),
        visibility: 3, // Below 5 mile minimum
        ceiling: undefined,
        windSpeed: 8,
        windDirection: 180,
        crosswind: undefined,
        temperature: 70,
        humidity: 60,
        pressure: 29.92,
        conditions: [{ type: 'clear' as any, description: 'Clear sky' }],
        provider: WeatherProvider.OPENWEATHERMAP,
      };

      const result = WeatherService.validateWeather(weather, minimums);

      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].type).toBe('visibility');
    });

    it('should detect prohibited condition violation', () => {
      const minimums = getWeatherMinimums(TrainingLevel.STUDENT_PILOT);
      const weather = {
        location: { latitude: 40.7128, longitude: -74.006 },
        timestamp: new Date(),
        visibility: 6,
        ceiling: undefined,
        windSpeed: 8,
        windDirection: 180,
        crosswind: undefined,
        temperature: 70,
        humidity: 60,
        pressure: 29.92,
        conditions: [{ type: 'rain' as any, description: 'Light rain' }],
        provider: WeatherProvider.OPENWEATHERMAP,
      };

      const result = WeatherService.validateWeather(weather, minimums);

      expect(result.isValid).toBe(false);
      const violation = result.violations.find(
        (v) => v.type === 'prohibited_condition'
      );
      expect(violation).toBeDefined();
    });
  });

  describe('checkWeatherForFlight', () => {
    it('should check weather for entire flight path', async () => {
      const departure: Coordinates = { latitude: 40.7128, longitude: -74.006 };
      const arrival: Coordinates = { latitude: 34.0522, longitude: -118.2437 };
      const path = calculateFlightPath(departure, arrival);

      // Mock weather responses for all 5 locations
      const mockResponse = {
        data: {
          coord: { lat: 40.7128, lon: -74.006 },
          weather: [{ main: 'Clear', description: 'clear sky' }],
          main: { temp: 70, humidity: 60, pressure: 1013 },
          visibility: 10000,
          wind: { speed: 5, deg: 180 },
          clouds: { all: 0 },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await WeatherService.checkWeatherForFlight(
        path,
        TrainingLevel.STUDENT_PILOT
      );

      expect(result.path).toEqual(path);
      expect(result.weatherData).toHaveLength(5);
      expect(result.trainingLevel).toBe(TrainingLevel.STUDENT_PILOT);
      expect(result.validation).toBeDefined();
    });
  });
});


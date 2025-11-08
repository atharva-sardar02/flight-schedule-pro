/**
 * Weather Service Configuration
 */

export interface WeatherConfig {
  openweathermap: {
    apiKey: string;
    baseUrl: string;
    timeout: number; // milliseconds
  };
  weatherapi: {
    apiKey: string;
    baseUrl: string;
    timeout: number; // milliseconds
  };
  cache: {
    ttl: number; // seconds (5 minutes = 300)
    maxSize: number; // maximum cache entries
  };
  validation: {
    crossValidationThreshold: number; // 0-100, minimum agreement percentage
    retryAttempts: number;
    retryDelay: number; // milliseconds
  };
}

export function getWeatherConfig(): WeatherConfig {
  return {
    openweathermap: {
      apiKey: process.env.OPENWEATHERMAP_API_KEY || '',
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      timeout: 5000, // 5 seconds
    },
    weatherapi: {
      apiKey: process.env.WEATHERAPI_API_KEY || '',
      baseUrl: 'https://api.weatherapi.com/v1',
      timeout: 5000, // 5 seconds
    },
    cache: {
      ttl: 300, // 5 minutes
      maxSize: 1000, // Maximum 1000 cached entries
    },
    validation: {
      crossValidationThreshold: 80, // 80% agreement required
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
    },
  };
}


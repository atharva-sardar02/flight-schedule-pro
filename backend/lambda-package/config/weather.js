"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeatherConfig = getWeatherConfig;
function getWeatherConfig() {
    return {
        openweathermap: {
            apiKey: process.env.OPENWEATHERMAP_API_KEY || '',
            baseUrl: 'https://api.openweathermap.org/data/2.5',
            timeout: 5000,
        },
        weatherapi: {
            apiKey: process.env.WEATHERAPI_API_KEY || '',
            baseUrl: 'https://api.weatherapi.com/v1',
            timeout: 5000,
        },
        cache: {
            ttl: 300,
            maxSize: 1000,
        },
        validation: {
            crossValidationThreshold: 80,
            retryAttempts: 3,
            retryDelay: 1000,
        },
    };
}
//# sourceMappingURL=weather.js.map
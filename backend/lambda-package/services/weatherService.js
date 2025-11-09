"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherService = void 0;
const axios_1 = __importStar(require("axios"));
const weather_1 = require("../types/weather");
const weather_2 = require("../config/weather");
const weatherCache_1 = require("../utils/weatherCache");
const corridor_1 = require("../utils/corridor");
const logger_1 = __importDefault(require("../utils/logger"));
const retry_1 = require("../utils/retry");
class WeatherService {
    config = (0, weather_2.getWeatherConfig)();
    openWeatherMapCircuit;
    weatherAPICircuit;
    constructor() {
        this.openWeatherMapCircuit = new retry_1.CircuitBreaker('OpenWeatherMap', {
            failureThreshold: 5,
            resetTimeout: 60000,
        });
        this.weatherAPICircuit = new retry_1.CircuitBreaker('WeatherAPI', {
            failureThreshold: 5,
            resetTimeout: 60000,
        });
    }
    async getWeather(coords) {
        const cached = weatherCache_1.weatherCache.get(coords);
        if (cached) {
            logger_1.default.debug('Weather cache hit', { coords });
            return cached;
        }
        try {
            const data = await this.openWeatherMapCircuit.execute(() => (0, retry_1.retryWithJitter)(() => this.getWeatherFromOpenWeatherMap(coords), {
                maxRetries: 2,
                initialDelay: 500,
            }));
            weatherCache_1.weatherCache.set(coords, data);
            return data;
        }
        catch (error) {
            logger_1.default.warn('OpenWeatherMap failed, trying WeatherAPI', {
                coords,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            try {
                const data = await this.weatherAPICircuit.execute(() => (0, retry_1.retryWithJitter)(() => this.getWeatherFromWeatherAPI(coords), {
                    maxRetries: 2,
                    initialDelay: 500,
                }));
                weatherCache_1.weatherCache.set(coords, data);
                return data;
            }
            catch (fallbackError) {
                logger_1.default.error('Both weather providers failed', {
                    coords,
                    primaryError: error instanceof Error ? error.message : 'Unknown',
                    fallbackError: fallbackError instanceof Error
                        ? fallbackError.message
                        : 'Unknown',
                });
                throw new Error('Weather service unavailable: both providers failed');
            }
        }
    }
    async getWeatherForPath(path) {
        const locations = (0, corridor_1.getWeatherCheckLocations)(path);
        const weatherPromises = locations.map((loc) => this.getWeather(loc));
        try {
            return await Promise.all(weatherPromises);
        }
        catch (error) {
            logger_1.default.error('Failed to get weather for flight path', {
                path,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    validateWeather(weather, minimums) {
        const violations = [];
        if (weather.visibility < minimums.visibility) {
            violations.push({
                type: weather_1.ViolationType.VISIBILITY,
                location: weather.location,
                actual: weather.visibility,
                required: minimums.visibility,
                severity: 'critical',
            });
        }
        if (minimums.ceiling !== undefined) {
            if (weather.ceiling === undefined || weather.ceiling < minimums.ceiling) {
                violations.push({
                    type: weather_1.ViolationType.CEILING,
                    location: weather.location,
                    actual: weather.ceiling ?? 0,
                    required: minimums.ceiling,
                    severity: 'critical',
                });
            }
        }
        if (weather.windSpeed > minimums.windSpeed) {
            violations.push({
                type: weather_1.ViolationType.WIND_SPEED,
                location: weather.location,
                actual: weather.windSpeed,
                required: minimums.windSpeed,
                severity: 'critical',
            });
        }
        if (minimums.crosswind !== undefined && weather.crosswind !== undefined) {
            if (weather.crosswind > minimums.crosswind) {
                violations.push({
                    type: weather_1.ViolationType.CROSSWIND,
                    location: weather.location,
                    actual: weather.crosswind,
                    required: minimums.crosswind,
                    severity: 'critical',
                });
            }
        }
        for (const condition of weather.conditions) {
            if (minimums.prohibitedConditions.includes(condition.type)) {
                violations.push({
                    type: weather_1.ViolationType.PROHIBITED_CONDITION,
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
            confidence: 100,
        };
    }
    async getWeatherWithValidation(coords) {
        const results = [];
        const promises = [
            this.getWeatherFromOpenWeatherMap(coords).catch((err) => {
                logger_1.default.warn('OpenWeatherMap failed in cross-validation', {
                    coords,
                    error: err instanceof Error ? err.message : 'Unknown',
                });
                return null;
            }),
            this.getWeatherFromWeatherAPI(coords).catch((err) => {
                logger_1.default.warn('WeatherAPI failed in cross-validation', {
                    coords,
                    error: err instanceof Error ? err.message : 'Unknown',
                });
                return null;
            }),
        ];
        const [openWeatherData, weatherApiData] = await Promise.all(promises);
        if (openWeatherData)
            results.push(openWeatherData);
        if (weatherApiData)
            results.push(weatherApiData);
        if (results.length === 0) {
            throw new Error('Both weather providers failed');
        }
        const confidence = this.calculateConfidence(results);
        const primaryData = openWeatherData || weatherApiData;
        weatherCache_1.weatherCache.set(coords, primaryData);
        return {
            ...primaryData,
            confidence,
        };
    }
    async checkWeatherForFlight(path, trainingLevel) {
        const minimums = (0, weather_1.getWeatherMinimums)(trainingLevel);
        const weatherData = await this.getWeatherForPath(path);
        const validations = weatherData.map((weather) => this.validateWeather(weather, minimums));
        const allValid = validations.every((v) => v.isValid);
        const allViolations = validations.flatMap((v) => v.violations);
        const avgConfidence = validations.reduce((sum, v) => sum + v.confidence, 0) /
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
    async getWeatherFromOpenWeatherMap(coords) {
        if (!this.config.openweathermap.apiKey) {
            throw new Error('OpenWeatherMap API key not configured');
        }
        const url = `${this.config.openweathermap.baseUrl}/weather`;
        const params = {
            lat: coords.latitude,
            lon: coords.longitude,
            appid: this.config.openweathermap.apiKey,
            units: 'imperial',
        };
        try {
            const response = await axios_1.default.get(url, {
                params,
                timeout: this.config.openweathermap.timeout,
            });
            return this.parseOpenWeatherMapResponse(response.data, coords);
        }
        catch (error) {
            if (error instanceof axios_1.AxiosError) {
                throw new Error(`OpenWeatherMap API error: ${error.response?.status} ${error.message}`);
            }
            throw error;
        }
    }
    async getWeatherFromWeatherAPI(coords) {
        if (!this.config.weatherapi.apiKey) {
            throw new Error('WeatherAPI.com API key not configured');
        }
        const url = `${this.config.weatherapi.baseUrl}/current.json`;
        const params = {
            key: this.config.weatherapi.apiKey,
            q: `${coords.latitude},${coords.longitude}`,
        };
        try {
            const response = await axios_1.default.get(url, {
                params,
                timeout: this.config.weatherapi.timeout,
            });
            return this.parseWeatherAPIResponse(response.data, coords);
        }
        catch (error) {
            if (error instanceof axios_1.AxiosError) {
                throw new Error(`WeatherAPI.com error: ${error.response?.status} ${error.message}`);
            }
            throw error;
        }
    }
    parseOpenWeatherMapResponse(data, coords) {
        const visibilityMiles = data.visibility
            ? (data.visibility * 0.000621371).toFixed(2)
            : 10;
        const ceiling = data.clouds?.all
            ? this.estimateCeilingFromCloudCover(data.clouds.all)
            : undefined;
        const conditions = this.parseOpenWeatherConditions(data.weather || []);
        const crosswind = this.calculateCrosswind(data.wind?.speed || 0, data.wind?.deg || 0);
        return {
            location: coords,
            timestamp: new Date(),
            visibility: parseFloat(String(visibilityMiles)),
            ceiling,
            windSpeed: data.wind?.speed || 0,
            windDirection: data.wind?.deg || 0,
            crosswind,
            temperature: data.main?.temp || 0,
            humidity: data.main?.humidity || 0,
            pressure: (data.main?.pressure || 0) * 0.02953,
            conditions,
            provider: weather_1.WeatherProvider.OPENWEATHERMAP,
            rawData: data,
        };
    }
    parseWeatherAPIResponse(data, coords) {
        const current = data.current || {};
        const visibility = current.vis_miles || 10;
        const ceiling = current.cloud
            ? this.estimateCeilingFromCloudCover(current.cloud)
            : undefined;
        const windSpeedKnots = (current.wind_mph || 0) * 0.868976;
        const conditions = this.parseWeatherAPIConditions(current.condition || {});
        const crosswind = this.calculateCrosswind(windSpeedKnots, current.wind_degree || 0);
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
            pressure: (current.pressure_in || 0),
            conditions,
            provider: weather_1.WeatherProvider.WEATHERAPI,
            rawData: data,
        };
    }
    parseOpenWeatherConditions(weatherArray) {
        return weatherArray.map((w) => {
            const main = (w.main || '').toLowerCase();
            const description = w.description || '';
            let type;
            let intensity;
            if (main.includes('clear')) {
                type = weather_1.WeatherConditionType.CLEAR;
            }
            else if (main.includes('cloud')) {
                type = weather_1.WeatherConditionType.CLOUDS;
            }
            else if (main.includes('rain')) {
                type = weather_1.WeatherConditionType.RAIN;
                if (description.includes('light'))
                    intensity = 'light';
                else if (description.includes('heavy'))
                    intensity = 'heavy';
                else
                    intensity = 'moderate';
            }
            else if (main.includes('snow')) {
                type = weather_1.WeatherConditionType.SNOW;
            }
            else if (main.includes('fog') || main.includes('mist')) {
                type = main.includes('fog') ? weather_1.WeatherConditionType.FOG : weather_1.WeatherConditionType.MIST;
            }
            else if (main.includes('haze')) {
                type = weather_1.WeatherConditionType.HAZE;
            }
            else if (main.includes('thunderstorm')) {
                type = weather_1.WeatherConditionType.THUNDERSTORM;
            }
            else {
                type = weather_1.WeatherConditionType.CLEAR;
            }
            return { type, intensity, description };
        });
    }
    parseWeatherAPIConditions(condition) {
        const text = (condition.text || '').toLowerCase();
        const code = condition.code || 0;
        let type;
        let intensity;
        if (code === 1000) {
            type = weather_1.WeatherConditionType.CLEAR;
        }
        else if (code >= 1003 && code <= 1009) {
            type = weather_1.WeatherConditionType.CLOUDS;
        }
        else if (code >= 1063 && code <= 1087) {
            type = weather_1.WeatherConditionType.RAIN;
            if (code <= 1069)
                intensity = 'light';
            else if (code >= 1080)
                intensity = 'heavy';
            else
                intensity = 'moderate';
        }
        else if (code >= 1114 && code <= 1117) {
            type = weather_1.WeatherConditionType.SNOW;
        }
        else if (code === 1030 || code === 1135) {
            type = weather_1.WeatherConditionType.FOG;
        }
        else if (code === 1087 || code >= 1273) {
            type = weather_1.WeatherConditionType.THUNDERSTORM;
        }
        else {
            type = weather_1.WeatherConditionType.CLEAR;
        }
        return [{ type, intensity, description: condition.text || '' }];
    }
    estimateCeilingFromCloudCover(cloudCover) {
        if (cloudCover === 0) {
            return undefined;
        }
        if (cloudCover < 25)
            return 5000;
        if (cloudCover < 50)
            return 3000;
        if (cloudCover < 75)
            return 1500;
        return 1000;
    }
    calculateCrosswind(windSpeed, windDirection) {
        return windSpeed * Math.sin((windDirection * Math.PI) / 180);
    }
    calculateConfidence(results) {
        if (results.length === 1) {
            return 80;
        }
        const [primary, secondary] = results;
        let agreement = 0;
        let checks = 0;
        if (Math.abs(primary.visibility - secondary.visibility) < primary.visibility * 0.1) {
            agreement++;
        }
        checks++;
        if (Math.abs(primary.windSpeed - secondary.windSpeed) < primary.windSpeed * 0.15) {
            agreement++;
        }
        checks++;
        if (Math.abs(primary.temperature - secondary.temperature) < Math.abs(primary.temperature) * 0.05) {
            agreement++;
        }
        checks++;
        const confidence = (agreement / checks) * 100;
        return Math.round(confidence);
    }
}
exports.WeatherService = WeatherService;
exports.default = new WeatherService();
//# sourceMappingURL=weatherService.js.map
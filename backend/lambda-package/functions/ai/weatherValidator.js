"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherValidator = void 0;
const weather_1 = require("../../types/weather");
const logger_1 = require("../../utils/logger");
const WEATHER_MINIMUMS = {
    STUDENT_PILOT: {
        visibility: 5,
        windSpeed: 15,
        crosswind: 8,
        ceiling: 3000,
        allowedConditions: [weather_1.WeatherConditionType.CLEAR, weather_1.WeatherConditionType.CLOUDS],
        prohibitedConditions: [weather_1.WeatherConditionType.RAIN, weather_1.WeatherConditionType.SNOW, weather_1.WeatherConditionType.THUNDERSTORM, weather_1.WeatherConditionType.FOG],
    },
    PRIVATE_PILOT: {
        visibility: 3,
        windSpeed: 20,
        crosswind: 12,
        ceiling: 1000,
        allowedConditions: [weather_1.WeatherConditionType.CLEAR, weather_1.WeatherConditionType.CLOUDS, weather_1.WeatherConditionType.RAIN],
        prohibitedConditions: [weather_1.WeatherConditionType.THUNDERSTORM, weather_1.WeatherConditionType.SNOW, weather_1.WeatherConditionType.ICE],
    },
    INSTRUMENT_RATED: {
        visibility: 0.5,
        windSpeed: 30,
        crosswind: 15,
        ceiling: 200,
        allowedConditions: [weather_1.WeatherConditionType.CLEAR, weather_1.WeatherConditionType.CLOUDS, weather_1.WeatherConditionType.RAIN, weather_1.WeatherConditionType.SNOW, weather_1.WeatherConditionType.FOG],
        prohibitedConditions: [weather_1.WeatherConditionType.THUNDERSTORM, weather_1.WeatherConditionType.ICE],
    },
};
class WeatherValidator {
    weatherService;
    constructor(weatherService) {
        this.weatherService = weatherService;
    }
    async validateFlightWeather(departureAirport, arrivalAirport, dateTime, trainingLevel) {
        (0, logger_1.logInfo)('Starting weather validation', {
            departureAirport,
            arrivalAirport,
            dateTime: dateTime.toISOString(),
            trainingLevel,
        });
        try {
            const departureCoords = { latitude: 0, longitude: 0 };
            const arrivalCoords = { latitude: 0, longitude: 0 };
            const weatherCheck = {
                departure: await this.weatherService.getWeather(departureCoords),
                arrival: await this.weatherService.getWeather(arrivalCoords),
            };
            const minimums = WEATHER_MINIMUMS[trainingLevel];
            const violations = [];
            weatherCheck.locations.forEach((location, index) => {
                const locationName = this.getLocationName(index, departureAirport, arrivalAirport);
                const locationViolations = this.checkWeatherMinimums(location, minimums, locationName);
                violations.push(...locationViolations);
            });
            const isValid = violations.length === 0;
            if (!isValid) {
                (0, logger_1.logWarn)('Weather validation failed', {
                    departureAirport,
                    arrivalAirport,
                    violations,
                });
            }
            else {
                (0, logger_1.logInfo)('Weather validation passed', {
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
        }
        catch (error) {
            (0, logger_1.logWarn)('Weather validation error', {
                error: error.message,
                departureAirport,
                arrivalAirport,
            });
            return {
                isValid: false,
                violations: [`Weather check failed: ${error.message}`],
                weatherData: [],
                confidence: 0,
                checkedAt: new Date(),
            };
        }
    }
    checkWeatherMinimums(weather, minimums, locationName) {
        const violations = [];
        if (weather.visibility < minimums.visibility) {
            violations.push(`${locationName}: Visibility ${weather.visibility} mi < ${minimums.visibility} mi minimum`);
        }
        if (weather.windSpeed > minimums.windSpeed) {
            violations.push(`${locationName}: Wind speed ${weather.windSpeed} kt > ${minimums.windSpeed} kt maximum`);
        }
        const crosswind = weather.crosswind || weather.windSpeed * 0.7;
        if (minimums.crosswind && crosswind > minimums.crosswind) {
            violations.push(`${locationName}: Crosswind ${crosswind.toFixed(1)} kt > ${minimums.crosswind} kt maximum`);
        }
        if (weather.ceiling !== undefined && minimums.ceiling !== undefined && weather.ceiling < minimums.ceiling) {
            violations.push(`${locationName}: Cloud ceiling ${weather.ceiling} ft < ${minimums.ceiling} ft minimum`);
        }
        minimums.prohibitedConditions.forEach((condition) => {
            const conditionStrings = weather.conditions.map(c => c.type?.toLowerCase() || '').join(' ');
            if (conditionStrings.includes(condition.toLowerCase())) {
                violations.push(`${locationName}: Prohibited condition detected: ${condition}`);
            }
        });
        const conditionStrings = weather.conditions.map(c => c.type?.toLowerCase() || '').join(' ');
        if (conditionStrings.includes('severe')) {
            violations.push(`${locationName}: Severe weather conditions detected`);
        }
        return violations;
    }
    getLocationName(index, departure, arrival) {
        switch (index) {
            case 0:
                return `Departure (${departure})`;
            case 4:
                return `Arrival (${arrival})`;
            default:
                return `Waypoint ${index}`;
        }
    }
    async isWeatherImproving(departureAirport, arrivalAirport, currentDateTime, futureDateTime, trainingLevel) {
        const currentValidation = await this.validateFlightWeather(departureAirport, arrivalAirport, currentDateTime, trainingLevel);
        const futureValidation = await this.validateFlightWeather(departureAirport, arrivalAirport, futureDateTime, trainingLevel);
        return futureValidation.isValid && !currentValidation.isValid;
    }
    getMinimums(trainingLevel) {
        return WEATHER_MINIMUMS[trainingLevel];
    }
}
exports.WeatherValidator = WeatherValidator;
//# sourceMappingURL=weatherValidator.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViolationType = exports.WeatherConditionType = exports.WeatherProvider = exports.TrainingLevel = void 0;
exports.getWeatherMinimums = getWeatherMinimums;
var TrainingLevel;
(function (TrainingLevel) {
    TrainingLevel["STUDENT_PILOT"] = "STUDENT_PILOT";
    TrainingLevel["PRIVATE_PILOT"] = "PRIVATE_PILOT";
    TrainingLevel["INSTRUMENT_RATED"] = "INSTRUMENT_RATED";
})(TrainingLevel || (exports.TrainingLevel = TrainingLevel = {}));
var WeatherProvider;
(function (WeatherProvider) {
    WeatherProvider["OPENWEATHERMAP"] = "openweathermap";
    WeatherProvider["WEATHERAPI"] = "weatherapi";
})(WeatherProvider || (exports.WeatherProvider = WeatherProvider = {}));
var WeatherConditionType;
(function (WeatherConditionType) {
    WeatherConditionType["CLEAR"] = "clear";
    WeatherConditionType["CLOUDS"] = "clouds";
    WeatherConditionType["RAIN"] = "rain";
    WeatherConditionType["SNOW"] = "snow";
    WeatherConditionType["FOG"] = "fog";
    WeatherConditionType["MIST"] = "mist";
    WeatherConditionType["HAZE"] = "haze";
    WeatherConditionType["THUNDERSTORM"] = "thunderstorm";
    WeatherConditionType["ICE"] = "ice";
    WeatherConditionType["CONVECTIVE"] = "convective";
})(WeatherConditionType || (exports.WeatherConditionType = WeatherConditionType = {}));
var ViolationType;
(function (ViolationType) {
    ViolationType["VISIBILITY"] = "visibility";
    ViolationType["CEILING"] = "ceiling";
    ViolationType["WIND_SPEED"] = "wind_speed";
    ViolationType["CROSSWIND"] = "crosswind";
    ViolationType["PROHIBITED_CONDITION"] = "prohibited_condition";
})(ViolationType || (exports.ViolationType = ViolationType = {}));
function getWeatherMinimums(level) {
    switch (level) {
        case TrainingLevel.STUDENT_PILOT:
            return {
                visibility: 5,
                ceiling: undefined,
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
                    WeatherConditionType.RAIN,
                ],
                prohibitedConditions: [
                    WeatherConditionType.THUNDERSTORM,
                    WeatherConditionType.ICE,
                    WeatherConditionType.CONVECTIVE,
                ],
            };
        case TrainingLevel.INSTRUMENT_RATED:
            return {
                visibility: 0,
                ceiling: undefined,
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
            return getWeatherMinimums(TrainingLevel.STUDENT_PILOT);
    }
}
//# sourceMappingURL=weather.js.map
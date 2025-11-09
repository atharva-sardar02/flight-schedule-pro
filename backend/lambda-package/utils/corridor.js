"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFlightPath = calculateFlightPath;
exports.calculateDistance = calculateDistance;
exports.getWeatherCheckLocations = getWeatherCheckLocations;
function calculateFlightPath(departure, arrival) {
    const waypoints = [
        calculateWaypoint(departure, arrival, 0.25),
        calculateWaypoint(departure, arrival, 0.5),
        calculateWaypoint(departure, arrival, 0.75),
    ];
    return {
        departure,
        arrival,
        waypoints,
    };
}
function calculateWaypoint(start, end, fraction) {
    const latitude = start.latitude + (end.latitude - start.latitude) * fraction;
    const longitude = start.longitude + (end.longitude - start.longitude) * fraction;
    return {
        latitude: round(latitude, 6),
        longitude: round(longitude, 6),
    };
}
function calculateDistance(point1, point2) {
    const R = 3959;
    const dLat = toRadians(point2.latitude - point1.latitude);
    const dLon = toRadians(point2.longitude - point1.longitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(point1.latitude)) *
            Math.cos(toRadians(point2.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return round(distance, 2);
}
function getWeatherCheckLocations(path) {
    return [path.departure, ...path.waypoints, path.arrival];
}
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
function round(value, decimals) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
//# sourceMappingURL=corridor.js.map
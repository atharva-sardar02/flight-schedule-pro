/**
 * Flight Corridor Calculator
 * Calculates waypoints along a straight-line path between departure and arrival
 */

import { Coordinates, FlightPath } from '../types/weather';

/**
 * Calculate 3 evenly-spaced waypoints along a straight-line path
 * between departure and arrival coordinates
 */
export function calculateFlightPath(
  departure: Coordinates,
  arrival: Coordinates
): FlightPath {
  // Calculate waypoints at 25%, 50%, and 75% of the path
  const waypoints: Coordinates[] = [
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

/**
 * Calculate a waypoint at a specific fraction along the path
 * @param start Starting coordinates
 * @param end Ending coordinates
 * @param fraction Fraction along the path (0.0 to 1.0)
 * @returns Coordinates of the waypoint
 */
function calculateWaypoint(
  start: Coordinates,
  end: Coordinates,
  fraction: number
): Coordinates {
  const latitude = start.latitude + (end.latitude - start.latitude) * fraction;
  const longitude =
    start.longitude + (end.longitude - start.longitude) * fraction;

  return {
    latitude: round(latitude, 6),
    longitude: round(longitude, 6),
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @returns Distance in statute miles
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 3959; // Earth's radius in statute miles

  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return round(distance, 2);
}

/**
 * Get all locations to check weather for (departure, 3 waypoints, arrival)
 */
export function getWeatherCheckLocations(path: FlightPath): Coordinates[] {
  return [path.departure, ...path.waypoints, path.arrival];
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Round a number to specified decimal places
 */
function round(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}


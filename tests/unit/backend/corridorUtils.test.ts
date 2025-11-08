/**
 * Unit tests for corridor calculator utilities
 */

import {
  calculateFlightPath,
  calculateDistance,
  getWeatherCheckLocations,
} from '../../../../backend/src/utils/corridor';
import { Coordinates, FlightPath } from '../../../../backend/src/types/weather';

describe('Corridor Calculator', () => {
  describe('calculateFlightPath', () => {
    it('should calculate 3 waypoints between departure and arrival', () => {
      const departure: Coordinates = { latitude: 40.7128, longitude: -74.006 };
      const arrival: Coordinates = { latitude: 34.0522, longitude: -118.2437 };

      const path = calculateFlightPath(departure, arrival);

      expect(path.departure).toEqual(departure);
      expect(path.arrival).toEqual(arrival);
      expect(path.waypoints).toHaveLength(3);

      // Check waypoints are between departure and arrival
      path.waypoints.forEach((waypoint) => {
        expect(waypoint.latitude).toBeGreaterThanOrEqual(
          Math.min(departure.latitude, arrival.latitude)
        );
        expect(waypoint.latitude).toBeLessThanOrEqual(
          Math.max(departure.latitude, arrival.latitude)
        );
        expect(waypoint.longitude).toBeGreaterThanOrEqual(
          Math.min(departure.longitude, arrival.longitude)
        );
        expect(waypoint.longitude).toBeLessThanOrEqual(
          Math.max(departure.longitude, arrival.longitude)
        );
      });
    });

    it('should handle same departure and arrival coordinates', () => {
      const coords: Coordinates = { latitude: 40.7128, longitude: -74.006 };
      const path = calculateFlightPath(coords, coords);

      expect(path.departure).toEqual(coords);
      expect(path.arrival).toEqual(coords);
      expect(path.waypoints).toHaveLength(3);
      path.waypoints.forEach((waypoint) => {
        expect(waypoint.latitude).toBeCloseTo(coords.latitude, 4);
        expect(waypoint.longitude).toBeCloseTo(coords.longitude, 4);
      });
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      const point1: Coordinates = { latitude: 40.7128, longitude: -74.006 };
      const point2: Coordinates = { latitude: 34.0522, longitude: -118.2437 };

      const distance = calculateDistance(point1, point2);

      // Distance between NYC and LA is approximately 2445 miles
      expect(distance).toBeGreaterThan(2400);
      expect(distance).toBeLessThan(2500);
    });

    it('should return 0 for identical coordinates', () => {
      const coords: Coordinates = { latitude: 40.7128, longitude: -74.006 };
      const distance = calculateDistance(coords, coords);
      expect(distance).toBe(0);
    });
  });

  describe('getWeatherCheckLocations', () => {
    it('should return all 5 locations (departure, 3 waypoints, arrival)', () => {
      const path: FlightPath = {
        departure: { latitude: 40.7128, longitude: -74.006 },
        arrival: { latitude: 34.0522, longitude: -118.2437 },
        waypoints: [
          { latitude: 38.0, longitude: -90.0 },
          { latitude: 36.0, longitude: -100.0 },
          { latitude: 34.5, longitude: -110.0 },
        ],
      };

      const locations = getWeatherCheckLocations(path);

      expect(locations).toHaveLength(5);
      expect(locations[0]).toEqual(path.departure);
      expect(locations[1]).toEqual(path.waypoints[0]);
      expect(locations[2]).toEqual(path.waypoints[1]);
      expect(locations[3]).toEqual(path.waypoints[2]);
      expect(locations[4]).toEqual(path.arrival);
    });
  });
});


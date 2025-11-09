/**
 * Weather Utility Functions
 * Helper functions for weather data processing and display
 */

/**
 * Get weather condition emoji
 */
export function getWeatherEmoji(condition: string): string {
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    return '☀️';
  } else if (conditionLower.includes('cloud')) {
    return '☁️';
  } else if (conditionLower.includes('rain')) {
    return '🌧️';
  } else if (conditionLower.includes('snow')) {
    return '❄️';
  } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
    return '🌫️';
  } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
    return '⛈️';
  } else if (conditionLower.includes('wind')) {
    return '💨';
  }
  
  return '🌤️';
}

/**
 * Get weather severity level
 */
export function getWeatherSeverity(
  visibility: number,
  windSpeed: number,
  ceiling: number,
  conditions: string
): 'safe' | 'caution' | 'unsafe' {
  const conditionsLower = conditions.toLowerCase();
  
  // Unsafe conditions
  if (
    visibility < 3 ||
    windSpeed > 25 ||
    ceiling < 1000 ||
    conditionsLower.includes('thunder') ||
    conditionsLower.includes('ice') ||
    conditionsLower.includes('severe')
  ) {
    return 'unsafe';
  }
  
  // Caution conditions
  if (
    visibility < 5 ||
    windSpeed > 15 ||
    ceiling < 3000 ||
    conditionsLower.includes('rain') ||
    conditionsLower.includes('fog')
  ) {
    return 'caution';
  }
  
  return 'safe';
}

/**
 * Get weather severity color
 */
export function getWeatherSeverityColor(severity: 'safe' | 'caution' | 'unsafe'): string {
  switch (severity) {
    case 'safe':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'caution':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'unsafe':
      return 'text-red-600 bg-red-50 border-red-200';
  }
}

/**
 * Format visibility in miles
 */
export function formatVisibility(visibilityMiles: number): string {
  if (visibilityMiles >= 10) {
    return '10+ mi';
  }
  return `${visibilityMiles.toFixed(1)} mi`;
}

/**
 * Format wind speed and direction
 */
export function formatWind(speed: number, direction?: number): string {
  const directionStr = direction ? ` from ${getWindDirection(direction)}` : '';
  return `${speed} kt${directionStr}`;
}

/**
 * Get cardinal wind direction
 */
export function getWindDirection(degrees: number): string {
  const directions: string[] = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5);
  return directions[index % 16] || 'N';
}

/**
 * Format ceiling in feet
 */
export function formatCeiling(ceilingFeet: number): string {
  if (ceilingFeet >= 10000) {
    return '10,000+ ft';
  }
  return `${ceilingFeet.toLocaleString()} ft`;
}

/**
 * Get training level display name
 */
export function getTrainingLevelName(level: string): string {
  switch (level.toUpperCase()) {
    case 'STUDENT_PILOT':
      return 'Student Pilot';
    case 'PRIVATE_PILOT':
      return 'Private Pilot';
    case 'INSTRUMENT_RATED':
      return 'Instrument Rated';
    default:
      return level;
  }
}

/**
 * Check if weather meets minimums for training level
 */
export function meetsWeatherMinimums(
  weather: {
    visibility: number;
    windSpeed: number;
    ceiling: number;
    conditions: string;
  },
  trainingLevel: string
): boolean {
  const conditionsLower = weather.conditions.toLowerCase();
  
  switch (trainingLevel.toUpperCase()) {
    case 'STUDENT_PILOT':
      return (
        weather.visibility >= 5 &&
        weather.windSpeed <= 15 &&
        weather.ceiling >= 3000 &&
        !conditionsLower.includes('rain') &&
        !conditionsLower.includes('snow') &&
        !conditionsLower.includes('fog')
      );
      
    case 'PRIVATE_PILOT':
      return (
        weather.visibility >= 3 &&
        weather.windSpeed <= 20 &&
        weather.ceiling >= 1000 &&
        !conditionsLower.includes('thunder') &&
        !conditionsLower.includes('severe')
      );
      
    case 'INSTRUMENT_RATED':
      return (
        weather.visibility >= 0.5 &&
        weather.windSpeed <= 30 &&
        weather.ceiling >= 200 &&
        !conditionsLower.includes('ice') &&
        !conditionsLower.includes('severe')
      );
      
    default:
      return false;
  }
}


/**
 * In-Memory Weather Cache
 * Implements 5-minute TTL as specified in requirements
 */

import { Coordinates, WeatherData } from '../types/weather';
import { getWeatherConfig } from '../config/weather';

interface CacheEntry {
  data: WeatherData;
  timestamp: number; // Unix timestamp in milliseconds
}

class WeatherCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config = getWeatherConfig();

  /**
   * Generate cache key from coordinates
   */
  private getCacheKey(coords: Coordinates, provider?: string): string {
    const lat = coords.latitude.toFixed(4);
    const lon = coords.longitude.toFixed(4);
    const providerSuffix = provider ? `:${provider}` : '';
    return `${lat},${lon}${providerSuffix}`;
  }

  /**
   * Get weather data from cache if valid
   */
  get(coords: Coordinates, provider?: string): WeatherData | null {
    const key = this.getCacheKey(coords, provider);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry is still valid (within TTL)
    const age = Date.now() - entry.timestamp;
    const ttlMs = this.config.cache.ttl * 1000;

    if (age > ttlMs) {
      // Entry expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store weather data in cache
   */
  set(coords: Coordinates, data: WeatherData): void {
    // Enforce max size by removing oldest entries if needed
    if (this.cache.size >= this.config.cache.maxSize) {
      this.evictOldest();
    }

    const key = this.getCacheKey(coords, data.provider);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove expired entries from cache
   */
  cleanup(): number {
    const ttlMs = this.config.cache.ttl * 1000;
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > ttlMs) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.cache.maxSize,
      ttl: this.config.cache.ttl,
    };
  }

  /**
   * Evict oldest entry (FIFO)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Singleton instance
export const weatherCache = new WeatherCache();

// Periodic cleanup (every minute)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    weatherCache.cleanup();
  }, 60000); // 1 minute
}


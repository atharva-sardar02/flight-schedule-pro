"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weatherCache = void 0;
const weather_1 = require("../config/weather");
class WeatherCache {
    cache = new Map();
    config = (0, weather_1.getWeatherConfig)();
    getCacheKey(coords, provider) {
        const lat = Math.round(coords.latitude * 100) / 100;
        const lon = Math.round(coords.longitude * 100) / 100;
        const providerSuffix = provider ? `:${provider}` : '';
        return `${lat},${lon}${providerSuffix}`;
    }
    get(coords, provider) {
        const key = this.getCacheKey(coords, provider);
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        const age = Date.now() - entry.timestamp;
        const ttlMs = this.config.cache.ttl * 1000;
        if (age > ttlMs) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    set(coords, data) {
        if (this.cache.size >= this.config.cache.maxSize) {
            this.evictOldest();
        }
        const key = this.getCacheKey(coords, data.provider);
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }
    cleanup() {
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
    clear() {
        this.cache.clear();
    }
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.config.cache.maxSize,
            ttl: this.config.cache.ttl,
        };
    }
    evictOldest() {
        let oldestKey = null;
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
exports.weatherCache = new WeatherCache();
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        exports.weatherCache.cleanup();
    }, 60000);
}
//# sourceMappingURL=weatherCache.js.map
/**
 * Request Cache Service - Memoization and caching with TTL
 */

import { loggerService } from './loggerService';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class RequestCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private maxCacheSize = 1000;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key from function and arguments
   */
  private generateKey(fn: string, args: any[]): string {
    return `${fn}:${JSON.stringify(args)}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      loggerService.debug('RequestCacheService', `Cache miss: ${key}`);
      return null;
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      loggerService.debug('RequestCacheService', `Cache expired: ${key}`);
      return null;
    }

    loggerService.debug('RequestCacheService', `Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Cleanup if cache too large
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    loggerService.debug('RequestCacheService', `Cache set: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Execute with caching
   */
  async withCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function
    const result = await fn();

    // Store in cache
    this.set(key, result, ttl);

    return result;
  }

  /**
   * Memoize async function
   */
  memoize<Args extends any[], T>(
    fn: (...args: Args) => Promise<T>,
    ttl: number = this.defaultTTL
  ): (...args: Args) => Promise<T> {
    const fnName = fn.name || 'anonymous';

    return async (...args: Args): Promise<T> => {
      const key = this.generateKey(fnName, args);
      return this.withCache(key, () => fn(...args), ttl);
    };
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    loggerService.debug('RequestCacheService', `Cache invalidated: ${key}`);
  }

  /**
   * Invalidate by pattern
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    loggerService.info('RequestCacheService', `Invalidated ${count} entries matching pattern: ${pattern}`);
    return count;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    loggerService.info('RequestCacheService', 'Cache cleared');
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      loggerService.debug('RequestCacheService', `Evicted oldest entry: ${oldestKey}`);
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    let totalSize = 0;
    let validEntries = 0;

    for (const entry of this.cache.values()) {
      if (this.isValid(entry)) {
        validEntries++;
        totalSize += JSON.stringify(entry.data).length;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      maxCacheSize: this.maxCacheSize
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      loggerService.info('RequestCacheService', `Cleaned up ${removed} expired entries`);
    }

    return removed;
  }
}

export const requestCacheService = new RequestCacheService();

// Periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestCacheService.cleanup();
  }, 60000); // Every minute
}

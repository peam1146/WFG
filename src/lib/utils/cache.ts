// Cache utilities for Server Components and data operations
// Provides in-memory caching with TTL and size limits for performance

import { logger } from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100; // 100 entries default
  }

  /**
   * Get cached data by key
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      logger.debug('Cache entry expired', { key, age: now - entry.timestamp });
      return null;
    }

    logger.debug('Cache hit', { key, age: now - entry.timestamp });
    return entry.data;
  }

  /**
   * Set cached data with optional TTL
   */
  set(key: string, data: T, ttl?: number): void {
    // Enforce size limit
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
    logger.debug('Cache set', { key, ttl: entry.ttl, size: this.cache.size });
  }

  /**
   * Delete cached data by key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache entry deleted', { key });
    }
    return deleted;
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.debug('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Evict oldest entry when cache is full
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug('Cache entry evicted', { key: oldestKey });
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug('Cache cleanup completed', { removedCount });
    }

    return removedCount;
  }
}

// Cache instances for different data types
export const gitCommitsCache = new MemoryCache({
  ttl: 2 * 60 * 1000, // 2 minutes for Git commits
  maxSize: 50
});

export const summariesCache = new MemoryCache({
  ttl: 10 * 60 * 1000, // 10 minutes for summaries
  maxSize: 100
});

export const repositoryCache = new MemoryCache({
  ttl: 30 * 60 * 1000, // 30 minutes for repository validation
  maxSize: 20
});

/**
 * Generate cache key for Git commits
 */
export function generateGitCommitsCacheKey(author: string, since: Date, repositoryPath: string): string {
  return `git:${author}:${since.toISOString()}:${repositoryPath}`;
}

/**
 * Generate cache key for summaries
 */
export function generateSummariesCacheKey(author: string, since: Date, repositoryUrl: string): string {
  return `summaries:${author}:${since.toISOString()}:${repositoryUrl}`;
}

/**
 * Generate cache key for repository validation
 */
export function generateRepositoryCacheKey(repositoryPath: string): string {
  return `repo:${repositoryPath}`;
}

/**
 * Cached function wrapper with automatic key generation
 */
export function withCache<TArgs extends any[], TReturn>(
  cache: MemoryCache<TReturn>,
  keyGenerator: (...args: TArgs) => string,
  ttl?: number
) {
  return function cacheWrapper(
    fn: (...args: TArgs) => Promise<TReturn>
  ) {
    return async (...args: TArgs): Promise<TReturn> => {
      const key = keyGenerator(...args);
      
      // Try to get from cache first
      const cached = cache.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      try {
        const result = await fn(...args);
        cache.set(key, result, ttl);
        return result;
      } catch (error) {
        logger.error('Cached function execution failed', { key }, error instanceof Error ? error : undefined);
        throw error;
      }
    };
  };
}

/**
 * Periodic cleanup of all caches
 */
export function startCacheCleanup(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
  return setInterval(() => {
    const gitRemoved = gitCommitsCache.cleanup();
    const summariesRemoved = summariesCache.cleanup();
    const repoRemoved = repositoryCache.cleanup();
    
    const totalRemoved = gitRemoved + summariesRemoved + repoRemoved;
    if (totalRemoved > 0) {
      logger.info('Periodic cache cleanup completed', {
        gitCommitsRemoved: gitRemoved,
        summariesRemoved: summariesRemoved,
        repositoryRemoved: repoRemoved,
        totalRemoved
      });
    }
  }, intervalMs);
}

/**
 * Get overall cache statistics
 */
export function getAllCacheStats() {
  return {
    gitCommits: gitCommitsCache.getStats(),
    summaries: summariesCache.getStats(),
    repository: repositoryCache.getStats()
  };
}

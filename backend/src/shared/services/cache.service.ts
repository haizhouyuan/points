import { RedisConnection } from '@shared/cache/redis';
import { Logger } from '@shared/utils/logger';

export class CacheService {
  private redis?: RedisConnection;
  private logger: Logger;
  private memoryCache: Map<string, { value: any; expires: number }>;

  constructor(redis?: RedisConnection) {
    this.redis = redis;
    this.logger = new Logger('CacheService');
    this.memoryCache = new Map();
    
    // Cleanup expired memory cache entries every 5 minutes
    setInterval(() => {
      this.cleanupMemoryCache();
    }, 5 * 60 * 1000);
  }

  async get(key: string): Promise<string | null> {
    try {
      // Try Redis first if available
      if (this.redis) {
        const value = await this.redis.get(key);
        if (value !== null) {
          this.logger.debug('Cache hit (Redis)', { key });
          return value;
        }
      }

      // Fallback to memory cache
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem) {
        if (Date.now() < memoryItem.expires) {
          this.logger.debug('Cache hit (Memory)', { key });
          return memoryItem.value;
        } else {
          this.memoryCache.delete(key);
        }
      }

      this.logger.debug('Cache miss', { key });
      return null;

    } catch (error) {
      this.logger.error('Cache get error', { error, key });
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      // Set in Redis if available
      if (this.redis) {
        const success = await this.redis.setex(key, ttlSeconds, value);
        if (success) {
          this.logger.debug('Cache set (Redis)', { key, ttl: ttlSeconds });
        }
      }

      // Also set in memory cache as fallback
      const expires = Date.now() + (ttlSeconds * 1000);
      this.memoryCache.set(key, { value, expires });
      
      this.logger.debug('Cache set (Memory)', { key, ttl: ttlSeconds });
      return true;

    } catch (error) {
      this.logger.error('Cache set error', { error, key });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      let success = true;

      // Delete from Redis if available
      if (this.redis) {
        const deleted = await this.redis.del(key);
        success = deleted > 0;
        if (success) {
          this.logger.debug('Cache delete (Redis)', { key });
        }
      }

      // Delete from memory cache
      const memoryDeleted = this.memoryCache.delete(key);
      if (memoryDeleted) {
        this.logger.debug('Cache delete (Memory)', { key });
      }

      return success || memoryDeleted;

    } catch (error) {
      this.logger.error('Cache delete error', { error, key });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      // Check Redis first if available
      if (this.redis) {
        const exists = await this.redis.exists(key);
        if (exists) {
          return true;
        }
      }

      // Check memory cache
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem && Date.now() < memoryItem.expires) {
        return true;
      }

      return false;

    } catch (error) {
      this.logger.error('Cache exists error', { error, key });
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      let allKeys: string[] = [];

      // Get keys from Redis if available
      if (this.redis) {
        const redisKeys = await this.redis.keys(pattern);
        allKeys = allKeys.concat(redisKeys);
      }

      // Get keys from memory cache
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const [key, item] of this.memoryCache.entries()) {
        if (regex.test(key) && Date.now() < item.expires) {
          if (!allKeys.includes(key)) {
            allKeys.push(key);
          }
        }
      }

      return allKeys;

    } catch (error) {
      this.logger.error('Cache keys error', { error, pattern });
      return [];
    }
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    const results: (string | null)[] = new Array(keys.length).fill(null);

    for (let i = 0; i < keys.length; i++) {
      results[i] = await this.get(keys[i]);
    }

    return results;
  }

  async mset(keyValuePairs: Record<string, string>, ttlSeconds: number = 3600): Promise<boolean> {
    let allSuccess = true;

    for (const [key, value] of Object.entries(keyValuePairs)) {
      const success = await this.set(key, value, ttlSeconds);
      if (!success) {
        allSuccess = false;
      }
    }

    return allSuccess;
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      // Try Redis first if available
      if (this.redis) {
        const newValue = await this.redis.incrby(key, amount);
        this.logger.debug('Cache increment (Redis)', { key, amount, newValue });
        return newValue;
      }

      // Fallback to memory cache
      const current = await this.get(key);
      const currentValue = current ? parseInt(current, 10) || 0 : 0;
      const newValue = currentValue + amount;
      
      await this.set(key, newValue.toString());
      this.logger.debug('Cache increment (Memory)', { key, amount, newValue });
      
      return newValue;

    } catch (error) {
      this.logger.error('Cache increment error', { error, key, amount });
      throw error;
    }
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    return this.increment(key, -amount);
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      // Update Redis TTL if available
      if (this.redis) {
        const success = await this.redis.expire(key, ttlSeconds);
        if (success) {
          this.logger.debug('Cache expire (Redis)', { key, ttl: ttlSeconds });
        }
      }

      // Update memory cache expiration
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem) {
        memoryItem.expires = Date.now() + (ttlSeconds * 1000);
        this.logger.debug('Cache expire (Memory)', { key, ttl: ttlSeconds });
        return true;
      }

      return false;

    } catch (error) {
      this.logger.error('Cache expire error', { error, key, ttl: ttlSeconds });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      // Check Redis first if available
      if (this.redis) {
        const ttl = await this.redis.ttl(key);
        if (ttl >= 0) {
          return ttl;
        }
      }

      // Check memory cache
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem) {
        const remainingMs = memoryItem.expires - Date.now();
        return Math.max(0, Math.floor(remainingMs / 1000));
      }

      return -2; // Key doesn't exist

    } catch (error) {
      this.logger.error('Cache ttl error', { error, key });
      return -1;
    }
  }

  async flush(): Promise<boolean> {
    try {
      let success = true;

      // Flush Redis if available
      if (this.redis) {
        success = await this.redis.flushall();
        if (success) {
          this.logger.info('Cache flushed (Redis)');
        }
      }

      // Clear memory cache
      this.memoryCache.clear();
      this.logger.info('Cache flushed (Memory)');

      return success;

    } catch (error) {
      this.logger.error('Cache flush error', { error });
      return false;
    }
  }

  // Utility methods for common patterns
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttlSeconds: number = 3600,
    serializer?: {
      serialize: (data: T) => string;
      deserialize: (data: string) => T;
    }
  ): Promise<T> {
    const cached = await this.get(key);
    
    if (cached) {
      try {
        return serializer ? serializer.deserialize(cached) : JSON.parse(cached);
      } catch (error) {
        this.logger.warn('Cache deserialization error', { error, key });
        await this.delete(key);
      }
    }

    // Fetch fresh data
    const freshData = await fetcher();
    
    // Store in cache
    const serialized = serializer ? serializer.serialize(freshData) : JSON.stringify(freshData);
    await this.set(key, serialized, ttlSeconds);
    
    return freshData;
  }

  async setHash(key: string, hash: Record<string, string>, ttlSeconds: number = 3600): Promise<boolean> {
    return this.set(key, JSON.stringify(hash), ttlSeconds);
  }

  async getHash(key: string): Promise<Record<string, string> | null> {
    const value = await this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (error) {
      this.logger.error('Hash deserialization error', { error, key });
      return null;
    }
  }

  // Memory cache cleanup
  private cleanupMemoryCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.memoryCache.entries()) {
      if (now >= item.expires) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug('Memory cache cleanup completed', { 
        cleaned, 
        remaining: this.memoryCache.size 
      });
    }
  }

  // Cache statistics
  getStats(): {
    memoryCache: {
      size: number;
      keys: string[];
    };
    redisConnected: boolean;
  } {
    return {
      memoryCache: {
        size: this.memoryCache.size,
        keys: Array.from(this.memoryCache.keys())
      },
      redisConnected: !!this.redis
    };
  }
}
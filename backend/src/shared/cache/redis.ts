import { createClient, RedisClientType } from 'redis';
import { Logger } from '@shared/utils/logger';

export class RedisConnection {
  private client: RedisClientType | null = null;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('RedisConnection');
  }

  public async connect(): Promise<void> {
    try {
      const redisConfig: any = {
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          connectTimeout: 2000,  // 2 second timeout
          lazyConnect: true,     // Don't auto-reconnect
        },
        database: parseInt(process.env.REDIS_DB || '0', 10),
        retry_delay_on_failure: 0,  // No retry on failure
      };
      
      // Only add password if it exists
      if (process.env.REDIS_PASSWORD) {
        redisConfig.password = process.env.REDIS_PASSWORD;
      }

      this.client = createClient(redisConfig);

      // 错误处理 - but don't flood logs
      this.client.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') {
          this.logger.debug('Redis connection refused (expected in dev without Redis)');
        } else {
          this.logger.error('Redis client error:', error);
        }
      });

      this.client.on('connect', () => {
        this.logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        this.logger.info('Redis client ready');
      });

      this.client.on('end', () => {
        this.logger.info('Redis client disconnected');
      });

      // Set a timeout for connection attempt
      await Promise.race([
        this.client.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 3000)
        )
      ]);
      
      this.logger.info('Redis connection established');

    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      // Clean up client if connection failed
      if (this.client) {
        try {
          await this.client.disconnect();
        } catch (e) {
          // Ignore cleanup errors
        }
        this.client = null;
      }
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
        this.logger.info('Redis connection closed');
      }
    } catch (error) {
      this.logger.error('Error closing Redis connection:', error);
      throw error;
    }
  }

  public getClient(): RedisClientType | null {
    return this.client;
  }

  public async isConnected(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  // 缓存辅助方法
  public async get(key: string): Promise<string | null> {
    if (!this.client) throw new Error('Redis client not connected');
    return await this.client.get(key);
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) throw new Error('Redis client not connected');
    
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.client) throw new Error('Redis client not connected');
    await this.client.del(key);
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.client) throw new Error('Redis client not connected');
    const result = await this.client.exists(key);
    return result === 1;
  }

  public async hGet(key: string, field: string): Promise<string | undefined> {
    if (!this.client) throw new Error('Redis client not connected');
    return await this.client.hGet(key, field);
  }

  public async hSet(key: string, field: string, value: string): Promise<void> {
    if (!this.client) throw new Error('Redis client not connected');
    await this.client.hSet(key, field, value);
  }

  public async hGetAll(key: string): Promise<Record<string, string>> {
    if (!this.client) throw new Error('Redis client not connected');
    return await this.client.hGetAll(key);
  }

  public async expire(key: string, seconds: number): Promise<void> {
    if (!this.client) throw new Error('Redis client not connected');
    await this.client.expire(key, seconds);
  }
}
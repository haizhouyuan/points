import { Request, Response, NextFunction } from 'express';
import { RedisConnection } from '@shared/cache/redis';
import { Logger } from '@shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface IdempotentRequest extends Request {
  idempotencyKey: string;
}

export class IdempotencyMiddleware {
  private static logger = new Logger('IdempotencyMiddleware');
  private static redis: RedisConnection;

  public static initialize(redis: RedisConnection): void {
    IdempotencyMiddleware.redis = redis;
  }

  public static enforce(ttlSeconds: number = 3600) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // 只处理写操作
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        return next();
      }

      try {
        const idempotencyKey = req.headers['idempotency-key'] as string;
        
        if (!idempotencyKey) {
          return next(); // 没有幂等键，正常处理
        }

        // 验证幂等键格式
        if (typeof idempotencyKey !== 'string' || idempotencyKey.length > 255) {
          res.status(400).json({
            code: 'INVALID_IDEMPOTENCY_KEY',
            message: '幂等键格式无效',
            requestId: req.headers['x-request-id'] || 'unknown'
          });
          return;
        }

        const client = IdempotencyMiddleware.redis?.getClient();
        if (!client) {
          IdempotencyMiddleware.logger.warn('Redis not available, skipping idempotency check');
          (req as IdempotentRequest).idempotencyKey = idempotencyKey;
          return next();
        }

        const userId = (req as any).user?.userId || 'anonymous';
        const redisKey = `idempotency:${userId}:${idempotencyKey}`;

        // 检查是否已存在
        const existingResult = await client.get(redisKey);
        
        if (existingResult) {
          // 返回缓存的响应
          const cachedResponse = JSON.parse(existingResult);
          
          IdempotencyMiddleware.logger.info('Returning cached idempotent response', {
            idempotencyKey,
            userId,
          });

          res.set('Idempotent-Replayed', 'true');
          res.status(cachedResponse.statusCode).json(cachedResponse.body);
          return;
        }

        // 存储幂等键，标记为处理中
        (req as IdempotentRequest).idempotencyKey = idempotencyKey;

        // 拦截响应以缓存结果
        const originalSend = res.send;
        const originalJson = res.json;

        let responseBody: any;
        let statusCode = 200;

        res.send = function(body: any) {
          responseBody = body;
          statusCode = res.statusCode;
          return originalSend.call(this, body);
        };

        res.json = function(body: any) {
          responseBody = body;
          statusCode = res.statusCode;
          
          // 缓存成功响应（2xx状态码）
          if (statusCode >= 200 && statusCode < 300) {
            IdempotencyMiddleware.cacheResponse(redisKey, statusCode, body, ttlSeconds);
          }

          return originalJson.call(this, body);
        };

        next();

      } catch (error) {
        IdempotencyMiddleware.logger.error('Idempotency middleware error:', error);
        next(); // 出错时不阻塞请求
      }
    };
  }

  private static async cacheResponse(
    key: string,
    statusCode: number,
    body: any,
    ttlSeconds: number
  ): Promise<void> {
    try {
      const client = IdempotencyMiddleware.redis?.getClient();
      if (!client) return;

      const responseData = {
        statusCode,
        body,
        timestamp: new Date().toISOString(),
      };

      await client.setEx(key, ttlSeconds, JSON.stringify(responseData));
      
      IdempotencyMiddleware.logger.debug('Cached idempotent response', { key });
    } catch (error) {
      IdempotencyMiddleware.logger.error('Failed to cache idempotent response:', error);
    }
  }

  // 用于在业务逻辑中检查幂等性
  public static async isProcessed(userId: string, idempotencyKey: string): Promise<boolean> {
    try {
      const client = IdempotencyMiddleware.redis?.getClient();
      if (!client) return false;

      const redisKey = `idempotency:${userId}:${idempotencyKey}`;
      const exists = await client.exists(redisKey);
      
      return exists === 1;
    } catch (error) {
      IdempotencyMiddleware.logger.error('Failed to check idempotency:', error);
      return false;
    }
  }

  // 为业务逻辑存储幂等性结果
  public static async storeResult(
    userId: string,
    idempotencyKey: string,
    result: any,
    ttlSeconds: number = 3600
  ): Promise<void> {
    try {
      const client = IdempotencyMiddleware.redis?.getClient();
      if (!client) return;

      const redisKey = `idempotency:${userId}:${idempotencyKey}`;
      await client.setEx(redisKey, ttlSeconds, JSON.stringify({
        result,
        timestamp: new Date().toISOString(),
      }));

    } catch (error) {
      IdempotencyMiddleware.logger.error('Failed to store idempotent result:', error);
    }
  }

  // 获取已存储的幂等性结果
  public static async getStoredResult(userId: string, idempotencyKey: string): Promise<any> {
    try {
      const client = IdempotencyMiddleware.redis?.getClient();
      if (!client) return null;

      const redisKey = `idempotency:${userId}:${idempotencyKey}`;
      const stored = await client.get(redisKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.result;
      }

      return null;
    } catch (error) {
      IdempotencyMiddleware.logger.error('Failed to get stored idempotent result:', error);
      return null;
    }
  }

  // 生成幂等键的辅助方法
  public static generateKey(operation: string, ...params: string[]): string {
    const timestamp = Date.now();
    const random = uuidv4().substring(0, 8);
    const paramStr = params.join('_');
    
    return `${operation}_${paramStr}_${timestamp}_${random}`;
  }
}
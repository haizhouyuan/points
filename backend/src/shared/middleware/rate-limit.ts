import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { RedisConnection } from '@shared/cache/redis';
import { Logger } from '@shared/utils/logger';

export class RateLimitMiddleware {
  private static logger = new Logger('RateLimitMiddleware');
  private static redis: RedisConnection;

  public static initialize(redis: RedisConnection): void {
    RateLimitMiddleware.redis = redis;
  }

  // 通用限流配置
  public static general() {
    return rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 每个IP每15分钟最多100次请求
      message: {
        code: 'RATE_LIMITED',
        message: '请求过于频繁，请稍后再试',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        RateLimitMiddleware.logger.warn('Rate limit exceeded:', {
          ip: req.ip,
          url: req.url,
          userAgent: req.get('User-Agent')
        });
        
        res.status(429).json({
          code: 'RATE_LIMITED',
          message: '请求过于频繁，请稍后再试',
          retryAfter: '15 minutes',
          requestId: req.headers['x-request-id'] || 'unknown'
        });
      }
    });
  }

  // 登录限流 - 更严格
  public static auth() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 5, // 每个IP每15分钟最多5次登录尝试
      message: {
        code: 'AUTH_RATE_LIMITED',
        message: '登录尝试过于频繁，请15分钟后再试',
        retryAfter: '15 minutes'
      },
      skipSuccessfulRequests: true, // 成功的请求不计入限制
    });
  }

  // 文件上传限流
  public static fileUpload() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1小时
      max: 50, // 每小时最多上传50个文件
      message: {
        code: 'UPLOAD_RATE_LIMITED',
        message: '文件上传过于频繁，请1小时后再试',
        retryAfter: '1 hour'
      },
    });
  }

  // 社交互动限流（点赞、评论等）
  public static social() {
    return rateLimit({
      windowMs: 60 * 1000, // 1分钟
      max: 30, // 每分钟最多30次社交操作
      message: {
        code: 'SOCIAL_RATE_LIMITED',
        message: '社交操作过于频繁，请稍后再试',
        retryAfter: '1 minute'
      },
    });
  }

  // 基于用户的限流（需要认证后使用）
  public static createUserRateLimit(
    maxRequests: number,
    windowMinutes: number,
    keyGenerator?: (req: Request) => string
  ) {
    return async (req: Request, res: Response, next: any) => {
      if (!RateLimitMiddleware.redis) {
        return next(); // Redis未连接，跳过限流
      }

      try {
        const key = keyGenerator ? keyGenerator(req) : 
          `rate_limit:user:${(req as any).user?.userId || req.ip}`;
        const windowMs = windowMinutes * 60 * 1000;
        const now = Date.now();
        const window = Math.floor(now / windowMs);
        const redisKey = `${key}:${window}`;

        const client = RateLimitMiddleware.redis.getClient();
        if (!client) {
          return next();
        }

        // 获取当前计数
        const current = await client.get(redisKey);
        const count = current ? parseInt(current) : 0;

        if (count >= maxRequests) {
          const resetTime = new Date((window + 1) * windowMs);
          
          res.set({
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toISOString(),
          });

          return res.status(429).json({
            code: 'RATE_LIMITED',
            message: '请求过于频繁，请稍后再试',
            retryAfter: resetTime.toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          });
        }

        // 增加计数
        await client.multi()
          .incr(redisKey)
          .expire(redisKey, windowMinutes * 60)
          .exec();

        // 设置响应头
        res.set({
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': (maxRequests - count - 1).toString(),
          'X-RateLimit-Reset': new Date((window + 1) * windowMs).toISOString(),
        });

        next();

      } catch (error) {
        RateLimitMiddleware.logger.error('Rate limit error:', error);
        next(); // 出错时不阻塞请求
      }
    };
  }

  // 特定操作的限流
  public static taskCompletion() {
    return RateLimitMiddleware.createUserRateLimit(
      100, // 每小时最多完成100个任务
      60,
      (req) => `task_completion:${(req as any).user?.userId}`
    );
  }

  public static pointsRedemption() {
    return RateLimitMiddleware.createUserRateLimit(
      10, // 每小时最多申请10次兑换
      60,
      (req) => `redemption:${(req as any).user?.userId}`
    );
  }

  public static achievementClaim() {
    return RateLimitMiddleware.createUserRateLimit(
      50, // 每小时最多领取50个成就
      60,
      (req) => `achievement_claim:${(req as any).user?.userId}`
    );
  }
}
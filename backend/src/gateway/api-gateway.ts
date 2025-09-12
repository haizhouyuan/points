import { Router, Request, Response } from 'express';
import { EventBus } from '@shared/events/event-bus';
import { Logger } from '@shared/utils/logger';
import { AuthMiddleware } from '@shared/middleware/auth';
import { RateLimitMiddleware } from '@shared/middleware/rate-limit';
import { IdempotencyMiddleware } from '@shared/middleware/idempotency';
import { v4 as uuidv4 } from 'uuid';

// 模块路由导入
import { createAuthRoutes } from '@modules/auth';
// import { pointsRoutes } from '@modules/points';
// import { taskRoutes } from '@modules/tasks';
// import { gamificationRoutes } from '@modules/gamification';
// import { fileRoutes } from '@modules/files';
// import { analyticsRoutes } from '@modules/analytics';
// import { socialRoutes } from '@modules/social';
// import { notificationRoutes } from '@modules/notifications';

export class APIGateway {
  private router: Router;
  private logger: Logger;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.router = Router();
    this.logger = new Logger('APIGateway');
    this.eventBus = eventBus;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Debug middleware - log all requests coming into APIGateway
    this.router.use((req: Request, res: Response, next) => {
      console.log('APIGateway received request:', {
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl
      });
      next();
    });

    // 请求ID中间件
    this.router.use((req: Request, res: Response, next) => {
      if (!req.headers['x-request-id']) {
        req.headers['x-request-id'] = uuidv4();
      }
      res.setHeader('x-request-id', req.headers['x-request-id'] as string);
      next();
    });

    // 通用限流 - temporarily disabled for debugging
    // this.router.use(RateLimitMiddleware.general());

    // 幂等性中间件（适用于所有写操作）- temporarily disabled for debugging
    // this.router.use(IdempotencyMiddleware.enforce());

    // 请求日志
    this.router.use((req: Request, res: Response, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.headers['x-request-id'],
        };

        if (res.statusCode >= 400) {
          this.logger.warn('HTTP Error', logData);
        } else {
          this.logger.info('HTTP Request', logData);
        }
      });

      next();
    });
  }

  private setupRoutes(): void {
    // Debug route - simple test
    this.router.get('/v1/debug', (req: Request, res: Response) => {
      console.log('DEBUG ROUTE HIT!', {
        path: req.path,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl
      });
      res.json({
        message: 'API Gateway is working!',
        timestamp: new Date().toISOString(),
        path: req.path,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl
      });
    });

    // API信息端点
    this.router.get('/v1', (req: Request, res: Response) => {
      res.json({
        name: 'Summer Vacation Planning API',
        version: '1.0.0',
        description: '暑假规划应用后端API',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          docs: '/docs',
          auth: '/auth',
          tasks: '/tasks',
          users: '/users',
          families: '/families',
          points: '/points',
          achievements: '/achievements',
          skills: '/skills',
          social: '/social',
          notifications: '/notifications',
          files: '/files',
          analytics: '/analytics',
          recommendations: '/recommendations',
        }
      });
    });

    // 文档端点  
    this.router.get('/v1/docs', (req: Request, res: Response) => {
      res.json({
        name: 'Summer Vacation Planning API',
        version: '1.0.0',
        description: '暑假规划应用后端API',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          docs: '/docs',
          auth: '/auth',
          tasks: '/tasks',
          users: '/users',
          families: '/families',
          points: '/points',
          achievements: '/achievements',
          skills: '/skills',
          social: '/social',
          notifications: '/notifications',
          files: '/files',
          analytics: '/analytics',
          recommendations: '/recommendations',
        }
      });
    });

    // 文档端点
    this.router.get('/docs', (req: Request, res: Response) => {
      res.json({
        message: 'API文档开发中',
        openapi: '3.1.0',
        swagger_ui: '/docs/ui',
        postman_collection: '/docs/postman.json',
      });
    });

    // 临时测试端点（开发阶段）
    this.setupTestEndpoints();

    // 注册各个业务模块的路由 - updated paths for v1 API structure
    this.router.use('/v1/auth', createAuthRoutes(this.eventBus));
    // this.router.use('/points', AuthMiddleware.authenticate, pointsRoutes);
    // this.router.use('/tasks', AuthMiddleware.authenticate, taskRoutes);
    // this.router.use('/gamification', AuthMiddleware.authenticate, gamificationRoutes);
    // this.router.use('/files', AuthMiddleware.authenticate, fileRoutes);
    // this.router.use('/analytics', AuthMiddleware.authenticate, analyticsRoutes);
    // this.router.use('/social', AuthMiddleware.authenticate, socialRoutes);
    // this.router.use('/notifications', AuthMiddleware.authenticate, notificationRoutes);
  }

  private setupTestEndpoints(): void {
    // 仅在开发环境启用测试端点
    if (process.env.NODE_ENV === 'development') {
      // 认证测试端点
      this.router.post('/v1/test/auth', (req: Request, res: Response) => {
        res.json({
          message: '认证模块测试端点',
          body: req.body,
          timestamp: new Date().toISOString(),
        });
      });

      // 受保护端点测试
      this.router.get('/test/protected', 
        AuthMiddleware.authenticate,
        (req: Request, res: Response) => {
          const user = (req as any).user;
          res.json({
            message: '认证成功',
            user: {
              userId: user.userId,
              familyId: user.familyId,
              role: user.role,
              email: user.email,
            },
            timestamp: new Date().toISOString(),
          });
        }
      );

      // 权限测试端点
      this.router.get('/test/parent-only',
        AuthMiddleware.authenticate,
        AuthMiddleware.requireParent(),
        (req: Request, res: Response) => {
          res.json({
            message: '家长权限验证成功',
            timestamp: new Date().toISOString(),
          });
        }
      );

      // 限流测试端点
      this.router.post('/test/rate-limit',
        RateLimitMiddleware.createUserRateLimit(5, 1), // 每分钟5次
        (req: Request, res: Response) => {
          res.json({
            message: '限流测试成功',
            timestamp: new Date().toISOString(),
          });
        }
      );

      // 事件总线测试端点
      this.router.post('/test/event',
        AuthMiddleware.authenticate,
        async (req: Request, res: Response, next) => {
          try {
            const { eventType, payload } = req.body;
            const user = (req as any).user;

            await this.eventBus.publish(eventType, payload, {
              userId: user.userId,
              familyId: user.familyId,
            });

            res.json({
              message: '事件发布成功',
              eventType,
              payload,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            next(error);
          }
        }
      );

      // 文件上传测试端点
      this.router.post('/test/upload',
        RateLimitMiddleware.fileUpload(),
        (req: Request, res: Response) => {
          res.json({
            message: '文件上传测试端点',
            files: req.files,
            timestamp: new Date().toISOString(),
          });
        }
      );

      // 错误测试端点
      this.router.get('/test/error/:type', (req: Request, res: Response, next) => {
        const { type } = req.params;

        switch (type) {
          case 'validation':
            return next(new Error('验证错误测试'));
          case 'auth':
            return next(new Error('认证错误测试'));
          case 'permission':
            return next(new Error('权限错误测试'));
          case 'not-found':
            return next(new Error('资源未找到测试'));
          case 'server':
            return next(new Error('服务器错误测试'));
          default:
            return next(new Error('未知错误类型'));
        }
      });

      this.logger.info('Test endpoints enabled in development mode');
    }
  }

  public getRouter(): Router {
    return this.router;
  }

  // 注册模块路由的方法
  public registerModule(path: string, moduleRouter: Router): void {
    this.router.use(path, moduleRouter);
    this.logger.info(`Module registered at path: ${path}`);
  }

  // 注册需要认证的模块
  public registerAuthenticatedModule(path: string, moduleRouter: Router): void {
    this.router.use(path, AuthMiddleware.authenticate, moduleRouter);
    this.logger.info(`Authenticated module registered at path: ${path}`);
  }

  // 注册需要家庭隔离的模块
  public registerFamilyModule(path: string, moduleRouter: Router): void {
    this.router.use(
      path,
      AuthMiddleware.authenticate,
      AuthMiddleware.familyIsolation,
      moduleRouter
    );
    this.logger.info(`Family-isolated module registered at path: ${path}`);
  }
}
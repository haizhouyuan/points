import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

import { DatabaseConnection } from '@shared/database/connection';
import { RedisConnection } from '@shared/cache/redis';
import { EventBus } from '@shared/events/event-bus';
// Temporarily disabled due to compilation errors
// import { GamificationEventHandler } from '@shared/events/gamification-event-handler';
// import { SocialEventHandler } from '@shared/events/social-event-handler';
import { APIGateway } from '@gateway/api-gateway';
import { Logger } from '@shared/utils/logger';
import { ErrorHandler } from '@shared/middleware/error-handler';

// 加载环境变量
dotenv.config();

class Application {
  private app: express.Application;
  private logger: Logger;
  private dbConnection: DatabaseConnection;
  private redisConnection: RedisConnection;
  private eventBus: EventBus;
  // Temporarily disabled
  // private gamificationHandler: GamificationEventHandler;
  // private socialHandler: SocialEventHandler;
  private apiGateway: APIGateway;

  constructor() {
    this.app = express();
    this.logger = new Logger('Application');
    this.initializeServices();
  }

  private initializeServices(): void {
    // 初始化核心服务
    this.dbConnection = new DatabaseConnection();
    this.redisConnection = new RedisConnection();
    this.eventBus = new EventBus(this.redisConnection);
    
    // Temporarily disabled due to compilation errors
    // this.gamificationHandler = new GamificationEventHandler();
    
    // this.socialHandler = new SocialEventHandler(this.eventBus);
    
    // 初始化API网关
    this.apiGateway = new APIGateway(this.eventBus);
  }

  private setupMiddleware(): void {
    // 安全中间件
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS配置
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    }));

    // 压缩响应
    this.app.use(compression());

    // 请求日志
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('combined'));
    }

    // 解析请求体
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 静态文件服务
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  }

  private setupRoutes(): void {
    // 健康检查端点
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API网关 - mount at correct path
    this.app.use('/api', this.apiGateway.getRouter());

    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        code: 'RESOURCE_NOT_FOUND',
        message: '请求的资源不存在',
        path: req.originalUrl,
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    });
  }

  private setupErrorHandling(): void {
    // 全局错误处理
    this.app.use(ErrorHandler.handle);

    // 未捕获异常处理
    process.on('uncaughtException', (error: Error) => {
      this.logger.error('Uncaught Exception:', error);
      this.shutdown(1);
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown(1);
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
      this.logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown(0);
    });

    process.on('SIGINT', () => {
      this.logger.info('SIGINT received, shutting down gracefully');
      this.shutdown(0);
    });
  }

  private async shutdown(exitCode: number): Promise<void> {
    this.logger.info('Starting graceful shutdown...');

    try {
      // 关闭服务器
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server!.close(() => {
            this.logger.info('HTTP server closed');
            resolve();
          });
        });
      }

      // 关闭数据库连接
      await this.dbConnection.close();
      this.logger.info('Database connection closed');

      // 关闭Redis连接
      await this.redisConnection.close();
      this.logger.info('Redis connection closed');

      this.logger.info('Graceful shutdown completed');
      process.exit(exitCode);
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  private server: any;

  public async start(): Promise<void> {
    try {
      // 连接数据库
      await this.dbConnection.connect();
      this.logger.info('Database connected successfully');

      // 尝试连接Redis (可选)
      try {
        await this.redisConnection.connect();
        this.logger.info('Redis connected successfully');
      } catch (error) {
        this.logger.warn('Redis connection failed, continuing without caching:', error);
      }

      // Temporarily disabled due to compilation errors
      // this.gamificationHandler.registerEventListeners();
      this.logger.info('Event handlers initialization skipped temporarily');
      
      // this.logger.info('Social event handlers registered');

      // 设置中间件
      this.setupMiddleware();

      // 设置路由
      this.setupRoutes();

      // 设置错误处理
      this.setupErrorHandling();

      // 启动服务器
      const port = parseInt(process.env.PORT || '5001', 10);
      const host = process.env.HOST || '0.0.0.0';

      this.server = this.app.listen(port, host, () => {
        this.logger.info(`🚀 Server running at http://${host}:${port}`);
        this.logger.info(`📖 API documentation: http://${host}:${port}${process.env.API_PREFIX || '/api/v1'}/docs`);
        this.logger.info(`🔍 Health check: http://${host}:${port}/health`);
        this.logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // 设置服务器超时
      this.server.timeout = 30000; // 30秒超时
      
    } catch (error) {
      this.logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }
}

// 启动应用
const application = new Application();
application.start().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

export default Application;

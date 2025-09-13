import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { AuthMiddleware } from '@shared/middleware/auth';
import { RateLimitMiddleware } from '@shared/middleware/rate-limit';
import { EventBus } from '@shared/events/event-bus';

export function createAuthRoutes(eventBus: EventBus): Router {
  const router = Router();
  const authService = new AuthService(eventBus);
  const authController = new AuthController(authService);

  // 公开端点（无需认证）
  router.post('/register',
    RateLimitMiddleware.auth(), // 注册限流
    AuthController.validateRegister(),
    authController.register
  );

  router.post('/login',
    RateLimitMiddleware.auth(), // 登录限流
    AuthController.validateLogin(),
    authController.login
  );

  router.post('/refresh-token',
    authController.refreshToken
  );

  // 需要认证的端点
  router.post('/logout',
    AuthMiddleware.authenticate,
    authController.logout
  );

  router.get('/profile',
    AuthMiddleware.authenticate,
    authController.getProfile
  );

  router.put('/profile',
    AuthMiddleware.authenticate,
    AuthController.validateUpdateProfile(),
    authController.updateProfile
  );

  // 家庭相关端点（需要认证和家庭隔离）
  router.get('/families/members',
    AuthMiddleware.authenticate,
    AuthMiddleware.familyIsolation,
    authController.getFamilyMembers
  );

  router.get('/families/leaderboard',
    AuthMiddleware.authenticate,
    AuthMiddleware.familyIsolation,
    authController.getFamilyLeaderboard
  );

  return router;
}
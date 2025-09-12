import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ErrorHandler } from './error-handler';
import { Logger } from '@shared/utils/logger';

export interface JWTPayload {
  userId: string;
  familyId: string;
  role: 'student' | 'parent';
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

export class AuthMiddleware {
  private static logger = new Logger('AuthMiddleware');

  public static authenticate(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw ErrorHandler.unauthorized('需要提供有效的访问令牌');
      }

      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'fallback-secret-key';

      const decoded = jwt.verify(token, secret as string);
      const payload = decoded as unknown as JWTPayload;
      
      // 验证payload结构
      if (!payload.userId || !payload.familyId || !payload.role || !payload.email) {
        throw ErrorHandler.unauthorized('令牌格式无效');
      }

      (req as AuthenticatedRequest).user = payload;
      next();

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(ErrorHandler.unauthorized('访问令牌无效'));
      } else if (error instanceof jwt.TokenExpiredError) {
        next(ErrorHandler.unauthorized('访问令牌已过期'));
      } else {
        next(error);
      }
    }
  }

  public static requireRole(allowedRoles: ('student' | 'parent')[]): (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        return next(ErrorHandler.unauthorized());
      }

      if (!allowedRoles.includes(user.role)) {
        return next(ErrorHandler.forbidden('权限不足'));
      }

      next();
    };
  }

  public static requireParent(): (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void {
    return AuthMiddleware.requireRole(['parent']);
  }

  public static familyIsolation(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return next(ErrorHandler.unauthorized());
    }

    // 从请求参数或body中获取familyId
    const requestFamilyId = req.params.familyId || req.body.familyId;

    if (requestFamilyId && requestFamilyId !== user.familyId) {
      return next(ErrorHandler.forbidden('无权访问其他家庭数据'));
    }

    // 为查询添加家庭过滤器
    req.query.familyId = user.familyId;
    
    next();
  }

  public static optional(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // 没有token，继续执行，但不设置user
      }

      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'fallback-secret-key';

      const decoded = jwt.verify(token, secret as string);
      const payload = decoded as unknown as JWTPayload;
      (req as AuthenticatedRequest).user = payload;

    } catch (error) {
      // 忽略认证错误，继续执行
      AuthMiddleware.logger.debug('Optional auth failed:', error);
    }

    next();
  }
}
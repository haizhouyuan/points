import { Request, Response, NextFunction } from 'express';
import { Logger } from '@shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;
  isOperational?: boolean;
}

export class ErrorHandler {
  private static logger = new Logger('ErrorHandler');

  public static createError(
    statusCode: number,
    code: string,
    message: string,
    details?: any
  ): AppError {
    const error = new Error(message) as AppError;
    error.statusCode = statusCode;
    error.code = code;
    error.details = details;
    error.isOperational = true;
    return error;
  }

  public static handle(
    error: AppError | Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const requestId = req.headers['x-request-id'] as string || uuidv4();

    // 设置响应头
    res.setHeader('x-request-id', requestId);

    // 判断是否为操作性错误
    const isOperationalError = (error as AppError).isOperational;
    const statusCode = (error as AppError).statusCode || 500;
    const code = (error as AppError).code || 'INTERNAL_SERVER_ERROR';

    // 记录错误日志
    if (statusCode >= 500) {
      ErrorHandler.logger.error('Internal server error:', {
        error: error.message,
        stack: error.stack,
        requestId,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    } else if (statusCode >= 400) {
      ErrorHandler.logger.warn('Client error:', {
        error: error.message,
        requestId,
        url: req.url,
        method: req.method,
        statusCode,
      });
    }

    // 构建错误响应
    const errorResponse: any = {
      code,
      message: error.message,
      requestId,
    };

    // 在开发环境或操作性错误时包含详细信息
    if (process.env.NODE_ENV === 'development' || isOperationalError) {
      if ((error as AppError).details) {
        errorResponse.details = (error as AppError).details;
      }
    }

    // 在开发环境包含堆栈信息
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }

    res.status(statusCode).json(errorResponse);
  }

  // 常见错误创建方法
  public static badRequest(message: string, details?: any): AppError {
    return ErrorHandler.createError(400, 'BAD_REQUEST', message, details);
  }

  public static unauthorized(message: string = '需要身份验证'): AppError {
    return ErrorHandler.createError(401, 'UNAUTHORIZED', message);
  }

  public static forbidden(message: string = '权限不足'): AppError {
    return ErrorHandler.createError(403, 'FORBIDDEN', message);
  }

  public static notFound(message: string = '资源未找到'): AppError {
    return ErrorHandler.createError(404, 'NOT_FOUND', message);
  }

  public static conflict(message: string, details?: any): AppError {
    return ErrorHandler.createError(409, 'CONFLICT', message, details);
  }

  public static tooManyRequests(message: string = '请求过于频繁'): AppError {
    return ErrorHandler.createError(429, 'TOO_MANY_REQUESTS', message);
  }

  public static internalError(message: string = '内部服务器错误'): AppError {
    return ErrorHandler.createError(500, 'INTERNAL_SERVER_ERROR', message);
  }

  // 业务错误
  public static insufficientPoints(message: string = '积分不足'): AppError {
    return ErrorHandler.createError(400, 'INSUFFICIENT_POINTS', message);
  }

  public static insufficientLives(message: string = '生命值不足'): AppError {
    return ErrorHandler.createError(400, 'INSUFFICIENT_LIVES', message);
  }

  public static taskAlreadyCompleted(message: string = '任务已完成'): AppError {
    return ErrorHandler.createError(409, 'TASK_ALREADY_COMPLETED', message);
  }

  public static achievementAlreadyClaimed(message: string = '成就已领取'): AppError {
    return ErrorHandler.createError(409, 'ACHIEVEMENT_ALREADY_CLAIMED', message);
  }

  public static familyPermissionRequired(message: string = '需要家长权限'): AppError {
    return ErrorHandler.createError(403, 'FAMILY_PERMISSION_REQUIRED', message);
  }

  public static timeSlotConflict(message: string = '时间段冲突'): AppError {
    return ErrorHandler.createError(409, 'TIME_SLOT_CONFLICT', message);
  }

  public static fileSizeExceeded(message: string = '文件大小超限'): AppError {
    return ErrorHandler.createError(413, 'FILE_SIZE_EXCEEDED', message);
  }

  public static streakAlreadyRestored(message: string = '连击已修复过'): AppError {
    return ErrorHandler.createError(409, 'STREAK_ALREADY_RESTORED', message);
  }

  public static dailyRewardAlreadyClaimed(message: string = '每日奖励已领取'): AppError {
    return ErrorHandler.createError(409, 'DAILY_REWARD_ALREADY_CLAIMED', message);
  }
}
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService, RegisterData, LoginData } from '../services/auth.service';
import { AuthenticatedRequest } from '@shared/middleware/auth';
import { ErrorHandler } from '@shared/middleware/error-handler';
import { Logger } from '@shared/utils/logger';

export class AuthController {
  private authService: AuthService;
  private logger: Logger;

  constructor(authService: AuthService) {
    this.authService = authService;
    this.logger = new Logger('AuthController');
  }

  // 注册验证规则
  public static validateRegister() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('请提供有效的邮箱地址'),
      
      body('password')
        .isLength({ min: 6 })
        .withMessage('密码至少需要6位字符')
        .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
        .withMessage('密码必须包含字母和数字'),
      
      body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('姓名长度为2-50个字符'),
      
      body('role')
        .isIn(['student', 'parent'])
        .withMessage('用户角色必须是student或parent'),
      
      body('familyName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('家庭名称长度为2-50个字符'),
      
      body('inviteCode')
        .optional()
        .isLength({ min: 6, max: 6 })
        .isAlphanumeric()
        .toUpperCase()
        .withMessage('邀请码必须是6位字母数字组合'),
    ];
  }

  // 登录验证规则
  public static validateLogin() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('请提供有效的邮箱地址'),
      
      body('password')
        .notEmpty()
        .withMessage('请输入密码'),
    ];
  }

  // 更新个人资料验证规则
  public static validateUpdateProfile() {
    return [
      body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('姓名长度为2-50个字符'),
      
      body('avatar')
        .optional()
        .isURL()
        .withMessage('头像必须是有效的URL'),
      
      body('notificationSettings.push')
        .optional()
        .isBoolean()
        .withMessage('推送通知设置必须是布尔值'),
      
      body('notificationSettings.email')
        .optional()
        .isBoolean()
        .withMessage('邮件通知设置必须是布尔值'),
      
      body('notificationSettings.sound')
        .optional()
        .isBoolean()
        .withMessage('声音通知设置必须是布尔值'),
    ];
  }

  // 处理验证错误
  private handleValidationErrors(req: Request): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw ErrorHandler.badRequest('请求参数验证失败', {
        errors: errors.array(),
      });
    }
  }

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.handleValidationErrors(req);

      const registerData: RegisterData = {
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        role: req.body.role,
        familyName: req.body.familyName,
        inviteCode: req.body.inviteCode,
      };

      const result = await this.authService.register(registerData);

      this.logger.info('User registered successfully', {
        userId: result.user._id,
        email: result.user.email,
      });

      res.status(201).json({
        message: '注册成功',
        data: result,
        requestId: req.headers['x-request-id'],
      });

    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.handleValidationErrors(req);

      const loginData: LoginData = {
        email: req.body.email,
        password: req.body.password,
      };

      const result = await this.authService.login(loginData);

      this.logger.info('User logged in successfully', {
        userId: result.user._id,
        email: result.user.email,
      });

      res.json({
        message: '登录成功',
        data: result,
        requestId: req.headers['x-request-id'],
      });

    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw ErrorHandler.badRequest('缺少刷新令牌');
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      res.json({
        message: '令牌刷新成功',
        data: tokens,
        requestId: req.headers['x-request-id'],
      });

    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 客户端负责清除令牌，服务端可以将令牌加入黑名单（如果需要的话）
      // 这里暂时只返回成功消息

      res.json({
        message: '退出登录成功',
        requestId: req.headers['x-request-id'],
      });

    } catch (error) {
      next(error);
    }
  };

  public getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.getProfile(req.user.userId);

      res.json({
        data: result,
        requestId: req.headers['x-request-id'],
      });

    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.handleValidationErrors(req);

      const result = await this.authService.updateProfile(req.user.userId, req.body);

      this.logger.info('Profile updated successfully', {
        userId: req.user.userId,
      });

      res.json({
        message: '个人资料更新成功',
        data: result,
        requestId: req.headers['x-request-id'],
      });

    } catch (error) {
      next(error);
    }
  };

  public getFamilyMembers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const members = await this.authService.getFamilyMembers(req.user.familyId);

      res.json({
        data: members,
        requestId: req.headers['x-request-id'],
      });

    } catch (error) {
      next(error);
    }
  };

  public getFamilyLeaderboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { period = 'week', includeGrowth = 'false' } = req.query;

      if (!['week', 'month'].includes(period as string)) {
        throw ErrorHandler.badRequest('period参数必须是week或month');
      }

      const leaderboard = await this.authService.getFamilyLeaderboard(
        req.user.familyId,
        period as 'week' | 'month',
        includeGrowth === 'true'
      );

      res.json({
        data: leaderboard,
        requestId: req.headers['x-request-id'],
      });

    } catch (error) {
      next(error);
    }
  };
}
import { Request, Response, NextFunction } from 'express';
import { PointsService } from '../services/points.service';
import { AppError } from '@shared/middleware/error-handler';

export class PointsController {
  private pointsService: PointsService;

  constructor() {
    this.pointsService = new PointsService();
  }

  // 获取用户积分余额
  getBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      
      const balance = await this.pointsService.getBalance(userId);

      res.json({
        success: true,
        data: {
          balance,
          currency: 'points'
        },
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取积分交易历史
  getTransactionHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      const { limit = 20, offset = 0, category } = req.query;

      const transactions = await this.pointsService.getTransactionHistory(
        userId,
        {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          category: category as string
        }
      );

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
          }
        },
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 手动添加积分 (仅家长权限)
  addPoints = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId: operatorId, role } = req.user!;
      const { userId, amount, reason } = req.body;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      // 检查权限：只有家长可以手动添加积分
      if (role !== 'parent') {
        throw new AppError('Only parents can manually add points', 403);
      }

      const transaction = await this.pointsService.addPoints(
        userId,
        amount,
        {
          category: 'manual_adjustment',
          reference: {
            type: 'manual',
            id: operatorId,
            name: 'Manual point adjustment by parent'
          },
          metadata: {
            reason,
            operatorId
          }
        },
        idempotencyKey
      );

      res.json({
        success: true,
        data: transaction,
        message: 'Points added successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 消费积分
  spendPoints = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      const { amount, reason, reference } = req.body;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      const transaction = await this.pointsService.spendPoints(
        userId,
        amount,
        {
          category: 'redemption',
          reference: reference || {
            type: 'manual_redemption',
            id: userId,
            name: 'Manual point redemption'
          },
          metadata: {
            reason
          }
        },
        idempotencyKey
      );

      res.json({
        success: true,
        data: transaction,
        message: 'Points spent successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取积分统计
  getPointsStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      const { period = 'week' } = req.query;

      const stats = await this.pointsService.getPointsStats(
        userId, 
        period as 'day' | 'week' | 'month'
      );

      res.json({
        success: true,
        data: stats,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取家庭积分排行榜
  getFamilyLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.user!;
      const { period = 'week' } = req.query;

      const leaderboard = await this.pointsService.getFamilyLeaderboard(
        familyId,
        period as 'day' | 'week' | 'month'
      );

      res.json({
        success: true,
        data: leaderboard,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };
}
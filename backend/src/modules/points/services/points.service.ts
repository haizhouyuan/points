import mongoose from 'mongoose';
import { PointsLedger, IPointsLedger } from '../models/points-ledger.model';
import { User } from '@modules/auth/models/user.model';
import { EventBus, EventTypes } from '@shared/events/event-bus';
import { Logger } from '@shared/utils/logger';
import { ErrorHandler } from '@shared/middleware/error-handler';
import { IdempotencyMiddleware } from '@shared/middleware/idempotency';
import { RedisConnection } from '@shared/cache/redis';
import { PointsTransactionType } from '@shared/types/common';

export interface CreateTransactionData {
  userId: string;
  familyId: string;
  amount: number;
  type: PointsTransactionType;
  sourceId?: string;
  sourceType?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface PointsHistoryQuery {
  type?: PointsTransactionType;
  cursor?: string;
  limit?: number;
}

export class PointsService {
  private logger: Logger;
  private eventBus: EventBus;
  private redis?: RedisConnection;

  constructor(eventBus?: EventBus, redis?: RedisConnection) {
    this.logger = new Logger('PointsService');
    this.eventBus = eventBus || (EventBus as any).getInstance();
    this.redis = redis;
  }

  // 创建积分交易（事务安全）
  public async createTransaction(data: CreateTransactionData): Promise<IPointsLedger> {
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        // 幂等性检查
        if (data.idempotencyKey) {
          const existing = await PointsLedger.findOne({
            idempotencyKey: data.idempotencyKey
          }).session(session);
          
          if (existing) {
            this.logger.info('Idempotent transaction found, returning existing result', {
              transactionId: existing._id,
              idempotencyKey: data.idempotencyKey,
            });
            return existing;
          }
        }

        // 获取当前余额
        const currentBalance = await this.getBalance(data.userId);

        // 检查余额是否足够（支出时）
        if (data.amount < 0 && currentBalance + data.amount < 0) {
          throw ErrorHandler.insufficientPoints('积分余额不足');
        }

        // 计算新余额
        const newBalance = currentBalance + data.amount;

        // 创建账本记录
        const transaction = new PointsLedger({
          userId: new mongoose.Types.ObjectId(data.userId),
          familyId: new mongoose.Types.ObjectId(data.familyId),
          amount: data.amount,
          type: data.type,
          sourceId: data.sourceId ? new mongoose.Types.ObjectId(data.sourceId) : undefined,
          sourceType: data.sourceType,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          metadata: data.metadata || {},
          idempotencyKey: data.idempotencyKey,
        });

        await transaction.save({ session });

        // 更新用户积分缓存
        await User.findByIdAndUpdate(
          data.userId,
          { 
            $set: { 'gameProfile.totalPoints': newBalance },
            $inc: { 'gameProfile.dailyXP': data.amount > 0 ? data.amount : 0 }
          },
          { session }
        );

        // 更新Redis缓存
        await this.updateBalanceCache(data.userId, newBalance);

        this.logger.info('Points transaction created', {
          transactionId: transaction._id,
          userId: data.userId,
          amount: data.amount,
          type: data.type,
          newBalance,
        });

        // 发布积分变更事件
        await this.eventBus.publish(EventTypes.POINTS_EARNED, {
          userId: data.userId,
          familyId: data.familyId,
          amount: data.amount,
          type: data.type,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          transactionId: transaction._id.toString(),
        });

        if (data.amount !== 0) {
          await this.eventBus.publish(EventTypes.BALANCE_CHANGED, {
            userId: data.userId,
            familyId: data.familyId,
            oldBalance: currentBalance,
            newBalance,
            change: data.amount,
          });
        }

        return transaction;
      });

    } catch (error) {
      this.logger.error('Failed to create points transaction:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // 获取用户积分余额
  public async getBalance(userId: string): Promise<number> {
    try {
      // 尝试从缓存获取
      if (this.redis) {
        const cached = await this.redis.get(`balance:${userId}`);
        if (cached !== null) {
          return parseInt(cached);
        }
      }

      // 从数据库计算实时余额
      const balance = await (PointsLedger as any).calculateBalance(userId);

      // 更新缓存（5分钟过期）
      await this.updateBalanceCache(userId, balance);

      return balance;

    } catch (error) {
      this.logger.error('Failed to get balance:', error);
      // 如果缓存出错，直接从数据库获取
      return await (PointsLedger as any).calculateBalance(userId);
    }
  }

  // 获取积分历史记录
  public async getHistory(userId: string, query: PointsHistoryQuery) {
    try {
      return await (PointsLedger as any).getUserHistory(userId, query);
    } catch (error) {
      this.logger.error('Failed to get points history:', error);
      throw error;
    }
  }

  // 获取积分统计
  public async getSummary(userId: string, period: 'week' | 'month') {
    try {
      return await (PointsLedger as any).getUserSummary(userId, period);
    } catch (error) {
      this.logger.error('Failed to get points summary:', error);
      throw error;
    }
  }

  // 获取家庭积分排行榜

  // 任务完成奖励（常用场景）
  public async rewardTaskCompletion(
    userId: string,
    familyId: string,
    taskId: string,
    points: number,
    metadata: Record<string, any> = {},
    idempotencyKey?: string
  ): Promise<IPointsLedger> {
    return await this.createTransaction({
      userId,
      familyId,
      amount: points,
      type: 'task_completion',
      sourceId: taskId,
      sourceType: 'scheduled_task',
      metadata: {
        ...metadata,
        description: '任务完成奖励',
      },
      idempotencyKey,
    });
  }

  // 成就奖励（常用场景）
  public async rewardAchievement(
    userId: string,
    familyId: string,
    achievementId: string,
    points: number,
    metadata: Record<string, any> = {},
    idempotencyKey?: string
  ): Promise<IPointsLedger> {
    return await this.createTransaction({
      userId,
      familyId,
      amount: points,
      type: 'achievement_reward',
      sourceId: achievementId,
      sourceType: 'achievement',
      metadata: {
        ...metadata,
        description: '成就解锁奖励',
      },
      idempotencyKey,
    });
  }

  // 积分消费（常用场景）
  public async consumePoints(
    userId: string,
    familyId: string,
    amount: number,
    type: PointsTransactionType,
    sourceId?: string,
    sourceType?: string,
    metadata: Record<string, any> = {},
    idempotencyKey?: string
  ): Promise<IPointsLedger> {
    return await this.createTransaction({
      userId,
      familyId,
      amount: -Math.abs(amount), // 确保是负数
      type,
      sourceId,
      sourceType,
      metadata,
      idempotencyKey,
    });
  }

  // 每日奖励（常用场景）
  public async claimDailyReward(
    userId: string,
    familyId: string,
    points: number,
    idempotencyKey?: string
  ): Promise<IPointsLedger> {
    // 检查今天是否已领取
    const today = new Date().toISOString().split('T')[0];
    const alreadyClaimed = await PointsLedger.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      type: 'daily_bonus',
      date: new Date(today),
    });

    if (alreadyClaimed) {
      throw ErrorHandler.dailyRewardAlreadyClaimed();
    }

    return await this.createTransaction({
      userId,
      familyId,
      amount: points,
      type: 'daily_bonus',
      metadata: {
        description: '每日签到奖励',
        date: today,
      },
      idempotencyKey,
    });
  }

  // 更新余额缓存
  private async updateBalanceCache(userId: string, balance: number): Promise<void> {
    if (!this.redis) return;
    
    try {
      await this.redis.set(`balance:${userId}`, balance.toString(), 300); // 5分钟缓存
    } catch (error) {
      this.logger.warn('Failed to update balance cache:', error);
      // 缓存失败不影响主流程
    }
  }

  // 清除用户相关缓存
  public async clearUserCache(userId: string): Promise<void> {
    if (!this.redis) return;
    
    try {
      await this.redis.del(`balance:${userId}`);
    } catch (error) {
      this.logger.warn('Failed to clear user cache:', error);
    }
  }

  // 批量创建交易（用于数据迁移或批量操作）
  public async createBatchTransactions(
    transactions: CreateTransactionData[]
  ): Promise<IPointsLedger[]> {
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const results: IPointsLedger[] = [];
        
        for (const data of transactions) {
          const result = await this.createTransaction(data);
          results.push(result);
        }
        
        return results;
      });
      
    } catch (error) {
      this.logger.error('Failed to create batch transactions:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // 验证交易数据
  private validateTransactionData(data: CreateTransactionData): void {
    if (!data.userId || !data.familyId) {
      throw ErrorHandler.badRequest('用户ID和家庭ID必须提供');
    }

    if (data.amount === 0) {
      throw ErrorHandler.badRequest('积分变更金额不能为零');
    }

    if (!data.type) {
      throw ErrorHandler.badRequest('交易类型必须提供');
    }
  }

  // 适配控制器的方法
  
  // 添加积分的简化方法
  async addPoints(
    userId: string,
    amount: number,
    options: {
      category: PointsTransactionType;
      reference: {
        type: string;
        id: string;
        name: string;
      };
      metadata?: Record<string, any>;
    },
    idempotencyKey?: string,
    session?: any
  ): Promise<IPointsLedger> {
    // 获取用户的familyId
    const user = await User.findById(userId).select('familyId');
    if (!user) {
      throw ErrorHandler.notFound('用户不存在');
    }

    return this.createTransaction({
      userId,
      familyId: user.familyId.toString(),
      amount,
      type: options.category,
      sourceId: options.reference.id,
      sourceType: options.reference.type,
      metadata: {
        ...options.metadata,
        name: options.reference.name
      },
      idempotencyKey
    });
  }

  // 消费积分的简化方法
  async spendPoints(
    userId: string,
    amount: number,
    options: {
      category: PointsTransactionType;
      reference: {
        type: string;
        id: string;
        name: string;
      };
      metadata?: Record<string, any>;
    },
    idempotencyKey?: string
  ): Promise<IPointsLedger> {
    return this.addPoints(userId, -Math.abs(amount), options, idempotencyKey);
  }

  // 获取交易历史的简化方法
  async getTransactionHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      category?: string;
    } = {}
  ): Promise<IPointsLedger[]> {
    return PointsLedger.find({
      userId: new mongoose.Types.ObjectId(userId),
      ...(options.category && { type: options.category })
    })
    .sort({ createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.offset || 0);
  }

  // 获取积分统计的简化方法
  async getPointsStats(
    userId: string,
    period: 'day' | 'week' | 'month'
  ): Promise<any> {
    const startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const stats = await PointsLedger.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalBalance = await this.getBalance(userId);

    return {
      balance: totalBalance,
      period,
      stats,
      generatedAt: new Date()
    };
  }

  // 获取家庭排行榜的简化方法 (重载以支持day参数)
  async getFamilyLeaderboard(
    familyId: string,
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<any> {
    // 如果是day，转换为week处理（简化实现）
    const actualPeriod = period === 'day' ? 'week' : period as 'week' | 'month';
    
    // 直接调用父类的原始方法
    return this.getFamilyLeaderboardOriginal(familyId, actualPeriod);
  }

  // 原始的家庭排行榜方法（重命名以避免递归）
  private async getFamilyLeaderboardOriginal(familyId: string, period: 'week' | 'month') {
    try {
      // 尝试从缓存获取
      if (this.redis) {
        const cacheKey = `leaderboard:${familyId}:${period}`;
        const cached = await this.redis.get(cacheKey);
        
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // 从数据库获取
      const leaderboard = await (PointsLedger as any).getFamilyLeaderboard(familyId, period);

      // 缓存结果（1小时过期）
      if (this.redis) {
        const cacheKey = `leaderboard:${familyId}:${period}`;
        await this.redis.set(cacheKey, JSON.stringify(leaderboard), 3600);
      }

      return leaderboard;

    } catch (error) {
      this.logger.error('Failed to get family leaderboard:', error);
      throw error;
    }
  }
}
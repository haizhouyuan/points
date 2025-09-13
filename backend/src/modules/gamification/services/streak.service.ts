import mongoose from 'mongoose';
import { UserStreak, IUserStreak } from '../models/streak.model';
import { PointsService } from '@modules/points/services/points.service';
import { EventBus } from '@shared/events/event-bus';
import { AppError } from '@shared/middleware/error-handler';
import { StreakCategory } from '@shared/types/common';

export class StreakService {
  private pointsService: PointsService;
  private eventBus: EventBus;

  constructor() {
    this.pointsService = new PointsService();
    this.eventBus = EventBus.getInstance();
  }

  // 获取用户所有连击记录
  async getUserStreaks(userId: string): Promise<IUserStreak[]> {
    return UserStreak.getUserStreaks(userId);
  }

  // 获取特定类别的用户连击
  async getUserStreak(userId: string, category: StreakCategory): Promise<IUserStreak | null> {
    return UserStreak.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      category
    });
  }

  // 增加连击
  async incrementStreak(
    userId: string, 
    category: StreakCategory,
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean;
    currentStreak: number;
    milestones: number[];
    bonusMultiplier: number;
  }> {
    let userStreak = await this.getUserStreak(userId, category);

    if (!userStreak) {
      // 创建新的连击记录
      userStreak = new UserStreak({
        userId: new mongoose.Types.ObjectId(userId),
        category,
        currentStreak: 0,
        maxStreak: 0,
        metadata: {
          milestones: [],
          breakDates: [],
          restoreHistory: []
        }
      });
    }

    const incremented = await userStreak.increment();
    
    if (!incremented) {
      return {
        success: false,
        currentStreak: userStreak.currentStreak,
        milestones: [],
        bonusMultiplier: userStreak.bonusMultiplier
      };
    }

    // 检查新达成的里程碑
    const newMilestones = userStreak.checkMilestones();

    // 发布连击增加事件
    this.eventBus.emit('streak.incremented', {
      userId,
      category,
      currentStreak: userStreak.currentStreak,
      maxStreak: userStreak.maxStreak,
      bonusMultiplier: userStreak.bonusMultiplier,
      newMilestones,
      metadata
    });

    // 奖励里程碑
    for (const milestone of newMilestones) {
      await this.rewardMilestone(userId, category, milestone);
    }

    // 更新整体连击（如果不是整体类别）
    if (category !== 'overall') {
      await this.updateOverallStreak(userId);
    }

    return {
      success: true,
      currentStreak: userStreak.currentStreak,
      milestones: newMilestones,
      bonusMultiplier: userStreak.bonusMultiplier
    };
  }

  // 恢复连击
  async restoreStreak(
    userId: string, 
    category: StreakCategory,
    idempotencyKey?: string
  ): Promise<{
    success: boolean;
    cost: number;
    restoredStreak: number;
  }> {
    const userStreak = await this.getUserStreak(userId, category);
    
    if (!userStreak) {
      throw new AppError('Streak record not found', 404);
    }

    if (!userStreak.canRestoreStreak()) {
      throw new AppError('Streak cannot be restored', 400);
    }

    // 计算恢复成本
    const cost = this.calculateRestoreCost(userStreak);

    // 检查用户积分是否足够
    const userBalance = await this.pointsService.getBalance(userId);
    if (userBalance < cost) {
      throw new AppError('Insufficient points to restore streak', 400);
    }

    // 扣除积分
    await this.pointsService.spendPoints(
      userId,
      cost,
      {
        category: 'streak_restore',
        reference: {
          type: 'streak_restore',
          id: userStreak._id.toString(),
          name: `Restore ${category} streak`
        },
        metadata: {
          category,
          previousStreak: userStreak.maxStreak,
          restoreCount: userStreak.restoreCount + 1
        }
      },
      idempotencyKey
    );

    // 执行恢复
    const restored = await userStreak.restoreStreak(cost);
    
    if (!restored) {
      throw new AppError('Failed to restore streak', 500);
    }

    // 发布恢复事件
    this.eventBus.emit('streak.restored', {
      userId,
      category,
      cost,
      restoredStreak: userStreak.currentStreak,
      restoreCount: userStreak.restoreCount
    });

    return {
      success: true,
      cost,
      restoredStreak: userStreak.currentStreak
    };
  }

  // 获取连击排行榜
  async getStreakLeaderboard(
    category?: StreakCategory,
    limit = 10
  ): Promise<any[]> {
    return UserStreak.getTopStreaks(category, limit);
  }

  // 获取用户连击统计
  async getUserStreakStats(userId: string): Promise<{
    totalStreaks: number;
    activeStreaks: number;
    maxOverallStreak: number;
    totalMilestones: number;
    categoryStats: {
      category: StreakCategory;
      currentStreak: number;
      maxStreak: number;
      bonusMultiplier: number;
      milestones: number;
    }[];
  }> {
    const streaks = await this.getUserStreaks(userId);
    
    let totalMilestones = 0;
    const categoryStats = streaks
      .filter(s => s.category !== 'overall')
      .map(streak => {
        const milestoneCount = streak.metadata.milestones.length;
        totalMilestones += milestoneCount;
        
        return {
          category: streak.category,
          currentStreak: streak.currentStreak,
          maxStreak: streak.maxStreak,
          bonusMultiplier: streak.bonusMultiplier,
          milestones: milestoneCount
        };
      });

    const overallStreak = streaks.find(s => s.category === 'overall');
    
    return {
      totalStreaks: categoryStats.length,
      activeStreaks: categoryStats.filter(s => s.currentStreak > 0).length,
      maxOverallStreak: overallStreak ? overallStreak.maxStreak : 0,
      totalMilestones,
      categoryStats
    };
  }

  // 检查连击中断
  async checkStreakBreaks(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    // 查找昨天没有活动且当前有连击的记录
    const activeStreaks = await UserStreak.find({
      currentStreak: { $gt: 0 },
      lastActivityDate: { $lt: yesterday }
    });

    for (const streak of activeStreaks) {
      // 中断连击
      streak.currentStreak = 0;
      streak.metadata.breakDates.push(yesterday);
      
      await streak.save();

      // 发布中断事件
      this.eventBus.emit('streak.broken', {
        userId: streak.userId,
        category: streak.category,
        brokenStreak: streak.maxStreak,
        brokenAt: yesterday
      });
    }
  }

  // 初始化用户连击记录
  async initializeUserStreaks(userId: string): Promise<void> {
    const categories: StreakCategory[] = ['exercise', 'reading', 'chores', 'learning', 'creativity', 'overall'];
    
    for (const category of categories) {
      const existing = await UserStreak.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        category
      });

      if (!existing) {
        const userStreak = new UserStreak({
          userId: new mongoose.Types.ObjectId(userId),
          category,
          currentStreak: 0,
          maxStreak: 0,
          metadata: {
            milestones: [],
            breakDates: [],
            restoreHistory: []
          }
        });

        await userStreak.save();
      }
    }
  }

  // 私有方法：计算恢复成本
  private calculateRestoreCost(userStreak: IUserStreak): number {
    const baseCost = 50;
    const streakMultiplier = Math.min(userStreak.maxStreak, 50) * 2; // 连击越高恢复越贵
    const restoreMultiplier = Math.pow(2, userStreak.restoreCount); // 恢复次数越多越贵
    
    return baseCost + streakMultiplier + (restoreMultiplier * 25);
  }

  // 私有方法：奖励里程碑
  private async rewardMilestone(
    userId: string, 
    category: StreakCategory, 
    milestone: number
  ): Promise<void> {
    const pointsReward = this.calculateMilestoneReward(milestone);
    
    // 分发积分奖励
    await this.pointsService.addPoints(
      userId,
      pointsReward,
      {
        category: 'streak_bonus',
        reference: {
          type: 'streak_milestone',
          id: `${category}_${milestone}`,
          name: `${category} ${milestone}-day streak milestone`
        },
        metadata: {
          category,
          milestone,
          streakType: 'milestone_reward'
        }
      }
    );

    // 标记里程碑为已奖励
    const userStreak = await this.getUserStreak(userId, category);
    if (userStreak) {
      await userStreak.rewardMilestone(milestone);
    }

    // 发布里程碑事件
    this.eventBus.emit('streak.milestone', {
      userId,
      category,
      milestone,
      pointsRewarded: pointsReward
    });
  }

  // 私有方法：计算里程碑奖励
  private calculateMilestoneReward(milestone: number): number {
    const rewards = {
      7: 100,    // 一周
      14: 250,   // 两周
      30: 500,   // 一月
      50: 1000,  // 50天
      100: 2500, // 100天
      200: 5000, // 200天
      365: 10000 // 一年
    };

    return rewards[milestone] || milestone * 10;
  }

  // 私有方法：更新整体连击
  private async updateOverallStreak(userId: string): Promise<void> {
    const overallStreak = await UserStreak.calculateOverallStreak(userId);
    
    let userOverallStreak = await this.getUserStreak(userId, 'overall');
    if (!userOverallStreak) {
      userOverallStreak = new UserStreak({
        userId: new mongoose.Types.ObjectId(userId),
        category: 'overall',
        currentStreak: 0,
        maxStreak: 0,
        metadata: {
          milestones: [],
          breakDates: [],
          restoreHistory: []
        }
      });
    }

    const oldStreak = userOverallStreak.currentStreak;
    userOverallStreak.currentStreak = overallStreak;
    
    if (overallStreak > userOverallStreak.maxStreak) {
      userOverallStreak.maxStreak = overallStreak;
    }

    userOverallStreak.lastActivityDate = new Date();
    userOverallStreak.updateBonusMultiplier();
    
    await userOverallStreak.save();

    // 如果整体连击有显著提升，发布事件
    if (overallStreak > oldStreak + 2) {
      this.eventBus.emit('streak.overall_updated', {
        userId,
        oldStreak,
        newStreak: overallStreak,
        maxStreak: userOverallStreak.maxStreak
      });
    }
  }
}
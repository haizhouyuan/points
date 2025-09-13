import mongoose from 'mongoose';
import { Achievement, UserAchievement, IAchievement, IUserAchievement } from '../models/achievement.model';
import { PointsService } from '@modules/points/services/points.service';
import { EventBus } from '@shared/events/event-bus';
import { AppError } from '@shared/middleware/error-handler';
import { AchievementCategory, AchievementStatus } from '@shared/types/common';

export class AchievementService {
  private pointsService: PointsService;
  private eventBus: EventBus;

  constructor() {
    this.pointsService = new PointsService();
    this.eventBus = EventBus.getInstance();
  }

  // 获取所有成就定义
  async getAllAchievements(category?: AchievementCategory): Promise<IAchievement[]> {
    return Achievement.findActiveAchievements(category);
  }

  // 获取用户成就进度
  async getUserAchievements(
    userId: string, 
    status?: AchievementStatus
  ): Promise<IUserAchievement[]> {
    return UserAchievement.getUserAchievements(userId, status);
  }

  // 获取用户成就汇总
  async getUserAchievementSummary(userId: string) {
    const summary = await UserAchievement.getUserAchievementSummary(userId);
    const total = await Achievement.countDocuments({ isActive: true });
    
    const result = {
      totalAchievements: total,
      locked: 0,
      unlocked: 0,
      claimed: 0,
      totalPointsEarned: 0,
      totalXPEarned: 0
    };

    for (const item of summary) {
      switch (item._id) {
        case 'locked':
          result.locked = item.count;
          break;
        case 'unlocked':
          result.unlocked = item.count;
          break;
        case 'claimed':
          result.claimed = item.count;
          result.totalPointsEarned = item.totalPoints;
          result.totalXPEarned = item.totalXP;
          break;
      }
    }

    result.locked = total - result.unlocked - result.claimed;

    return result;
  }

  // 检查并解锁成就
  async checkAndUnlockAchievements(userId: string, userStats: Record<string, any>): Promise<IUserAchievement[]> {
    const unlockedAchievements: IUserAchievement[] = [];
    
    // 获取用户当前锁定的成就
    const lockedAchievements = await UserAchievement.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'locked'
    }).populate('achievementId');

    for (const userAchievement of lockedAchievements) {
      const achievement = userAchievement.achievementId as unknown as IAchievement;
      
      // 检查前置条件
      if (!this.checkPrerequisites(userId, achievement)) {
        continue;
      }

      // 检查成就要求
      if (achievement.checkRequirements(userStats)) {
        const unlocked = await userAchievement.unlock();
        if (unlocked) {
          unlockedAchievements.push(userAchievement);
          
          // 发布解锁事件
          this.eventBus.emit('achievement.unlocked', {
            userId,
            achievementId: achievement._id,
            achievementCode: achievement.code,
            achievementName: achievement.name,
            category: achievement.category,
            rarity: achievement.rarity,
            pointsReward: achievement.pointsReward,
            xpReward: achievement.xpReward
          });
        }
      } else {
        // 更新进度
        const progress = this.calculateProgress(achievement, userStats);
        if (progress !== userAchievement.progress) {
          userAchievement.progress = progress;
          await userAchievement.save();
        }
      }
    }

    return unlockedAchievements;
  }

  // 领取成就奖励
  async claimAchievement(
    userId: string, 
    achievementId: string,
    idempotencyKey?: string
  ): Promise<{ points: number; xp: number; achievement: IUserAchievement }> {
    const userAchievement = await UserAchievement.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      achievementId: new mongoose.Types.ObjectId(achievementId),
      status: 'unlocked'
    }).populate('achievementId');

    if (!userAchievement) {
      throw new AppError('Achievement not found or not unlocked', 404);
    }

    const rewards = await userAchievement.claim();
    if (!rewards) {
      throw new AppError('Achievement already claimed', 409);
    }

    // 分发积分奖励
    await this.pointsService.addPoints(
      userId,
      rewards.points,
      {
        category: 'achievement_reward',
        reference: {
          type: 'achievement',
          id: achievementId,
          name: (userAchievement.achievementId as unknown as IAchievement).name
        },
        metadata: {
          achievementCode: (userAchievement.achievementId as unknown as IAchievement).code,
          category: (userAchievement.achievementId as unknown as IAchievement).category,
          rarity: (userAchievement.achievementId as unknown as IAchievement).rarity
        }
      },
      idempotencyKey
    );

    // 发布领取事件
    this.eventBus.emit('achievement.claimed', {
      userId,
      achievementId,
      achievementCode: (userAchievement.achievementId as unknown as IAchievement).code,
      pointsEarned: rewards.points,
      xpEarned: rewards.xp
    });

    return {
      points: rewards.points,
      xp: rewards.xp,
      achievement: userAchievement
    };
  }

  // 初始化用户成就记录
  async initializeUserAchievements(userId: string): Promise<void> {
    const achievements = await Achievement.find({ isActive: true });
    const existingRecords = await UserAchievement.find({ 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    const existingAchievementIds = new Set(
      existingRecords.map(record => record.achievementId.toString())
    );

    const newRecords = achievements
      .filter(achievement => !existingAchievementIds.has(achievement._id.toString()))
      .map(achievement => ({
        userId: new mongoose.Types.ObjectId(userId),
        achievementId: achievement._id,
        status: 'locked' as AchievementStatus,
        progress: 0
      }));

    if (newRecords.length > 0) {
      await UserAchievement.insertMany(newRecords);
    }
  }

  // 创建成就定义（管理员功能）
  async createAchievement(achievementData: Partial<IAchievement>): Promise<IAchievement> {
    const achievement = new Achievement(achievementData);
    await achievement.save();

    // 为所有用户初始化这个新成就
    const users = await mongoose.model('User').find({}, '_id');
    const userAchievements = users.map(user => ({
      userId: user._id,
      achievementId: achievement._id,
      status: 'locked' as AchievementStatus,
      progress: 0
    }));

    if (userAchievements.length > 0) {
      await UserAchievement.insertMany(userAchievements);
    }

    return achievement;
  }

  // 获取成就排行榜
  async getAchievementLeaderboard(
    category?: AchievementCategory,
    limit = 10
  ): Promise<any[]> {
    const matchStage: any = { status: 'claimed' };
    
    let pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'achievements',
          localField: 'achievementId',
          foreignField: '_id',
          as: 'achievement'
        }
      },
      { $unwind: '$achievement' }
    ];

    if (category) {
      pipeline.push({ $match: { 'achievement.category': category } });
    }

    pipeline = pipeline.concat([
      {
        $group: {
          _id: '$userId',
          totalAchievements: { $sum: 1 },
          totalPoints: { $sum: '$pointsRewarded' },
          totalXP: { $sum: '$xpRewarded' },
          rarityBreakdown: {
            $push: {
              rarity: '$achievement.rarity',
              category: '$achievement.category'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $sort: { totalAchievements: -1, totalPoints: -1 } },
      { $limit: limit },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userAvatar: '$user.avatar',
          totalAchievements: 1,
          totalPoints: 1,
          totalXP: 1,
          rarityBreakdown: 1
        }
      }
    ]);

    return UserAchievement.aggregate(pipeline);
  }

  // 私有方法：检查前置条件
  private async checkPrerequisites(userId: string, achievement: IAchievement): Promise<boolean> {
    if (!achievement.unlockedBy || achievement.unlockedBy.length === 0) {
      return true;
    }

    const prerequisiteCount = await UserAchievement.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      achievementId: { $in: achievement.unlockedBy },
      status: { $in: ['unlocked', 'claimed'] }
    });

    return prerequisiteCount === achievement.unlockedBy.length;
  }

  // 私有方法：计算进度
  private calculateProgress(achievement: IAchievement, userStats: Record<string, any>): number {
    const req = achievement.requirements;
    let current = 0;

    switch (req.type) {
      case 'task_count':
        current = userStats.completedTasks || 0;
        break;
      case 'points_earned':
        current = userStats.totalPoints || 0;
        break;
      case 'streak_days':
        current = userStats.maxStreak || 0;
        break;
      case 'category_mastery':
        const categoryStats = userStats.categoryBreakdown?.[req.conditions?.category];
        current = categoryStats?.count || 0;
        break;
    }

    return Math.min(Math.floor((current / req.target) * 100), 100);
  }

  // 预设成就初始化
  async initializeDefaultAchievements(): Promise<void> {
    const defaultAchievements = [
      {
        code: 'FIRST_TASK',
        name: '初次尝试',
        description: '完成你的第一个任务',
        category: 'milestone' as AchievementCategory,
        rarity: 'common' as const,
        icon: 'star',
        pointsReward: 100,
        xpReward: 50,
        requirements: {
          type: 'task_count',
          target: 1
        }
      },
      {
        code: 'TASK_MASTER_10',
        name: '任务新手',
        description: '完成10个任务',
        category: 'milestone' as AchievementCategory,
        rarity: 'common' as const,
        icon: 'trophy',
        pointsReward: 200,
        xpReward: 100,
        requirements: {
          type: 'task_count',
          target: 10
        }
      },
      {
        code: 'STREAK_WEEK',
        name: '连击之星',
        description: '保持7天连续完成任务',
        category: 'streak' as AchievementCategory,
        rarity: 'rare' as const,
        icon: 'fire',
        pointsReward: 500,
        xpReward: 200,
        requirements: {
          type: 'streak_days',
          target: 7
        }
      }
    ];

    for (const achievementData of defaultAchievements) {
      const exists = await Achievement.findOne({ code: achievementData.code });
      if (!exists) {
        await this.createAchievement(achievementData);
      }
    }
  }
}
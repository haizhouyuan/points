import mongoose from 'mongoose';
import { UserLevel, IUserLevel } from '../models/level.model';
import { PointsService } from '@modules/points/services/points.service';
import { EventBus } from '@shared/events/event-bus';
import { AppError } from '@shared/middleware/error-handler';
import { SkillCategory } from '@shared/types/common';

export class LevelService {
  private pointsService: PointsService;
  private eventBus: EventBus;

  constructor() {
    this.pointsService = new PointsService();
    this.eventBus = EventBus.getInstance();
  }

  // 获取用户等级信息
  async getUserLevel(userId: string): Promise<IUserLevel | null> {
    return UserLevel.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  }

  // 添加经验值
  async addXP(
    userId: string,
    xp: number,
    category?: SkillCategory,
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean;
    levelUp: boolean;
    newLevel?: number;
    skillLevelUp?: { category: SkillCategory; newLevel: number };
    rewards?: { points: number; items: string[] };
    totalXP: number;
    nextLevelXP: number;
  }> {
    let userLevel = await this.getUserLevel(userId);

    if (!userLevel) {
      // 初始化用户等级记录
      await this.initializeUserLevel(userId);
      userLevel = await this.getUserLevel(userId);
    }

    if (!userLevel) {
      throw new AppError('Failed to initialize user level', 500);
    }

    const oldLevel = userLevel.overallLevel;
    const result = await userLevel.addXP(xp, category);

    // 处理升级奖励
    if (result.levelUp && result.rewards) {
      // 分发升级积分奖励
      await this.pointsService.addPoints(
        userId,
        result.rewards.points,
        {
          category: 'level_up_reward',
          reference: {
            type: 'level_up',
            id: `level_${result.newLevel}`,
            name: `Level ${result.newLevel} reached`
          },
          metadata: {
            oldLevel,
            newLevel: result.newLevel,
            category,
            xpEarned: xp,
            ...metadata
          }
        }
      );

      // 发布升级事件
      this.eventBus.emit('level.up', {
        userId,
        oldLevel,
        newLevel: result.newLevel,
        category: 'overall',
        totalXP: userLevel.overallXP,
        pointsReward: result.rewards.points,
        items: result.rewards.items
      });
    }

    // 处理技能升级奖励
    if (result.skillLevelUp) {
      const skillRewards = userLevel.calculateSkillLevelReward(
        result.skillLevelUp.category,
        result.skillLevelUp.newLevel
      );

      if (skillRewards.points > 0) {
        await this.pointsService.addPoints(
          userId,
          skillRewards.points,
          {
            category: 'skill_unlock',
            reference: {
              type: 'skill_level_up',
              id: `${result.skillLevelUp.category}_${result.skillLevelUp.newLevel}`,
              name: `${result.skillLevelUp.category} level ${result.skillLevelUp.newLevel}`
            },
            metadata: {
              skillCategory: result.skillLevelUp.category,
              newLevel: result.skillLevelUp.newLevel,
              xpEarned: xp,
              ...metadata
            }
          }
        );
      }

      // 发布技能升级事件
      this.eventBus.emit('level.skill_up', {
        userId,
        category: result.skillLevelUp.category,
        newLevel: result.skillLevelUp.newLevel,
        pointsReward: skillRewards.points,
        items: skillRewards.items
      });
    }

    // 发布经验获得事件
    this.eventBus.emit('level.xp_gained', {
      userId,
      xpGained: xp,
      category,
      totalXP: userLevel.overallXP,
      currentLevel: userLevel.overallLevel,
      metadata
    });

    return {
      success: true,
      levelUp: result.levelUp,
      newLevel: result.newLevel,
      skillLevelUp: result.skillLevelUp,
      rewards: result.rewards,
      totalXP: userLevel.overallXP,
      nextLevelXP: userLevel.getXPToNextLevel()
    };
  }

  // 获取等级排行榜
  async getLevelLeaderboard(
    category?: SkillCategory,
    limit = 10
  ): Promise<any[]> {
    return UserLevel.getLeaderboard(category, limit);
  }

  // 获取用户等级统计
  async getUserLevelStats(userId: string): Promise<{
    overallLevel: number;
    overallXP: number;
    nextLevelXP: number;
    totalXPEarned: number;
    skillProgress: any[];
    recentLevelUps: any[];
    prestige: {
      level: number;
      canPrestige: boolean;
      nextPrestigeXP: number;
      bonusMultiplier: number;
    };
  }> {
    const userLevel = await this.getUserLevel(userId);
    
    if (!userLevel) {
      throw new AppError('User level not found', 404);
    }

    const skillProgress = userLevel.getSkillProgress();
    const recentLevelUps = userLevel.levelHistory
      .sort((a, b) => b.reachedAt.getTime() - a.reachedAt.getTime())
      .slice(0, 5);

    return {
      overallLevel: userLevel.overallLevel,
      overallXP: userLevel.overallXP,
      nextLevelXP: userLevel.getXPToNextLevel(),
      totalXPEarned: userLevel.totalXPEarned,
      skillProgress,
      recentLevelUps,
      prestige: {
        level: userLevel.prestige.level,
        canPrestige: userLevel.canPrestige(),
        nextPrestigeXP: 2500, // 50级需要的XP（简化计算）
        bonusMultiplier: userLevel.prestige.bonusMultiplier
      }
    };
  }

  // 威望重生
  async prestigeRebirth(
    userId: string,
    idempotencyKey?: string
  ): Promise<{
    success: boolean;
    newPrestigeLevel: number;
    bonusMultiplier: number;
    rewards: { points: number; items: string[] };
  }> {
    const userLevel = await this.getUserLevel(userId);
    
    if (!userLevel) {
      throw new AppError('User level not found', 404);
    }

    const result = await userLevel.prestigeRebirth();
    
    if (!result.success) {
      throw new AppError('Cannot prestige at current level', 400);
    }

    // 分发威望奖励
    await this.pointsService.addPoints(
      userId,
      result.rewards.points,
      {
        category: 'level_up_reward',
        reference: {
          type: 'prestige_rebirth',
          id: `prestige_${result.newPrestigeLevel}`,
          name: `Prestige Level ${result.newPrestigeLevel}`
        },
        metadata: {
          prestigeLevel: result.newPrestigeLevel,
          totalRebirths: userLevel.prestige.totalRebirths,
          bonusMultiplier: result.bonusMultiplier
        }
      },
      idempotencyKey
    );

    // 发布威望事件
    this.eventBus.emit('level.prestige', {
      userId,
      prestigeLevel: result.newPrestigeLevel,
      totalRebirths: userLevel.prestige.totalRebirths,
      bonusMultiplier: result.bonusMultiplier,
      pointsReward: result.rewards.points,
      items: result.rewards.items
    });

    return result;
  }

  // 获取经验值建议
  async getXPRecommendations(userId: string): Promise<{
    currentLevel: number;
    nextLevelXP: number;
    recommendations: {
      action: string;
      xpReward: number;
      category?: SkillCategory;
      description: string;
    }[];
  }> {
    const userLevel = await this.getUserLevel(userId);
    
    if (!userLevel) {
      throw new AppError('User level not found', 404);
    }

    const recommendations = [
      {
        action: 'complete_task',
        xpReward: 25,
        description: '完成一个简单任务'
      },
      {
        action: 'complete_difficult_task',
        xpReward: 75,
        description: '完成一个困难任务'
      },
      {
        action: 'maintain_streak',
        xpReward: 50,
        description: '维持3天连击'
      },
      {
        action: 'unlock_achievement',
        xpReward: 100,
        description: '解锁一个成就'
      },
      {
        action: 'skill_practice',
        xpReward: 30,
        category: 'academic' as SkillCategory,
        description: '练习学术技能'
      }
    ];

    return {
      currentLevel: userLevel.overallLevel,
      nextLevelXP: userLevel.getXPToNextLevel(),
      recommendations
    };
  }

  // 获取技能树信息
  async getSkillTree(userId: string): Promise<{
    skills: {
      category: SkillCategory;
      level: number;
      totalXP: number;
      progress: number;
      nextLevelXP: number;
      unlockedAbilities: string[];
      nextAbilities: string[];
    }[];
    overallProgress: number;
  }> {
    const userLevel = await this.getUserLevel(userId);
    
    if (!userLevel) {
      throw new AppError('User level not found', 404);
    }

    const skillCategories: SkillCategory[] = ['academic', 'life_skills', 'creativity', 'social', 'physical'];
    const skills = [];

    for (const category of skillCategories) {
      const skillLevel = userLevel.skillLevels.find(s => s.category === category);
      const level = skillLevel ? skillLevel.level : 1;
      const totalXP = skillLevel ? skillLevel.totalXP : 0;
      const nextLevelXP = userLevel.getXPToNextLevel(category);
      const progress = Math.floor(((totalXP % 50) / 50) * 100); // 简化进度计算

      skills.push({
        category,
        level,
        totalXP,
        progress,
        nextLevelXP,
        unlockedAbilities: this.getUnlockedAbilities(category, level),
        nextAbilities: this.getNextAbilities(category, level)
      });
    }

    const overallProgress = Math.floor((userLevel.overallXP / userLevel.nextLevelXP) * 100);

    return {
      skills,
      overallProgress
    };
  }

  // 初始化用户等级记录
  async initializeUserLevel(userId: string): Promise<void> {
    const existingLevel = await UserLevel.findOne({ 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    if (!existingLevel) {
      const userLevel = new UserLevel({
        userId: new mongoose.Types.ObjectId(userId),
        overallLevel: 1,
        overallXP: 0,
        skillLevels: [
          { category: 'academic', level: 1, currentXP: 0, totalXP: 0, unlockedAt: new Date() },
          { category: 'life_skills', level: 1, currentXP: 0, totalXP: 0, unlockedAt: new Date() },
          { category: 'creativity', level: 1, currentXP: 0, totalXP: 0, unlockedAt: new Date() },
          { category: 'social', level: 1, currentXP: 0, totalXP: 0, unlockedAt: new Date() },
          { category: 'physical', level: 1, currentXP: 0, totalXP: 0, unlockedAt: new Date() }
        ],
        levelHistory: [{
          level: 1,
          reachedAt: new Date(),
          xpAtLevel: 0
        }],
        totalXPEarned: 0,
        nextLevelXP: 100,
        prestige: {
          level: 0,
          totalRebirths: 0,
          bonusMultiplier: 1.0
        }
      });

      await userLevel.save();
    }
  }

  // 私有方法：获取已解锁能力
  private getUnlockedAbilities(category: SkillCategory, level: number): string[] {
    const abilities = {
      academic: ['基础学习', '笔记技巧', '时间管理', '深度思考', '知识整合'],
      life_skills: ['基础生活', '整理收纳', '烹饪技能', '理财规划', '独立生活'],
      creativity: ['创意思维', '艺术表达', '手工制作', '设计思维', '创新能力'],
      social: ['基础社交', '团队协作', '沟通技巧', '领导能力', '人际关系'],
      physical: ['基础运动', '体能训练', '协调能力', '运动技巧', '健康管理']
    };

    const categoryAbilities = abilities[category] || [];
    return categoryAbilities.slice(0, Math.min(level, categoryAbilities.length));
  }

  // 私有方法：获取下一级能力
  private getNextAbilities(category: SkillCategory, level: number): string[] {
    const unlockedAbilities = this.getUnlockedAbilities(category, level);
    const allAbilities = this.getUnlockedAbilities(category, 10); // 获取最多10级的能力
    
    return allAbilities.slice(unlockedAbilities.length, unlockedAbilities.length + 2);
  }
}
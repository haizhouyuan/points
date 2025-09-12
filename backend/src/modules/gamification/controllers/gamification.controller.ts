import { Request, Response, NextFunction } from 'express';
import { AchievementService } from '../services/achievement.service';
import { StreakService } from '../services/streak.service';
import { LevelService } from '../services/level.service';
import { AppError } from '@shared/middleware/error-handler';
import { AchievementCategory, StreakCategory, SkillCategory } from '@shared/types/common';

export class GamificationController {
  private achievementService: AchievementService;
  private streakService: StreakService;
  private levelService: LevelService;

  constructor() {
    this.achievementService = new AchievementService();
    this.streakService = new StreakService();
    this.levelService = new LevelService();
  }

  // === 成就相关 ===
  
  // 获取所有成就
  getAchievements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category } = req.query;
      
      const achievements = await this.achievementService.getAllAchievements(
        category as AchievementCategory
      );

      res.json({
        success: true,
        data: achievements,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取用户成就进度
  getUserAchievements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      const { status } = req.query;

      const achievements = await this.achievementService.getUserAchievements(
        userId,
        status as any
      );

      res.json({
        success: true,
        data: achievements,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取成就汇总
  getAchievementSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;

      const summary = await this.achievementService.getUserAchievementSummary(userId);

      res.json({
        success: true,
        data: summary,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 领取成就奖励
  claimAchievement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { achievementId } = req.params;
      const { userId } = req.user!;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      const result = await this.achievementService.claimAchievement(
        userId,
        achievementId,
        idempotencyKey
      );

      res.json({
        success: true,
        data: result,
        message: 'Achievement claimed successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 成就排行榜
  getAchievementLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, limit = 10 } = req.query;

      const leaderboard = await this.achievementService.getAchievementLeaderboard(
        category as AchievementCategory,
        parseInt(limit as string)
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

  // === 连击相关 ===

  // 获取用户连击记录
  getUserStreaks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;

      const streaks = await this.streakService.getUserStreaks(userId);

      res.json({
        success: true,
        data: streaks,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取连击统计
  getStreakStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;

      const stats = await this.streakService.getUserStreakStats(userId);

      res.json({
        success: true,
        data: stats,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 恢复连击
  restoreStreak = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category } = req.body;
      const { userId } = req.user!;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      if (!category) {
        throw new AppError('Category is required', 400);
      }

      const result = await this.streakService.restoreStreak(
        userId,
        category as StreakCategory,
        idempotencyKey
      );

      res.json({
        success: true,
        data: result,
        message: 'Streak restored successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 连击排行榜
  getStreakLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, limit = 10 } = req.query;

      const leaderboard = await this.streakService.getStreakLeaderboard(
        category as StreakCategory,
        parseInt(limit as string)
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

  // === 等级相关 ===

  // 获取用户等级信息
  getUserLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;

      const userLevel = await this.levelService.getUserLevel(userId);

      if (!userLevel) {
        // 初始化用户等级
        await this.levelService.initializeUserLevel(userId);
        const newUserLevel = await this.levelService.getUserLevel(userId);
        
        res.json({
          success: true,
          data: newUserLevel,
          requestId: req.requestId
        });
        return;
      }

      res.json({
        success: true,
        data: userLevel,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取等级统计
  getLevelStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;

      const stats = await this.levelService.getUserLevelStats(userId);

      res.json({
        success: true,
        data: stats,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 威望重生
  prestigeRebirth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      const result = await this.levelService.prestigeRebirth(userId, idempotencyKey);

      res.json({
        success: true,
        data: result,
        message: 'Prestige rebirth successful',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 等级排行榜
  getLevelLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, limit = 10 } = req.query;

      const leaderboard = await this.levelService.getLevelLeaderboard(
        category as SkillCategory,
        parseInt(limit as string)
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

  // 获取经验值建议
  getXPRecommendations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;

      const recommendations = await this.levelService.getXPRecommendations(userId);

      res.json({
        success: true,
        data: recommendations,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取技能树
  getSkillTree = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;

      const skillTree = await this.levelService.getSkillTree(userId);

      res.json({
        success: true,
        data: skillTree,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // === 综合游戏化数据 ===

  // 获取用户完整游戏化数据
  getGameProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;

      // 并行获取所有游戏化数据
      const [
        achievements,
        achievementSummary,
        streaks,
        streakStats,
        userLevel,
        levelStats
      ] = await Promise.all([
        this.achievementService.getUserAchievements(userId),
        this.achievementService.getUserAchievementSummary(userId),
        this.streakService.getUserStreaks(userId),
        this.streakService.getUserStreakStats(userId),
        this.levelService.getUserLevel(userId),
        this.levelService.getUserLevelStats(userId)
      ]);

      const gameProfile = {
        level: {
          ...userLevel?.toObject(),
          stats: levelStats
        },
        achievements: {
          progress: achievements,
          summary: achievementSummary
        },
        streaks: {
          records: streaks,
          stats: streakStats
        },
        generatedAt: new Date()
      };

      res.json({
        success: true,
        data: gameProfile,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 手动添加经验值（仅限家长或管理员）
  addXP = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetUserId, xp, category, reason } = req.body;
      const { userId: operatorId, role } = req.user!;

      // 检查权限
      if (role !== 'parent') {
        throw new AppError('Only parents can manually add XP', 403);
      }

      const result = await this.levelService.addXP(
        targetUserId,
        xp,
        category as SkillCategory,
        {
          reason,
          operatorId,
          manual: true
        }
      );

      res.json({
        success: true,
        data: result,
        message: 'XP added successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 初始化用户游戏化数据
  initializeGameProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;

      // 并行初始化所有游戏化组件
      await Promise.all([
        this.achievementService.initializeUserAchievements(userId),
        this.streakService.initializeUserStreaks(userId),
        this.levelService.initializeUserLevel(userId)
      ]);

      res.json({
        success: true,
        message: 'Game profile initialized successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };
}
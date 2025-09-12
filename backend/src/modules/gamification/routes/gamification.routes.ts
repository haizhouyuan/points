import { Router } from 'express';
import { GamificationController } from '../controllers/gamification.controller';
import { rateLimit } from '@shared/middleware/rate-limit';
import { validateBody, validateParams, validateQuery } from '@shared/middleware/validation';
import Joi from 'joi';

const router = Router();
const gamificationController = new GamificationController();

// 验证规则
const categoryQuerySchema = Joi.object({
  category: Joi.string().valid('milestone', 'streak', 'social', 'skill', 'special').optional(),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const streakCategorySchema = Joi.object({
  category: Joi.string().valid('exercise', 'reading', 'chores', 'learning', 'creativity', 'overall').optional(),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const skillCategorySchema = Joi.object({
  category: Joi.string().valid('academic', 'life_skills', 'creativity', 'social', 'physical').optional(),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const restoreStreakSchema = Joi.object({
  category: Joi.string().valid('exercise', 'reading', 'chores', 'learning', 'creativity').required()
});

const addXPSchema = Joi.object({
  targetUserId: Joi.string().required(),
  xp: Joi.number().integer().min(1).max(1000).required(),
  category: Joi.string().valid('academic', 'life_skills', 'creativity', 'social', 'physical').optional(),
  reason: Joi.string().max(200).required()
});

// === 成就相关路由 ===

// 获取所有成就定义
router.get(
  '/achievements',
  rateLimit({ windowMs: 60000, max: 100 }),
  validateQuery(categoryQuerySchema),
  gamificationController.getAchievements
);

// 获取用户成就进度
router.get(
  '/achievements/my-progress',
  rateLimit({ windowMs: 60000, max: 100 }),
  validateQuery({ status: Joi.string().valid('locked', 'unlocked', 'claimed').optional() }),
  gamificationController.getUserAchievements
);

// 获取成就汇总
router.get(
  '/achievements/summary',
  rateLimit({ windowMs: 60000, max: 50 }),
  gamificationController.getAchievementSummary
);

// 领取成就奖励
router.post(
  '/achievements/:achievementId/claim',
  rateLimit({ windowMs: 60000, max: 20 }),
  validateParams({ achievementId: Joi.string().required() }),
  gamificationController.claimAchievement
);

// 成就排行榜
router.get(
  '/achievements/leaderboard',
  rateLimit({ windowMs: 60000, max: 50 }),
  validateQuery(categoryQuerySchema),
  gamificationController.getAchievementLeaderboard
);

// === 连击相关路由 ===

// 获取用户连击记录
router.get(
  '/streaks',
  rateLimit({ windowMs: 60000, max: 100 }),
  gamificationController.getUserStreaks
);

// 获取连击统计
router.get(
  '/streaks/stats',
  rateLimit({ windowMs: 60000, max: 50 }),
  gamificationController.getStreakStats
);

// 恢复连击
router.post(
  '/streaks/restore',
  rateLimit({ windowMs: 60000, max: 5 }), // 限制恢复频率
  validateBody(restoreStreakSchema),
  gamificationController.restoreStreak
);

// 连击排行榜
router.get(
  '/streaks/leaderboard',
  rateLimit({ windowMs: 60000, max: 50 }),
  validateQuery(streakCategorySchema),
  gamificationController.getStreakLeaderboard
);

// === 等级相关路由 ===

// 获取用户等级信息
router.get(
  '/level',
  rateLimit({ windowMs: 60000, max: 100 }),
  gamificationController.getUserLevel
);

// 获取等级统计
router.get(
  '/level/stats',
  rateLimit({ windowMs: 60000, max: 50 }),
  gamificationController.getLevelStats
);

// 威望重生
router.post(
  '/level/prestige',
  rateLimit({ windowMs: 60000, max: 3 }), // 严格限制重生频率
  gamificationController.prestigeRebirth
);

// 等级排行榜
router.get(
  '/level/leaderboard',
  rateLimit({ windowMs: 60000, max: 50 }),
  validateQuery(skillCategorySchema),
  gamificationController.getLevelLeaderboard
);

// 获取经验值建议
router.get(
  '/level/xp-recommendations',
  rateLimit({ windowMs: 60000, max: 20 }),
  gamificationController.getXPRecommendations
);

// 获取技能树
router.get(
  '/level/skill-tree',
  rateLimit({ windowMs: 60000, max: 50 }),
  gamificationController.getSkillTree
);

// === 综合路由 ===

// 获取完整游戏化档案
router.get(
  '/profile',
  rateLimit({ windowMs: 60000, max: 50 }),
  gamificationController.getGameProfile
);

// 初始化游戏化档案
router.post(
  '/profile/initialize',
  rateLimit({ windowMs: 60000, max: 5 }),
  gamificationController.initializeGameProfile
);

// 手动添加经验值（家长权限）
router.post(
  '/level/add-xp',
  rateLimit({ windowMs: 60000, max: 10 }),
  validateBody(addXPSchema),
  gamificationController.addXP
);

export { router as gamificationRoutes };
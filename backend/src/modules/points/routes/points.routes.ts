import { Router } from 'express';
import { PointsController } from '../controllers/points.controller';
import { rateLimit } from '@shared/middleware/rate-limit';
import { validateBody, validateQuery } from '@shared/middleware/validation';
import Joi from 'joi';

const router = Router();
const pointsController = new PointsController();

// 验证规则
const addPointsSchema = Joi.object({
  userId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  reason: Joi.string().max(200).required()
});

const spendPointsSchema = Joi.object({
  amount: Joi.number().positive().required(),
  reason: Joi.string().max(200).required(),
  reference: Joi.object({
    type: Joi.string().required(),
    id: Joi.string().required(),
    name: Joi.string().required()
  }).optional()
});

const statsQuerySchema = Joi.object({
  period: Joi.string().valid('day', 'week', 'month').default('week')
});

const historyQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  category: Joi.string().optional()
});

// 获取用户积分余额
router.get(
  '/balance',
  rateLimit({ windowMs: 60000, max: 100 }),
  pointsController.getBalance
);

// 获取积分交易历史
router.get(
  '/history',
  rateLimit({ windowMs: 60000, max: 100 }),
  validateQuery(historyQuerySchema),
  pointsController.getTransactionHistory
);

// 手动添加积分 (仅家长)
router.post(
  '/add',
  rateLimit({ windowMs: 60000, max: 20 }),
  validateBody(addPointsSchema),
  pointsController.addPoints
);

// 消费积分
router.post(
  '/spend',
  rateLimit({ windowMs: 60000, max: 50 }),
  validateBody(spendPointsSchema),
  pointsController.spendPoints
);

// 获取积分统计
router.get(
  '/stats',
  rateLimit({ windowMs: 60000, max: 50 }),
  validateQuery(statsQuerySchema),
  pointsController.getPointsStats
);

// 获取家庭积分排行榜
router.get(
  '/leaderboard',
  rateLimit({ windowMs: 60000, max: 50 }),
  validateQuery(statsQuerySchema),
  pointsController.getFamilyLeaderboard
);

export { router as pointsRoutes };
import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { rateLimit } from '@shared/middleware/rate-limit';
import { validateQuery } from '@shared/middleware/validation';
import Joi from 'joi';

const router = Router();
const analyticsController = new AnalyticsController();

const analyticsQuerySchema = Joi.object({
  period: Joi.string().valid('day', 'week', 'month', 'year').default('week'),
  granularity: Joi.string().valid('day', 'week', 'month').default('day')
});

// 用户活动分析
router.get(
  '/user-activity',
  rateLimit({ windowMs: 60000, max: 30 }),
  validateQuery(analyticsQuerySchema),
  analyticsController.getUserActivity
);

// 家庭分析
router.get(
  '/family',
  rateLimit({ windowMs: 60000, max: 20 }),
  validateQuery({ period: Joi.string().valid('day', 'week', 'month', 'year').default('month') }),
  analyticsController.getFamilyAnalytics
);

// 进度趋势
router.get(
  '/progress-trends',
  rateLimit({ windowMs: 60000, max: 30 }),
  validateQuery({ period: Joi.string().valid('day', 'week', 'month', 'year').default('month') }),
  analyticsController.getProgressTrends
);

export { router as analyticsRoutes };
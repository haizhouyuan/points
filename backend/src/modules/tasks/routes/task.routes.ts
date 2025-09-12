import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '@shared/middleware/auth';
import { rateLimit } from '@shared/middleware/rate-limit';
import { validateBody, validateParams, validateQuery } from '@shared/middleware/validation';
import { 
  createTaskTemplateSchema,
  quickCreateAndScheduleSchema,
  taskFilterQuerySchema,
  updateTaskStatusSchema,
  completeTaskSchema
} from '../validation/task.validation';

const router = Router();
const taskController = new TaskController();

// 应用认证中间件到所有路由
router.use(authenticate);

// 任务模板相关路由
router.post(
  '/templates',
  rateLimit({ windowMs: 60000, max: 30 }), // 每分钟30次
  validateBody(createTaskTemplateSchema),
  taskController.createTemplate
);

router.get(
  '/templates',
  rateLimit({ windowMs: 60000, max: 100 }),
  validateQuery(taskFilterQuerySchema),
  taskController.getFamilyTemplates
);

router.put(
  '/templates/:templateId',
  rateLimit({ windowMs: 60000, max: 20 }),
  validateParams({ templateId: 'string' }),
  validateBody(createTaskTemplateSchema),
  taskController.updateTemplate
);

router.delete(
  '/templates/:templateId',
  rateLimit({ windowMs: 60000, max: 10 }),
  validateParams({ templateId: 'string' }),
  taskController.deleteTemplate
);

// 快速创建并排期任务
router.post(
  '/quick-create-and-schedule',
  rateLimit({ windowMs: 60000, max: 20 }),
  validateBody(quickCreateAndScheduleSchema),
  taskController.quickCreateAndSchedule
);

// 用户任务相关路由
router.get(
  '/my-tasks',
  rateLimit({ windowMs: 60000, max: 100 }),
  validateQuery(taskFilterQuerySchema),
  taskController.getUserTasks
);

router.get(
  '/:taskId',
  rateLimit({ windowMs: 60000, max: 100 }),
  validateParams({ taskId: 'string' }),
  taskController.getTaskById
);

// 任务状态操作
router.post(
  '/:taskId/start',
  rateLimit({ windowMs: 60000, max: 50 }),
  validateParams({ taskId: 'string' }),
  taskController.startTask
);

router.post(
  '/:taskId/complete',
  rateLimit({ windowMs: 60000, max: 50 }),
  validateParams({ taskId: 'string' }),
  validateBody(completeTaskSchema),
  taskController.completeTask
);

router.post(
  '/:taskId/skip',
  rateLimit({ windowMs: 60000, max: 30 }),
  validateParams({ taskId: 'string' }),
  validateBody({ reason: 'string?' }),
  taskController.skipTask
);

// 统计和分析路由
router.get(
  '/stats/family',
  rateLimit({ windowMs: 60000, max: 50 }),
  validateQuery({ period: ['day', 'week', 'month'] }),
  taskController.getFamilyTaskStats
);

export { router as taskRoutes };
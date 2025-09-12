import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { AppError } from '@shared/middleware/error-handler';
import { 
  CreateTaskTemplateDTO, 
  QuickCreateAndScheduleDTO,
  TaskFilterQuery 
} from '@shared/types/task.types';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  // 创建任务模板
  createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { familyId, userId } = req.user!;
      const data: CreateTaskTemplateDTO = req.body;

      const template = await this.taskService.createTemplate(familyId, userId, data);

      res.status(201).json({
        success: true,
        data: template,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 快速创建并排期任务
  quickCreateAndSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { familyId, userId } = req.user!;
      const data: QuickCreateAndScheduleDTO = req.body;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      const result = await this.taskService.quickCreateAndSchedule(
        familyId, 
        userId, 
        data, 
        idempotencyKey
      );

      res.status(201).json({
        success: true,
        data: {
          template: result.template,
          scheduledTask: result.scheduledTask,
          message: 'Task created and scheduled successfully'
        },
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取用户任务列表
  getUserTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { familyId, userId } = req.user!;
      const filters: TaskFilterQuery = {
        status: req.query.status as string,
        category: req.query.category as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };

      const tasks = await this.taskService.getUserTasks(userId, familyId, filters);

      res.json({
        success: true,
        data: {
          tasks,
          pagination: {
            limit: filters.limit,
            offset: filters.offset,
            total: tasks.length
          }
        },
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取特定任务详情
  getTaskById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId } = req.params;
      const { familyId, userId } = req.user!;

      const tasks = await this.taskService.getUserTasks(userId, familyId, {});
      const task = tasks.find(t => t._id.toString() === taskId);

      if (!task) {
        throw new AppError('Task not found', 404);
      }

      res.json({
        success: true,
        data: task,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 开始任务
  startTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId } = req.params;
      const { userId } = req.user!;

      const task = await this.taskService.startTask(taskId, userId);

      res.json({
        success: true,
        data: task,
        message: 'Task started successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 完成任务
  completeTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId } = req.params;
      const { userId } = req.user!;
      const { evidence, notes } = req.body;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      const task = await this.taskService.completeTask(
        taskId, 
        userId, 
        { evidence, notes },
        idempotencyKey
      );

      res.json({
        success: true,
        data: task,
        message: 'Task completed successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 跳过任务
  skipTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId } = req.params;
      const { userId } = req.user!;
      const { reason } = req.body;

      const task = await this.taskService.skipTask(taskId, userId, reason);

      res.json({
        success: true,
        data: task,
        message: 'Task skipped',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取家庭任务统计
  getFamilyTaskStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.user!;
      const period = (req.query.period as 'day' | 'week' | 'month') || 'week';

      const stats = await this.taskService.getFamilyTaskStats(familyId, period);

      res.json({
        success: true,
        data: {
          stats,
          period,
          generatedAt: new Date()
        },
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取任务模板列表
  getFamilyTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.user!;
      const filters = {
        category: req.query.category as string,
        isActive: req.query.isActive === 'true' ? true : 
                  req.query.isActive === 'false' ? false : undefined
      };

      const templates = await this.taskService.getFamilyTemplates(familyId, filters);

      res.json({
        success: true,
        data: templates,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 更新任务模板
  updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { templateId } = req.params;
      const { familyId } = req.user!;
      const updates = req.body;

      // 简化实现 - 直接更新模板
      const template = await this.taskService.updateTemplate(templateId, familyId, updates);

      res.json({
        success: true,
        data: template,
        message: 'Template updated successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 删除任务模板
  deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { templateId } = req.params;
      const { familyId } = req.user!;

      await this.taskService.deleteTemplate(templateId, familyId);

      res.json({
        success: true,
        message: 'Template deleted successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };
}
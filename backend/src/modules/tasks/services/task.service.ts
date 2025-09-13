import mongoose from 'mongoose';
import { TaskTemplate, ITaskTemplate, ScheduledTask, IScheduledTask } from '../models/task.model';
import { PointsService } from '@modules/points/services/points.service';
import { EventBus } from '@shared/events/event-bus';
import { 
  CreateTaskTemplateDTO, 
  ScheduleTaskDTO, 
  UpdateTaskStatusDTO,
  TaskFilterQuery,
  QuickCreateAndScheduleDTO 
} from '@shared/types/task.types';
import { AppError } from '@shared/middleware/error-handler';

export class TaskService {
  private pointsService: PointsService;
  private eventBus: EventBus;

  constructor() {
    this.pointsService = new PointsService();
    this.eventBus = EventBus.getInstance();
  }

  // 创建任务模板
  async createTemplate(
    familyId: string,
    createdBy: string,
    data: CreateTaskTemplateDTO
  ): Promise<ITaskTemplate> {
    const template = new TaskTemplate({
      ...data,
      familyId: new mongoose.Types.ObjectId(familyId),
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });

    await template.save();

    // 发布事件
    this.eventBus.emit('task.template.created', {
      templateId: template._id,
      familyId,
      createdBy,
      name: template.name,
      category: template.category
    });

    return template;
  }

  // 快速创建并排期任务
  async quickCreateAndSchedule(
    familyId: string,
    userId: string,
    data: QuickCreateAndScheduleDTO,
    idempotencyKey?: string
  ): Promise<{ template: ITaskTemplate; scheduledTask: IScheduledTask }> {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // 检查幂等性
        if (idempotencyKey) {
          const existing = await ScheduledTask.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            'metadata.idempotencyKey': idempotencyKey
          }).session(session);

          if (existing) {
            throw new AppError('Task already scheduled with this key', 409);
          }
        }

        // 创建模板
        const template = new TaskTemplate({
          familyId: new mongoose.Types.ObjectId(familyId),
          name: data.name,
          description: data.description,
          category: data.category,
          difficulty: data.difficulty,
          pointsReward: data.pointsReward || this.calculateDefaultReward(data.difficulty),
          xpReward: data.xpReward || Math.floor(data.difficulty * 10),
          estimatedMinutes: data.estimatedMinutes,
          requiresEvidence: data.requiresEvidence || false,
          evidenceTypes: data.evidenceTypes || [],
          skillCategories: data.skillCategories || [],
          tags: data.tags || [],
          isActive: true,
          createdBy: new mongoose.Types.ObjectId(userId),
        });

        await template.save({ session });

        // 立即排期
        const scheduledTask = new ScheduledTask({
          templateId: template._id,
          userId: new mongoose.Types.ObjectId(userId),
          familyId: new mongoose.Types.ObjectId(familyId),
          scheduledAt: data.scheduledAt || new Date(),
          estimatedDuration: data.estimatedMinutes,
          status: 'planned',
          approval: {
            required: data.requiresApproval || false
          },
          metadata: idempotencyKey ? { idempotencyKey } : undefined
        });

        await scheduledTask.save({ session });

        // 发布事件
        this.eventBus.emit('task.scheduled', {
          taskId: scheduledTask._id,
          templateId: template._id,
          userId,
          familyId,
          scheduledAt: scheduledTask.scheduledAt,
          pointsReward: template.pointsReward
        });

        return { template, scheduledTask };
      });

      return await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // 获取用户任务列表
  async getUserTasks(
    userId: string,
    familyId: string,
    filters: TaskFilterQuery = {}
  ): Promise<IScheduledTask[]> {
    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
      familyId: new mongoose.Types.ObjectId(familyId)
    };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.category) {
      // 需要关联查询模板
    }

    if (filters.dateFrom || filters.dateTo) {
      query.scheduledAt = {};
      if (filters.dateFrom) query.scheduledAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.scheduledAt.$lte = new Date(filters.dateTo);
    }

    return ScheduledTask
      .find(query)
      .populate('templateId')
      .sort({ scheduledAt: -1 })
      .limit(filters.limit || 50)
      .skip(filters.offset || 0);
  }

  // 开始任务
  async startTask(taskId: string, userId: string): Promise<IScheduledTask> {
    const task = await ScheduledTask.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      userId: new mongoose.Types.ObjectId(userId),
      status: 'planned'
    });

    if (!task) {
      throw new AppError('Task not found or already started', 404);
    }

    task.status = 'in_progress';
    task.startedAt = new Date();
    await task.save();

    this.eventBus.emit('task.started', {
      taskId: task._id,
      userId,
      startedAt: task.startedAt
    });

    return task;
  }

  // 完成任务
  async completeTask(
    taskId: string,
    userId: string,
    data: {
      evidence?: {
        type: string;
        fileIds: string[];
        notes: string;
      };
      notes?: string;
    },
    idempotencyKey?: string
  ): Promise<IScheduledTask> {
    const session = await mongoose.startSession();

    try {
      let task: IScheduledTask | null = null;

      await session.withTransaction(async () => {
        task = await ScheduledTask.findOne({
          _id: new mongoose.Types.ObjectId(taskId),
          userId: new mongoose.Types.ObjectId(userId),
          status: 'in_progress'
        }).populate('templateId').session(session);

        if (!task) {
          throw new AppError('Task not found or not in progress', 404);
        }

        // 检查幂等性
        if (idempotencyKey && task.rewards?.ledgerEntryId) {
          throw new AppError('Task already completed', 409);
        }

        const template = task.templateId as unknown as ITaskTemplate;
        const completedAt = new Date();
        const actualDuration = task.startedAt 
          ? Math.floor((completedAt.getTime() - task.startedAt.getTime()) / 1000 / 60)
          : null;

        // 更新任务状态
        task.status = 'completed';
        task.completedAt = completedAt;
        task.actualDuration = actualDuration;
        task.notes = data.notes;

        if (data.evidence) {
          task.evidence = {
            type: data.evidence.type,
            fileIds: data.evidence.fileIds.map(id => new mongoose.Types.ObjectId(id)),
            notes: data.evidence.notes,
            submittedAt: completedAt
          };

          // 如果需要审批
          if (template.requiresEvidence && task.approval?.required) {
            task.approval.status = 'pending';
          }
        }

        // 计算奖励
        const bonusMultiplier = this.calculateBonusMultiplier(template, task);
        const pointsEarned = Math.floor(template.pointsReward * bonusMultiplier);
        const xpEarned = Math.floor(template.xpReward * bonusMultiplier);

        // 分发积分
        const pointsTransaction = await this.pointsService.addPoints(
          userId,
          pointsEarned,
          {
            category: 'task_completion',
            reference: {
              type: 'task',
              id: task._id.toString(),
              name: template.name
            },
            metadata: {
              taskId: task._id.toString(),
              templateId: template._id.toString(),
              bonusMultiplier,
              estimatedDuration: template.estimatedMinutes,
              actualDuration
            }
          },
          idempotencyKey,
          session
        );

        // 记录奖励信息
        task.rewards = {
          pointsEarned,
          xpEarned,
          bonusMultiplier,
          distributedAt: completedAt,
          ledgerEntryId: pointsTransaction._id
        };

        await task.save({ session });

        // 发布完成事件
        this.eventBus.emit('task.completed', {
          taskId: task._id,
          userId,
          familyId: task.familyId,
          templateId: template._id,
          category: template.category,
          pointsEarned,
          xpEarned,
          bonusMultiplier,
          completedAt,
          actualDuration
        });
      });

      return task!;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // 跳过任务
  async skipTask(
    taskId: string, 
    userId: string, 
    reason?: string
  ): Promise<IScheduledTask> {
    const task = await ScheduledTask.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: ['planned', 'in_progress'] }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    task.status = 'skipped';
    task.notes = reason;
    await task.save();

    this.eventBus.emit('task.skipped', {
      taskId: task._id,
      userId,
      reason,
      skippedAt: new Date()
    });

    return task;
  }

  // 获取家庭任务统计
  async getFamilyTaskStats(familyId: string, period: 'day' | 'week' | 'month' = 'week') {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const stats = await ScheduledTask.aggregate([
      {
        $match: {
          familyId: new mongoose.Types.ObjectId(familyId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            userId: '$userId',
            status: '$status'
          },
          count: { $sum: 1 },
          totalPoints: { $sum: '$rewards.pointsEarned' }
        }
      },
      {
        $group: {
          _id: '$_id.userId',
          stats: {
            $push: {
              status: '$_id.status',
              count: '$count',
              totalPoints: '$totalPoints'
            }
          }
        }
      }
    ]);

    return stats;
  }

  // 获取任务模板列表
  async getFamilyTemplates(
    familyId: string,
    filters: { category?: string; isActive?: boolean } = {}
  ): Promise<ITaskTemplate[]> {
    const query: any = { familyId: new mongoose.Types.ObjectId(familyId) };
    
    if (filters.category) query.category = filters.category;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    return TaskTemplate.find(query).sort({ createdAt: -1 });
  }

  // 私有方法：计算默认奖励
  private calculateDefaultReward(difficulty: number): number {
    const baseReward = 20;
    return baseReward + (difficulty - 1) * 15;
  }

  // 更新任务模板
  async updateTemplate(
    templateId: string,
    familyId: string,
    updates: Partial<CreateTaskTemplateDTO>
  ): Promise<ITaskTemplate> {
    const template = await TaskTemplate.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(templateId),
        familyId: new mongoose.Types.ObjectId(familyId)
      },
      updates,
      { new: true, runValidators: true }
    );

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    this.eventBus.emit('task.template.updated', {
      templateId: template._id,
      familyId,
      updates
    });

    return template;
  }

  // 删除任务模板
  async deleteTemplate(templateId: string, familyId: string): Promise<void> {
    const template = await TaskTemplate.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(templateId),
        familyId: new mongoose.Types.ObjectId(familyId)
      },
      { isActive: false },
      { new: true }
    );

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    this.eventBus.emit('task.template.deleted', {
      templateId: template._id,
      familyId
    });
  }

  // 私有方法：计算奖励倍数
  private calculateBonusMultiplier(template: ITaskTemplate, task: IScheduledTask): number {
    let multiplier = 1.0;

    // 准时完成奖励
    if (task.actualDuration && task.actualDuration <= template.estimatedMinutes) {
      multiplier += 0.2;
    }

    // 提前完成奖励
    if (task.completedAt && task.scheduledAt) {
      const scheduledTime = new Date(task.scheduledAt).getTime();
      const completedTime = task.completedAt.getTime();
      
      if (completedTime < scheduledTime) {
        multiplier += 0.1;
      }
    }

    return Math.min(multiplier, 2.0); // 最高2倍奖励
  }
}
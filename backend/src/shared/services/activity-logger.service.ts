import mongoose from 'mongoose';
import { ActivityLog, IActivityLog, ActivityType, ActivityCategory, ActivityImportance } from '../models/activity-log.model';
import { EventBus } from '@shared/events/event-bus';
import { Logger } from '@shared/utils/logger';

export interface LogActivityData {
  type: ActivityType;
  title?: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  importance?: ActivityImportance;
  data?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    metadata?: Record<string, any>;
    context?: {
      userAgent?: string;
      ipAddress?: string;
      sessionId?: string;
      requestId?: string;
    };
  };
  tags?: string[];
}

export class ActivityLoggerService {
  private eventBus: EventBus;
  private logger: Logger;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
    this.logger = new Logger('ActivityLoggerService');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Task-related events
    this.eventBus.on('task.created', this.handleTaskCreated.bind(this));
    this.eventBus.on('task.completed', this.handleTaskCompleted.bind(this));
    this.eventBus.on('task.scheduled', this.handleTaskScheduled.bind(this));

    // Points events
    this.eventBus.on('points.earned', this.handlePointsEarned.bind(this));
    this.eventBus.on('points.deducted', this.handlePointsDeducted.bind(this));

    // Gamification events
    this.eventBus.on('gamification.achievement_unlocked', this.handleAchievementUnlocked.bind(this));
    this.eventBus.on('gamification.level_up', this.handleLevelUp.bind(this));
    this.eventBus.on('gamification.streak_milestone', this.handleStreakMilestone.bind(this));

    // Social events
    this.eventBus.on('social.post_created', this.handlePostCreated.bind(this));
    this.eventBus.on('social.challenge_created', this.handleChallengeCreated.bind(this));
    this.eventBus.on('social.challenge_joined', this.handleChallengeJoined.bind(this));

    // User events
    this.eventBus.on('auth.user_login', this.handleUserLogin.bind(this));
    this.eventBus.on('auth.user_registered', this.handleUserRegistered.bind(this));

    this.logger.info('Activity logger event listeners registered');
  }

  // Core logging method
  async logActivity(
    familyId: string,
    userId: string | undefined,
    activityData: LogActivityData
  ): Promise<IActivityLog> {
    try {
      const category = this.determineCategory(activityData.type);
      const title = activityData.title || this.generateTitle(activityData.type);
      const description = activityData.description || this.generateDescription(activityData.type, activityData.data);

      const activity = new ActivityLog({
        familyId,
        userId,
        type: activityData.type,
        category,
        importance: activityData.importance || ActivityImportance.NORMAL,
        title,
        description,
        entityType: activityData.entityType,
        entityId: activityData.entityId,
        data: activityData.data || {},
        tags: activityData.tags || [],
        timestamp: new Date()
      });

      await activity.save();

      this.logger.info('Activity logged successfully', {
        activityId: activity._id,
        type: activityData.type,
        familyId,
        userId
      });

      return activity;

    } catch (error) {
      this.logger.error('Failed to log activity', {
        error,
        type: activityData.type,
        familyId,
        userId
      });
      throw error;
    }
  }

  // Event handlers
  private async handleTaskCreated(eventData: {
    taskId: string;
    familyId: string;
    createdBy: string;
    title: string;
    category: string;
  }): Promise<void> {
    await this.logActivity(eventData.familyId, eventData.createdBy, {
      type: ActivityType.TASK_CREATED,
      entityType: 'task',
      entityId: eventData.taskId,
      data: {
        metadata: {
          taskTitle: eventData.title,
          taskCategory: eventData.category
        }
      }
    });
  }

  private async handleTaskCompleted(eventData: {
    taskId: string;
    userId: string;
    familyId: string;
    taskTitle: string;
    pointsEarned: number;
    category: string;
  }): Promise<void> {
    await this.logActivity(eventData.familyId, eventData.userId, {
      type: ActivityType.TASK_COMPLETED,
      importance: ActivityImportance.NORMAL,
      entityType: 'task',
      entityId: eventData.taskId,
      data: {
        metadata: {
          taskTitle: eventData.taskTitle,
          pointsEarned: eventData.pointsEarned,
          category: eventData.category
        }
      }
    });
  }

  private async handleTaskScheduled(eventData: {
    taskId: string;
    userId: string;
    familyId: string;
    scheduledDate: Date;
  }): Promise<void> {
    await this.logActivity(eventData.familyId, eventData.userId, {
      type: ActivityType.TASK_SCHEDULED,
      entityType: 'task',
      entityId: eventData.taskId,
      data: {
        metadata: {
          scheduledDate: eventData.scheduledDate
        }
      }
    });
  }

  private async handlePointsEarned(eventData: {
    userId: string;
    familyId: string;
    amount: number;
    source: string;
    sourceId?: string;
  }): Promise<void> {
    await this.logActivity(eventData.familyId, eventData.userId, {
      type: ActivityType.POINTS_EARNED,
      importance: ActivityImportance.NORMAL,
      entityType: eventData.source,
      entityId: eventData.sourceId,
      data: {
        metadata: {
          amount: eventData.amount,
          source: eventData.source
        }
      }
    });
  }

  private async handlePointsDeducted(eventData: {
    userId: string;
    familyId: string;
    amount: number;
    reason: string;
    entityId?: string;
  }): Promise<void> {
    await this.logActivity(eventData.familyId, eventData.userId, {
      type: ActivityType.POINTS_DEDUCTED,
      importance: ActivityImportance.NORMAL,
      entityType: 'redemption',
      entityId: eventData.entityId,
      data: {
        metadata: {
          amount: eventData.amount,
          reason: eventData.reason
        }
      }
    });
  }

  private async handleAchievementUnlocked(eventData: {
    achievementId: string;
    userId: string;
    familyId: string;
    achievementName: string;
    rarity: string;
  }): Promise<void> {
    await this.logActivity(eventData.familyId, eventData.userId, {
      type: ActivityType.ACHIEVEMENT_UNLOCKED,
      importance: ActivityImportance.HIGH,
      entityType: 'achievement',
      entityId: eventData.achievementId,
      data: {
        metadata: {
          achievementName: eventData.achievementName,
          rarity: eventData.rarity
        }
      }
    });
  }

  private async handleLevelUp(eventData: {
    userId: string;
    familyId: string;
    category: string;
    oldLevel: number;
    newLevel: number;
  }): Promise<void> {
    await this.logActivity(eventData.familyId, eventData.userId, {
      type: ActivityType.LEVEL_UP,
      importance: ActivityImportance.HIGH,
      data: {
        metadata: {
          category: eventData.category,
          oldLevel: eventData.oldLevel,
          newLevel: eventData.newLevel
        }
      }
    });
  }

  private async handleStreakMilestone(eventData: {
    userId: string;
    familyId: string;
    category: string;
    streakDays: number;
    milestone: number;
  }): Promise<void> {
    await this.logActivity(eventData.familyId, eventData.userId, {
      type: ActivityType.STREAK_MILESTONE,
      importance: ActivityImportance.HIGH,
      data: {
        metadata: {
          category: eventData.category,
          streakDays: eventData.streakDays,
          milestone: eventData.milestone
        }
      }
    });
  }

  private async handlePostCreated(eventData: {
    postId: string;
    familyId: string;
    userId: string;
    type: string;
  }): Promise<void> {
    await this.logActivity(eventData.familyId, eventData.userId, {
      type: ActivityType.POST_CREATED,
      entityType: 'social_post',
      entityId: eventData.postId,
      data: {
        metadata: {
          postType: eventData.type
        }
      }
    });
  }

  private async handleChallengeCreated(eventData: {
    challengeId: string;
    familyId: string;
    createdBy: string;
    title: string;
  }): Promise<void> {
    await this.logActivity(eventData.familyId, eventData.createdBy, {
      type: ActivityType.CHALLENGE_CREATED,
      importance: ActivityImportance.NORMAL,
      entityType: 'challenge',
      entityId: eventData.challengeId,
      data: {
        metadata: {
          challengeTitle: eventData.title
        }
      }
    });
  }

  private async handleChallengeJoined(eventData: {
    challengeId: string;
    familyId: string;
    userId: string;
    challengeTitle: string;
  }): Promise<void> {
    await this.logActivity(eventData.familyId, eventData.userId, {
      type: ActivityType.CHALLENGE_JOINED,
      entityType: 'challenge',
      entityId: eventData.challengeId,
      data: {
        metadata: {
          challengeTitle: eventData.challengeTitle
        }
      }
    });
  }

  private async handleUserLogin(eventData: {
    userId: string;
    familyId: string;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.logActivity(eventData.familyId, eventData.userId, {
      type: ActivityType.USER_LOGIN,
      importance: ActivityImportance.LOW,
      data: {
        context: eventData.context
      }
    });
  }

  private async handleUserRegistered(eventData: {
    userId: string;
    familyId: string;
    role: string;
  }): Promise<void> {
    await this.logActivity(eventData.familyId, eventData.userId, {
      type: ActivityType.USER_REGISTERED,
      importance: ActivityImportance.HIGH,
      data: {
        metadata: {
          role: eventData.role
        }
      }
    });
  }

  // Helper methods
  private determineCategory(type: ActivityType): ActivityCategory {
    const categoryMap: Record<string, ActivityCategory> = {
      'user_': ActivityCategory.USER,
      'task_': ActivityCategory.TASK,
      'points_': ActivityCategory.POINTS,
      'achievement_': ActivityCategory.GAMIFICATION,
      'level_': ActivityCategory.GAMIFICATION,
      'streak_': ActivityCategory.GAMIFICATION,
      'skill_': ActivityCategory.GAMIFICATION,
      'post_': ActivityCategory.SOCIAL,
      'challenge_': ActivityCategory.SOCIAL,
      'redemption_': ActivityCategory.REDEMPTION,
      'file_': ActivityCategory.FILE,
      'system_': ActivityCategory.SYSTEM
    };

    for (const prefix in categoryMap) {
      if (type.startsWith(prefix)) {
        return categoryMap[prefix];
      }
    }

    return ActivityCategory.SYSTEM;
  }

  private generateTitle(type: ActivityType): string {
    const titleMap: Record<ActivityType, string> = {
      [ActivityType.USER_REGISTERED]: '用户注册',
      [ActivityType.USER_LOGIN]: '用户登录',
      [ActivityType.USER_LOGOUT]: '用户登出',
      [ActivityType.TASK_CREATED]: '创建任务',
      [ActivityType.TASK_COMPLETED]: '完成任务',
      [ActivityType.TASK_SCHEDULED]: '安排任务',
      [ActivityType.POINTS_EARNED]: '获得积分',
      [ActivityType.POINTS_DEDUCTED]: '消费积分',
      [ActivityType.ACHIEVEMENT_UNLOCKED]: '解锁成就',
      [ActivityType.LEVEL_UP]: '等级提升',
      [ActivityType.STREAK_MILESTONE]: '连击里程碑',
      [ActivityType.POST_CREATED]: '发布动态',
      [ActivityType.CHALLENGE_CREATED]: '创建挑战',
      [ActivityType.CHALLENGE_JOINED]: '参加挑战',
      [ActivityType.REDEMPTION_REQUESTED]: '申请兑换',
      [ActivityType.FILE_UPLOADED]: '上传文件',
      // Add more mappings as needed
    } as any;

    return titleMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private generateDescription(type: ActivityType, data?: Record<string, any>): string {
    // Generate contextual descriptions based on type and data
    const metadata = data?.metadata || {};
    
    switch (type) {
      case ActivityType.TASK_COMPLETED:
        return `完成了任务"${metadata.taskTitle}"，获得${metadata.pointsEarned}积分`;
      case ActivityType.ACHIEVEMENT_UNLOCKED:
        return `解锁了${metadata.rarity}成就"${metadata.achievementName}"`;
      case ActivityType.LEVEL_UP:
        return `在${metadata.category}类别从 Lv.${metadata.oldLevel} 升到 Lv.${metadata.newLevel}`;
      case ActivityType.POINTS_EARNED:
        return `通过${metadata.source}获得了${metadata.amount}积分`;
      default:
        return `执行了${type}操作`;
    }
  }

  // Query methods
  async getActivityHistory(
    familyId: string,
    userId?: string,
    filters?: {
      type?: ActivityType;
      category?: ActivityCategory;
      importance?: ActivityImportance;
      entityType?: string;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ activities: IActivityLog[]; totalCount: number }> {
    const query: any = { familyId };
    
    if (userId) query.userId = userId;
    if (filters?.type) query.type = filters.type;
    if (filters?.category) query.category = filters.category;
    if (filters?.importance) query.importance = filters.importance;
    if (filters?.entityType) query.entityType = filters.entityType;
    
    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const [activities, totalCount] = await Promise.all([
      ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .lean()
        .exec(),
      ActivityLog.countDocuments(query)
    ]);

    return { 
      activities: activities as IActivityLog[], 
      totalCount 
    };
  }
}
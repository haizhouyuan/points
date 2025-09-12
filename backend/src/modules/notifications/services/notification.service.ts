import mongoose from 'mongoose';
import { 
  Notification, INotification,
  NotificationTemplate, INotificationTemplate,
  UserNotificationSettings, IUserNotificationSettings,
  NotificationType,
  NotificationPriority,
  NotificationChannel
} from '../models/notification.model';
import { EventBus } from '@shared/events/event-bus';
import { Logger } from '@shared/utils/logger';
import { CacheService } from '@shared/services/cache.service';

export interface CreateNotificationDTO {
  type: NotificationType;
  title?: string;
  message?: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  data?: {
    entityId?: string;
    entityType?: string;
    actionUrl?: string;
    imageUrl?: string;
    metadata?: Record<string, any>;
  };
  templateVariables?: Record<string, any>;
  expiresAt?: Date;
}

export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  limit?: number;
  cursor?: string;
}

export class NotificationService {
  private eventBus: EventBus;
  private logger: Logger;
  private cacheService: CacheService;

  constructor(eventBus?: EventBus, cacheService?: CacheService) {
    this.eventBus = eventBus || new EventBus();
    this.logger = new Logger('NotificationService');
    this.cacheService = cacheService || new CacheService();
    this.initializeDefaultTemplates();
  }

  private async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates: Partial<INotificationTemplate>[] = [
      {
        type: NotificationType.TASK_COMPLETED,
        name: 'Task Completed',
        title: '🎉 任务完成！',
        message: '{{userName}} 完成了任务 "{{taskTitle}}"，获得了 {{points}} 积分！',
        priority: NotificationPriority.NORMAL,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        variables: ['userName', 'taskTitle', 'points']
      },
      {
        type: NotificationType.ACHIEVEMENT_UNLOCKED,
        name: 'Achievement Unlocked',
        title: '🏆 解锁新成就！',
        message: '恭喜 {{userName}} 解锁了 {{rarity}} 成就："{{achievementName}}"！',
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        variables: ['userName', 'achievementName', 'rarity']
      },
      {
        type: NotificationType.LEVEL_UP,
        name: 'Level Up',
        title: '🎊 等级提升！',
        message: '{{userName}} 在 {{category}} 类别升到了 Lv.{{newLevel}}！',
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        variables: ['userName', 'category', 'newLevel']
      },
      {
        type: NotificationType.CHALLENGE_CREATED,
        name: 'New Challenge',
        title: '🚀 新挑战来了！',
        message: '{{creatorName}} 创建了新挑战："{{challengeTitle}}"，快来参加吧！',
        priority: NotificationPriority.NORMAL,
        channels: [NotificationChannel.IN_APP],
        variables: ['creatorName', 'challengeTitle']
      },
      {
        type: NotificationType.POST_LIKED,
        name: 'Post Liked',
        title: '👍 有人点赞了！',
        message: '{{userName}} 点赞了你的动态',
        priority: NotificationPriority.LOW,
        channels: [NotificationChannel.IN_APP],
        variables: ['userName']
      }
    ];

    for (const template of defaultTemplates) {
      try {
        await NotificationTemplate.findOneAndUpdate(
          { type: template.type },
          template,
          { upsert: true, new: true }
        );
      } catch (error) {
        this.logger.warn('Failed to initialize notification template', { 
          error, 
          type: template.type 
        });
      }
    }
  }

  // Create notification
  async createNotification(
    familyId: string,
    userId: string,
    data: CreateNotificationDTO
  ): Promise<INotification> {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();

      // Get template if no custom title/message provided
      let title = data.title;
      let message = data.message;
      let priority = data.priority || NotificationPriority.NORMAL;
      let channels = data.channels || [NotificationChannel.IN_APP];

      if (!title || !message) {
        const template = await NotificationTemplate.findOne({ 
          type: data.type, 
          enabled: true 
        });
        
        if (template) {
          title = title || this.interpolateTemplate(template.title, data.templateVariables || {});
          message = message || this.interpolateTemplate(template.message, data.templateVariables || {});
          priority = data.priority || template.priority;
          channels = data.channels || template.channels;
        }
      }

      if (!title || !message) {
        throw new Error('Title and message are required');
      }

      // Check user notification preferences
      const userSettings = await this.getUserNotificationSettings(userId, familyId);
      if (!this.shouldSendNotification(data.type, userSettings)) {
        this.logger.info('Notification skipped due to user settings', { 
          userId, 
          type: data.type 
        });
        await session.abortTransaction();
        return null as any; // User has disabled this type
      }

      // Create notification
      const notification = new Notification({
        familyId,
        userId,
        type: data.type,
        title,
        message,
        priority,
        channels,
        data: data.data || {},
        read: false,
        delivered: false,
        attempts: 0,
        maxAttempts: 3,
        expiresAt: data.expiresAt || this.calculateExpiry(data.type)
      });

      await notification.save({ session });

      // Emit notification created event
      await this.eventBus.publish('notification.created', {
        notificationId: notification._id,
        familyId,
        userId,
        type: data.type,
        title,
        message,
        priority,
        channels
      });

      await session.commitTransaction();

      // Clear user notifications cache
      await this.cacheService.delete(`user_notifications:${userId}`);

      this.logger.info('Notification created successfully', { 
        notificationId: notification._id, 
        userId, 
        type: data.type 
      });

      return notification;

    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Failed to create notification', { error, userId, type: data.type });
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<{ notifications: INotification[]; nextCursor?: string }> {
    const { read, type, priority, limit = 20, cursor } = filters;
    
    // Try cache first
    const cacheKey = `user_notifications:${userId}:${JSON.stringify(filters)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const query: any = { userId };

    if (read !== undefined) query.read = read;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (cursor) query._id = { $lt: cursor };

    const notifications = await Notification
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean()
      .exec();

    const hasMore = notifications.length > limit;
    const resultNotifications = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore ? resultNotifications[resultNotifications.length - 1]._id : undefined;

    const result = { 
      notifications: resultNotifications as INotification[], 
      nextCursor 
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  // Mark notification as read
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<{ success: boolean }> {
    const result = await Notification.findOneAndUpdate(
      { _id: notificationId, userId, read: false },
      { 
        read: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (result) {
      // Clear cache
      await this.cacheService.delete(`user_notifications:${userId}`);
      
      this.logger.info('Notification marked as read', { notificationId, userId });
      return { success: true };
    }

    return { success: false };
  }

  // Mark all as read
  async markAllAsRead(userId: string): Promise<{ success: boolean; count: number }> {
    const result = await Notification.updateMany(
      { userId, read: false },
      { 
        read: true, 
        readAt: new Date() 
      }
    );

    // Clear cache
    await this.cacheService.delete(`user_notifications:${userId}`);

    this.logger.info('All notifications marked as read', { userId, count: result.modifiedCount });
    
    return { success: true, count: result.modifiedCount };
  }

  // Get notification count
  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `unread_count:${userId}`;
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached) {
      return parseInt(cached, 10);
    }

    const count = await Notification.countDocuments({ userId, read: false });
    
    // Cache for 1 minute
    await this.cacheService.set(cacheKey, count.toString(), 60);
    
    return count;
  }

  // User notification settings
  async getUserNotificationSettings(
    userId: string,
    familyId: string
  ): Promise<IUserNotificationSettings> {
    let settings = await UserNotificationSettings.findOne({ userId, familyId });

    if (!settings) {
      // Create default settings
      settings = new UserNotificationSettings({
        userId,
        familyId,
        settings: this.getDefaultNotificationSettings(),
        globalSettings: {
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          },
          enableEmailDigest: true,
          digestFrequency: 'weekly'
        }
      });
      
      await settings.save();
    }

    return settings;
  }

  async updateUserNotificationSettings(
    userId: string,
    familyId: string,
    updates: Partial<IUserNotificationSettings['settings']>
  ): Promise<IUserNotificationSettings> {
    const settings = await UserNotificationSettings.findOneAndUpdate(
      { userId, familyId },
      { $set: { settings: updates } },
      { new: true, upsert: true }
    );

    this.logger.info('User notification settings updated', { userId, familyId });
    
    return settings!;
  }

  // Helper methods
  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(variables[key] || ''));
    });

    return result;
  }

  private shouldSendNotification(
    type: NotificationType,
    userSettings: IUserNotificationSettings
  ): boolean {
    const typeSettings = userSettings.settings[type];
    
    if (typeSettings && !typeSettings.enabled) {
      return false;
    }

    // Check quiet hours
    if (userSettings.globalSettings.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { start, end } = userSettings.globalSettings.quietHours;
      
      if (this.isInQuietHours(currentTime, start, end)) {
        return false;
      }
    }

    return true;
  }

  private isInQuietHours(current: string, start: string, end: string): boolean {
    const currentMinutes = this.timeToMinutes(current);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (startMinutes <= endMinutes) {
      // Same day quiet hours
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight quiet hours
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private calculateExpiry(type: NotificationType): Date {
    const expiryHours = {
      [NotificationType.TASK_REMINDER]: 24,
      [NotificationType.SYSTEM_ANNOUNCEMENT]: 7 * 24,
      [NotificationType.POST_LIKED]: 7 * 24,
      [NotificationType.POST_COMMENTED]: 7 * 24,
    };

    const hours = expiryHours[type as keyof typeof expiryHours] || 30 * 24; // Default 30 days
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  private getDefaultNotificationSettings() {
    const defaultSettings: any = {};
    
    Object.values(NotificationType).forEach(type => {
      defaultSettings[type] = {
        enabled: true,
        channels: [NotificationChannel.IN_APP]
      };
    });

    return defaultSettings;
  }
}
import { v4 as uuidv4 } from 'uuid';
import { RedisConnection } from '@shared/cache/redis';
import { Logger } from '@shared/utils/logger';

export interface DomainEvent<T = any> {
  id: string;
  type: string;
  payload: T;
  userId?: string;
  familyId?: string;
  timestamp: Date;
  version: number;
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private logger: Logger;
  private redis: RedisConnection;

  constructor(redis: RedisConnection) {
    this.redis = redis;
    this.logger = new Logger('EventBus');
  }

  public async publish<T>(eventType: string, payload: T, options?: {
    userId?: string;
    familyId?: string;
    version?: number;
  }): Promise<void> {
    const event: DomainEvent<T> = {
      id: uuidv4(),
      type: eventType,
      payload,
      timestamp: new Date(),
      version: options?.version || 1,
    };

    // Only add optional fields if they exist
    if (options?.userId) {
      event.userId = options.userId;
    }
    if (options?.familyId) {
      event.familyId = options.familyId;
    }

    try {
      // 发布到Redis（用于跨进程通信）
      const client = this.redis.getClient();
      if (client) {
        await client.publish(`events:${eventType}`, JSON.stringify(event));
      }

      // 本地事件处理
      await this.handleEvent(event);

      this.logger.debug(`Event published: ${eventType}`, { eventId: event.id });
    } catch (error) {
      this.logger.error(`Failed to publish event: ${eventType}`, error);
      throw error;
    }
  }

  public subscribe<T>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
    this.logger.debug(`Handler subscribed to event: ${eventType}`);
  }

  public unsubscribe<T>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        this.logger.debug(`Handler unsubscribed from event: ${eventType}`);
      }
    }
  }

  private async handleEvent<T>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (!handlers || handlers.length === 0) {
      return;
    }

    // 并行执行所有处理器
    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(`Event handler failed for ${event.type}:`, error);
        // 不重新抛出错误，避免影响其他处理器
      }
    });

    await Promise.all(promises);
  }

  // 启动Redis订阅监听
  public async startSubscription(): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      this.logger.warn('Redis client not available, skipping event subscription');
      return;
    }

    try {
      const subscriber = client.duplicate();
      await subscriber.connect();

      // 订阅所有事件
      await subscriber.pSubscribe('events:*', (message, channel) => {
        const eventType = channel.replace('events:', '');
        
        try {
          const event = JSON.parse(message);
          this.handleEvent(event);
        } catch (error) {
          this.logger.error(`Failed to parse event from Redis: ${channel}`, error);
        }
      });

      this.logger.info('Event subscription started');
    } catch (error) {
      this.logger.error('Failed to start event subscription:', error);
      throw error;
    }
  }
}

// 预定义的事件类型
export const EventTypes = {
  // 任务相关事件
  TASK_COMPLETED: 'task.completed',
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  
  // 积分相关事件
  POINTS_EARNED: 'points.earned',
  POINTS_SPENT: 'points.spent',
  BALANCE_CHANGED: 'points.balance_changed',
  
  // 等级与经验值事件
  LEVEL_UP: 'user.level_up',
  XP_GAINED: 'user.xp_gained',
  DAILY_GOAL_COMPLETED: 'user.daily_goal_completed',
  
  // 成就相关事件
  ACHIEVEMENT_UNLOCKED: 'achievement.unlocked',
  ACHIEVEMENT_CLAIMED: 'achievement.claimed',
  
  // 连击相关事件
  STREAK_UPDATED: 'streak.updated',
  STREAK_BROKEN: 'streak.broken',
  STREAK_MILESTONE_REACHED: 'streak.milestone_reached',
  
  // 社交相关事件
  POST_CREATED: 'social.post.created',
  POST_LIKED: 'social.post.liked',
  COMMENT_CREATED: 'social.comment.created',
  ENCOURAGEMENT_SENT: 'social.encouragement.sent',
  
  // 协作任务事件
  COLLAB_TASK_CREATED: 'collab_task.created',
  COLLAB_TASK_JOINED: 'collab_task.joined',
  COLLAB_TASK_PROGRESS_UPDATED: 'collab_task.progress_updated',
  COLLAB_TASK_COMPLETED: 'collab_task.completed',
  
  // 兑换相关事件
  REDEMPTION_REQUESTED: 'redemption.requested',
  REDEMPTION_APPROVED: 'redemption.approved',
  REDEMPTION_REJECTED: 'redemption.rejected',
  REDEMPTION_FULFILLED: 'redemption.fulfilled',
  
  // 通知事件
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',
  
  // 用户相关事件
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  FAMILY_MEMBER_JOINED: 'family.member_joined',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];
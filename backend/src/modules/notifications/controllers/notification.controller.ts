import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { SSEService } from '../services/sse.service';
import { AuthenticatedRequest } from '@shared/types/auth';
import { Logger } from '@shared/utils/logger';
import { NotificationType, NotificationPriority } from '../models/notification.model';

export class NotificationController {
  private notificationService: NotificationService;
  private sseService: SSEService;
  private logger: Logger;

  constructor(sseService?: SSEService) {
    this.notificationService = new NotificationService();
    this.sseService = sseService || new SSEService();
    this.logger = new Logger('NotificationController');
  }

  // SSE connection endpoint
  establishSSEConnection = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId, familyId } = req.user!;

      this.logger.info('Establishing SSE connection', { userId, familyId });

      const connectionId = this.sseService.createConnection(userId, familyId, req, res);

      // Send recent unread notifications
      const { notifications } = await this.notificationService.getUserNotifications(userId, {
        read: false,
        limit: 10
      });

      // Send initial notification batch
      setTimeout(() => {
        this.sseService.sendToUser(userId, 'initial_notifications', {
          notifications,
          unreadCount: notifications.length,
          connectionId
        });
      }, 100);

    } catch (error) {
      this.logger.error('Failed to establish SSE connection', { 
        error, 
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  // Get user notifications
  getUserNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      const { read, type, priority, limit, cursor } = req.query;

      const filters = {
        read: read !== undefined ? read === 'true' : undefined,
        type: type as NotificationType,
        priority: priority as NotificationPriority,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        cursor: cursor as string
      };

      const result = await this.notificationService.getUserNotifications(userId, filters);

      res.json({
        success: true,
        data: {
          notifications: result.notifications,
          pagination: {
            nextCursor: result.nextCursor,
            hasMore: !!result.nextCursor
          }
        },
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to get user notifications', { 
        error, 
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  // Mark notification as read
  markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      const { notificationId } = req.params;

      const result = await this.notificationService.markAsRead(notificationId, userId);

      res.json({
        success: result.success,
        message: result.success ? 'Notification marked as read' : 'Notification not found or already read',
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to mark notification as read', { 
        error, 
        notificationId: req.params.notificationId,
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  // Mark all notifications as read
  markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;

      const result = await this.notificationService.markAllAsRead(userId);

      // Send real-time update
      this.sseService.sendToUser(userId, 'notifications_read', {
        count: result.count,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: `${result.count} notifications marked as read`,
        data: { count: result.count },
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to mark all notifications as read', { 
        error, 
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  // Get unread count
  getUnreadCount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;

      const count = await this.notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count },
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to get unread count', { 
        error, 
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  // Get notification settings
  getNotificationSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId, familyId } = req.user!;

      const settings = await this.notificationService.getUserNotificationSettings(
        userId, 
        familyId
      );

      res.json({
        success: true,
        data: settings,
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to get notification settings', { 
        error, 
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  // Update notification settings
  updateNotificationSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId, familyId } = req.user!;
      const updates = req.body;

      const settings = await this.notificationService.updateUserNotificationSettings(
        userId,
        familyId,
        updates
      );

      res.json({
        success: true,
        message: 'Notification settings updated successfully',
        data: settings,
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to update notification settings', { 
        error, 
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  // Admin: Send notification to user
  sendNotificationToUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: adminUserId } = req.user!;
      const { userId, familyId, ...notificationData } = req.body;

      // Verify admin has permission to send notifications to this family
      if (req.user!.familyId !== familyId) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
          requestId: req.requestId
        });
      }

      const notification = await this.notificationService.createNotification(
        familyId,
        userId,
        notificationData
      );

      res.status(201).json({
        success: true,
        message: 'Notification sent successfully',
        data: notification,
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to send notification', { 
        error, 
        adminUserId: req.user?.userId 
      });
      next(error);
    }
  };

  // Test endpoint for notifications
  sendTestNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId, familyId } = req.user!;

      const notification = await this.notificationService.createNotification(
        familyId,
        userId,
        {
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: '🧪 测试通知',
          message: '这是一条测试通知，用于验证通知系统是否正常工作。',
          priority: NotificationPriority.NORMAL,
          templateVariables: {
            userName: '测试用户',
            timestamp: new Date().toLocaleString('zh-CN')
          }
        }
      );

      res.json({
        success: true,
        message: 'Test notification sent successfully',
        data: notification,
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to send test notification', { 
        error, 
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  // Get SSE connection stats (admin only)
  getConnectionStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stats = this.sseService.getConnectionStats();

      res.json({
        success: true,
        data: stats,
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to get connection stats', { error });
      next(error);
    }
  };

  // Broadcast message to family (admin only)
  broadcastToFamily = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.user!;
      const { event, data } = req.body;

      this.sseService.sendToFamily(familyId, event, data);

      res.json({
        success: true,
        message: 'Message broadcasted to family successfully',
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to broadcast to family', { 
        error, 
        familyId: req.user?.familyId 
      });
      next(error);
    }
  };
}
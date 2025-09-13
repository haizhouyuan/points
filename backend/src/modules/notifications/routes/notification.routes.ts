import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { RateLimitMiddleware } from '@shared/middleware/rate-limit';
import { validateBody, validateQuery, validateParams } from '@shared/middleware/validation';
import { AuthMiddleware } from '@shared/middleware/auth';
import { NotificationType, NotificationPriority } from '../models/notification.model';
import Joi from 'joi';

const router = Router();
const notificationController = new NotificationController();

// SSE connection endpoint (special handling, no JSON response expected)
router.get(
  '/stream',
  RateLimitMiddleware.createUserRateLimit(5, 1), // 5 connections per minute max
  notificationController.establishSSEConnection
);

// Get user notifications
router.get(
  '/',
  RateLimitMiddleware.createUserRateLimit(60, 1), // 60 requests per minute
  validateQuery(Joi.object({
    read: Joi.boolean().optional(),
    type: Joi.string().valid(...Object.values(NotificationType)).optional(),
    priority: Joi.string().valid(...Object.values(NotificationPriority)).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    cursor: Joi.string().optional()
  })),
  notificationController.getUserNotifications
);

// Get unread count
router.get(
  '/unread-count',
  RateLimitMiddleware.createUserRateLimit(100, 1),
  notificationController.getUnreadCount
);

// Mark specific notification as read
router.patch(
  '/:notificationId/read',
  RateLimitMiddleware.createUserRateLimit(60, 1),
  validateParams(Joi.object({
    notificationId: Joi.string().required()
  })),
  notificationController.markAsRead
);

// Mark all notifications as read
router.patch(
  '/read-all',
  RateLimitMiddleware.createUserRateLimit(10, 1), // 10 requests per minute
  notificationController.markAllAsRead
);

// Get notification settings
router.get(
  '/settings',
  RateLimitMiddleware.createUserRateLimit(30, 1),
  notificationController.getNotificationSettings
);

// Update notification settings
router.put(
  '/settings',
  RateLimitMiddleware.createUserRateLimit(20, 1),
  validateBody(Joi.object({
    settings: Joi.object().pattern(
      Joi.string().valid(...Object.values(NotificationType)),
      Joi.object({
        enabled: Joi.boolean().required(),
        channels: Joi.array().items(Joi.string()).optional(),
        quietHours: Joi.object({
          start: Joi.string().pattern(/^([01]?\d|2[0-3]):[0-5]\d$/).optional(),
          end: Joi.string().pattern(/^([01]?\d|2[0-3]):[0-5]\d$/).optional()
        }).optional()
      })
    ).optional(),
    globalSettings: Joi.object({
      quietHours: Joi.object({
        enabled: Joi.boolean().required(),
        start: Joi.string().pattern(/^([01]?\d|2[0-3]):[0-5]\d$/).required(),
        end: Joi.string().pattern(/^([01]?\d|2[0-3]):[0-5]\d$/).required()
      }).optional(),
      enableEmailDigest: Joi.boolean().optional(),
      digestFrequency: Joi.string().valid('daily', 'weekly').optional()
    }).optional()
  })),
  notificationController.updateNotificationSettings
);

// Send notification to specific user (parent only)
router.post(
  '/send',
  RateLimitMiddleware.createUserRateLimit(10, 1), // 10 notifications per minute
  AuthMiddleware.requireParent(),
  validateBody(Joi.object({
    userId: Joi.string().required(),
    familyId: Joi.string().required(),
    type: Joi.string().valid(...Object.values(NotificationType)).required(),
    title: Joi.string().max(200).optional(),
    message: Joi.string().max(1000).optional(),
    priority: Joi.string().valid(...Object.values(NotificationPriority)).optional(),
    data: Joi.object({
      entityId: Joi.string().optional(),
      entityType: Joi.string().optional(),
      actionUrl: Joi.string().uri().optional(),
      imageUrl: Joi.string().uri().optional(),
      metadata: Joi.object().optional()
    }).optional(),
    templateVariables: Joi.object().optional(),
    expiresAt: Joi.date().greater('now').optional()
  })),
  notificationController.sendNotificationToUser
);

// Test notification (development only)
router.post(
  '/test',
  RateLimitMiddleware.createUserRateLimit(5, 1),
  notificationController.sendTestNotification
);

// Admin endpoints (parent only)
router.get(
  '/admin/connection-stats',
  AuthMiddleware.requireParent(),
  RateLimitMiddleware.createUserRateLimit(20, 1),
  notificationController.getConnectionStats
);

router.post(
  '/admin/broadcast',
  AuthMiddleware.requireParent(),
  RateLimitMiddleware.createUserRateLimit(5, 1),
  validateBody(Joi.object({
    event: Joi.string().required(),
    data: Joi.object().required()
  })),
  notificationController.broadcastToFamily
);

// Additional endpoints for notification management

// Delete old read notifications (cleanup)
router.delete(
  '/cleanup',
  RateLimitMiddleware.createUserRateLimit(5, 10), // 5 requests per 10 minutes
  async (req, res, next) => {
    try {
      // This would implement cleanup logic
      res.json({
        success: true,
        message: 'Cleanup feature coming soon',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get notification templates (admin only)
router.get(
  '/templates',
  AuthMiddleware.requireParent(),
  RateLimitMiddleware.createUserRateLimit(30, 1),
  async (req, res, next) => {
    try {
      // This would return available notification templates
      res.json({
        success: true,
        message: 'Template management feature coming soon',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  }
);

// Health check for notification service
router.get(
  '/health',
  RateLimitMiddleware.createUserRateLimit(60, 1),
  async (req, res, next) => {
    try {
      const stats = notificationController['sseService']?.getConnectionStats() || {};
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          sseConnections: stats.totalConnections || 0,
          timestamp: new Date().toISOString()
        },
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as notificationRoutes };
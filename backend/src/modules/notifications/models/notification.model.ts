import mongoose, { Document, Schema } from 'mongoose';

export enum NotificationType {
  TASK_COMPLETED = 'task_completed',
  TASK_REMINDER = 'task_reminder',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  LEVEL_UP = 'level_up',
  STREAK_MILESTONE = 'streak_milestone',
  CHALLENGE_CREATED = 'challenge_created',
  CHALLENGE_JOINED = 'challenge_joined',
  CHALLENGE_COMPLETED = 'challenge_completed',
  POST_LIKED = 'post_liked',
  POST_COMMENTED = 'post_commented',
  FAMILY_MILESTONE = 'family_milestone',
  REDEMPTION_APPROVED = 'redemption_approved',
  REDEMPTION_REJECTED = 'redemption_rejected',
  SYSTEM_ANNOUNCEMENT = 'system_announcement'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push'
}

export interface INotification extends Document {
  _id: string;
  familyId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  data: {
    entityId?: string;
    entityType?: string;
    actionUrl?: string;
    imageUrl?: string;
    metadata?: Record<string, any>;
  };
  read: boolean;
  readAt?: Date;
  delivered: boolean;
  deliveredAt?: Date;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationTemplate extends Document {
  _id: string;
  type: NotificationType;
  name: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  variables: string[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserNotificationSettings extends Document {
  _id: string;
  userId: string;
  familyId: string;
  settings: {
    [key in NotificationType]?: {
      enabled: boolean;
      channels: NotificationChannel[];
      quietHours?: {
        start: string; // HH:mm format
        end: string;
      };
    };
  };
  globalSettings: {
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
    enableEmailDigest: boolean;
    digestFrequency: 'daily' | 'weekly';
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  familyId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: Object.values(NotificationType), required: true },
  title: { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 1000 },
  priority: { type: String, enum: Object.values(NotificationPriority), default: NotificationPriority.NORMAL },
  channels: [{ type: String, enum: Object.values(NotificationChannel) }],
  data: {
    entityId: { type: String },
    entityType: { type: String },
    actionUrl: { type: String },
    imageUrl: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  read: { type: Boolean, default: false, index: true },
  readAt: { type: Date },
  delivered: { type: Boolean, default: false, index: true },
  deliveredAt: { type: Date },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  nextRetryAt: { type: Date },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

NotificationSchema.index({ familyId: 1, userId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, delivered: 1 });
NotificationSchema.index({ nextRetryAt: 1 }, { sparse: true });

const NotificationTemplateSchema = new Schema<INotificationTemplate>({
  type: { type: String, enum: Object.values(NotificationType), required: true, unique: true },
  name: { type: String, required: true },
  title: { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 1000 },
  priority: { type: String, enum: Object.values(NotificationPriority), default: NotificationPriority.NORMAL },
  channels: [{ type: String, enum: Object.values(NotificationChannel) }],
  variables: [{ type: String }],
  enabled: { type: Boolean, default: true }
}, {
  timestamps: true
});

const UserNotificationSettingsSchema = new Schema<IUserNotificationSettings>({
  userId: { type: String, required: true },
  familyId: { type: String, required: true },
  settings: {
    type: Schema.Types.Mixed,
    default: {}
  },
  globalSettings: {
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '22:00' },
      end: { type: String, default: '08:00' }
    },
    enableEmailDigest: { type: Boolean, default: true },
    digestFrequency: { type: String, enum: ['daily', 'weekly'], default: 'weekly' }
  }
}, {
  timestamps: true
});

UserNotificationSettingsSchema.index({ userId: 1, familyId: 1 }, { unique: true });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export const NotificationTemplate = mongoose.model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);
export const UserNotificationSettings = mongoose.model<IUserNotificationSettings>('UserNotificationSettings', UserNotificationSettingsSchema);
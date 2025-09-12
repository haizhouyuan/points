import mongoose, { Document, Schema } from 'mongoose';

export enum ActivityType {
  // User Management
  USER_REGISTERED = 'user_registered',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_PROFILE_UPDATED = 'user_profile_updated',
  
  // Task Activities
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',
  TASK_SCHEDULED = 'task_scheduled',
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_SKIPPED = 'task_skipped',
  TASK_EVIDENCE_UPLOADED = 'task_evidence_uploaded',
  
  // Points System
  POINTS_EARNED = 'points_earned',
  POINTS_DEDUCTED = 'points_deducted',
  POINTS_TRANSFERRED = 'points_transferred',
  POINTS_BONUS_AWARDED = 'points_bonus_awarded',
  
  // Gamification
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  LEVEL_UP = 'level_up',
  STREAK_STARTED = 'streak_started',
  STREAK_MILESTONE = 'streak_milestone',
  STREAK_BROKEN = 'streak_broken',
  SKILL_UPGRADED = 'skill_upgraded',
  
  // Social Interactions
  POST_CREATED = 'post_created',
  POST_LIKED = 'post_liked',
  POST_COMMENTED = 'post_commented',
  CHALLENGE_CREATED = 'challenge_created',
  CHALLENGE_JOINED = 'challenge_joined',
  CHALLENGE_COMPLETED = 'challenge_completed',
  
  // Redemptions
  REDEMPTION_REQUESTED = 'redemption_requested',
  REDEMPTION_APPROVED = 'redemption_approved',
  REDEMPTION_REJECTED = 'redemption_rejected',
  REDEMPTION_COMPLETED = 'redemption_completed',
  
  // File Management
  FILE_UPLOADED = 'file_uploaded',
  FILE_DELETED = 'file_deleted',
  
  // System Events
  SYSTEM_MAINTENANCE = 'system_maintenance',
  DATA_BACKUP = 'data_backup',
  SECURITY_EVENT = 'security_event',
  ERROR_OCCURRED = 'error_occurred'
}

export enum ActivityCategory {
  USER = 'user',
  TASK = 'task',
  POINTS = 'points',
  GAMIFICATION = 'gamification',
  SOCIAL = 'social',
  REDEMPTION = 'redemption',
  FILE = 'file',
  SYSTEM = 'system'
}

export enum ActivityImportance {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface IActivityLog extends Document {
  _id: string;
  familyId: string;
  userId?: string;
  type: ActivityType;
  category: ActivityCategory;
  importance: ActivityImportance;
  title: string;
  description: string;
  entityType?: string;
  entityId?: string;
  data: {
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
  timestamp: Date;
  createdAt: Date;
}

export interface IActivitySummary extends Document {
  familyId: string;
  userId?: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  summary: {
    totalActivities: number;
    categoryCounts: {
      [key in ActivityCategory]?: number;
    };
    importanceCounts: {
      [key in ActivityImportance]?: number;
    };
    topActivities: Array<{
      type: ActivityType;
      count: number;
      lastOccurred: Date;
    }>;
    uniqueEntities: {
      tasks: number;
      achievements: number;
      posts: number;
      redemptions: number;
    };
    timeDistribution: Array<{
      hour: number;
      count: number;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  familyId: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  type: { type: String, enum: Object.values(ActivityType), required: true, index: true },
  category: { type: String, enum: Object.values(ActivityCategory), required: true, index: true },
  importance: { type: String, enum: Object.values(ActivityImportance), default: ActivityImportance.NORMAL, index: true },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 1000 },
  entityType: { type: String, maxlength: 100 },
  entityId: { type: String, index: true },
  data: {
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
    context: {
      userAgent: { type: String },
      ipAddress: { type: String },
      sessionId: { type: String },
      requestId: { type: String }
    }
  },
  tags: [{ type: String, maxlength: 50 }],
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient querying
ActivityLogSchema.index({ familyId: 1, timestamp: -1 });
ActivityLogSchema.index({ familyId: 1, userId: 1, timestamp: -1 });
ActivityLogSchema.index({ familyId: 1, category: 1, timestamp: -1 });
ActivityLogSchema.index({ familyId: 1, type: 1, timestamp: -1 });
ActivityLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });

// TTL index to automatically delete old logs after 1 year
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const ActivitySummarySchema = new Schema<IActivitySummary>({
  familyId: { type: String, required: true },
  userId: { type: String },
  period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  date: { type: Date, required: true },
  summary: {
    totalActivities: { type: Number, default: 0 },
    categoryCounts: {
      type: Schema.Types.Mixed,
      default: {}
    },
    importanceCounts: {
      type: Schema.Types.Mixed,
      default: {}
    },
    topActivities: [{
      type: { type: String, enum: Object.values(ActivityType) },
      count: { type: Number, default: 0 },
      lastOccurred: { type: Date }
    }],
    uniqueEntities: {
      tasks: { type: Number, default: 0 },
      achievements: { type: Number, default: 0 },
      posts: { type: Number, default: 0 },
      redemptions: { type: Number, default: 0 }
    },
    timeDistribution: [{
      hour: { type: Number, min: 0, max: 23 },
      count: { type: Number, default: 0 }
    }]
  }
}, {
  timestamps: true
});

ActivitySummarySchema.index({ familyId: 1, period: 1, date: -1 });
ActivitySummarySchema.index({ familyId: 1, userId: 1, period: 1, date: -1 }, { unique: true, sparse: true });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export const ActivitySummary = mongoose.model<IActivitySummary>('ActivitySummary', ActivitySummarySchema);
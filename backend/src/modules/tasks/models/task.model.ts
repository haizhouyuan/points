import mongoose, { Schema, Document } from 'mongoose';
import { TaskCategory, TaskStatus, TaskDifficulty } from '@shared/types/common';

export interface ITaskTemplate extends Document {
  familyId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  pointsReward: number;
  xpReward: number;
  estimatedMinutes: number;
  requiresEvidence: boolean;
  evidenceTypes: string[];
  skillCategories: string[];
  tags: string[];
  recurrence?: {
    type: 'once' | 'daily' | 'weekly' | 'custom';
    daysOfWeek?: number[];
    endDate?: Date;
  };
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduledTask extends Document {
  templateId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  familyId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  estimatedDuration: number;
  status: TaskStatus;
  startedAt?: Date;
  completedAt?: Date;
  actualDuration?: number;
  evidence?: {
    type: string;
    fileIds: mongoose.Types.ObjectId[];
    notes: string;
    submittedAt: Date;
  };
  approval?: {
    required: boolean;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    reviewNotes?: string;
  };
  rewards?: {
    pointsEarned: number;
    xpEarned: number;
    bonusMultiplier: number;
    distributedAt: Date;
    ledgerEntryId: mongoose.Types.ObjectId;
  };
  notes?: string;
  collaboration?: {
    isCollaborative: boolean;
    teamId?: mongoose.Types.ObjectId;
    contributionPercentage: number;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

// 任务模板Schema
const TaskTemplateSchema = new Schema<ITaskTemplate>({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 500 },
  category: {
    type: String,
    enum: ['exercise', 'reading', 'chores', 'learning', 'creativity', 'other'],
    required: true,
    index: true
  },
  difficulty: { type: Number, min: 1, max: 5, required: true },
  pointsReward: { type: Number, required: true, min: 0 },
  xpReward: { type: Number, required: true, min: 0 },
  estimatedMinutes: { type: Number, required: true, min: 1 },
  requiresEvidence: { type: Boolean, default: false },
  evidenceTypes: [{ type: String, enum: ['photo', 'video', 'text', 'file'] }],
  skillCategories: [{ type: String }],
  tags: [{ type: String, maxlength: 20 }],
  recurrence: {
    type: { type: String, enum: ['once', 'daily', 'weekly', 'custom'], default: 'once' },
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],
    endDate: Date,
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// 排期任务Schema
const ScheduledTaskSchema = new Schema<IScheduledTask>({
  templateId: { type: Schema.Types.ObjectId, ref: 'TaskTemplate', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
  scheduledAt: { type: Date, required: true, index: true },
  estimatedDuration: { type: Number, required: true },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'skipped', 'expired'],
    default: 'planned',
    index: true
  },
  startedAt: Date,
  completedAt: Date,
  actualDuration: Number,
  evidence: {
    type: { type: String },
    fileIds: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    notes: { type: String, maxlength: 1000 },
    submittedAt: Date,
  },
  approval: {
    required: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    reviewNotes: { type: String, maxlength: 500 },
  },
  rewards: {
    pointsEarned: Number,
    xpEarned: Number,
    bonusMultiplier: { type: Number, default: 1.0 },
    distributedAt: Date,
    ledgerEntryId: { type: Schema.Types.ObjectId, ref: 'PointsLedger' },
  },
  notes: { type: String, maxlength: 500 },
  collaboration: {
    isCollaborative: { type: Boolean, default: false },
    teamId: { type: Schema.Types.ObjectId, ref: 'CollabTask' },
    contributionPercentage: { type: Number, default: 100, min: 0, max: 100 },
  },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
}, { timestamps: true });

// 复合索引
TaskTemplateSchema.index({ familyId: 1, category: 1, isActive: 1 });
ScheduledTaskSchema.index({ userId: 1, status: 1, scheduledAt: -1 });
ScheduledTaskSchema.index({ familyId: 1, status: 1, scheduledAt: -1 });

export const TaskTemplate = mongoose.model<ITaskTemplate>('TaskTemplate', TaskTemplateSchema);
export const ScheduledTask = mongoose.model<IScheduledTask>('ScheduledTask', ScheduledTaskSchema);
import { TaskCategory, TaskStatus, TaskDifficulty } from './common';

// 创建任务模板DTO
export interface CreateTaskTemplateDTO {
  name: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  pointsReward?: number;
  xpReward?: number;
  estimatedMinutes: number;
  requiresEvidence?: boolean;
  evidenceTypes?: string[];
  skillCategories?: string[];
  tags?: string[];
  recurrence?: {
    type: 'once' | 'daily' | 'weekly' | 'custom';
    daysOfWeek?: number[];
    endDate?: Date;
  };
}

// 快速创建并排期DTO
export interface QuickCreateAndScheduleDTO {
  name: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  estimatedMinutes: number;
  scheduledAt?: Date;
  requiresApproval?: boolean;
  requiresEvidence?: boolean;
  evidenceTypes?: string[];
  pointsReward?: number;
  xpReward?: number;
  skillCategories?: string[];
  tags?: string[];
}

// 排期任务DTO
export interface ScheduleTaskDTO {
  templateId: string;
  userId: string;
  scheduledAt: Date;
  requiresApproval?: boolean;
  notes?: string;
}

// 更新任务状态DTO
export interface UpdateTaskStatusDTO {
  status: TaskStatus;
  notes?: string;
  evidence?: {
    type: string;
    fileIds: string[];
    notes: string;
  };
}

// 任务查询过滤器
export interface TaskFilterQuery {
  status?: TaskStatus;
  category?: TaskCategory;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  isActive?: boolean;
}

// 任务完成证据
export interface TaskEvidence {
  type: 'photo' | 'video' | 'text' | 'file';
  fileIds: string[];
  notes: string;
  submittedAt: Date;
}

// 任务审批信息
export interface TaskApproval {
  required: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

// 任务奖励信息
export interface TaskRewards {
  pointsEarned: number;
  xpEarned: number;
  bonusMultiplier: number;
  distributedAt: Date;
  ledgerEntryId: string;
}

// 任务协作信息
export interface TaskCollaboration {
  isCollaborative: boolean;
  teamId?: string;
  contributionPercentage: number;
}

// 任务统计信息
export interface TaskStats {
  userId: string;
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  totalPoints: number;
  averageCompletionTime: number;
  streakCount: number;
  categoryBreakdown: {
    category: TaskCategory;
    count: number;
    completionRate: number;
  }[];
}

// 家庭任务排行榜
export interface FamilyTaskLeaderboard {
  userId: string;
  userName: string;
  completedTasks: number;
  totalPoints: number;
  rank: number;
  streak: number;
}

// 任务推荐
export interface TaskRecommendation {
  templateId: string;
  name: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  pointsReward: number;
  reason: string;
  confidence: number;
  suggestedTime?: Date;
}

// 任务提醒设置
export interface TaskReminderSettings {
  enabled: boolean;
  minutesBefore: number;
  notificationChannels: ('push' | 'email' | 'sms')[];
  customMessage?: string;
}

// 任务模板预设
export interface TaskTemplatePreset {
  id: string;
  name: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  estimatedMinutes: number;
  pointsReward: number;
  isSystem: boolean;
  tags: string[];
  skillCategories: string[];
}

// 任务批量操作
export interface BulkTaskOperation {
  taskIds: string[];
  operation: 'start' | 'complete' | 'skip' | 'reschedule';
  parameters?: {
    scheduledAt?: Date;
    reason?: string;
    evidence?: TaskEvidence;
  };
}

// 任务日程冲突检测
export interface ScheduleConflict {
  conflictingTaskId: string;
  conflictingTaskName: string;
  overlappingMinutes: number;
  suggestedAlternatives: Date[];
}

// 任务完成确认
export interface TaskCompletionConfirmation {
  taskId: string;
  completedAt: Date;
  evidence?: TaskEvidence;
  autoApproved: boolean;
  pointsEarned: number;
  xpEarned: number;
  achievements: string[]; // 解锁的成就ID
  levelUp?: {
    newLevel: number;
    bonusPoints: number;
  };
}
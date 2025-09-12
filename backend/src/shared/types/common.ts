// 通用类型定义

export interface PaginationQuery {
  cursor?: string;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    cursor?: string;
    limit: number;
    hasMore: boolean;
  };
}

export interface APIResponse<T = any> {
  data?: T;
  message?: string;
  code?: string;
  requestId?: string;
}

// 用户角色
export type UserRole = 'student' | 'parent';

// 任务相关类型
export type TaskCategory = 'exercise' | 'reading' | 'chores' | 'learning' | 'creativity' | 'other';
export type TaskStatus = 'planned' | 'in_progress' | 'completed' | 'skipped' | 'expired';
export type TaskDifficulty = 1 | 2 | 3 | 4 | 5;

// 积分交易类型
export type PointsTransactionType = 
  | 'task_completion' 
  | 'achievement_reward' 
  | 'daily_bonus' 
  | 'redemption' 
  | 'skill_unlock'
  | 'streak_bonus'
  | 'level_up_reward';

// 成就相关类型
export type AchievementCategory = 'milestone' | 'streak' | 'social' | 'skill' | 'special';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementStatus = 'locked' | 'unlocked' | 'claimed';

// 技能相关类型
export type SkillCategory = 'academic' | 'life_skills' | 'creativity' | 'social' | 'physical';

// 社交相关类型
export type SocialPostType = 'task_completion' | 'achievement' | 'general' | 'challenge_progress';

// 通知相关类型
export type NotificationType = 'achievement' | 'social' | 'task' | 'system' | 'reminder' | 'family';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// 兑换相关类型
export type RedemptionStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled';
export type RewardCategory = 'physical_item' | 'time_privilege' | 'activity_choice' | 'special_treat';

// 文件相关类型
export type FileRelatedTo = 'task' | 'avatar' | 'social' | 'achievement';

// 生命值包类型
export type LifePackageType = 'single' | 'bundle_3' | 'bundle_5' | 'bundle_10';

// 连击相关类型
export type StreakCategory = 'exercise' | 'reading' | 'chores' | 'learning' | 'creativity' | 'overall';

// 协作任务相关类型
export type CollabTaskStatus = 'open' | 'active' | 'completed' | 'cancelled';
export type CollabTaskRole = 'leader' | 'member';

// 家庭挑战相关类型
export type FamilyChallengeStatus = 'upcoming' | 'active' | 'completed' | 'expired';

// 分析相关类型
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'year';
export type AnalyticsGranularity = 'day' | 'week' | 'month';

// 推荐相关类型
export type RecommendationStatus = 'pending' | 'accepted' | 'rejected';

// 头像相关类型
export type AvatarItemCategory = 'body' | 'hair' | 'clothes' | 'accessories' | 'background' | 'special';
export type AvatarItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

// 游戏化配置
export interface GameConfig {
  xpPerLevelMultiplier: number;
  defaultDailyGoal: number;
  maxLives: number;
  lifeRestoreMinutes: number;
  streakRestoreCost: number;
  maxNotificationsPerUser: number;
}

// 错误代码
export const ErrorCodes = {
  // 通用错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  AUTHORIZATION_FAILED: 'AUTHORIZATION_FAILED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // 业务错误
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
  INSUFFICIENT_LIVES: 'INSUFFICIENT_LIVES',
  TASK_ALREADY_COMPLETED: 'TASK_ALREADY_COMPLETED',
  ACHIEVEMENT_ALREADY_CLAIMED: 'ACHIEVEMENT_ALREADY_CLAIMED',
  FAMILY_PERMISSION_REQUIRED: 'FAMILY_PERMISSION_REQUIRED',
  TIME_SLOT_CONFLICT: 'TIME_SLOT_CONFLICT',
  FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED',
  STREAK_ALREADY_RESTORED: 'STREAK_ALREADY_RESTORED',
  DAILY_REWARD_ALREADY_CLAIMED: 'DAILY_REWARD_ALREADY_CLAIMED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
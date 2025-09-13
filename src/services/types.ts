// =========================
// Common Types
// =========================
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// =========================
// Authentication Types
// =========================
export interface User extends BaseEntity {
  username: string;
  email: string;
  role: 'student' | 'parent';
  familyId: string;
  profile: {
    displayName: string;
    avatar?: string;
    dateOfBirth?: string;
    preferences?: {
      notifications: boolean;
      theme: 'light' | 'dark';
    };
  };
  points: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
  };
  level: {
    current: number;
    xp: number;
    nextLevelXp: number;
    title: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: 'student' | 'parent';
  familyId?: string;
  inviteCode?: string;
}

// =========================
// Task Types
// =========================
export type TaskCategory = 'exercise' | 'reading' | 'chores' | 'learning' | 'creativity' | 'other';
export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface TaskTemplate extends BaseEntity {
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  estimatedMinutes: number;
  basePoints: number;
  skillCategories: string[];
  requiresEvidence: boolean;
  evidenceInstructions?: string;
  isActive: boolean;
  tags: string[];
}

export interface ScheduledTask extends BaseEntity {
  templateId: string;
  familyId: string;
  assignedTo: string;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  status: TaskStatus;
  completedAt?: string;
  evidence?: {
    type: 'text' | 'image' | 'file';
    content: string;
    files?: string[];
  };
  pointsAwarded: number;
  notes?: string;
}

export interface QuickCreateTaskRequest {
  title: string;
  description?: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  estimatedMinutes: number;
  scheduledDate: string;
  startTime?: string;
}

// =========================
// Points Types
// =========================
export interface PointsBalance {
  current: number;
  totalEarned: number;
  totalSpent: number;
  pending: number;
}

export interface PointsTransaction extends BaseEntity {
  familyId: string;
  userId: string;
  type: 'earned' | 'spent' | 'adjusted';
  amount: number;
  balance: number;
  source: {
    type: 'task_completion' | 'achievement' | 'streak_bonus' | 'manual' | 'redemption';
    sourceId?: string;
    description: string;
  };
  status: 'pending' | 'completed' | 'cancelled';
}

export interface FamilyLeaderboard {
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  rankings: {
    userId: string;
    username: string;
    displayName: string;
    avatar?: string;
    points: number;
    change: number; // change from previous period
    rank: number;
  }[];
  generatedAt: string;
}

// =========================
// Gamification Types
// =========================
export interface Achievement extends BaseEntity {
  code: string;
  name: string;
  description: string;
  category: 'milestone' | 'streak' | 'social' | 'skill' | 'special';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirements: {
    type: 'task_count' | 'points_earned' | 'streak_days' | 'skill_level' | 'custom';
    target: number;
    category?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  };
  rewards: {
    points: number;
    xp: number;
    title?: string;
    badge?: string;
  };
  isActive: boolean;
  isHidden: boolean;
}

export interface UserAchievement extends BaseEntity {
  userId: string;
  achievementId: string;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  isClaimed: boolean;
  claimedAt?: string;
}

export interface StreakRecord extends BaseEntity {
  userId: string;
  category: TaskCategory;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  milestones: {
    days: number;
    reachedAt: string;
    pointsAwarded: number;
  }[];
}

export interface UserLevel extends BaseEntity {
  userId: string;
  overallLevel: number;
  overallXp: number;
  skillLevels: {
    [key: string]: {
      level: number;
      xp: number;
      nextLevelXp: number;
    };
  };
  prestigeLevel: number;
  currentTitle: string;
  availableTitles: string[];
}

// =========================
// Redemption Types
// =========================
export interface RewardItem extends BaseEntity {
  name: string;
  description: string;
  category: string;
  pointsCost: number;
  isAvailable: boolean;
  maxRedemptionsPerWeek?: number;
  requiresParentApproval: boolean;
  imageUrl?: string;
  tags: string[];
}

export interface RedemptionRequest extends BaseEntity {
  familyId: string;
  studentId: string;
  rewardId: string;
  pointsCost: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  requestNotes?: string;
  parentResponse?: {
    respondedAt: string;
    respondedBy: string;
    notes?: string;
  };
  fulfilledAt?: string;
}

// =========================
// Social Types
// =========================
export interface SocialPost extends BaseEntity {
  familyId: string;
  authorId: string;
  type: 'task_completion' | 'achievement' | 'level_up' | 'general';
  content: {
    text?: string;
    images?: string[];
    relatedTaskId?: string;
    relatedAchievementId?: string;
  };
  likes: {
    userId: string;
    likedAt: string;
  }[];
  comments: {
    id: string;
    userId: string;
    text: string;
    createdAt: string;
  }[];
  isVisible: boolean;
}

export interface Encouragement extends BaseEntity {
  familyId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  type: 'general' | 'task_completion' | 'streak' | 'achievement';
  relatedId?: string;
  isRead: boolean;
}

// =========================
// Analytics Types
// =========================
export interface UserStats {
  userId: string;
  timeframe: 'daily' | 'weekly' | 'monthly';
  metrics: {
    tasksCompleted: number;
    pointsEarned: number;
    streakDays: number;
    achievementsUnlocked: number;
    levelProgress: number;
    categoryBreakdown: {
      [category: string]: {
        tasks: number;
        points: number;
      };
    };
  };
  trends: {
    [metric: string]: {
      current: number;
      previous: number;
      change: number;
    };
  };
}

// =========================
// Notification Types
// =========================
export interface Notification extends BaseEntity {
  userId: string;
  type: 'achievement_unlocked' | 'level_up' | 'redemption_approved' | 'encouragement' | 'reminder';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
}

// =========================
// Request/Response Helpers
// =========================
export interface ListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, any>;
}
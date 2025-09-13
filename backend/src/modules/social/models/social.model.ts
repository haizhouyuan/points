import mongoose, { Document, Schema } from 'mongoose';

export enum PostType {
  TEXT = 'text',
  TASK_COMPLETION = 'task_completion',
  ACHIEVEMENT = 'achievement',
  MILESTONE = 'milestone',
  PHOTO = 'photo'
}

export enum PostVisibility {
  FAMILY = 'family',
  PRIVATE = 'private'
}

export interface ISocialPost extends Document {
  _id: string;
  familyId: string;
  userId: string;
  type: PostType;
  content: {
    text?: string;
    imageUrls?: string[];
    taskId?: string;
    achievementId?: string;
    metadata?: Record<string, any>;
  };
  visibility: PostVisibility;
  reactions: {
    likes: string[];
    celebrates: string[];
    hearts: string[];
  };
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISocialComment extends Document {
  _id: string;
  postId: string;
  familyId: string;
  userId: string;
  content: {
    text: string;
    mentions?: string[];
  };
  reactions: {
    likes: string[];
    hearts: string[];
  };
  parentCommentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFamilyChallenge extends Document {
  _id: string;
  familyId: string;
  createdBy: string;
  title: string;
  description: string;
  type: 'individual' | 'team' | 'family';
  requirements: {
    taskCategories: string[];
    minTasks?: number;
    minPoints?: number;
    targetDays?: number;
  };
  rewards: {
    pointsPerMember: number;
    badgeCode?: string;
    specialReward?: string;
  };
  participants: Array<{
    userId: string;
    joinedAt: Date;
    progress: {
      tasksCompleted: number;
      pointsEarned: number;
      daysActive: number;
    };
    completed: boolean;
    completedAt?: Date;
  }>;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFamilyStats extends Document {
  familyId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  stats: {
    totalPosts: number;
    totalComments: number;
    totalReactions: number;
    activeChallenges: number;
    completedTasks: number;
    familyPoints: number;
    topContributor: {
      userId: string;
      points: number;
    };
    mostActive: {
      userId: string;
      interactions: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const SocialPostSchema = new Schema<ISocialPost>({
  familyId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: Object.values(PostType), required: true },
  content: {
    text: { type: String, maxlength: 2000 },
    imageUrls: [{ type: String }],
    taskId: { type: String },
    achievementId: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  visibility: { type: String, enum: Object.values(PostVisibility), default: PostVisibility.FAMILY },
  reactions: {
    likes: [{ type: String }],
    celebrates: [{ type: String }],
    hearts: [{ type: String }]
  },
  commentsCount: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

SocialPostSchema.index({ familyId: 1, createdAt: -1 });
SocialPostSchema.index({ userId: 1, type: 1 });

const SocialCommentSchema = new Schema<ISocialComment>({
  postId: { type: String, required: true, index: true },
  familyId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  content: {
    text: { type: String, required: true, maxlength: 1000 },
    mentions: [{ type: String }]
  },
  reactions: {
    likes: [{ type: String }],
    hearts: [{ type: String }]
  },
  parentCommentId: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

SocialCommentSchema.index({ postId: 1, createdAt: 1 });
SocialCommentSchema.index({ familyId: 1, userId: 1 });

const FamilyChallengeSchema = new Schema<IFamilyChallenge>({
  familyId: { type: String, required: true, index: true },
  createdBy: { type: String, required: true },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 1000 },
  type: { type: String, enum: ['individual', 'team', 'family'], required: true },
  requirements: {
    taskCategories: [{ type: String }],
    minTasks: { type: Number },
    minPoints: { type: Number },
    targetDays: { type: Number }
  },
  rewards: {
    pointsPerMember: { type: Number, required: true },
    badgeCode: { type: String },
    specialReward: { type: String }
  },
  participants: [{
    userId: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    progress: {
      tasksCompleted: { type: Number, default: 0 },
      pointsEarned: { type: Number, default: 0 },
      daysActive: { type: Number, default: 0 }
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  }],
  status: { type: String, enum: ['draft', 'active', 'completed', 'cancelled'], default: 'draft' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

FamilyChallengeSchema.index({ familyId: 1, status: 1 });
FamilyChallengeSchema.index({ startDate: 1, endDate: 1 });

const FamilyStatsSchema = new Schema<IFamilyStats>({
  familyId: { type: String, required: true },
  period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  date: { type: Date, required: true },
  stats: {
    totalPosts: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalReactions: { type: Number, default: 0 },
    activeChallenges: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    familyPoints: { type: Number, default: 0 },
    topContributor: {
      userId: { type: String },
      points: { type: Number }
    },
    mostActive: {
      userId: { type: String },
      interactions: { type: Number }
    }
  }
}, {
  timestamps: true
});

FamilyStatsSchema.index({ familyId: 1, period: 1, date: -1 }, { unique: true });

export const SocialPost = mongoose.model<ISocialPost>('SocialPost', SocialPostSchema);
export const SocialComment = mongoose.model<ISocialComment>('SocialComment', SocialCommentSchema);
export const FamilyChallenge = mongoose.model<IFamilyChallenge>('FamilyChallenge', FamilyChallengeSchema);
export const FamilyStats = mongoose.model<IFamilyStats>('FamilyStats', FamilyStatsSchema);
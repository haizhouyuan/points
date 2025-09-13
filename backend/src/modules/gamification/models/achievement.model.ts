import mongoose, { Schema, Document } from 'mongoose';
import { AchievementCategory, AchievementRarity, AchievementStatus } from '@shared/types/common';

export interface IAchievement extends Document {
  code: string; // 唯一标识符
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  pointsReward: number;
  xpReward: number;
  requirements: {
    type: 'task_count' | 'points_earned' | 'streak_days' | 'category_mastery' | 'custom';
    target: number;
    conditions?: Record<string, any>;
  };
  unlockedBy: mongoose.Types.ObjectId[]; // 前置成就
  isSecret: boolean;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: mongoose.Types.ObjectId;
  status: AchievementStatus;
  progress: number; // 0-100
  unlockedAt?: Date;
  claimedAt?: Date;
  pointsRewarded?: number;
  xpRewarded?: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// 成就定义Schema
const AchievementSchema = new Schema<IAchievement>({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true, maxlength: 50 },
  description: { type: String, required: true, maxlength: 200 },
  category: {
    type: String,
    enum: ['milestone', 'streak', 'social', 'skill', 'special'],
    required: true,
    index: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true,
    default: 'common'
  },
  icon: { type: String, required: true },
  pointsReward: { type: Number, required: true, min: 0 },
  xpReward: { type: Number, required: true, min: 0 },
  requirements: {
    type: {
      type: String,
      enum: ['task_count', 'points_earned', 'streak_days', 'category_mastery', 'custom'],
      required: true
    },
    target: { type: Number, required: true, min: 1 },
    conditions: { type: Schema.Types.Mixed, default: {} }
  },
  unlockedBy: [{ type: Schema.Types.ObjectId, ref: 'Achievement' }],
  isSecret: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  validFrom: { type: Date, default: null },
  validTo: { type: Date, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

// 用户成就进度Schema
const UserAchievementSchema = new Schema<IUserAchievement>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  achievementId: { type: Schema.Types.ObjectId, ref: 'Achievement', required: true },
  status: {
    type: String,
    enum: ['locked', 'unlocked', 'claimed'],
    default: 'locked',
    index: true
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  unlockedAt: { type: Date, default: null },
  claimedAt: { type: Date, default: null },
  pointsRewarded: { type: Number, default: 0 },
  xpRewarded: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

// 复合索引
AchievementSchema.index({ category: 1, rarity: 1, isActive: 1 });
UserAchievementSchema.index({ userId: 1, status: 1 });
UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

// 静态方法
AchievementSchema.statics.findActiveAchievements = function(category?: AchievementCategory) {
  const query: any = { isActive: true };
  if (category) query.category = category;
  
  return this.find(query).sort({ rarity: -1, pointsReward: -1 });
};

UserAchievementSchema.statics.getUserAchievements = function(userId: string, status?: AchievementStatus) {
  const query: any = { userId: new mongoose.Types.ObjectId(userId) };
  if (status) query.status = status;
  
  return this.find(query).populate('achievementId').sort({ updatedAt: -1 });
};

UserAchievementSchema.statics.getUserAchievementSummary = function(userId: string) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalPoints: { $sum: '$pointsRewarded' },
        totalXP: { $sum: '$xpRewarded' }
      }
    }
  ]);
};

// 实例方法
AchievementSchema.methods.checkRequirements = function(userStats: Record<string, any>): boolean {
  const req = this.requirements;
  
  switch (req.type) {
    case 'task_count':
      return userStats.completedTasks >= req.target;
    case 'points_earned':
      return userStats.totalPoints >= req.target;
    case 'streak_days':
      return userStats.maxStreak >= req.target;
    case 'category_mastery':
      const categoryStats = userStats.categoryBreakdown?.[req.conditions?.category];
      return categoryStats?.count >= req.target;
    default:
      return false;
  }
};

UserAchievementSchema.methods.unlock = async function() {
  if (this.status === 'locked') {
    this.status = 'unlocked';
    this.progress = 100;
    this.unlockedAt = new Date();
    await this.save();
    
    return true;
  }
  return false;
};

UserAchievementSchema.methods.claim = async function() {
  if (this.status === 'unlocked') {
    const achievement = await mongoose.model('Achievement').findById(this.achievementId);
    
    this.status = 'claimed';
    this.claimedAt = new Date();
    this.pointsRewarded = achievement.pointsReward;
    this.xpRewarded = achievement.xpReward;
    await this.save();
    
    return {
      points: achievement.pointsReward,
      xp: achievement.xpReward
    };
  }
  return null;
};

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema);
export const UserAchievement = mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);
import mongoose, { Schema, Document } from 'mongoose';
import { StreakCategory } from '@shared/types/common';

export interface IUserStreak extends Document {
  userId: mongoose.Types.ObjectId;
  category: StreakCategory;
  currentStreak: number;
  maxStreak: number;
  lastActivityDate: Date;
  streakStartDate: Date;
  canRestore: boolean;
  restoreCount: number;
  restoreExpiresAt?: Date;
  bonusMultiplier: number;
  metadata: {
    milestones: { days: number; reachedAt: Date; rewarded: boolean }[];
    breakDates: Date[];
    restoreHistory: { date: Date; cost: number; reason: string }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserStreakSchema = new Schema<IUserStreak>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: {
    type: String,
    enum: ['exercise', 'reading', 'chores', 'learning', 'creativity', 'overall'],
    required: true
  },
  currentStreak: { type: Number, default: 0, min: 0 },
  maxStreak: { type: Number, default: 0, min: 0 },
  lastActivityDate: { type: Date, default: null },
  streakStartDate: { type: Date, default: null },
  canRestore: { type: Boolean, default: true },
  restoreCount: { type: Number, default: 0, min: 0 },
  restoreExpiresAt: { type: Date, default: null },
  bonusMultiplier: { type: Number, default: 1.0, min: 1.0, max: 3.0 },
  metadata: {
    milestones: [{
      days: { type: Number, required: true },
      reachedAt: { type: Date, required: true },
      rewarded: { type: Boolean, default: false }
    }],
    breakDates: [{ type: Date }],
    restoreHistory: [{
      date: { type: Date, required: true },
      cost: { type: Number, required: true },
      reason: { type: String, required: true }
    }]
  }
}, { timestamps: true });

// 复合索引
UserStreakSchema.index({ userId: 1, category: 1 }, { unique: true });
UserStreakSchema.index({ category: 1, currentStreak: -1 });

// 静态方法
UserStreakSchema.statics.getUserStreaks = function(userId: string) {
  return this.find({ userId: new mongoose.Types.ObjectId(userId) });
};

UserStreakSchema.statics.getTopStreaks = function(category?: StreakCategory, limit = 10) {
  const query: any = { currentStreak: { $gt: 0 } };
  if (category) query.category = category;
  
  return this.find(query)
    .populate('userId', 'name avatar')
    .sort({ currentStreak: -1, updatedAt: -1 })
    .limit(limit);
};

UserStreakSchema.statics.calculateOverallStreak = async function(userId: string) {
  const streaks = await this.find({ 
    userId: new mongoose.Types.ObjectId(userId),
    category: { $ne: 'overall' }
  });
  
  if (streaks.length === 0) return 0;
  
  // 计算所有类别的平均连击
  const totalStreak = streaks.reduce((sum, streak) => sum + streak.currentStreak, 0);
  return Math.floor(totalStreak / streaks.length);
};

// 实例方法
UserStreakSchema.methods.increment = async function(): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = this.lastActivityDate ? new Date(this.lastActivityDate) : null;
  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
  }
  
  // 检查是否已经在今天增加过连击
  if (lastActivity && lastActivity.getTime() === today.getTime()) {
    return false; // 今天已经增加过了
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // 检查连击是否中断
  if (!lastActivity || lastActivity.getTime() < yesterday.getTime()) {
    // 连击中断，重新开始
    this.currentStreak = 1;
    this.streakStartDate = today;
    if (lastActivity && lastActivity.getTime() < yesterday.getTime()) {
      this.metadata.breakDates.push(yesterday);
    }
  } else {
    // 连续的连击
    this.currentStreak += 1;
  }
  
  this.lastActivityDate = today;
  
  // 更新最大连击记录
  if (this.currentStreak > this.maxStreak) {
    this.maxStreak = this.currentStreak;
  }
  
  // 检查里程碑
  this.checkMilestones();
  
  // 更新奖励倍数
  this.updateBonusMultiplier();
  
  await this.save();
  return true;
};

UserStreakSchema.methods.canRestoreStreak = function(): boolean {
  if (!this.canRestore) return false;
  if (this.restoreExpiresAt && new Date() > this.restoreExpiresAt) return false;
  
  const today = new Date();
  const lastActivity = this.lastActivityDate ? new Date(this.lastActivityDate) : null;
  
  if (!lastActivity) return false;
  
  // 只能在连击中断后24小时内恢复
  const timeDiff = today.getTime() - lastActivity.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return hoursDiff <= 24 && this.currentStreak === 0;
};

UserStreakSchema.methods.restoreStreak = async function(cost: number): Promise<boolean> {
  if (!this.canRestoreStreak()) return false;
  
  // 恢复到中断前的连击
  const lastBreak = this.metadata.breakDates[this.metadata.breakDates.length - 1];
  if (lastBreak) {
    this.currentStreak = this.maxStreak; // 简化：恢复到最大连击
    this.metadata.breakDates.pop(); // 移除最后一次中断记录
  }
  
  this.restoreCount += 1;
  this.metadata.restoreHistory.push({
    date: new Date(),
    cost,
    reason: 'User restore'
  });
  
  // 设置恢复冷却时间
  const nextRestore = new Date();
  nextRestore.setDate(nextRestore.getDate() + 7); // 7天冷却
  this.restoreExpiresAt = nextRestore;
  
  // 3次恢复后不能再恢复
  if (this.restoreCount >= 3) {
    this.canRestore = false;
  }
  
  await this.save();
  return true;
};

UserStreakSchema.methods.checkMilestones = function(): number[] {
  const milestones = [7, 14, 30, 50, 100, 200, 365]; // 里程碑天数
  const newMilestones: number[] = [];
  
  for (const milestone of milestones) {
    if (this.currentStreak >= milestone) {
      const existing = this.metadata.milestones.find(m => m.days === milestone);
      if (!existing) {
        this.metadata.milestones.push({
          days: milestone,
          reachedAt: new Date(),
          rewarded: false
        });
        newMilestones.push(milestone);
      }
    }
  }
  
  return newMilestones;
};

UserStreakSchema.methods.updateBonusMultiplier = function(): void {
  // 连击奖励倍数计算
  if (this.currentStreak >= 100) {
    this.bonusMultiplier = 3.0;
  } else if (this.currentStreak >= 50) {
    this.bonusMultiplier = 2.5;
  } else if (this.currentStreak >= 30) {
    this.bonusMultiplier = 2.0;
  } else if (this.currentStreak >= 14) {
    this.bonusMultiplier = 1.5;
  } else if (this.currentStreak >= 7) {
    this.bonusMultiplier = 1.2;
  } else {
    this.bonusMultiplier = 1.0;
  }
};

UserStreakSchema.methods.getRewardableMillstones = function() {
  return this.metadata.milestones.filter(m => !m.rewarded);
};

UserStreakSchema.methods.rewardMilestone = async function(milestoneDay: number): Promise<boolean> {
  const milestone = this.metadata.milestones.find(m => m.days === milestoneDay && !m.rewarded);
  if (milestone) {
    milestone.rewarded = true;
    await this.save();
    return true;
  }
  return false;
};

export const UserStreak = mongoose.model<IUserStreak>('UserStreak', UserStreakSchema);
import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@shared/types/common';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  role: UserRole;
  familyId: mongoose.Types.ObjectId;
  
  // 游戏化档案
  gameProfile: {
    level: number;
    xp: number;
    nextLevelXP: number;
    totalPoints: number;
    dailyGoal: number;
    dailyXP: number;
    lastDailyReset: Date;
    
    // 生命值系统
    lives: {
      current: number;
      max: number;
      lastUsed?: Date;
      restoreTime?: Date;
    };
    
    // 连击记录
    streaks: Map<string, {
      count: number;
      lastUpdate: Date;
      bestStreak: number;
      restoredToday: boolean;
    }>;
  };
  
  // 通知设置
  notificationSettings: {
    push: boolean;
    email: boolean;
    sound: boolean;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
    types: {
      achievement: boolean;
      social: boolean;
      task: boolean;
      system: boolean;
      reminder: boolean;
      family: boolean;
    };
  };
  
  // 个性化头像配置
  avatarConfig: {
    body: string;
    hair: string;
    clothes: string;
    accessories: string[];
    background: string;
    unlocked: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

const StreakSchema = new Schema({
  count: { type: Number, default: 0 },
  lastUpdate: { type: Date, default: Date.now },
  bestStreak: { type: Number, default: 0 },
  restoredToday: { type: Boolean, default: false },
});

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  
  passwordHash: {
    type: String,
    required: true,
  },
  
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  
  avatar: {
    type: String,
    default: null,
  },
  
  role: {
    type: String,
    enum: ['student', 'parent'],
    required: true,
  },
  
  familyId: {
    type: Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
    index: true,
  },
  
  gameProfile: {
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    nextLevelXP: { type: Number, default: 100 },
    totalPoints: { type: Number, default: 0 },
    dailyGoal: { type: Number, default: 100 },
    dailyXP: { type: Number, default: 0 },
    lastDailyReset: { type: Date, default: Date.now },
    
    lives: {
      current: { type: Number, default: 5 },
      max: { type: Number, default: 5 },
      lastUsed: { type: Date, default: null },
      restoreTime: { type: Date, default: null },
    },
    
    streaks: {
      type: Map,
      of: StreakSchema,
      default: () => new Map([
        ['exercise', { count: 0, lastUpdate: new Date(), bestStreak: 0, restoredToday: false }],
        ['reading', { count: 0, lastUpdate: new Date(), bestStreak: 0, restoredToday: false }],
        ['chores', { count: 0, lastUpdate: new Date(), bestStreak: 0, restoredToday: false }],
        ['learning', { count: 0, lastUpdate: new Date(), bestStreak: 0, restoredToday: false }],
        ['creativity', { count: 0, lastUpdate: new Date(), bestStreak: 0, restoredToday: false }],
      ]),
    },
  },
  
  notificationSettings: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sound: { type: Boolean, default: true },
    quietHours: {
      enabled: { type: Boolean, default: true },
      start: { type: String, default: '22:00' },
      end: { type: String, default: '08:00' },
    },
    types: {
      achievement: { type: Boolean, default: true },
      social: { type: Boolean, default: true },
      task: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
      reminder: { type: Boolean, default: true },
      family: { type: Boolean, default: true },
    },
  },
  
  avatarConfig: {
    body: { type: String, default: 'default' },
    hair: { type: String, default: 'short_black' },
    clothes: { type: String, default: 'casual' },
    accessories: [{ type: String }],
    background: { type: String, default: 'home' },
    unlocked: [{ type: String }],
  },
  
  lastLogin: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.passwordHash;
      return ret;
    },
  },
});

// 复合索引
UserSchema.index({ familyId: 1, role: 1 });
UserSchema.index({ email: 1 }, { unique: true });

// 静态方法扩展接口
interface UserModel extends mongoose.Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findFamilyMembers(familyId: string): Promise<IUser[]>;
}

// 静态方法
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findFamilyMembers = function(familyId: string) {
  return this.find({ familyId }).select('-passwordHash');
};

// 实例方法
UserSchema.methods.calculateNextLevelXP = function() {
  return this.gameProfile.level * this.gameProfile.level * 100;
};

UserSchema.methods.checkLevelUp = function() {
  const nextLevelXP = this.calculateNextLevelXP();
  return this.gameProfile.xp >= nextLevelXP;
};

UserSchema.methods.addXP = function(xp: number) {
  this.gameProfile.xp += xp;
  this.gameProfile.dailyXP += xp;
  
  // 检查升级
  while (this.checkLevelUp()) {
    const nextLevelXP = this.calculateNextLevelXP();
    this.gameProfile.xp -= nextLevelXP;
    this.gameProfile.level += 1;
    this.gameProfile.nextLevelXP = this.calculateNextLevelXP();
  }
  
  return this.gameProfile.level;
};

UserSchema.methods.resetDailyXP = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (this.gameProfile.lastDailyReset < today) {
    this.gameProfile.dailyXP = 0;
    this.gameProfile.lastDailyReset = today;
    
    // 重置连击的每日状态
    for (const [category, streak] of this.gameProfile.streaks) {
      streak.restoredToday = false;
    }
  }
};

UserSchema.methods.updateStreak = function(category: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const streak = this.gameProfile.streaks.get(category);
  if (!streak) return 0;
  
  const lastUpdate = new Date(streak.lastUpdate);
  lastUpdate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    // 今天已经更新过，不重复计算
    return streak.count;
  } else if (daysDiff === 1) {
    // 连续，增加连击
    streak.count += 1;
    streak.bestStreak = Math.max(streak.bestStreak, streak.count);
  } else {
    // 中断，重置连击
    streak.count = 1;
  }
  
  streak.lastUpdate = today;
  this.gameProfile.streaks.set(category, streak);
  
  return streak.count;
};

UserSchema.methods.canRestoreLife = function(): boolean {
  const now = new Date();
  const lives = this.gameProfile.lives;
  
  // 生命值已满
  if (lives.current >= lives.max) return false;
  
  // 检查自然恢复时间
  if (lives.restoreTime && now >= lives.restoreTime) {
    return true;
  }
  
  return false;
};

UserSchema.methods.restoreLife = function(): boolean {
  if (!this.canRestoreLife()) return false;
  
  const lives = this.gameProfile.lives;
  const restoreMinutes = parseInt(process.env.LIFE_RESTORE_MINUTES || '30');
  
  lives.current = Math.min(lives.current + 1, lives.max);
  
  if (lives.current < lives.max) {
    lives.restoreTime = new Date(Date.now() + restoreMinutes * 60 * 1000);
  } else {
    lives.restoreTime = null;
  }
  
  return true;
};

export const User = mongoose.model<IUser, UserModel>('User', UserSchema);
import mongoose, { Schema, Document } from 'mongoose';
import { SkillCategory } from '@shared/types/common';

export interface IUserLevel extends Document {
  userId: mongoose.Types.ObjectId;
  overallLevel: number;
  overallXP: number;
  skillLevels: {
    category: SkillCategory;
    level: number;
    currentXP: number;
    totalXP: number;
    unlockedAt: Date;
  }[];
  levelHistory: {
    level: number;
    category?: SkillCategory;
    reachedAt: Date;
    xpAtLevel: number;
    bonusReward?: {
      points: number;
      items: string[];
    };
  }[];
  totalXPEarned: number;
  nextLevelXP: number;
  prestige: {
    level: number;
    totalRebirths: number;
    lastRebirthAt?: Date;
    bonusMultiplier: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserLevelSchema = new Schema<IUserLevel>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  overallLevel: { type: Number, default: 1, min: 1 },
  overallXP: { type: Number, default: 0, min: 0 },
  skillLevels: [{
    category: {
      type: String,
      enum: ['academic', 'life_skills', 'creativity', 'social', 'physical'],
      required: true
    },
    level: { type: Number, default: 1, min: 1 },
    currentXP: { type: Number, default: 0, min: 0 },
    totalXP: { type: Number, default: 0, min: 0 },
    unlockedAt: { type: Date, default: Date.now }
  }],
  levelHistory: [{
    level: { type: Number, required: true },
    category: {
      type: String,
      enum: ['academic', 'life_skills', 'creativity', 'social', 'physical']
    },
    reachedAt: { type: Date, default: Date.now },
    xpAtLevel: { type: Number, required: true },
    bonusReward: {
      points: { type: Number, default: 0 },
      items: [{ type: String }]
    }
  }],
  totalXPEarned: { type: Number, default: 0, min: 0 },
  nextLevelXP: { type: Number, default: 100 },
  prestige: {
    level: { type: Number, default: 0, min: 0 },
    totalRebirths: { type: Number, default: 0, min: 0 },
    lastRebirthAt: { type: Date },
    bonusMultiplier: { type: Number, default: 1.0, min: 1.0 }
  }
}, { timestamps: true });

// 索引
UserLevelSchema.index({ overallLevel: -1, overallXP: -1 });
UserLevelSchema.index({ 'skillLevels.category': 1, 'skillLevels.level': -1 });

// 静态方法
UserLevelSchema.statics.getLeaderboard = function(category?: SkillCategory, limit = 10) {
  if (category) {
    return this.aggregate([
      { $unwind: '$skillLevels' },
      { $match: { 'skillLevels.category': category } },
      { $sort: { 'skillLevels.level': -1, 'skillLevels.totalXP': -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: 1,
          userName: '$user.name',
          userAvatar: '$user.avatar',
          level: '$skillLevels.level',
          totalXP: '$skillLevels.totalXP',
          category: '$skillLevels.category'
        }
      }
    ]);
  } else {
    return this.find({})
      .populate('userId', 'name avatar')
      .sort({ overallLevel: -1, overallXP: -1 })
      .limit(limit)
      .select('userId overallLevel overallXP prestige');
  }
};

UserLevelSchema.statics.calculateLevelFromXP = function(xp: number): number {
  // 等级计算公式：level = floor(sqrt(xp/50)) + 1
  return Math.floor(Math.sqrt(xp / 50)) + 1;
};

UserLevelSchema.statics.calculateXPForLevel = function(level: number): number {
  // 升到指定等级需要的总XP
  return Math.pow(level - 1, 2) * 50;
};

// 实例方法
UserLevelSchema.methods.addXP = async function(xp: number, category?: SkillCategory): Promise<{
  levelUp: boolean;
  newLevel?: number;
  skillLevelUp?: { category: SkillCategory; newLevel: number };
  rewards?: { points: number; items: string[] };
}> {
  const oldOverallLevel = this.overallLevel;
  let result = { levelUp: false };

  // 更新总XP
  this.overallXP += xp;
  this.totalXPEarned += xp;

  // 计算新的整体等级
  const newOverallLevel = this.constructor.calculateLevelFromXP(this.overallXP);
  
  if (newOverallLevel > oldOverallLevel) {
    this.overallLevel = newOverallLevel;
    this.nextLevelXP = this.constructor.calculateXPForLevel(newOverallLevel + 1);
    
    // 记录升级历史
    this.levelHistory.push({
      level: newOverallLevel,
      reachedAt: new Date(),
      xpAtLevel: this.overallXP,
      bonusReward: this.calculateLevelReward(newOverallLevel)
    });

    result.levelUp = true;
    result.newLevel = newOverallLevel;
    result.rewards = this.calculateLevelReward(newOverallLevel);
  }

  // 技能分类XP
  if (category) {
    const skillLevel = this.skillLevels.find(s => s.category === category);
    
    if (skillLevel) {
      const oldSkillLevel = skillLevel.level;
      skillLevel.currentXP += xp;
      skillLevel.totalXP += xp;
      
      const newSkillLevel = this.constructor.calculateLevelFromXP(skillLevel.totalXP);
      
      if (newSkillLevel > oldSkillLevel) {
        skillLevel.level = newSkillLevel;
        
        // 记录技能升级历史
        this.levelHistory.push({
          level: newSkillLevel,
          category: category,
          reachedAt: new Date(),
          xpAtLevel: skillLevel.totalXP,
          bonusReward: this.calculateSkillLevelReward(category, newSkillLevel)
        });

        result.skillLevelUp = { category, newLevel: newSkillLevel };
      }
    } else {
      // 初始化新技能分类
      this.skillLevels.push({
        category,
        level: 1,
        currentXP: xp,
        totalXP: xp,
        unlockedAt: new Date()
      });
    }
  }

  await this.save();
  return result;
};

UserLevelSchema.methods.canPrestige = function(): boolean {
  return this.overallLevel >= 50;
};

UserLevelSchema.methods.prestigeRebirth = async function(): Promise<{
  success: boolean;
  newPrestigeLevel: number;
  bonusMultiplier: number;
  rewards: { points: number; items: string[] };
}> {
  if (!this.canPrestige()) {
    return { success: false, newPrestigeLevel: 0, bonusMultiplier: 1, rewards: { points: 0, items: [] } };
  }

  // 重生逻辑
  const oldPrestigeLevel = this.prestige.level;
  this.prestige.level += 1;
  this.prestige.totalRebirths += 1;
  this.prestige.lastRebirthAt = new Date();
  this.prestige.bonusMultiplier = 1 + (this.prestige.level * 0.1); // 每次重生+10%经验

  // 重置等级，保留一定比例的XP
  const retainedXP = Math.floor(this.overallXP * 0.1); // 保留10%的XP
  this.overallXP = retainedXP;
  this.overallLevel = this.constructor.calculateLevelFromXP(retainedXP);

  // 重置技能等级
  for (const skill of this.skillLevels) {
    const retainedSkillXP = Math.floor(skill.totalXP * 0.15); // 技能XP保留15%
    skill.totalXP = retainedSkillXP;
    skill.currentXP = retainedSkillXP;
    skill.level = this.constructor.calculateLevelFromXP(retainedSkillXP);
  }

  const rewards = {
    points: this.prestige.level * 1000, // 每个威望等级奖励1000积分
    items: [`prestige_badge_${this.prestige.level}`, 'prestige_title']
  };

  await this.save();

  return {
    success: true,
    newPrestigeLevel: this.prestige.level,
    bonusMultiplier: this.prestige.bonusMultiplier,
    rewards
  };
};

UserLevelSchema.methods.getXPToNextLevel = function(category?: SkillCategory): number {
  if (category) {
    const skill = this.skillLevels.find(s => s.category === category);
    if (!skill) return 100;
    
    const nextLevelXP = this.constructor.calculateXPForLevel(skill.level + 1);
    return nextLevelXP - skill.totalXP;
  } else {
    const nextLevelXP = this.constructor.calculateXPForLevel(this.overallLevel + 1);
    return nextLevelXP - this.overallXP;
  }
};

UserLevelSchema.methods.calculateLevelReward = function(level: number) {
  const basePoints = level * 50;
  const rewards = { points: basePoints, items: [] };

  // 特殊等级奖励
  if (level % 10 === 0) { // 每10级
    rewards.items.push(`level_${level}_badge`);
    rewards.points *= 2;
  }

  if (level === 25) {
    rewards.items.push('milestone_apprentice');
  } else if (level === 50) {
    rewards.items.push('milestone_expert');
  } else if (level === 100) {
    rewards.items.push('milestone_master');
  }

  return rewards;
};

UserLevelSchema.methods.calculateSkillLevelReward = function(category: SkillCategory, level: number) {
  const basePoints = level * 25;
  const rewards = { points: basePoints, items: [] };

  if (level % 5 === 0) { // 每5级
    rewards.items.push(`${category}_skill_${level}_badge`);
  }

  return rewards;
};

UserLevelSchema.methods.getSkillProgress = function() {
  return this.skillLevels.map(skill => ({
    category: skill.category,
    level: skill.level,
    progress: Math.floor((skill.currentXP / this.getXPToNextLevel(skill.category)) * 100),
    totalXP: skill.totalXP,
    nextLevelXP: this.getXPToNextLevel(skill.category)
  }));
};

export const UserLevel = mongoose.model<IUserLevel>('UserLevel', UserLevelSchema);
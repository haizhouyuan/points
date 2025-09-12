/**
 * 动态成就系统服务
 * 基于用户行为实时生成个性化成就
 * 
 * 核心设计原理：
 * 1. 自适应难度调整
 * 2. 个性化成就生成  
 * 3. 稀有度分层激励
 * 4. 时间限制创造紧迫感
 */

export interface AchievementCondition {
  type: 'task_count' | 'streak_days' | 'points_total' | 'skill_unlock' | 'time_spent' | 'difficulty_level';
  value: number;
  comparison: '=' | '>' | '>=' | '<' | '<=';
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  category?: string;
}

export interface AchievementReward {
  points: number;
  badges: string[];
  unlocks: string[];  // 解锁内容/功能
  title?: string;     // 称号奖励
  privileges?: string[];  // 特权奖励
}

export interface DynamicAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'adaptive' | 'challenge' | 'discovery' | 'social' | 'milestone';
  conditions: AchievementCondition[];
  rewards: AchievementReward;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  personalizedFor: string; // userId
  generatedAt: string;
  validUntil?: string; // 限时成就
  progress: number;    // 0-100 进度百分比
  isCompleted: boolean;
  isHidden: boolean;   // 隐藏成就，完成后才显示
}

export interface UserBehaviorProfile {
  preferredCategories: string[];
  averageSessionMinutes: number;
  streakRecord: number;
  difficultyPreference: 'easy' | 'medium' | 'hard';
  activityPatterns: {
    morningActive: number;    // 0-1 活跃度
    afternoonActive: number;
    eveningActive: number;
  };
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  motivationTriggers: ('competition' | 'achievement' | 'progress' | 'social')[];
}

// 成就稀有度配置
const RARITY_CONFIG = {
  common: {
    probability: 0.6,
    basePoints: 50,
    colorTheme: '#22c55e', // green
    glowEffect: 'subtle'
  },
  rare: {
    probability: 0.25,
    basePoints: 150,
    colorTheme: '#3b82f6', // blue
    glowEffect: 'moderate'
  },
  epic: {
    probability: 0.1,
    basePoints: 300,
    colorTheme: '#8b5cf6', // purple
    glowEffect: 'strong'
  },
  legendary: {
    probability: 0.04,
    basePoints: 500,
    colorTheme: '#f59e0b', // orange
    glowEffect: 'brilliant'
  },
  mythic: {
    probability: 0.01,
    basePoints: 1000,
    colorTheme: '#ef4444', // red
    glowEffect: 'transcendent'
  }
};

// 成就模板库
const ACHIEVEMENT_TEMPLATES = {
  // 连击类成就
  streak: {
    templates: [
      {
        titlePattern: "连续学习{days}天",
        descPattern: "保持{days}天的学习连击，展现你的坚持力！",
        icon: "🔥",
        baseRarity: 'common'
      },
      {
        titlePattern: "学习马拉松{days}天",
        descPattern: "连续{days}天不间断学习，你的毅力令人敬佩！",
        icon: "🏃‍♂️",
        baseRarity: 'rare'
      }
    ]
  },
  
  // 探索类成就
  exploration: {
    templates: [
      {
        titlePattern: "技能探索者",
        descPattern: "解锁{count}个新技能分类，成为全能学习者！",
        icon: "🗺️",
        baseRarity: 'rare'
      },
      {
        titlePattern: "挑战征服者",
        descPattern: "完成{count}个困难任务，证明你的实力！",
        icon: "⚔️",
        baseRarity: 'epic'
      }
    ]
  },
  
  // 里程碑成就
  milestone: {
    templates: [
      {
        titlePattern: "积分大师",
        descPattern: "累积获得{points}积分，你的努力得到了回报！",
        icon: "💎",
        baseRarity: 'legendary'
      },
      {
        titlePattern: "时间投资者",
        descPattern: "总学习时长达到{hours}小时，时间就是财富！",
        icon: "⏰",
        baseRarity: 'epic'
      }
    ]
  }
};

export class AchievementService {
  /**
   * 基于用户行为档案生成个性化成就
   */
  static generatePersonalizedAchievements(
    userId: string, 
    profile: UserBehaviorProfile,
    existingAchievements: DynamicAchievement[]
  ): DynamicAchievement[] {
    const achievements: DynamicAchievement[] = [];
    
    // 1. 基于弱项生成挑战成就
    const weaknessAchievements = this.generateWeaknessChallenge(userId, profile);
    achievements.push(...weaknessAchievements);
    
    // 2. 基于优势生成进阶成就
    const strengthAchievements = this.generateStrengthProgression(userId, profile);
    achievements.push(...strengthAchievements);
    
    // 3. 基于学习模式生成适配成就
    const adaptiveAchievements = this.generateAdaptiveAchievements(userId, profile);
    achievements.push(...adaptiveAchievements);
    
    // 4. 限时特殊成就
    const timeAchievements = this.generateTimeLimitedAchievements(userId, profile);
    achievements.push(...timeAchievements);
    
    // 过滤重复和冲突成就
    return this.filterAndOptimizeAchievements(achievements, existingAchievements);
  }
  
  /**
   * 基于用户弱项生成挑战成就
   */
  private static generateWeaknessChallenge(
    userId: string, 
    profile: UserBehaviorProfile
  ): DynamicAchievement[] {
    const achievements: DynamicAchievement[] = [];
    
    // 检测学习时长弱项
    if (profile.averageSessionMinutes < 30) {
      achievements.push({
        id: `weakness_time_${userId}_${Date.now()}`,
        title: "专注力提升挑战",
        description: "单次学习时长达到45分钟，突破你的专注极限！",
        icon: "🎯",
        type: 'challenge',
        conditions: [{
          type: 'time_spent',
          value: 45,
          comparison: '>=',
          timeframe: 'daily'
        }],
        rewards: {
          points: 200,
          badges: ['专注达人'],
          unlocks: ['长时间学习模式'],
          title: '专注大师'
        },
        rarity: 'rare',
        personalizedFor: userId,
        generatedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天有效
        progress: 0,
        isCompleted: false,
        isHidden: false
      });
    }
    
    // 检测连击弱项
    if (profile.streakRecord < 7) {
      achievements.push({
        id: `weakness_streak_${userId}_${Date.now()}`,
        title: "坚持的力量",
        description: "连续学习7天，培养持久的学习习惯！",
        icon: "💪",
        type: 'adaptive',
        conditions: [{
          type: 'streak_days',
          value: 7,
          comparison: '>=',
          timeframe: 'all_time'
        }],
        rewards: {
          points: 350,
          badges: ['坚持不懈'],
          unlocks: ['习惯跟踪器'],
          privileges: ['每日奖励翻倍']
        },
        rarity: 'epic',
        personalizedFor: userId,
        generatedAt: new Date().toISOString(),
        progress: 0,
        isCompleted: false,
        isHidden: false
      });
    }
    
    return achievements;
  }
  
  /**
   * 基于用户优势生成进阶成就
   */
  private static generateStrengthProgression(
    userId: string,
    profile: UserBehaviorProfile
  ): DynamicAchievement[] {
    const achievements: DynamicAchievement[] = [];
    
    // 如果用户已经有不错的连击记录，生成更高难度的连击成就
    if (profile.streakRecord >= 7) {
      const targetStreak = Math.max(profile.streakRecord + 7, 21);
      achievements.push({
        id: `strength_advanced_streak_${userId}_${Date.now()}`,
        title: `学习传奇 ${targetStreak}天`,
        description: `连续学习${targetStreak}天，成为真正的学习传奇！`,
        icon: "👑",
        type: 'milestone',
        conditions: [{
          type: 'streak_days',
          value: targetStreak,
          comparison: '>=',
          timeframe: 'all_time'
        }],
        rewards: {
          points: targetStreak * 50,
          badges: ['学习传奇', '意志之王'],
          unlocks: ['专属学习空间', '高级分析报告'],
          title: '学习传奇',
          privileges: ['VIP定制推荐', '专属客服']
        },
        rarity: 'legendary',
        personalizedFor: userId,
        generatedAt: new Date().toISOString(),
        progress: (profile.streakRecord / targetStreak) * 100,
        isCompleted: false,
        isHidden: false
      });
    }
    
    return achievements;
  }
  
  /**
   * 基于学习模式生成适配成就
   */
  private static generateAdaptiveAchievements(
    userId: string,
    profile: UserBehaviorProfile
  ): DynamicAchievement[] {
    const achievements: DynamicAchievement[] = [];
    
    // 基于活跃时间模式
    const peakTime = this.detectPeakLearningTime(profile.activityPatterns);
    if (peakTime) {
      achievements.push({
        id: `adaptive_time_${userId}_${Date.now()}`,
        title: `${peakTime}学习达人`,
        description: `在你的黄金学习时段${peakTime}完成5次高质量学习！`,
        icon: peakTime === '早晨' ? '🌅' : peakTime === '下午' ? '☀️' : '🌙',
        type: 'adaptive',
        conditions: [{
          type: 'task_count',
          value: 5,
          comparison: '>=',
          timeframe: 'weekly'
        }],
        rewards: {
          points: 300,
          badges: [`${peakTime}战士`],
          unlocks: ['个性化时间推荐'],
          title: `${peakTime}专家`
        },
        rarity: 'rare',
        personalizedFor: userId,
        generatedAt: new Date().toISOString(),
        progress: 0,
        isCompleted: false,
        isHidden: false
      });
    }
    
    return achievements;
  }
  
  /**
   * 生成限时特殊成就
   */
  private static generateTimeLimitedAchievements(
    userId: string,
    profile: UserBehaviorProfile
  ): DynamicAchievement[] {
    const achievements: DynamicAchievement[] = [];
    
    // 周末冲刺成就
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    if (isWeekend) {
      achievements.push({
        id: `weekend_sprint_${userId}_${Date.now()}`,
        title: "周末学习狂欢",
        description: "利用周末时光，完成3个不同类别的学习任务！",
        icon: "🎉",
        type: 'challenge',
        conditions: [{
          type: 'task_count',
          value: 3,
          comparison: '>=',
          timeframe: 'daily'
        }],
        rewards: {
          points: 400,
          badges: ['周末战士'],
          unlocks: ['周末特别模式'],
          privileges: ['周末双倍积分']
        },
        rarity: 'epic',
        personalizedFor: userId,
        generatedAt: new Date().toISOString(),
        validUntil: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 周末结束
        progress: 0,
        isCompleted: false,
        isHidden: false
      });
    }
    
    return achievements;
  }
  
  /**
   * 检测用户的黄金学习时段
   */
  private static detectPeakLearningTime(patterns: UserBehaviorProfile['activityPatterns']): string | null {
    const { morningActive, afternoonActive, eveningActive } = patterns;
    const max = Math.max(morningActive, afternoonActive, eveningActive);
    
    if (max < 0.5) return null; // 没有明显的活跃时段
    
    if (morningActive === max) return '早晨';
    if (afternoonActive === max) return '下午';
    if (eveningActive === max) return '晚上';
    
    return null;
  }
  
  /**
   * 过滤和优化成就列表
   */
  private static filterAndOptimizeAchievements(
    newAchievements: DynamicAchievement[],
    existingAchievements: DynamicAchievement[]
  ): DynamicAchievement[] {
    // 移除与现有成就冲突的成就
    const filtered = newAchievements.filter(newAch => {
      return !existingAchievements.some(existing => 
        existing.type === newAch.type && 
        existing.title === newAch.title
      );
    });
    
    // 限制同时存在的成就数量，保持挑战的专注性
    const maxSimultaneousAchievements = 5;
    return filtered
      .sort((a, b) => this.getRarityWeight(b.rarity) - this.getRarityWeight(a.rarity))
      .slice(0, maxSimultaneousAchievements);
  }
  
  /**
   * 获取稀有度权重
   */
  private static getRarityWeight(rarity: DynamicAchievement['rarity']): number {
    const weights = {
      common: 1,
      rare: 2,
      epic: 3,
      legendary: 4,
      mythic: 5
    };
    return weights[rarity];
  }
  
  /**
   * 检查成就完成状态
   */
  static checkAchievementProgress(
    achievement: DynamicAchievement,
    userStats: any
  ): { progress: number; isCompleted: boolean } {
    let totalProgress = 0;
    const conditionCount = achievement.conditions.length;
    
    for (const condition of achievement.conditions) {
      const conditionProgress = this.evaluateCondition(condition, userStats);
      totalProgress += conditionProgress;
    }
    
    const averageProgress = totalProgress / conditionCount;
    const isCompleted = averageProgress >= 100;
    
    return {
      progress: Math.min(100, averageProgress),
      isCompleted
    };
  }
  
  /**
   * 评估单个条件的完成度
   */
  private static evaluateCondition(condition: AchievementCondition, userStats: any): number {
    const statValue = this.getStatValue(condition, userStats);
    const targetValue = condition.value;
    
    switch (condition.comparison) {
      case '>=':
        return Math.min(100, (statValue / targetValue) * 100);
      case '>':
        return statValue > targetValue ? 100 : (statValue / targetValue) * 100;
      case '=':
        return statValue === targetValue ? 100 : 0;
      case '<=':
        return statValue <= targetValue ? 100 : Math.max(0, 100 - ((statValue - targetValue) / targetValue) * 100);
      case '<':
        return statValue < targetValue ? 100 : 0;
      default:
        return 0;
    }
  }
  
  /**
   * 根据条件类型获取用户统计值
   */
  private static getStatValue(condition: AchievementCondition, userStats: any): number {
    switch (condition.type) {
      case 'task_count':
        return userStats.tasksCompleted?.[condition.timeframe || 'all_time'] || 0;
      case 'streak_days':
        return userStats.currentStreak || 0;
      case 'points_total':
        return userStats.totalPoints || 0;
      case 'time_spent':
        return userStats.timeSpent?.[condition.timeframe || 'all_time'] || 0;
      case 'difficulty_level':
        return userStats.averageDifficulty || 0;
      case 'skill_unlock':
        return userStats.unlockedSkills?.length || 0;
      default:
        return 0;
    }
  }
}
import { TaskLite as Task, UserLite as User } from '@/services/types';

export interface UserBehaviorData {
  userId: string;
  completedTasks: Task[];
  preferredCategories: string[];
  averageSessionDuration: number;
  timeOfDayPreference: number; // 0-23 hours
  difficultyPreference: 'easy' | 'medium' | 'hard';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  streakDays: number;
  totalPoints: number;
  lastActiveDate: Date;
  engagementScore: number; // 0-100
}

export interface RecommendationItem {
  task: Task;
  confidence: number; // 0-1
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedEngagement: number;
  category: string;
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
  personalizedMessage: string;
  learningGoal: string;
  nextMilestone: string;
}

export class RecommendationService {
  private static readonly CATEGORY_WEIGHTS = {
    exercise: 0.25,
    reading: 0.20,
    learning: 0.25,
    creativity: 0.15,
    chores: 0.10,
    other: 0.05
  };

  private static readonly TIME_DECAY_FACTOR = 0.95; // 每天衰减5%
  private static readonly MIN_CONFIDENCE_THRESHOLD = 0.3;

  /**
   * 生成个性化推荐
   */
  static generateRecommendations(
    user: User,
    behaviorData: UserBehaviorData,
    availableTasks: Task[]
  ): RecommendationResponse {
    // 1. 计算用户偏好权重
    const preferenceWeights = this.calculatePreferenceWeights(behaviorData);
    
    // 2. 分析学习模式
    const learningPattern = this.analyzeLearningPattern(behaviorData);
    
    // 3. 生成推荐列表
    const recommendations = this.generateTaskRecommendations(
      availableTasks,
      behaviorData,
      preferenceWeights,
      learningPattern
    );

    // 4. 生成个性化消息
    const personalizedMessage = this.generatePersonalizedMessage(user, behaviorData);
    
    // 5. 设定学习目标和里程碑
    const { learningGoal, nextMilestone } = this.generateLearningGoals(behaviorData);

    return {
      recommendations,
      personalizedMessage,
      learningGoal,
      nextMilestone
    };
  }

  /**
   * 计算用户类别偏好权重
   */
  private static calculatePreferenceWeights(behaviorData: UserBehaviorData): Record<string, number> {
    const categoryCount: Record<string, number> = {};
    const weights: Record<string, number> = { ...this.CATEGORY_WEIGHTS };

    // 统计完成任务的类别分布
    behaviorData.completedTasks.forEach(task => {
      categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
    });

    const totalTasks = behaviorData.completedTasks.length;
    if (totalTasks === 0) return weights;

    // 基于历史行为调整权重
    Object.keys(categoryCount).forEach(category => {
      const frequency = categoryCount[category] / totalTasks;
      // 增强用户偏好的类别权重
      weights[category] = Math.min(weights[category] * (1 + frequency * 2), 0.5);
    });

    // 归一化权重
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(weights).forEach(category => {
      weights[category] /= totalWeight;
    });

    return weights;
  }

  /**
   * 分析用户学习模式
   */
  private static analyzeLearningPattern(behaviorData: UserBehaviorData): {
    optimalTimeSlot: number;
    preferredDifficulty: string;
    sessionLength: number;
    motivationalFactors: string[];
  } {
    return {
      optimalTimeSlot: behaviorData.timeOfDayPreference,
      preferredDifficulty: behaviorData.difficultyPreference,
      sessionLength: behaviorData.averageSessionDuration,
      motivationalFactors: this.identifyMotivationalFactors(behaviorData)
    };
  }

  /**
   * 识别激励因素
   */
  private static identifyMotivationalFactors(behaviorData: UserBehaviorData): string[] {
    const factors = [];
    
    if (behaviorData.streakDays > 7) factors.push('consistency');
    if (behaviorData.engagementScore > 80) factors.push('achievement');
    if (behaviorData.preferredCategories.length > 3) factors.push('variety');
    if (behaviorData.averageSessionDuration > 30) factors.push('deep_focus');
    
    return factors;
  }

  /**
   * 生成任务推荐
   */
  private static generateTaskRecommendations(
    availableTasks: Task[],
    behaviorData: UserBehaviorData,
    preferenceWeights: Record<string, number>,
    learningPattern: any
  ): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];

    availableTasks.forEach(task => {
      const confidence = this.calculateTaskConfidence(task, behaviorData, preferenceWeights);
      
      if (confidence >= this.MIN_CONFIDENCE_THRESHOLD) {
        const reason = this.generateRecommendationReason(task, behaviorData, confidence);
        const priority = this.determinePriority(confidence, task);
        const estimatedEngagement = this.estimateEngagement(task, behaviorData);

        recommendations.push({
          task,
          confidence,
          reason,
          priority,
          estimatedEngagement,
          category: task.category
        });
      }
    });

    // 按置信度和优先级排序
    recommendations.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.confidence - a.confidence;
    });

    return recommendations.slice(0, 8); // 返回前8个推荐
  }

  /**
   * 计算任务置信度
   */
  private static calculateTaskConfidence(
    task: Task,
    behaviorData: UserBehaviorData,
    preferenceWeights: Record<string, number>
  ): number {
    let confidence = 0;

    // 类别偏好权重 (40%)
    confidence += (preferenceWeights[task.category] || 0) * 0.4;

    // 难度匹配度 (25%)
    const difficultyMatch = this.calculateDifficultyMatch(task.difficulty, behaviorData.difficultyPreference);
    confidence += difficultyMatch * 0.25;

    // 时长匹配度 (20%)
    const durationMatch = this.calculateDurationMatch(task.estimatedDuration, behaviorData.averageSessionDuration);
    confidence += durationMatch * 0.2;

    // 新鲜度奖励 (15%)
    const noveltyBonus = this.calculateNoveltyBonus(task, behaviorData.completedTasks);
    confidence += noveltyBonus * 0.15;

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * 计算难度匹配度
   */
  private static calculateDifficultyMatch(taskDifficulty: string, userPreference: string): number {
    if (taskDifficulty === userPreference) return 1.0;
    
    const difficultyLevels = ['easy', 'medium', 'hard'];
    const taskIndex = difficultyLevels.indexOf(taskDifficulty);
    const prefIndex = difficultyLevels.indexOf(userPreference);
    
    const distance = Math.abs(taskIndex - prefIndex);
    return Math.max(0, 1 - distance * 0.3);
  }

  /**
   * 计算时长匹配度
   */
  private static calculateDurationMatch(taskDuration: number, userAvgDuration: number): number {
    const ratio = Math.min(taskDuration, userAvgDuration) / Math.max(taskDuration, userAvgDuration);
    return ratio;
  }

  /**
   * 计算新鲜度奖励
   */
  private static calculateNoveltyBonus(task: Task, completedTasks: Task[]): number {
    const completedInCategory = completedTasks.filter(t => t.category === task.category).length;
    const totalCompleted = completedTasks.length;
    
    if (totalCompleted === 0) return 1.0;
    
    const categoryRatio = completedInCategory / totalCompleted;
    return Math.max(0.2, 1 - categoryRatio);
  }

  /**
   * 生成推荐理由
   */
  private static generateRecommendationReason(task: Task, behaviorData: UserBehaviorData, confidence: number): string {
    if (confidence > 0.8) {
      return `基于您的学习偏好和历史表现，这个任务非常适合您`;
    } else if (confidence > 0.6) {
      return `这个任务与您的兴趣领域匹配，建议尝试`;
    } else if (confidence > 0.4) {
      return `这是一个不错的挑战，可以帮助您拓展新技能`;
    } else {
      return `尝试新领域的好机会，丰富您的学习体验`;
    }
  }

  /**
   * 确定优先级
   */
  private static determinePriority(confidence: number, task: Task): 'high' | 'medium' | 'low' {
    if (confidence > 0.7) return 'high';
    if (confidence > 0.5) return 'medium';
    return 'low';
  }

  /**
   * 估算参与度
   */
  private static estimateEngagement(task: Task, behaviorData: UserBehaviorData): number {
    const baseEngagement = 0.6;
    const categoryBonus = behaviorData.preferredCategories.includes(task.category) ? 0.2 : 0;
    const difficultyBonus = task.difficulty === behaviorData.difficultyPreference ? 0.1 : 0;
    const pointsBonus = task.points > 50 ? 0.1 : 0;
    
    return Math.min(baseEngagement + categoryBonus + difficultyBonus + pointsBonus, 1.0);
  }

  /**
   * 生成个性化消息
   */
  private static generatePersonalizedMessage(user: User, behaviorData: UserBehaviorData): string {
    const { streakDays, engagementScore, preferredCategories } = behaviorData;
    
    if (streakDays > 14) {
      return `🔥 ${user.username}，您已经连续学习${streakDays}天了！保持这个势头，向着新目标前进！`;
    } else if (engagementScore > 80) {
      return `⭐ ${user.username}，您的学习积极性很高！这些推荐任务将帮助您进一步提升！`;
    } else if (preferredCategories.length > 3) {
      return `🌈 ${user.username}，您在多个领域都有涉猎，这些多样化的任务很适合您！`;
    } else {
      return `📚 ${user.username}，根据您的学习习惯，我为您精心挑选了这些任务！`;
    }
  }

  /**
   * 生成学习目标和里程碑
   */
  private static generateLearningGoals(behaviorData: UserBehaviorData): {
    learningGoal: string;
    nextMilestone: string;
  } {
    const { totalPoints, streakDays } = behaviorData;
    
    let learningGoal: string;
    let nextMilestone: string;

    if (totalPoints < 500) {
      learningGoal = "建立学习习惯，完成基础技能训练";
      nextMilestone = "达到500积分解锁中级任务";
    } else if (totalPoints < 1500) {
      learningGoal = "深化学习，掌握核心技能";
      nextMilestone = "达到1500积分解锁高级挑战";
    } else {
      learningGoal = "追求卓越，成为全能学习者";
      nextMilestone = "达成特殊成就，解锁专家模式";
    }

    return { learningGoal, nextMilestone };
  }

  /**
   * 更新用户行为数据
   */
  static updateUserBehavior(
    currentBehavior: UserBehaviorData,
    completedTask: Task,
    sessionDuration: number
  ): UserBehaviorData {
    const updatedBehavior = { ...currentBehavior };
    
    // 更新完成任务列表
    updatedBehavior.completedTasks.push(completedTask);
    
    // 更新偏好类别
    if (!updatedBehavior.preferredCategories.includes(completedTask.category)) {
      updatedBehavior.preferredCategories.push(completedTask.category);
    }
    
    // 更新平均会话时长（移动平均）
    const taskCount = updatedBehavior.completedTasks.length;
    updatedBehavior.averageSessionDuration = 
      (updatedBehavior.averageSessionDuration * (taskCount - 1) + sessionDuration) / taskCount;
    
    // 更新总积分
    updatedBehavior.totalPoints += completedTask.points;
    
    // 更新参与度分数
    updatedBehavior.engagementScore = Math.min(
      updatedBehavior.engagementScore + (completedTask.points > 50 ? 2 : 1),
      100
    );
    
    // 更新最后活动时间
    updatedBehavior.lastActiveDate = new Date();
    
    return updatedBehavior;
  }
}

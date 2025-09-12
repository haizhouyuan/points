import { Task } from '../types/task';
import { User } from '../types/user';
import { UserBehaviorData } from './recommendation.service';

export interface LearningSession {
  id: string;
  userId: string;
  taskId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  completed: boolean;
  difficulty: string;
  category: string;
  points: number;
  engagement: number; // 1-5 scale
}

export interface BehaviorAnalysisResult {
  userProfile: UserProfile;
  learningPatterns: LearningPattern[];
  predictions: BehaviorPrediction[];
  recommendations: string[];
}

export interface UserProfile {
  userId: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  motivationType: 'achievement' | 'social' | 'mastery' | 'autonomy';
  optimalStudyTime: number; // hour of day
  averageSessionLength: number; // minutes
  consistencyScore: number; // 0-100
  adaptabilityScore: number; // 0-100
  challengePreference: number; // 0-100, higher = prefers harder tasks
}

export interface LearningPattern {
  type: 'time_preference' | 'difficulty_progression' | 'category_rotation' | 'session_length';
  pattern: string;
  confidence: number; // 0-1
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface BehaviorPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string; // '1_week' | '2_weeks' | '1_month'
  factors: string[];
}

export class BehaviorAnalysisService {
  private static readonly MIN_SESSIONS_FOR_ANALYSIS = 5;
  private static readonly TIME_WINDOW_DAYS = 30;

  /**
   * 分析用户行为并生成用户画像
   */
  static analyzeUserBehavior(sessions: LearningSession[]): BehaviorAnalysisResult {
    if (sessions.length < this.MIN_SESSIONS_FOR_ANALYSIS) {
      return this.generateDefaultAnalysis(sessions[0]?.userId || '');
    }

    const userProfile = this.generateUserProfile(sessions);
    const learningPatterns = this.identifyLearningPatterns(sessions);
    const predictions = this.generatePredictions(sessions, userProfile);
    const recommendations = this.generateBehaviorRecommendations(userProfile, learningPatterns);

    return {
      userProfile,
      learningPatterns,
      predictions,
      recommendations
    };
  }

  /**
   * 生成用户画像
   */
  private static generateUserProfile(sessions: LearningSession[]): UserProfile {
    const userId = sessions[0].userId;
    
    return {
      userId,
      learningStyle: this.identifyLearningStyle(sessions),
      motivationType: this.identifyMotivationType(sessions),
      optimalStudyTime: this.findOptimalStudyTime(sessions),
      averageSessionLength: this.calculateAverageSessionLength(sessions),
      consistencyScore: this.calculateConsistencyScore(sessions),
      adaptabilityScore: this.calculateAdaptabilityScore(sessions),
      challengePreference: this.calculateChallengePreference(sessions)
    };
  }

  /**
   * 识别学习风格
   */
  private static identifyLearningStyle(sessions: LearningSession[]): 'visual' | 'auditory' | 'kinesthetic' | 'mixed' {
    const categoryEngagement: Record<string, number[]> = {};
    
    sessions.forEach(session => {
      if (!categoryEngagement[session.category]) {
        categoryEngagement[session.category] = [];
      }
      categoryEngagement[session.category].push(session.engagement);
    });

    const avgEngagementByCategory = Object.keys(categoryEngagement).map(category => ({
      category,
      avgEngagement: categoryEngagement[category].reduce((a, b) => a + b, 0) / categoryEngagement[category].length
    })).sort((a, b) => b.avgEngagement - a.avgEngagement);

    const topCategory = avgEngagementByCategory[0]?.category;
    
    // 基于最高参与度类别推断学习风格
    switch (topCategory) {
      case 'creativity':
      case 'reading':
        return 'visual';
      case 'exercise':
      case 'chores':
        return 'kinesthetic';
      case 'learning':
        return avgEngagementByCategory.length > 2 ? 'mixed' : 'auditory';
      default:
        return 'mixed';
    }
  }

  /**
   * 识别动机类型
   */
  private static identifyMotivationType(sessions: LearningSession[]): 'achievement' | 'social' | 'mastery' | 'autonomy' {
    const completionRate = sessions.filter(s => s.completed).length / sessions.length;
    const avgPoints = sessions.reduce((sum, s) => sum + s.points, 0) / sessions.length;
    const difficultyProgression = this.analyzeDifficultyProgression(sessions);
    const sessionConsistency = this.calculateSessionConsistency(sessions);

    if (avgPoints > 80 && completionRate > 0.9) return 'achievement';
    if (difficultyProgression > 0.3) return 'mastery';
    if (sessionConsistency > 0.8) return 'autonomy';
    return 'social';
  }

  /**
   * 寻找最佳学习时间
   */
  private static findOptimalStudyTime(sessions: LearningSession[]): number {
    const hourEngagement: Record<number, number[]> = {};
    
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      if (!hourEngagement[hour]) {
        hourEngagement[hour] = [];
      }
      hourEngagement[hour].push(session.engagement);
    });

    let bestHour = 14; // default 2 PM
    let bestAvgEngagement = 0;

    Object.keys(hourEngagement).forEach(hour => {
      const avgEngagement = hourEngagement[parseInt(hour)].reduce((a, b) => a + b, 0) / hourEngagement[parseInt(hour)].length;
      if (avgEngagement > bestAvgEngagement) {
        bestAvgEngagement = avgEngagement;
        bestHour = parseInt(hour);
      }
    });

    return bestHour;
  }

  /**
   * 计算平均会话时长
   */
  private static calculateAverageSessionLength(sessions: LearningSession[]): number {
    const completedSessions = sessions.filter(s => s.completed);
    if (completedSessions.length === 0) return 20; // default 20 minutes
    
    return completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length;
  }

  /**
   * 计算一致性分数
   */
  private static calculateConsistencyScore(sessions: LearningSession[]): number {
    if (sessions.length < 7) return 50; // 不足一周数据，返回中等分数
    
    const dates = sessions.map(s => s.startTime.toDateString());
    const uniqueDates = new Set(dates);
    const daysWithSessions = uniqueDates.size;
    
    // 计算最近7天的一致性
    const recentSessions = sessions.filter(s => {
      const daysDiff = (new Date().getTime() - s.startTime.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });
    
    const recentUniqueDates = new Set(recentSessions.map(s => s.startTime.toDateString()));
    const consistencyRatio = recentUniqueDates.size / 7;
    
    return Math.min(consistencyRatio * 100, 100);
  }

  /**
   * 计算适应性分数
   */
  private static calculateAdaptabilityScore(sessions: LearningSession[]): number {
    const categories = new Set(sessions.map(s => s.category));
    const difficulties = new Set(sessions.map(s => s.difficulty));
    
    // 基于尝试的类别和难度多样性
    const categoryDiversity = Math.min(categories.size / 6, 1); // 假设最多6个类别
    const difficultyDiversity = Math.min(difficulties.size / 3, 1); // 3个难度级别
    
    return (categoryDiversity + difficultyDiversity) * 50;
  }

  /**
   * 计算挑战偏好度
   */
  private static calculateChallengePreference(sessions: LearningSession[]): number {
    const difficultyScores: Record<string, number> = {
      'easy': 1,
      'medium': 2,
      'hard': 3
    };

    const weightedDifficulty = sessions.reduce((sum, s) => {
      const weight = s.engagement / 5; // 将参与度作为权重
      return sum + (difficultyScores[s.difficulty] || 2) * weight;
    }, 0);

    const totalWeight = sessions.reduce((sum, s) => sum + s.engagement / 5, 0);
    const avgWeightedDifficulty = totalWeight > 0 ? weightedDifficulty / totalWeight : 2;
    
    // 转换为0-100分数
    return ((avgWeightedDifficulty - 1) / 2) * 100;
  }

  /**
   * 识别学习模式
   */
  private static identifyLearningPatterns(sessions: LearningSession[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];

    // 时间偏好模式
    patterns.push(this.analyzeTimePreferencePattern(sessions));
    
    // 难度进阶模式
    patterns.push(this.analyzeDifficultyProgressionPattern(sessions));
    
    // 类别轮换模式
    patterns.push(this.analyzeCategoryRotationPattern(sessions));
    
    // 会话时长模式
    patterns.push(this.analyzeSessionLengthPattern(sessions));

    return patterns.filter(p => p.confidence > 0.3);
  }

  /**
   * 分析时间偏好模式
   */
  private static analyzeTimePreferencePattern(sessions: LearningSession[]): LearningPattern {
    const hourlyEngagement: Record<number, number[]> = {};
    
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      if (!hourlyEngagement[hour]) {
        hourlyEngagement[hour] = [];
      }
      hourlyEngagement[hour].push(session.engagement);
    });

    const peakHours = Object.keys(hourlyEngagement)
      .map(hour => ({
        hour: parseInt(hour),
        avgEngagement: hourlyEngagement[parseInt(hour)].reduce((a, b) => a + b, 0) / hourlyEngagement[parseInt(hour)].length,
        sessionCount: hourlyEngagement[parseInt(hour)].length
      }))
      .filter(h => h.sessionCount >= 3)
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 2);

    const confidence = peakHours.length > 0 ? Math.min(peakHours[0].sessionCount / sessions.length * 4, 1) : 0.2;
    
    const timeRanges = peakHours.map(h => {
      if (h.hour >= 6 && h.hour < 12) return '上午';
      if (h.hour >= 12 && h.hour < 18) return '下午';
      if (h.hour >= 18 && h.hour < 22) return '晚上';
      return '深夜';
    });

    return {
      type: 'time_preference',
      pattern: `偏好在${timeRanges.join('和')}学习`,
      confidence,
      impact: confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low',
      recommendation: `建议在${timeRanges[0]}安排主要学习任务`
    };
  }

  /**
   * 分析难度进阶模式
   */
  private static analyzeDifficultyProgressionPattern(sessions: LearningSession[]): LearningPattern {
    const progression = this.analyzeDifficultyProgression(sessions);
    const confidence = Math.abs(progression);
    
    let pattern: string;
    let recommendation: string;

    if (progression > 0.3) {
      pattern = '倾向于挑战更高难度';
      recommendation = '可以适当提供更多高难度任务';
    } else if (progression < -0.3) {
      pattern = '倾向于选择较低难度';
      recommendation = '建议循序渐进，逐步提升难度';
    } else {
      pattern = '难度选择较为平衡';
      recommendation = '保持当前的难度分布';
    }

    return {
      type: 'difficulty_progression',
      pattern,
      confidence,
      impact: confidence > 0.5 ? 'high' : 'medium',
      recommendation
    };
  }

  /**
   * 分析类别轮换模式
   */
  private static analyzeCategoryRotationPattern(sessions: LearningSession[]): LearningPattern {
    const categorySequence = sessions.map(s => s.category);
    const transitions: Record<string, number> = {};
    
    for (let i = 1; i < categorySequence.length; i++) {
      const transition = `${categorySequence[i-1]}->${categorySequence[i]}`;
      transitions[transition] = (transitions[transition] || 0) + 1;
    }

    const sameCategory = Object.keys(transitions).filter(t => {
      const [from, to] = t.split('->');
      return from === to;
    }).reduce((sum, t) => sum + transitions[t], 0);

    const repetitionRate = sameCategory / (categorySequence.length - 1);
    const rotationRate = 1 - repetitionRate;
    
    const pattern = rotationRate > 0.6 ? '倾向于轮换不同类别' : '倾向于专注单一类别';
    const recommendation = rotationRate > 0.6 ? '可以提供多样化的任务组合' : '可以深入单一领域的进阶任务';

    return {
      type: 'category_rotation',
      pattern,
      confidence: Math.abs(rotationRate - 0.5) * 2,
      impact: 'medium',
      recommendation
    };
  }

  /**
   * 分析会话时长模式
   */
  private static analyzeSessionLengthPattern(sessions: LearningSession[]): LearningPattern {
    const completedSessions = sessions.filter(s => s.completed);
    const durations = completedSessions.map(s => s.duration);
    
    if (durations.length === 0) {
      return {
        type: 'session_length',
        pattern: '会话数据不足',
        confidence: 0,
        impact: 'low',
        recommendation: '继续学习以获得更多数据'
      };
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
    const consistency = 1 - Math.min(variance / (avgDuration * avgDuration), 1);

    let pattern: string;
    let recommendation: string;

    if (avgDuration > 45) {
      pattern = '偏好长时间深度学习';
      recommendation = '可以安排更多需要深度思考的任务';
    } else if (avgDuration < 20) {
      pattern = '偏好短时间快节奏学习';
      recommendation = '适合碎片化时间的小任务';
    } else {
      pattern = '中等时长学习习惯';
      recommendation = '保持当前的任务时长分配';
    }

    return {
      type: 'session_length',
      pattern,
      confidence: consistency,
      impact: consistency > 0.7 ? 'high' : 'medium',
      recommendation
    };
  }

  /**
   * 生成行为预测
   */
  private static generatePredictions(sessions: LearningSession[], profile: UserProfile): BehaviorPrediction[] {
    const predictions: BehaviorPrediction[] = [];

    // 预测完成率
    predictions.push(this.predictCompletionRate(sessions));
    
    // 预测参与度
    predictions.push(this.predictEngagement(sessions));
    
    // 预测学习时长
    predictions.push(this.predictStudyTime(sessions, profile));

    return predictions;
  }

  /**
   * 预测完成率
   */
  private static predictCompletionRate(sessions: LearningSession[]): BehaviorPrediction {
    const recentSessions = sessions.slice(-14); // 最近14次
    const currentRate = recentSessions.filter(s => s.completed).length / recentSessions.length;
    
    // 基于趋势预测
    const firstHalf = recentSessions.slice(0, 7);
    const secondHalf = recentSessions.slice(7);
    
    const firstHalfRate = firstHalf.filter(s => s.completed).length / firstHalf.length;
    const secondHalfRate = secondHalf.filter(s => s.completed).length / secondHalf.length;
    
    const trend = secondHalfRate - firstHalfRate;
    const predictedRate = Math.max(0, Math.min(1, currentRate + trend * 0.5));

    return {
      metric: '任务完成率',
      currentValue: Math.round(currentRate * 100),
      predictedValue: Math.round(predictedRate * 100),
      confidence: recentSessions.length >= 10 ? 0.8 : 0.5,
      timeframe: '1_week',
      factors: trend > 0 ? ['学习动力增强', '任务适应性提高'] : ['可能需要调整难度', '注意保持学习兴趣']
    };
  }

  /**
   * 预测参与度
   */
  private static predictEngagement(sessions: LearningSession[]): BehaviorPrediction {
    const recentEngagement = sessions.slice(-10).map(s => s.engagement);
    const currentAvg = recentEngagement.reduce((a, b) => a + b, 0) / recentEngagement.length;
    
    // 简单线性趋势预测
    const trend = recentEngagement.length > 1 ? 
      (recentEngagement[recentEngagement.length - 1] - recentEngagement[0]) / recentEngagement.length : 0;
    
    const predicted = Math.max(1, Math.min(5, currentAvg + trend * 3));

    return {
      metric: '学习参与度',
      currentValue: Math.round(currentAvg * 10) / 10,
      predictedValue: Math.round(predicted * 10) / 10,
      confidence: 0.6,
      timeframe: '2_weeks',
      factors: predicted > currentAvg ? ['学习兴趣持续提升'] : ['需要注入新的学习动力']
    };
  }

  /**
   * 预测学习时长
   */
  private static predictStudyTime(sessions: LearningSession[], profile: UserProfile): BehaviorPrediction {
    const recentCompletedSessions = sessions.filter(s => s.completed).slice(-7);
    const currentWeeklyTime = recentCompletedSessions.reduce((sum, s) => sum + s.duration, 0);
    
    // 基于一致性分数调整预测
    const consistencyFactor = profile.consistencyScore / 100;
    const predictedTime = currentWeeklyTime * (1 + consistencyFactor * 0.2);

    return {
      metric: '周学习时长',
      currentValue: currentWeeklyTime,
      predictedValue: Math.round(predictedTime),
      confidence: consistencyFactor,
      timeframe: '1_week',
      factors: ['基于历史学习规律', '考虑一致性表现']
    };
  }

  /**
   * 生成行为建议
   */
  private static generateBehaviorRecommendations(profile: UserProfile, patterns: LearningPattern[]): string[] {
    const recommendations: string[] = [];

    // 基于学习风格的建议
    switch (profile.learningStyle) {
      case 'visual':
        recommendations.push('增加图表、图像和可视化内容的学习任务');
        break;
      case 'kinesthetic':
        recommendations.push('多安排动手实践和体验式学习活动');
        break;
      case 'auditory':
        recommendations.push('可以尝试音频材料和讨论型学习');
        break;
      case 'mixed':
        recommendations.push('保持学习方式的多样性，继续探索不同类型的任务');
        break;
    }

    // 基于动机类型的建议
    switch (profile.motivationType) {
      case 'achievement':
        recommendations.push('设定明确的目标和里程碑，及时庆祝成就');
        break;
      case 'mastery':
        recommendations.push('提供进阶难度的挑战，注重技能的深度发展');
        break;
      case 'autonomy':
        recommendations.push('给予更多选择权，让学习者自主安排学习计划');
        break;
      case 'social':
        recommendations.push('考虑增加社交元素，如分享成果或小组活动');
        break;
    }

    // 基于学习模式的建议
    patterns.forEach(pattern => {
      if (pattern.impact === 'high') {
        recommendations.push(pattern.recommendation);
      }
    });

    // 基于一致性的建议
    if (profile.consistencyScore < 50) {
      recommendations.push('建议制定固定的学习时间，培养学习习惯');
    } else if (profile.consistencyScore > 80) {
      recommendations.push('学习习惯很好，可以考虑增加学习内容的深度');
    }

    return recommendations.slice(0, 6); // 返回最多6条建议
  }

  /**
   * 分析难度进阶趋势
   */
  private static analyzeDifficultyProgression(sessions: LearningSession[]): number {
    if (sessions.length < 5) return 0;

    const difficultyScores: Record<string, number> = {
      'easy': 1,
      'medium': 2,
      'hard': 3
    };

    const recentSessions = sessions.slice(-10);
    const firstHalf = recentSessions.slice(0, 5);
    const secondHalf = recentSessions.slice(5);

    const avgFirst = firstHalf.reduce((sum, s) => sum + (difficultyScores[s.difficulty] || 2), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, s) => sum + (difficultyScores[s.difficulty] || 2), 0) / secondHalf.length;

    return (avgSecond - avgFirst) / 2; // 归一化到 -1 到 1
  }

  /**
   * 计算会话一致性
   */
  private static calculateSessionConsistency(sessions: LearningSession[]): number {
    if (sessions.length < 7) return 0.5;

    const dates = sessions.map(s => s.startTime.toDateString());
    const uniqueDates = new Set(dates);
    
    return Math.min(uniqueDates.size / 7, 1);
  }

  /**
   * 生成默认分析结果（数据不足时）
   */
  private static generateDefaultAnalysis(userId: string): BehaviorAnalysisResult {
    return {
      userProfile: {
        userId,
        learningStyle: 'mixed',
        motivationType: 'achievement',
        optimalStudyTime: 14,
        averageSessionLength: 25,
        consistencyScore: 50,
        adaptabilityScore: 50,
        challengePreference: 50
      },
      learningPatterns: [],
      predictions: [],
      recommendations: [
        '建议坚持每日学习，建立良好的学习习惯',
        '尝试不同类型的任务，发现自己的学习偏好',
        '记录学习心得，帮助系统更好地了解您的需求'
      ]
    };
  }

  /**
   * 从历史任务生成用户行为数据
   */
  static generateUserBehaviorFromHistory(
    user: User,
    completedTasks: Task[],
    sessions: LearningSession[]
  ): UserBehaviorData {
    const analysisResult = this.analyzeUserBehavior(sessions);
    
    return {
      userId: user.id,
      completedTasks,
      preferredCategories: this.extractPreferredCategories(completedTasks),
      averageSessionDuration: analysisResult.userProfile.averageSessionLength,
      timeOfDayPreference: analysisResult.userProfile.optimalStudyTime,
      difficultyPreference: this.inferDifficultyPreference(completedTasks),
      learningStyle: analysisResult.userProfile.learningStyle,
      streakDays: this.calculateStreakDays(sessions),
      totalPoints: completedTasks.reduce((sum, task) => sum + task.points, 0),
      lastActiveDate: sessions.length > 0 ? sessions[sessions.length - 1].endTime : new Date(),
      engagementScore: Math.min(analysisResult.userProfile.consistencyScore + 
        analysisResult.userProfile.adaptabilityScore / 2, 100)
    };
  }

  private static extractPreferredCategories(completedTasks: Task[]): string[] {
    const categoryCount: Record<string, number> = {};
    completedTasks.forEach(task => {
      categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
    });

    return Object.keys(categoryCount)
      .sort((a, b) => categoryCount[b] - categoryCount[a])
      .slice(0, 3);
  }

  private static inferDifficultyPreference(completedTasks: Task[]): 'easy' | 'medium' | 'hard' {
    const difficultyCount: Record<string, number> = {};
    completedTasks.forEach(task => {
      difficultyCount[task.difficulty] = (difficultyCount[task.difficulty] || 0) + 1;
    });

    const mostFrequent = Object.keys(difficultyCount)
      .sort((a, b) => difficultyCount[b] - difficultyCount[a])[0];

    return (mostFrequent as 'easy' | 'medium' | 'hard') || 'medium';
  }

  private static calculateStreakDays(sessions: LearningSession[]): number {
    if (sessions.length === 0) return 0;

    const completedSessions = sessions.filter(s => s.completed);
    const dates = completedSessions.map(s => s.startTime.toDateString());
    const uniqueDates = [...new Set(dates)].sort();

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const sessionDate = new Date(uniqueDates[i]);
      const dayDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
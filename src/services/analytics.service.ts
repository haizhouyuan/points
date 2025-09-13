/**
 * 学习分析服务
 * 提供深度学习数据分析、模式识别和个性化洞察
 * 
 * 核心设计原理：
 * 1. 多维度数据分析（时间、类别、技能、行为）
 * 2. 学习模式识别和预测
 * 3. 个性化学习路径推荐
 * 4. 实时学习效率分析
 */

export interface LearningSession {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  category: string;
  taskId: string;
  taskTitle: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pointsEarned: number;
  xpEarned: number;
  completionRate: number; // 0-100
  focusScore: number; // 0-100 专注度评分
  errorRate: number; // 0-100 错误率
  hintsUsed: number;
  timeSpentThinking: number; // 思考时间（秒）
  timeSpentActive: number; // 活跃时间（秒）
  mood: 'frustrated' | 'neutral' | 'confident' | 'excited';
  energyLevel: 'low' | 'medium' | 'high';
}

export interface LearningPattern {
  id: string;
  userId: string;
  patternType: 'peak_performance' | 'learning_preference' | 'difficulty_curve' | 'motivation_trigger';
  description: string;
  confidence: number; // 0-100
  dataPoints: number;
  detectedAt: string;
  implications: string[];
  recommendations: string[];
}

export interface SkillProgression {
  skillId: string;
  skillName: string;
  category: string;
  currentLevel: number;
  totalXP: number;
  weeklyXP: number;
  monthlyXP: number;
  averageSessionScore: number;
  improvementRate: number; // 周对周提升率
  masteryProgress: number; // 0-100
  predictedMasteryDate: string;
  strugglingAreas: string[];
  strongAreas: string[];
  recommendedNextSteps: string[];
}

export interface LearningInsight {
  id: string;
  type: 'strength' | 'improvement' | 'pattern' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  actions?: string[];
  relatedSkills?: string[];
  confidence: number;
  generatedAt: string;
}

export interface PerformanceMetrics {
  overall: {
    averageScore: number;
    consistencyIndex: number; // 一致性指数 0-100
    improvementTrend: 'declining' | 'stable' | 'improving';
    peakPerformanceTime: string; // 最佳表现时间段
    optimalSessionLength: number; // 最佳学习时长（分钟）
  };
  weekly: {
    totalSessions: number;
    totalMinutes: number;
    averageScore: number;
    categoryCoverage: number; // 类别覆盖度
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
  monthly: {
    skillsImproved: number;
    milestonesBeat: number;
    consistencyDays: number;
    totalGrowthPoints: number;
  };
}

export class AnalyticsService {
  private static learningSessionsCache: LearningSession[] = [];
  private static patternsCache: LearningPattern[] = [];
  
  /**
   * 记录学习会话数据
   */
  static recordLearningSession(session: LearningSession): void {
    // 验证数据完整性
    if (!session.id || !session.userId || !session.startTime) {
      console.error('Invalid learning session data');
      return;
    }
    
    this.learningSessionsCache.push(session);
    
    // 限制缓存大小（保留最近1000条记录）
    if (this.learningSessionsCache.length > 1000) {
      this.learningSessionsCache = this.learningSessionsCache.slice(-1000);
    }
    
    // 检测新模式
    this.detectLearningPatterns(session.userId);
  }
  
  /**
   * 获取学习会话数据
   */
  static getLearningHistory(userId: string, days: number = 30): LearningSession[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.learningSessionsCache
      .filter(session => 
        session.userId === userId && 
        new Date(session.startTime) >= cutoffDate
      )
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }
  
  /**
   * 分析学习表现指标
   */
  static analyzePerformanceMetrics(userId: string): PerformanceMetrics {
    const recentSessions = this.getLearningHistory(userId, 30);
    const weeklySessions = this.getLearningHistory(userId, 7);
    
    if (recentSessions.length === 0) {
      return this.getDefaultMetrics();
    }
    
    // 计算整体指标
    const averageScore = recentSessions.reduce((sum, s) => sum + s.completionRate, 0) / recentSessions.length;
    const consistencyIndex = this.calculateConsistencyIndex(recentSessions);
    const improvementTrend = this.calculateImprovementTrend(recentSessions);
    const peakPerformanceTime = this.findPeakPerformanceTime(recentSessions);
    const optimalSessionLength = this.findOptimalSessionLength(recentSessions);
    
    // 计算周度指标
    const weeklyTotalSessions = weeklySessions.length;
    const weeklyTotalMinutes = weeklySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const weeklyAverageScore = weeklySessions.length > 0 ? 
      weeklySessions.reduce((sum, s) => sum + s.completionRate, 0) / weeklySessions.length : 0;
    
    const weeklyCategories = new Set(weeklySessions.map(s => s.category));
    const categoryCoverage = (weeklyCategories.size / 5) * 100; // 假设总共5个主要类别
    
    const difficultyDistribution = this.calculateDifficultyDistribution(weeklySessions);
    
    // 计算月度指标
    const monthlySessions = this.getLearningHistory(userId, 30);
    const skillsImproved = this.calculateSkillsImproved(monthlySessions);
    const milestonesBeat = this.calculateMilestonesBeat(monthlySessions);
    const consistencyDays = this.calculateConsistencyDays(monthlySessions);
    const totalGrowthPoints = monthlySessions.reduce((sum, s) => sum + s.xpEarned, 0);
    
    return {
      overall: {
        averageScore: Math.round(averageScore),
        consistencyIndex: Math.round(consistencyIndex),
        improvementTrend,
        peakPerformanceTime,
        optimalSessionLength: Math.round(optimalSessionLength)
      },
      weekly: {
        totalSessions: weeklyTotalSessions,
        totalMinutes: weeklyTotalMinutes,
        averageScore: Math.round(weeklyAverageScore),
        categoryCoverage: Math.round(categoryCoverage),
        difficultyDistribution
      },
      monthly: {
        skillsImproved,
        milestonesBeat,
        consistencyDays,
        totalGrowthPoints
      }
    };
  }
  
  /**
   * 生成技能进度分析
   */
  static analyzeSkillProgression(userId: string): SkillProgression[] {
    const sessions = this.getLearningHistory(userId, 60); // 最近60天
    const skillGroups = this.groupSessionsBySkill(sessions);
    
    return Object.entries(skillGroups).map(([skillName, skillSessions]) => {
      const totalXP = skillSessions.reduce((sum, s) => sum + s.xpEarned, 0);
      const weeklyXP = this.calculateWeeklyXP(skillSessions);
      const monthlyXP = this.calculateMonthlyXP(skillSessions);
      const averageScore = skillSessions.reduce((sum, s) => sum + s.completionRate, 0) / skillSessions.length;
      const improvementRate = this.calculateImprovementRate(skillSessions);
      const masteryProgress = Math.min((totalXP / 1000) * 100, 100); // 假设1000 XP为掌握
      
      return {
        skillId: skillName.toLowerCase().replace(/\s+/g, '_'),
        skillName,
        category: skillSessions[0]?.category || 'unknown',
        currentLevel: Math.floor(totalXP / 100) + 1,
        totalXP,
        weeklyXP,
        monthlyXP,
        averageSessionScore: Math.round(averageScore),
        improvementRate: Math.round(improvementRate),
        masteryProgress: Math.round(masteryProgress),
        predictedMasteryDate: this.predictMasteryDate(totalXP, improvementRate),
        strugglingAreas: this.identifyStrugglingAreas(skillSessions),
        strongAreas: this.identifyStrongAreas(skillSessions),
        recommendedNextSteps: this.generateNextSteps(skillName, masteryProgress, improvementRate)
      };
    });
  }
  
  /**
   * 生成个性化学习洞察
   */
  static generateLearningInsights(userId: string): LearningInsight[] {
    const sessions = this.getLearningHistory(userId, 30);
    const patterns = this.getDetectedPatterns(userId);
    const skills = this.analyzeSkillProgression(userId);
    const metrics = this.analyzePerformanceMetrics(userId);
    
    const insights: LearningInsight[] = [];
    
    // 基于表现指标的洞察
    if (metrics.overall.averageScore >= 85) {
      insights.push({
        id: `insight_high_performance_${Date.now()}`,
        type: 'strength',
        title: '学习表现优秀',
        description: `你的平均完成率达到了${metrics.overall.averageScore}%，表现非常出色！`,
        impact: 'high',
        actionable: true,
        actions: ['尝试挑战更高难度的任务', '分享学习经验给其他家庭成员'],
        confidence: 90,
        generatedAt: new Date().toISOString()
      });
    }
    
    // 基于一致性的洞察
    if (metrics.overall.consistencyIndex < 60) {
      insights.push({
        id: `insight_consistency_${Date.now()}`,
        type: 'improvement',
        title: '学习一致性有待提升',
        description: '你的学习表现波动较大，建议保持更稳定的学习节奏。',
        impact: 'medium',
        actionable: true,
        actions: [
          '设定固定的学习时间',
          '从较简单的任务开始建立信心',
          '使用番茄钟技术保持专注'
        ],
        confidence: 75,
        generatedAt: new Date().toISOString()
      });
    }
    
    // 基于技能进度的洞察
    const strugglingSkills = skills.filter(s => s.improvementRate < 0);
    if (strugglingSkills.length > 0) {
      insights.push({
        id: `insight_struggling_skills_${Date.now()}`,
        type: 'improvement',
        title: '部分技能需要重点关注',
        description: `${strugglingSkills.map(s => s.skillName).join('、')}的进步速度有所放缓。`,
        impact: 'high',
        actionable: true,
        actions: [
          '回顾基础知识点',
          '寻求帮助或额外指导',
          '调整学习方法',
          '适当降低难度重新建立信心'
        ],
        relatedSkills: strugglingSkills.map(s => s.skillId),
        confidence: 85,
        generatedAt: new Date().toISOString()
      });
    }
    
    // 基于学习模式的洞察
    const peakTimePattern = patterns.find(p => p.patternType === 'peak_performance');
    if (peakTimePattern) {
      insights.push({
        id: `insight_peak_time_${Date.now()}`,
        type: 'pattern',
        title: '发现你的黄金学习时段',
        description: peakTimePattern.description,
        impact: 'medium',
        actionable: true,
        actions: ['在这个时段安排重要或困难的学习任务'],
        confidence: peakTimePattern.confidence,
        generatedAt: new Date().toISOString()
      });
    }
    
    // 预测性洞察
    if (metrics.overall.improvementTrend === 'improving') {
      insights.push({
        id: `insight_prediction_${Date.now()}`,
        type: 'prediction',
        title: '持续进步，前景看好',
        description: '基于最近的学习趋势，预计你将在未来2-3周内实现显著提升。',
        impact: 'high',
        actionable: true,
        actions: ['保持当前的学习节奏', '考虑挑战新的技能领域'],
        confidence: 70,
        generatedAt: new Date().toISOString()
      });
    }
    
    return insights.sort((a, b) => {
      // 按影响程度和置信度排序
      const impactWeight = { high: 3, medium: 2, low: 1 };
      const scoreA = impactWeight[a.impact] * (a.confidence / 100);
      const scoreB = impactWeight[b.impact] * (b.confidence / 100);
      return scoreB - scoreA;
    });
  }
  
  /**
   * 检测学习模式
   */
  private static detectLearningPatterns(userId: string): void {
    const sessions = this.getLearningHistory(userId, 14); // 最近2周数据
    
    if (sessions.length < 10) return; // 数据不足
    
    // 检测黄金时段模式
    const hourlyPerformance = this.analyzeHourlyPerformance(sessions);
    const peakHour = this.findPeakPerformanceHour(hourlyPerformance);
    
    if (peakHour.confidence > 70) {
      const pattern: LearningPattern = {
        id: `pattern_peak_${userId}_${Date.now()}`,
        userId,
        patternType: 'peak_performance',
        description: `你在${peakHour.hour}:00-${peakHour.hour + 1}:00时段学习效果最好，平均完成率达到${peakHour.avgScore}%`,
        confidence: peakHour.confidence,
        dataPoints: peakHour.sessionCount,
        detectedAt: new Date().toISOString(),
        implications: [
          '在黄金时段学习可以提高效率',
          '重要或困难的任务安排在此时段完成',
          '其他时段可以安排复习或轻松的任务'
        ],
        recommendations: [
          `将${peakHour.hour}:00-${peakHour.hour + 1}:00设为主要学习时间`,
          '在此时段挑战最难的任务',
          '保持这个时间段的学习习惯'
        ]
      };
      
      this.addPattern(pattern);
    }
    
    // 检测学习偏好模式
    const categoryPreference = this.analyzeCategoryPreference(sessions);
    if (categoryPreference.confidence > 60) {
      const pattern: LearningPattern = {
        id: `pattern_preference_${userId}_${Date.now()}`,
        userId,
        patternType: 'learning_preference',
        description: `你对${categoryPreference.preferredCategory}类型的任务表现最佳，完成率比其他类别高${categoryPreference.advantagePercent}%`,
        confidence: categoryPreference.confidence,
        dataPoints: categoryPreference.totalSessions,
        detectedAt: new Date().toISOString(),
        implications: [
          '发挥优势类别的学习效果',
          '可以通过优势项目建立学习信心',
          '其他类别可能需要更多练习'
        ],
        recommendations: [
          `优先完成${categoryPreference.preferredCategory}类任务建立信心`,
          '将困难的其他类别任务与优势类别搭配',
          '逐步提高薄弱类别的练习时间'
        ]
      };
      
      this.addPattern(pattern);
    }
  }
  
  /**
   * 添加学习模式到缓存
   */
  private static addPattern(pattern: LearningPattern): void {
    // 检查是否已存在类似模式
    const existingPattern = this.patternsCache.find(p => 
      p.userId === pattern.userId && 
      p.patternType === pattern.patternType
    );
    
    if (existingPattern) {
      // 更新现有模式
      Object.assign(existingPattern, pattern);
    } else {
      this.patternsCache.push(pattern);
    }
    
    // 限制缓存大小
    if (this.patternsCache.length > 100) {
      this.patternsCache = this.patternsCache.slice(-100);
    }
  }
  
  /**
   * 获取检测到的学习模式
   */
  private static getDetectedPatterns(userId: string): LearningPattern[] {
    return this.patternsCache.filter(p => p.userId === userId);
  }
  
  // 辅助方法
  private static getDefaultMetrics(): PerformanceMetrics {
    return {
      overall: {
        averageScore: 0,
        consistencyIndex: 0,
        improvementTrend: 'stable',
        peakPerformanceTime: '09:00',
        optimalSessionLength: 30
      },
      weekly: {
        totalSessions: 0,
        totalMinutes: 0,
        averageScore: 0,
        categoryCoverage: 0,
        difficultyDistribution: { easy: 0, medium: 0, hard: 0 }
      },
      monthly: {
        skillsImproved: 0,
        milestonesBeat: 0,
        consistencyDays: 0,
        totalGrowthPoints: 0
      }
    };
  }
  
  private static calculateConsistencyIndex(sessions: LearningSession[]): number {
    if (sessions.length < 2) return 0;
    
    const scores = sessions.map(s => s.completionRate);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // 防护：如果均值为0或接近0，返回0
    if (mean <= 0.001) return 0;
    
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // 一致性指数：标准差越小，一致性越高
    const consistencyValue = 100 - (standardDeviation / mean) * 100;
    return Math.max(0, Math.min(100, consistencyValue));
  }
  
  private static calculateImprovementTrend(sessions: LearningSession[]): 'declining' | 'stable' | 'improving' {
    if (sessions.length < 6) return 'stable';
    
    const recent = sessions.slice(0, Math.floor(sessions.length / 2));
    const earlier = sessions.slice(Math.floor(sessions.length / 2));
    
    const recentAvg = recent.reduce((sum, s) => sum + s.completionRate, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, s) => sum + s.completionRate, 0) / earlier.length;
    
    // 防护：如果早期平均值为0或接近0，返回稳定
    if (earlierAvg <= 0.001) {
      return recentAvg > 10 ? 'improving' : 'stable';
    }
    
    const improvementPercent = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    // 确保结果是有限数值
    if (!isFinite(improvementPercent)) return 'stable';
    
    if (improvementPercent > 5) return 'improving';
    if (improvementPercent < -5) return 'declining';
    return 'stable';
  }
  
  private static findPeakPerformanceTime(sessions: LearningSession[]): string {
    const hourlyStats = new Map<number, { total: number; count: number }>();
    
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      const current = hourlyStats.get(hour) || { total: 0, count: 0 };
      hourlyStats.set(hour, {
        total: current.total + session.completionRate,
        count: current.count + 1
      });
    });
    
    let bestHour = 9;
    let bestAverage = 0;
    
    for (const [hour, stats] of hourlyStats.entries()) {
      if (stats.count >= 2) { // 至少2次会话
        const average = stats.total / stats.count;
        if (average > bestAverage) {
          bestAverage = average;
          bestHour = hour;
        }
      }
    }
    
    return `${bestHour.toString().padStart(2, '0')}:00`;
  }
  
  private static findOptimalSessionLength(sessions: LearningSession[]): number {
    const lengthGroups = new Map<string, { total: number; count: number }>();
    
    sessions.forEach(session => {
      const lengthCategory = session.durationMinutes < 20 ? 'short' :
                            session.durationMinutes < 45 ? 'medium' : 'long';
      const current = lengthGroups.get(lengthCategory) || { total: 0, count: 0 };
      lengthGroups.set(lengthCategory, {
        total: current.total + session.completionRate,
        count: current.count + 1
      });
    });
    
    let bestLength = 30;
    let bestAverage = 0;
    
    for (const [category, stats] of lengthGroups.entries()) {
      const average = stats.total / stats.count;
      if (average > bestAverage) {
        bestAverage = average;
        bestLength = category === 'short' ? 20 : category === 'medium' ? 35 : 50;
      }
    }
    
    return bestLength;
  }
  
  private static calculateDifficultyDistribution(sessions: LearningSession[]): { easy: number; medium: number; hard: number } {
    const total = sessions.length;
    if (total === 0) return { easy: 0, medium: 0, hard: 0 };
    
    const easy = sessions.filter(s => s.difficulty === 'easy').length;
    const medium = sessions.filter(s => s.difficulty === 'medium').length;
    const hard = sessions.filter(s => s.difficulty === 'hard').length;
    
    return {
      easy: Math.round((easy / total) * 100),
      medium: Math.round((medium / total) * 100),
      hard: Math.round((hard / total) * 100)
    };
  }
  
  private static calculateSkillsImproved(sessions: LearningSession[]): number {
    const skillGroups = this.groupSessionsBySkill(sessions);
    let improvedCount = 0;
    
    for (const skillSessions of Object.values(skillGroups)) {
      const improvementRate = this.calculateImprovementRate(skillSessions);
      if (improvementRate > 0) improvedCount++;
    }
    
    return improvedCount;
  }
  
  private static calculateMilestonesBeat(sessions: LearningSession[]): number {
    // 简化实现：基于高分会话数量
    return sessions.filter(s => s.completionRate >= 90).length;
  }
  
  private static calculateConsistencyDays(sessions: LearningSession[]): number {
    const uniqueDays = new Set();
    sessions.forEach(session => {
      const day = new Date(session.startTime).toDateString();
      uniqueDays.add(day);
    });
    return uniqueDays.size;
  }
  
  private static groupSessionsBySkill(sessions: LearningSession[]): Record<string, LearningSession[]> {
    return sessions.reduce((groups, session) => {
      const skill = session.taskTitle.split(' ')[0] || session.category; // 简化技能识别
      if (!groups[skill]) groups[skill] = [];
      groups[skill].push(session);
      return groups;
    }, {} as Record<string, LearningSession[]>);
  }
  
  private static calculateWeeklyXP(sessions: LearningSession[]): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return sessions
      .filter(s => new Date(s.startTime) >= oneWeekAgo)
      .reduce((sum, s) => sum + s.xpEarned, 0);
  }
  
  private static calculateMonthlyXP(sessions: LearningSession[]): number {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    
    return sessions
      .filter(s => new Date(s.startTime) >= oneMonthAgo)
      .reduce((sum, s) => sum + s.xpEarned, 0);
  }
  
  private static calculateImprovementRate(sessions: LearningSession[]): number {
    if (sessions.length < 4) return 0;
    
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    const firstHalf = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2));
    const secondHalf = sortedSessions.slice(Math.floor(sortedSessions.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.completionRate, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.completionRate, 0) / secondHalf.length;
    
    if (!isFinite(firstAvg) || firstAvg <= 0.001) return 0;
    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }
  
  private static predictMasteryDate(currentXP: number, improvementRate: number): string {
    const targetXP = 1000; // 假设掌握需要1000 XP
    const remainingXP = targetXP - currentXP;
    
    if (remainingXP <= 0) return new Date().toISOString().split('T')[0];
    if (improvementRate <= 0) return '未知';
    
    // 简化预测：基于当前改进速度
    const weeksToMastery = Math.ceil(remainingXP / (currentXP * (improvementRate / 100) / 4)); // 假设每月4周
    const masteryDate = new Date();
    masteryDate.setDate(masteryDate.getDate() + weeksToMastery * 7);
    
    return masteryDate.toISOString().split('T')[0];
  }
  
  private static identifyStrugglingAreas(sessions: LearningSession[]): string[] {
    const areas: string[] = [];
    
    const avgErrorRate = sessions.reduce((sum, s) => sum + s.errorRate, 0) / sessions.length;
    if (avgErrorRate > 30) areas.push('准确性');
    
    const avgFocusScore = sessions.reduce((sum, s) => sum + s.focusScore, 0) / sessions.length;
    if (avgFocusScore < 70) areas.push('专注度');
    
    const frustrationSessions = sessions.filter(s => s.mood === 'frustrated').length;
    if (frustrationSessions / sessions.length > 0.3) areas.push('学习动机');
    
    return areas;
  }
  
  private static identifyStrongAreas(sessions: LearningSession[]): string[] {
    const areas: string[] = [];
    
    const avgCompletionRate = sessions.reduce((sum, s) => sum + s.completionRate, 0) / sessions.length;
    if (avgCompletionRate > 85) areas.push('任务完成');
    
    const avgFocusScore = sessions.reduce((sum, s) => sum + s.focusScore, 0) / sessions.length;
    if (avgFocusScore > 85) areas.push('专注能力');
    
    const confidentSessions = sessions.filter(s => s.mood === 'confident' || s.mood === 'excited').length;
    if (confidentSessions / sessions.length > 0.6) areas.push('学习态度');
    
    return areas;
  }
  
  private static generateNextSteps(skillName: string, masteryProgress: number, improvementRate: number): string[] {
    const steps: string[] = [];
    
    if (masteryProgress < 30) {
      steps.push(`继续巩固${skillName}基础知识`);
      steps.push('增加练习频率');
    } else if (masteryProgress < 70) {
      steps.push(`挑战${skillName}中等难度任务`);
      steps.push('尝试实际应用练习');
    } else {
      steps.push(`探索${skillName}高级概念`);
      steps.push('考虑教授或帮助他人');
    }
    
    if (improvementRate < 0) {
      steps.push('回顾近期学习方法');
      steps.push('寻求额外指导');
    }
    
    return steps;
  }
  
  private static analyzeHourlyPerformance(sessions: LearningSession[]): Map<number, { avgScore: number; sessionCount: number; confidence: number }> {
    const hourlyData = new Map<number, { total: number; count: number }>();
    
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      const current = hourlyData.get(hour) || { total: 0, count: 0 };
      hourlyData.set(hour, {
        total: current.total + session.completionRate,
        count: current.count + 1
      });
    });
    
    const result = new Map<number, { avgScore: number; sessionCount: number; confidence: number }>();
    const denom = sessions.length > 0 ? sessions.length : 1;
    for (const [hour, data] of hourlyData.entries()) {
      const avgScore = Math.round(data.total / Math.max(1, data.count));
      const confidence = Math.min((data.count / denom) * 100 * 2, 100); // 基于样本量的置信度
      
      result.set(hour, {
        avgScore,
        sessionCount: data.count,
        confidence: Math.round(confidence)
      });
    }
    
    return result;
  }
  
  private static findPeakPerformanceHour(hourlyData: Map<number, any>): { hour: number; avgScore: number; confidence: number; sessionCount: number } {
    let bestHour = { hour: 9, avgScore: 0, confidence: 0, sessionCount: 0 };
    
    for (const [hour, data] of hourlyData.entries()) {
      if (data.sessionCount >= 3 && data.avgScore > bestHour.avgScore) { // 至少3次会话
        bestHour = { hour, ...data };
      }
    }
    
    return bestHour;
  }
  
  private static analyzeCategoryPreference(sessions: LearningSession[]): { preferredCategory: string; advantagePercent: number; confidence: number; totalSessions: number } {
    const categoryData = new Map();
    
    sessions.forEach(session => {
      const category = session.category;
      const current = categoryData.get(category) || { total: 0, count: 0 };
      categoryData.set(category, {
        total: current.total + session.completionRate,
        count: current.count + 1
      });
    });
    
    let bestCategory = { category: '', avgScore: 0, count: 0 };
    let overallAvg = 0;
    let totalCount = 0;
    
    for (const [category, data] of categoryData.entries()) {
      const avgScore = data.total / data.count;
      overallAvg += data.total;
      totalCount += data.count;
      
      if (data.count >= 3 && avgScore > bestCategory.avgScore) { // 至少3次会话
        bestCategory = { category, avgScore, count: data.count };
      }
    }
    
    // 防护：totalCount为0或接近0时的处理
    let advantagePercent = 0;
    let confidence = 0;
    
    if (totalCount <= 0) {
      overallAvg = 0;
      advantagePercent = 0;
      confidence = 0;
    } else {
      overallAvg = overallAvg / totalCount;
      // 防护：如果整体平均值为0或接近0，返回0优势
      advantagePercent = overallAvg <= 0.001 ? 0 : 
        Math.round(((bestCategory.avgScore - overallAvg) / overallAvg) * 100);
      confidence = Math.min((bestCategory.count / totalCount) * 100, 100);
    }
    
    return {
      preferredCategory: bestCategory.category,
      advantagePercent: Math.max(0, advantagePercent),
      confidence: Math.round(confidence),
      totalSessions: totalCount
    };
  }
}

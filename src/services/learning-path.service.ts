/**
 * 高级学习路径规划系统
 * 基于AI算法的个性化学习路径生成和动态调整
 * 
 * 核心功能：
 * 1. 智能路径生成 - 基于用户能力、偏好、目标的个性化路径
 * 2. 自适应调整 - 根据学习进度和表现动态优化路径
 * 3. 多维度分析 - 考虑认知负荷、动机维持、技能依赖等因素
 * 4. 预测性优化 - 预测学习困难点并提前调整策略
 */

import { LearningSession, AnalyticsService } from './analytics.service';

// 学习路径节点
export interface LearningPathNode {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number; // 分钟
  prerequisiteNodes: string[]; // 前置节点ID
  skills: string[]; // 涉及技能
  cognitiveLoad: number; // 认知负荷 1-5
  motivationFactor: number; // 动机因子 1-5
  masteryThreshold: number; // 掌握阈值 (0-100)
  adaptiveWeight: number; // 自适应权重
  tags: string[];
  resources: LearningResource[];
  assessments: Assessment[];
}

// 学习资源
export interface LearningResource {
  id: string;
  type: 'video' | 'article' | 'interactive' | 'quiz' | 'game';
  title: string;
  url?: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  effectiveness: number; // 学习效果评分 1-5
}

// 评估测试
export interface Assessment {
  id: string;
  type: 'quiz' | 'practice' | 'project' | 'peer_review';
  questions: number;
  timeLimit: number; // 分钟
  passingScore: number; // 及格分数
  weight: number; // 在路径中的权重
}

// 学习路径
export interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTotalTime: number; // 总预计时间（小时）
  nodes: LearningPathNode[];
  currentNodeId: string | null;
  completedNodes: string[];
  progress: number; // 0-100
  adaptationHistory: PathAdaptation[];
  createdAt: string;
  lastModified: string;
  targetCompletionDate?: string;
  personalizedMetrics: PersonalizedMetrics;
}

// 路径适应记录
export interface PathAdaptation {
  id: string;
  timestamp: string;
  reason: string;
  changes: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  impact: 'minor' | 'moderate' | 'major';
  userPerformanceData: {
    accuracyRate: number;
    speedFactor: number;
    engagementLevel: number;
  };
}

// 个性化指标
export interface PersonalizedMetrics {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
  preferredDifficultyCurve: 'gradual' | 'steep' | 'varied';
  optimalSessionLength: number;
  motivationType: 'achievement' | 'social' | 'mastery' | 'autonomy';
  retentionRate: number;
  procrastinationTendency: number; // 1-5
  resilience: number; // 1-5 面对困难的坚持程度
}

// 路径生成配置
export interface PathGenerationConfig {
  targetSkills: string[];
  currentLevel: number;
  availableTimePerWeek: number; // 小时
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  learningGoal: 'mastery' | 'certification' | 'exploration' | 'project';
  timeConstraint?: string; // ISO date string
  excludeTopics?: string[];
  prioritizeTopics?: string[];
}

// 智能推荐结果
export interface SmartRecommendation {
  pathId: string;
  confidence: number; // 0-100 推荐置信度
  reasoning: string[];
  alternativePaths: string[];
  estimatedSuccessRate: number;
  adaptationPotential: number;
  personalizedBenefits: string[];
}

// 路径进度类型（供执行器与规划器使用）
export interface PathProgress {
  path: LearningPath;
  currentProgress: number;
  estimatedTimeRemaining: number;
  nextRecommendations: LearningPathNode[];
  adaptationSuggestions: string[];
}

export class LearningPathService {
  private static pathCache = new Map<string, LearningPath>();
  private static nodeLibrary: LearningPathNode[] = [];
  
  /**
   * 初始化节点库
   */
  static initializeNodeLibrary(): void {
    this.nodeLibrary = [
      // 数学基础路径
      {
        id: 'math_basic_1',
        title: '数字认知与基础运算',
        description: '建立数字概念，掌握加减法基础',
        category: '数学',
        difficulty: 'easy',
        estimatedDuration: 30,
        prerequisiteNodes: [],
        skills: ['数字识别', '基础加法', '基础减法'],
        cognitiveLoad: 2,
        motivationFactor: 4,
        masteryThreshold: 85,
        adaptiveWeight: 1.0,
        tags: ['基础', '数学', '认知'],
        resources: [
          {
            id: 'res_math_1',
            type: 'interactive',
            title: '数字探险游戏',
            duration: 15,
            difficulty: 'easy',
            effectiveness: 4
          }
        ],
        assessments: [
          {
            id: 'assess_math_1',
            type: 'quiz',
            questions: 10,
            timeLimit: 15,
            passingScore: 80,
            weight: 1.0
          }
        ]
      },
      {
        id: 'math_basic_2',
        title: '乘除法与应用',
        description: '掌握乘除法运算，解决实际问题',
        category: '数学',
        difficulty: 'medium',
        estimatedDuration: 45,
        prerequisiteNodes: ['math_basic_1'],
        skills: ['乘法表', '除法运算', '应用题'],
        cognitiveLoad: 3,
        motivationFactor: 3,
        masteryThreshold: 80,
        adaptiveWeight: 1.2,
        tags: ['运算', '应用', '实践'],
        resources: [
          {
            id: 'res_math_2',
            type: 'game',
            title: '乘法大冒险',
            duration: 20,
            difficulty: 'medium',
            effectiveness: 4
          }
        ],
        assessments: [
          {
            id: 'assess_math_2',
            type: 'practice',
            questions: 15,
            timeLimit: 25,
            passingScore: 75,
            weight: 1.0
          }
        ]
      },
      
      // 英语学习路径
      {
        id: 'eng_basic_1',
        title: '字母与音标基础',
        description: '掌握26个字母和基本音标',
        category: '英语',
        difficulty: 'easy',
        estimatedDuration: 25,
        prerequisiteNodes: [],
        skills: ['字母识别', '音标发音', '基础词汇'],
        cognitiveLoad: 2,
        motivationFactor: 4,
        masteryThreshold: 90,
        adaptiveWeight: 1.0,
        tags: ['基础', '发音', '字母'],
        resources: [
          {
            id: 'res_eng_1',
            type: 'video',
            title: 'ABC字母歌',
            duration: 10,
            difficulty: 'easy',
            effectiveness: 5
          }
        ],
        assessments: [
          {
            id: 'assess_eng_1',
            type: 'quiz',
            questions: 26,
            timeLimit: 20,
            passingScore: 85,
            weight: 1.0
          }
        ]
      },
      {
        id: 'eng_basic_2',
        title: '日常词汇与短语',
        description: '学习100个常用单词和基本短语',
        category: '英语',
        difficulty: 'medium',
        estimatedDuration: 40,
        prerequisiteNodes: ['eng_basic_1'],
        skills: ['词汇记忆', '短语应用', '基础对话'],
        cognitiveLoad: 3,
        motivationFactor: 4,
        masteryThreshold: 80,
        adaptiveWeight: 1.1,
        tags: ['词汇', '对话', '实用'],
        resources: [
          {
            id: 'res_eng_2',
            type: 'interactive',
            title: '词汇卡片游戏',
            duration: 20,
            difficulty: 'medium',
            effectiveness: 4
          }
        ],
        assessments: [
          {
            id: 'assess_eng_2',
            type: 'quiz',
            questions: 20,
            timeLimit: 30,
            passingScore: 75,
            weight: 1.0
          }
        ]
      },
      
      // 阅读理解路径
      {
        id: 'reading_1',
        title: '基础阅读理解',
        description: '理解简单文章，提取关键信息',
        category: '阅读',
        difficulty: 'easy',
        estimatedDuration: 35,
        prerequisiteNodes: [],
        skills: ['理解能力', '信息提取', '基础分析'],
        cognitiveLoad: 3,
        motivationFactor: 3,
        masteryThreshold: 75,
        adaptiveWeight: 1.0,
        tags: ['理解', '分析', '基础'],
        resources: [
          {
            id: 'res_reading_1',
            type: 'article',
            title: '趣味小故事集',
            duration: 25,
            difficulty: 'easy',
            effectiveness: 4
          }
        ],
        assessments: [
          {
            id: 'assess_reading_1',
            type: 'quiz',
            questions: 12,
            timeLimit: 20,
            passingScore: 70,
            weight: 1.0
          }
        ]
      }
    ];
  }
  
  /**
   * 生成个性化学习路径
   */
  static generateLearningPath(
    userId: string, 
    config: PathGenerationConfig
  ): SmartRecommendation {
    // 获取用户历史数据和能力分析
    const userHistory = AnalyticsService.getLearningHistory(userId, 60);
    const userMetrics = this.analyzeUserCapabilities(userHistory);
    const personalizedMetrics = this.buildPersonalizedMetrics(userHistory);
    
    // 基于目标技能筛选相关节点
    const relevantNodes = this.filterRelevantNodes(config.targetSkills, config.currentLevel);
    
    // 构建依赖图
    const dependencyGraph = this.buildDependencyGraph(relevantNodes);
    
    // 应用个性化算法
    const optimizedPath = this.optimizePathForUser(
      dependencyGraph, 
      userMetrics, 
      personalizedMetrics,
      config
    );
    
    // 生成路径对象
    const path: LearningPath = {
      id: `path_${userId}_${Date.now()}`,
      userId,
      title: this.generatePathTitle(config),
      description: this.generatePathDescription(config, optimizedPath),
      category: this.determinePrimaryCategory(config.targetSkills),
      difficulty: this.calculateOverallDifficulty(optimizedPath),
      estimatedTotalTime: this.calculateTotalTime(optimizedPath),
      nodes: optimizedPath,
      currentNodeId: optimizedPath[0]?.id || null,
      completedNodes: [],
      progress: 0,
      adaptationHistory: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      targetCompletionDate: config.timeConstraint,
      personalizedMetrics
    };
    
    // 缓存路径
    this.pathCache.set(path.id, path);
    
    // 计算推荐置信度
    const confidence = this.calculateRecommendationConfidence(path, userMetrics);
    
    return {
      pathId: path.id,
      confidence,
      reasoning: this.generateReasoningExplanation(path, userMetrics),
      alternativePaths: this.generateAlternativePaths(config, 2),
      estimatedSuccessRate: this.predictSuccessRate(path, userMetrics),
      adaptationPotential: this.calculateAdaptationPotential(path),
      personalizedBenefits: this.identifyPersonalizedBenefits(path, personalizedMetrics)
    };
  }
  
  /**
   * 分析用户学习能力
   */
  private static analyzeUserCapabilities(history: LearningSession[]) {
    if (history.length === 0) {
      return {
        averageAccuracy: 70,
        learningSpeed: 1.0,
        retentionRate: 0.7,
        consistency: 0.6,
        preferredDifficulty: 'medium' as const,
        strongCategories: [],
        weakCategories: []
      };
    }
    
    const averageAccuracy = history.reduce((sum, s) => sum + s.completionRate, 0) / history.length;
    const averageSpeed = history.reduce((sum, s) => sum + (60 / s.durationMinutes), 0) / history.length;
    
    // 分析各类别表现
    const categoryPerformance = new Map<string, number[]>();
    history.forEach(session => {
      if (!categoryPerformance.has(session.category)) {
        categoryPerformance.set(session.category, []);
      }
      categoryPerformance.get(session.category)!.push(session.completionRate);
    });
    
    const strongCategories = [];
    const weakCategories = [];
    
    for (const [category, scores] of categoryPerformance.entries()) {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore > 80) strongCategories.push(category);
      if (avgScore < 60) weakCategories.push(category);
    }
    
    return {
      averageAccuracy,
      learningSpeed: Math.max(0.5, Math.min(2.0, averageSpeed)),
      retentionRate: Math.max(0.4, Math.min(1.0, averageAccuracy / 100)),
      consistency: this.calculateConsistency(history),
      preferredDifficulty: averageAccuracy > 85 ? 'hard' as const : 
                          averageAccuracy > 70 ? 'medium' as const : 'easy' as const,
      strongCategories,
      weakCategories
    };
  }
  
  /**
   * 构建个性化指标
   */
  private static buildPersonalizedMetrics(history: LearningSession[]): PersonalizedMetrics {
    if (history.length === 0) {
      return {
        learningStyle: 'mixed',
        preferredDifficultyCurve: 'gradual',
        optimalSessionLength: 30,
        motivationType: 'achievement',
        retentionRate: 0.7,
        procrastinationTendency: 3,
        resilience: 3
      };
    }
    
    // 分析学习风格
    const resourceTypes = history.map(s => s.taskTitle.includes('视频') ? 'visual' : 
                                      s.taskTitle.includes('音频') ? 'auditory' : 'mixed');
    const learningStyle = this.getMostFrequent(resourceTypes) as PersonalizedMetrics['learningStyle'];
    
    // 分析最佳会话长度
    const sessionLengths = history.map(s => s.durationMinutes);
    const optimalSessionLength = sessionLengths.reduce((sum, len) => sum + len, 0) / sessionLengths.length;
    
    // 分析坚持度（基于困难任务的完成率）
    const hardTasks = history.filter(s => s.difficulty === 'hard');
    const resilience = hardTasks.length > 0 ? 
      Math.round((hardTasks.reduce((sum, s) => sum + s.completionRate, 0) / hardTasks.length) / 20) : 3;
    
    return {
      learningStyle,
      preferredDifficultyCurve: 'gradual',
      optimalSessionLength: Math.round(optimalSessionLength),
      motivationType: 'achievement',
      retentionRate: this.calculateRetentionRate(history),
      procrastinationTendency: 3,
      resilience: Math.max(1, Math.min(5, resilience))
    };
  }
  
  /**
   * 筛选相关节点
   */
  private static filterRelevantNodes(targetSkills: string[], currentLevel: number): LearningPathNode[] {
    return this.nodeLibrary.filter(node => {
      // 检查技能匹配
      const skillMatch = node.skills.some(skill => 
        targetSkills.some(target => skill.includes(target) || target.includes(skill))
      );
      // 类别兜底匹配（与 Planner 中文类别一致）
      const categoryMatch = targetSkills.includes(node.category);
      
      // 检查难度适合度
      const difficultyScore = { easy: 1, medium: 2, hard: 3 }[node.difficulty];
      const levelMatch = difficultyScore <= currentLevel + 1;
      
      return (skillMatch || categoryMatch) && levelMatch;
    });
  }
  
  /**
   * 构建依赖图
   */
  private static buildDependencyGraph(nodes: LearningPathNode[]): LearningPathNode[] {
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const visited = new Set<string>();
    const result: LearningPathNode[] = [];
    
    // 拓扑排序确保依赖顺序
    const topologicalSort = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = nodeMap.get(nodeId);
      if (!node) return;
      
      // 先处理前置节点
      node.prerequisiteNodes.forEach(prerequisite => {
        if (nodeMap.has(prerequisite)) {
          topologicalSort(prerequisite);
        }
      });
      
      result.push(node);
    };
    
    // 从没有前置条件的节点开始
    nodes.filter(node => node.prerequisiteNodes.length === 0)
         .forEach(node => topologicalSort(node.id));
    
    // 处理剩余节点
    nodes.forEach(node => topologicalSort(node.id));
    
    return result;
  }
  
  /**
   * 为用户优化路径
   */
  private static optimizePathForUser(
    basePath: LearningPathNode[],
    userCapabilities: any,
    personalizedMetrics: PersonalizedMetrics,
    config: PathGenerationConfig
  ): LearningPathNode[] {
    const optimizedPath = [...basePath];
    
    // 根据用户能力调整节点权重
    optimizedPath.forEach(node => {
      // 认知负荷调整
      if (personalizedMetrics.resilience < 3 && node.cognitiveLoad > 3) {
        node.adaptiveWeight *= 0.8; // 降低认知负荷高的节点权重
      }
      
      // 学习风格匹配调整
      const styleMatch = this.matchLearningStyle(node, personalizedMetrics.learningStyle);
      node.adaptiveWeight *= styleMatch;
      
      // 基于用户强/弱类别调整
      if (userCapabilities.strongCategories.includes(node.category)) {
        node.adaptiveWeight *= 1.2;
      } else if (userCapabilities.weakCategories.includes(node.category)) {
        node.adaptiveWeight *= 0.9;
      }
    });
    
    // 根据时间约束调整路径长度
    if (config.availableTimePerWeek && config.timeConstraint) {
      const maxTime = this.calculateMaxAvailableTime(config);
      if (this.calculateTotalTime(optimizedPath) > maxTime) {
        return this.trimPathToTimeLimit(optimizedPath, maxTime);
      }
    }
    
    return this.prioritizedTopologicalOrder(optimizedPath);
  }

  /**
   * 基于自适应权重的优先队列拓扑排序：保证依赖正确的同时尽量优先高权重节点
   */
  private static prioritizedTopologicalOrder(nodes: LearningPathNode[]): LearningPathNode[] {
    const idSet = new Set(nodes.map(n => n.id));
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    const nodeMap = new Map(nodes.map(n => [n.id, n] as const));

    nodes.forEach(n => {
      inDegree.set(n.id, 0);
      adj.set(n.id, []);
    });

    // 构建前置 -> 当前 的边
    nodes.forEach(n => {
      n.prerequisiteNodes.forEach(pre => {
        if (idSet.has(pre)) {
          inDegree.set(n.id, (inDegree.get(n.id) || 0) + 1);
          adj.get(pre)!.push(n.id);
        }
      });
    });

    // 候选集合（入度为0）
    const available: string[] = nodes.filter(n => (inDegree.get(n.id) || 0) === 0).map(n => n.id);
    const result: LearningPathNode[] = [];

    const pickMax = () => {
      if (available.length === 0) return null as string | null;
      let bestIdx = 0;
      let best = -Infinity;
      for (let i = 0; i < available.length; i++) {
        const s = nodeMap.get(available[i])!.adaptiveWeight;
        if (s > best) { best = s; bestIdx = i; }
      }
      const [chosen] = available.splice(bestIdx, 1);
      return chosen;
    };

    let chosen = pickMax();
    const guardMax = nodes.length * 3;
    let guard = 0;
    while (chosen && guard < guardMax) {
      result.push(nodeMap.get(chosen)!);
      (adj.get(chosen) || []).forEach(next => {
        inDegree.set(next, (inDegree.get(next) || 0) - 1);
        if ((inDegree.get(next) || 0) === 0) available.push(next);
      });
      chosen = pickMax();
      guard++;
    }

    if (result.length < nodes.length) {
      const picked = new Set(result.map(n => n.id));
      nodes.forEach(n => { if (!picked.has(n.id)) result.push(n); });
    }

    return result;
  }
  
  /**
   * 动态调整学习路径
   */
  static adaptLearningPath(
    pathId: string, 
    recentPerformance: LearningSession[]
  ): PathAdaptation | null {
    const path = this.pathCache.get(pathId);
    if (!path) return null;
    
    const performanceAnalysis = this.analyzeRecentPerformance(recentPerformance);
    const adaptationNeeded = this.assessAdaptationNeed(path, performanceAnalysis);
    
    if (!adaptationNeeded.needed) return null;
    
    const adaptation: PathAdaptation = {
      id: `adapt_${pathId}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      reason: adaptationNeeded.reason,
      changes: { added: [], removed: [], modified: [] },
      impact: adaptationNeeded.impact,
      userPerformanceData: {
        accuracyRate: performanceAnalysis.averageAccuracy,
        speedFactor: performanceAnalysis.speedFactor,
        engagementLevel: performanceAnalysis.engagementLevel
      }
    };
    
    // 执行适应性调整
    switch (adaptationNeeded.type) {
      case 'difficulty_down':
        this.adjustDifficultyDown(path, adaptation);
        break;
      case 'difficulty_up':
        this.adjustDifficultyUp(path, adaptation);
        break;
      case 'add_support':
        this.addSupportiveContent(path, adaptation);
        break;
      case 'skip_redundant':
        this.skipRedundantContent(path, adaptation);
        break;
    }
    
    path.adaptationHistory.push(adaptation);
    path.lastModified = new Date().toISOString();
    
    return adaptation;
  }
  
  /**
   * 获取路径进度和统计
   */
  static getPathProgress(pathId: string): PathProgress | null {
    const path = this.pathCache.get(pathId);
    if (!path) return null;
    
    const completedCount = path.completedNodes.length;
    const totalCount = path.nodes.length;
    const currentProgress = Math.round((completedCount / totalCount) * 100);
    
    const remainingNodes = path.nodes.filter(node => 
      !path.completedNodes.includes(node.id) && 
      node.id !== path.currentNodeId
    );
    
    const estimatedTimeRemaining = remainingNodes.reduce(
      (sum, node) => sum + node.estimatedDuration, 0
    );
    
    const nextRecommendations = this.getNextRecommendedNodes(path);
    const adaptationSuggestions = this.generateAdaptationSuggestions(path);
    
    return {
      path,
      currentProgress,
      estimatedTimeRemaining,
      nextRecommendations,
      adaptationSuggestions
    };
  }
  
  // 辅助方法
  private static calculateConsistency(history: LearningSession[]): number {
    if (history.length < 2) return 0.6;
    
    const scores = history.map(s => s.completionRate);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    if (mean <= 0.001 || !isFinite(mean)) return 0.6;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    return Math.max(0.1, Math.min(1.0, 1 - (standardDeviation / mean)));
  }
  
  private static getMostFrequent<T>(array: T[]): T {
    const frequency = new Map<T, number>();
    array.forEach(item => {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    });
    
    let maxCount = 0;
    let mostFrequent = array[0];
    
    for (const [item, count] of frequency.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    }
    
    return mostFrequent;
  }
  
  private static calculateRetentionRate(history: LearningSession[]): number {
    // 简化实现：基于重复任务的表现改进
    const categoryPerformance = new Map<string, number[]>();
    
    history.forEach(session => {
      if (!categoryPerformance.has(session.category)) {
        categoryPerformance.set(session.category, []);
      }
      categoryPerformance.get(session.category)!.push(session.completionRate);
    });
    
    let totalImprovement = 0;
    let categoryCount = 0;
    
    for (const scores of categoryPerformance.values()) {
      if (scores.length > 1) {
        const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
        const secondHalf = scores.slice(Math.floor(scores.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
        
        if (firstAvg > 0.001) {
          totalImprovement += (secondAvg - firstAvg) / firstAvg;
        }
        categoryCount++;
      }
    }
    
    const improvementRate = categoryCount > 0 ? totalImprovement / categoryCount : 0;
    return Math.max(0.4, Math.min(1.0, 0.7 + improvementRate * 0.3));
  }
  
  private static matchLearningStyle(
    node: LearningPathNode, 
    learningStyle: PersonalizedMetrics['learningStyle']
  ): number {
    // 基于学习风格匹配计算权重调整因子
    const styleMapping: Record<string, number> = {
      visual: node.resources.filter(r => r.type === 'video' || r.type === 'interactive').length > 0 ? 1.2 : 1.0,
      auditory: node.resources.filter(r => r.type === 'video').length > 0 ? 1.1 : 1.0,
      kinesthetic: node.resources.filter(r => r.type === 'game' || r.type === 'interactive').length > 0 ? 1.3 : 0.9,
      reading: node.resources.filter(r => r.type === 'article').length > 0 ? 1.1 : 1.0,
      mixed: 1.0
    };
    
    return styleMapping[learningStyle] || 1.0;
  }
  
  private static calculateMaxAvailableTime(config: PathGenerationConfig): number {
    if (!config.timeConstraint) return Infinity;
    
    const targetDate = new Date(config.timeConstraint);
    const now = new Date();
    const weeksAvailable = Math.floor((targetDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const nonNegativeWeeks = Math.max(0, weeksAvailable);
    return nonNegativeWeeks * config.availableTimePerWeek * 60; // 转换为分钟
  }
  
  private static trimPathToTimeLimit(path: LearningPathNode[], maxTime: number): LearningPathNode[] {
    let totalTime = 0;
    const trimmedPath: LearningPathNode[] = [];
    
    for (const node of path) {
      if (totalTime + node.estimatedDuration <= maxTime) {
        trimmedPath.push(node);
        totalTime += node.estimatedDuration;
      } else {
        break;
      }
    }
    
    return trimmedPath;
  }
  
  private static generatePathTitle(config: PathGenerationConfig): string {
    const primarySkill = config.targetSkills[0] || '综合能力';
    const goalMap = {
      mastery: '深度掌握',
      certification: '认证考试',
      exploration: '探索学习',
      project: '项目实践'
    };
    
    return `${primarySkill}${goalMap[config.learningGoal]}路径`;
  }
  
  private static generatePathDescription(config: PathGenerationConfig, path: LearningPathNode[]): string {
    return `基于您的学习偏好和目标定制的${config.targetSkills.join('、')}学习路径，` +
           `包含${path.length}个学习节点，预计用时${this.calculateTotalTime(path)}小时。` +
           `路径将根据您的学习进度进行智能调整。`;
  }
  
  private static determinePrimaryCategory(targetSkills: string[]): string {
    // 简化实现：返回第一个技能对应的类别
    if (targetSkills.some(skill => skill.includes('数学'))) return '数学';
    if (targetSkills.some(skill => skill.includes('英语'))) return '英语';
    if (targetSkills.some(skill => skill.includes('阅读'))) return '阅读';
    if (targetSkills.some(skill => skill.includes('科学'))) return '科学';
    return '综合';
  }
  
  private static calculateOverallDifficulty(path: LearningPathNode[]): 'beginner' | 'intermediate' | 'advanced' {
    if (path.length === 0) return 'beginner';
    
    const avgDifficulty = path.reduce((sum, node) => {
      return sum + ({ easy: 1, medium: 2, hard: 3 }[node.difficulty]);
    }, 0) / path.length;
    
    if (avgDifficulty <= 1.5) return 'beginner';
    if (avgDifficulty <= 2.5) return 'intermediate';
    return 'advanced';
  }
  
  private static calculateTotalTime(path: LearningPathNode[]): number {
    return Math.round(path.reduce((sum, node) => sum + node.estimatedDuration, 0) / 60 * 10) / 10;
  }
  
  private static calculateRecommendationConfidence(path: LearningPath, userMetrics: any): number {
    let confidence = 70; // 基础置信度
    
    // 基于用户历史数据的置信度调整
    if (userMetrics.averageAccuracy > 80) confidence += 10;
    if (userMetrics.consistency > 0.7) confidence += 10;
    if (path.nodes.length > 0) confidence += 5;
    
    return Math.min(95, confidence);
  }
  
  private static generateReasoningExplanation(path: LearningPath, userMetrics: any): string[] {
    const reasons = [];
    
    reasons.push(`基于您${userMetrics.averageAccuracy.toFixed(1)}%的平均完成率定制难度`);
    reasons.push(`考虑了您在${userMetrics.strongCategories.join('、')}方面的优势`);
    reasons.push(`路径包含${path.nodes.length}个渐进式学习节点`);
    
    if (userMetrics.weakCategories.length > 0) {
      reasons.push(`针对${userMetrics.weakCategories.join('、')}薄弱环节提供额外支持`);
    }
    
    return reasons;
  }
  
  private static generateAlternativePaths(config: PathGenerationConfig, count: number): string[] {
    // 简化实现：生成虚拟的替代路径ID
    return Array.from({ length: count }, (_, i) => `alt_path_${config.targetSkills[0]}_${i + 1}`);
  }
  
  private static predictSuccessRate(path: LearningPath, userMetrics: any): number {
    let baseRate = 70;
    
    // 基于用户能力调整
    if (userMetrics.averageAccuracy > 85) baseRate += 15;
    else if (userMetrics.averageAccuracy > 70) baseRate += 5;
    else baseRate -= 10;
    
    // 基于一致性调整
    if (userMetrics.consistency > 0.8) baseRate += 10;
    else if (userMetrics.consistency < 0.5) baseRate -= 15;
    
    // 基于路径复杂度调整
    const avgCognitiveLoad = path.nodes.reduce((sum, node) => sum + node.cognitiveLoad, 0) / path.nodes.length;
    if (avgCognitiveLoad > 4) baseRate -= 10;
    
    return Math.max(30, Math.min(95, baseRate));
  }
  
  private static calculateAdaptationPotential(path: LearningPath): number {
    // 基于节点多样性和资源丰富度计算适应潜力
    const resourceTypes = new Set();
    path.nodes.forEach(node => {
      node.resources.forEach(resource => resourceTypes.add(resource.type));
    });
    
    const diversityScore = Math.min(100, resourceTypes.size * 20);
    return diversityScore;
  }
  
  private static identifyPersonalizedBenefits(
    path: LearningPath, 
    metrics: PersonalizedMetrics
  ): string[] {
    const benefits = [];
    
    benefits.push(`匹配您的${metrics.learningStyle}学习风格`);
    benefits.push(`优化的${metrics.optimalSessionLength}分钟学习时段`);
    
    if (metrics.resilience >= 4) {
      benefits.push('包含挑战性内容以保持学习动力');
    } else {
      benefits.push('温和的难度递增曲线');
    }
    
    switch (metrics.motivationType) {
      case 'achievement':
        benefits.push('设置明确的成就里程碑');
        break;
      case 'social':
        benefits.push('包含协作学习机会');
        break;
      case 'mastery':
        benefits.push('深度学习内容确保真正掌握');
        break;
      case 'autonomy':
        benefits.push('灵活的学习进度控制');
        break;
    }
    
    return benefits;
  }
  
  // 性能分析和适应性调整相关方法
  private static analyzeRecentPerformance(sessions: LearningSession[]) {
    if (sessions.length === 0) {
      return {
        averageAccuracy: 70,
        speedFactor: 1.0,
        engagementLevel: 0.7,
        strugglingAreas: [],
        improvingAreas: []
      };
    }
    
    const averageAccuracy = sessions.reduce((sum, s) => sum + s.completionRate, 0) / sessions.length;
    const averageSpeed = sessions.reduce((sum, s) => sum + (60 / s.durationMinutes), 0) / sessions.length;
    const engagementLevel = sessions.filter(s => s.mood === 'confident' || s.mood === 'excited').length / sessions.length;
    
    return {
      averageAccuracy,
      speedFactor: Math.max(0.5, Math.min(2.0, averageSpeed)),
      engagementLevel,
      strugglingAreas: this.identifyStrugglingSessions(sessions),
      improvingAreas: this.identifyImprovingSessions(sessions)
    };
  }
  
  private static assessAdaptationNeed(path: LearningPath, performance: any): {
    needed: boolean;
    type?: string;
    reason: string;
    impact: 'minor' | 'moderate' | 'major';
  } {
    if (performance.averageAccuracy < 60) {
      return {
        needed: true,
        type: 'difficulty_down',
        reason: '学习表现低于预期，需要降低难度',
        impact: 'major'
      };
    }
    
    if (performance.averageAccuracy > 90 && performance.engagementLevel < 0.5) {
      return {
        needed: true,
        type: 'difficulty_up',
        reason: '掌握程度很高但缺乏挑战性',
        impact: 'moderate'
      };
    }
    
    if (performance.strugglingAreas.length > 2) {
      return {
        needed: true,
        type: 'add_support',
        reason: '在多个领域遇到困难，需要额外支持',
        impact: 'moderate'
      };
    }
    
    return {
      needed: false,
      reason: '当前路径表现良好，无需调整',
      impact: 'minor'
    };
  }
  
  private static identifyStrugglingSessions(sessions: LearningSession[]): string[] {
    return sessions
      .filter(s => s.completionRate < 60)
      .map(s => s.category)
      .filter((category, index, array) => array.indexOf(category) === index);
  }
  
  private static identifyImprovingSessions(sessions: LearningSession[]): string[] {
    return sessions
      .filter(s => s.completionRate > 85)
      .map(s => s.category)
      .filter((category, index, array) => array.indexOf(category) === index);
  }
  
  private static adjustDifficultyDown(path: LearningPath, adaptation: PathAdaptation): void {
    const currentNodeIndex = path.nodes.findIndex(node => node.id === path.currentNodeId);
    if (currentNodeIndex === -1) return;
    
    // 在当前节点后插入支持性内容
    const supportNode: LearningPathNode = {
      id: `support_${Date.now()}`,
      title: '基础强化练习',
      description: '针对当前困难点的额外练习',
      category: path.nodes[currentNodeIndex].category,
      difficulty: 'easy',
      estimatedDuration: 20,
      prerequisiteNodes: [path.currentNodeId!],
      skills: path.nodes[currentNodeIndex].skills,
      cognitiveLoad: 1,
      motivationFactor: 4,
      masteryThreshold: 80,
      adaptiveWeight: 1.0,
      tags: ['支持', '基础'],
      resources: [],
      assessments: []
    };
    
    path.nodes.splice(currentNodeIndex + 1, 0, supportNode);
    adaptation.changes.added.push(supportNode.id);
  }
  
  private static adjustDifficultyUp(path: LearningPath, adaptation: PathAdaptation): void {
    const remainingNodes = path.nodes.filter(node => !path.completedNodes.includes(node.id));
    
    // 找到简单的节点并提升难度或添加挑战
    remainingNodes.forEach(node => {
      if (node.difficulty === 'easy') {
        node.difficulty = 'medium';
        node.cognitiveLoad = Math.min(5, node.cognitiveLoad + 1);
        adaptation.changes.modified.push(node.id);
      }
    });
  }
  
  private static addSupportiveContent(path: LearningPath, adaptation: PathAdaptation): void {
    // 实现添加支持性内容的逻辑
    this.adjustDifficultyDown(path, adaptation);
  }
  
  private static skipRedundantContent(path: LearningPath, adaptation: PathAdaptation): void {
    const redundantNodes = path.nodes.filter(node => 
      !path.completedNodes.includes(node.id) && 
      node.difficulty === 'easy' &&
      path.completedNodes.some(completedId => {
        const completedNode = path.nodes.find(n => n.id === completedId);
        return completedNode && completedNode.category === node.category;
      })
    );
    
    redundantNodes.forEach(node => {
      const index = path.nodes.indexOf(node);
      if (index > -1) {
        path.nodes.splice(index, 1);
        adaptation.changes.removed.push(node.id);
      }
    });
  }
  
  private static getNextRecommendedNodes(path: LearningPath): LearningPathNode[] {
    const currentIndex = path.currentNodeId ? 
      path.nodes.findIndex(node => node.id === path.currentNodeId) : -1;
    
    return path.nodes.slice(currentIndex + 1, currentIndex + 4)
      .filter(node => !path.completedNodes.includes(node.id));
  }
  
  private static generateAdaptationSuggestions(path: LearningPath): string[] {
    const suggestions = [];
    
    if (path.adaptationHistory.length === 0) {
      suggestions.push('路径运行良好，继续按计划学习');
    } else {
      const recentAdaptation = path.adaptationHistory[path.adaptationHistory.length - 1];
      suggestions.push(`最近调整：${recentAdaptation.reason}`);
      
      if (recentAdaptation.impact === 'major') {
        suggestions.push('建议在继续之前确保当前内容完全掌握');
      }
    }
    
    const completionRate = path.completedNodes.length / path.nodes.length;
    if (completionRate > 0.8) {
      suggestions.push('即将完成路径，考虑规划下一阶段学习目标');
    }
    
    return suggestions;
  }
  
  /**
   * 初始化服务
   */
  static initialize(): void {
    this.initializeNodeLibrary();
  }
}

// 初始化服务
LearningPathService.initialize();

export default LearningPathService;

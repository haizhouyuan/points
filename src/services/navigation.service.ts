/**
 * 导航系统服务 - 基于CLAUDE.md用户体验流程设计
 * 实现智能页面跳转逻辑和用户旅程跟踪
 */

import { ActivityTracker } from './business-logic.service';

// 导航结构定义 - 基于CLAUDE.md框架
export const NAVIGATION_MAP = {
  // 核心页面枢纽
  hub: {
    key: 'overview',
    title: '🏠 家庭主页',
    role: 'Hub - 中心枢纽',
    description: '总览学习进度和成就展示',
    quickActions: ['今日任务', '查看奖励', '技能成长']
  },
  
  // 行动执行页面
  action: {
    key: 'planning',
    title: '📅 今日任务',
    role: 'Action - 行动页面',
    description: '规划和执行具体学习任务',
    triggers: ['学习计划', '任务执行', '进度跟踪'],
    nextSteps: ['habits', 'achievements']
  },
  
  // 习惯养成页面
  habit: {
    key: 'habits',
    title: '🔥 习惯打卡',
    role: 'Habit - 习惯页面',
    description: '培养长期学习习惯和连击维护',
    triggers: ['连击维护', '习惯培养', '一致性建立'],
    nextSteps: ['planning', 'rewards']
  },
  
  // 激励反馈页面
  reward: {
    key: 'rewards',
    title: '🎁 兑换奖励',
    role: 'Reward - 激励页面',
    description: '积分兑换和成就庆祝',
    triggers: ['积分消费', '即时满足', '成就感获得'],
    nextSteps: ['overview', 'achievements']
  },
  
  // 成长展示页面
  growth: {
    key: 'achievements',
    title: '🏅 成就收集',
    role: 'Growth - 成长页面',
    description: '长期进步和里程碑展示',
    triggers: ['成长反思', '里程碑庆祝', '长期动机'],
    nextSteps: ['skilltree', 'overview']
  },
  
  // 技能发展页面
  skill: {
    key: 'skilltree',
    title: '🌟 技能成长',
    role: 'Skill - 技能页面', 
    description: '能力发展和学习路径规划',
    triggers: ['技能规划', '能力发展', '学习路径'],
    nextSteps: ['planning', 'overview']
  }
} as const;

export type NavigationKey = keyof typeof NAVIGATION_MAP;
export type TabKey = typeof NAVIGATION_MAP[NavigationKey]['key'];

// 用户状态类型
export interface UserNavigationState {
  currentTab: TabKey;
  previousTab: TabKey | null;
  sessionStart: string;
  pageViews: Array<{
    tab: TabKey;
    timestamp: string;
    duration?: number;
    interactions: number;
  }>;
  goals: Array<{
    type: 'quick_win' | 'habit_building' | 'skill_development';
    target: TabKey;
    description: string;
    completed: boolean;
  }>;
}

// 导航动机类型
export interface NavigationMotivation {
  from: TabKey;
  to: TabKey;
  trigger: 'user_intent' | 'system_guide' | 'task_complete' | 'achievement_unlock';
  context: string;
  expectedOutcome: string;
}

/**
 * 核心导航服务类
 * 基于心理学原理实现智能页面引导
 */
export class NavigationService {
  private static instance: NavigationService;
  private navigationState: UserNavigationState;
  
  private constructor() {
    this.navigationState = {
      currentTab: 'overview',
      previousTab: null,
      sessionStart: new Date().toISOString(),
      pageViews: [],
      goals: []
    };
    
    // 从本地存储恢复导航状态
    this.loadNavigationState();
  }
  
  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }
  
  /**
   * 核心导航方法 - 智能页面跳转
   */
  navigateTo(targetTab: TabKey, motivation?: NavigationMotivation): {
    success: boolean;
    recommended: boolean;
    guidance?: string;
    alternatives?: TabKey[];
  } {
    const currentTime = new Date().toISOString();
    const previousTab = this.navigationState.currentTab;
    
    // 记录页面访问时长
    this.updatePageViewDuration(previousTab, currentTime);
    
    // 验证导航合理性
    const navigationAnalysis = this.analyzeNavigation(previousTab, targetTab, motivation);
    
    // 更新导航状态
    this.navigationState.previousTab = previousTab;
    this.navigationState.currentTab = targetTab;
    
    // 记录新页面访问
    this.navigationState.pageViews.push({
      tab: targetTab,
      timestamp: currentTime,
      interactions: 0
    });
    
    // 用户行为追踪
    ActivityTracker.track({
      type: 'page_visit',
      data: {
        from: previousTab,
        to: targetTab,
        trigger: motivation?.trigger || 'user_intent',
        context: motivation?.context || 'direct_navigation',
        recommended: navigationAnalysis.recommended,
        guidance: navigationAnalysis.guidance
      }
    });
    
    // 保存导航状态
    this.saveNavigationState();
    
    return navigationAnalysis;
  }
  
  /**
   * 智能页面推荐 - 基于用户状态和学习心理学
   */
  getRecommendedNextPage(currentTab: TabKey, userContext?: {
    pointsEarned?: number;
    tasksCompleted?: number;
    streakBroken?: boolean;
    achievementUnlocked?: boolean;
    timeSpent?: number;
  }): {
    recommended: TabKey;
    reason: string;
    confidence: number;
    alternatives: TabKey[];
  } {
    const currentPageInfo = Object.values(NAVIGATION_MAP).find(page => page.key === currentTab);
    
    if (!currentPageInfo) {
      return {
        recommended: 'overview',
        reason: '回到主页查看整体进度',
        confidence: 0.8,
        alternatives: ['planning', 'habits']
      };
    }
    
    // 基于页面特性的推荐逻辑
    const recommendations = this.calculateNavigationRecommendations(currentTab, userContext);
    
    return recommendations;
  }
  
  /**
   * 用户流程优化建议
   */
  getUserFlowInsights(): {
    patterns: Array<{
      sequence: TabKey[];
      frequency: number;
      efficiency: number;
    }>;
    suggestions: Array<{
      type: 'optimization' | 'habit' | 'engagement';
      description: string;
      actionPlan: string;
    }>;
    metrics: {
      averageSessionTime: number;
      pageEngagement: { [key in TabKey]?: number };
      conversionRate: number;
    };
  } {
    const pageViews = this.navigationState.pageViews;
    
    // 分析用户访问模式
    const patterns = this.analyzeNavigationPatterns(pageViews);
    
    // 生成优化建议
    const suggestions = this.generateFlowSuggestions(patterns);
    
    // 计算关键指标
    const metrics = this.calculateFlowMetrics(pageViews);
    
    return {
      patterns,
      suggestions,
      metrics
    };
  }
  
  /**
   * 设置用户导航目标
   */
  setNavigationGoals(goals: UserNavigationState['goals']): void {
    this.navigationState.goals = goals;
    this.saveNavigationState();
    
    ActivityTracker.track({
      type: 'page_visit',
      data: {
        action: 'set_navigation_goals',
        goalCount: goals.length,
        goalTypes: goals.map(g => g.type)
      }
    });
  }
  
  /**
   * 获取导航统计数据
   */
  getNavigationStats(): {
    totalPageViews: number;
    averageTimePerPage: number;
    mostVisitedPage: TabKey;
    leastVisitedPage: TabKey;
    navigationEfficiency: number;
    goalCompletion: number;
  } {
    const pageViews = this.navigationState.pageViews;
    const totalViews = pageViews.length;
    
    if (totalViews === 0) {
      return {
        totalPageViews: 0,
        averageTimePerPage: 0,
        mostVisitedPage: 'overview',
        leastVisitedPage: 'overview',
        navigationEfficiency: 0,
        goalCompletion: 0
      };
    }
    
    // 统计页面访问频率
    const pageCounts: Record<TabKey, number> = {} as any;
    const pageDurations: Record<TabKey, number[]> = {} as any;
    
    pageViews.forEach(view => {
      pageCounts[view.tab] = (pageCounts[view.tab] || 0) + 1;
      if (view.duration) {
        if (!pageDurations[view.tab]) pageDurations[view.tab] = [];
        pageDurations[view.tab].push(view.duration);
      }
    });
    
    const mostVisited = Object.entries(pageCounts).reduce((a, b) => 
      pageCounts[a[0] as TabKey] > pageCounts[b[0] as TabKey] ? a : b
    )[0] as TabKey;
    
    const leastVisited = Object.entries(pageCounts).reduce((a, b) => 
      pageCounts[a[0] as TabKey] < pageCounts[b[0] as TabKey] ? a : b
    )[0] as TabKey;
    
    // 计算平均停留时间
    const totalDuration = Object.values(pageDurations).flat().reduce((sum, d) => sum + d, 0);
    const viewsWithDuration = Object.values(pageDurations).flat().length;
    
    // 计算目标完成率
    const completedGoals = this.navigationState.goals.filter(g => g.completed).length;
    const goalCompletion = this.navigationState.goals.length > 0 
      ? completedGoals / this.navigationState.goals.length 
      : 0;
    
    return {
      totalPageViews: totalViews,
      averageTimePerPage: viewsWithDuration > 0 ? totalDuration / viewsWithDuration : 0,
      mostVisitedPage: mostVisited,
      leastVisitedPage: leastVisited,
      navigationEfficiency: this.calculateNavigationEfficiency(pageViews),
      goalCompletion
    };
  }
  
  // 私有辅助方法
  
  private analyzeNavigation(from: TabKey, to: TabKey, motivation?: NavigationMotivation): {
    success: boolean;
    recommended: boolean;
    guidance?: string;
    alternatives?: TabKey[];
  } {
    const fromPageInfo = Object.values(NAVIGATION_MAP).find(page => page.key === from);
    const toPageInfo = Object.values(NAVIGATION_MAP).find(page => page.key === to);
    
    if (!fromPageInfo || !toPageInfo) {
      return {
        success: true,
        recommended: false,
        guidance: '页面导航完成，但未找到最优路径建议'
      };
    }
    
    // 检查是否为推荐的下一步
    const isRecommended = fromPageInfo.nextSteps?.includes(to) || false;
    
    // 生成导航指导
    const guidance = this.generateNavigationGuidance(from, to, isRecommended, motivation);
    
    // 提供替代建议
    const alternatives = fromPageInfo.nextSteps || ['overview'];
    
    return {
      success: true,
      recommended: isRecommended,
      guidance,
      alternatives: alternatives.filter(alt => alt !== to)
    };
  }
  
  private generateNavigationGuidance(
    from: TabKey, 
    to: TabKey, 
    isRecommended: boolean,
    motivation?: NavigationMotivation
  ): string {
    const toPageInfo = Object.values(NAVIGATION_MAP).find(page => page.key === to);
    
    if (!toPageInfo) {
      return `已导航到 ${to} 页面`;
    }
    
    if (isRecommended) {
      return `很好的选择！${toPageInfo.title} 非常适合你当前的学习进度`;
    }
    
    // 根据动机生成个性化指导
    if (motivation?.trigger === 'task_complete') {
      return `任务完成后，${toPageInfo.title} 可以帮助你 ${toPageInfo.description}`;
    }
    
    if (motivation?.trigger === 'achievement_unlock') {
      return `解锁成就后，在 ${toPageInfo.title} 中查看你的进步会很有成就感`;
    }
    
    return `在 ${toPageInfo.title} 中，你可以 ${toPageInfo.description}`;
  }
  
  private calculateNavigationRecommendations(
    currentTab: TabKey, 
    userContext?: any
  ): {
    recommended: TabKey;
    reason: string;
    confidence: number;
    alternatives: TabKey[];
  } {
    // 基于不同场景的推荐逻辑
    if (userContext?.tasksCompleted > 0 && currentTab === 'planning') {
      return {
        recommended: 'achievements',
        reason: '完成任务后查看成就进度，保持动机',
        confidence: 0.9,
        alternatives: ['rewards', 'habits']
      };
    }
    
    if (userContext?.pointsEarned > 100 && currentTab === 'overview') {
      return {
        recommended: 'rewards',
        reason: '获得足够积分，可以兑换奖励了',
        confidence: 0.85,
        alternatives: ['achievements', 'habits']
      };
    }
    
    if (userContext?.streakBroken && currentTab === 'habits') {
      return {
        recommended: 'planning',
        reason: '连击中断后，重新规划任务恢复习惯',
        confidence: 0.8,
        alternatives: ['overview', 'rewards']
      };
    }
    
    // 默认基于当前页面的推荐
    const currentPageInfo = Object.values(NAVIGATION_MAP).find(page => page.key === currentTab);
    const nextSteps = currentPageInfo?.nextSteps || ['overview'];
    
    return {
      recommended: nextSteps[0],
      reason: `从 ${currentPageInfo?.title} 继续你的学习旅程`,
      confidence: 0.7,
      alternatives: nextSteps.slice(1)
    };
  }
  
  private analyzeNavigationPatterns(pageViews: UserNavigationState['pageViews']) {
    // 分析常见的页面访问序列
    const sequences: Array<{ sequence: TabKey[]; frequency: number; efficiency: number }> = [];
    
    // 简化实现：分析2-3页面的访问序列
    for (let i = 0; i < pageViews.length - 1; i++) {
      const sequence = [pageViews[i].tab, pageViews[i + 1].tab];
      const existingSeq = sequences.find(s => 
        s.sequence.length === 2 && 
        s.sequence[0] === sequence[0] && 
        s.sequence[1] === sequence[1]
      );
      
      if (existingSeq) {
        existingSeq.frequency++;
      } else {
        sequences.push({
          sequence,
          frequency: 1,
          efficiency: this.calculateSequenceEfficiency(sequence)
        });
      }
    }
    
    return sequences.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
  }
  
  private calculateSequenceEfficiency(sequence: TabKey[]): number {
    // 基于页面间逻辑关系计算效率
    if (sequence.length < 2) return 1.0;
    
    const [from, to] = sequence;
    const fromPageInfo = Object.values(NAVIGATION_MAP).find(page => page.key === from);
    
    // 推荐的下一步获得更高效率分
    if (fromPageInfo?.nextSteps?.includes(to)) {
      return 0.9;
    }
    
    // Hub页面到其他页面效率中等
    if (from === 'overview') {
      return 0.7;
    }
    
    // 其他跳转效率较低
    return 0.5;
  }
  
  private generateFlowSuggestions(patterns: any[]): Array<{
    type: 'optimization' | 'habit' | 'engagement';
    description: string;
    actionPlan: string;
  }> {
    const suggestions: Array<{
      type: 'optimization' | 'habit' | 'engagement';
      description: string;
      actionPlan: string;
    }> = [];
    
    // 基于访问模式生成建议
    const lowEfficiencyPatterns = patterns.filter(p => p.efficiency < 0.6);
    
    if (lowEfficiencyPatterns.length > 0) {
      suggestions.push({
        type: 'optimization',
        description: '发现一些效率较低的页面跳转路径',
        actionPlan: '建议使用页面间的推荐链接，形成更流畅的学习体验'
      });
    }
    
    // 检查习惯页面访问频率
    const habitsVisits = patterns.filter(p => p.sequence.includes('habits')).length;
    if (habitsVisits < 2) {
      suggestions.push({
        type: 'habit',
        description: '习惯打卡页面访问较少',
        actionPlan: '建议每日访问习惯页面，保持学习连击和长期动机'
      });
    }
    
    return suggestions;
  }
  
  private calculateFlowMetrics(pageViews: UserNavigationState['pageViews']) {
    const sessionDuration = pageViews.length > 0 
      ? new Date().getTime() - new Date(this.navigationState.sessionStart).getTime()
      : 0;
    
    const averageSessionTime = sessionDuration / 60000; // 转换为分钟
    
    // 计算页面参与度
    const pageEngagement: { [key in TabKey]?: number } = {};
    pageViews.forEach(view => {
      if (view.duration && view.duration > 0) {
        pageEngagement[view.tab] = (pageEngagement[view.tab] || 0) + view.duration;
      }
    });
    
    // 简化的转换率计算
    const taskPages = pageViews.filter(v => v.tab === 'planning' || v.tab === 'habits').length;
    const rewardPages = pageViews.filter(v => v.tab === 'rewards' || v.tab === 'achievements').length;
    const conversionRate = taskPages > 0 ? rewardPages / taskPages : 0;
    
    return {
      averageSessionTime,
      pageEngagement,
      conversionRate
    };
  }
  
  private calculateNavigationEfficiency(pageViews: UserNavigationState['pageViews']): number {
    if (pageViews.length < 2) return 1.0;
    
    let totalEfficiency = 0;
    for (let i = 0; i < pageViews.length - 1; i++) {
      const sequence = [pageViews[i].tab, pageViews[i + 1].tab];
      totalEfficiency += this.calculateSequenceEfficiency(sequence);
    }
    
    return totalEfficiency / (pageViews.length - 1);
  }
  
  private updatePageViewDuration(tab: TabKey, currentTime: string): void {
    const currentView = this.navigationState.pageViews[this.navigationState.pageViews.length - 1];
    if (currentView && currentView.tab === tab) {
      const duration = new Date(currentTime).getTime() - new Date(currentView.timestamp).getTime();
      currentView.duration = duration / 1000; // 转换为秒
    }
  }
  
  private loadNavigationState(): void {
    try {
      const stored = localStorage.getItem('user_navigation_state');
      if (stored) {
        const parsedState = JSON.parse(stored);
        this.navigationState = {
          ...this.navigationState,
          ...parsedState
        };
      }
    } catch (error) {
      console.warn('Failed to load navigation state:', error);
    }
  }
  
  private saveNavigationState(): void {
    try {
      localStorage.setItem('user_navigation_state', JSON.stringify(this.navigationState));
    } catch (error) {
      console.warn('Failed to save navigation state:', error);
    }
  }
}

// 导出单例实例
export const navigationService = NavigationService.getInstance();

/**
 * React Hook for Navigation
 * 提供组件级别的导航功能
 */
export function useNavigation() {
  const navigate = (targetTab: TabKey, context?: string) => {
    return navigationService.navigateTo(targetTab, {
      from: navigationService.navigationState.currentTab,
      to: targetTab,
      trigger: 'user_intent',
      context: context || 'manual_navigation',
      expectedOutcome: `用户主动导航到${targetTab}页面`
    });
  };
  
  const getRecommendation = (userContext?: any) => {
    return navigationService.getRecommendedNextPage(
      navigationService.navigationState.currentTab,
      userContext
    );
  };
  
  const getCurrentTab = () => navigationService.navigationState.currentTab;
  
  const getNavigationStats = () => navigationService.getNavigationStats();
  
  return {
    navigate,
    getRecommendation,
    getCurrentTab,
    getNavigationStats,
    navigationMap: NAVIGATION_MAP
  };
}
import { apiClient } from './api-client';
import { 
  Achievement, 
  UserAchievement, 
  StreakRecord, 
  UserLevel,
  PaginatedResponse,
  ListOptions,
  TaskCategory
} from './types';

export class GamificationService {
  // Achievements API
  async getAchievements(options?: ListOptions & {
    category?: 'milestone' | 'streak' | 'social' | 'skill' | 'special';
  }): Promise<PaginatedResponse<Achievement>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.category) params.set('category', options.category);
    if (options?.sortBy) params.set('sortBy', options.sortBy);
    if (options?.sortOrder) params.set('sortOrder', options.sortOrder);

    return apiClient.get(`/gamification/achievements?${params.toString()}`);
  }

  async getUserAchievements(options?: {
    status?: 'locked' | 'unlocked' | 'claimed';
    category?: string;
  }): Promise<Array<UserAchievement & { achievement: Achievement }>> {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.category) params.set('category', options.category);

    return apiClient.get(`/gamification/achievements/my-progress?${params.toString()}`);
  }

  async getAchievementSummary(): Promise<{
    total: number;
    unlocked: number;
    claimed: number;
    categories: Array<{
      category: string;
      total: number;
      unlocked: number;
      claimed: number;
    }>;
    recentUnlocked: Array<UserAchievement & { achievement: Achievement }>;
  }> {
    return apiClient.get('/gamification/achievements/summary');
  }

  async claimAchievement(achievementId: string): Promise<{
    success: boolean;
    pointsAwarded: number;
    xpAwarded: number;
    newTitle?: string;
    newBadge?: string;
  }> {
    return apiClient.post(`/gamification/achievements/${achievementId}/claim`);
  }

  async getAchievementLeaderboard(options?: {
    category?: string;
    limit?: number;
  }): Promise<Array<{
    userId: string;
    username: string;
    displayName: string;
    avatar?: string;
    achievementCount: number;
    totalPoints: number;
    rank: number;
  }>> {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.limit) params.set('limit', options.limit.toString());

    return apiClient.get(`/gamification/achievements/leaderboard?${params.toString()}`);
  }

  // Streaks API
  async getUserStreaks(): Promise<StreakRecord[]> {
    return apiClient.get('/gamification/streaks');
  }

  async getStreakStats(): Promise<{
    totalStreaks: number;
    longestStreak: {
      category: TaskCategory;
      days: number;
    };
    currentStreaks: number;
    milestoneProgress: Array<{
      category: TaskCategory;
      currentStreak: number;
      nextMilestone: number;
      pointsReward: number;
    }>;
  }> {
    return apiClient.get('/gamification/streaks/stats');
  }

  async restoreStreak(category: TaskCategory): Promise<{
    success: boolean;
    cost: number;
    newStreak: number;
    message: string;
  }> {
    return apiClient.post('/gamification/streaks/restore', { category });
  }

  async getStreakLeaderboard(options?: {
    category?: TaskCategory;
    limit?: number;
  }): Promise<Array<{
    userId: string;
    username: string;
    displayName: string;
    avatar?: string;
    category: TaskCategory;
    currentStreak: number;
    longestStreak: number;
    rank: number;
  }>> {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.limit) params.set('limit', options.limit.toString());

    return apiClient.get(`/gamification/streaks/leaderboard?${params.toString()}`);
  }

  // Level System API
  async getUserLevel(): Promise<UserLevel & {
    nextLevelXp: number;
    progressToNextLevel: number; // percentage
    skillsBreakdown: Array<{
      skill: string;
      level: number;
      xp: number;
      nextLevelXp: number;
      progressPercent: number;
    }>;
  }> {
    return apiClient.get('/gamification/level');
  }

  async getLevelStats(): Promise<{
    overallStats: {
      averageLevel: number;
      topLevelUser: {
        username: string;
        level: number;
      };
      levelDistribution: Array<{
        level: number;
        userCount: number;
      }>;
    };
    skillStats: Array<{
      skill: string;
      averageLevel: number;
      userLevel: number;
      rank: number;
      totalUsers: number;
    }>;
  }> {
    return apiClient.get('/gamification/level/stats');
  }

  async prestigeRebirth(): Promise<{
    success: boolean;
    newPrestigeLevel: number;
    bonusMultiplier: number;
    specialRewards: string[];
    message: string;
  }> {
    return apiClient.post('/gamification/level/prestige');
  }

  async getLevelLeaderboard(options?: {
    category?: 'academic' | 'life_skills' | 'creativity' | 'social' | 'physical' | 'overall';
    limit?: number;
  }): Promise<Array<{
    userId: string;
    username: string;
    displayName: string;
    avatar?: string;
    level: number;
    xp: number;
    prestigeLevel: number;
    title: string;
    rank: number;
  }>> {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.limit) params.set('limit', options.limit.toString());

    return apiClient.get(`/gamification/level/leaderboard?${params.toString()}`);
  }

  async getXPRecommendations(): Promise<Array<{
    type: 'task' | 'achievement' | 'streak';
    title: string;
    description: string;
    xpReward: number;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime?: string;
    actionUrl?: string;
  }>> {
    return apiClient.get('/gamification/level/xp-recommendations');
  }

  async getSkillTree(): Promise<{
    skills: Array<{
      id: string;
      name: string;
      category: string;
      level: number;
      maxLevel: number;
      xp: number;
      nextLevelXp: number;
      benefits: string[];
      prerequisites: string[];
      isUnlocked: boolean;
    }>;
    totalSkillPoints: number;
    availableSkillPoints: number;
  }> {
    return apiClient.get('/gamification/level/skill-tree');
  }

  // Game Profile API
  async getGameProfile(): Promise<{
    user: {
      level: UserLevel;
      achievements: {
        total: number;
        unlocked: number;
        claimed: number;
        recent: Array<UserAchievement & { achievement: Achievement }>;
      };
      streaks: {
        active: number;
        longest: number;
        categories: StreakRecord[];
      };
      stats: {
        totalXp: number;
        totalPoints: number;
        tasksCompleted: number;
        daysActive: number;
      };
    };
    rankings: {
      level: number;
      achievements: number;
      points: number;
      totalUsers: number;
    };
  }> {
    return apiClient.get('/gamification/profile');
  }

  async initializeGameProfile(): Promise<{
    success: boolean;
    profile: UserLevel;
    initialAchievements: Achievement[];
    message: string;
  }> {
    return apiClient.post('/gamification/profile/initialize');
  }

  // XP Management API (Parent Permission)
  async addXP(data: {
    targetUserId: string;
    xp: number;
    category?: 'academic' | 'life_skills' | 'creativity' | 'social' | 'physical';
    reason: string;
  }): Promise<{
    success: boolean;
    xpAdded: number;
    levelChanged: boolean;
    newLevel?: number;
    newTitle?: string;
    achievementsUnlocked?: string[];
  }> {
    return apiClient.post('/gamification/level/add-xp', data);
  }

  // Utility Methods
  getLevelTitle(level: number, prestigeLevel: number = 0): string {
    const baseTitles = [
      'Newbie', 'Explorer', 'Achiever', 'Champion', 'Expert', 
      'Master', 'Legend', 'Hero', 'Grandmaster', 'Ultimate'
    ];
    
    const prestigeTitles = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    
    let title = baseTitles[Math.min(Math.floor(level / 10), baseTitles.length - 1)] || 'Ultimate';
    
    if (prestigeLevel > 0) {
      const prestigeTitle = prestigeTitles[Math.min(prestigeLevel - 1, prestigeTitles.length - 1)];
      title = `${prestigeTitle} ${title}`;
    }
    
    return title;
  }

  calculateXPToNextLevel(currentXp: number, currentLevel: number): number {
    // XP requirement formula: level^2 * 100 + level * 50
    const nextLevelXp = Math.pow(currentLevel + 1, 2) * 100 + (currentLevel + 1) * 50;
    const currentLevelXp = Math.pow(currentLevel, 2) * 100 + currentLevel * 50;
    return nextLevelXp - currentXp;
  }

  getProgressToNextLevel(currentXp: number, currentLevel: number): number {
    const currentLevelXp = Math.pow(currentLevel, 2) * 100 + currentLevel * 50;
    const nextLevelXp = Math.pow(currentLevel + 1, 2) * 100 + (currentLevel + 1) * 50;
    const progress = (currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp);
    return Math.min(100, Math.max(0, Math.round(progress * 100)));
  }

  getAchievementDifficultyColor(difficulty: Achievement['difficulty']): string {
    const colors = {
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700',
      platinum: '#e5e4e2'
    };
    return colors[difficulty];
  }

  getStreakMilestoneReward(days: number, category: TaskCategory): number {
    const baseRewards = {
      exercise: 50,
      reading: 40,
      chores: 30,
      learning: 60,
      creativity: 45,
      other: 35
    };
    
    const base = baseRewards[category] || 35;
    
    if (days >= 30) return base * 4;
    if (days >= 21) return base * 3;
    if (days >= 14) return base * 2;
    if (days >= 7) return base;
    
    return 0;
  }

  formatXP(xp: number): string {
    if (xp < 1000) {
      return `${xp} XP`;
    } else if (xp < 1000000) {
      return `${(xp / 1000).toFixed(1)}k XP`;
    } else {
      return `${(xp / 1000000).toFixed(1)}m XP`;
    }
  }

  getSkillCategoryIcon(category: string): string {
    const icons = {
      academic: '🎓',
      life_skills: '🏠',
      creativity: '🎨',
      social: '👥',
      physical: '💪',
      overall: '⭐'
    };
    return icons[category as keyof typeof icons] || '📋';
  }
}

// Export singleton instance
export const gamificationService = new GamificationService();
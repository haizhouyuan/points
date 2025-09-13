import { apiClient } from './api-client';
import { 
  PointsBalance, 
  PointsTransaction, 
  FamilyLeaderboard,
  PaginatedResponse,
  ListOptions 
} from './types';

export class PointsService {
  // Points Balance API
  async getBalance(userId?: string): Promise<PointsBalance> {
    const params = userId ? `?userId=${userId}` : '';
    return apiClient.get(`/points/balance${params}`);
  }

  async getBalanceHistory(options?: ListOptions & {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<{ date: string; balance: number; change: number }>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.userId) params.set('userId', options.userId);
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);

    return apiClient.get(`/points/balance/history?${params.toString()}`);
  }

  // Points Transactions API
  async getTransactions(options?: ListOptions & {
    userId?: string;
    type?: 'earned' | 'spent' | 'adjusted';
    source?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<PointsTransaction>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.userId) params.set('userId', options.userId);
    if (options?.type) params.set('type', options.type);
    if (options?.source) params.set('source', options.source);
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);
    if (options?.sortBy) params.set('sortBy', options.sortBy);
    if (options?.sortOrder) params.set('sortOrder', options.sortOrder);

    return apiClient.get(`/points/transactions?${params.toString()}`);
  }

  async getTransaction(transactionId: string): Promise<PointsTransaction> {
    return apiClient.get(`/points/transactions/${transactionId}`);
  }

  // Points Earning API
  async awardPoints(data: {
    userId: string;
    amount: number;
    source: {
      type: 'task_completion' | 'achievement' | 'streak_bonus' | 'manual';
      sourceId?: string;
      description: string;
    };
    notes?: string;
  }): Promise<{
    transaction: PointsTransaction;
    newBalance: number;
    levelChanged?: boolean;
    achievementsUnlocked?: string[];
  }> {
    return apiClient.post('/points/award', data);
  }

  async deductPoints(data: {
    userId: string;
    amount: number;
    source: {
      type: 'redemption' | 'manual';
      sourceId?: string;
      description: string;
    };
    notes?: string;
  }): Promise<{
    transaction: PointsTransaction;
    newBalance: number;
  }> {
    return apiClient.post('/points/deduct', data);
  }

  async adjustPoints(data: {
    userId: string;
    amount: number; // positive or negative
    reason: string;
    notes?: string;
  }): Promise<{
    transaction: PointsTransaction;
    newBalance: number;
  }> {
    return apiClient.post('/points/adjust', data);
  }

  // Family Leaderboard API
  async getFamilyLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'weekly'): Promise<FamilyLeaderboard> {
    return apiClient.get(`/points/leaderboard?period=${period}`);
  }

  async getLeaderboardHistory(period: 'weekly' | 'monthly', weeksBack?: number): Promise<{
    history: Array<{
      date: string;
      rankings: FamilyLeaderboard['rankings'];
    }>;
  }> {
    const params = new URLSearchParams({ period });
    if (weeksBack) params.set('weeksBack', weeksBack.toString());
    
    return apiClient.get(`/points/leaderboard/history?${params.toString()}`);
  }

  // Points Statistics API
  async getUserStats(userId?: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<{
    totalEarned: number;
    totalSpent: number;
    currentBalance: number;
    averageDaily: number;
    topSources: Array<{
      source: string;
      amount: number;
      count: number;
    }>;
    trends: Array<{
      date: string;
      earned: number;
      spent: number;
      balance: number;
    }>;
    achievements: {
      totalUnlocked: number;
      recentUnlocked: Array<{
        name: string;
        unlockedAt: string;
        pointsAwarded: number;
      }>;
    };
  }> {
    const params = new URLSearchParams({ timeframe });
    if (userId) params.set('userId', userId);
    
    return apiClient.get(`/points/stats?${params.toString()}`);
  }

  async getFamilyStats(timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<{
    totalFamilyPoints: number;
    familyRank: number; // if there are multiple families
    memberStats: Array<{
      userId: string;
      username: string;
      displayName: string;
      pointsEarned: number;
      contribution: number; // percentage
    }>;
    trends: Array<{
      date: string;
      totalEarned: number;
      memberBreakdown: { [userId: string]: number };
    }>;
  }> {
    return apiClient.get(`/points/stats/family?timeframe=${timeframe}`);
  }

  // Reward Redemption API
  async redeemReward(rewardId: string, pointsCost: number, notes?: string): Promise<{
    redemptionId: string;
    status: 'pending' | 'approved' | 'rejected';
    requiresApproval: boolean;
  }> {
    return apiClient.post('/points/redeem', {
      rewardId,
      pointsCost,
      notes
    });
  }

  async getRedemptionHistory(userId?: string, limit: number = 20, offset: number = 0): Promise<{
    redemptions: Array<{
      id: string;
      rewardId: string;
      rewardTitle: string;
      pointsCost: number;
      status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
      requestedAt: string;
      approvedAt?: string;
      fulfilledAt?: string;
      parentNotes?: string;
    }>;
    total: number;
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (userId) params.set('userId', userId);
    
    return apiClient.get(`/points/redemptions?${params.toString()}`);
  }

  async getPendingApprovals(parentId?: string): Promise<Array<{
    id: string;
    studentId: string;
    studentName: string;
    rewardId: string;
    rewardTitle: string;
    rewardCategory: string;
    pointsCost: number;
    requestedAt: string;
    requestNotes?: string;
  }>> {
    const params = parentId ? `?parentId=${parentId}` : '';
    return apiClient.get(`/points/redemptions/pending${params}`);
  }

  async approveRedemption(redemptionId: string, notes?: string): Promise<{
    redemption: {
      id: string;
      status: 'approved';
      approvedAt: string;
      parentNotes?: string;
    };
    studentNotified: boolean;
  }> {
    return apiClient.post(`/points/redemptions/${redemptionId}/approve`, {
      notes
    });
  }

  async rejectRedemption(redemptionId: string, reason?: string): Promise<{
    redemption: {
      id: string;
      status: 'rejected';
      rejectedAt: string;
      parentNotes?: string;
    };
    pointsRefunded: number;
    studentNotified: boolean;
  }> {
    return apiClient.post(`/points/redemptions/${redemptionId}/reject`, {
      reason
    });
  }

  async markRedemptionFulfilled(redemptionId: string, notes?: string): Promise<{
    redemption: {
      id: string;
      status: 'fulfilled';
      fulfilledAt: string;
      parentNotes?: string;
    };
  }> {
    return apiClient.post(`/points/redemptions/${redemptionId}/fulfill`, {
      notes
    });
  }

  // Points Predictions and Insights API
  async getPointsInsights(userId?: string): Promise<{
    insights: Array<{
      type: 'streak_opportunity' | 'category_suggestion' | 'goal_recommendation';
      title: string;
      description: string;
      potentialPoints: number;
      actionUrl?: string;
    }>;
    predictions: {
      weeklyEarningPrediction: number;
      timeToNextLevel: number; // days
      suggestedGoals: Array<{
        description: string;
        targetPoints: number;
        timeframe: string;
      }>;
    };
  }> {
    const params = userId ? `?userId=${userId}` : '';
    return apiClient.get(`/points/insights${params}`);
  }

  // Bulk Operations API
  async bulkAwardPoints(awards: Array<{
    userId: string;
    amount: number;
    source: {
      type: 'task_completion' | 'achievement' | 'streak_bonus' | 'manual';
      sourceId?: string;
      description: string;
    };
  }>): Promise<{
    successful: Array<{
      userId: string;
      transaction: PointsTransaction;
      newBalance: number;
    }>;
    failed: Array<{
      userId: string;
      error: string;
    }>;
  }> {
    return apiClient.post('/points/bulk-award', { awards });
  }

  // Utility Methods
  formatPoints(points: number): string {
    if (points < 1000) {
      return points.toString();
    } else if (points < 1000000) {
      return `${(points / 1000).toFixed(1)}k`;
    } else {
      return `${(points / 1000000).toFixed(1)}m`;
    }
  }

  calculatePointsPerDay(transactions: PointsTransaction[], days: number): number {
    const earnedTransactions = transactions.filter(t => t.type === 'earned');
    const totalPoints = earnedTransactions.reduce((sum, t) => sum + t.amount, 0);
    return Math.round(totalPoints / days);
  }

  getPointsChangeText(change: number): { text: string; color: string } {
    if (change > 0) {
      return {
        text: `+${this.formatPoints(change)}`,
        color: 'text-green-600'
      };
    } else if (change < 0) {
      return {
        text: this.formatPoints(change),
        color: 'text-red-600'
      };
    }
    return {
      text: '0',
      color: 'text-gray-600'
    };
  }

  getRankChangeIcon(change: number): string {
    if (change > 0) return '📈';
    if (change < 0) return '📉';
    return '➖';
  }

  calculateStreakBonus(consecutiveDays: number, basePoints: number): number {
    // Streak bonus calculation
    let bonusMultiplier = 1;
    
    if (consecutiveDays >= 7) bonusMultiplier += 0.1; // 10% bonus for 7+ days
    if (consecutiveDays >= 14) bonusMultiplier += 0.1; // Additional 10% for 14+ days
    if (consecutiveDays >= 21) bonusMultiplier += 0.1; // Additional 10% for 21+ days
    if (consecutiveDays >= 30) bonusMultiplier += 0.2; // Additional 20% for 30+ days

    return Math.round(basePoints * (bonusMultiplier - 1));
  }
}

// Export singleton instance
export const pointsService = new PointsService();
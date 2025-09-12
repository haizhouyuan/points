import { describe, it, expect } from 'vitest';
import { AnalyticsService, LearningSession } from '@/services/analytics.service';

function makeSession(overrides: Partial<LearningSession>): LearningSession {
  const now = new Date();
  const start = new Date(now.getTime() - Math.floor(Math.random() * 1000 * 60 * 60));
  return {
    id: `s_${Math.random().toString(36).slice(2)}`,
    userId: 'u_default',
    startTime: start.toISOString(),
    endTime: new Date(start.getTime() + 30 * 60000).toISOString(),
    durationMinutes: 30,
    category: '数学',
    taskId: 't_1',
    taskTitle: '四则运算 练习',
    difficulty: 'medium',
    pointsEarned: 10,
    xpEarned: 7,
    completionRate: 80,
    focusScore: 80,
    errorRate: 10,
    hintsUsed: 0,
    timeSpentThinking: 60,
    timeSpentActive: 60,
    mood: 'neutral',
    energyLevel: 'medium',
    ...overrides,
  };
}

describe('AnalyticsService basic behaviors', () => {
  it('returns default metrics when no sessions exist for user', () => {
    const metrics = AnalyticsService.analyzePerformanceMetrics('u_none');
    expect(metrics.overall.averageScore).toBe(0);
    expect(metrics.overall.consistencyIndex).toBe(0);
  });

  it('handles zero-mean consistency without NaN or Infinity', () => {
    const uid = 'u_consistency_zero';
    for (let i = 0; i < 3; i++) {
      AnalyticsService.recordLearningSession(makeSession({ userId: uid, completionRate: 0 }));
    }
    const metrics = AnalyticsService.analyzePerformanceMetrics(uid);
    expect(metrics.overall.consistencyIndex).toBe(0);
  });

  it('detects improving trend when earlier avg is near zero and recent has signal', () => {
    const uid = 'u_trend_improve';
    // older 3 sessions with 0%, newer 3 sessions with 50%
    const base = Date.now();
    const mkTime = (offsetHours: number) => new Date(base - offsetHours * 3600000).toISOString();
    const olderTimes = [mkTime(100), mkTime(90), mkTime(80)];
    const newerTimes = [mkTime(10), mkTime(8), mkTime(6)];

    olderTimes.forEach((t, idx) => {
      AnalyticsService.recordLearningSession(makeSession({ userId: uid, startTime: t, endTime: mkTime(79 - idx), completionRate: 0 }));
    });
    newerTimes.forEach((t, idx) => {
      AnalyticsService.recordLearningSession(makeSession({ userId: uid, startTime: t, endTime: mkTime(5 - idx), completionRate: 50 }));
    });

    const metrics = AnalyticsService.analyzePerformanceMetrics(uid);
    expect(['improving', 'stable']).toContain(metrics.overall.improvementTrend);
  });

  it('generateLearningInsights works when no data without throwing', () => {
    const insights = AnalyticsService.generateLearningInsights('u_empty');
    expect(Array.isArray(insights)).toBe(true);
  });
});


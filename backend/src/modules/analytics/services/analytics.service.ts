import mongoose from 'mongoose';
import { ScheduledTask } from '@modules/tasks/models/task.model';
import { PointsLedger } from '@modules/points/models/points-ledger.model';
import { UserAchievement } from '@modules/gamification/models/achievement.model';
import { UserStreak } from '@modules/gamification/models/streak.model';
import { UserLevel } from '@modules/gamification/models/level.model';
import { AnalyticsPeriod, AnalyticsGranularity } from '@shared/types/common';

export interface AnalyticsData {
  period: AnalyticsPeriod;
  granularity: AnalyticsGranularity;
  data: any[];
  summary: Record<string, any>;
  generatedAt: Date;
}

export class AnalyticsService {
  // 获取用户活动分析
  async getUserActivity(
    userId: string,
    period: AnalyticsPeriod = 'week',
    granularity: AnalyticsGranularity = 'day'
  ): Promise<AnalyticsData> {
    const { startDate, endDate } = this.calculateDateRange(period);
    
    const activityData = await ScheduledTask.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: this.getDateFormat(granularity),
              date: '$completedAt'
            }
          },
          completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalTasks: { $sum: 1 },
          pointsEarned: { $sum: '$rewards.pointsEarned' },
          avgDuration: { $avg: '$actualDuration' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      period,
      granularity,
      data: activityData,
      summary: {
        totalTasks: activityData.reduce((sum, item) => sum + item.totalTasks, 0),
        completedTasks: activityData.reduce((sum, item) => sum + item.completedTasks, 0),
        totalPoints: activityData.reduce((sum, item) => sum + (item.pointsEarned || 0), 0)
      },
      generatedAt: new Date()
    };
  }

  // 获取家庭整体分析
  async getFamilyAnalytics(
    familyId: string,
    period: AnalyticsPeriod = 'month'
  ): Promise<{
    taskAnalytics: AnalyticsData;
    pointsAnalytics: AnalyticsData;
    memberComparison: any[];
    achievements: any[];
  }> {
    const { startDate, endDate } = this.calculateDateRange(period);
    const objectId = new mongoose.Types.ObjectId(familyId);

    const [taskData, pointsData, memberData, achievementData] = await Promise.all([
      // 任务分析
      ScheduledTask.aggregate([
        {
          $match: {
            familyId: objectId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            pointsEarned: { $sum: '$rewards.pointsEarned' }
          }
        }
      ]),

      // 积分分析
      PointsLedger.aggregate([
        {
          $match: {
            familyId: objectId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),

      // 成员对比
      ScheduledTask.aggregate([
        {
          $match: {
            familyId: objectId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$userId',
            completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            totalTasks: { $sum: 1 },
            pointsEarned: { $sum: '$rewards.pointsEarned' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        }
      ]),

      // 成就统计
      UserAchievement.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $match: {
            'user.familyId': objectId,
            status: 'claimed',
            claimedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$userId',
            achievementsCount: { $sum: 1 },
            pointsFromAchievements: { $sum: '$pointsRewarded' }
          }
        }
      ])
    ]);

    return {
      taskAnalytics: {
        period,
        granularity: 'day',
        data: taskData,
        summary: {
          total: taskData.reduce((sum, item) => sum + item.count, 0)
        },
        generatedAt: new Date()
      },
      pointsAnalytics: {
        period,
        granularity: 'day',
        data: pointsData,
        summary: {
          total: pointsData.reduce((sum, item) => sum + item.totalAmount, 0)
        },
        generatedAt: new Date()
      },
      memberComparison: memberData,
      achievements: achievementData
    };
  }

  // 获取进度趋势
  async getProgressTrends(
    userId: string,
    period: AnalyticsPeriod = 'month'
  ): Promise<{
    taskTrends: any[];
    levelTrends: any[];
    streakTrends: any[];
  }> {
    const { startDate, endDate } = this.calculateDateRange(period);
    const objectId = new mongoose.Types.ObjectId(userId);

    const [taskTrends, levelTrends, streakTrends] = await Promise.all([
      // 任务完成趋势
      ScheduledTask.aggregate([
        {
          $match: {
            userId: objectId,
            status: 'completed',
            completedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$completedAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 等级进度
      UserLevel.findOne({ userId: objectId }).select('levelHistory'),

      // 连击记录
      UserStreak.find({ userId: objectId }).select('category currentStreak maxStreak')
    ]);

    return {
      taskTrends,
      levelTrends: levelTrends?.levelHistory?.slice(-30) || [],
      streakTrends
    };
  }

  // 私有方法：计算日期范围
  private calculateDateRange(period: AnalyticsPeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }

  // 私有方法：获取日期格式
  private getDateFormat(granularity: AnalyticsGranularity): string {
    switch (granularity) {
      case 'day':
        return '%Y-%m-%d';
      case 'week':
        return '%Y-%U';
      case 'month':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
  }
}
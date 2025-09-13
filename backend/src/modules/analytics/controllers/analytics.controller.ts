import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsPeriod, AnalyticsGranularity } from '@shared/types/common';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  // 获取用户活动分析
  getUserActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      const { period = 'week', granularity = 'day' } = req.query;

      const analytics = await this.analyticsService.getUserActivity(
        userId,
        period as AnalyticsPeriod,
        granularity as AnalyticsGranularity
      );

      res.json({
        success: true,
        data: analytics,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取家庭分析
  getFamilyAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.user!;
      const { period = 'month' } = req.query;

      const analytics = await this.analyticsService.getFamilyAnalytics(
        familyId,
        period as AnalyticsPeriod
      );

      res.json({
        success: true,
        data: analytics,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取进度趋势
  getProgressTrends = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      const { period = 'month' } = req.query;

      const trends = await this.analyticsService.getProgressTrends(
        userId,
        period as AnalyticsPeriod
      );

      res.json({
        success: true,
        data: trends,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };
}
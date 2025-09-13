import { EventBus } from './event-bus';
import { AchievementService } from '@modules/gamification/services/achievement.service';
import { StreakService } from '@modules/gamification/services/streak.service';
import { LevelService } from '@modules/gamification/services/level.service';
import { TaskService } from '@modules/tasks/services/task.service';
import { Logger } from '@shared/utils/logger';

export class GamificationEventHandler {
  private achievementService: AchievementService;
  private streakService: StreakService;
  private levelService: LevelService;
  private taskService: TaskService;
  private logger: Logger;
  private eventBus: EventBus;

  constructor() {
    this.achievementService = new AchievementService();
    this.streakService = new StreakService();
    this.levelService = new LevelService();
    this.taskService = new TaskService();
    this.logger = new Logger('GamificationEventHandler');
    this.eventBus = EventBus.getInstance();
  }

  // 注册所有事件监听器
  public registerEventListeners(): void {
    // 任务相关事件
    this.eventBus.on('task.completed', this.handleTaskCompleted.bind(this));
    this.eventBus.on('task.scheduled', this.handleTaskScheduled.bind(this));
    
    // 积分相关事件
    this.eventBus.on('points.earned', this.handlePointsEarned.bind(this));
    
    // 连击相关事件
    this.eventBus.on('streak.incremented', this.handleStreakIncremented.bind(this));
    this.eventBus.on('streak.milestone', this.handleStreakMilestone.bind(this));
    
    // 等级相关事件
    this.eventBus.on('level.up', this.handleLevelUp.bind(this));
    this.eventBus.on('level.skill_up', this.handleSkillLevelUp.bind(this));
    
    // 成就相关事件
    this.eventBus.on('achievement.unlocked', this.handleAchievementUnlocked.bind(this));
    
    this.logger.info('Gamification event listeners registered');
  }

  // 处理任务完成事件
  private async handleTaskCompleted(eventData: {
    taskId: string;
    userId: string;
    familyId: string;
    templateId: string;
    category: string;
    pointsEarned: number;
    xpEarned: number;
    bonusMultiplier: number;
    completedAt: Date;
    actualDuration?: number;
  }): Promise<void> {
    try {
      this.logger.info('Processing task completion event', {
        taskId: eventData.taskId,
        userId: eventData.userId,
        category: eventData.category
      });

      const promises = [];

      // 1. 增加连击
      if (this.isStreakEligibleCategory(eventData.category)) {
        promises.push(
          this.streakService.incrementStreak(
            eventData.userId,
            eventData.category as any,
            {
              taskId: eventData.taskId,
              pointsEarned: eventData.pointsEarned,
              completedAt: eventData.completedAt
            }
          )
        );
      }

      // 2. 添加经验值
      const skillCategory = this.mapTaskCategoryToSkill(eventData.category);
      if (skillCategory) {
        promises.push(
          this.levelService.addXP(
            eventData.userId,
            eventData.xpEarned,
            skillCategory,
            {
              source: 'task_completion',
              taskId: eventData.taskId,
              category: eventData.category,
              bonusMultiplier: eventData.bonusMultiplier
            }
          )
        );
      }

      // 3. 检查成就解锁
      promises.push(this.checkAchievementsForUser(eventData.userId));

      await Promise.all(promises);

      this.logger.info('Task completion event processed successfully', {
        taskId: eventData.taskId,
        userId: eventData.userId
      });
    } catch (error) {
      this.logger.error('Failed to process task completion event:', error);
    }
  }

  // 处理任务排期事件
  private async handleTaskScheduled(eventData: {
    taskId: string;
    templateId: string;
    userId: string;
    familyId: string;
    scheduledAt: Date;
    pointsReward: number;
  }): Promise<void> {
    try {
      // 可以在这里实现一些排期相关的游戏化逻辑
      // 比如连续排期任务的奖励等
      this.logger.debug('Task scheduled event received', {
        taskId: eventData.taskId,
        userId: eventData.userId
      });
    } catch (error) {
      this.logger.error('Failed to process task scheduled event:', error);
    }
  }

  // 处理积分获得事件
  private async handlePointsEarned(eventData: {
    userId: string;
    familyId: string;
    amount: number;
    type: string;
    balanceBefore: number;
    balanceAfter: number;
    transactionId: string;
  }): Promise<void> {
    try {
      // 检查积分里程碑成就
      await this.checkPointsMilestoneAchievements(eventData.userId, eventData.balanceAfter);

      this.logger.debug('Points earned event processed', {
        userId: eventData.userId,
        amount: eventData.amount
      });
    } catch (error) {
      this.logger.error('Failed to process points earned event:', error);
    }
  }

  // 处理连击增加事件
  private async handleStreakIncremented(eventData: {
    userId: string;
    category: string;
    currentStreak: number;
    maxStreak: number;
    bonusMultiplier: number;
    newMilestones: number[];
    metadata?: any;
  }): Promise<void> {
    try {
      // 连击增加时可能触发的额外奖励
      if (eventData.currentStreak > 0 && eventData.currentStreak % 7 === 0) {
        // 每7天连击给额外XP奖励
        await this.levelService.addXP(
          eventData.userId,
          25,
          undefined,
          {
            source: 'streak_bonus',
            category: eventData.category,
            streak: eventData.currentStreak
          }
        );
      }

      // 检查连击相关成就
      await this.checkStreakAchievements(eventData.userId, eventData.category, eventData.currentStreak);

      this.logger.debug('Streak incremented event processed', {
        userId: eventData.userId,
        category: eventData.category,
        streak: eventData.currentStreak
      });
    } catch (error) {
      this.logger.error('Failed to process streak incremented event:', error);
    }
  }

  // 处理连击里程碑事件
  private async handleStreakMilestone(eventData: {
    userId: string;
    category: string;
    milestone: number;
    pointsRewarded: number;
  }): Promise<void> {
    try {
      // 连击里程碑额外XP奖励
      const xpBonus = Math.floor(eventData.milestone / 7) * 10; // 每周连击10XP
      
      if (xpBonus > 0) {
        await this.levelService.addXP(
          eventData.userId,
          xpBonus,
          undefined,
          {
            source: 'streak_milestone',
            category: eventData.category,
            milestone: eventData.milestone
          }
        );
      }

      this.logger.debug('Streak milestone event processed', {
        userId: eventData.userId,
        milestone: eventData.milestone
      });
    } catch (error) {
      this.logger.error('Failed to process streak milestone event:', error);
    }
  }

  // 处理升级事件
  private async handleLevelUp(eventData: {
    userId: string;
    oldLevel: number;
    newLevel: number;
    category: string;
    totalXP: number;
    pointsReward: number;
    items: string[];
  }): Promise<void> {
    try {
      // 检查等级相关成就
      await this.checkLevelAchievements(eventData.userId, eventData.newLevel);

      this.logger.info('Level up event processed', {
        userId: eventData.userId,
        newLevel: eventData.newLevel
      });
    } catch (error) {
      this.logger.error('Failed to process level up event:', error);
    }
  }

  // 处理技能升级事件
  private async handleSkillLevelUp(eventData: {
    userId: string;
    category: string;
    newLevel: number;
    pointsReward: number;
    items: string[];
  }): Promise<void> {
    try {
      // 检查技能精通成就
      await this.checkSkillMasteryAchievements(eventData.userId, eventData.category, eventData.newLevel);

      this.logger.debug('Skill level up event processed', {
        userId: eventData.userId,
        category: eventData.category,
        newLevel: eventData.newLevel
      });
    } catch (error) {
      this.logger.error('Failed to process skill level up event:', error);
    }
  }

  // 处理成就解锁事件
  private async handleAchievementUnlocked(eventData: {
    userId: string;
    achievementId: string;
    achievementCode: string;
    achievementName: string;
    category: string;
    rarity: string;
    pointsReward: number;
    xpReward: number;
  }): Promise<void> {
    try {
      // 成就解锁时的额外XP奖励
      await this.levelService.addXP(
        eventData.userId,
        eventData.xpReward,
        undefined,
        {
          source: 'achievement_unlock',
          achievementId: eventData.achievementId,
          achievementCode: eventData.achievementCode,
          rarity: eventData.rarity
        }
      );

      this.logger.info('Achievement unlocked event processed', {
        userId: eventData.userId,
        achievementCode: eventData.achievementCode
      });
    } catch (error) {
      this.logger.error('Failed to process achievement unlocked event:', error);
    }
  }

  // 私有方法：检查用户成就
  private async checkAchievementsForUser(userId: string): Promise<void> {
    try {
      // 获取用户统计数据
      const userStats = await this.getUserStats(userId);
      
      // 检查并解锁成就
      await this.achievementService.checkAndUnlockAchievements(userId, userStats);
    } catch (error) {
      this.logger.error('Failed to check achievements for user:', error);
    }
  }

  // 私有方法：获取用户统计数据
  private async getUserStats(userId: string): Promise<Record<string, any>> {
    try {
      const [streakStats, levelStats, taskStats] = await Promise.all([
        this.streakService.getUserStreakStats(userId),
        this.levelService.getUserLevelStats(userId),
        this.taskService.getFamilyTaskStats('', 'month') // 需要familyId，这里简化处理
      ]);

      return {
        // 任务统计
        completedTasks: taskStats.length > 0 ? taskStats[0]?.stats?.find(s => s.status === 'completed')?.count || 0 : 0,
        totalPoints: levelStats.totalXPEarned, // 简化使用XP作为积分
        
        // 连击统计
        maxStreak: Math.max(...streakStats.categoryStats.map(s => s.maxStreak)),
        activeStreaks: streakStats.activeStreaks,
        
        // 等级统计
        overallLevel: levelStats.overallLevel,
        skillLevels: levelStats.skillProgress,
        
        // 类别分解
        categoryBreakdown: this.buildCategoryBreakdown(streakStats.categoryStats)
      };
    } catch (error) {
      this.logger.error('Failed to get user stats:', error);
      return {};
    }
  }

  // 私有方法：构建类别分解数据
  private buildCategoryBreakdown(categoryStats: any[]): Record<string, any> {
    const breakdown: Record<string, any> = {};
    
    for (const stat of categoryStats) {
      breakdown[stat.category] = {
        count: stat.currentStreak, // 简化处理
        maxStreak: stat.maxStreak
      };
    }
    
    return breakdown;
  }

  // 私有方法：检查积分里程碑成就
  private async checkPointsMilestoneAchievements(userId: string, totalPoints: number): Promise<void> {
    // 这里应该检查特定的积分里程碑成就
    // 比如"赚取1000积分"、"赚取10000积分"等
  }

  // 私有方法：检查连击成就
  private async checkStreakAchievements(userId: string, category: string, streak: number): Promise<void> {
    // 这里应该检查连击相关的成就
    // 比如"7天连击"、"30天连击"等
  }

  // 私有方法：检查等级成就
  private async checkLevelAchievements(userId: string, level: number): Promise<void> {
    // 这里应该检查等级相关的成就
    // 比如"达到10级"、"达到50级"等
  }

  // 私有方法：检查技能精通成就
  private async checkSkillMasteryAchievements(userId: string, category: string, level: number): Promise<void> {
    // 这里应该检查技能精通相关的成就
    // 比如"学术技能达到20级"等
  }

  // 私有方法：判断任务类别是否适用于连击
  private isStreakEligibleCategory(category: string): boolean {
    const eligibleCategories = ['exercise', 'reading', 'chores', 'learning', 'creativity'];
    return eligibleCategories.includes(category);
  }

  // 私有方法：映射任务类别到技能类别
  private mapTaskCategoryToSkill(taskCategory: string): string | null {
    const mapping: Record<string, string> = {
      'learning': 'academic',
      'exercise': 'physical',
      'chores': 'life_skills',
      'creativity': 'creativity',
      'reading': 'academic'
    };

    return mapping[taskCategory] || null;
  }
}
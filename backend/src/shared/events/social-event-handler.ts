import { EventBus } from './event-bus';
import { SocialService } from '@modules/social';
import { Logger } from '@shared/utils/logger';
import { PostType } from '@modules/social/models/social.model';

export class SocialEventHandler {
  private eventBus: EventBus;
  private socialService: SocialService;
  private logger: Logger;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.socialService = new SocialService(eventBus);
    this.logger = new Logger('SocialEventHandler');
    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    // Task completion creates social posts
    this.eventBus.on('task.completed', this.handleTaskCompleted.bind(this));
    
    // Achievement unlocks create social posts
    this.eventBus.on('gamification.achievement_unlocked', this.handleAchievementUnlocked.bind(this));
    
    // Level up creates social posts
    this.eventBus.on('gamification.level_up', this.handleLevelUp.bind(this));
    
    // Streak milestones create social posts
    this.eventBus.on('gamification.streak_milestone', this.handleStreakMilestone.bind(this));

    // Challenge completion updates challenge progress
    this.eventBus.on('task.completed', this.handleChallengeProgress.bind(this));
    
    this.logger.info('Social event handlers registered');
  }

  private async handleTaskCompleted(eventData: {
    taskId: string;
    userId: string;
    familyId: string;
    taskTitle: string;
    category: string;
    pointsEarned: number;
    evidenceUrls?: string[];
    notes?: string;
  }): Promise<void> {
    try {
      // Create a task completion social post
      await this.socialService.createPost(eventData.familyId, eventData.userId, {
        type: PostType.TASK_COMPLETION,
        content: {
          text: `刚刚完成了任务："${eventData.taskTitle}"！获得了 ${eventData.pointsEarned} 积分 🎉`,
          taskId: eventData.taskId,
          imageUrls: eventData.evidenceUrls,
          metadata: {
            category: eventData.category,
            pointsEarned: eventData.pointsEarned,
            notes: eventData.notes
          }
        },
        visibility: 'family'
      });

      this.logger.info('Task completion social post created', {
        taskId: eventData.taskId,
        userId: eventData.userId,
        familyId: eventData.familyId
      });

    } catch (error) {
      this.logger.error('Failed to create task completion post', {
        error,
        taskId: eventData.taskId,
        userId: eventData.userId
      });
    }
  }

  private async handleAchievementUnlocked(eventData: {
    achievementId: string;
    userId: string;
    familyId: string;
    achievementName: string;
    achievementDescription: string;
    rarity: string;
    pointsRewarded: number;
  }): Promise<void> {
    try {
      const rarityEmoji = {
        'common': '🥉',
        'rare': '🥈', 
        'epic': '🥇',
        'legendary': '👑'
      }[eventData.rarity] || '🏆';

      await this.socialService.createPost(eventData.familyId, eventData.userId, {
        type: PostType.ACHIEVEMENT,
        content: {
          text: `${rarityEmoji} 解锁新成就："${eventData.achievementName}"！\n${eventData.achievementDescription}`,
          achievementId: eventData.achievementId,
          metadata: {
            achievementName: eventData.achievementName,
            rarity: eventData.rarity,
            pointsRewarded: eventData.pointsRewarded
          }
        },
        visibility: 'family'
      });

      this.logger.info('Achievement social post created', {
        achievementId: eventData.achievementId,
        userId: eventData.userId,
        familyId: eventData.familyId
      });

    } catch (error) {
      this.logger.error('Failed to create achievement post', {
        error,
        achievementId: eventData.achievementId,
        userId: eventData.userId
      });
    }
  }

  private async handleLevelUp(eventData: {
    userId: string;
    familyId: string;
    oldLevel: number;
    newLevel: number;
    category: string;
    xpEarned: number;
    newPermissions?: string[];
  }): Promise<void> {
    try {
      const categoryNames = {
        'exercise': '运动',
        'reading': '阅读', 
        'chores': '家务',
        'learning': '学习',
        'creativity': '创意',
        'overall': '综合'
      };

      const categoryName = categoryNames[eventData.category as keyof typeof categoryNames] || eventData.category;

      await this.socialService.createPost(eventData.familyId, eventData.userId, {
        type: PostType.MILESTONE,
        content: {
          text: `🎊 ${categoryName}等级提升！从 Lv.${eventData.oldLevel} 升到 Lv.${eventData.newLevel}！`,
          metadata: {
            category: eventData.category,
            oldLevel: eventData.oldLevel,
            newLevel: eventData.newLevel,
            xpEarned: eventData.xpEarned,
            newPermissions: eventData.newPermissions
          }
        },
        visibility: 'family'
      });

      this.logger.info('Level up social post created', {
        userId: eventData.userId,
        familyId: eventData.familyId,
        category: eventData.category,
        newLevel: eventData.newLevel
      });

    } catch (error) {
      this.logger.error('Failed to create level up post', {
        error,
        userId: eventData.userId,
        category: eventData.category
      });
    }
  }

  private async handleStreakMilestone(eventData: {
    userId: string;
    familyId: string;
    category: string;
    streakDays: number;
    milestone: number;
    bonusPoints: number;
  }): Promise<void> {
    try {
      const milestoneEmojis = {
        7: '🔥',
        30: '💪',
        100: '🏆',
        365: '👑'
      };

      const emoji = milestoneEmojis[eventData.milestone as keyof typeof milestoneEmojis] || '⭐';
      
      await this.socialService.createPost(eventData.familyId, eventData.userId, {
        type: PostType.MILESTONE,
        content: {
          text: `${emoji} 连击里程碑！${eventData.category}类任务已连续完成 ${eventData.streakDays} 天！获得奖励积分 ${eventData.bonusPoints}`,
          metadata: {
            category: eventData.category,
            streakDays: eventData.streakDays,
            milestone: eventData.milestone,
            bonusPoints: eventData.bonusPoints
          }
        },
        visibility: 'family'
      });

      this.logger.info('Streak milestone social post created', {
        userId: eventData.userId,
        familyId: eventData.familyId,
        category: eventData.category,
        streakDays: eventData.streakDays
      });

    } catch (error) {
      this.logger.error('Failed to create streak milestone post', {
        error,
        userId: eventData.userId,
        category: eventData.category
      });
    }
  }

  private async handleChallengeProgress(eventData: {
    taskId: string;
    userId: string;
    familyId: string;
    category: string;
    pointsEarned: number;
  }): Promise<void> {
    try {
      // Update challenge progress for this user
      await this.socialService.updateChallengeProgress(
        eventData.userId,
        eventData.familyId,
        {
          tasksCompleted: 1,
          pointsEarned: eventData.pointsEarned,
          daysActive: 1 // Would need more sophisticated tracking in real implementation
        }
      );

      this.logger.info('Challenge progress updated', {
        userId: eventData.userId,
        familyId: eventData.familyId,
        category: eventData.category
      });

    } catch (error) {
      this.logger.error('Failed to update challenge progress', {
        error,
        userId: eventData.userId,
        familyId: eventData.familyId
      });
    }
  }
}
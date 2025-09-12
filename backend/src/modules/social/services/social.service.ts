import mongoose from 'mongoose';
import { 
  SocialPost, ISocialPost, 
  SocialComment, ISocialComment,
  FamilyChallenge, IFamilyChallenge,
  FamilyStats, IFamilyStats,
  PostType, PostVisibility
} from '../models/social.model';
import { EventBus } from '@shared/events/event-bus';
import { Logger } from '@shared/utils/logger';
import { CacheService } from '@shared/services/cache.service';

export interface CreatePostDTO {
  type: PostType;
  content: {
    text?: string;
    imageUrls?: string[];
    taskId?: string;
    achievementId?: string;
    metadata?: Record<string, any>;
  };
  visibility?: PostVisibility;
}

export interface CreateCommentDTO {
  content: {
    text: string;
    mentions?: string[];
  };
  parentCommentId?: string;
}

export interface CreateChallengeDTO {
  title: string;
  description: string;
  type: 'individual' | 'team' | 'family';
  requirements: {
    taskCategories: string[];
    minTasks?: number;
    minPoints?: number;
    targetDays?: number;
  };
  rewards: {
    pointsPerMember: number;
    badgeCode?: string;
    specialReward?: string;
  };
  startDate: Date;
  endDate: Date;
}

export interface FeedOptions {
  limit?: number;
  cursor?: string;
  types?: PostType[];
  userId?: string;
}

export interface ChallengeProgress {
  tasksCompleted: number;
  pointsEarned: number;
  daysActive: number;
}

export class SocialService {
  private eventBus: EventBus;
  private logger: Logger;
  private cacheService: CacheService;

  constructor(eventBus?: EventBus, cacheService?: CacheService) {
    this.eventBus = eventBus || new EventBus();
    this.logger = new Logger('SocialService');
    this.cacheService = cacheService || new CacheService();
  }

  // Posts Management
  async createPost(
    familyId: string, 
    userId: string, 
    data: CreatePostDTO
  ): Promise<ISocialPost> {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      
      const post = new SocialPost({
        familyId,
        userId,
        type: data.type,
        content: data.content,
        visibility: data.visibility || PostVisibility.FAMILY,
        reactions: { likes: [], celebrates: [], hearts: [] },
        commentsCount: 0
      });

      await post.save({ session });

      // Update family stats
      await this.updateFamilyStats(familyId, 'post_created');

      // Emit event for notifications
      await this.eventBus.publish('social.post_created', {
        postId: post._id,
        familyId,
        userId,
        type: data.type,
        content: data.content
      });

      await session.commitTransaction();

      // Clear family feed cache
      await this.cacheService.delete(`family_feed:${familyId}`);

      this.logger.info('Post created successfully', { postId: post._id, familyId, userId });
      return post;

    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Failed to create post', { error, familyId, userId });
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getFamilyFeed(
    familyId: string, 
    options: FeedOptions = {}
  ): Promise<{ posts: ISocialPost[]; nextCursor?: string }> {
    const { limit = 20, cursor, types, userId } = options;
    
    // Try cache first
    const cacheKey = `family_feed:${familyId}:${JSON.stringify(options)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const query: any = { 
      familyId,
      visibility: PostVisibility.FAMILY 
    };

    if (types && types.length > 0) {
      query.type = { $in: types };
    }

    if (userId) {
      query.userId = userId;
    }

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const posts = await SocialPost
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean()
      .exec();

    const hasMore = posts.length > limit;
    const resultPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? resultPosts[resultPosts.length - 1]._id : undefined;

    const result = { posts: resultPosts as ISocialPost[], nextCursor };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async reactToPost(
    postId: string,
    userId: string,
    familyId: string,
    reactionType: 'like' | 'celebrate' | 'heart'
  ): Promise<{ success: boolean; currentReactions: any }> {
    const post = await SocialPost.findOne({ _id: postId, familyId });
    if (!post) {
      throw new Error('Post not found');
    }

    const reactionField = `reactions.${reactionType}s`;
    const hasReacted = post.reactions[`${reactionType}s`].includes(userId);

    let updateOperation;
    if (hasReacted) {
      // Remove reaction
      updateOperation = { $pull: { [reactionField]: userId } };
    } else {
      // Add reaction (remove from other reaction types first)
      updateOperation = {
        $pull: {
          'reactions.likes': userId,
          'reactions.celebrates': userId,
          'reactions.hearts': userId
        }
      };
      
      // Then add to the new reaction type
      await SocialPost.updateOne({ _id: postId }, updateOperation);
      updateOperation = { $push: { [reactionField]: userId } };
    }

    const updatedPost = await SocialPost.findByIdAndUpdate(
      postId,
      updateOperation,
      { new: true }
    );

    // Update family stats
    await this.updateFamilyStats(familyId, hasReacted ? 'reaction_removed' : 'reaction_added');

    // Emit event for notifications
    if (!hasReacted) {
      await this.eventBus.publish('social.post_reacted', {
        postId,
        reactorId: userId,
        authorId: post.userId,
        reactionType,
        familyId
      });
    }

    return {
      success: true,
      currentReactions: updatedPost?.reactions || post.reactions
    };
  }

  // Comments Management
  async addComment(
    postId: string,
    familyId: string,
    userId: string,
    data: CreateCommentDTO
  ): Promise<ISocialComment> {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();

      // Verify post exists and belongs to family
      const post = await SocialPost.findOne({ _id: postId, familyId });
      if (!post) {
        throw new Error('Post not found');
      }

      const comment = new SocialComment({
        postId,
        familyId,
        userId,
        content: data.content,
        parentCommentId: data.parentCommentId,
        reactions: { likes: [], hearts: [] }
      });

      await comment.save({ session });

      // Increment comment count on post
      await SocialPost.findByIdAndUpdate(
        postId,
        { $inc: { commentsCount: 1 } },
        { session }
      );

      // Update family stats
      await this.updateFamilyStats(familyId, 'comment_created');

      // Emit event for notifications
      await this.eventBus.publish('social.comment_created', {
        commentId: comment._id,
        postId,
        familyId,
        userId,
        authorId: post.userId,
        content: data.content
      });

      await session.commitTransaction();

      this.logger.info('Comment created successfully', { 
        commentId: comment._id, 
        postId, 
        familyId, 
        userId 
      });

      return comment;

    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Failed to create comment', { error, postId, familyId, userId });
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getPostComments(
    postId: string,
    familyId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<{ comments: ISocialComment[]; nextCursor?: string }> {
    const query: any = { postId, familyId };
    
    if (cursor) {
      query._id = { $gt: cursor };
    }

    const comments = await SocialComment
      .find(query)
      .sort({ createdAt: 1 })
      .limit(limit + 1)
      .lean()
      .exec();

    const hasMore = comments.length > limit;
    const resultComments = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore ? resultComments[resultComments.length - 1]._id : undefined;

    return { 
      comments: resultComments as ISocialComment[], 
      nextCursor 
    };
  }

  // Family Challenges Management
  async createChallenge(
    familyId: string,
    createdBy: string,
    data: CreateChallengeDTO
  ): Promise<IFamilyChallenge> {
    const challenge = new FamilyChallenge({
      familyId,
      createdBy,
      title: data.title,
      description: data.description,
      type: data.type,
      requirements: data.requirements,
      rewards: data.rewards,
      participants: [],
      status: 'draft',
      startDate: data.startDate,
      endDate: data.endDate
    });

    await challenge.save();

    // Emit event for notifications
    await this.eventBus.publish('social.challenge_created', {
      challengeId: challenge._id,
      familyId,
      createdBy,
      title: data.title,
      type: data.type
    });

    this.logger.info('Challenge created successfully', { 
      challengeId: challenge._id, 
      familyId, 
      createdBy 
    });

    return challenge;
  }

  async joinChallenge(
    challengeId: string,
    familyId: string,
    userId: string
  ): Promise<{ success: boolean; challenge: IFamilyChallenge }> {
    const challenge = await FamilyChallenge.findOne({ 
      _id: challengeId, 
      familyId,
      status: { $in: ['draft', 'active'] }
    });

    if (!challenge) {
      throw new Error('Challenge not found or not joinable');
    }

    // Check if already joined
    const alreadyJoined = challenge.participants.some(p => p.userId === userId);
    if (alreadyJoined) {
      throw new Error('Already joined this challenge');
    }

    challenge.participants.push({
      userId,
      joinedAt: new Date(),
      progress: {
        tasksCompleted: 0,
        pointsEarned: 0,
        daysActive: 0
      },
      completed: false
    });

    await challenge.save();

    // Emit event for notifications
    await this.eventBus.publish('social.challenge_joined', {
      challengeId,
      familyId,
      userId,
      challengeTitle: challenge.title
    });

    this.logger.info('User joined challenge', { challengeId, familyId, userId });

    return { success: true, challenge };
  }

  async updateChallengeProgress(
    userId: string,
    familyId: string,
    progress: Partial<ChallengeProgress>
  ): Promise<void> {
    const activeChallenges = await FamilyChallenge.find({
      familyId,
      status: 'active',
      'participants.userId': userId,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    for (const challenge of activeChallenges) {
      const participant = challenge.participants.find(p => p.userId === userId);
      if (!participant || participant.completed) continue;

      // Update progress
      if (progress.tasksCompleted) {
        participant.progress.tasksCompleted += progress.tasksCompleted;
      }
      if (progress.pointsEarned) {
        participant.progress.pointsEarned += progress.pointsEarned;
      }
      if (progress.daysActive) {
        participant.progress.daysActive = Math.max(
          participant.progress.daysActive, 
          progress.daysActive
        );
      }

      // Check if challenge is completed
      const req = challenge.requirements;
      const prog = participant.progress;
      
      const isCompleted = (
        (!req.minTasks || prog.tasksCompleted >= req.minTasks) &&
        (!req.minPoints || prog.pointsEarned >= req.minPoints) &&
        (!req.targetDays || prog.daysActive >= req.targetDays)
      );

      if (isCompleted && !participant.completed) {
        participant.completed = true;
        participant.completedAt = new Date();

        // Award challenge rewards
        await this.eventBus.publish('social.challenge_completed', {
          challengeId: challenge._id,
          familyId,
          userId,
          rewards: challenge.rewards
        });

        this.logger.info('Challenge completed by user', { 
          challengeId: challenge._id, 
          familyId, 
          userId 
        });
      }

      await challenge.save();
    }
  }

  async getFamilyChallenges(
    familyId: string,
    status?: string,
    type?: string,
    limit: number = 20,
    cursor?: string
  ): Promise<{ challenges: IFamilyChallenge[]; nextCursor?: string }> {
    const query: any = { familyId };
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (cursor) query._id = { $lt: cursor };

    const challenges = await FamilyChallenge
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean()
      .exec();

    const hasMore = challenges.length > limit;
    const resultChallenges = hasMore ? challenges.slice(0, limit) : challenges;
    const nextCursor = hasMore ? resultChallenges[resultChallenges.length - 1]._id : undefined;

    return { 
      challenges: resultChallenges as IFamilyChallenge[], 
      nextCursor 
    };
  }

  // Family Stats Management
  private async updateFamilyStats(
    familyId: string, 
    action: 'post_created' | 'comment_created' | 'reaction_added' | 'reaction_removed'
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updateData: any = {};
    
    switch (action) {
      case 'post_created':
        updateData['$inc'] = { 'stats.totalPosts': 1 };
        break;
      case 'comment_created':
        updateData['$inc'] = { 'stats.totalComments': 1 };
        break;
      case 'reaction_added':
        updateData['$inc'] = { 'stats.totalReactions': 1 };
        break;
      case 'reaction_removed':
        updateData['$inc'] = { 'stats.totalReactions': -1 };
        break;
    }

    await FamilyStats.findOneAndUpdate(
      {
        familyId,
        period: 'daily',
        date: today
      },
      updateData,
      {
        upsert: true,
        new: true
      }
    );
  }

  async getFamilyStats(
    familyId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    startDate?: Date,
    endDate?: Date
  ): Promise<IFamilyStats[]> {
    const query: any = { familyId, period };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    return await FamilyStats
      .find(query)
      .sort({ date: -1 })
      .limit(30)
      .lean()
      .exec() as IFamilyStats[];
  }
}
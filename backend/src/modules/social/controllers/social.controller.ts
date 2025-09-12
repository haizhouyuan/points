import { Request, Response, NextFunction } from 'express';
import { SocialService } from '../services/social.service';
import { AuthenticatedRequest } from '@shared/types/auth';
import { Logger } from '@shared/utils/logger';
import { PostType } from '../models/social.model';

export class SocialController {
  private socialService: SocialService;
  private logger: Logger;

  constructor() {
    this.socialService = new SocialService();
    this.logger = new Logger('SocialController');
  }

  // Posts endpoints
  createPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { familyId, userId } = req.user!;
      const postData = req.body;

      const post = await this.socialService.createPost(familyId, userId, postData);

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: post,
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to create post', { error, userId: req.user?.userId });
      next(error);
    }
  };

  getFamilyFeed = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.user!;
      const { limit, cursor, types, userId } = req.query;

      const options = {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        cursor: cursor as string,
        types: types ? (types as string).split(',') as PostType[] : undefined,
        userId: userId as string
      };

      const result = await this.socialService.getFamilyFeed(familyId, options);

      res.json({
        success: true,
        data: {
          posts: result.posts,
          pagination: {
            nextCursor: result.nextCursor,
            hasMore: !!result.nextCursor
          }
        },
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to get family feed', { error, familyId: req.user?.familyId });
      next(error);
    }
  };

  getPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.user!;
      const { postId } = req.params;

      // This would typically fetch a single post - simplified for now
      const result = await this.socialService.getFamilyFeed(familyId, { limit: 1 });
      const post = result.posts.find(p => p._id === postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
          requestId: req.requestId
        });
      }

      res.json({
        success: true,
        data: post,
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to get post', { error, postId: req.params.postId });
      next(error);
    }
  };

  reactToPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { familyId, userId } = req.user!;
      const { postId } = req.params;
      const { reactionType } = req.body;

      const result = await this.socialService.reactToPost(
        postId,
        userId,
        familyId,
        reactionType
      );

      res.json({
        success: true,
        message: result.success ? 'Reaction updated' : 'Reaction failed',
        data: {
          currentReactions: result.currentReactions
        },
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to react to post', { 
        error, 
        postId: req.params.postId,
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  // Comments endpoints
  addComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { familyId, userId } = req.user!;
      const { postId } = req.params;
      const commentData = req.body;

      const comment = await this.socialService.addComment(
        postId,
        familyId,
        userId,
        commentData
      );

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment,
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to add comment', { 
        error, 
        postId: req.params.postId,
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  getPostComments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.user!;
      const { postId } = req.params;
      const { limit, cursor } = req.query;

      const result = await this.socialService.getPostComments(
        postId,
        familyId,
        limit ? parseInt(limit as string, 10) : undefined,
        cursor as string
      );

      res.json({
        success: true,
        data: {
          comments: result.comments,
          pagination: {
            nextCursor: result.nextCursor,
            hasMore: !!result.nextCursor
          }
        },
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to get post comments', { 
        error, 
        postId: req.params.postId,
        familyId: req.user?.familyId 
      });
      next(error);
    }
  };

  updateComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      const { commentId } = req.params;
      const updateData = req.body;

      // Simplified update - would need proper implementation
      res.json({
        success: true,
        message: 'Comment update feature coming soon',
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to update comment', { 
        error, 
        commentId: req.params.commentId,
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  deleteComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      const { commentId } = req.params;

      // Simplified delete - would need proper implementation
      res.json({
        success: true,
        message: 'Comment deletion feature coming soon',
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to delete comment', { 
        error, 
        commentId: req.params.commentId,
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  // Challenges endpoints
  createChallenge = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { familyId, userId } = req.user!;
      const challengeData = req.body;

      const challenge = await this.socialService.createChallenge(
        familyId,
        userId,
        challengeData
      );

      res.status(201).json({
        success: true,
        message: 'Challenge created successfully',
        data: challenge,
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to create challenge', { error, userId: req.user?.userId });
      next(error);
    }
  };

  getFamilyChallenges = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.user!;
      const { status, type, limit, cursor } = req.query;

      const result = await this.socialService.getFamilyChallenges(
        familyId,
        status as string,
        type as string,
        limit ? parseInt(limit as string, 10) : undefined,
        cursor as string
      );

      res.json({
        success: true,
        data: {
          challenges: result.challenges,
          pagination: {
            nextCursor: result.nextCursor,
            hasMore: !!result.nextCursor
          }
        },
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to get family challenges', { 
        error, 
        familyId: req.user?.familyId 
      });
      next(error);
    }
  };

  getChallenge = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.user!;
      const { challengeId } = req.params;

      // Simplified - would fetch single challenge
      const result = await this.socialService.getFamilyChallenges(familyId);
      const challenge = result.challenges.find(c => c._id === challengeId);

      if (!challenge) {
        return res.status(404).json({
          success: false,
          message: 'Challenge not found',
          requestId: req.requestId
        });
      }

      res.json({
        success: true,
        data: challenge,
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to get challenge', { 
        error, 
        challengeId: req.params.challengeId 
      });
      next(error);
    }
  };

  joinChallenge = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { familyId, userId } = req.user!;
      const { challengeId } = req.params;

      const result = await this.socialService.joinChallenge(challengeId, familyId, userId);

      res.json({
        success: true,
        message: 'Successfully joined challenge',
        data: result.challenge,
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to join challenge', { 
        error, 
        challengeId: req.params.challengeId,
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  updateChallenge = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      const { challengeId } = req.params;
      const updateData = req.body;

      // Simplified update - would need proper implementation
      res.json({
        success: true,
        message: 'Challenge update feature coming soon',
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to update challenge', { 
        error, 
        challengeId: req.params.challengeId,
        userId: req.user?.userId 
      });
      next(error);
    }
  };

  // Family Stats endpoints
  getFamilyStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.user!;
      const { period, startDate, endDate } = req.query;

      const stats = await this.socialService.getFamilyStats(
        familyId,
        period as 'daily' | 'weekly' | 'monthly',
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: stats,
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to get family stats', { 
        error, 
        familyId: req.user?.familyId 
      });
      next(error);
    }
  };

  // User activity feed (personal posts)
  getUserPosts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.user!;
      const { userId } = req.params;
      const { limit, cursor } = req.query;

      const result = await this.socialService.getFamilyFeed(familyId, {
        userId: userId || req.user!.userId,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        cursor: cursor as string
      });

      res.json({
        success: true,
        data: {
          posts: result.posts,
          pagination: {
            nextCursor: result.nextCursor,
            hasMore: !!result.nextCursor
          }
        },
        requestId: req.requestId
      });

    } catch (error) {
      this.logger.error('Failed to get user posts', { 
        error, 
        userId: req.params.userId || req.user?.userId 
      });
      next(error);
    }
  };
}
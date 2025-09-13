import { Router } from 'express';
import { SocialController } from '../controllers/social.controller';
import { RateLimitMiddleware } from '@shared/middleware/rate-limit';
import { validateBody, validateQuery, validateParams } from '@shared/middleware/validation';
import { AuthMiddleware } from '@shared/middleware/auth';
import {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  updateCommentSchema,
  reactToPostSchema,
  reactToCommentSchema,
  createChallengeSchema,
  updateChallengeSchema,
  joinChallengeSchema,
  getFeedSchema,
  getCommentsSchema,
  getChallengesSchema,
  getStatsSchema
} from '../validation/social.validation';
import Joi from 'joi';

const router = Router();
const socialController = new SocialController();

// Posts Management Routes
router.post(
  '/posts',
  RateLimitMiddleware.createUserRateLimit(10, 1), // 10 posts per minute
  validateBody(createPostSchema),
  socialController.createPost
);

router.get(
  '/feed',
  RateLimitMiddleware.createUserRateLimit(60, 1), // 60 requests per minute
  validateQuery(getFeedSchema),
  socialController.getFamilyFeed
);

router.get(
  '/posts/:postId',
  RateLimitMiddleware.createUserRateLimit(100, 1),
  validateParams(Joi.object({ postId: Joi.string().required() })),
  socialController.getPost
);

router.post(
  '/posts/:postId/react',
  RateLimitMiddleware.createUserRateLimit(30, 1), // 30 reactions per minute
  validateParams(Joi.object({ postId: Joi.string().required() })),
  validateBody(reactToPostSchema),
  socialController.reactToPost
);

// Comments Management Routes
router.post(
  '/posts/:postId/comments',
  RateLimitMiddleware.createUserRateLimit(15, 1), // 15 comments per minute
  validateParams(Joi.object({ postId: Joi.string().required() })),
  validateBody(createCommentSchema),
  socialController.addComment
);

router.get(
  '/posts/:postId/comments',
  RateLimitMiddleware.createUserRateLimit(100, 1),
  validateParams(Joi.object({ postId: Joi.string().required() })),
  validateQuery(getCommentsSchema),
  socialController.getPostComments
);

router.put(
  '/comments/:commentId',
  RateLimitMiddleware.createUserRateLimit(20, 1),
  validateParams(Joi.object({ commentId: Joi.string().required() })),
  validateBody(updateCommentSchema),
  socialController.updateComment
);

router.delete(
  '/comments/:commentId',
  RateLimitMiddleware.createUserRateLimit(20, 1),
  validateParams(Joi.object({ commentId: Joi.string().required() })),
  socialController.deleteComment
);

// Family Challenges Routes
router.post(
  '/challenges',
  RateLimitMiddleware.createUserRateLimit(5, 10), // 5 challenges per 10 minutes
  AuthMiddleware.requireParent(), // Only parents can create challenges
  validateBody(createChallengeSchema),
  socialController.createChallenge
);

router.get(
  '/challenges',
  RateLimitMiddleware.createUserRateLimit(60, 1),
  validateQuery(getChallengesSchema),
  socialController.getFamilyChallenges
);

router.get(
  '/challenges/:challengeId',
  RateLimitMiddleware.createUserRateLimit(100, 1),
  validateParams(Joi.object({ challengeId: Joi.string().required() })),
  socialController.getChallenge
);

router.post(
  '/challenges/:challengeId/join',
  RateLimitMiddleware.createUserRateLimit(10, 1),
  validateParams(Joi.object({ challengeId: Joi.string().required() })),
  socialController.joinChallenge
);

router.put(
  '/challenges/:challengeId',
  RateLimitMiddleware.createUserRateLimit(10, 1),
  AuthMiddleware.requireParent(), // Only parents can update challenges
  validateParams(Joi.object({ challengeId: Joi.string().required() })),
  validateBody(updateChallengeSchema),
  socialController.updateChallenge
);

// Family Stats Routes
router.get(
  '/stats',
  RateLimitMiddleware.createUserRateLimit(30, 1),
  validateQuery(getStatsSchema),
  socialController.getFamilyStats
);

// User Activity Routes
router.get(
  '/users/:userId/posts',
  RateLimitMiddleware.createUserRateLimit(60, 1),
  validateParams(Joi.object({ userId: Joi.string().required() })),
  validateQuery(getFeedSchema),
  socialController.getUserPosts
);

router.get(
  '/my-posts',
  RateLimitMiddleware.createUserRateLimit(60, 1),
  validateQuery(getFeedSchema),
  socialController.getUserPosts
);

// Additional specialized routes for engagement

// Get trending posts (most reactions/comments in last 24h)
router.get(
  '/trending',
  RateLimitMiddleware.createUserRateLimit(30, 1),
  validateQuery(getFeedSchema),
  socialController.getFamilyFeed // Would need special trending logic
);

// Get family activity summary
router.get(
  '/activity-summary',
  RateLimitMiddleware.createUserRateLimit(20, 1),
  validateQuery(getStatsSchema),
  socialController.getFamilyStats
);

// Family milestone celebrations
router.get(
  '/milestones',
  RateLimitMiddleware.createUserRateLimit(30, 1),
  validateQuery(Joi.object({
    period: Joi.string().valid('week', 'month', 'year').default('month'),
    type: Joi.string().valid('task', 'points', 'streak', 'achievement').optional()
  })),
  socialController.getFamilyFeed // Would filter for milestone posts
);

export { router as socialRoutes };
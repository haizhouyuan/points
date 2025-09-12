import Joi from 'joi';
import { PostType, PostVisibility } from '../models/social.model';

export const createPostSchema = Joi.object({
  type: Joi.string().valid(...Object.values(PostType)).required(),
  content: Joi.object({
    text: Joi.string().max(2000).when('type', {
      is: PostType.TEXT,
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    imageUrls: Joi.array().items(Joi.string().uri()).max(5).optional(),
    taskId: Joi.string().when('type', {
      is: PostType.TASK_COMPLETION,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    achievementId: Joi.string().when('type', {
      is: PostType.ACHIEVEMENT,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    metadata: Joi.object().optional()
  }).required(),
  visibility: Joi.string().valid(...Object.values(PostVisibility)).default(PostVisibility.FAMILY)
});

export const updatePostSchema = Joi.object({
  content: Joi.object({
    text: Joi.string().max(2000).optional(),
    imageUrls: Joi.array().items(Joi.string().uri()).max(5).optional(),
    metadata: Joi.object().optional()
  }).optional(),
  visibility: Joi.string().valid(...Object.values(PostVisibility)).optional()
});

export const createCommentSchema = Joi.object({
  content: Joi.object({
    text: Joi.string().max(1000).required(),
    mentions: Joi.array().items(Joi.string()).max(10).optional()
  }).required(),
  parentCommentId: Joi.string().optional()
});

export const updateCommentSchema = Joi.object({
  content: Joi.object({
    text: Joi.string().max(1000).required(),
    mentions: Joi.array().items(Joi.string()).max(10).optional()
  }).required()
});

export const reactToPostSchema = Joi.object({
  reactionType: Joi.string().valid('like', 'celebrate', 'heart').required()
});

export const reactToCommentSchema = Joi.object({
  reactionType: Joi.string().valid('like', 'heart').required()
});

export const createChallengeSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().max(1000).required(),
  type: Joi.string().valid('individual', 'team', 'family').required(),
  requirements: Joi.object({
    taskCategories: Joi.array().items(Joi.string()).min(1).required(),
    minTasks: Joi.number().integer().min(1).optional(),
    minPoints: Joi.number().integer().min(1).optional(),
    targetDays: Joi.number().integer().min(1).max(365).optional()
  }).required(),
  rewards: Joi.object({
    pointsPerMember: Joi.number().integer().min(1).required(),
    badgeCode: Joi.string().optional(),
    specialReward: Joi.string().max(500).optional()
  }).required(),
  startDate: Joi.date().min('now').required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required()
});

export const updateChallengeSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  description: Joi.string().max(1000).optional(),
  requirements: Joi.object({
    taskCategories: Joi.array().items(Joi.string()).min(1).optional(),
    minTasks: Joi.number().integer().min(1).optional(),
    minPoints: Joi.number().integer().min(1).optional(),
    targetDays: Joi.number().integer().min(1).max(365).optional()
  }).optional(),
  rewards: Joi.object({
    pointsPerMember: Joi.number().integer().min(1).optional(),
    badgeCode: Joi.string().optional(),
    specialReward: Joi.string().max(500).optional()
  }).optional(),
  startDate: Joi.date().min('now').optional(),
  endDate: Joi.date().greater(Joi.ref('startDate')).optional()
});

export const joinChallengeSchema = Joi.object({
  challengeId: Joi.string().required()
});

export const getFeedSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(20),
  cursor: Joi.string().optional(),
  types: Joi.array().items(Joi.string().valid(...Object.values(PostType))).optional(),
  userId: Joi.string().optional()
});

export const getCommentsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  cursor: Joi.string().optional()
});

export const getChallengesSchema = Joi.object({
  status: Joi.string().valid('draft', 'active', 'completed', 'cancelled').optional(),
  type: Joi.string().valid('individual', 'team', 'family').optional(),
  limit: Joi.number().integer().min(1).max(50).default(20),
  cursor: Joi.string().optional()
});

export const getStatsSchema = Joi.object({
  period: Joi.string().valid('daily', 'weekly', 'monthly').default('weekly'),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional()
});
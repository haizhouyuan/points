import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { rateLimit } from '@shared/middleware/rate-limit';
import { validateBody, validateParams, validateQuery } from '@shared/middleware/validation';
import Joi from 'joi';

const router = Router();
const fileController = new FileController();

// 验证规则
const fileQuerySchema = Joi.object({
  relatedTo: Joi.string().valid('task', 'avatar', 'social', 'achievement').optional(),
  relatedId: Joi.string().optional(),
  mimetype: Joi.string().optional(),
  tags: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  processingStatus: Joi.string().valid('pending', 'processing', 'completed', 'failed').optional()
});

const uploadBodySchema = Joi.object({
  relatedTo: Joi.string().valid('task', 'avatar', 'social', 'achievement').required(),
  relatedId: Joi.string().required(),
  tags: Joi.string().optional(),
  isPublic: Joi.string().valid('true', 'false').optional(),
  expiresIn: Joi.number().integer().min(3600).max(31536000).optional() // 1小时到1年
});

const updateFileSchema = Joi.object({
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  isPublic: Joi.boolean().optional()
});

const deleteFilesSchema = Joi.object({
  fileIds: Joi.array().items(Joi.string()).min(1).max(20).required()
});

const searchQuerySchema = Joi.object({
  keyword: Joi.string().min(1).max(100).optional(),
  type: Joi.string().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

// === 基础文件操作 ===

// 上传文件
router.post(
  '/upload',
  rateLimit({ windowMs: 60000, max: 20 }), // 每分钟20次
  fileController.uploadMiddleware,
  validateBody(uploadBodySchema),
  fileController.uploadFiles
);

// 获取文件列表
router.get(
  '/',
  rateLimit({ windowMs: 60000, max: 100 }),
  validateQuery(fileQuerySchema),
  fileController.getFiles
);

// 获取单个文件信息
router.get(
  '/:fileId',
  rateLimit({ windowMs: 60000, max: 200 }),
  validateParams({ fileId: Joi.string().required() }),
  fileController.getFile
);

// 下载文件
router.get(
  '/:fileId/download',
  rateLimit({ windowMs: 60000, max: 50 }),
  validateParams({ fileId: Joi.string().required() }),
  fileController.downloadFile
);

// 更新文件元数据
router.put(
  '/:fileId',
  rateLimit({ windowMs: 60000, max: 30 }),
  validateParams({ fileId: Joi.string().required() }),
  validateBody(updateFileSchema),
  fileController.updateFile
);

// 删除单个文件
router.delete(
  '/:fileId',
  rateLimit({ windowMs: 60000, max: 30 }),
  validateParams({ fileId: Joi.string().required() }),
  fileController.deleteFile
);

// 批量删除文件
router.post(
  '/batch-delete',
  rateLimit({ windowMs: 60000, max: 10 }),
  validateBody(deleteFilesSchema),
  fileController.deleteFiles
);

// === 特定用途的文件查询 ===

// 获取任务相关文件
router.get(
  '/tasks/:taskId/files',
  rateLimit({ windowMs: 60000, max: 100 }),
  validateParams({ taskId: Joi.string().required() }),
  fileController.getTaskFiles
);

// 获取用户头像文件
router.get(
  '/avatars/:targetUserId?',
  rateLimit({ windowMs: 60000, max: 50 }),
  validateParams({ targetUserId: Joi.string().optional() }),
  fileController.getAvatarFiles
);

// 获取社交动态文件
router.get(
  '/social/:postId/files',
  rateLimit({ windowMs: 60000, max: 100 }),
  validateParams({ postId: Joi.string().required() }),
  fileController.getSocialFiles
);

// === 统计和搜索 ===

// 获取存储统计
router.get(
  '/stats/storage',
  rateLimit({ windowMs: 60000, max: 20 }),
  fileController.getStorageStats
);

// 文件搜索
router.get(
  '/search/files',
  rateLimit({ windowMs: 60000, max: 50 }),
  validateQuery(searchQuerySchema),
  fileController.searchFiles
);

export { router as fileRoutes };
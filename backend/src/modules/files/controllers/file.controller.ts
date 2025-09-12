import { Request, Response, NextFunction } from 'express';
import { FileService, UploadFileOptions, FileQueryOptions } from '../services/file.service';
import { AppError } from '@shared/middleware/error-handler';
import { FileRelatedTo } from '@shared/types/common';
import multer from 'multer';
import path from 'path';

// Multer配置
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    files: 5 // 最多5个文件
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'application/pdf',
      'text/plain'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type not allowed: ${file.mimetype}`, 415));
    }
  }
});

export class FileController {
  private fileService: FileService;

  constructor() {
    this.fileService = new FileService();
  }

  // Multer中间件
  public uploadMiddleware = upload.array('files', 5);

  // 上传文件
  uploadFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, familyId } = req.user!;
      const { relatedTo, relatedId, tags, isPublic, expiresIn } = req.body;
      
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      if (!relatedTo || !relatedId) {
        throw new AppError('relatedTo and relatedId are required', 400);
      }

      const files = req.files as Express.Multer.File[];
      const uploadOptions: UploadFileOptions = {
        relatedTo: relatedTo as FileRelatedTo,
        relatedId,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        isPublic: isPublic === 'true',
        expiresAt: expiresIn ? new Date(Date.now() + parseInt(expiresIn) * 1000) : undefined
      };

      const uploadPromises = files.map(file => 
        this.fileService.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          userId,
          familyId,
          uploadOptions
        )
      );

      const uploadedFiles = await Promise.all(uploadPromises);

      res.status(201).json({
        success: true,
        data: {
          files: uploadedFiles.map(file => file.getFileInfo()),
          uploadedCount: uploadedFiles.length
        },
        message: 'Files uploaded successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取文件信息
  getFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId } = req.params;
      const { userId, familyId } = req.user!;

      const file = await this.fileService.getFile(fileId, userId, familyId);

      res.json({
        success: true,
        data: file.getFileInfo(),
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取文件列表
  getFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, familyId } = req.user!;
      const {
        relatedTo,
        relatedId,
        mimetype,
        tags,
        limit,
        offset,
        processingStatus
      } = req.query;

      const options: FileQueryOptions = {
        relatedTo: relatedTo as FileRelatedTo,
        relatedId: relatedId as string,
        mimetype: mimetype as string,
        tags: tags ? (tags as string).split(',').map(tag => tag.trim()) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        processingStatus: processingStatus as string
      };

      const result = await this.fileService.getFiles(userId, familyId, options);

      res.json({
        success: true,
        data: {
          files: result.files.map(file => file.getFileInfo()),
          pagination: result.pagination
        },
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 下载文件
  downloadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId } = req.params;
      const { userId, familyId } = req.user!;

      const file = await this.fileService.getFile(fileId, userId, familyId);

      // 设置下载头
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Content-Length', file.size);

      // 发送文件
      const absolutePath = path.join(
        process.env.UPLOAD_DIR || './uploads',
        file.path
      );

      res.download(absolutePath, file.originalName);
    } catch (error) {
      next(error);
    }
  };

  // 删除文件
  deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId } = req.params;
      const { userId, familyId } = req.user!;

      await this.fileService.deleteFile(fileId, userId, familyId);

      res.json({
        success: true,
        message: 'File deleted successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取存储统计
  getStorageStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.user!;

      const stats = await this.fileService.getStorageStats(familyId);

      res.json({
        success: true,
        data: stats,
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 批量删除文件
  deleteFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileIds } = req.body;
      const { userId, familyId } = req.user!;

      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        throw new AppError('File IDs array is required', 400);
      }

      const deletePromises = fileIds.map(fileId => 
        this.fileService.deleteFile(fileId, userId, familyId)
      );

      await Promise.all(deletePromises);

      res.json({
        success: true,
        data: {
          deletedCount: fileIds.length
        },
        message: 'Files deleted successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 更新文件元数据
  updateFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId } = req.params;
      const { userId, familyId } = req.user!;
      const { tags, isPublic } = req.body;

      const file = await this.fileService.getFile(fileId, userId, familyId);

      // 只有上传者可以更新文件元数据
      if (file.uploadedBy.toString() !== userId) {
        throw new AppError('Only file uploader can update file metadata', 403);
      }

      if (tags !== undefined) {
        file.tags = Array.isArray(tags) ? tags : [];
      }

      if (isPublic !== undefined) {
        file.isPublic = Boolean(isPublic);
      }

      await file.save();

      res.json({
        success: true,
        data: file.getFileInfo(),
        message: 'File updated successfully',
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取任务相关文件
  getTaskFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId } = req.params;
      const { userId, familyId } = req.user!;

      const options: FileQueryOptions = {
        relatedTo: 'task',
        relatedId: taskId,
        limit: 50
      };

      const result = await this.fileService.getFiles(userId, familyId, options);

      res.json({
        success: true,
        data: {
          files: result.files.map(file => file.getFileInfo()),
          taskId,
          totalFiles: result.pagination.total
        },
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取用户头像文件
  getAvatarFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, familyId } = req.user!;
      const { targetUserId } = req.params;

      const options: FileQueryOptions = {
        relatedTo: 'avatar',
        relatedId: targetUserId || userId,
        limit: 10
      };

      const result = await this.fileService.getFiles(userId, familyId, options);

      res.json({
        success: true,
        data: {
          files: result.files.map(file => file.getFileInfo()),
          userId: targetUserId || userId
        },
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取社交动态文件
  getSocialFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.params;
      const { userId, familyId } = req.user!;

      const options: FileQueryOptions = {
        relatedTo: 'social',
        relatedId: postId,
        limit: 20
      };

      const result = await this.fileService.getFiles(userId, familyId, options);

      res.json({
        success: true,
        data: {
          files: result.files.map(file => file.getFileInfo()),
          postId
        },
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };

  // 文件搜索
  searchFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, familyId } = req.user!;
      const { 
        keyword, 
        type, 
        dateFrom, 
        dateTo,
        limit,
        offset 
      } = req.query;

      // 构建搜索条件
      const options: FileQueryOptions = {
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0
      };

      if (type) {
        options.mimetype = type as string;
      }

      // 这里应该实现更复杂的搜索逻辑
      const result = await this.fileService.getFiles(userId, familyId, options);

      // 如果有关键词，在内存中进行简单过滤
      let filteredFiles = result.files;
      if (keyword) {
        const searchTerm = (keyword as string).toLowerCase();
        filteredFiles = result.files.filter(file => 
          file.originalName.toLowerCase().includes(searchTerm) ||
          file.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      res.json({
        success: true,
        data: {
          files: filteredFiles.map(file => file.getFileInfo()),
          pagination: {
            ...result.pagination,
            total: filteredFiles.length
          },
          searchParams: {
            keyword,
            type,
            dateFrom,
            dateTo
          }
        },
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  };
}
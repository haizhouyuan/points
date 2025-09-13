import mongoose from 'mongoose';
import { File, IFile } from '../models/file.model';
import { EventBus } from '@shared/events/event-bus';
import { AppError } from '@shared/middleware/error-handler';
import { FileRelatedTo } from '@shared/types/common';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export interface UploadFileOptions {
  relatedTo: FileRelatedTo;
  relatedId: string;
  tags?: string[];
  isPublic?: boolean;
  expiresAt?: Date;
}

export interface FileQueryOptions {
  relatedTo?: FileRelatedTo;
  relatedId?: string;
  mimetype?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  processingStatus?: string;
}

export class FileService {
  private eventBus: EventBus;
  private uploadDir: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
    this.allowedMimeTypes = [
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
  }

  // 上传文件
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
    uploadedBy: string,
    familyId: string,
    options: UploadFileOptions
  ): Promise<IFile> {
    // 验证文件
    this.validateFile(fileBuffer, originalName, mimetype);

    // 生成文件名和路径
    const filename = this.generateFilename(originalName);
    const relativePath = this.generateFilePath(filename, options.relatedTo);
    const absolutePath = path.join(this.uploadDir, relativePath);
    
    // 确保目录存在
    await this.ensureDirectoryExists(path.dirname(absolutePath));

    // 计算文件校验和
    const checksum = this.calculateChecksum(fileBuffer);

    // 检查重复文件
    const duplicateFile = await this.findDuplicateFile(checksum, familyId);
    if (duplicateFile) {
      // 如果是相同的关联对象，返回已存在的文件
      if (duplicateFile.relatedTo === options.relatedTo && 
          duplicateFile.relatedId.toString() === options.relatedId) {
        return duplicateFile;
      }
    }

    // 保存文件到磁盘
    await fs.writeFile(absolutePath, fileBuffer);

    // 生成文件URL
    const url = this.generateFileUrl(relativePath);

    // 创建数据库记录
    const fileRecord = new File({
      filename,
      originalName,
      mimetype,
      size: fileBuffer.length,
      path: relativePath,
      url,
      uploadedBy: new mongoose.Types.ObjectId(uploadedBy),
      familyId: new mongoose.Types.ObjectId(familyId),
      relatedTo: options.relatedTo,
      relatedId: new mongoose.Types.ObjectId(options.relatedId),
      metadata: {
        checksum,
        uploadSession: this.generateUploadSession()
      },
      tags: options.tags || [],
      isPublic: options.isPublic || false,
      expiresAt: options.expiresAt
    });

    await fileRecord.save();

    // 异步处理文件（生成缩略图等）
    this.processFileAsync(fileRecord._id.toString()).catch(error => {
      console.error('File processing failed:', error);
    });

    // 发布文件上传事件
    this.eventBus.emit('file.uploaded', {
      fileId: fileRecord._id,
      userId: uploadedBy,
      familyId,
      filename: fileRecord.filename,
      mimetype,
      size: fileRecord.size,
      relatedTo: options.relatedTo,
      relatedId: options.relatedId
    });

    return fileRecord;
  }

  // 获取文件信息
  async getFile(fileId: string, userId: string, familyId: string): Promise<IFile> {
    const file = await File.findById(fileId);
    
    if (!file) {
      throw new AppError('File not found', 404);
    }

    if (!file.canAccess(userId, familyId)) {
      throw new AppError('Access denied', 403);
    }

    if (file.isExpired()) {
      throw new AppError('File has expired', 410);
    }

    return file;
  }

  // 获取文件列表
  async getFiles(
    userId: string,
    familyId: string,
    options: FileQueryOptions = {}
  ): Promise<{
    files: IFile[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }> {
    const query: any = {
      familyId: new mongoose.Types.ObjectId(familyId)
    };

    // 应用过滤条件
    if (options.relatedTo) {
      query.relatedTo = options.relatedTo;
    }

    if (options.relatedId) {
      query.relatedId = new mongoose.Types.ObjectId(options.relatedId);
    }

    if (options.mimetype) {
      query.mimetype = { $regex: options.mimetype, $options: 'i' };
    }

    if (options.tags && options.tags.length > 0) {
      query.tags = { $in: options.tags };
    }

    if (options.processingStatus) {
      query.processingStatus = options.processingStatus;
    }

    const limit = options.limit || 20;
    const offset = options.offset || 0;

    const [files, total] = await Promise.all([
      File.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .populate('uploadedBy', 'name avatar'),
      File.countDocuments(query)
    ]);

    return {
      files,
      pagination: {
        limit,
        offset,
        total
      }
    };
  }

  // 删除文件
  async deleteFile(fileId: string, userId: string, familyId: string): Promise<void> {
    const file = await this.getFile(fileId, userId, familyId);

    // 只有上传者或家长可以删除文件
    const user = await mongoose.model('User').findById(userId);
    if (file.uploadedBy.toString() !== userId && user?.role !== 'parent') {
      throw new AppError('Only file uploader or parent can delete files', 403);
    }

    // 删除磁盘上的文件
    const absolutePath = path.join(this.uploadDir, file.path);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      console.error('Failed to delete file from disk:', error);
    }

    // 删除缩略图（如果存在）
    if (file.metadata.thumbnailUrl) {
      const thumbnailPath = file.metadata.thumbnailUrl.replace(this.generateFileUrl(''), '');
      const absoluteThumbnailPath = path.join(this.uploadDir, thumbnailPath);
      try {
        await fs.unlink(absoluteThumbnailPath);
      } catch (error) {
        console.error('Failed to delete thumbnail:', error);
      }
    }

    // 删除数据库记录
    await file.deleteOne();

    // 发布文件删除事件
    this.eventBus.emit('file.deleted', {
      fileId: file._id,
      userId,
      familyId,
      filename: file.filename,
      relatedTo: file.relatedTo,
      relatedId: file.relatedId
    });
  }

  // 获取存储统计
  async getStorageStats(familyId: string): Promise<{
    totalSize: number;
    totalFiles: number;
    typeBreakdown: any[];
    recentFiles: IFile[];
  }> {
    const [typeStats, recentFiles, totalStats] = await Promise.all([
      File.getStorageStats(familyId),
      File.findByFamily(familyId, 5, 0),
      File.aggregate([
        { $match: { familyId: new mongoose.Types.ObjectId(familyId) } },
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$size' },
            totalFiles: { $sum: 1 }
          }
        }
      ])
    ]);

    return {
      totalSize: totalStats[0]?.totalSize || 0,
      totalFiles: totalStats[0]?.totalFiles || 0,
      typeBreakdown: typeStats,
      recentFiles
    };
  }

  // 处理过期文件清理
  async cleanupExpiredFiles(): Promise<number> {
    const expiredFiles = await File.find({
      expiresAt: { $lt: new Date() }
    });

    let deletedCount = 0;

    for (const file of expiredFiles) {
      try {
        // 删除磁盘文件
        const absolutePath = path.join(this.uploadDir, file.path);
        await fs.unlink(absolutePath);

        // 删除数据库记录
        await file.deleteOne();
        deletedCount++;

        // 发布清理事件
        this.eventBus.emit('file.expired_cleaned', {
          fileId: file._id,
          filename: file.filename,
          familyId: file.familyId
        });
      } catch (error) {
        console.error(`Failed to cleanup expired file ${file._id}:`, error);
      }
    }

    return deletedCount;
  }

  // 批量处理待处理的文件
  async processPendingFiles(): Promise<number> {
    const pendingFiles = await File.getPendingProcessing(10);
    let processedCount = 0;

    for (const file of pendingFiles) {
      try {
        await this.processFile(file._id.toString());
        processedCount++;
      } catch (error) {
        console.error(`Failed to process file ${file._id}:`, error);
        await file.markProcessingFailed(error.message);
      }
    }

    return processedCount;
  }

  // 私有方法：验证文件
  private validateFile(fileBuffer: Buffer, originalName: string, mimetype: string): void {
    // 检查文件大小
    if (fileBuffer.length > this.maxFileSize) {
      throw new AppError(`File too large. Maximum size is ${this.maxFileSize} bytes`, 413);
    }

    // 检查MIME类型
    if (!this.allowedMimeTypes.includes(mimetype)) {
      throw new AppError(`File type not allowed: ${mimetype}`, 415);
    }

    // 检查文件名
    if (!originalName || originalName.length > 255) {
      throw new AppError('Invalid filename', 400);
    }

    // 简单的文件头验证
    this.validateFileHeader(fileBuffer, mimetype);
  }

  // 私有方法：验证文件头
  private validateFileHeader(fileBuffer: Buffer, mimetype: string): void {
    const signatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'application/pdf': [0x25, 0x50, 0x44, 0x46]
    };

    const signature = signatures[mimetype];
    if (signature && fileBuffer.length >= signature.length) {
      for (let i = 0; i < signature.length; i++) {
        if (fileBuffer[i] !== signature[i]) {
          throw new AppError('File content does not match declared type', 400);
        }
      }
    }
  }

  // 私有方法：生成文件名
  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}_${random}${ext}`;
  }

  // 私有方法：生成文件路径
  private generateFilePath(filename: string, relatedTo: FileRelatedTo): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return path.join(relatedTo, year.toString(), month, filename);
  }

  // 私有方法：生成文件URL
  private generateFileUrl(relativePath: string): string {
    const baseUrl = process.env.FILE_BASE_URL || '/uploads';
    return `${baseUrl}/${relativePath}`.replace(/\\/g, '/');
  }

  // 私有方法：确保目录存在
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  // 私有方法：计算校验和
  private calculateChecksum(fileBuffer: Buffer): string {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  // 私有方法：查找重复文件
  private async findDuplicateFile(checksum: string, familyId: string): Promise<IFile | null> {
    return File.findOne({
      'metadata.checksum': checksum,
      familyId: new mongoose.Types.ObjectId(familyId)
    });
  }

  // 私有方法：生成上传会话ID
  private generateUploadSession(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  // 私有方法：异步处理文件
  private async processFileAsync(fileId: string): Promise<void> {
    // 延迟处理，避免阻塞上传响应
    setTimeout(async () => {
      try {
        await this.processFile(fileId);
      } catch (error) {
        console.error('Async file processing failed:', error);
      }
    }, 1000);
  }

  // 私有方法：处理文件
  private async processFile(fileId: string): Promise<void> {
    const file = await File.findById(fileId);
    if (!file) return;

    await file.markProcessing();

    try {
      const metadata: Record<string, any> = {};

      // 图片处理
      if (file.isImage) {
        const imageMetadata = await this.processImage(file);
        Object.assign(metadata, imageMetadata);
      }

      // 视频处理
      if (file.isVideo) {
        const videoMetadata = await this.processVideo(file);
        Object.assign(metadata, videoMetadata);
      }

      await file.markProcessed(metadata);

      this.eventBus.emit('file.processed', {
        fileId: file._id,
        filename: file.filename,
        metadata
      });
    } catch (error) {
      await file.markProcessingFailed(error.message);
      throw error;
    }
  }

  // 私有方法：处理图片
  private async processImage(file: IFile): Promise<Record<string, any>> {
    // 这里应该集成图片处理库（如 sharp）
    // 暂时返回模拟数据
    return {
      width: 1920,
      height: 1080,
      thumbnailUrl: file.url.replace(/\.([^.]+)$/, '_thumb.$1')
    };
  }

  // 私有方法：处理视频
  private async processVideo(file: IFile): Promise<Record<string, any>> {
    // 这里应该集成视频处理库（如 ffmpeg）
    // 暂时返回模拟数据
    return {
      width: 1920,
      height: 1080,
      duration: 120,
      thumbnailUrl: file.url.replace(/\.([^.]+)$/, '_thumb.jpg')
    };
  }
}
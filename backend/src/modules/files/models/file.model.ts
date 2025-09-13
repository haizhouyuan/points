import mongoose, { Schema, Document } from 'mongoose';
import { FileRelatedTo } from '@shared/types/common';

export interface IFile extends Document {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  uploadedBy: mongoose.Types.ObjectId;
  familyId: mongoose.Types.ObjectId;
  relatedTo: FileRelatedTo;
  relatedId: mongoose.Types.ObjectId;
  isProcessed: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    thumbnailUrl?: string;
    processingErrors?: string[];
    uploadSession?: string;
    checksum?: string;
  };
  tags: string[];
  isPublic: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>({
  filename: { type: String, required: true, index: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true, index: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
  relatedTo: {
    type: String,
    enum: ['task', 'avatar', 'social', 'achievement'],
    required: true,
    index: true
  },
  relatedId: { type: Schema.Types.ObjectId, required: true, index: true },
  isProcessed: { type: Boolean, default: false },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  metadata: {
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number },
    thumbnailUrl: { type: String },
    processingErrors: [{ type: String }],
    uploadSession: { type: String },
    checksum: { type: String }
  },
  tags: [{ type: String, maxlength: 50 }],
  isPublic: { type: Boolean, default: false },
  expiresAt: { 
    type: Date, 
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  }
}, { timestamps: true });

// 复合索引
FileSchema.index({ familyId: 1, relatedTo: 1, createdAt: -1 });
FileSchema.index({ uploadedBy: 1, createdAt: -1 });
FileSchema.index({ relatedTo: 1, relatedId: 1 });
FileSchema.index({ processingStatus: 1, createdAt: 1 });

// 静态方法
FileSchema.statics.findByRelated = function(relatedTo: FileRelatedTo, relatedId: string) {
  return this.find({
    relatedTo,
    relatedId: new mongoose.Types.ObjectId(relatedId)
  }).sort({ createdAt: -1 });
};

FileSchema.statics.findByUser = function(userId: string, limit = 20, offset = 0) {
  return this.find({
    uploadedBy: new mongoose.Types.ObjectId(userId)
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(offset);
};

FileSchema.statics.findByFamily = function(familyId: string, limit = 50, offset = 0) {
  return this.find({
    familyId: new mongoose.Types.ObjectId(familyId)
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(offset);
};

FileSchema.statics.getStorageStats = function(familyId: string) {
  return this.aggregate([
    { $match: { familyId: new mongoose.Types.ObjectId(familyId) } },
    {
      $group: {
        _id: '$mimetype',
        totalSize: { $sum: '$size' },
        count: { $sum: 1 },
        avgSize: { $avg: '$size' }
      }
    },
    { $sort: { totalSize: -1 } }
  ]);
};

FileSchema.statics.getPendingProcessing = function(limit = 10) {
  return this.find({
    processingStatus: 'pending',
    createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } // 5分钟前的文件
  })
  .sort({ createdAt: 1 })
  .limit(limit);
};

// 实例方法
FileSchema.methods.markProcessing = async function() {
  this.processingStatus = 'processing';
  await this.save();
};

FileSchema.methods.markProcessed = async function(metadata?: Record<string, any>) {
  this.processingStatus = 'completed';
  this.isProcessed = true;
  
  if (metadata) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  
  await this.save();
};

FileSchema.methods.markProcessingFailed = async function(error: string) {
  this.processingStatus = 'failed';
  
  if (!this.metadata.processingErrors) {
    this.metadata.processingErrors = [];
  }
  
  this.metadata.processingErrors.push(error);
  await this.save();
};

FileSchema.methods.generateThumbnail = async function(): Promise<string | null> {
  if (!this.mimetype.startsWith('image/')) {
    return null;
  }

  // 这里应该调用图片处理服务生成缩略图
  // 暂时返回原图URL
  const thumbnailUrl = this.url.replace(/\.([^.]+)$/, '_thumb.$1');
  
  this.metadata.thumbnailUrl = thumbnailUrl;
  await this.save();
  
  return thumbnailUrl;
};

FileSchema.methods.isExpired = function(): boolean {
  return this.expiresAt ? new Date() > this.expiresAt : false;
};

FileSchema.methods.canAccess = function(userId: string, familyId: string): boolean {
  // 公开文件任何人都可以访问
  if (this.isPublic) return true;
  
  // 文件上传者可以访问
  if (this.uploadedBy.toString() === userId) return true;
  
  // 同家庭成员可以访问
  if (this.familyId.toString() === familyId) return true;
  
  return false;
};

FileSchema.methods.getFileInfo = function() {
  return {
    id: this._id,
    filename: this.filename,
    originalName: this.originalName,
    mimetype: this.mimetype,
    size: this.size,
    url: this.url,
    thumbnailUrl: this.metadata.thumbnailUrl,
    isProcessed: this.isProcessed,
    processingStatus: this.processingStatus,
    tags: this.tags,
    uploadedAt: this.createdAt,
    expiresAt: this.expiresAt,
    metadata: {
      width: this.metadata.width,
      height: this.metadata.height,
      duration: this.metadata.duration
    }
  };
};

// 中间件：文件删除前的清理工作
FileSchema.pre('deleteOne', { document: true }, async function() {
  // 这里应该添加实际的文件删除逻辑
  // 比如从云存储中删除文件
  console.log(`Cleaning up file: ${this.filename} at ${this.path}`);
});

// 虚拟字段
FileSchema.virtual('sizeFormatted').get(function() {
  const size = this.size;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
});

FileSchema.virtual('fileExtension').get(function() {
  return this.originalName.split('.').pop()?.toLowerCase() || '';
});

FileSchema.virtual('isImage').get(function() {
  return this.mimetype.startsWith('image/');
});

FileSchema.virtual('isVideo').get(function() {
  return this.mimetype.startsWith('video/');
});

FileSchema.virtual('isAudio').get(function() {
  return this.mimetype.startsWith('audio/');
});

export const File = mongoose.model<IFile>('File', FileSchema);
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@shared/middleware/error-handler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Simple file storage for family use
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files allowed', 400));
    }
  }
});

export class SimpleFileController {
  public uploadMiddleware = upload.single('file');

  uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      res.json({
        success: true,
        data: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size,
          url: `/uploads/${req.file.filename}`
        }
      });
    } catch (error) {
      next(error);
    }
  };

  downloadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      if (!fs.existsSync(filePath)) {
        throw new AppError('File not found', 404);
      }

      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  };
}
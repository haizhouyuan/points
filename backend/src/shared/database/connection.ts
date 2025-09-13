import mongoose from 'mongoose';
import { Logger } from '@shared/utils/logger';

export class DatabaseConnection {
  private logger: Logger;
  private connection: typeof mongoose | null = null;

  constructor() {
    this.logger = new Logger('DatabaseConnection');
  }

  public async connect(): Promise<void> {
    try {
      const uri = process.env.NODE_ENV === 'test' 
        ? process.env.MONGODB_TEST_URI 
        : process.env.MONGODB_URI;

      if (!uri) {
        throw new Error('MongoDB URI not provided in environment variables');
      }

      // MongoDB连接选项
      const options: mongoose.ConnectOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // 使用IPv4
        bufferCommands: false,
        retryWrites: true,
        retryReads: true,
      };

      this.connection = await mongoose.connect(uri, options);

      // 连接事件监听
      mongoose.connection.on('connected', () => {
        this.logger.info('MongoDB connected successfully');
      });

      mongoose.connection.on('error', (error) => {
        this.logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        this.logger.warn('MongoDB disconnected');
      });

      // 设置mongoose配置
      mongoose.set('strictQuery', true);

      this.logger.info('Database connection established');

    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        this.connection = null;
        this.logger.info('Database connection closed');
      }
    } catch (error) {
      this.logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  public getConnection(): typeof mongoose | null {
    return this.connection;
  }

  public async isConnected(): Promise<boolean> {
    return mongoose.connection.readyState === 1;
  }

  public async ping(): Promise<boolean> {
    try {
      if (!mongoose.connection.db) {
        return false;
      }
      await mongoose.connection.db!.admin().ping();
      return true;
    } catch {
      return false;
    }
  }
}
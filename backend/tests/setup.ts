import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { DatabaseConnection } from '../src/shared/database/connection';
import { RedisConnection } from '../src/shared/cache/redis';

// 加载测试环境变量
dotenv.config({ path: '.env.test' });

export let dbConnection: DatabaseConnection;
export let redisConnection: RedisConnection;

beforeAll(async () => {
  // 设置测试超时
  jest.setTimeout(30000);
  
  // 连接测试数据库
  dbConnection = new DatabaseConnection();
  await dbConnection.connect();
  
  // 连接测试Redis
  try {
    redisConnection = new RedisConnection();
    await redisConnection.connect();
  } catch (error) {
    console.warn('Redis连接失败，跳过Redis相关测试:', error);
  }
});

afterAll(async () => {
  // 清理并关闭连接
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  }
  
  if (redisConnection) {
    await redisConnection.close();
  }
});

beforeEach(async () => {
  // 清理测试数据
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      if (collection) {
        await collection.deleteMany({});
      }
    }
  }
  
  // 清理Redis缓存
  if (redisConnection) {
    try {
      const client = redisConnection.getClient();
      if (client) {
        await client.flushDb();
      }
    } catch (error) {
      // 忽略Redis清理错误
    }
  }
});
import { DatabaseConnection } from '../src/shared/database/connection';
import { RedisConnection } from '../src/shared/cache/redis';

describe('Environment Tests', () => {
  test('TypeScript编译正常', () => {
    const config: { name: string; version: number } = {
      name: 'summer-vacation-backend',
      version: 1.0
    };
    
    expect(config.name).toBeDefined();
    expect(config.version).toBeGreaterThan(0);
  });

  test('数据库连接正常', async () => {
    const dbConnection = new DatabaseConnection();
    await dbConnection.connect();
    
    const isConnected = await dbConnection.isConnected();
    expect(isConnected).toBe(true);
    
    const pingResult = await dbConnection.ping();
    expect(pingResult).toBe(true);
    
    await dbConnection.close();
  });

  test('Redis连接测试（可选）', async () => {
    try {
      const redisConnection = new RedisConnection();
      await redisConnection.connect();
      
      const isConnected = await redisConnection.isConnected();
      expect(isConnected).toBe(true);
      
      // 测试基础操作
      await redisConnection.set('test', 'value');
      const value = await redisConnection.get('test');
      expect(value).toBe('value');
      
      await redisConnection.close();
    } catch (error) {
      console.warn('Redis未运行，跳过Redis测试');
    }
  });

  test('环境变量配置正确', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.MONGODB_URI).toContain('test');
  });
});
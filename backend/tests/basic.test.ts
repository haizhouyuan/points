describe('Basic Functionality Tests', () => {
  test('TypeScript环境正常', () => {
    interface TestConfig {
      name: string;
      version: number;
      features: string[];
    }
    
    const config: TestConfig = {
      name: 'summer-vacation-backend',
      version: 1.0,
      features: ['auth', 'points', 'tasks']
    };
    
    expect(config.name).toBeDefined();
    expect(config.version).toBeGreaterThan(0);
    expect(config.features).toContain('auth');
    expect(config.features).toContain('points');
  });

  test('环境变量配置', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('数学运算正常', () => {
    const result = 2 + 3;
    expect(result).toBe(5);
    
    const points = [10, 20, 30];
    const total = points.reduce((sum, point) => sum + point, 0);
    expect(total).toBe(60);
  });

  test('数组和对象操作', () => {
    const users = [
      { id: '1', name: 'Alice', points: 100 },
      { id: '2', name: 'Bob', points: 200 },
      { id: '3', name: 'Charlie', points: 150 }
    ];

    // 按积分排序
    const sorted = users.sort((a, b) => b.points - a.points);
    expect(sorted[0].name).toBe('Bob');
    expect(sorted[2].name).toBe('Alice');

    // 计算总积分
    const totalPoints = users.reduce((sum, user) => sum + user.points, 0);
    expect(totalPoints).toBe(450);

    // 筛选高分用户
    const highScorers = users.filter(user => user.points >= 150);
    expect(highScorers).toHaveLength(2);
  });

  test('异步操作模拟', async () => {
    const mockAsyncOperation = (delay: number, result: string): Promise<string> => {
      return new Promise(resolve => {
        setTimeout(() => resolve(result), delay);
      });
    };

    const result = await mockAsyncOperation(10, 'success');
    expect(result).toBe('success');
  });

  test('错误处理', () => {
    const throwError = () => {
      throw new Error('Test error message');
    };

    expect(throwError).toThrow('Test error message');
  });

  test('JSON操作', () => {
    const userData = {
      userId: 'user123',
      familyId: 'family456',
      points: 250,
      level: 5,
      streaks: {
        reading: 7,
        exercise: 3
      }
    };

    const jsonString = JSON.stringify(userData);
    expect(jsonString).toContain('user123');

    const parsed = JSON.parse(jsonString);
    expect(parsed.points).toBe(250);
    expect(parsed.streaks.reading).toBe(7);
  });

  test('日期和时间处理', () => {
    const now = new Date();
    const timestamp = now.getTime();
    const isoString = now.toISOString();

    expect(timestamp).toBeGreaterThan(0);
    expect(isoString).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 日期计算
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    expect(tomorrow.getDate()).toBeGreaterThanOrEqual(now.getDate());
  });

  test('正则表达式', () => {
    const email = 'test@example.com';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(email)).toBe(true);

    const inviteCode = 'ABC123';
    const codeRegex = /^[A-Z0-9]{6}$/;
    expect(codeRegex.test(inviteCode)).toBe(true);
  });

  test('Map和Set数据结构', () => {
    const pointsMap = new Map();
    pointsMap.set('user1', 100);
    pointsMap.set('user2', 200);
    
    expect(pointsMap.get('user1')).toBe(100);
    expect(pointsMap.size).toBe(2);

    const uniqueIds = new Set(['id1', 'id2', 'id1', 'id3']);
    expect(uniqueIds.size).toBe(3); // 重复的id1被去除
  });
});
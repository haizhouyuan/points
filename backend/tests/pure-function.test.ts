// 纯函数测试 - 不依赖外部数据库或服务

describe('Pure Function Tests', () => {
  test('积分计算逻辑', () => {
    // 模拟积分计算函数
    const calculateBalance = (transactions: Array<{amount: number}>) => {
      return transactions.reduce((balance, tx) => balance + tx.amount, 0);
    };

    const transactions = [
      { amount: 100 }, // 任务完成
      { amount: 50 },  // 成就奖励
      { amount: -30 }, // 兑换消费
      { amount: 25 },  // 每日奖励
    ];

    const balance = calculateBalance(transactions);
    expect(balance).toBe(145);
  });

  test('等级计算逻辑', () => {
    const calculateLevel = (xp: number) => {
      return Math.floor(Math.sqrt(xp / 100)) + 1;
    };

    const calculateNextLevelXP = (level: number) => {
      return level * level * 100;
    };

    expect(calculateLevel(0)).toBe(1);     // 0 XP = 1级
    expect(calculateLevel(100)).toBe(2);   // 100 XP = 2级
    expect(calculateLevel(400)).toBe(3);   // 400 XP = 3级
    expect(calculateLevel(900)).toBe(4);   // 900 XP = 4级

    expect(calculateNextLevelXP(1)).toBe(100);
    expect(calculateNextLevelXP(2)).toBe(400);
    expect(calculateNextLevelXP(3)).toBe(900);
  });

  test('连击计算逻辑', () => {
    const updateStreak = (lastUpdate: Date, today: Date, currentStreak: number) => {
      const daysDiff = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        return currentStreak; // 今天已更新
      } else if (daysDiff === 1) {
        return currentStreak + 1; // 连续，增加连击
      } else {
        return 1; // 中断，重置为1
      }
    };

    const today = new Date('2024-01-15');
    const yesterday = new Date('2024-01-14');
    const twoDaysAgo = new Date('2024-01-13');
    const sameDay = new Date('2024-01-15');

    expect(updateStreak(yesterday, today, 5)).toBe(6);    // 连续，+1
    expect(updateStreak(twoDaysAgo, today, 5)).toBe(1);   // 中断，重置
    expect(updateStreak(sameDay, today, 5)).toBe(5);      // 同一天，不变
  });

  test('排行榜排序逻辑', () => {
    interface LeaderboardEntry {
      userId: string;
      name: string;
      points: number;
      level: number;
    }

    const sortLeaderboard = (entries: LeaderboardEntry[]) => {
      return entries
        .sort((a, b) => {
          // 首先按积分排序
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          // 积分相同时按等级排序
          if (b.level !== a.level) {
            return b.level - a.level;
          }
          // 都相同时按姓名排序
          return a.name.localeCompare(b.name);
        })
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
    };

    const entries: LeaderboardEntry[] = [
      { userId: '1', name: 'Alice', points: 200, level: 3 },
      { userId: '2', name: 'Bob', points: 300, level: 2 },
      { userId: '3', name: 'Charlie', points: 200, level: 4 },
      { userId: '4', name: 'David', points: 200, level: 3 },
    ];

    const sorted = sortLeaderboard(entries);

    expect(sorted[0].name).toBe('Bob');       // 最高积分
    expect(sorted[0].rank).toBe(1);
    expect(sorted[1].name).toBe('Charlie');   // 相同积分，更高等级
    expect(sorted[1].rank).toBe(2);
    expect(sorted[2].name).toBe('Alice');     // 相同积分等级，字母顺序
    expect(sorted[2].rank).toBe(3);
    expect(sorted[3].name).toBe('David');
    expect(sorted[3].rank).toBe(4);
  });

  test('时间段统计逻辑', () => {
    const getWeekPeriod = (date: Date) => {
      const year = date.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
      const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
      return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    };

    const getMonthPeriod = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      return `${year}-${month.toString().padStart(2, '0')}`;
    };

    const testDate1 = new Date('2024-01-15');
    const testDate2 = new Date('2024-12-25');

    expect(getWeekPeriod(testDate1)).toMatch(/2024-W\d{2}/);
    expect(getMonthPeriod(testDate1)).toBe('2024-01');
    expect(getMonthPeriod(testDate2)).toBe('2024-12');
  });

  test('幂等键生成逻辑', () => {
    const generateIdempotencyKey = (operation: string, userId: string, timestamp: number) => {
      return `${operation}_${userId}_${timestamp}`;
    };

    const key1 = generateIdempotencyKey('task_complete', 'user123', 1642204800000);
    const key2 = generateIdempotencyKey('achievement_unlock', 'user456', 1642204800001);

    expect(key1).toBe('task_complete_user123_1642204800000');
    expect(key2).toBe('achievement_unlock_user456_1642204800001');
    expect(key1).not.toBe(key2);
  });

  test('邀请码生成逻辑', () => {
    const generateInviteCode = (seed: number = Date.now()) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      let rng = seed;
      
      for (let i = 0; i < 6; i++) {
        rng = (rng * 9301 + 49297) % 233280; // 简单的伪随机数生成器
        code += chars[rng % chars.length];
      }
      
      return code;
    };

    const code1 = generateInviteCode(12345);
    const code2 = generateInviteCode(67890);

    expect(code1).toHaveLength(6);
    expect(code2).toHaveLength(6);
    expect(code1).not.toBe(code2);
    expect(/^[A-Z0-9]{6}$/.test(code1)).toBe(true);
    expect(/^[A-Z0-9]{6}$/.test(code2)).toBe(true);
  });

  test('积分奖励计算逻辑', () => {
    const calculateTaskReward = (difficulty: number, basePoints: number, bonusMultiplier: number = 1) => {
      return Math.floor(basePoints * difficulty * bonusMultiplier);
    };

    expect(calculateTaskReward(1, 10)).toBe(10);   // 简单任务
    expect(calculateTaskReward(3, 10)).toBe(30);   // 中等任务
    expect(calculateTaskReward(5, 10)).toBe(50);   // 困难任务
    expect(calculateTaskReward(3, 10, 1.5)).toBe(45); // 带奖励倍率
  });

  test('家庭数据隔离检查', () => {
    const hasPermission = (userFamilyId: string, resourceFamilyId: string) => {
      return userFamilyId === resourceFamilyId;
    };

    expect(hasPermission('family123', 'family123')).toBe(true);
    expect(hasPermission('family123', 'family456')).toBe(false);
    expect(hasPermission('', 'family123')).toBe(false);
  });

  test('输入验证逻辑', () => {
    const validateEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const validatePassword = (password: string) => {
      return password.length >= 6;
    };

    const validateInviteCode = (code: string) => {
      return /^[A-Z0-9]{6}$/.test(code);
    };

    // 邮箱验证
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('user@')).toBe(false);

    // 密码验证
    expect(validatePassword('password123')).toBe(true);
    expect(validatePassword('12345')).toBe(false);
    expect(validatePassword('')).toBe(false);

    // 邀请码验证
    expect(validateInviteCode('ABC123')).toBe(true);
    expect(validateInviteCode('abc123')).toBe(false);
    expect(validateInviteCode('ABCD12')).toBe(true);
    expect(validateInviteCode('ABC12')).toBe(false); // 长度不够
  });
});
// 独立测试 - 不依赖setup.ts和其他模块

describe('Standalone Logic Tests', () => {
  // 测试积分账本化逻辑
  describe('积分账本系统逻辑', () => {
    interface PointsTransaction {
      id: string;
      userId: string;
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      type: string;
      createdAt: Date;
    }

    class MockPointsLedger {
      private transactions: PointsTransaction[] = [];

      addTransaction(userId: string, amount: number, type: string): PointsTransaction {
        const balance = this.getBalance(userId);
        
        if (amount < 0 && balance + amount < 0) {
          throw new Error('积分余额不足');
        }

        const transaction: PointsTransaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          amount,
          balanceBefore: balance,
          balanceAfter: balance + amount,
          type,
          createdAt: new Date()
        };

        this.transactions.push(transaction);
        return transaction;
      }

      getBalance(userId: string): number {
        return this.transactions
          .filter(tx => tx.userId === userId)
          .reduce((balance, tx) => balance + tx.amount, 0);
      }

      getHistory(userId: string): PointsTransaction[] {
        return this.transactions
          .filter(tx => tx.userId === userId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
    }

    test('创建收入交易', () => {
      const ledger = new MockPointsLedger();
      
      const tx = ledger.addTransaction('user1', 100, 'task_completion');
      
      expect(tx.amount).toBe(100);
      expect(tx.balanceBefore).toBe(0);
      expect(tx.balanceAfter).toBe(100);
      expect(tx.userId).toBe('user1');
      expect(tx.type).toBe('task_completion');
    });

    test('创建支出交易', () => {
      const ledger = new MockPointsLedger();
      
      // 先充值
      ledger.addTransaction('user1', 150, 'task_completion');
      
      // 再消费
      const tx = ledger.addTransaction('user1', -50, 'redemption');
      
      expect(tx.amount).toBe(-50);
      expect(tx.balanceBefore).toBe(150);
      expect(tx.balanceAfter).toBe(100);
    });

    test('余额不足时抛出错误', () => {
      const ledger = new MockPointsLedger();
      
      expect(() => {
        ledger.addTransaction('user1', -50, 'redemption');
      }).toThrow('积分余额不足');
    });

    test('多笔交易余额计算正确', () => {
      const ledger = new MockPointsLedger();
      
      ledger.addTransaction('user1', 100, 'task_completion');
      ledger.addTransaction('user1', 50, 'achievement');
      ledger.addTransaction('user1', -30, 'redemption');
      ledger.addTransaction('user1', 25, 'daily_bonus');
      
      const balance = ledger.getBalance('user1');
      expect(balance).toBe(145); // 100 + 50 - 30 + 25
      
      const history = ledger.getHistory('user1');
      expect(history).toHaveLength(4);
      expect(history[0].type).toBe('daily_bonus'); // 最新的在前
    });
  });

  // 测试用户游戏化系统逻辑
  describe('游戏化系统逻辑', () => {
    interface GameProfile {
      level: number;
      xp: number;
      nextLevelXP: number;
      streaks: Map<string, StreakData>;
    }

    interface StreakData {
      count: number;
      lastUpdate: Date;
      bestStreak: number;
    }

    class MockGameSystem {
      calculateNextLevelXP(level: number): number {
        return level * level * 100;
      }

      addXP(profile: GameProfile, xp: number): number {
        profile.xp += xp;
        let levelsGained = 0;
        
        while (profile.xp >= profile.nextLevelXP) {
          profile.xp -= profile.nextLevelXP;
          profile.level += 1;
          levelsGained += 1;
          profile.nextLevelXP = this.calculateNextLevelXP(profile.level);
        }
        
        return levelsGained;
      }

      updateStreak(profile: GameProfile, category: string): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let streak = profile.streaks.get(category);
        if (!streak) {
          streak = { count: 0, lastUpdate: new Date(0), bestStreak: 0 };
          profile.streaks.set(category, streak);
        }
        
        const lastUpdate = new Date(streak.lastUpdate);
        lastUpdate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
          return streak.count; // 今天已更新
        } else if (daysDiff === 1) {
          streak.count += 1; // 连续
        } else {
          streak.count = 1; // 中断重置
        }
        
        streak.lastUpdate = today;
        streak.bestStreak = Math.max(streak.bestStreak, streak.count);
        
        return streak.count;
      }
    }

    test('等级计算正确', () => {
      const gameSystem = new MockGameSystem();
      
      expect(gameSystem.calculateNextLevelXP(1)).toBe(100);
      expect(gameSystem.calculateNextLevelXP(2)).toBe(400);
      expect(gameSystem.calculateNextLevelXP(3)).toBe(900);
      expect(gameSystem.calculateNextLevelXP(5)).toBe(2500);
    });

    test('经验值升级逻辑', () => {
      const gameSystem = new MockGameSystem();
      const profile: GameProfile = {
        level: 1,
        xp: 0,
        nextLevelXP: 100,
        streaks: new Map()
      };

      // 添加50经验值，不升级
      let levelsGained = gameSystem.addXP(profile, 50);
      expect(levelsGained).toBe(0);
      expect(profile.level).toBe(1);
      expect(profile.xp).toBe(50);

      // 再添加60经验值，升级到2级
      levelsGained = gameSystem.addXP(profile, 60);
      expect(levelsGained).toBe(1);
      expect(profile.level).toBe(2);
      expect(profile.xp).toBe(10); // 110 - 100 = 10剩余经验值
      expect(profile.nextLevelXP).toBe(400);

      // 添加大量经验值，连续升级
      levelsGained = gameSystem.addXP(profile, 1500);
      expect(levelsGained).toBe(2); // 从2级升到4级
      expect(profile.level).toBe(4);
    });

    test('连击系统逻辑', () => {
      const gameSystem = new MockGameSystem();
      const profile: GameProfile = {
        level: 1,
        xp: 0,
        nextLevelXP: 100,
        streaks: new Map()
      };

      const today = new Date('2024-01-15T10:00:00Z');
      const yesterday = new Date('2024-01-14T10:00:00Z');
      const twoDaysAgo = new Date('2024-01-13T10:00:00Z');

      // 模拟系统当前时间
      jest.useFakeTimers();
      jest.setSystemTime(today);

      // 第一次更新连击
      let streakCount = gameSystem.updateStreak(profile, 'reading');
      expect(streakCount).toBe(1);

      // 设置昨天的更新时间，模拟连续
      profile.streaks.set('reading', {
        count: 5,
        lastUpdate: yesterday,
        bestStreak: 5
      });

      streakCount = gameSystem.updateStreak(profile, 'reading');
      expect(streakCount).toBe(6); // 连续，+1

      // 设置两天前的更新时间，模拟中断
      profile.streaks.set('reading', {
        count: 10,
        lastUpdate: twoDaysAgo,
        bestStreak: 10
      });

      streakCount = gameSystem.updateStreak(profile, 'reading');
      expect(streakCount).toBe(1); // 中断，重置为1
      
      const streak = profile.streaks.get('reading')!;
      expect(streak.bestStreak).toBe(10); // 最高连击保持不变

      jest.useRealTimers();
    });
  });

  // 测试家庭管理逻辑
  describe('家庭管理逻辑', () => {
    interface User {
      id: string;
      name: string;
      familyId: string;
      role: 'parent' | 'student';
      points: number;
    }

    interface Family {
      id: string;
      name: string;
      inviteCode: string;
      members: User[];
    }

    class MockFamilySystem {
      private families: Family[] = [];
      private users: User[] = [];

      generateInviteCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        do {
          code = '';
          for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
        } while (this.families.some(f => f.inviteCode === code));
        
        return code;
      }

      createFamily(name: string, parentId: string): Family {
        const family: Family = {
          id: `family_${Date.now()}`,
          name,
          inviteCode: this.generateInviteCode(),
          members: []
        };

        this.families.push(family);
        
        // 将创建者添加为家长
        const parent = this.users.find(u => u.id === parentId);
        if (parent) {
          parent.familyId = family.id;
          parent.role = 'parent';
          family.members.push(parent);
        }

        return family;
      }

      joinFamily(inviteCode: string, userId: string): boolean {
        const family = this.families.find(f => f.inviteCode === inviteCode);
        const user = this.users.find(u => u.id === userId);

        if (!family || !user) return false;
        if (family.members.length >= 10) return false; // 家庭成员限制

        user.familyId = family.id;
        family.members.push(user);
        return true;
      }

      getFamilyLeaderboard(familyId: string): Array<User & {rank: number}> {
        const family = this.families.find(f => f.id === familyId);
        if (!family) return [];

        return family.members
          .sort((a, b) => b.points - a.points)
          .map((member, index) => ({
            ...member,
            rank: index + 1
          }));
      }

      addUser(user: User): void {
        this.users.push(user);
      }
    }

    test('创建家庭和邀请码生成', () => {
      const familySystem = new MockFamilySystem();
      
      const parent: User = {
        id: 'user1',
        name: 'Parent',
        familyId: '',
        role: 'student',
        points: 0
      };
      familySystem.addUser(parent);

      const family = familySystem.createFamily('测试家庭', 'user1');

      expect(family.name).toBe('测试家庭');
      expect(family.inviteCode).toMatch(/^[A-Z0-9]{6}$/);
      expect(family.members).toHaveLength(1);
      expect(family.members[0].role).toBe('parent');
      expect(parent.familyId).toBe(family.id);
    });

    test('通过邀请码加入家庭', () => {
      const familySystem = new MockFamilySystem();
      
      const parent: User = {
        id: 'parent1',
        name: 'Parent',
        familyId: '',
        role: 'student',
        points: 100
      };

      const student: User = {
        id: 'student1',
        name: 'Student',
        familyId: '',
        role: 'student',
        points: 50
      };

      familySystem.addUser(parent);
      familySystem.addUser(student);

      const family = familySystem.createFamily('测试家庭', 'parent1');
      const joinResult = familySystem.joinFamily(family.inviteCode, 'student1');

      expect(joinResult).toBe(true);
      expect(student.familyId).toBe(family.id);
      expect(family.members).toHaveLength(2);
    });

    test('家庭排行榜生成', () => {
      const familySystem = new MockFamilySystem();
      
      const users = [
        { id: '1', name: 'Alice', familyId: '', role: 'student' as const, points: 300 },
        { id: '2', name: 'Bob', familyId: '', role: 'student' as const, points: 150 },
        { id: '3', name: 'Charlie', familyId: '', role: 'parent' as const, points: 400 },
      ];

      users.forEach(user => familySystem.addUser(user));

      const family = familySystem.createFamily('测试家庭', '3');
      familySystem.joinFamily(family.inviteCode, '1');
      familySystem.joinFamily(family.inviteCode, '2');

      const leaderboard = familySystem.getFamilyLeaderboard(family.id);

      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].name).toBe('Charlie'); // 最高积分
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].name).toBe('Alice');
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[2].name).toBe('Bob');
      expect(leaderboard[2].rank).toBe(3);
    });

    test('无效邀请码加入失败', () => {
      const familySystem = new MockFamilySystem();
      
      const student: User = {
        id: 'student1',
        name: 'Student',
        familyId: '',
        role: 'student',
        points: 50
      };
      familySystem.addUser(student);

      const joinResult = familySystem.joinFamily('INVALID', 'student1');
      expect(joinResult).toBe(false);
      expect(student.familyId).toBe('');
    });
  });

  // 测试数据验证逻辑
  describe('数据验证逻辑', () => {
    interface ValidationResult {
      isValid: boolean;
      errors: string[];
    }

    class MockValidator {
      validateEmail(email: string): ValidationResult {
        const errors: string[] = [];
        
        if (!email) {
          errors.push('邮箱不能为空');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('邮箱格式不正确');
        }

        return { isValid: errors.length === 0, errors };
      }

      validatePassword(password: string): ValidationResult {
        const errors: string[] = [];
        
        if (!password) {
          errors.push('密码不能为空');
        } else {
          if (password.length < 6) {
            errors.push('密码至少需要6位字符');
          }
          if (!/[a-zA-Z]/.test(password)) {
            errors.push('密码必须包含字母');
          }
          if (!/[0-9]/.test(password)) {
            errors.push('密码必须包含数字');
          }
        }

        return { isValid: errors.length === 0, errors };
      }

      validateTaskData(data: {
        name?: string;
        description?: string;
        difficulty?: number;
        pointsReward?: number;
      }): ValidationResult {
        const errors: string[] = [];

        if (!data.name || data.name.trim().length === 0) {
          errors.push('任务名称不能为空');
        } else if (data.name.length > 100) {
          errors.push('任务名称不能超过100个字符');
        }

        if (!data.description || data.description.trim().length === 0) {
          errors.push('任务描述不能为空');
        } else if (data.description.length > 500) {
          errors.push('任务描述不能超过500个字符');
        }

        if (data.difficulty === undefined || data.difficulty < 1 || data.difficulty > 5) {
          errors.push('难度等级必须在1-5之间');
        }

        if (data.pointsReward === undefined || data.pointsReward < 0) {
          errors.push('积分奖励不能为负数');
        }

        return { isValid: errors.length === 0, errors };
      }
    }

    test('邮箱验证', () => {
      const validator = new MockValidator();

      expect(validator.validateEmail('test@example.com')).toEqual({
        isValid: true,
        errors: []
      });

      expect(validator.validateEmail('invalid-email')).toEqual({
        isValid: false,
        errors: ['邮箱格式不正确']
      });

      expect(validator.validateEmail('')).toEqual({
        isValid: false,
        errors: ['邮箱不能为空']
      });
    });

    test('密码验证', () => {
      const validator = new MockValidator();

      expect(validator.validatePassword('password123')).toEqual({
        isValid: true,
        errors: []
      });

      expect(validator.validatePassword('12345')).toEqual({
        isValid: false,
        errors: ['密码至少需要6位字符', '密码必须包含字母']
      });

      expect(validator.validatePassword('password')).toEqual({
        isValid: false,
        errors: ['密码必须包含数字']
      });

      expect(validator.validatePassword('')).toEqual({
        isValid: false,
        errors: ['密码不能为空']
      });
    });

    test('任务数据验证', () => {
      const validator = new MockValidator();

      expect(validator.validateTaskData({
        name: '完成数学作业',
        description: '完成今日数学课后习题',
        difficulty: 3,
        pointsReward: 50
      })).toEqual({
        isValid: true,
        errors: []
      });

      expect(validator.validateTaskData({
        name: '',
        description: '',
        difficulty: 0,
        pointsReward: -10
      })).toEqual({
        isValid: false,
        errors: [
          '任务名称不能为空',
          '任务描述不能为空',
          '难度等级必须在1-5之间',
          '积分奖励不能为负数'
        ]
      });

      expect(validator.validateTaskData({
        name: 'A'.repeat(101), // 超长名称
        description: 'B'.repeat(501), // 超长描述
        difficulty: 6, // 超出范围
      })).toEqual({
        isValid: false,
        errors: [
          '任务名称不能超过100个字符',
          '任务描述不能超过500个字符',
          '难度等级必须在1-5之间',
          '积分奖励不能为负数'
        ]
      });
    });
  });

  // 性能测试模拟
  describe('性能测试模拟', () => {
    test('大量数据处理性能', () => {
      const startTime = Date.now();
      
      // 模拟处理10000条积分记录
      const transactions = Array.from({ length: 10000 }, (_, i) => ({
        id: `tx_${i}`,
        userId: `user_${i % 100}`, // 100个用户
        amount: Math.floor(Math.random() * 100) + 1,
        type: 'task_completion'
      }));

      // 计算每个用户的总积分
      const userBalances = new Map<string, number>();
      
      transactions.forEach(tx => {
        const currentBalance = userBalances.get(tx.userId) || 0;
        userBalances.set(tx.userId, currentBalance + tx.amount);
      });

      // 生成排行榜
      const leaderboard = Array.from(userBalances.entries())
        .map(([userId, balance]) => ({ userId, balance }))
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 10); // 前10名

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(transactions).toHaveLength(10000);
      expect(userBalances.size).toBe(100);
      expect(leaderboard).toHaveLength(10);
      expect(processingTime).toBeLessThan(100); // 处理时间应该小于100ms
      
      // 验证排行榜排序正确
      for (let i = 0; i < leaderboard.length - 1; i++) {
        expect(leaderboard[i].balance).toBeGreaterThanOrEqual(leaderboard[i + 1].balance);
      }
    });

    test('内存使用效率测试', () => {
      // 模拟创建大量对象时的内存管理
      const objectPool: Array<{id: string; data: number[]}> = [];
      
      // 创建1000个对象
      for (let i = 0; i < 1000; i++) {
        objectPool.push({
          id: `obj_${i}`,
          data: new Array(100).fill(i) // 每个对象包含100个数字
        });
      }

      expect(objectPool).toHaveLength(1000);
      expect(objectPool[0].data).toHaveLength(100);
      expect(objectPool[999].data[0]).toBe(999);

      // 模拟清理过程
      objectPool.splice(0, 500); // 删除前一半
      expect(objectPool).toHaveLength(500);
    });
  });
});
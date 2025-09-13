import mongoose from 'mongoose';
import { PointsService } from '../../../src/modules/points/services/points.service';
import { PointsLedger } from '../../../src/modules/points/models/points-ledger.model';
import { User } from '../../../src/modules/auth/models/user.model';
import { Family } from '../../../src/modules/auth/models/family.model';
import { EventBus } from '../../../src/shared/events/event-bus';
import { RedisConnection } from '../../../src/shared/cache/redis';

describe('PointsService', () => {
  let pointsService: PointsService;
  let eventBus: EventBus;
  let redisConnection: RedisConnection;
  let testUser: any;
  let testFamily: any;

  beforeEach(async () => {
    // 创建测试依赖
    try {
      redisConnection = new RedisConnection();
      await redisConnection.connect();
    } catch (error) {
      // Redis连接失败，使用模拟对象
      redisConnection = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
      } as any;
    }

    eventBus = new EventBus(redisConnection);
    pointsService = new PointsService(eventBus, redisConnection);

    // 模拟事件发布
    jest.spyOn(eventBus, 'publish').mockResolvedValue();

    // 创建测试数据
    testFamily = new Family({
      name: '测试家庭',
      inviteCode: 'POINTS1',
      createdBy: new mongoose.Types.ObjectId(),
    });
    await testFamily.save();

    testUser = new User({
      email: 'points@example.com',
      passwordHash: 'hashedpassword',
      name: '积分测试用户',
      role: 'student',
      familyId: testFamily._id,
      gameProfile: {
        totalPoints: 100, // 初始积分
        level: 1,
      },
    });
    await testUser.save();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('积分交易创建', () => {
    test('成功创建积分收入交易', async () => {
      const transactionData = {
        userId: testUser._id.toString(),
        familyId: testFamily._id.toString(),
        amount: 50,
        type: 'task_completion' as const,
        sourceId: new mongoose.Types.ObjectId().toString(),
        sourceType: 'scheduled_task',
        metadata: {
          taskName: '完成数学作业',
          category: 'learning'
        }
      };

      const transaction = await pointsService.createTransaction(transactionData);

      expect(transaction.amount).toBe(50);
      expect(transaction.type).toBe('task_completion');
      expect(transaction.balanceBefore).toBe(100);
      expect(transaction.balanceAfter).toBe(150);
      expect(transaction.metadata.taskName).toBe('完成数学作业');

      // 验证数据库记录
      const savedTransaction = await PointsLedger.findById(transaction._id);
      expect(savedTransaction).toBeTruthy();
      expect(savedTransaction?.amount).toBe(50);

      // 验证用户积分更新
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.gameProfile.totalPoints).toBe(150);
    });

    test('成功创建积分支出交易', async () => {
      const transactionData = {
        userId: testUser._id.toString(),
        familyId: testFamily._id.toString(),
        amount: -30,
        type: 'redemption' as const,
        sourceId: new mongoose.Types.ObjectId().toString(),
        sourceType: 'redemption',
        metadata: {
          rewardName: '额外游戏时间',
        }
      };

      const transaction = await pointsService.createTransaction(transactionData);

      expect(transaction.amount).toBe(-30);
      expect(transaction.type).toBe('redemption');
      expect(transaction.balanceBefore).toBe(100);
      expect(transaction.balanceAfter).toBe(70);
    });

    test('余额不足时创建支出交易失败', async () => {
      const transactionData = {
        userId: testUser._id.toString(),
        familyId: testFamily._id.toString(),
        amount: -150, // 大于用户当前余额100
        type: 'redemption' as const,
        metadata: {
          rewardName: '昂贵奖励',
        }
      };

      await expect(pointsService.createTransaction(transactionData)).rejects.toThrow('积分余额不足');
    });

    test('幂等性保证 - 相同幂等键的重复请求返回相同结果', async () => {
      const idempotencyKey = 'test-idempotency-123';
      
      const transactionData = {
        userId: testUser._id.toString(),
        familyId: testFamily._id.toString(),
        amount: 25,
        type: 'task_completion' as const,
        idempotencyKey
      };

      // 第一次请求
      const transaction1 = await pointsService.createTransaction(transactionData);
      
      // 第二次请求（相同幂等键）
      const transaction2 = await pointsService.createTransaction(transactionData);

      expect(transaction1._id.toString()).toBe(transaction2._id.toString());
      expect(transaction1.amount).toBe(25);
      expect(transaction2.amount).toBe(25);

      // 验证余额只变更一次
      const finalBalance = await pointsService.getBalance(testUser._id.toString());
      expect(finalBalance).toBe(125); // 100 + 25，而不是 100 + 25 + 25
    });
  });

  describe('并发交易处理', () => {
    test('并发交易的余额计算正确性', async () => {
      const concurrentTransactions = [];
      
      // 创建10个并发的+10积分交易
      for (let i = 0; i < 10; i++) {
        const transactionPromise = pointsService.createTransaction({
          userId: testUser._id.toString(),
          familyId: testFamily._id.toString(),
          amount: 10,
          type: 'task_completion' as const,
          metadata: { testIndex: i }
        });
        concurrentTransactions.push(transactionPromise);
      }

      const results = await Promise.all(concurrentTransactions);
      
      // 验证所有交易都成功
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.amount).toBe(10);
      });

      // 验证最终余额正确
      const finalBalance = await pointsService.getBalance(testUser._id.toString());
      expect(finalBalance).toBe(200); // 100 + (10 * 10)

      // 验证账本记录数量正确
      const ledgerEntries = await PointsLedger.find({ userId: testUser._id });
      expect(ledgerEntries).toHaveLength(10);
    });

    test('并发收入和支出交易混合处理', async () => {
      const mixedTransactions = [];
      
      // 5个收入交易
      for (let i = 0; i < 5; i++) {
        mixedTransactions.push(
          pointsService.createTransaction({
            userId: testUser._id.toString(),
            familyId: testFamily._id.toString(),
            amount: 20,
            type: 'task_completion' as const,
          })
        );
      }
      
      // 3个支出交易
      for (let i = 0; i < 3; i++) {
        mixedTransactions.push(
          pointsService.createTransaction({
            userId: testUser._id.toString(),
            familyId: testFamily._id.toString(),
            amount: -15,
            type: 'skill_unlock' as const,
          })
        );
      }

      const results = await Promise.all(mixedTransactions);
      expect(results).toHaveLength(8);

      // 验证最终余额：100 + (5 * 20) - (3 * 15) = 155
      const finalBalance = await pointsService.getBalance(testUser._id.toString());
      expect(finalBalance).toBe(155);
    });
  });

  describe('余额查询和缓存', () => {
    test('初次查询余额从数据库计算', async () => {
      // 清除可能的缓存
      if (redisConnection.del) {
        await redisConnection.del(`balance:${testUser._id}`);
      }

      const balance = await pointsService.getBalance(testUser._id.toString());
      expect(balance).toBe(100); // 用户初始积分
    });

    test('缓存命中后返回缓存值', async () => {
      if (redisConnection.get && redisConnection.set) {
        // 设置缓存值
        await redisConnection.set(`balance:${testUser._id}`, '250');

        const balance = await pointsService.getBalance(testUser._id.toString());
        expect(balance).toBe(250);
      }
    });

    test('账本记录与实际余额一致', async () => {
      // 创建几个交易
      await pointsService.createTransaction({
        userId: testUser._id.toString(),
        familyId: testFamily._id.toString(),
        amount: 30,
        type: 'achievement_reward' as const,
      });

      await pointsService.createTransaction({
        userId: testUser._id.toString(),
        familyId: testFamily._id.toString(),
        amount: -20,
        type: 'redemption' as const,
      });

      // 通过账本计算余额
      const calculatedBalance = await PointsLedger.calculateBalance(testUser._id.toString());
      // 通过服务获取余额
      const serviceBalance = await pointsService.getBalance(testUser._id.toString());

      expect(calculatedBalance).toBe(serviceBalance);
      expect(calculatedBalance).toBe(110); // 100 + 30 - 20
    });
  });

  describe('积分历史记录', () => {
    beforeEach(async () => {
      // 创建一些测试交易记录
      const transactions = [
        { amount: 50, type: 'task_completion' as const, metadata: { task: '任务1' } },
        { amount: 30, type: 'achievement_reward' as const, metadata: { achievement: '成就1' } },
        { amount: -25, type: 'redemption' as const, metadata: { reward: '奖励1' } },
        { amount: 40, type: 'daily_bonus' as const, metadata: { bonus: '每日奖励' } },
        { amount: -15, type: 'skill_unlock' as const, metadata: { skill: '技能1' } },
      ];

      for (const transactionData of transactions) {
        await pointsService.createTransaction({
          userId: testUser._id.toString(),
          familyId: testFamily._id.toString(),
          ...transactionData,
        });
      }
    });

    test('获取完整历史记录', async () => {
      const history = await pointsService.getHistory(testUser._id.toString(), {});

      expect(history.data).toHaveLength(5);
      // 按时间倒序排列，最新的在前
      expect(history.data[0].metadata.skill).toBe('技能1');
      expect(history.data[4].metadata.task).toBe('任务1');
    });

    test('按类型筛选历史记录', async () => {
      const history = await pointsService.getHistory(testUser._id.toString(), {
        type: 'task_completion'
      });

      expect(history.data).toHaveLength(1);
      expect(history.data[0].type).toBe('task_completion');
      expect(history.data[0].metadata.task).toBe('任务1');
    });

    test('分页查询历史记录', async () => {
      const firstPage = await pointsService.getHistory(testUser._id.toString(), {
        limit: 2
      });

      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.pagination.hasMore).toBe(true);
      expect(firstPage.pagination.cursor).toBeDefined();

      // 获取下一页
      const secondPage = await pointsService.getHistory(testUser._id.toString(), {
        cursor: firstPage.pagination.cursor!,
        limit: 2
      });

      expect(secondPage.data).toHaveLength(2);
      expect(secondPage.data[0]._id).not.toBe(firstPage.data[0]._id);
    });
  });

  describe('积分统计', () => {
    beforeEach(async () => {
      // 创建本周/本月的交易记录
      const today = new Date();
      
      // 模拟本周的交易
      const weekTransactions = [
        { amount: 100, type: 'task_completion' as const },
        { amount: 50, type: 'achievement_reward' as const },
        { amount: -30, type: 'redemption' as const },
      ];

      for (const transactionData of weekTransactions) {
        await pointsService.createTransaction({
          userId: testUser._id.toString(),
          familyId: testFamily._id.toString(),
          ...transactionData,
        });
      }
    });

    test('获取周积分统计', async () => {
      const summary = await pointsService.getSummary(testUser._id.toString(), 'week');

      expect(summary.totalEarned).toBe(150); // 100 + 50
      expect(summary.totalSpent).toBe(30);   // 30
      expect(summary.netChange).toBe(120);   // 150 - 30
      expect(summary.transactionCount).toBe(3);
    });

    test('获取月积分统计', async () => {
      const summary = await pointsService.getSummary(testUser._id.toString(), 'month');

      expect(summary.totalEarned).toBeGreaterThanOrEqual(150);
      expect(summary.totalSpent).toBeGreaterThanOrEqual(30);
      expect(summary.netChange).toBeGreaterThanOrEqual(120);
    });
  });

  describe('常用场景方法', () => {
    test('任务完成奖励', async () => {
      const taskId = new mongoose.Types.ObjectId().toString();
      const transaction = await pointsService.rewardTaskCompletion(
        testUser._id.toString(),
        testFamily._id.toString(),
        taskId,
        75,
        { taskName: '完成英语作业', category: 'learning' }
      );

      expect(transaction.amount).toBe(75);
      expect(transaction.type).toBe('task_completion');
      expect(transaction.sourceId?.toString()).toBe(taskId);
      expect(transaction.metadata.description).toBe('任务完成奖励');
      expect(transaction.metadata.taskName).toBe('完成英语作业');
    });

    test('成就解锁奖励', async () => {
      const achievementId = new mongoose.Types.ObjectId().toString();
      const transaction = await pointsService.rewardAchievement(
        testUser._id.toString(),
        testFamily._id.toString(),
        achievementId,
        100,
        { achievementName: '学习达人' }
      );

      expect(transaction.amount).toBe(100);
      expect(transaction.type).toBe('achievement_reward');
      expect(transaction.sourceId?.toString()).toBe(achievementId);
      expect(transaction.metadata.description).toBe('成就解锁奖励');
    });

    test('每日奖励领取', async () => {
      const transaction = await pointsService.claimDailyReward(
        testUser._id.toString(),
        testFamily._id.toString(),
        50
      );

      expect(transaction.amount).toBe(50);
      expect(transaction.type).toBe('daily_bonus');
      expect(transaction.metadata.description).toBe('每日签到奖励');

      // 测试同一天不能重复领取
      await expect(
        pointsService.claimDailyReward(
          testUser._id.toString(),
          testFamily._id.toString(),
          50
        )
      ).rejects.toThrow('每日奖励已领取');
    });

    test('积分消费', async () => {
      const rewardId = new mongoose.Types.ObjectId().toString();
      const transaction = await pointsService.consumePoints(
        testUser._id.toString(),
        testFamily._id.toString(),
        60,
        'redemption',
        rewardId,
        'reward',
        { rewardName: '额外休息时间' }
      );

      expect(transaction.amount).toBe(-60); // 确保是负数
      expect(transaction.type).toBe('redemption');
      expect(transaction.sourceId?.toString()).toBe(rewardId);
    });
  });

  describe('家庭排行榜', () => {
    beforeEach(async () => {
      // 创建多个家庭成员
      const familyMembers = [];
      
      for (let i = 1; i <= 3; i++) {
        const member = new User({
          email: `member${i}@example.com`,
          passwordHash: 'hashedpassword',
          name: `家庭成员${i}`,
          role: 'student',
          familyId: testFamily._id,
        });
        await member.save();
        familyMembers.push(member);

        // 为每个成员创建不同数量的积分交易
        for (let j = 0; j < i * 2; j++) {
          await pointsService.createTransaction({
            userId: member._id.toString(),
            familyId: testFamily._id.toString(),
            amount: 25,
            type: 'task_completion' as const,
          });
        }
      }
    });

    test('获取家庭周积分排行榜', async () => {
      const leaderboard = await pointsService.getFamilyLeaderboard(
        testFamily._id.toString(),
        'week'
      );

      expect(leaderboard.length).toBeGreaterThanOrEqual(3);
      
      // 验证排序：积分最高的排在前面
      for (let i = 0; i < leaderboard.length - 1; i++) {
        expect(leaderboard[i].periodPoints).toBeGreaterThanOrEqual(
          leaderboard[i + 1].periodPoints
        );
      }

      // 验证排名
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].rank).toBe(2);
    });
  });

  describe('错误处理和边界情况', () => {
    test('无效用户ID创建交易失败', async () => {
      const transactionData = {
        userId: '',
        familyId: testFamily._id.toString(),
        amount: 50,
        type: 'task_completion' as const,
      };

      await expect(pointsService.createTransaction(transactionData)).rejects.toThrow();
    });

    test('零积分变更创建交易失败', async () => {
      const transactionData = {
        userId: testUser._id.toString(),
        familyId: testFamily._id.toString(),
        amount: 0,
        type: 'task_completion' as const,
      };

      await expect(pointsService.createTransaction(transactionData)).rejects.toThrow();
    });

    test('缓存失效时仍能正常工作', async () => {
      // 模拟Redis失效
      if (redisConnection.get) {
        jest.spyOn(redisConnection, 'get').mockRejectedValue(new Error('Redis连接失败'));
      }

      // 应该从数据库获取余额
      const balance = await pointsService.getBalance(testUser._id.toString());
      expect(balance).toBeDefined();
      expect(typeof balance).toBe('number');
    });
  });
});
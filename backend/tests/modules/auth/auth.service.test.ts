import mongoose from 'mongoose';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { User } from '../../../src/modules/auth/models/user.model';
import { Family } from '../../../src/modules/auth/models/family.model';
import { EventBus } from '../../../src/shared/events/event-bus';
import { RedisConnection } from '../../../src/shared/cache/redis';

describe('AuthService', () => {
  let authService: AuthService;
  let eventBus: EventBus;
  let redisConnection: RedisConnection;

  beforeEach(async () => {
    // 创建模拟的依赖
    redisConnection = new RedisConnection();
    eventBus = new EventBus(redisConnection);
    authService = new AuthService(eventBus);

    // 模拟事件发布
    jest.spyOn(eventBus, 'publish').mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('用户注册', () => {
    test('成功创建新家庭和家长账户', async () => {
      const registerData = {
        email: 'parent@example.com',
        password: 'password123',
        name: '张爸爸',
        role: 'parent' as const,
        familyName: '张家'
      };

      const result = await authService.register(registerData);

      expect(result.user.email).toBe(registerData.email);
      expect(result.user.name).toBe(registerData.name);
      expect(result.user.role).toBe('parent');
      expect(result.family.name).toBe('张家');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();

      // 验证数据库记录
      const user = await User.findById(result.user._id);
      expect(user).toBeTruthy();
      expect(user?.email).toBe(registerData.email);

      const family = await Family.findById(result.family._id);
      expect(family).toBeTruthy();
      expect(family?.name).toBe('张家');
      expect(family?.createdBy?.toString()).toBe(result.user._id?.toString());
    });

    test('成功加入现有家庭', async () => {
      // 先创建一个家庭
      const existingFamily = new Family({
        name: '李家',
        inviteCode: 'ABC123',
        createdBy: new mongoose.Types.ObjectId(),
      });
      await existingFamily.save();

      const registerData = {
        email: 'student@example.com',
        password: 'password123',
        name: '小明',
        role: 'student' as const,
        inviteCode: 'ABC123'
      };

      const result = await authService.register(registerData);

      expect(result.user.role).toBe('student');
      expect(result.family._id?.toString()).toBe(existingFamily._id.toString());
      expect(result.user.familyId?.toString()).toBe(existingFamily._id.toString());
    });

    test('邮箱已存在时注册失败', async () => {
      // 先创建一个用户
      const existingUser = new User({
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        name: '现有用户',
        role: 'student',
        familyId: new mongoose.Types.ObjectId(),
      });
      await existingUser.save();

      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        name: '新用户',
        role: 'student' as const,
        familyName: '新家庭'
      };

      await expect(authService.register(registerData)).rejects.toThrow('该邮箱已被注册');
    });

    test('无效邀请码注册失败', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        name: '测试用户',
        role: 'student' as const,
        inviteCode: 'INVALID'
      };

      await expect(authService.register(registerData)).rejects.toThrow('邀请码无效');
    });

    test('密码过短注册失败', async () => {
      const registerData = {
        email: 'test@example.com',
        password: '123',
        name: '测试用户',
        role: 'student' as const,
        familyName: '测试家庭'
      };

      await expect(authService.register(registerData)).rejects.toThrow('密码至少需要6位');
    });
  });

  describe('用户登录', () => {
    let testUser: any;
    let testFamily: any;

    beforeEach(async () => {
      // 创建测试家庭
      testFamily = new Family({
        name: '测试家庭',
        inviteCode: 'TEST01',
        createdBy: new mongoose.Types.ObjectId(),
      });
      await testFamily.save();

      // 创建测试用户
      testUser = new User({
        email: 'testuser@example.com',
        passwordHash: '$2b$04$rVWS.qZNjZz1yEgYs1C8yOGJBGj9nE6.nE8S2K0K8VJF2tHG5fO8e', // 对应密码: "password123"
        name: '测试用户',
        role: 'student',
        familyId: testFamily._id,
      });
      await testUser.save();
    });

    test('正确邮箱密码登录成功', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'password123'
      };

      const result = await authService.login(loginData);

      expect(result.user.email).toBe(loginData.email);
      expect(result.user.name).toBe('测试用户');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();

      // 验证最后登录时间被更新
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.lastLogin).toBeDefined();
    });

    test('错误邮箱登录失败', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      await expect(authService.login(loginData)).rejects.toThrow('邮箱或密码错误');
    });

    test('错误密码登录失败', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'wrongpassword'
      };

      await expect(authService.login(loginData)).rejects.toThrow('邮箱或密码错误');
    });
  });

  describe('令牌刷新', () => {
    test('有效refresh token可以获取新令牌', async () => {
      // 先创建用户并登录获取token
      const testFamily = new Family({
        name: '测试家庭',
        inviteCode: 'TEST02',
        createdBy: new mongoose.Types.ObjectId(),
      });
      await testFamily.save();

      const testUser = new User({
        email: 'tokentest@example.com',
        passwordHash: '$2b$04$rVWS.qZNjZz1yEgYs1C8yOGJBGj9nE6.nE8S2K0K8VJF2tHG5fO8e',
        name: '令牌测试用户',
        role: 'student',
        familyId: testFamily._id,
      });
      await testUser.save();

      const loginResult = await authService.login({
        email: 'tokentest@example.com',
        password: 'password123'
      });

      // 使用refresh token获取新令牌
      const newTokens = await authService.refreshToken(loginResult.tokens.refreshToken);

      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      expect(newTokens.accessToken).not.toBe(loginResult.tokens.accessToken);
    });

    test('无效refresh token刷新失败', async () => {
      const invalidToken = 'invalid.jwt.token';

      await expect(authService.refreshToken(invalidToken)).rejects.toThrow('刷新令牌无效');
    });
  });

  describe('个人资料管理', () => {
    let testUser: any;

    beforeEach(async () => {
      const testFamily = new Family({
        name: '测试家庭',
        inviteCode: 'TEST03',
        createdBy: new mongoose.Types.ObjectId(),
      });
      await testFamily.save();

      testUser = new User({
        email: 'profile@example.com',
        passwordHash: 'hashedpassword',
        name: '资料测试用户',
        role: 'student',
        familyId: testFamily._id,
      });
      await testUser.save();
    });

    test('获取用户资料成功', async () => {
      const result = await authService.getProfile(testUser._id.toString());

      expect(result.user.name).toBe('资料测试用户');
      expect(result.user.email).toBe('profile@example.com');
      expect(result.family.name).toBe('测试家庭');
    });

    test('更新用户资料成功', async () => {
      const updates = {
        name: '更新后的姓名',
        avatar: 'https://example.com/avatar.jpg'
      };

      const result = await authService.updateProfile(testUser._id.toString(), updates);

      expect(result.name).toBe('更新后的姓名');
      expect(result.avatar).toBe('https://example.com/avatar.jpg');

      // 验证数据库更新
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.name).toBe('更新后的姓名');
    });

    test('不存在的用户ID获取资料失败', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(authService.getProfile(nonExistentId)).rejects.toThrow('用户不存在');
    });
  });

  describe('家庭管理', () => {
    let testFamily: any;
    let testUsers: any[];

    beforeEach(async () => {
      // 创建测试家庭
      testFamily = new Family({
        name: '测试家庭',
        inviteCode: 'FAMILY1',
        createdBy: new mongoose.Types.ObjectId(),
      });
      await testFamily.save();

      // 创建多个家庭成员
      testUsers = [];
      for (let i = 1; i <= 3; i++) {
        const user = new User({
          email: `family${i}@example.com`,
          passwordHash: 'hashedpassword',
          name: `家庭成员${i}`,
          role: i === 1 ? 'parent' : 'student',
          familyId: testFamily._id,
          gameProfile: {
            totalPoints: i * 100,
            level: i,
          }
        });
        await user.save();
        testUsers.push(user);
      }
    });

    test('获取家庭成员列表', async () => {
      const members = await authService.getFamilyMembers(testFamily._id.toString());

      expect(members).toHaveLength(3);
      expect(members[0].name).toBe('家庭成员1');
      expect(members[0].role).toBe('parent');
      expect(members[1].role).toBe('student');
    });

    test('获取家庭排行榜', async () => {
      const leaderboard = await authService.getFamilyLeaderboard(
        testFamily._id.toString(),
        'week',
        false
      );

      expect(leaderboard).toHaveLength(3);
      // 按积分排序，积分最高的在前
      expect(leaderboard[0].totalPoints).toBe(300);
      expect(leaderboard[1].totalPoints).toBe(200);
      expect(leaderboard[2].totalPoints).toBe(100);
    });
  });
});
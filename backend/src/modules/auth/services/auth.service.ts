import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '../models/user.model';
import { Family, IFamily } from '../models/family.model';
import { EventBus, EventTypes } from '@shared/events/event-bus';
import { Logger } from '@shared/utils/logger';
import { ErrorHandler } from '@shared/middleware/error-handler';
import { UserRole } from '@shared/types/common';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  familyName?: string; // 创建新家庭时提供
  inviteCode?: string; // 加入现有家庭时提供
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: Partial<IUser>;
  family: Partial<IFamily>;
  tokens: AuthTokens;
}

export class AuthService {
  private logger: Logger;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.logger = new Logger('AuthService');
    this.eventBus = eventBus;
  }

  public async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // 验证邮箱是否已存在
      const existingUser = await User.findByEmail(data.email);
      if (existingUser) {
        throw ErrorHandler.conflict('该邮箱已被注册');
      }

      // 验证密码强度
      if (data.password.length < 6) {
        throw ErrorHandler.badRequest('密码至少需要6位');
      }

      let family: IFamily;

      // 处理家庭逻辑
      if (data.inviteCode) {
        // 加入现有家庭
        family = await Family.findOne({ inviteCode: data.inviteCode.toUpperCase() });
        if (!family) {
          throw ErrorHandler.badRequest('邀请码无效');
        }

        const canJoin = await (family as any).canJoin();
        if (!canJoin) {
          throw ErrorHandler.badRequest('该家庭成员已满');
        }
      } else if (data.familyName) {
        // 创建新家庭
        if (data.role !== 'parent') {
          throw ErrorHandler.badRequest('只有家长可以创建家庭');
        }

        const inviteCode = await Family.generateInviteCode();
        family = new Family({
          name: data.familyName,
          inviteCode,
          createdBy: null, // 稍后设置
        });
      } else {
        throw ErrorHandler.badRequest('必须提供家庭名称或邀请码');
      }

      // 加密密码
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const passwordHash = await bcrypt.hash(data.password, saltRounds);

      // 创建用户
      const user = new User({
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        role: data.role,
        familyId: family._id,
      });

      // 如果是新家庭，设置创建者
      if (!family.createdBy) {
        family.createdBy = user._id as mongoose.Types.ObjectId;
        await family.save();
      }

      await user.save();

      // 发布用户注册事件
      await this.eventBus.publish(EventTypes.USER_REGISTERED, {
        userId: user._id.toString(),
        familyId: family._id.toString(),
        userRole: user.role,
        familyName: family.name,
      });

      // 如果是加入现有家庭，发布加入事件
      if (data.inviteCode) {
        await this.eventBus.publish(EventTypes.FAMILY_MEMBER_JOINED, {
          userId: user._id.toString(),
          familyId: family._id.toString(),
          userName: user.name,
          userRole: user.role,
        });
      }

      // 生成令牌
      const tokens = this.generateTokens(user, family);

      this.logger.info('User registered successfully', {
        userId: user._id,
        email: user.email,
        familyId: family._id,
      });

      return {
        user: user.toJSON() as any,
        family: {
          _id: family._id,
          name: family.name,
          inviteCode: family.inviteCode,
          settings: family.settings,
        },
        tokens,
      };

    } catch (error) {
      this.logger.error('Registration failed:', error);
      throw error;
    }
  }

  public async login(data: LoginData): Promise<AuthResponse> {
    try {
      // 查找用户
      const user = await User.findByEmail(data.email);
      if (!user) {
        throw ErrorHandler.unauthorized('邮箱或密码错误');
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValidPassword) {
        throw ErrorHandler.unauthorized('邮箱或密码错误');
      }

      // 查找家庭信息
      const family = await Family.findById(user.familyId);
      if (!family) {
        throw ErrorHandler.internalError('用户家庭信息异常');
      }

      // 更新最后登录时间
      user.lastLogin = new Date();
      
      // 重置每日数据
      (user as any).resetDailyXP();
      
      // 检查生命值恢复
      if ((user as any).canRestoreLife()) {
        (user as any).restoreLife();
      }

      await user.save();

      // 发布登录事件
      await this.eventBus.publish(EventTypes.USER_LOGIN, {
        userId: user._id.toString(),
        familyId: family._id.toString(),
        loginTime: new Date().toISOString(),
      });

      // 生成令牌
      const tokens = this.generateTokens(user, family);

      this.logger.info('User logged in successfully', {
        userId: user._id,
        email: user.email,
        familyId: family._id,
      });

      return {
        user: user.toJSON() as any,
        family: {
          _id: family._id,
          name: family.name,
          inviteCode: family.inviteCode,
          settings: family.settings,
          currentChallenge: family.currentChallenge,
        },
        tokens,
      };

    } catch (error) {
      this.logger.error('Login failed:', error);
      throw error;
    }
  }

  public async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw ErrorHandler.internalError('JWT密钥未配置');
      }

      // 验证refresh token
      const decoded = jwt.verify(refreshToken, secret) as any;
      
      if (decoded.type !== 'refresh') {
        throw ErrorHandler.unauthorized('无效的刷新令牌');
      }

      // 查找用户
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw ErrorHandler.unauthorized('用户不存在');
      }

      // 查找家庭
      const family = await Family.findById(user.familyId);
      if (!family) {
        throw ErrorHandler.internalError('用户家庭信息异常');
      }

      // 生成新令牌
      return this.generateTokens(user, family);

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw ErrorHandler.unauthorized('刷新令牌无效');
      }
      throw error;
    }
  }

  public async getProfile(userId: string): Promise<{ user: Partial<IUser>; family: Partial<IFamily> }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw ErrorHandler.notFound('用户不存在');
      }

      const family = await Family.findById(user.familyId);
      if (!family) {
        throw ErrorHandler.internalError('用户家庭信息异常');
      }

      return {
        user: user.toJSON() as any,
        family: {
          _id: family._id,
          name: family.name,
          inviteCode: family.inviteCode,
          settings: family.settings,
          currentChallenge: family.currentChallenge,
        },
      };

    } catch (error) {
      this.logger.error('Get profile failed:', error);
      throw error;
    }
  }

  public async updateProfile(userId: string, updates: Partial<IUser>): Promise<Partial<IUser>> {
    try {
      // 过滤允许更新的字段
      const allowedUpdates = ['name', 'avatar', 'notificationSettings', 'avatarConfig'];
      const filteredUpdates: any = {};

      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          filteredUpdates[key] = updates[key];
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: filteredUpdates },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw ErrorHandler.notFound('用户不存在');
      }

      this.logger.info('Profile updated successfully', { userId });

      return user.toJSON() as any;

    } catch (error) {
      this.logger.error('Update profile failed:', error);
      throw error;
    }
  }

  public async getFamilyMembers(familyId: string): Promise<Partial<IUser>[]> {
    try {
      const members = await User.findFamilyMembers(familyId);
      return members.map(member => member.toJSON());

    } catch (error) {
      this.logger.error('Get family members failed:', error);
      throw error;
    }
  }

  public async getFamilyLeaderboard(
    familyId: string,
    period: 'week' | 'month',
    includeGrowth: boolean = false
  ): Promise<any[]> {
    try {
      // 这里需要与积分系统集成，暂时返回基础信息
      const members = await User.find({ familyId }).select('name gameProfile.totalPoints gameProfile.level');
      
      const leaderboard = members.map(member => ({
        userId: member._id,
        name: member.name,
        totalPoints: member.gameProfile.totalPoints,
        level: member.gameProfile.level,
        // TODO: 从积分账本计算周期性积分
        periodPoints: 0,
        growth: includeGrowth ? 0 : undefined,
      }));

      // 按总积分排序
      leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

      return leaderboard;

    } catch (error) {
      this.logger.error('Get family leaderboard failed:', error);
      throw error;
    }
  }

  private generateTokens(user: IUser, family: IFamily): AuthTokens {
    const secret = process.env.JWT_SECRET;
    const accessExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

    if (!secret) {
      throw ErrorHandler.internalError('JWT密钥未配置');
    }

    const payload = {
      userId: user._id.toString(),
      familyId: family._id.toString(),
      role: user.role,
      email: user.email,
    };

    const accessOptions = {
      expiresIn: accessExpiresIn
    } as any;

    const refreshOptions = {
      expiresIn: refreshExpiresIn
    } as any;

    const accessToken = (jwt.sign as any)(
      { ...payload, type: 'access' },
      secret,
      accessOptions
    );

    const refreshToken = (jwt.sign as any)(
      { ...payload, type: 'refresh' },
      secret,
      refreshOptions
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
    };
  }
}
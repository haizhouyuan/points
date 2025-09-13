import mongoose, { Schema, Document } from 'mongoose';
import { PointsTransactionType } from '@shared/types/common';

export interface IPointsLedger extends Document {
  userId: mongoose.Types.ObjectId;
  familyId: mongoose.Types.ObjectId;
  
  // 积分变更信息
  amount: number; // 正数为收入，负数为支出
  type: PointsTransactionType;
  
  // 关联信息
  sourceId?: mongoose.Types.ObjectId;
  sourceType?: string;
  
  // 账本核心：余额快照
  balanceBefore: number;
  balanceAfter: number;
  
  // 审计信息
  metadata: {
    description?: string;
    category?: string;
    difficulty?: number;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    [key: string]: any;
  };
  
  // 幂等性保护
  idempotencyKey?: string;
  
  createdAt: Date;
  
  // 用于统计查询的预计算字段
  date: Date;
  week: string;
  month: string;
}

const PointsLedgerSchema = new Schema<IPointsLedger>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  familyId: {
    type: Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
    index: true,
  },
  
  amount: {
    type: Number,
    required: true,
  },
  
  type: {
    type: String,
    enum: [
      'task_completion',
      'achievement_reward',
      'daily_bonus',
      'redemption',
      'skill_unlock',
      'streak_bonus',
      'level_up_reward',
    ],
    required: true,
    index: true,
  },
  
  sourceId: {
    type: Schema.Types.ObjectId,
    index: true,
  },
  
  sourceType: {
    type: String,
    enum: ['scheduled_task', 'achievement', 'redemption', 'skill', 'daily_goal'],
  },
  
  balanceBefore: {
    type: Number,
    required: true,
  },
  
  balanceAfter: {
    type: Number,
    required: true,
  },
  
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  
  date: {
    type: Date,
    required: true,
    index: true,
  },
  
  week: {
    type: String,
    required: true,
    index: true,
  },
  
  month: {
    type: String,
    required: true,
    index: true,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// 复合索引优化查询
PointsLedgerSchema.index({ userId: 1, createdAt: -1 });
PointsLedgerSchema.index({ familyId: 1, date: -1 });
PointsLedgerSchema.index({ userId: 1, type: 1, createdAt: -1 });
PointsLedgerSchema.index({ familyId: 1, week: 1, userId: 1 });

// 预保存处理
PointsLedgerSchema.pre('save', function() {
  const now = new Date();
  this.date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // 计算周（ISO周）
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  this.week = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  
  // 计算月份
  this.month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
});

// 静态方法：计算用户余额
PointsLedgerSchema.statics.calculateBalance = async function(userId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, balance: { $sum: '$amount' } } }
  ]);
  
  return result[0]?.balance || 0;
};

// 静态方法：获取用户积分历史
PointsLedgerSchema.statics.getUserHistory = async function(
  userId: string,
  options: {
    type?: PointsTransactionType;
    cursor?: string;
    limit?: number;
  } = {}
) {
  const { type, cursor, limit = 20 } = options;
  
  const query: any = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (type) {
    query.type = type;
  }
  
  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }
  
  const transactions = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1);
  
  const hasMore = transactions.length > limit;
  const data = hasMore ? transactions.slice(0, -1) : transactions;
  const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;
  
  return {
    data,
    pagination: {
      cursor: nextCursor,
      limit,
      hasMore,
    },
  };
};

// 静态方法：获取积分统计
PointsLedgerSchema.statics.getUserSummary = async function(
  userId: string,
  period: 'week' | 'month'
): Promise<{
  totalEarned: number;
  totalSpent: number;
  netChange: number;
  transactionCount: number;
}> {
  const now = new Date();
  let matchField: string;
  let periodValue: string;
  
  if (period === 'week') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    matchField = 'week';
    periodValue = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  } else {
    matchField = 'month';
    periodValue = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }
  
  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        [matchField]: periodValue,
      }
    },
    {
      $group: {
        _id: null,
        totalEarned: {
          $sum: {
            $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
          }
        },
        totalSpent: {
          $sum: {
            $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0]
          }
        },
        netChange: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      }
    }
  ]);
  
  return result[0] || {
    totalEarned: 0,
    totalSpent: 0,
    netChange: 0,
    transactionCount: 0,
  };
};

// 静态方法：获取家庭积分排行榜
PointsLedgerSchema.statics.getFamilyLeaderboard = async function(
  familyId: string,
  period: 'week' | 'month'
): Promise<Array<{
  userId: string;
  totalPoints: number;
  periodPoints: number;
  rank: number;
}>> {
  const now = new Date();
  let matchField: string;
  let periodValue: string;
  
  if (period === 'week') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    matchField = 'week';
    periodValue = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  } else {
    matchField = 'month';
    periodValue = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }
  
  const result = await this.aggregate([
    {
      $match: { familyId: new mongoose.Types.ObjectId(familyId) }
    },
    {
      $group: {
        _id: '$userId',
        totalPoints: { $sum: '$amount' },
        periodPoints: {
          $sum: {
            $cond: [
              { $eq: [`$${matchField}`, periodValue] },
              '$amount',
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        userId: '$_id',
        userName: '$user.name',
        totalPoints: 1,
        periodPoints: 1,
      }
    },
    {
      $sort: { periodPoints: -1, totalPoints: -1 }
    }
  ]);
  
  // 添加排名
  return result.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
};

export const PointsLedger = mongoose.model<IPointsLedger>('PointsLedger', PointsLedgerSchema);
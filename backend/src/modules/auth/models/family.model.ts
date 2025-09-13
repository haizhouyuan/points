import mongoose, { Schema, Document } from 'mongoose';

export interface IFamily extends Document {
  name: string;
  inviteCode: string;
  settings: {
    taskApprovalRequired: boolean;
    pointsRedemptionApprovalRequired: boolean;
    dailyTaskLimit: number;
    weeklyPointsLimit: number;
  };
  
  // 当前家庭挑战
  currentChallenge?: {
    id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    target: number;
    current: number;
    startDate: Date;
    endDate: Date;
    participants: mongoose.Types.ObjectId[];
    rewards: {
      points: number;
      badge?: string;
    };
  };
  
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FamilySchema = new Schema<IFamily>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 6,
    index: true,
  },
  
  settings: {
    taskApprovalRequired: { type: Boolean, default: true },
    pointsRedemptionApprovalRequired: { type: Boolean, default: true },
    dailyTaskLimit: { type: Number, default: 10 },
    weeklyPointsLimit: { type: Number, default: 1000 },
  },
  
  currentChallenge: {
    id: { type: Schema.Types.ObjectId, ref: 'FamilyChallenge' },
    name: String,
    description: String,
    target: Number,
    current: { type: Number, default: 0 },
    startDate: Date,
    endDate: Date,
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    rewards: {
      points: Number,
      badge: String,
    },
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// 静态方法扩展接口
interface FamilyModel extends mongoose.Model<IFamily> {
  generateInviteCode(): Promise<string>;
}

// 生成唯一邀请码
FamilySchema.statics.generateInviteCode = async function(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  let exists: boolean;
  
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const existing = await this.findOne({ inviteCode: code });
    exists = !!existing;
  } while (exists);
  
  return code;
};

// 查找家庭成员数量
FamilySchema.methods.getMemberCount = async function(): Promise<number> {
  const User = mongoose.model('User');
  return await User.countDocuments({ familyId: this._id });
};

// 检查是否可以加入家庭
FamilySchema.methods.canJoin = async function(): Promise<boolean> {
  const memberCount = await this.getMemberCount();
  return memberCount < 10; // 最多10个家庭成员
};

// 更新挑战进度
FamilySchema.methods.updateChallengeProgress = function(progress: number): boolean {
  if (!this.currentChallenge) return false;
  
  this.currentChallenge.current = Math.min(
    this.currentChallenge.current + progress,
    this.currentChallenge.target
  );
  
  return this.currentChallenge.current >= this.currentChallenge.target;
};

export const Family = mongoose.model<IFamily, FamilyModel>('Family', FamilySchema);
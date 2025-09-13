import mongoose, { Document, Schema } from 'mongoose';

export enum RedemptionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum RedemptionCategory {
  SCREEN_TIME = 'screen_time',
  TREATS = 'treats',
  ACTIVITIES = 'activities',
  MONEY = 'money',
  PRIVILEGES = 'privileges',
  EXPERIENCES = 'experiences',
  TOYS_GAMES = 'toys_games',
  CUSTOM = 'custom'
}

export interface IRedemptionItem extends Document {
  _id: string;
  familyId: string;
  name: string;
  description: string;
  category: RedemptionCategory;
  pointsCost: number;
  stockLimit?: number;
  currentStock?: number;
  isActive: boolean;
  imageUrl?: string;
  ageRestriction?: {
    minAge: number;
    maxAge: number;
  };
  availability: {
    startDate?: Date;
    endDate?: Date;
    daysOfWeek?: number[]; // 0-6, Sunday to Saturday
    timeSlots?: Array<{
      start: string; // HH:mm
      end: string;   // HH:mm
    }>;
  };
  metadata: {
    estimatedDeliveryDays?: number;
    requiresParentApproval: boolean;
    requiresEvidence?: boolean;
    instructions?: string;
    tags?: string[];
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRedemptionRequest extends Document {
  _id: string;
  familyId: string;
  userId: string;
  redemptionItemId: string;
  status: RedemptionStatus;
  pointsDeducted: number;
  quantity: number;
  notes?: string;
  requestedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  completedAt?: Date;
  evidenceUrls?: string[];
  deliveryInfo?: {
    expectedDate?: Date;
    actualDate?: Date;
    deliveryMethod?: string;
    deliveryNotes?: string;
  };
  metadata: {
    originalItemSnapshot: {
      name: string;
      description: string;
      pointsCost: number;
      category: RedemptionCategory;
    };
    approvalWorkflow?: Array<{
      approverUserId: string;
      status: 'pending' | 'approved' | 'rejected';
      timestamp?: Date;
      notes?: string;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IRedemptionStats extends Document {
  familyId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  stats: {
    totalRequests: number;
    totalPointsSpent: number;
    approvedRequests: number;
    rejectedRequests: number;
    pendingRequests: number;
    completedRequests: number;
    topCategories: Array<{
      category: RedemptionCategory;
      count: number;
      pointsSpent: number;
    }>;
    topItems: Array<{
      itemId: string;
      itemName: string;
      count: number;
      pointsSpent: number;
    }>;
    userStats: Array<{
      userId: string;
      requestCount: number;
      pointsSpent: number;
      approvalRate: number;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RedemptionItemSchema = new Schema<IRedemptionItem>({
  familyId: { type: String, required: true, index: true },
  name: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 1000 },
  category: { type: String, enum: Object.values(RedemptionCategory), required: true },
  pointsCost: { type: Number, required: true, min: 1 },
  stockLimit: { type: Number, min: 0 },
  currentStock: { type: Number, min: 0 },
  isActive: { type: Boolean, default: true, index: true },
  imageUrl: { type: String },
  ageRestriction: {
    minAge: { type: Number, min: 0, max: 100 },
    maxAge: { type: Number, min: 0, max: 100 }
  },
  availability: {
    startDate: { type: Date },
    endDate: { type: Date },
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],
    timeSlots: [{
      start: { type: String, match: /^([01]?\d|2[0-3]):[0-5]\d$/ },
      end: { type: String, match: /^([01]?\d|2[0-3]):[0-5]\d$/ }
    }]
  },
  metadata: {
    estimatedDeliveryDays: { type: Number, min: 0 },
    requiresParentApproval: { type: Boolean, default: true },
    requiresEvidence: { type: Boolean, default: false },
    instructions: { type: String, maxlength: 2000 },
    tags: [{ type: String, maxlength: 50 }]
  },
  createdBy: { type: String, required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

RedemptionItemSchema.index({ familyId: 1, category: 1 });
RedemptionItemSchema.index({ familyId: 1, isActive: 1, pointsCost: 1 });
RedemptionItemSchema.index({ familyId: 1, 'availability.startDate': 1, 'availability.endDate': 1 });

const RedemptionRequestSchema = new Schema<IRedemptionRequest>({
  familyId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  redemptionItemId: { type: String, required: true, index: true },
  status: { type: String, enum: Object.values(RedemptionStatus), default: RedemptionStatus.PENDING, index: true },
  pointsDeducted: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  notes: { type: String, maxlength: 1000 },
  requestedAt: { type: Date, default: Date.now },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
  reviewNotes: { type: String, maxlength: 1000 },
  completedAt: { type: Date },
  evidenceUrls: [{ type: String }],
  deliveryInfo: {
    expectedDate: { type: Date },
    actualDate: { type: Date },
    deliveryMethod: { type: String, maxlength: 200 },
    deliveryNotes: { type: String, maxlength: 1000 }
  },
  metadata: {
    originalItemSnapshot: {
      name: { type: String, required: true },
      description: { type: String, required: true },
      pointsCost: { type: Number, required: true },
      category: { type: String, enum: Object.values(RedemptionCategory), required: true }
    },
    approvalWorkflow: [{
      approverUserId: { type: String, required: true },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true },
      timestamp: { type: Date },
      notes: { type: String, maxlength: 500 }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

RedemptionRequestSchema.index({ familyId: 1, userId: 1, status: 1 });
RedemptionRequestSchema.index({ familyId: 1, status: 1, requestedAt: -1 });
RedemptionRequestSchema.index({ reviewedBy: 1, status: 1 });

const RedemptionStatsSchema = new Schema<IRedemptionStats>({
  familyId: { type: String, required: true },
  period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  date: { type: Date, required: true },
  stats: {
    totalRequests: { type: Number, default: 0 },
    totalPointsSpent: { type: Number, default: 0 },
    approvedRequests: { type: Number, default: 0 },
    rejectedRequests: { type: Number, default: 0 },
    pendingRequests: { type: Number, default: 0 },
    completedRequests: { type: Number, default: 0 },
    topCategories: [{
      category: { type: String, enum: Object.values(RedemptionCategory) },
      count: { type: Number, default: 0 },
      pointsSpent: { type: Number, default: 0 }
    }],
    topItems: [{
      itemId: { type: String },
      itemName: { type: String },
      count: { type: Number, default: 0 },
      pointsSpent: { type: Number, default: 0 }
    }],
    userStats: [{
      userId: { type: String },
      requestCount: { type: Number, default: 0 },
      pointsSpent: { type: Number, default: 0 },
      approvalRate: { type: Number, default: 0 }
    }]
  }
}, {
  timestamps: true
});

RedemptionStatsSchema.index({ familyId: 1, period: 1, date: -1 }, { unique: true });

export const RedemptionItem = mongoose.model<IRedemptionItem>('RedemptionItem', RedemptionItemSchema);
export const RedemptionRequest = mongoose.model<IRedemptionRequest>('RedemptionRequest', RedemptionRequestSchema);
export const RedemptionStats = mongoose.model<IRedemptionStats>('RedemptionStats', RedemptionStatsSchema);
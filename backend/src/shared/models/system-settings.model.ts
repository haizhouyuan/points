import mongoose, { Document, Schema } from 'mongoose';

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
  JSON = 'json'
}

export enum SettingScope {
  GLOBAL = 'global',
  FAMILY = 'family',
  USER = 'user'
}

export interface ISystemSetting extends Document {
  _id: string;
  key: string;
  scope: SettingScope;
  type: SettingType;
  value: any;
  defaultValue: any;
  description: string;
  category: string;
  isEditable: boolean;
  isVisible: boolean;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
  metadata: {
    version: string;
    lastModifiedBy?: string;
    deprecatedIn?: string;
    replacedBy?: string;
  };
  familyId?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeatureFlag extends Document {
  _id: string;
  name: string;
  key: string;
  description: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  targetAudience: {
    familyIds?: string[];
    userIds?: string[];
    userRoles?: string[];
    regions?: string[];
  };
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }>;
  startDate?: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IApplicationConfig extends Document {
  _id: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  config: {
    // Application settings
    app: {
      name: string;
      version: string;
      description: string;
      supportEmail: string;
      maxFamilyMembers: number;
      maxTasksPerDay: number;
    };
    
    // Points system configuration
    points: {
      defaultTaskReward: number;
      bonusMultipliers: {
        streak: number;
        difficulty: number;
        completion: number;
      };
      redemptionRateLimits: {
        dailyLimit: number;
        weeklyLimit: number;
      };
    };
    
    // Gamification settings
    gamification: {
      levelSystem: {
        baseXPRequired: number;
        xpMultiplier: number;
        maxLevel: number;
      };
      achievements: {
        enabled: boolean;
        categories: string[];
      };
      streaks: {
        enabled: boolean;
        milestones: number[];
      };
    };
    
    // File upload limits
    files: {
      maxFileSize: number;
      maxFilesPerUpload: number;
      allowedTypes: string[];
      storagePath: string;
    };
    
    // Notification settings
    notifications: {
      enabled: boolean;
      channels: string[];
      batchingEnabled: boolean;
      quietHours: {
        start: string;
        end: string;
      };
    };
    
    // Security settings
    security: {
      sessionTimeout: number;
      maxLoginAttempts: number;
      passwordPolicy: {
        minLength: number;
        requireNumbers: boolean;
        requireSymbols: boolean;
        requireUppercase: boolean;
      };
      rateLimit: {
        windowMs: number;
        maxRequests: number;
      };
    };
    
    // Feature toggles
    features: {
      socialFeatures: boolean;
      challengeSystem: boolean;
      analyticsEnabled: boolean;
      fileUploadsEnabled: boolean;
      redemptionSystem: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>({
  key: { type: String, required: true, maxlength: 200 },
  scope: { type: String, enum: Object.values(SettingScope), required: true },
  type: { type: String, enum: Object.values(SettingType), required: true },
  value: { type: Schema.Types.Mixed, required: true },
  defaultValue: { type: Schema.Types.Mixed, required: true },
  description: { type: String, required: true, maxlength: 1000 },
  category: { type: String, required: true, maxlength: 100 },
  isEditable: { type: Boolean, default: true },
  isVisible: { type: Boolean, default: true },
  validation: {
    required: { type: Boolean },
    min: { type: Number },
    max: { type: Number },
    pattern: { type: String },
    enum: [{ type: Schema.Types.Mixed }]
  },
  metadata: {
    version: { type: String, required: true, default: '1.0.0' },
    lastModifiedBy: { type: String },
    deprecatedIn: { type: String },
    replacedBy: { type: String }
  },
  familyId: { type: String },
  userId: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Unique constraints based on scope
SystemSettingSchema.index({ key: 1, scope: 1, familyId: 1, userId: 1 }, { unique: true });
SystemSettingSchema.index({ scope: 1, category: 1 });
SystemSettingSchema.index({ familyId: 1 }, { sparse: true });
SystemSettingSchema.index({ userId: 1 }, { sparse: true });

const FeatureFlagSchema = new Schema<IFeatureFlag>({
  name: { type: String, required: true, maxlength: 200 },
  key: { type: String, required: true, unique: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 1000 },
  isEnabled: { type: Boolean, default: false },
  rolloutPercentage: { type: Number, min: 0, max: 100, default: 0 },
  targetAudience: {
    familyIds: [{ type: String }],
    userIds: [{ type: String }],
    userRoles: [{ type: String }],
    regions: [{ type: String }]
  },
  conditions: [{
    field: { type: String, required: true },
    operator: { 
      type: String, 
      enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'],
      required: true 
    },
    value: { type: Schema.Types.Mixed, required: true }
  }],
  startDate: { type: Date },
  endDate: { type: Date },
  createdBy: { type: String, required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

FeatureFlagSchema.index({ key: 1 }, { unique: true });
FeatureFlagSchema.index({ isEnabled: 1, startDate: 1, endDate: 1 });
FeatureFlagSchema.index({ 'targetAudience.familyIds': 1 });

const ApplicationConfigSchema = new Schema<IApplicationConfig>({
  environment: { 
    type: String, 
    enum: ['development', 'staging', 'production'], 
    required: true, 
    unique: true 
  },
  version: { type: String, required: true },
  config: {
    app: {
      name: { type: String, required: true, default: 'Summer Vacation Planning' },
      version: { type: String, required: true, default: '1.0.0' },
      description: { type: String, required: true },
      supportEmail: { type: String, required: true },
      maxFamilyMembers: { type: Number, default: 10 },
      maxTasksPerDay: { type: Number, default: 20 }
    },
    points: {
      defaultTaskReward: { type: Number, default: 10 },
      bonusMultipliers: {
        streak: { type: Number, default: 1.5 },
        difficulty: { type: Number, default: 2.0 },
        completion: { type: Number, default: 1.2 }
      },
      redemptionRateLimits: {
        dailyLimit: { type: Number, default: 3 },
        weeklyLimit: { type: Number, default: 10 }
      }
    },
    gamification: {
      levelSystem: {
        baseXPRequired: { type: Number, default: 100 },
        xpMultiplier: { type: Number, default: 1.5 },
        maxLevel: { type: Number, default: 100 }
      },
      achievements: {
        enabled: { type: Boolean, default: true },
        categories: [{ type: String }]
      },
      streaks: {
        enabled: { type: Boolean, default: true },
        milestones: [{ type: Number }]
      }
    },
    files: {
      maxFileSize: { type: Number, default: 10485760 }, // 10MB
      maxFilesPerUpload: { type: Number, default: 5 },
      allowedTypes: [{ type: String }],
      storagePath: { type: String, default: './uploads' }
    },
    notifications: {
      enabled: { type: Boolean, default: true },
      channels: [{ type: String }],
      batchingEnabled: { type: Boolean, default: true },
      quietHours: {
        start: { type: String, default: '22:00' },
        end: { type: String, default: '08:00' }
      }
    },
    security: {
      sessionTimeout: { type: Number, default: 3600000 }, // 1 hour
      maxLoginAttempts: { type: Number, default: 5 },
      passwordPolicy: {
        minLength: { type: Number, default: 8 },
        requireNumbers: { type: Boolean, default: true },
        requireSymbols: { type: Boolean, default: false },
        requireUppercase: { type: Boolean, default: false }
      },
      rateLimit: {
        windowMs: { type: Number, default: 60000 }, // 1 minute
        maxRequests: { type: Number, default: 100 }
      }
    },
    features: {
      socialFeatures: { type: Boolean, default: true },
      challengeSystem: { type: Boolean, default: true },
      analyticsEnabled: { type: Boolean, default: true },
      fileUploadsEnabled: { type: Boolean, default: true },
      redemptionSystem: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ApplicationConfigSchema.index({ environment: 1 }, { unique: true });

export const SystemSetting = mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
export const FeatureFlag = mongoose.model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);
export const ApplicationConfig = mongoose.model<IApplicationConfig>('ApplicationConfig', ApplicationConfigSchema);
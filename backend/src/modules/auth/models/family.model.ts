import mongoose, { Schema, Document } from 'mongoose';

// Simplified for single family use
export interface IFamily extends Document {
  name: string;
  settings: {
    taskApprovalRequired: boolean;
    dailyTaskLimit: number;
  };
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
  settings: {
    taskApprovalRequired: { type: Boolean, default: false },
    dailyTaskLimit: { type: Number, default: 20 },
  },
}, {
  timestamps: true,
});

export const Family = mongoose.model<IFamily>('Family', FamilySchema);
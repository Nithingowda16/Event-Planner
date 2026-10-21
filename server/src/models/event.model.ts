import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { EventType, EventStatus } from '@celebrateos/shared';

export interface IBudgetItemSubdoc {
  _id?: Types.ObjectId;
  category: string;
  percentageOfTotal: number;
  allocatedAmount: number;
  allocatedAmountMinor?: number;
  actualSpent: number;
  actualSpentMinor?: number;
  rationale?: string;
  isLocked: boolean;
}

export interface IEvent extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  eventType: EventType;
  eventDate: Date;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  preferences: {
    theme?: string;
    vibe?: string;
    dietaryRestrictions?: string[];
    notes?: string;
  };
  status: EventStatus;
  budgetItems: IBudgetItemSubdoc[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const BudgetItemSubSchema = new Schema<IBudgetItemSubdoc>(
  {
    category: { type: String, required: true, trim: true, maxlength: 100 },
    percentageOfTotal: { type: Number, required: true, min: 0, max: 100 },
    allocatedAmount: { type: Number, required: true, min: 0 },
    allocatedAmountMinor: { type: Number, min: 0 },
    actualSpent: { type: Number, default: 0, min: 0 },
    actualSpentMinor: { type: Number, default: 0, min: 0 },
    rationale: { type: String, maxlength: 500 },
    isLocked: { type: Boolean, default: false },
  },
  { _id: true }
);

const EventSchema = new Schema<IEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Event must belong to a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    eventType: {
      type: String,
      enum: ['wedding', 'birthday', 'community', 'corporate', 'other'],
      required: [true, 'Event type is required'],
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    guestCount: {
      type: Number,
      required: [true, 'Guest count is required'],
      min: [1, 'Guest count must be at least 1'],
      max: [50000, 'Guest count cannot exceed 50,000'],
    },
    totalBudget: {
      type: Number,
      required: [true, 'Total budget is required'],
      min: [0.01, 'Budget must be greater than zero'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      maxlength: 10,
    },
    preferences: {
      theme: { type: String, maxlength: 200 },
      vibe: { type: String, maxlength: 200 },
      dietaryRestrictions: [{ type: String, maxlength: 100 }],
      notes: { type: String, maxlength: 1000 },
    },
    status: {
      type: String,
      enum: ['draft', 'planned', 'active', 'completed'],
      default: 'draft',
      index: true,
    },
    budgetItems: [BudgetItemSubSchema],
  },
  {
    timestamps: true,
    optimisticConcurrency: true, // Enables strict versionKey (__v) concurrency checks
    versionKey: '__v',
  }
);

// Compound Indexes for fast tenant queries and chronological ordering
EventSchema.index({ userId: 1, createdAt: -1 });
EventSchema.index({ userId: 1, eventDate: 1 });
EventSchema.index({ userId: 1, status: 1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);

import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { ProposalStatus, ProposedChangesPayload } from '@celebrateos/shared';

export interface IPlanProposal extends Document {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  baseEventVersion: number; // Snapshot of event.__v at proposal creation
  userPrompt: string;
  proposedChanges: ProposedChangesPayload;
  diffSnapshot?: Record<string, unknown>;
  status: ProposalStatus;
  isApplying?: boolean;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlanProposalSchema = new Schema<IPlanProposal>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Proposal must reference an event'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Proposal must reference a user owner'],
      index: true,
    },
    baseEventVersion: {
      type: Number,
      required: [true, 'Base event version is required for optimistic concurrency checking'],
    },
    userPrompt: {
      type: String,
      required: [true, 'User revision prompt is required'],
      maxlength: 1000,
    },
    proposedChanges: {
      type: Schema.Types.Mixed,
      required: [true, 'Structured proposed changes payload is required'],
    },
    diffSnapshot: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['pending', 'applied', 'rejected', 'stale'],
      default: 'pending',
      index: true,
    },
    isApplying: {
      type: Boolean,
      default: false,
      index: true,
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes for fast tenant access and proposal status lookups
PlanProposalSchema.index({ eventId: 1, status: 1 });
PlanProposalSchema.index({ userId: 1, createdAt: -1 });
PlanProposalSchema.index({ eventId: 1, userId: 1, createdAt: -1 });

export const PlanProposal = mongoose.model<IPlanProposal>('PlanProposal', PlanProposalSchema);

import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { TaskPhase, TaskPriority, TaskStatus, TimelineTaskEntity } from '@celebrateos/shared';

export interface ITask extends Document {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  phase: TaskPhase;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Task must belong to an event'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
      index: true,
    },
    phase: {
      type: String,
      enum: ['pre_event', 'day_of', 'post_event'],
      required: [true, 'Task phase is required'],
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    dueDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      index: true,
    },
    category: {
      type: String,
      maxlength: 100,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes for fast tenant and event queries
TaskSchema.index({ eventId: 1, userId: 1, phase: 1 });
TaskSchema.index({ userId: 1, status: 1 });

export function toTaskEntity(doc: ITask): TimelineTaskEntity {
  return {
    id: doc._id.toString(),
    eventId: doc.eventId.toString(),
    phase: doc.phase,
    title: doc.title,
    description: doc.description,
    dueDate: doc.dueDate ? doc.dueDate.toISOString() : undefined,
    priority: doc.priority,
    status: doc.status,
    category: doc.category,
  };
}

export const Task = mongoose.model<ITask>('Task', TaskSchema);

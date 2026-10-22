import mongoose from 'mongoose';
import { Task, toTaskEntity, type ITask } from '../models/task.model.js';
import { Event } from '../models/event.model.js';
import type { CreateTaskInput, UpdateTaskInput, TimelineTaskEntity } from '@celebrateos/shared';

export class TaskServiceError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'TaskServiceError';
  }
}

/**
 * Ensures the event exists and belongs to the authenticated user.
 */
async function assertEventOwnership(userId: string, eventId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new TaskServiceError(404, 'Event not found');
  }

  const exists = await Event.exists({
    _id: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!exists) {
    throw new TaskServiceError(404, 'Event not found');
  }
}

/**
 * Retrieves all tasks for an event, guaranteeing tenant and event isolation.
 */
export async function getEventTasks(userId: string, eventId: string): Promise<TimelineTaskEntity[]> {
  await assertEventOwnership(userId, eventId);

  const tasks = await Task.find({
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  }).sort({ phase: 1, dueDate: 1, createdAt: 1 });

  return tasks.map(toTaskEntity);
}

/**
 * Creates a new task scoped strictly to the specified event and user.
 */
export async function createTask(
  userId: string,
  eventId: string,
  input: CreateTaskInput
): Promise<TimelineTaskEntity> {
  await assertEventOwnership(userId, eventId);

  const taskDoc: ITask = await Task.create({
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
    phase: input.phase,
    title: input.title.trim(),
    description: input.description,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    priority: input.priority,
    category: input.category,
    status: 'pending',
  });

  return toTaskEntity(taskDoc);
}

/**
 * Updates a task ensuring it belongs to the authenticated user and specified event.
 */
export async function updateTask(
  userId: string,
  eventId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<TimelineTaskEntity> {
  await assertEventOwnership(userId, eventId);

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new TaskServiceError(404, 'Task not found');
  }

  const taskDoc = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!taskDoc) {
    throw new TaskServiceError(404, 'Task not found');
  }

  if (input.phase !== undefined) taskDoc.phase = input.phase;
  if (input.title !== undefined) taskDoc.title = input.title.trim();
  if (input.description !== undefined) taskDoc.description = input.description;
  if (input.dueDate !== undefined) taskDoc.dueDate = input.dueDate ? new Date(input.dueDate) : undefined;
  if (input.priority !== undefined) taskDoc.priority = input.priority;
  if (input.status !== undefined) taskDoc.status = input.status;
  if (input.category !== undefined) taskDoc.category = input.category;

  await taskDoc.save();
  return toTaskEntity(taskDoc);
}

/**
 * Deletes a task ensuring it belongs to the authenticated user and specified event.
 */
export async function deleteTask(userId: string, eventId: string, taskId: string): Promise<void> {
  await assertEventOwnership(userId, eventId);

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new TaskServiceError(404, 'Task not found');
  }

  const result = await Task.deleteOne({
    _id: new mongoose.Types.ObjectId(taskId),
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (result.deletedCount === 0) {
    throw new TaskServiceError(404, 'Task not found');
  }
}

import type { Request, Response, NextFunction } from 'express';
import { CreateTaskSchema, UpdateTaskSchema } from '@celebrateos/shared';
import * as taskService from '../services/task.service.js';

export async function listTasksHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;
    const tasks = await taskService.getEventTasks(userId, eventId);
    res.status(200).json({ tasks });
  } catch (err: unknown) {
    if (err instanceof taskService.TaskServiceError) {
      res.status(err.statusCode).json({ error: 'TaskError', message: err.message });
      return;
    }
    next(err);
  }
}

export async function createTaskHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;

    const parseResult = CreateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid task data',
        issues: parseResult.error.issues,
      });
      return;
    }

    const task = await taskService.createTask(userId, eventId, parseResult.data);
    res.status(201).json({ task });
  } catch (err: unknown) {
    if (err instanceof taskService.TaskServiceError) {
      res.status(err.statusCode).json({ error: 'TaskError', message: err.message });
      return;
    }
    next(err);
  }
}

export async function updateTaskHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;
    const taskId = req.params['taskId'] as string;

    const parseResult = UpdateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid task update data',
        issues: parseResult.error.issues,
      });
      return;
    }

    const task = await taskService.updateTask(userId, eventId, taskId, parseResult.data);
    res.status(200).json({ task });
  } catch (err: unknown) {
    if (err instanceof taskService.TaskServiceError) {
      res.status(err.statusCode).json({ error: 'TaskError', message: err.message });
      return;
    }
    next(err);
  }
}

export async function deleteTaskHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;
    const taskId = req.params['taskId'] as string;

    await taskService.deleteTask(userId, eventId, taskId);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err: unknown) {
    if (err instanceof taskService.TaskServiceError) {
      res.status(err.statusCode).json({ error: 'TaskError', message: err.message });
      return;
    }
    next(err);
  }
}

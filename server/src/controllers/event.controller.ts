import type { Request, Response, NextFunction } from 'express';
import {
  CreateEventInputSchema,
  UpdateEventWithVersionSchema,
  PaginationQuerySchema,
  UpdateBudgetItemSchema,
  BudgetRebalanceInputSchema,
} from '@celebrateos/shared';
import * as eventService from '../services/event.service.js';

export async function listEventsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const query = PaginationQuerySchema.parse(req.query);
    const result = await eventService.getUserEvents(userId, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createEventHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const parseResult = CreateEventInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid event data',
        issues: parseResult.error.issues,
      });
      return;
    }

    const event = await eventService.createEvent(userId, parseResult.data);
    res.status(201).json({ event });
  } catch (err: unknown) {
    if (err instanceof eventService.EventServiceError) {
      res.status(err.statusCode).json({ error: 'EventError', message: err.message, details: err.details });
      return;
    }
    next(err);
  }
}

export async function getEventHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;
    const event = await eventService.getEventById(userId, eventId);
    res.status(200).json({ event });
  } catch (err: unknown) {
    if (err instanceof eventService.EventServiceError) {
      res.status(err.statusCode).json({ error: 'EventError', message: err.message });
      return;
    }
    next(err);
  }
}

export async function updateEventHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;

    const parseResult = UpdateEventWithVersionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid update payload',
        issues: parseResult.error.issues,
      });
      return;
    }

    const { expectedVersion, ...updateData } = parseResult.data;
    const event = await eventService.updateEvent(userId, eventId, updateData, expectedVersion);
    res.status(200).json({ event });
  } catch (err: unknown) {
    if (err instanceof eventService.EventServiceError) {
      res.status(err.statusCode).json({ error: 'EventError', message: err.message, details: err.details });
      return;
    }
    next(err);
  }
}

export async function deleteEventHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;
    await eventService.deleteEvent(userId, eventId);
    res.status(200).json({ message: 'Event and associated resources deleted successfully' });
  } catch (err: unknown) {
    if (err instanceof eventService.EventServiceError) {
      res.status(err.statusCode).json({ error: 'EventError', message: err.message });
      return;
    }
    next(err);
  }
}

export async function getBudgetHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;
    const budget = await eventService.getEventBudget(userId, eventId);
    res.status(200).json({ budget });
  } catch (err: unknown) {
    if (err instanceof eventService.EventServiceError) {
      res.status(err.statusCode).json({ error: 'BudgetError', message: err.message });
      return;
    }
    next(err);
  }
}

export async function updateBudgetItemHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;
    const itemId = req.params['itemId'] as string;

    const parseResult = UpdateBudgetItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid budget item data',
        issues: parseResult.error.issues,
      });
      return;
    }

    const budget = await eventService.updateBudgetItem(userId, eventId, itemId, parseResult.data);
    res.status(200).json({ budget });
  } catch (err: unknown) {
    if (err instanceof eventService.EventServiceError) {
      res.status(err.statusCode).json({ error: 'BudgetError', message: err.message, details: err.details });
      return;
    }
    next(err);
  }
}

export async function rebalanceBudgetHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;

    const parseResult = BudgetRebalanceInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid budget rebalance payload',
        issues: parseResult.error.issues,
      });
      return;
    }

    const budget = await eventService.rebalanceEventBudget(userId, eventId, parseResult.data);
    res.status(200).json({ budget });
  } catch (err: unknown) {
    if (err instanceof eventService.EventServiceError) {
      res.status(err.statusCode).json({ error: 'BudgetError', message: err.message, details: err.details });
      return;
    }
    next(err);
  }
}

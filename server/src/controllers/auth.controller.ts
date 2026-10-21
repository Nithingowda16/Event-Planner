import type { Request, Response, NextFunction } from 'express';
import { RegisterInputSchema, LoginInputSchema } from '@celebrateos/shared';
import * as authService from '../services/auth.service.js';

export async function registerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = RegisterInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid registration input',
        issues: parseResult.error.issues,
      });
      return;
    }

    const result = await authService.register(parseResult.data);
    res.status(201).json(result);
  } catch (err: unknown) {
    if (err instanceof authService.AuthError) {
      res.status(err.statusCode).json({
        error: 'AuthError',
        message: err.message,
      });
      return;
    }
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = LoginInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid login input',
        issues: parseResult.error.issues,
      });
      return;
    }

    const result = await authService.login(parseResult.data);
    res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof authService.AuthError) {
      res.status(err.statusCode).json({
        error: 'AuthError',
        message: err.message,
      });
      return;
    }
    next(err);
  }
}

export async function getMeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const user = await authService.getUserProfile(req.user.id);
    res.status(200).json({ user });
  } catch (err: unknown) {
    if (err instanceof authService.AuthError) {
      res.status(err.statusCode).json({
        error: 'AuthError',
        message: err.message,
      });
      return;
    }
    next(err);
  }
}

export async function logoutHandler(_req: Request, res: Response): Promise<void> {
  // For stateless Bearer token auth, client discards token. Endpoint provides standard acknowledgement.
  res.status(200).json({
    message: 'Logged out successfully. Token discarded on client.',
  });
}

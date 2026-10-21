import type { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthError } from '../services/auth.service.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

// Extend Express Request interface to include authenticated user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'AuthenticationRequired',
      message: 'Authorization header is missing. Bearer token required.',
    });
    return;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({
      error: 'InvalidTokenFormat',
      message: 'Invalid authorization format. Format must be: Bearer <token>',
    });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
    };
    next();
  } catch (err: unknown) {
    const statusCode = err instanceof AuthError ? err.statusCode : 401;
    const message = err instanceof Error ? err.message : 'Invalid or expired token';
    res.status(statusCode).json({
      error: 'Unauthorized',
      message,
    });
  }
}

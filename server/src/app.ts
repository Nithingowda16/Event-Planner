import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth.routes.js';
import { eventRouter } from './routes/event.routes.js';
import { envConfig } from './config/env.js';

export const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: envConfig.CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Healthcheck endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'celebrateos-server',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/events', eventRouter);

// 404 Handler for undefined API routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'NotFound',
    message: 'The requested resource or endpoint was not found',
  });
});

// Centralized Error Handler Middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (envConfig.NODE_ENV !== 'test') {
    console.error('[Unhandled Server Exception]', err);
  }

  res.status(500).json({
    error: 'InternalServerError',
    message: envConfig.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message,
  });
});

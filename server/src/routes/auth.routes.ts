import { Router } from 'express';
import {
  registerHandler,
  loginHandler,
  getMeHandler,
  logoutHandler,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/register', registerHandler);
authRouter.post('/login', loginHandler);
authRouter.get('/me', requireAuth, getMeHandler);
authRouter.post('/logout', requireAuth, logoutHandler);

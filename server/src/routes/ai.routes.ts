import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  generatePlanHandler,
  proposeRevisionHandler,
  listProposalsHandler,
  getProposalHandler,
  approveProposalHandler,
  rejectProposalHandler,
} from '../controllers/ai.controller.js';

export const aiRouter = Router({ mergeParams: true });

// AI Rate Limiter: Prevent LLM quota exhaustion and rapid-fire requests
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI operations per minute per user/IP
  message: {
    error: 'RateLimitExceeded',
    message: 'Too many AI requests. Please wait a moment before generating another plan or revision.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Plan Generation & Proposals
aiRouter.post('/generate', aiRateLimiter, generatePlanHandler);
aiRouter.post('/propose-revision', aiRateLimiter, proposeRevisionHandler);
aiRouter.get('/proposals', listProposalsHandler);
aiRouter.get('/proposals/:proposalId', getProposalHandler);
aiRouter.post('/proposals/:proposalId/approve', approveProposalHandler);
aiRouter.post('/proposals/:proposalId/reject', rejectProposalHandler);

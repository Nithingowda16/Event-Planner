import type { Request, Response, NextFunction } from 'express';
import {
  AIGeneratePlanInputSchema,
  AIRevisionRequestSchema,
  ReviewProposalSchema,
} from '@celebrateos/shared';
import * as planGenerationService from '../services/plan-generation.service.js';
import * as proposalService from '../services/proposal.service.js';
import { AIServiceError } from '../services/gemini.service.js';
import { EventServiceError } from '../services/event.service.js';

export async function generatePlanHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;

    const parseResult = AIGeneratePlanInputSchema.safeParse(req.body);
    const additionalNotes = parseResult.success ? parseResult.data.additionalNotes : undefined;

    const result = await planGenerationService.generateAndApplyInitialPlan(userId, eventId, additionalNotes);
    res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof AIServiceError) {
      res.status(err.statusCode).json({ error: 'AIError', message: err.message, details: err.details });
      return;
    }
    if (err instanceof EventServiceError) {
      res.status(err.statusCode).json({ error: 'EventError', message: err.message, details: err.details });
      return;
    }
    next(err);
  }
}

export async function proposeRevisionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;

    const parseResult = AIRevisionRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid revision instruction payload',
        issues: parseResult.error.issues,
      });
      return;
    }

    const result = await proposalService.generateProposal(userId, eventId, parseResult.data.userPrompt);
    res.status(201).json(result);
  } catch (err: unknown) {
    if (err instanceof AIServiceError) {
      res.status(err.statusCode).json({ error: 'AIError', message: err.message, details: err.details });
      return;
    }
    if (err instanceof proposalService.ProposalServiceError) {
      res.status(err.statusCode).json({ error: 'ProposalError', message: err.message, details: err.details });
      return;
    }
    next(err);
  }
}

export async function listProposalsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;

    const proposals = await proposalService.listEventProposals(userId, eventId);
    res.status(200).json({ proposals });
  } catch (err: unknown) {
    if (err instanceof proposalService.ProposalServiceError) {
      res.status(err.statusCode).json({ error: 'ProposalError', message: err.message });
      return;
    }
    next(err);
  }
}

export async function getProposalHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const proposalId = req.params['proposalId'] as string;

    const proposal = await proposalService.getProposalById(userId, proposalId);
    res.status(200).json({ proposal });
  } catch (err: unknown) {
    if (err instanceof proposalService.ProposalServiceError) {
      res.status(err.statusCode).json({ error: 'ProposalError', message: err.message });
      return;
    }
    next(err);
  }
}

export async function approveProposalHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;
    const proposalId = req.params['proposalId'] as string;

    // Optional expectedVersion from body
    const parseResult = ReviewProposalSchema.safeParse({
      action: 'approve',
      currentEventVersion: req.body?.expectedVersion ?? req.body?.currentEventVersion,
    });

    const expectedVersion = parseResult.success ? parseResult.data.currentEventVersion : undefined;

    const result = await proposalService.approveProposal(userId, eventId, proposalId, expectedVersion);
    res.status(200).json({
      message: 'Proposal approved and applied successfully',
      event: result.event,
      proposal: result.proposal,
    });
  } catch (err: unknown) {
    if (err instanceof proposalService.ProposalServiceError) {
      res.status(err.statusCode).json({ error: 'ProposalError', message: err.message, details: err.details });
      return;
    }
    next(err);
  }
}

export async function rejectProposalHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const proposalId = req.params['proposalId'] as string;

    const proposal = await proposalService.rejectProposal(userId, proposalId);
    res.status(200).json({
      message: 'Proposal rejected without changes',
      proposal,
    });
  } catch (err: unknown) {
    if (err instanceof proposalService.ProposalServiceError) {
      res.status(err.statusCode).json({ error: 'ProposalError', message: err.message });
      return;
    }
    next(err);
  }
}

import type { Request, Response, NextFunction } from 'express';
import { CreateVendorSchema, UpdateVendorSchema } from '@celebrateos/shared';
import * as vendorService from '../services/vendor.service.js';

export async function listVendorsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;
    const vendors = await vendorService.getEventVendors(userId, eventId);
    res.status(200).json({ vendors });
  } catch (err: unknown) {
    if (err instanceof vendorService.VendorServiceError) {
      res.status(err.statusCode).json({ error: 'VendorError', message: err.message });
      return;
    }
    next(err);
  }
}

export async function createVendorHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;

    const parseResult = CreateVendorSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid vendor quote data',
        issues: parseResult.error.issues,
      });
      return;
    }

    const vendor = await vendorService.createVendor(userId, eventId, parseResult.data);
    res.status(201).json({ vendor });
  } catch (err: unknown) {
    if (err instanceof vendorService.VendorServiceError) {
      res.status(err.statusCode).json({ error: 'VendorError', message: err.message });
      return;
    }
    next(err);
  }
}

export async function updateVendorHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;
    const vendorId = req.params['vendorId'] as string;

    const parseResult = UpdateVendorSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid vendor quote update data',
        issues: parseResult.error.issues,
      });
      return;
    }

    const vendor = await vendorService.updateVendor(userId, eventId, vendorId, parseResult.data);
    res.status(200).json({ vendor });
  } catch (err: unknown) {
    if (err instanceof vendorService.VendorServiceError) {
      res.status(err.statusCode).json({ error: 'VendorError', message: err.message });
      return;
    }
    next(err);
  }
}

export async function deleteVendorHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const eventId = req.params['id'] as string;
    const vendorId = req.params['vendorId'] as string;

    await vendorService.deleteVendor(userId, eventId, vendorId);
    res.status(200).json({ message: 'Vendor quotation deleted successfully' });
  } catch (err: unknown) {
    if (err instanceof vendorService.VendorServiceError) {
      res.status(err.statusCode).json({ error: 'VendorError', message: err.message });
      return;
    }
    next(err);
  }
}

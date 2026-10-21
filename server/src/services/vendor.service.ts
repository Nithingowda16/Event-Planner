import mongoose from 'mongoose';
import { VendorQuotation, toVendorEntity, type IVendorQuotation } from '../models/vendor.model.js';
import { Event } from '../models/event.model.js';
import type { CreateVendorInput, UpdateVendorInput, VendorQuotationEntity } from '@celebrateos/shared';

export class VendorServiceError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'VendorServiceError';
  }
}

/**
 * Ensures the event exists and belongs to the authenticated user.
 */
async function assertEventOwnership(userId: string, eventId: string) {
  if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new VendorServiceError(404, 'Event not found');
  }

  const event = await Event.findOne({
    _id: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!event) {
    throw new VendorServiceError(404, 'Event not found');
  }

  return event;
}

/**
 * Retrieves all vendor quotations for an event, guaranteeing tenant and event isolation.
 */
export async function getEventVendors(userId: string, eventId: string): Promise<VendorQuotationEntity[]> {
  await assertEventOwnership(userId, eventId);

  const vendors = await VendorQuotation.find({
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  }).sort({ category: 1, quotedAmount: 1 });

  return vendors.map(toVendorEntity);
}

/**
 * Creates a new vendor quotation scoped strictly to the specified event and user.
 */
export async function createVendor(
  userId: string,
  eventId: string,
  input: CreateVendorInput
): Promise<VendorQuotationEntity> {
  await assertEventOwnership(userId, eventId);

  const vendorDoc: IVendorQuotation = await VendorQuotation.create({
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
    category: input.category.trim(),
    vendorName: input.vendorName.trim(),
    contactEmail: input.contactEmail ? input.contactEmail.trim().toLowerCase() : undefined,
    quotedAmount: input.quotedAmount,
    status: input.status || 'inquired',
    deliverablesNotes: input.deliverablesNotes,
    ratingScore: input.ratingScore,
  });

  return toVendorEntity(vendorDoc);
}

/**
 * Updates a vendor quotation ensuring it belongs to the authenticated user and specified event.
 */
export async function updateVendor(
  userId: string,
  eventId: string,
  vendorId: string,
  input: UpdateVendorInput
): Promise<VendorQuotationEntity> {
  await assertEventOwnership(userId, eventId);

  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new VendorServiceError(404, 'Vendor not found');
  }

  const vendorDoc = await VendorQuotation.findOne({
    _id: new mongoose.Types.ObjectId(vendorId),
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!vendorDoc) {
    throw new VendorServiceError(404, 'Vendor quotation not found');
  }

  if (input.category !== undefined) vendorDoc.category = input.category.trim();
  if (input.vendorName !== undefined) vendorDoc.vendorName = input.vendorName.trim();
  if (input.contactEmail !== undefined) vendorDoc.contactEmail = input.contactEmail ? input.contactEmail.trim().toLowerCase() : undefined;
  if (input.quotedAmount !== undefined) vendorDoc.quotedAmount = input.quotedAmount;
  if (input.status !== undefined) vendorDoc.status = input.status;
  if (input.deliverablesNotes !== undefined) vendorDoc.deliverablesNotes = input.deliverablesNotes;
  if (input.ratingScore !== undefined) vendorDoc.ratingScore = input.ratingScore;

  await vendorDoc.save();
  return toVendorEntity(vendorDoc);
}

/**
 * Deletes a vendor quotation ensuring it belongs to the authenticated user and specified event.
 */
export async function deleteVendor(userId: string, eventId: string, vendorId: string): Promise<void> {
  await assertEventOwnership(userId, eventId);

  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new VendorServiceError(404, 'Vendor not found');
  }

  const result = await VendorQuotation.deleteOne({
    _id: new mongoose.Types.ObjectId(vendorId),
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (result.deletedCount === 0) {
    throw new VendorServiceError(404, 'Vendor quotation not found');
  }
}

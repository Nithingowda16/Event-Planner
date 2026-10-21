import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { VendorStatus, VendorQuotationEntity } from '@celebrateos/shared';

export interface IVendorQuotation extends Document {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  category: string;
  vendorName: string;
  contactEmail?: string;
  quotedAmount: number;
  status: VendorStatus;
  deliverablesNotes?: string;
  ratingScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const VendorQuotationSchema = new Schema<IVendorQuotation>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Vendor quotation must belong to an event'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor quotation must belong to a user'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Vendor category is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    vendorName: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    quotedAmount: {
      type: Number,
      required: [true, 'Quoted amount is required'],
      min: [0, 'Quoted amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['inquired', 'shortlisted', 'hired', 'rejected'],
      default: 'inquired',
      index: true,
    },
    deliverablesNotes: {
      type: String,
      maxlength: 1000,
    },
    ratingScore: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for tenant-scoped querying
VendorQuotationSchema.index({ eventId: 1, userId: 1, category: 1 });
VendorQuotationSchema.index({ userId: 1, status: 1 });

export function toVendorEntity(doc: IVendorQuotation): VendorQuotationEntity {
  return {
    id: doc._id.toString(),
    eventId: doc.eventId.toString(),
    category: doc.category,
    vendorName: doc.vendorName,
    contactEmail: doc.contactEmail,
    quotedAmount: doc.quotedAmount,
    status: doc.status,
    deliverablesNotes: doc.deliverablesNotes,
    ratingScore: doc.ratingScore,
  };
}

export const VendorQuotation = mongoose.model<IVendorQuotation>('VendorQuotation', VendorQuotationSchema);

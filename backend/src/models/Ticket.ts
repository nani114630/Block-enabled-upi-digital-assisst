import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ITicket extends Document {
  uniqueId: string;
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  ticketType: string;
  attendeeName: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  nftTokenId?: number;
  qrCodeData: string;
  status: 'issued' | 'used' | 'cancelled' | 'refunded';
  checkedInAt?: Date;
  checkedInBy?: mongoose.Types.ObjectId;
  purchaseOrderId: mongoose.Types.ObjectId;
  priceInINR: number;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    uniqueId: {
      type: String,
      required: true,
      unique: true,
      default: () => `TKT-${uuidv4().toUpperCase().replace(/-/g, '').substring(0, 12)}`,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticketType: {
      type: String,
      required: true,
    },
    attendeeName: {
      type: String,
      required: [true, 'Attendee name is required'],
      trim: true,
    },
    attendeeEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    attendeePhone: {
      type: String,
      default: null,
      trim: true,
    },
    nftTokenId: {
      type: Number,
      default: null,
    },
    qrCodeData: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['issued', 'used', 'cancelled', 'refunded'],
      default: 'issued',
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    priceInINR: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({ uniqueId: 1 });
ticketSchema.index({ eventId: 1, status: 1 });
ticketSchema.index({ qrCodeData: 1 });
ticketSchema.index({ nftTokenId: 1 });
ticketSchema.index({ purchaseOrderId: 1 });
ticketSchema.index({ attendeeEmail: 1 });
ticketSchema.index({ userId: 1 });
ticketSchema.index({ checkedInAt: -1 });

export const Ticket: Model<ITicket> = mongoose.model<ITicket>('Ticket', ticketSchema);
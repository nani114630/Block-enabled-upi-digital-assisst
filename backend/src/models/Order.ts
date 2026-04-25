import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  assetId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'created' | 'initiated' | 'failed' | 'completed' | 'refunded' | 'cancelled';
  paymentGateway: 'razorpay' | 'cashfree';
  paymentOrderId?: string;
  paymentId?: string;
  paymentLink?: string;
  redirectUrl?: string;
  attemptCount: number;
  expiresAt: Date;
  paidAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assetId: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be at least 1 paise'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['created', 'initiated', 'failed', 'completed', 'refunded', 'cancelled'],
      default: 'created',
    },
    paymentGateway: {
      type: String,
      enum: ['razorpay', 'cashfree'],
      default: 'razorpay',
    },
    paymentOrderId: {
      type: String,
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    },
    paymentLink: {
      type: String,
      default: null,
    },
    redirectUrl: {
      type: String,
      default: null,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentOrderId: 1 });
orderSchema.index({ paidAt: -1 });

export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);
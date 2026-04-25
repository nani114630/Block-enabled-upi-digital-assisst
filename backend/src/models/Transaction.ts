import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  transactionId: string;
  type: 'payment' | 'refund' | 'mint' | 'transfer';
  orderId?: mongoose.Types.ObjectId;
  nftId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  gateway?: string;
  gatewayTransactionId?: string;
  blockchainTransactionHash?: string;
  status: 'pending' | 'success' | 'failed';
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['payment', 'refund', 'mint', 'transfer'],
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    nftId: {
      type: Schema.Types.ObjectId,
      ref: 'NFT',
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    gateway: {
      type: String,
      default: null,
    },
    gatewayTransactionId: {
      type: String,
      default: null,
    },
    blockchainTransactionHash: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ nftId: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });

export const Transaction: Model<ITransaction> = mongoose.model<ITransaction>(
  'Transaction',
  transactionSchema
);
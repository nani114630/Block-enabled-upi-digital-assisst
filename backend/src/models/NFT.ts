import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOwnershipHistory {
  userId: mongoose.Types.ObjectId;
  walletAddress: string;
  acquiredAt: Date;
  transactionHash: string;
}

export interface INFT extends Document {
  tokenId: number;
  tokenUri: string;
  assetId: mongoose.Types.ObjectId;
  contractAddress: string;
  creatorUserId: mongoose.Types.ObjectId;
  ownerUserId: mongoose.Types.ObjectId;
  ownerWalletAddress: string;
  purchaseOrderId: mongoose.Types.ObjectId;
  paymentId?: string;
  ipfsMetadataHash: string;
  blockchain: {
    transactionHash: string;
    blockNumber: number;
    blockTimestamp: Date;
  };
  ownershipHistory: IOwnershipHistory[];
  mintedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ownershipHistorySchema = new Schema<IOwnershipHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    walletAddress: { type: String, required: true },
    acquiredAt: { type: Date, default: Date.now },
    transactionHash: { type: String, required: true },
  },
  { _id: false }
);

const blockchainSchema = new Schema(
  {
    transactionHash: { type: String, required: true },
    blockNumber: { type: Number, default: 0 },
    blockTimestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const nftSchema = new Schema<INFT>(
  {
    tokenId: {
      type: Number,
      required: true,
      unique: true,
    },
    tokenUri: {
      type: String,
      required: true,
    },
    assetId: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    contractAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    creatorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerWalletAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    paymentId: {
      type: String,
      default: null,
    },
    ipfsMetadataHash: {
      type: String,
      required: true,
    },
    blockchain: {
      type: blockchainSchema,
      default: () => ({}),
    },
    ownershipHistory: {
      type: [ownershipHistorySchema],
      default: [],
    },
    mintedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

nftSchema.index({ tokenId: 1 });
nftSchema.index({ ownerUserId: 1, createdAt: -1 });
nftSchema.index({ assetId: 1 });
nftSchema.index({ contractAddress: 1 });

export const NFT: Model<INFT> = mongoose.model<INFT>('NFT', nftSchema);
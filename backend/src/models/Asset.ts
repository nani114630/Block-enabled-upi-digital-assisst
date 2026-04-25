import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAsset extends Document {
  name: string;
  slug: string;
  description: string;
  priceInINR: number;
  originalPriceInINR?: number;
  category: string;
  tags: string[];
  creator: {
    name: string;
    walletAddress?: string;
    royaltyPercent: number;
  };
  media: {
    ipfsHash?: string;
    imageUrl: string;
    previewUrl?: string;
    mimeType: string;
    fileSize: number;
  };
  metadata: {
    ipfsHash?: string;
    jsonUrl?: string;
  };
  status: 'draft' | 'active' | 'sold' | 'hidden';
  maxSupply: number;
  currentSupply: number;
  viewCount: number;
  likeCount: number;
  isFeatured: boolean;
  expiresAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const assetMediaSchema = new Schema(
  {
    ipfsHash: { type: String, default: null },
    imageUrl: { type: String, required: true },
    previewUrl: { type: String, default: null },
    mimeType: { type: String, default: 'image/jpeg' },
    fileSize: { type: Number, default: 0 },
  },
  { _id: false }
);

const assetMetadataSchema = new Schema(
  {
    ipfsHash: { type: String, default: null },
    jsonUrl: { type: String, default: null },
  },
  { _id: false }
);

const creatorSchema = new Schema(
  {
    name: { type: String, required: true },
    walletAddress: { type: String, default: null },
    royaltyPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const assetSchema = new Schema<IAsset>(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 5000,
    },
    priceInINR: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be at least ₹1'],
    },
    originalPriceInINR: {
      type: Number,
      default: null,
    },
    category: {
      type: String,
      required: true,
      default: 'digital-art',
    },
    tags: {
      type: [String],
      default: [],
    },
    creator: {
      type: creatorSchema,
      default: () => ({}),
    },
    media: {
      type: assetMediaSchema,
      required: true,
    },
    metadata: {
      type: assetMetadataSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'sold', 'hidden'],
      default: 'draft',
    },
    maxSupply: {
      type: Number,
      default: 1,
      min: 1,
    },
    currentSupply: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

assetSchema.index({ name: 'text', description: 'text' });
assetSchema.index({ slug: 1 });
assetSchema.index({ category: 1 });
assetSchema.index({ status: 1, createdAt: -1 });
assetSchema.index({ priceInINR: 1 });
assetSchema.index({ isFeatured: 1, status: 1 });

export const Asset: Model<IAsset> = mongoose.model<IAsset>('Asset', assetSchema);
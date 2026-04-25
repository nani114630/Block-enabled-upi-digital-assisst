import mongoose from 'mongoose';
import slugify from 'slugify';
import { Asset, Order, NFT } from '../models/index.js';
import { ipfsService } from './ipfs.service.js';
import { AppError, NotFoundError, ValidationError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export interface CreateAssetInput {
  name: string;
  description: string;
  priceInINR: number;
  category: string;
  tags?: string[];
  creator: {
    name: string;
    walletAddress?: string;
    royaltyPercent?: number;
  };
  media: {
    ipfsHash?: string;
    imageUrl: string;
    mimeType: string;
    fileSize: number;
  };
}

export interface UpdateAssetInput {
  name?: string;
  description?: string;
  priceInINR?: number;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'active' | 'sold' | 'hidden';
  isFeatured?: boolean;
}

export const assetService = {
  async create(input: CreateAssetInput, userId: string) {
    const { name, description, priceInINR, category, tags, creator, media } = input;

    const baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 0;

    while (await Asset.findOne({ slug })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const asset = new Asset({
      name,
      slug,
      description,
      priceInINR,
      category,
      tags: tags || [],
      creator,
      media,
      status: 'active',
      maxSupply: 1,
      currentSupply: 0,
      viewCount: 0,
      likeCount: 0,
      isFeatured: false,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    await asset.save();

    logger.info('Asset created:', { assetId: asset._id, slug });

    return asset;
  },

  async findAll(filters: {
    category?: string;
    status?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      category,
      status = 'active',
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const query: Record<string, unknown> = { status };

    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }
    if (minPrice || maxPrice) {
      query.priceInINR = {};
      if (minPrice) (query.priceInINR as Record<string, number>).$gte = minPrice;
      if (maxPrice) (query.priceInINR as Record<string, number>).$lte = maxPrice;
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [assets, total] = await Promise.all([
      Asset.find(query).sort(sort).skip(skip).limit(limit).populate('createdBy', 'name email'),
      Asset.countDocuments(query),
    ]);

    return {
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(assetId: string) {
    const asset = await Asset.findById(assetId).populate('createdBy', 'name email');

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    await Asset.findByIdAndUpdate(assetId, {
      $inc: { viewCount: 1 },
    });

    return asset;
  },

  async findBySlug(slug: string) {
    const asset = await Asset.findOne({ slug }).populate('createdBy', 'name email');

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    await Asset.findByIdAndUpdate(asset._id, {
      $inc: { viewCount: 1 },
    });

    return asset;
  },

  async update(assetId: string, input: UpdateAssetInput) {
    const asset = await Asset.findById(assetId);

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const updates = Object.keys(input);
    const allowedUpdates = [
      'name',
      'description',
      'priceInINR',
      'category',
      'tags',
      'status',
      'isFeatured',
    ];

    for (const key of updates) {
      if (allowedUpdates.includes(key)) {
        (asset as unknown as Record<string, unknown>)[key] = (input as Record<string, unknown>)[key];
      }
    }

    await asset.save();

    logger.info('Asset updated:', { assetId });

    return asset;
  },

  async updateStatus(assetId: string, status: 'draft' | 'active' | 'sold' | 'hidden') {
    const asset = await Asset.findByIdAndUpdate(
      assetId,
      { status },
      { new: true }
    );

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    logger.info('Asset status updated:', { assetId, status });

    return asset;
  },

  async delete(assetId: string) {
    const asset = await Asset.findByIdAndDelete(assetId);

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    logger.info('Asset deleted:', { assetId });

    return asset;
  },

  async getFeatured() {
    const assets = await Asset.find({ status: 'active', isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('createdBy', 'name email');

    return assets;
  },

  async getCategories() {
    const categories = await Asset.distinct('category', { status: 'active' });
    return categories;
  },

  async checkAndUpdateSold(assetId: string) {
    const asset = await Asset.findById(assetId);

    if (asset && asset.currentSupply >= asset.maxSupply) {
      await Asset.findByIdAndUpdate(assetId, { status: 'sold' });
    }
  },

  async getOrganizerStats(userId: string) {
    const assets = await Asset.find({ createdBy: new mongoose.Types.ObjectId(userId) });

    const assetIds = assets.map(a => a._id);

    const [orders, nfts] = await Promise.all([
      Order.find({ assetId: { $in: assetIds } }).populate('userId', 'name email walletAddress').populate('assetId', 'name'),
      NFT.find({ assetId: { $in: assetIds } }).populate('ownerUserId', 'name email walletAddress').populate('assetId', 'name'),
    ]);

    const stats = assets.map(asset => {
      const assetOrders = (orders as unknown as Array<{ assetId: { toString(): string }; status: string; _id: unknown; amount: number; paidAt: unknown; userId: unknown }>).filter(o => o.assetId.toString() === asset._id.toString());
      const assetNfts = (nfts as unknown as Array<{ assetId: { toString(): string }; tokenId: number; mintedAt: unknown; blockchain: { transactionHash: string }; ownerUserId: unknown }>).filter(n => n.assetId.toString() === asset._id.toString());
      const completedOrders = assetOrders.filter(o => o.status === 'completed');

      return {
        assetId: asset._id,
        name: asset.name,
        totalTickets: assetOrders.length,
        ticketsSold: completedOrders.length,
        revenue: completedOrders.reduce((sum: number, o) => sum + (o.amount / 100), 0),
        attendees: completedOrders.map(o => ({
          orderId: o._id,
          userId: (o.userId as unknown as { _id: string; name: string; email: string })._id,
          name: (o.userId as unknown as { _id: string; name: string; email: string }).name,
          email: (o.userId as unknown as { _id: string; name: string; email: string }).email,
          paidAt: o.paidAt,
        })),
        nfts: assetNfts.map(n => ({
          tokenId: n.tokenId,
          ownerName: (n.ownerUserId as unknown as { name: string; email: string }).name,
          ownerEmail: (n.ownerUserId as unknown as { name: string; email: string }).email,
          mintedAt: n.mintedAt,
          transactionHash: n.blockchain.transactionHash,
        })),
      };
    });

    return {
      events: stats,
      totalRevenue: stats.reduce((sum, s) => sum + s.revenue, 0),
      totalEvents: assets.length,
      totalTicketsSold: stats.reduce((sum, s) => sum + s.ticketsSold, 0),
    };
  },

  async getEventOrders(assetId: string, userId: string) {
    const asset = await Asset.findById(assetId);
    if (!asset) throw new NotFoundError('Asset not found');
    if (asset.createdBy.toString() !== userId) throw new AppError('Access denied', 403);

    const orders = await Order.find({ assetId: new mongoose.Types.ObjectId(assetId), status: 'completed' })
      .populate('userId', 'name email walletAddress')
      .sort({ paidAt: -1 });

    const nfts = await NFT.find({ assetId: new mongoose.Types.ObjectId(assetId) });

    return {
      orders: (orders as unknown as Array<{ _id: unknown; amount: number; paidAt: unknown; userId: unknown }>).map(o => ({
        orderId: o._id,
        userId: (o.userId as unknown as { _id: string; name: string; email: string })._id,
        name: (o.userId as unknown as { _id: string; name: string; email: string }).name,
        email: (o.userId as unknown as { _id: string; name: string; email: string }).email,
        amount: o.amount / 100,
        paidAt: o.paidAt,
      })),
      nfts: (nfts as unknown as Array<{ tokenId: number; mintedAt: unknown; blockchain: { transactionHash: string }; ownerUserId: unknown }>).map(n => ({
        tokenId: n.tokenId,
        ownerName: (n.ownerUserId as unknown as { name: string; email: string }).name,
        ownerEmail: (n.ownerUserId as unknown as { name: string; email: string }).email,
        mintedAt: n.mintedAt,
        transactionHash: n.blockchain.transactionHash,
      })),
    };
  },
};
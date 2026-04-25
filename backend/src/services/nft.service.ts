import { ethers } from 'ethers';
import mongoose from 'mongoose';
import { NFT, Asset, Order, User } from '../models/index.js';
import { blockchainService } from './blockchain.service.js';
import { ipfsService } from './ipfs.service.js';
import { AppError, NotFoundError, ValidationError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export interface MintNFTInput {
  orderId: string;
  paymentId: string;
}

export interface TransferNFTInput {
  tokenId: number;
  fromUserId: string;
  toWalletAddress: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  properties?: Record<string, unknown>;
}

export const nftService = {
  async mint(input: MintNFTInput) {
    const { orderId, paymentId } = input;

    const order = await Order.findById(orderId).populate('assetId');
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== 'completed') {
      throw new ValidationError('Order is not completed', [
        { field: 'orderId', message: 'Payment must be completed before minting' },
      ]);
    }

    const existingNFT = await NFT.findOne({ purchaseOrderId: order._id });
    if (existingNFT) {
      throw new ValidationError('NFT already minted for this order', [
        { field: 'orderId', message: 'NFT has already been minted' },
      ]);
    }

    const asset = order.assetId as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      description: string;
      media: { ipfsHash: string; imageUrl: string };
      creator: { name: string };
      priceInINR: number;
    };
    const user = await User.findById(order.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const walletAddress = user.walletAddress || config.contract.address;

    const mediaHash = asset.media?.ipfsHash || asset.media?.imageUrl;
    const metadata: NFTMetadata = {
      name: asset.name,
      description: asset.description,
      image: mediaHash ? ipfsService.formatIPFSUrl(mediaHash) : '',
      attributes: [
        { trait_type: 'Artist', value: asset.creator.name },
        { trait_type: 'Collection', value: 'Digital Assets' },
        { trait_type: 'Original Price', value: `₹${asset.priceInINR}` },
        { trait_type: 'Purchase Date', value: order.paidAt?.toISOString() || new Date().toISOString() },
        { trait_type: 'Blockchain', value: 'Polygon' },
      ],
      external_url: `${config.cors.allowedOrigins[0]}/nft/${asset._id}`,
      properties: {
        assetId: asset._id.toString(),
        orderId: order._id.toString(),
        paymentId,
      },
    };

    const ipfsResult = await ipfsService.uploadJSON(metadata);

    await blockchainService.initialize();

    const mintResult = await blockchainService.mintAsset(
      walletAddress,
      ipfsService.formatIPFSUrl(ipfsResult.IpfsHash)
    );

    const nft = new NFT({
      tokenId: mintResult.tokenId,
      tokenUri: ipfsService.formatIPFSUrl(ipfsResult.IpfsHash),
      assetId: asset._id,
      contractAddress: config.contract.address,
      creatorUserId: order.userId,
      ownerUserId: order.userId,
      ownerWalletAddress: walletAddress.toLowerCase(),
      purchaseOrderId: order._id,
      paymentId,
      ipfsMetadataHash: ipfsResult.IpfsHash,
      blockchain: {
        transactionHash: mintResult.transactionHash,
        blockNumber: mintResult.blockNumber,
        blockTimestamp: new Date(),
      },
      ownershipHistory: [
        {
          userId: order.userId,
          walletAddress: walletAddress.toLowerCase(),
          acquiredAt: new Date(),
          transactionHash: mintResult.transactionHash,
        },
      ],
      mintedAt: new Date(),
    });

    await nft.save();

    await Asset.findByIdAndUpdate(asset._id, {
      $inc: { currentSupply: 1 },
    });

    logger.info('NFT minted successfully:', {
      tokenId: mintResult.tokenId,
      orderId,
      paymentId,
      transactionHash: mintResult.transactionHash,
      owner: walletAddress,
    });

    return nft;
  },

  async findAll(filters?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 12, search } = filters || {};

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { tokenId: { $regex: search, $options: 'i' } },
        { ownerWalletAddress: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [nfts, total] = await Promise.all([
      NFT.find(query)
        .sort({ mintedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assetId')
        .populate('ownerUserId', 'name email'),
      NFT.countDocuments(query),
    ]);

    return {
      nfts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(tokenId: number) {
    const nft = await NFT.findOne({ tokenId })
      .populate('assetId')
      .populate('ownerUserId', 'name email')
      .populate('creatorUserId', 'name email');

    if (!nft) {
      throw new NotFoundError('NFT not found');
    }

    return nft;
  },

  async findByUser(userId: string, filters?: {
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 12 } = filters || {};

    const query = { ownerUserId: new mongoose.Types.ObjectId(userId) };
    const skip = (page - 1) * limit;

    const [nfts, total] = await Promise.all([
      NFT.find(query)
        .sort({ mintedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assetId'),
      NFT.countDocuments(query),
    ]);

    return {
      nfts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findByAsset(assetId: string) {
    const nfts = await NFT.find({ assetId: new mongoose.Types.ObjectId(assetId) })
      .populate('ownerUserId', 'name email')
      .sort({ mintedAt: -1 });

    return nfts;
  },

  async transfer(input: TransferNFTInput) {
    const { tokenId, fromUserId, toWalletAddress } = input;

    const nft = await NFT.findOne({ tokenId, ownerUserId: new mongoose.Types.ObjectId(fromUserId) });
    if (!nft) {
      throw new NotFoundError('NFT not found or you do not own this NFT');
    }

    if (!ethers.isAddress(toWalletAddress)) {
      throw new ValidationError('Invalid wallet address', [
        { field: 'toWalletAddress', message: 'Please provide a valid Ethereum address' },
      ]);
    }

    const fromWalletAddress = nft.ownerWalletAddress;

    const txHash = await blockchainService.transferAsset(toWalletAddress, tokenId);

    nft.ownerUserId = new mongoose.Types.ObjectId();
    nft.ownerWalletAddress = toWalletAddress.toLowerCase();
    nft.ownershipHistory.push({
      userId: new mongoose.Types.ObjectId(fromUserId),
      walletAddress: fromWalletAddress,
      acquiredAt: new Date(),
      transactionHash: txHash,
    });
    await nft.save();

    logger.info('NFT transferred:', {
      tokenId,
      from: fromWalletAddress,
      to: toWalletAddress,
      transactionHash: txHash,
    });

    return nft;
  },

  async verifyOwnership(tokenId: number, userId?: string) {
    const nft = await NFT.findOne({ tokenId });
    if (!nft) {
      throw new NotFoundError('NFT not found');
    }

    const blockchainOwner = await blockchainService.ownerOf(tokenId);

    const verification = {
      tokenId,
      ownerOnChain: blockchainOwner,
      ownerInDatabase: nft.ownerWalletAddress,
      isVerified: blockchainOwner.toLowerCase() === nft.ownerWalletAddress.toLowerCase(),
      mintedAt: nft.mintedAt,
    };

    if (userId) {
      const user = await User.findById(userId);
      (verification as Record<string, unknown>).isOwner = user?.walletAddress?.toLowerCase() === blockchainOwner.toLowerCase();
    }

    return verification;
  },

  async getTokenURI(tokenId: number) {
    const nft = await NFT.findOne({ tokenId });
    if (!nft) {
      throw new NotFoundError('NFT not found');
    }

    return nft.tokenUri;
  },
};
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { nftService, MintNFTInput } from '../services/index.js';
import { AuthRequest } from '../middleware/auth.js';

const mintSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
});

const transferSchema = z.object({
  tokenId: z.number().int().positive('Token ID must be a positive integer'),
  toWalletAddress: z.string().min(1, 'Wallet address is required'),
});

const listNFTsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(50).optional(),
  search: z.string().optional(),
});

export const nftController = {
  async mint(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = mintSchema.parse(req.body) as MintNFTInput;
      const nft = await nftService.mint(data);

      res.status(201).json({
        status: 'success',
        data: nft,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = listNFTsSchema.parse(req.query);
      const result = await nftService.findAll(filters);

      res.status(200).json({
        status: 'success',
        data: result.nfts,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { tokenId } = req.params;
      const tokenIdNum = parseInt(tokenId);
      const nft = await nftService.findById(tokenIdNum);

      res.status(200).json({
        status: 'success',
        data: nft,
      });
    } catch (error) {
      next(error);
    }
  },

  async findByUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await nftService.findByUser(req.user!.id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        status: 'success',
        data: result.nfts,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findByAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const { assetId } = req.params;
      const nfts = await nftService.findByAsset(assetId);

      res.status(200).json({
        status: 'success',
        data: nfts,
      });
    } catch (error) {
      next(error);
    }
  },

  async transfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = transferSchema.parse(req.body);
      const nft = await nftService.transfer({
        tokenId: data.tokenId,
        fromUserId: req.user!.id,
        toWalletAddress: data.toWalletAddress,
      });

      res.status(200).json({
        status: 'success',
        data: nft,
      });
    } catch (error) {
      next(error);
    }
  },

  async verifyOwnership(req: Request, res: Response, next: NextFunction) {
    try {
      const { tokenId } = req.params;
      const tokenIdNum = parseInt(tokenId);
      const userId = (req as AuthRequest).user?.id;
      const verification = await nftService.verifyOwnership(tokenIdNum, userId);

      res.status(200).json({
        status: 'success',
        data: verification,
      });
    } catch (error) {
      next(error);
    }
  },

  async getTokenURI(req: Request, res: Response, next: NextFunction) {
    try {
      const { tokenId } = req.params;
      const tokenIdNum = parseInt(tokenId);
      const tokenUri = await nftService.getTokenURI(tokenIdNum);

      res.status(200).json({
        status: 'success',
        data: { tokenUri },
      });
    } catch (error) {
      next(error);
    }
  },
};
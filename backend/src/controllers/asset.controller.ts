import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { assetService, CreateAssetInput } from '../services/index.js';
import { ipfsService } from '../services/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const createAssetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  priceInINR: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
  creator: z.object({
    name: z.string().min(1, 'Creator name is required'),
    walletAddress: z.string().optional(),
    royaltyPercent: z.number().min(0).max(100).optional(),
  }),
  media: z.object({
    ipfsHash: z.string().optional(),
    imageUrl: z.string().url('Invalid image URL'),
    mimeType: z.string().default('image/jpeg'),
    fileSize: z.number().default(0),
  }),
});

const updateAssetSchema = createAssetSchema.partial();

const listAssetsSchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(50).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const assetController = {
  async uploadWithImage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('uploadWithImage called');
      console.log('Body:', req.body);
      console.log('File:', req.file);
      
      const { name, description, priceInINR, category, creatorName } = req.body;
      
      console.log('Parsed fields:', { name, description, priceInINR, category, creatorName });
      
      const missing: string[] = [];
      if (!name || name.trim() === '') missing.push('name');
      if (!description || description.trim() === '') missing.push('description');
      if (!priceInINR || priceInINR === '') missing.push('priceInINR');
      if (!category || category.trim() === '') missing.push('category');
      if (!creatorName || creatorName.trim() === '') missing.push('creatorName');
      
      if (missing.length > 0) {
        res.status(400).json({
          status: 'error',
          message: `Missing required fields: ${missing.join(', ')}`,
        });
        return;
      }
      
      if (!req.file) {
        res.status(400).json({
          status: 'error',
          message: 'Image file is required',
        });
        return;
      }

      let imageUrl = '';
      let ipfsHash = '';

      const buffer = req.file.buffer;
      const filename = req.file.originalname;
      
      try {
        const ipfsResult = await ipfsService.uploadFile(buffer, filename);
        ipfsHash = ipfsResult.IpfsHash;
        imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      } catch (ipfsError) {
        logger.warn('IPFS upload failed, using base64 fallback');
        imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        ipfsHash = '';
      }

      const asset = await assetService.create({
        name,
        description,
        priceInINR: Number(priceInINR),
        category,
        creator: {
          name: creatorName,
        },
        media: {
          ipfsHash: ipfsHash || undefined,
          imageUrl,
          mimeType: req.file.mimetype || 'image/jpeg',
          fileSize: req.file.size,
        },
      }, req.user!.id);

      res.status(201).json({
        status: 'success',
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createAssetSchema.parse(req.body) as CreateAssetInput;
      const asset = await assetService.create(data, req.user!.id);

      res.status(201).json({
        status: 'success',
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = listAssetsSchema.parse(req.query);
      const result = await assetService.findAll(filters);

      res.status(200).json({
        status: 'success',
        data: result.assets,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const asset = await assetService.findById(id);

      res.status(200).json({
        status: 'success',
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  },

  async findBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const asset = await assetService.findBySlug(slug);

      res.status(200).json({
        status: 'success',
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateAssetSchema.parse(req.body);
      const asset = await assetService.update(id, data);

      res.status(200).json({
        status: 'success',
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await assetService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Asset deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async getFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const assets = await assetService.getFeatured();

      res.status(200).json({
        status: 'success',
        data: assets,
      });
    } catch (error) {
      next(error);
    }
  },

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await assetService.getCategories();

      res.status(200).json({
        status: 'success',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const asset = await assetService.updateStatus(id, status);

      res.status(200).json({
        status: 'success',
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  },

  async getOrganizerStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await assetService.getOrganizerStats(req.user!.id);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  async getEventOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { assetId } = req.query;
      if (!assetId || typeof assetId !== 'string') {
        res.status(400).json({
          status: 'fail',
          message: 'assetId is required',
        });
        return;
      }
      const orders = await assetService.getEventOrders(assetId, req.user!.id);

      res.status(200).json({
        status: 'success',
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  },
};
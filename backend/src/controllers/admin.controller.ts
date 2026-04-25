import { Request, Response, NextFunction } from 'express';
import { User, Asset, NFT, Order, Transaction } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export const adminController = {
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [totalUsers, totalAssets, totalNFTs, totalOrders, revenue] = await Promise.all([
        User.countDocuments(),
        Asset.countDocuments(),
        NFT.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

      const stats = {
        users: totalUsers,
        assets: totalAssets,
        nfts: totalNFTs,
        orders: totalOrders,
        revenue: revenue[0]?.total || 0,
        revenueInINR: (revenue[0]?.total || 0) / 100,
      };

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const query = search
        ? {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        User.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit as string))
          .select('-password'),
        User.countDocuments(query),
      ]);

      res.status(200).json({
        status: 'success',
        data: users,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getAssets(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, status, category } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const query: Record<string, unknown> = {};
      if (status) query.status = status;
      if (category) query.category = category;

      const [assets, total] = await Promise.all([
        Asset.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit as string))
          .populate('createdBy', 'name email'),
        Asset.countDocuments(query),
      ]);

      res.status(200).json({
        status: 'success',
        data: assets,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const query: Record<string, unknown> = {};
      if (status) query.status = status;

      const [orders, total] = await Promise.all([
        Order.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit as string))
          .populate('assetId')
          .populate('userId', 'name email'),
        Order.countDocuments(query),
      ]);

      res.status(200).json({
        status: 'success',
        data: orders,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getNFTs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [nfts, total] = await Promise.all([
        NFT.find()
          .sort({ mintedAt: -1 })
          .skip(skip)
          .limit(parseInt(limit as string))
          .populate('assetId')
          .populate('ownerUserId', 'name email'),
        NFT.countDocuments(),
      ]);

      res.status(200).json({
        status: 'success',
        data: nfts,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['user', 'admin'].includes(role)) {
        throw new AppError('Invalid role', 400);
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
      ).select('-password');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      logger.info('User role updated:', { userId, role });

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async createRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const { amount } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status !== 'completed') {
        throw new AppError('Order is not completed', 400);
      }

      const { paymentService } = await import('../services/index.js');
      await paymentService.createRefund(order.paymentId!, amount);

      await Order.findByIdAndUpdate(orderId, {
        status: 'refunded',
        refundedAt: new Date(),
      });

      logger.info('Refund processed:', { orderId, amount });

      res.status(200).json({
        status: 'success',
        message: 'Refund processed successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
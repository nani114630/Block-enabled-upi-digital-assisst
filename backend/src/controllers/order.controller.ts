import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { orderService } from '../services/index.js';
import { AuthRequest } from '../middleware/auth.js';

const createOrderSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
});

const initiatePaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

export const orderController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createOrderSchema.parse(req.body);
      const order = await orderService.create({
        assetId: data.assetId,
        userId: req.user!.id,
      });

      res.status(201).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async initiatePayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = initiatePaymentSchema.parse(req.body);
      const result = await orderService.initiatePayment(data.orderId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await orderService.findById(id);

      res.status(200).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async findByUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;
      const result = await orderService.findByUser(req.user!.id, {
        status: status as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        status: 'success',
        data: result.orders,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;
      const result = await orderService.findAll({
        status: status as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        status: 'success',
        data: result.orders,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async handlePaymentSuccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, paymentId } = req.body;
      const result = await orderService.handlePaymentSuccess(orderId, paymentId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async handlePaymentFailure(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, reason } = req.body;
      const result = await orderService.handlePaymentFailure(orderId, reason);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
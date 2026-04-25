import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  walletAddress: z.string().optional(),
  role: z.enum(['organizer', 'attendee']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerSchema.parse(req.body) as { email: string; password: string; name: string; walletAddress?: string; role?: string };
      const result = await authService.register(input);

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = loginSchema.parse(req.body) as { email: string; password: string };
      const result = await authService.login(input);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.id);

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = registerSchema.partial().parse(req.body);
      const user = await authService.updateProfile(req.user!.id, input);

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.deleteAccount(req.user!.id);

      res.status(200).json({
        status: 'success',
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
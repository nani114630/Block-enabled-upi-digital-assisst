import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/index.js';
import { Ticket } from '../models/index.js';
import mongoose from 'mongoose';

const router = Router();

router.get(
  '/my-tickets',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as AuthRequest).user?.id;
      console.log('[MY-TICKETS] userId:', userId);
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const tickets = await Ticket.find({ userId: new mongoose.Types.ObjectId(userId) })
        .populate({
          path: 'eventId',
          select: 'name image venue dateTime',
        })
        .sort({ createdAt: -1 })
        .limit(50);

      console.log('[MY-TICKETS] found:', tickets.length, 'tickets for user', userId);

      res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/event/:eventId',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { eventId } = req.params;
      
      const tickets = await Ticket.find({ eventId: new mongoose.Types.ObjectId(eventId) })
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
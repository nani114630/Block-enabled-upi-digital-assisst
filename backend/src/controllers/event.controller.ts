import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/index.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../middleware/auth.js';

export const eventController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      console.log('[EVENT CREATE] received body:', JSON.stringify(req.body).substring(0, 500));

      const event = await eventService.create({
        ...req.body,
        createdBy: userId,
      });

      console.log('[EVENT CREATE] created event:', event._id, event.name, 'status:', event.status);

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, status } = req.query;
      console.log('[EVENTS FINDALL] filters:', { page, limit, search, status });

      const result = await eventService.findAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        status: status as string,
      });
      
      console.log('[EVENTS FINDALL] found:', result.events?.length, 'events');

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getFeatured(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await eventService.findAll({
        status: 'active',
        limit: 6,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const event = await eventService.findById(req.params.id);

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  async findBySlug(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const event = await eventService.findBySlug(req.params.slug);

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const event = await eventService.update(req.params.id, req.body);

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      await eventService.delete(req.params.id);

      res.json({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async getOrganizerEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { page, limit, status } = req.query;

      const result = await eventService.getOrganizerEvents(userId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as string,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async bookTickets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const eventId = req.params.id;
      const { ticketType, quantity, attendeeName, attendeeEmail, attendeePhone, paymentMethod } = req.body;

      console.log('[BOOK TICKETS] Request body:', req.body);
      console.log('[BOOK TICKETS] URL param id:', eventId);
      console.log('[BOOK TICKETS] UserId:', userId);

      if (!paymentMethod) {
        throw new AppError('Payment method is required', 400);
      }

      const event = await import('../models/index.js').then(m => m.Event.findById(eventId));
      if (!event) {
        throw new AppError('Event not found', 404);
      }

      const ticketTypeObj = event.ticketTypes.find((t: { name: string }) => t.name === ticketType);
      if (!ticketTypeObj) {
        throw new AppError('Ticket type not found', 404);
      }

      const amount = ticketTypeObj.priceInINR * quantity;
      const isTestMode = process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder_key_id' || !process.env.RAZORPAY_KEY_ID;

      if (isTestMode) {
        const tickets = await eventService.bookTickets({
          eventId,
          ticketType,
          quantity,
          attendeeName,
          attendeeEmail,
          attendeePhone,
          userId,
        });

        console.log('[BOOK TICKETS] Created', tickets.length, 'tickets (TEST MODE)');

        res.status(201).json({
          success: true,
          data: tickets,
          testMode: true,
        });
        return;
      }

      const { paymentService } = await import('../services/index.js');
      const order = await paymentService.createOrder({
        amount,
        currency: 'INR',
        receipt: `event_${eventId}_${Date.now()}`,
      });

      const razorpayOrder = (order as { id?: string }).id;

      res.status(200).json({
        success: false,
        paymentRequired: true,
        data: {
          razorpayOrderId: razorpayOrder,
          amount,
          paymentMethod,
          eventId,
          ticketType,
          quantity,
          attendeeName,
          attendeeEmail,
          attendeePhone,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getEventTickets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { eventId } = req.params;
      const { status, search, page, limit } = req.query;

      const result = await eventService.getEventTickets(eventId, {
        status: status as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async verifyTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const result = await eventService.verifyTicket({
        ...req.body,
        checkedInBy: userId,
      });

      res.json({
        success: result.valid,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },
};
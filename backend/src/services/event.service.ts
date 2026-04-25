import mongoose from 'mongoose';
import slugify from 'slugify';
import { Event, Ticket, IEvent, ITicket } from '../models/index.js';
import { AppError, NotFoundError, ValidationError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export interface CreateEventInput {
  name: string;
  description: string;
  venue: {
    name: string;
    address: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  dateTime: {
    start: Date;
    end: Date;
    timezone?: string;
  };
  ticketTypes: Array<{
    name: string;
    priceInINR: number;
    quantity: number;
    description?: string;
  }>;
  organizer: {
    userId: string;
    name: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  image: string;
  createdBy: string;
}

export interface BookTicketInput {
  eventId: string;
  ticketType: string;
  attendeeName: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  quantity: number;
  userId: string;
}

export interface VerifyTicketInput {
  qrData: string;
  eventId?: string;
  checkedInBy: string;
}

export const eventService = {
  async create(input: CreateEventInput) {
    const { name } = input;
    let slug = slugify(name, { lower: true, strict: true });
    
    const existingEvent = await Event.findOne({ slug });
    if (existingEvent) {
      slug = `${slug}-${Date.now()}`;
    }

    if (input.dateTime.end <= input.dateTime.start) {
      throw new ValidationError('Event end time must be after start time', [
        { field: 'dateTime.end', message: 'End time must be after start time' },
      ]);
    }

    for (const ticketType of input.ticketTypes) {
      if (!ticketType.name) {
        throw new ValidationError('Ticket type name is required', [
          { field: 'ticketType.name', message: 'Each ticket type needs a name' },
        ]);
      }
      if (ticketType.priceInINR < 0) {
        throw new ValidationError('Ticket price cannot be negative', [
          { field: 'ticketType.priceInINR', message: 'Price must be a positive number' },
        ]);
      }
    }

    const eventData = {
      ...input,
      slug,
      status: 'active',
      organizer: {
        ...input.organizer,
        userId: new mongoose.Types.ObjectId(input.createdBy),
      },
    };
    
    console.log('[EVENT SERVICE] Creating with data:', JSON.stringify(eventData).substring(0, 500));

    const event = new Event(eventData);

    await event.save();

    logger.info('Event created successfully:', {
      eventId: event._id,
      name: event.name,
    });

    return event;
  },

  async findAll(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const { page = 1, limit = 12, search, status } = filters || {};

    const query: Record<string, unknown> = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'venue.name': { $regex: search, $options: 'i' } },
        { 'venue.city': { $regex: search, $options: 'i' } },
      ];
    }

    const now = new Date();
    const fifteenMinutesBefore = new Date(now.getTime() + 15 * 60 * 1000);
    query['dateTime.start'] = { $gt: fifteenMinutesBefore };

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ 'dateTime.start': -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email'),
      Event.countDocuments(query),
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(eventId: string) {
    console.log('[FIND BY ID] Looking for:', eventId);
    const event = await Event.findById(eventId)
      .populate('createdBy', 'name email');
    console.log('[FIND BY ID] Found:', event?._id, event?.name);

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  },

  async findBySlug(slug: string) {
    const event = await Event.findOne({ slug })
      .populate('createdBy', 'name email');

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  },

  async update(eventId: string, input: Partial<CreateEventInput>) {
    const event = await Event.findById(eventId);

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    let updateData = { ...input };
    
    if (input.name && input.name !== event.name) {
      let slug = slugify(input.name, { lower: true, strict: true });
      const existingEvent = await Event.findOne({ slug, _id: { $ne: eventId } });
      if (existingEvent) {
        slug = `${slug}-${Date.now()}`;
      }
      (updateData as Record<string, unknown>).slug = slug;
    }

    Object.assign(event, updateData);
    await event.save();

    logger.info('Event updated successfully:', {
      eventId: event._id,
      name: event.name,
    });

    return event;
  },

  async delete(eventId: string) {
    const event = await Event.findById(eventId);

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    await Ticket.deleteMany({ eventId: event._id });
    await Event.findByIdAndDelete(eventId);

    logger.info('Event deleted successfully:', {
      eventId,
    });

    return { deleted: true };
  },

  async bookTickets(input: BookTicketInput) {
    const { eventId, ticketType, attendeeName, attendeeEmail, attendeePhone, quantity, userId } = input;

    console.log('[BOOK TICKETS] Looking for eventId:', eventId);
    const event = await Event.findById(eventId);
    console.log('[BOOK TICKETS] Found event:', event?._id, event?.name);
    
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const eventStartTime = new Date(event.dateTime.start).getTime();
    const now = Date.now();
    const fifteenMinutesBefore = 15 * 60 * 1000;
    
    if (eventStartTime - now < fifteenMinutesBefore) {
      throw new ValidationError('Booking closed', [
        { field: 'eventId', message: 'Booking closes 15 minutes before event starts' },
      ]);
    }

    if (event.status !== 'active') {
      throw new ValidationError('Event is not available for booking', [
        { field: 'eventId', message: 'Event is not active' },
      ]);
    }

    const ticketTypeObj = event.ticketTypes.find(t => t.name === ticketType);
    if (!ticketTypeObj) {
      throw new NotFoundError('Ticket type not found');
    }

    const available = ticketTypeObj.quantity - ticketTypeObj.sold;
    if (quantity > available) {
      throw new ValidationError('Not enough tickets available', [
        { field: 'quantity', message: `Only ${available} tickets available` },
      ]);
    }

    const tickets: ITicket[] = [];
    for (let i = 0; i < quantity; i++) {
      const uniqueId = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const qrCodeData = Buffer.from(JSON.stringify({
        uniqueId,
        eventId: eventId,
        ticketType,
      })).toString('base64');

      const ticket = new Ticket({
        uniqueId,
        eventId: event._id,
        userId: new mongoose.Types.ObjectId(userId),
        ticketType,
        attendeeName,
        attendeeEmail,
        attendeePhone,
        qrCodeData,
        status: 'issued',
        purchaseOrderId: new mongoose.Types.ObjectId(),
        priceInINR: ticketTypeObj.priceInINR,
      });

      await ticket.save();
      tickets.push(ticket);
    }

    ticketTypeObj.sold += quantity;
    event.totalTicketsSold += quantity;
    event.totalRevenue += ticketTypeObj.priceInINR * quantity;
    await event.save();

    logger.info('Tickets booked successfully:', {
      eventId,
      ticketType,
      quantity,
      userId,
    });

    return tickets;
  },

  async verifyTicket(input: VerifyTicketInput) {
    const { qrData, eventId, checkedInBy } = input;

    let qrPayload: { uniqueId?: string; eventId?: string; ticketType?: string };
    try {
      qrPayload = JSON.parse(Buffer.from(qrData, 'base64').toString('utf-8'));
    } catch {
      throw new ValidationError('Invalid QR code format', [
        { field: 'qrData', message: 'QR code is not valid' },
      ]);
    }

    const ticket = await Ticket.findOne({ 
      $or: [{ qrCodeData: qrData }, { uniqueId: qrPayload.uniqueId }] 
    });
    if (!ticket) {
      return {
        status: 'invalid',
        message: 'Ticket not found in system',
        valid: false,
      };
    }

    const event = await Event.findById(ticket.eventId);
    if (!event) {
      return {
        status: 'invalid',
        message: 'Event not found',
        valid: false,
      };
    }

    const now = new Date();
    const eventStart = new Date(event.dateTime.start);
    const eventEnd = new Date(event.dateTime.end);
    
    if (now < eventStart) {
      return {
        status: 'invalid',
        message: `Event has not started yet. Scanning allowed ${eventStart.toLocaleTimeString()}`,
        valid: false,
        ticket: null,
      };
    }

    if (eventEnd < now) {
      return {
        status: 'invalid',
        message: 'Event has already ended',
        valid: false,
        ticket: null,
      };
    }

    if (eventId && ticket.eventId.toString() !== eventId) {
      return {
        status: 'invalid',
        message: `Ticket is for a different event`,
        valid: false,
        ticket: {
          uniqueId: ticket.uniqueId,
          attendeeName: ticket.attendeeName,
          ticketType: ticket.ticketType,
        },
      };
    }

    if (ticket.status === 'used') {
      return {
        status: 'already_used',
        message: 'Ticket already used',
        valid: false,
        ticket: {
          uniqueId: ticket.uniqueId,
          attendeeName: ticket.attendeeName,
          ticketType: ticket.ticketType,
          checkedInAt: ticket.checkedInAt,
        },
      };
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      return {
        status: 'cancelled',
        message: 'Ticket has been cancelled/refunded',
        valid: false,
        ticket: null,
      };
    }

    ticket.status = 'used';
    ticket.checkedInAt = new Date();
    ticket.checkedInBy = new mongoose.Types.ObjectId(checkedInBy);
    await ticket.save();

    logger.info('Ticket verified successfully:', {
      ticketId: ticket._id,
      uniqueId: ticket.uniqueId,
      checkedInBy,
    });

    return {
      status: 'valid',
      message: 'Ticket verified successfully',
      valid: true,
      ticket: {
        uniqueId: ticket.uniqueId,
        attendeeName: ticket.attendeeName,
        ticketType: ticket.ticketType,
        checkedInAt: ticket.checkedInAt,
      },
    };
  },

  async getEventTickets(eventId: string, filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 20 } = filters || {};

    const query: Record<string, unknown> = { eventId: new mongoose.Types.ObjectId(eventId) };
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { uniqueId: { $regex: search, $options: 'i' } },
        { attendeeName: { $regex: search, $options: 'i' } },
        { attendeeEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(query),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getOrganizerEvents(userId: string, filters?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const { page = 1, limit = 12, status } = filters || {};

    const query: Record<string, unknown> = { 'organizer.userId': new mongoose.Types.ObjectId(userId) };
    
    if (status && status !== 'all') {
      const now = new Date();
      const fifteenMinutesBefore = new Date(now.getTime() + 15 * 60 * 1000);
      
      if (status === 'running') {
        query['dateTime.start'] = { $lte: now };
        query['dateTime.end'] = { $gte: now };
      } else if (status === 'completed') {
        query['dateTime.end'] = { $lt: now };
      } else if (status === 'upcoming') {
        query['dateTime.start'] = { $gt: fifteenMinutesBefore };
      } else {
        query.status = status;
      }
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(query),
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
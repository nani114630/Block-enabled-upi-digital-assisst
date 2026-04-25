import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITicketType {
  name: string;
  priceInINR: number;
  quantity: number;
  sold: number;
  description?: string;
}

export interface IEvent extends Document {
  name: string;
  slug: string;
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
    timezone: string;
  };
  ticketTypes: ITicketType[];
  organizer: {
    userId: mongoose.Types.ObjectId;
    name: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  image: string;
  status: 'draft' | 'active' | 'cancelled' | 'completed';
  totalTicketsSold: number;
  totalRevenue: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ticketTypeSchema = new Schema<ITicketType>(
  {
    name: { type: String, required: true },
    priceInINR: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    sold: { type: Number, default: 0, min: 0 },
    description: { type: String, default: null },
  },
  { _id: false }
);

const venueSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { _id: false }
);

const dateTimeSchema = new Schema(
  {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  { _id: false }
);

const organizerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    contactEmail: { type: String, default: null },
    contactPhone: { type: String, default: null },
  },
  { _id: false }
);

const eventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 5000,
    },
    venue: {
      type: venueSchema,
      required: true,
    },
    dateTime: {
      type: dateTimeSchema,
      required: true,
    },
    ticketTypes: {
      type: [ticketTypeSchema],
      required: true,
      validate: [(val: ITicketType[]) => val.length > 0, 'At least one ticket type is required'],
    },
    organizer: {
      type: organizerSchema,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'cancelled', 'completed'],
      default: 'draft',
    },
    totalTicketsSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ name: 'text', description: 'text' });
eventSchema.index({ slug: 1 });
eventSchema.index({ status: 1, 'dateTime.start': 1 });
eventSchema.index({ 'organizer.userId': 1 });
eventSchema.index({ 'dateTime.start': -1 });

export const Event: Model<IEvent> = mongoose.model<IEvent>('Event', eventSchema);
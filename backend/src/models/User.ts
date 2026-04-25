import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  walletAddress?: string;
  role: 'user' | 'admin' | 'organizer' | 'attendee';
  profile: {
    avatar?: string;
    phone?: string;
    createdAt: Date;
  };
  preferences: {
    notifications: boolean;
    newsletter: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userProfileSchema = new Schema(
  {
    avatar: { type: String, default: null },
    phone: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userPreferencesSchema = new Schema(
  {
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'organizer', 'attendee'],
      default: 'attendee',
    },
    profile: {
      type: userProfileSchema,
      default: () => ({}),
    },
    preferences: {
      type: userPreferencesSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
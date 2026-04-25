import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, Ticket, Event } from '../models/index.js';
import { config } from '../config/index.js';
import { AppError, ValidationError, UnauthorizedError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
  walletAddress?: string;
  role?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthPayload {
  id: string;
  email: string;
  role: string;
}

export const authService = {
  async register(input: RegisterUserInput) {
    const { email, password, name, walletAddress, role } = input;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ValidationError('Email already registered', [
        { field: 'email', message: 'This email is already in use' },
      ]);
    }

    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      walletAddress: walletAddress?.toLowerCase(),
      role: role || 'attendee',
    });

    await user.save();

    const token = this.generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    logger.info('User registered:', { userId: user._id, email: user.email });

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        walletAddress: user.walletAddress,
      },
      token,
    };
  },

  async login(input: LoginInput) {
    const { email, password } = input;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    logger.info('User logged in:', { userId: user._id, email: user.email });

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        walletAddress: user.walletAddress,
      },
      token,
    };
  },

  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      walletAddress: user.walletAddress,
      profile: user.profile,
      preferences: user.preferences,
      createdAt: user.createdAt,
    };
  },

  async updateProfile(userId: string, input: Partial<RegisterUserInput>) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (input.name) user.name = input.name;
    if (input.walletAddress) user.walletAddress = input.walletAddress.toLowerCase();

    await user.save();

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      walletAddress: user.walletAddress,
    };
  },

  async deleteAccount(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await User.findByIdAndDelete(userId);
    await Ticket.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
    await Event.deleteMany({ createdBy: new mongoose.Types.ObjectId(userId) });

    logger.info('Account deleted:', { userId });
  },

  generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });
  },

  verifyToken(token: string): AuthPayload {
    return jwt.verify(token, config.jwt.secret) as AuthPayload;
  },
};
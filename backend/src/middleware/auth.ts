import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    walletAddress?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Please provide authentication token', 401));
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new AppError('User not found or account is inactive', 401));
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token has expired', 401));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401));
    }
    next(error);
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

export const requireOrganizer = (req: AuthRequest, res: Response, next: NextFunction): void => {
  console.log('requireOrganizer check - user:', req.user);
  if (!req.user) {
    return next(new AppError('Authentication required. Please login.', 401));
  }
  if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
    return next(new AppError(`Access denied. Your role is '${req.user.role}'. Organizer role required.`, 403));
  }
  next();
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await User.findById(decoded.id);

    if (user && user.isActive) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      };
    }

    next();
  } catch {
    next();
  }
};
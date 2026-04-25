import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export interface ErrorResponse {
  status: string;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = err as Error & { statusCode?: number; errors?: Array<{ field: string; message: string }> };

  const errorName = error.name || '';
  const errorMessage = error.message || '';

  if (errorName === 'CastError' && errorMessage.includes('ObjectId')) {
    error.statusCode = 404;
    error.message = 'Resource not found';
  }

  if (errorName === 'ValidationError') {
    error.statusCode = 400;
    error.message = 'Validation error';
  }

  if (errorName === 'MongoServerError') {
    const mongoError = err as NodeJS.ErrnoException;
    const errorCode = mongoError.code;
    if (errorCode !== undefined && errorCode === '11000') {
      error.statusCode = 400;
      error.message = 'Duplicate field value';
    }
  }

  const statusCode = error.statusCode || 500;
  const response: ErrorResponse = {
    status: statusCode === 500 ? 'error' : 'fail',
    message: error.message || 'Internal server error',
  };

  const nodeEnv = (config as unknown as { server: { nodeEnv: string } }).server?.nodeEnv || 'development';
  if (nodeEnv === 'development' && err.stack) {
    response.stack = err.stack;
  }

  if (error.errors) {
    response.errors = error.errors;
  }

  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  } else {
    logger.warn('Client Error:', {
      message: err.message,
      statusCode,
      url: req.originalUrl,
      method: req.method,
    });
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export const createError = {
  badRequest: (message: string, code?: string) => new CustomError(message, 400, code),
  unauthorized: (message: string = 'Unauthorized', code?: string) => new CustomError(message, 401, code),
  forbidden: (message: string = 'Forbidden', code?: string) => new CustomError(message, 403, code),
  notFound: (message: string = 'Resource not found', code?: string) => new CustomError(message, 404, code),
  conflict: (message: string, code?: string) => new CustomError(message, 409, code),
  validation: (message: string, code?: string) => new CustomError(message, 422, code),
  tooManyRequests: (message: string = 'Too many requests', code?: string) => new CustomError(message, 429, code),
  internal: (message: string = 'Internal server error', code?: string) => new CustomError(message, 500, code),
  serviceUnavailable: (message: string = 'Service unavailable', code?: string) => new CustomError(message, 503, code),
};

// Error handler middleware
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let { statusCode = 500, message, code } = error;

  // Log the error
  logger.error(`Error occurred: ${message}`, {
    statusCode,
    code,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    stack: error.stack,
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
  } else if (error.name === 'SequelizeValidationError') {
    statusCode = 422;
    message = 'Database validation error';
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Duplicate entry';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: code || `HTTP_${statusCode}`,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  const error = createError.notFound(`Route ${req.originalUrl} not found`);
  res.status(404).json({
    success: false,
    error: {
      message: error.message,
      code: 'ROUTE_NOT_FOUND',
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}

// Validation error handler
export function validationErrorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
  if (error.name === 'ValidationError' || error.name === 'SequelizeValidationError') {
    const validationError = createError.validation('Validation failed', 'VALIDATION_ERROR');
    
    res.status(422).json({
      success: false,
      error: {
        message: validationError.message,
        code: validationError.code,
        details: error.errors || error.details,
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  } else {
    next(error);
  }
}

// Database error handler
export function databaseErrorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
  if (error.code === '23505') { // PostgreSQL unique constraint violation
    const dbError = createError.conflict('Duplicate entry', 'DUPLICATE_ENTRY');
    
    res.status(409).json({
      success: false,
      error: {
        message: dbError.message,
        code: dbError.code,
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  } else if (error.code === '23503') { // PostgreSQL foreign key constraint violation
    const dbError = createError.badRequest('Referenced record not found', 'FOREIGN_KEY_VIOLATION');
    
    res.status(400).json({
      success: false,
      error: {
        message: dbError.message,
        code: dbError.code,
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  } else {
    next(error);
  }
}
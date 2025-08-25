import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { CacheService } from '@/config/redis';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// Rate limiter configuration
const rateLimiterConfig = {
  windowMs: config.security.rateLimitWindowMs, // 15 minutes
  maxRequests: config.security.rateLimitMaxRequests, // 100 requests per window
  blockDuration: 60 * 15, // 15 minutes block duration
  keyGenerator: (req: Request) => {
    // Use IP address as default key
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

// Create rate limiter instance
const rateLimiter = new RateLimiterRedis({
  storeClient: CacheService.getRedisClient(),
  keyPrefix: 'rate_limit',
  points: rateLimiterConfig.maxRequests,
  duration: rateLimiterConfig.windowMs / 1000, // Convert to seconds
  blockDuration: rateLimiterConfig.blockDuration,
});

// Rate limiter middleware
export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = rateLimiterConfig.keyGenerator(req);
    
    // Check if user is authenticated for higher limits
    const isAuthenticated = !!(req as any).user;
    const points = isAuthenticated ? rateLimiterConfig.maxRequests * 2 : rateLimiterConfig.maxRequests;
    
    await rateLimiter.consume(key, points);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': points.toString(),
      'X-RateLimit-Remaining': (points - 1).toString(),
      'X-RateLimit-Reset': new Date(Date.now() + rateLimiterConfig.windowMs).toISOString(),
    });
    
    next();
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('RateLimiterRes')) {
      const retryAfter = Math.ceil(error.msBeforeNext / 1000);
      
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        retryAfter,
      });
      
      res.set({
        'X-RateLimit-Limit': rateLimiterConfig.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + error.msBeforeNext).toISOString(),
        'Retry-After': retryAfter.toString(),
      });
      
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      // If Redis is down, allow the request but log the error
      logger.error('Rate limiter error:', error);
      next();
    }
  }
}

// Stricter rate limiter for sensitive endpoints
export async function strictRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = `strict_${rateLimiterConfig.keyGenerator(req)}`;
    
    const strictLimiter = new RateLimiterRedis({
      storeClient: CacheService.getRedisClient(),
      keyPrefix: 'strict_rate_limit',
      points: 5, // 5 requests
      duration: 60, // per minute
      blockDuration: 60 * 5, // 5 minutes block
    });
    
    await strictLimiter.consume(key);
    
    res.set({
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': '4',
      'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
    });
    
    next();
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('RateLimiterRes')) {
      const retryAfter = Math.ceil(error.msBeforeNext / 1000);
      
      logger.warn(`Strict rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        retryAfter,
      });
      
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests to sensitive endpoint. Please try again later.',
          code: 'STRICT_RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.error('Strict rate limiter error:', error);
      next();
    }
  }
}

// OTP rate limiter (prevent abuse)
export async function otpRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const phone = req.body.phone || req.params.phone;
    if (!phone) {
      return next();
    }
    
    const key = `otp_${phone}`;
    
    const otpLimiter = new RateLimiterRedis({
      storeClient: CacheService.getRedisClient(),
      keyPrefix: 'otp_rate_limit',
      points: 3, // 3 OTP requests
      duration: 60 * 15, // per 15 minutes
      blockDuration: 60 * 30, // 30 minutes block
    });
    
    await otpLimiter.consume(key);
    
    next();
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('RateLimiterRes')) {
      const retryAfter = Math.ceil(error.msBeforeNext / 1000);
      
      logger.warn(`OTP rate limit exceeded for phone: ${req.body.phone}`, {
        phone: req.body.phone,
        ip: req.ip,
        retryAfter,
      });
      
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many OTP requests. Please try again later.',
          code: 'OTP_RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.error('OTP rate limiter error:', error);
      next();
    }
  }
}

// Login rate limiter (prevent brute force)
export async function loginRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const identifier = req.body.email || req.body.phone || req.ip;
    const key = `login_${identifier}`;
    
    const loginLimiter = new RateLimiterRedis({
      storeClient: CacheService.getRedisClient(),
      keyPrefix: 'login_rate_limit',
      points: 5, // 5 login attempts
      duration: 60 * 15, // per 15 minutes
      blockDuration: 60 * 30, // 30 minutes block
    });
    
    await loginLimiter.consume(key);
    
    next();
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('RateLimiterRes')) {
      const retryAfter = Math.ceil(error.msBeforeNext / 1000);
      
      logger.warn(`Login rate limit exceeded for identifier: ${req.body.email || req.body.phone}`, {
        identifier: req.body.email || req.body.phone,
        ip: req.ip,
        retryAfter,
      });
      
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many login attempts. Please try again later.',
          code: 'LOGIN_RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.error('Login rate limiter error:', error);
      next();
    }
  }
}

// Payment rate limiter
export async function paymentRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id || req.ip;
    const key = `payment_${userId}`;
    
    const paymentLimiter = new RateLimiterRedis({
      storeClient: CacheService.getRedisClient(),
      keyPrefix: 'payment_rate_limit',
      points: 10, // 10 payment attempts
      duration: 60 * 60, // per hour
      blockDuration: 60 * 60, // 1 hour block
    });
    
    await paymentLimiter.consume(key);
    
    next();
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('RateLimiterRes')) {
      const retryAfter = Math.ceil(error.msBeforeNext / 1000);
      
      logger.warn(`Payment rate limit exceeded for user: ${(req as any).user?.id}`, {
        userId: (req as any).user?.id,
        ip: req.ip,
        retryAfter,
      });
      
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many payment attempts. Please try again later.',
          code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.error('Payment rate limiter error:', error);
      next();
    }
  }
}
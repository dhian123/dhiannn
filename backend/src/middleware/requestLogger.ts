import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = generateRequestId();
  
  // Add request ID to request object
  (req as any).requestId = requestId;
  
  // Log request start
  logger.info(`Request started: ${req.method} ${req.originalUrl}`, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    headers: {
      'content-type': req.get('Content-Type'),
      'authorization': req.get('Authorization') ? '[REDACTED]' : undefined,
      'x-forwarded-for': req.get('X-Forwarded-For'),
    },
    body: sanitizeRequestBody(req.body),
    query: req.query,
    params: req.params,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Log response
    logger.info(`Request completed: ${req.method} ${req.originalUrl}`, {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      duration,
      ip: req.ip,
      userId: (req as any).user?.id,
      responseSize: chunk ? chunk.length : 0,
      userAgent: req.get('User-Agent'),
    });

    // Log slow requests
    if (duration > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.originalUrl}`, {
        requestId,
        duration,
        statusCode,
        userId: (req as any).user?.id,
      });
    }

    // Log errors
    if (statusCode >= 400) {
      logger.error(`Request failed: ${req.method} ${req.originalUrl}`, {
        requestId,
        statusCode,
        duration,
        userId: (req as any).user?.id,
        error: chunk ? chunk.toString() : undefined,
      });
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Sanitize request body to remove sensitive data
function sanitizeRequestBody(body: any): any {
  if (!body) return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'otp', 'pin'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

// Performance monitoring middleware
export function performanceMonitor(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Log performance metrics
    logger.debug(`Performance: ${req.method} ${req.originalUrl}`, {
      duration,
      statusCode: res.statusCode,
      userId: (req as any).user?.id,
      memoryUsage: process.memoryUsage(),
    });
    
    // Alert on very slow requests
    if (duration > 5000) {
      logger.error(`Very slow request: ${req.method} ${req.originalUrl}`, {
        duration,
        statusCode: res.statusCode,
        userId: (req as any).user?.id,
        url: req.originalUrl,
        method: req.method,
      });
    }
  });
  
  next();
}

// Security logging middleware
export function securityLogger(req: Request, res: Response, next: NextFunction): void {
  // Log potential security issues
  const suspiciousPatterns = [
    /script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  
  const userAgent = req.get('User-Agent') || '';
  const url = req.originalUrl;
  const body = JSON.stringify(req.body);
  
  // Check for suspicious patterns
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(userAgent) || pattern.test(url) || pattern.test(body)
  );
  
  if (isSuspicious) {
    logger.warn('Suspicious request detected', {
      ip: req.ip,
      userAgent,
      url,
      method: req.method,
      userId: (req as any).user?.id,
      headers: req.headers,
    });
  }
  
  // Log authentication attempts
  if (req.path.includes('/auth') || req.path.includes('/login')) {
    logger.info('Authentication attempt', {
      ip: req.ip,
      userAgent,
      method: req.method,
      path: req.path,
      hasCredentials: !!(req.body.email || req.body.phone || req.body.username),
    });
  }
  
  next();
}

// API usage tracking middleware
export function apiUsageTracker(req: Request, res: Response, next: NextFunction): void {
  const userId = (req as any).user?.id;
  const endpoint = `${req.method} ${req.path}`;
  
  // Track API usage in Redis (for analytics)
  if (userId) {
    // This would typically increment a counter in Redis
    // For now, just log it
    logger.debug('API usage tracked', {
      userId,
      endpoint,
      timestamp: new Date().toISOString(),
    });
  }
  
  next();
}
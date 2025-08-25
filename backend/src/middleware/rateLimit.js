const { StatusCodes } = require('http-status-codes');
const { rateLimit } = require('../config/redis');
const logger = require('../utils/logger');

// Generic rate limiter
const createRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests from this IP, please try again later.',
  } = options;

  return async (req, res, next) => {
    try {
      const key = `rate_limit:${keyGenerator(req)}`;
      const window = Math.floor(windowMs / 1000); // Convert to seconds
      
      const result = await rateLimit.check(key, max, window);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': result.limit,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      });
      
      if (!result.allowed) {
        logger.security('RATE_LIMIT_EXCEEDED', {
          key,
          current: result.current,
          limit: result.limit,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
        });

        return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
          status: 'error',
          message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limit error:', error);
      // If rate limiting fails, allow the request to continue
      next();
    }
  };
};

// Authentication rate limiter (stricter)
const rateLimitAuth = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  keyGenerator: (req) => `auth:${req.ip}`,
  message: 'Too many authentication attempts, please try again later.',
});

// API rate limiter (general)
const rateLimitAPI = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  keyGenerator: (req) => req.ip,
  message: 'Too many API requests, please try again later.',
});

// Payment rate limiter (very strict)
const rateLimitPayment = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour
  keyGenerator: (req) => req.user ? `payment:${req.user.id}` : `payment:${req.ip}`,
  message: 'Too many payment attempts, please try again later.',
});

// OTP rate limiter
const rateLimitOTP = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 OTP request per minute
  keyGenerator: (req) => `otp:${req.body.identifier || req.ip}`,
  message: 'Please wait before requesting another OTP.',
});

// File upload rate limiter
const rateLimitUpload = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 minutes
  keyGenerator: (req) => req.user ? `upload:${req.user.id}` : `upload:${req.ip}`,
  message: 'Too many file uploads, please try again later.',
});

// Password reset rate limiter
const rateLimitPasswordReset = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  keyGenerator: (req) => `pwd_reset:${req.body.identifier || req.ip}`,
  message: 'Too many password reset attempts, please try again later.',
});

// Report generation rate limiter
const rateLimitReports = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 report requests per hour
  keyGenerator: (req) => req.user ? `reports:${req.user.id}` : `reports:${req.ip}`,
  message: 'Too many report requests, please try again later.',
});

// User-specific rate limiter
const rateLimitUser = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later.',
  } = options;

  return createRateLimit({
    windowMs,
    max,
    keyGenerator: (req) => req.user ? `user:${req.user.id}` : req.ip,
    message,
  });
};

// Endpoint-specific rate limiter
const rateLimitEndpoint = (endpoint, options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 10,
    message = `Too many requests to ${endpoint}, please try again later.`,
  } = options;

  return createRateLimit({
    windowMs,
    max,
    keyGenerator: (req) => `endpoint:${endpoint}:${req.user ? req.user.id : req.ip}`,
    message,
  });
};

// Progressive rate limiter (increases limit based on user reputation)
const progressiveRateLimit = (baseOptions = {}) => {
  return async (req, res, next) => {
    try {
      let multiplier = 1;

      if (req.user) {
        // Get user reputation/trust score from cache
        const userScore = await require('../config/redis').cache.get(`user_score:${req.user.id}`) || 0;
        
        // Increase limit for trusted users
        if (userScore > 100) multiplier = 2;
        else if (userScore > 50) multiplier = 1.5;
        else if (userScore < -10) multiplier = 0.5; // Decrease for problematic users
      }

      const adjustedOptions = {
        ...baseOptions,
        max: Math.floor((baseOptions.max || 100) * multiplier),
      };

      return createRateLimit(adjustedOptions)(req, res, next);
    } catch (error) {
      logger.error('Progressive rate limit error:', error);
      next();
    }
  };
};

// Burst rate limiter (allows short bursts but limits sustained usage)
const burstRateLimit = (options = {}) => {
  const {
    burstLimit = 10,
    sustainedLimit = 100,
    burstWindowMs = 60 * 1000, // 1 minute
    sustainedWindowMs = 15 * 60 * 1000, // 15 minutes
    keyGenerator = (req) => req.ip,
  } = options;

  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const burstKey = `burst:${key}`;
      const sustainedKey = `sustained:${key}`;

      // Check burst limit
      const burstResult = await rateLimit.check(
        burstKey,
        burstLimit,
        Math.floor(burstWindowMs / 1000)
      );

      // Check sustained limit
      const sustainedResult = await rateLimit.check(
        sustainedKey,
        sustainedLimit,
        Math.floor(sustainedWindowMs / 1000)
      );

      // Use the more restrictive limit
      const limitingResult = !burstResult.allowed ? burstResult : sustainedResult;

      // Add headers
      res.set({
        'X-RateLimit-Burst-Limit': burstResult.limit,
        'X-RateLimit-Burst-Remaining': burstResult.remaining,
        'X-RateLimit-Sustained-Limit': sustainedResult.limit,
        'X-RateLimit-Sustained-Remaining': sustainedResult.remaining,
      });

      if (!limitingResult.allowed) {
        const limitType = !burstResult.allowed ? 'burst' : 'sustained';
        
        logger.security('BURST_RATE_LIMIT_EXCEEDED', {
          key,
          limitType,
          current: limitingResult.current,
          limit: limitingResult.limit,
          ip: req.ip,
          endpoint: req.originalUrl,
        });

        return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
          status: 'error',
          message: `Rate limit exceeded (${limitType}). Please slow down.`,
          retryAfter: Math.ceil((limitingResult.resetTime - Date.now()) / 1000),
        });
      }

      next();
    } catch (error) {
      logger.error('Burst rate limit error:', error);
      next();
    }
  };
};

// Rate limit based on request cost/complexity
const costBasedRateLimit = (getCost = () => 1, options = {}) => {
  const {
    maxCost = 100,
    windowMs = 15 * 60 * 1000,
    keyGenerator = (req) => req.user ? req.user.id : req.ip,
  } = options;

  return async (req, res, next) => {
    try {
      const cost = getCost(req);
      const key = `cost:${keyGenerator(req)}`;
      const window = Math.floor(windowMs / 1000);

      // Get current cost usage
      const currentCost = await require('../config/redis').cache.get(key) || 0;
      
      if (currentCost + cost > maxCost) {
        logger.security('COST_RATE_LIMIT_EXCEEDED', {
          key,
          currentCost,
          requestCost: cost,
          maxCost,
          endpoint: req.originalUrl,
        });

        return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
          status: 'error',
          message: 'Request complexity limit exceeded. Please try again later.',
        });
      }

      // Increment cost
      await require('../config/redis').cache.incr(key, window);
      await require('../config/redis').redis.incrby(key, cost - 1);

      res.set({
        'X-Cost-Limit': maxCost,
        'X-Cost-Remaining': maxCost - (currentCost + cost),
        'X-Request-Cost': cost,
      });

      next();
    } catch (error) {
      logger.error('Cost-based rate limit error:', error);
      next();
    }
  };
};

module.exports = {
  createRateLimit,
  rateLimitAuth,
  rateLimitAPI,
  rateLimitPayment,
  rateLimitOTP,
  rateLimitUpload,
  rateLimitPasswordReset,
  rateLimitReports,
  rateLimitUser,
  rateLimitEndpoint,
  progressiveRateLimit,
  burstRateLimit,
  costBasedRateLimit,
};
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

// Authenticate user with JWT token
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is blacklisted (logged out)
    const isBlacklisted = await cache.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AuthenticationError('Token has been invalidated');
    }

    // Get user from cache or database
    let user = await cache.get(`user:${decoded.userId}`);
    
    if (!user) {
      // If not in cache, get from database
      const User = require('../models/User');
      user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Cache user data for 1 hour
      await cache.set(`user:${user.id}`, user.toJSON(), 3600);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    // Log user activity
    logger.userActivity(user.id, 'API_ACCESS', {
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token has expired'));
    } else {
      next(error);
    }
  }
};

// Authorize user based on roles
const authorize = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Convert single role to array
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        logger.security('UNAUTHORIZED_ACCESS_ATTEMPT', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          endpoint: req.originalUrl,
          method: req.method,
          ip: req.ip,
        });

        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user owns the resource or has admin privileges
const authorizeOwnerOrAdmin = (resourceUserIdPath = 'params.userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Get resource user ID from request
      const pathParts = resourceUserIdPath.split('.');
      let resourceUserId = req;
      
      for (const part of pathParts) {
        resourceUserId = resourceUserId[part];
      }

      // Allow if user owns the resource or is admin
      const isOwner = req.user.id.toString() === resourceUserId.toString();
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

      if (!isOwner && !isAdmin) {
        logger.security('UNAUTHORIZED_RESOURCE_ACCESS', {
          userId: req.user.id,
          resourceUserId,
          endpoint: req.originalUrl,
          method: req.method,
        });

        throw new AuthorizationError('Access denied to this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is blacklisted
      const isBlacklisted = await cache.exists(`blacklist:${token}`);
      if (!isBlacklisted) {
        let user = await cache.get(`user:${decoded.userId}`);
        
        if (!user) {
          const User = require('../models/User');
          user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password'] },
          });

          if (user && user.isActive) {
            await cache.set(`user:${user.id}`, user.toJSON(), 3600);
            req.user = user;
            req.token = token;
          }
        } else if (user.isActive) {
          req.user = user;
          req.token = token;
        }
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just proceed without user
    next();
  }
};

// Check if user has specific permission
const hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Get user permissions from cache or database
      let permissions = await cache.get(`permissions:${req.user.id}`);
      
      if (!permissions) {
        const UserPermission = require('../models/UserPermission');
        const userPermissions = await UserPermission.findAll({
          where: { userId: req.user.id },
          include: ['permission'],
        });

        permissions = userPermissions.map(up => up.permission.name);
        await cache.set(`permissions:${req.user.id}`, permissions, 3600);
      }

      if (!permissions.includes(permission)) {
        logger.security('INSUFFICIENT_PERMISSIONS', {
          userId: req.user.id,
          requiredPermission: permission,
          userPermissions: permissions,
          endpoint: req.originalUrl,
        });

        throw new AuthorizationError(`Permission '${permission}' required`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Rate limiting for sensitive operations
const sensitiveOperation = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const key = `sensitive_op:${req.user.id}:${req.route.path}`;
    const limit = 5; // 5 operations per hour
    const window = 3600; // 1 hour

    const { rateLimit } = require('../config/redis');
    const result = await rateLimit.check(key, limit, window);

    if (!result.allowed) {
      logger.security('RATE_LIMIT_EXCEEDED_SENSITIVE', {
        userId: req.user.id,
        operation: req.route.path,
        current: result.current,
        limit: result.limit,
      });

      return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        status: 'error',
        message: 'Too many sensitive operations. Please try again later.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      });
    }

    // Add rate limit info to response headers
    res.set({
      'X-RateLimit-Limit': result.limit,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    });

    next();
  } catch (error) {
    next(error);
  }
};

// Device binding check
const checkDeviceBinding = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const deviceId = req.headers['x-device-id'];
    if (!deviceId) {
      throw new AuthenticationError('Device ID is required');
    }

    // Check if device is bound to user
    const boundDevice = await cache.get(`device:${req.user.id}:${deviceId}`);
    
    if (!boundDevice) {
      const UserDevice = require('../models/UserDevice');
      const device = await UserDevice.findOne({
        where: {
          userId: req.user.id,
          deviceId,
          isActive: true,
        },
      });

      if (!device) {
        logger.security('UNBOUND_DEVICE_ACCESS', {
          userId: req.user.id,
          deviceId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        throw new AuthenticationError('Device not authorized');
      }

      // Cache device binding
      await cache.set(`device:${req.user.id}:${deviceId}`, device.toJSON(), 86400);
    }

    req.deviceId = deviceId;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwnerOrAdmin,
  optionalAuth,
  hasPermission,
  sensitiveOperation,
  checkDeviceBinding,
};
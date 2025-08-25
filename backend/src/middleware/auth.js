const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied. Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        santri: true,
        waliSantri: true,
        admin: true,
        finance: true,
        superAdmin: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'User account is deactivated.',
        code: 'USER_DEACTIVATED'
      });
    }

    // Check if session is valid
    const session = await prisma.session.findFirst({
      where: {
        userId: user.id,
        token: token,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        error: 'Session expired. Please login again.',
        code: 'SESSION_EXPIRED'
      });
    }

    // Attach user data to request
    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      santri: user.santri,
      waliSantri: user.waliSantri,
      admin: user.admin,
      finance: user.finance,
      superAdmin: user.superAdmin,
    };

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({
      error: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    });
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Specific role middleware functions
const requireSantri = requireRole(['SANTRI']);
const requireWaliSantri = requireRole(['WALI_SANTRI']);
const requireAdmin = requireRole(['ADMIN', 'SUPER_ADMIN']);
const requireFinance = requireRole(['FINANCE', 'SUPER_ADMIN']);
const requireSuperAdmin = requireRole(['SUPER_ADMIN']);

// Resource ownership middleware
const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.santriId;
      
      if (!resourceId) {
        return res.status(400).json({
          error: 'Resource ID is required.',
          code: 'MISSING_RESOURCE_ID'
        });
      }

      let hasAccess = false;

      switch (resourceType) {
        case 'santri':
          // Santri can access their own data
          if (req.user.role === 'SANTRI' && req.user.santri?.id === resourceId) {
            hasAccess = true;
          }
          // Wali Santri can access their children's data
          else if (req.user.role === 'WALI_SANTRI') {
            const waliSantri = await prisma.waliSantri.findFirst({
              where: {
                userId: req.user.id,
                santri: {
                  some: { id: resourceId }
                }
              }
            });
            hasAccess = !!waliSantri;
          }
          // Admin and above can access all
          else if (['ADMIN', 'FINANCE', 'SUPER_ADMIN'].includes(req.user.role)) {
            hasAccess = true;
          }
          break;

        case 'pocketMoney':
        case 'savings':
        case 'attendance':
        case 'reportCard':
          // These are santri-specific resources
          const santri = await prisma.santri.findUnique({
            where: { id: resourceId },
            include: {
              waliSantri: true
            }
          });
          
          if (!santri) {
            return res.status(404).json({
              error: 'Resource not found.',
              code: 'RESOURCE_NOT_FOUND'
            });
          }

          // Santri can access their own data
          if (req.user.role === 'SANTRI' && req.user.santri?.id === resourceId) {
            hasAccess = true;
          }
          // Wali Santri can access their children's data
          else if (req.user.role === 'WALI_SANTRI') {
            hasAccess = santri.waliSantri.some(wali => wali.userId === req.user.id);
          }
          // Admin and above can access all
          else if (['ADMIN', 'FINANCE', 'SUPER_ADMIN'].includes(req.user.role)) {
            hasAccess = true;
          }
          break;

        default:
          hasAccess = ['ADMIN', 'FINANCE', 'SUPER_ADMIN'].includes(req.user.role);
      }

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied. You do not have permission to access this resource.',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      return res.status(500).json({
        error: 'Internal server error during ownership verification.',
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

module.exports = {
  authMiddleware,
  requireRole,
  requireSantri,
  requireWaliSantri,
  requireAdmin,
  requireFinance,
  requireSuperAdmin,
  requireOwnership,
};
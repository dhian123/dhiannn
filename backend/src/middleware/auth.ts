import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { CacheService } from '@/config/redis';
import { createError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

// User roles enum
export enum UserRole {
  SANTRI = 'santri',
  WALI_SANTRI = 'wali_santri',
  ADMIN = 'admin',
  FINANCE = 'finance',
  SUPER_ADMIN = 'super_admin',
}

// User permissions enum
export enum Permission {
  // Santri permissions
  VIEW_POCKET_MONEY = 'view_pocket_money',
  VIEW_ATTENDANCE = 'view_attendance',
  VIEW_REPORT_CARD = 'view_report_card',
  VIEW_SAVINGS = 'view_savings',
  VIEW_LIBRARY = 'view_library',
  VIEW_ANNOUNCEMENTS = 'view_announcements',
  
  // Wali Santri permissions
  TOP_UP_POCKET_MONEY = 'top_up_pocket_money',
  PAY_BILLS = 'pay_bills',
  VIEW_CHILD_DATA = 'view_child_data',
  SEND_FEEDBACK = 'send_feedback',
  
  // Admin permissions
  MANAGE_SANTRI = 'manage_santri',
  MANAGE_ATTENDANCE = 'manage_attendance',
  MANAGE_REPORT_CARDS = 'manage_report_cards',
  MANAGE_ANNOUNCEMENTS = 'manage_announcements',
  MANAGE_LIBRARY = 'manage_library',
  VIEW_REPORTS = 'view_reports',
  
  // Finance permissions
  MANAGE_PAYMENTS = 'manage_payments',
  MANAGE_BILLS = 'manage_bills',
  VIEW_FINANCIAL_REPORTS = 'view_financial_reports',
  RECONCILE_PAYMENTS = 'reconcile_payments',
  
  // Super Admin permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  SYSTEM_CONFIG = 'system_config',
}

// Role-permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SANTRI]: [
    Permission.VIEW_POCKET_MONEY,
    Permission.VIEW_ATTENDANCE,
    Permission.VIEW_REPORT_CARD,
    Permission.VIEW_SAVINGS,
    Permission.VIEW_LIBRARY,
    Permission.VIEW_ANNOUNCEMENTS,
  ],
  [UserRole.WALI_SANTRI]: [
    Permission.TOP_UP_POCKET_MONEY,
    Permission.PAY_BILLS,
    Permission.VIEW_CHILD_DATA,
    Permission.SEND_FEEDBACK,
    Permission.VIEW_ANNOUNCEMENTS,
  ],
  [UserRole.ADMIN]: [
    Permission.MANAGE_SANTRI,
    Permission.MANAGE_ATTENDANCE,
    Permission.MANAGE_REPORT_CARDS,
    Permission.MANAGE_ANNOUNCEMENTS,
    Permission.MANAGE_LIBRARY,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANNOUNCEMENTS,
  ],
  [UserRole.FINANCE]: [
    Permission.MANAGE_PAYMENTS,
    Permission.MANAGE_BILLS,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.RECONCILE_PAYMENTS,
    Permission.VIEW_REPORTS,
  ],
  [UserRole.SUPER_ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.VIEW_AUDIT_LOGS,
    Permission.SYSTEM_CONFIG,
    // Super admin has all permissions
    ...Object.values(Permission),
  ],
};

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
}

// Extended request interface
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    permissions: Permission[];
  };
  requestId?: string;
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createError.unauthorized('Token expired', 'TOKEN_EXPIRED');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw createError.unauthorized('Invalid token', 'INVALID_TOKEN');
    }
    throw createError.unauthorized('Token verification failed', 'TOKEN_VERIFICATION_FAILED');
  }
}

// Authentication middleware
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError.unauthorized('No token provided', 'NO_TOKEN');
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const payload = verifyToken(token);
    
    // Check if token is blacklisted (logout)
    const isBlacklisted = await CacheService.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      throw createError.unauthorized('Token has been revoked', 'TOKEN_REVOKED');
    }
    
    // Check if user session is valid
    const session = await CacheService.getSession(payload.userId);
    if (!session || session.token !== token) {
      throw createError.unauthorized('Invalid session', 'INVALID_SESSION');
    }
    
    // Attach user to request
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    };
    
    // Log authentication
    logger.info('User authenticated', {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      requestId: req.requestId,
      ip: req.ip,
    });
    
    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    next(error);
  }
}

// Role-based access control middleware
export function requireRole(roles: UserRole | UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
    }
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Access denied - insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        requestId: req.requestId,
        path: req.path,
      });
      
      return next(createError.forbidden('Insufficient permissions', 'INSUFFICIENT_ROLE'));
    }
    
    next();
  };
}

// Permission-based access control middleware
export function requirePermission(permissions: Permission | Permission[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
    }
    
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    const hasPermission = requiredPermissions.every(permission =>
      req.user!.permissions.includes(permission)
    );
    
    if (!hasPermission) {
      logger.warn('Access denied - insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        userPermissions: req.user.permissions,
        requiredPermissions,
        requestId: req.requestId,
        path: req.path,
      });
      
      return next(createError.forbidden('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS'));
    }
    
    next();
  };
}

// Optional authentication middleware (doesn't fail if no token)
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  try {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    };
  } catch (error) {
    // Silently ignore token errors for optional auth
    logger.debug('Optional auth failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.requestId,
    });
  }
  
  next();
}

// Device binding middleware
export function requireDeviceBinding(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(createError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
  }
  
  const deviceId = req.headers['x-device-id'] as string;
  const userAgent = req.get('User-Agent');
  
  if (!deviceId) {
    return next(createError.badRequest('Device ID required', 'DEVICE_ID_REQUIRED'));
  }
  
  // Check if device is bound to user (implement device binding logic)
  // For now, just log the device info
  logger.info('Device binding check', {
    userId: req.user.id,
    deviceId,
    userAgent,
    requestId: req.requestId,
  });
  
  next();
}

// Session validation middleware
export async function validateSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    return next(createError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
  }
  
  try {
    const session = await CacheService.getSession(req.user.id);
    
    if (!session) {
      throw createError.unauthorized('Session expired', 'SESSION_EXPIRED');
    }
    
    // Check if session is still valid
    if (session.lastActivity && Date.now() - session.lastActivity > 30 * 60 * 1000) { // 30 minutes
      await CacheService.deleteSession(req.user.id);
      throw createError.unauthorized('Session expired due to inactivity', 'SESSION_INACTIVE');
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    await CacheService.setSession(req.user.id, session);
    
    next();
  } catch (error) {
    next(error);
  }
}

// Generate JWT token
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

// Generate refresh token
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

// Blacklist token (for logout)
export async function blacklistToken(token: string, expiresIn: number = 3600): Promise<void> {
  await CacheService.set(`blacklist:${token}`, 'true', expiresIn);
}

// Get user permissions by role
export function getPermissionsByRole(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}
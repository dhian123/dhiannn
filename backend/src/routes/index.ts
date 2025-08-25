import { Router } from 'express';
import { config } from '@/config';

// Import route modules
import authRoutes from './auth';
import userRoutes from './users';
import santriRoutes from './santri';
import waliSantriRoutes from './wali-santri';
import adminRoutes from './admin';
import financeRoutes from './finance';
import pocketMoneyRoutes from './pocket-money';
import billsRoutes from './bills';
import attendanceRoutes from './attendance';
import reportCardRoutes from './report-cards';
import libraryRoutes from './library';
import savingsRoutes from './savings';
import infaqRoutes from './infaq';
import announcementsRoutes from './announcements';
import feedbackRoutes from './feedback';
import cpsRoutes from './cps';
import waridRoutes from './warid';
import paymentRoutes from './payments';
import notificationRoutes from './notifications';
import auditRoutes from './audit';
import systemRoutes from './system';

// Import middleware
import { authenticate, requireRole, UserRole } from '@/middleware/auth';
import { rateLimiter, loginRateLimiter, otpRateLimiter } from '@/middleware/rateLimiter';
import { performanceMonitor, securityLogger, apiUsageTracker } from '@/middleware/requestLogger';

export function setupRoutes(app: Router): void {
  const apiRouter = Router();
  const apiVersion = config.apiVersion;

  // Apply global middleware
  apiRouter.use(performanceMonitor);
  apiRouter.use(securityLogger);
  apiRouter.use(apiUsageTracker);

  // Health check route (no authentication required)
  apiRouter.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.env,
    });
  });

  // API documentation route
  apiRouter.get('/docs', (req, res) => {
    res.json({
      message: 'SiNusa API Documentation',
      version: apiVersion,
      endpoints: {
        auth: '/auth',
        users: '/users',
        santri: '/santri',
        'wali-santri': '/wali-santri',
        admin: '/admin',
        finance: '/finance',
        'pocket-money': '/pocket-money',
        bills: '/bills',
        attendance: '/attendance',
        'report-cards': '/report-cards',
        library: '/library',
        savings: '/savings',
        infaq: '/infaq',
        announcements: '/announcements',
        feedback: '/feedback',
        cps: '/cps',
        warid: '/warid',
        payments: '/payments',
        notifications: '/notifications',
        audit: '/audit',
        system: '/system',
      },
      authentication: 'Bearer token required for most endpoints',
      rate_limiting: 'Rate limiting applied to all endpoints',
    });
  });

  // Authentication routes (public)
  apiRouter.use('/auth', rateLimiter, authRoutes);

  // Protected routes (require authentication)
  apiRouter.use('/users', authenticate, rateLimiter, userRoutes);
  apiRouter.use('/santri', authenticate, rateLimiter, santriRoutes);
  apiRouter.use('/wali-santri', authenticate, rateLimiter, waliSantriRoutes);
  apiRouter.use('/admin', authenticate, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), rateLimiter, adminRoutes);
  apiRouter.use('/finance', authenticate, requireRole([UserRole.FINANCE, UserRole.SUPER_ADMIN]), rateLimiter, financeRoutes);
  apiRouter.use('/pocket-money', authenticate, rateLimiter, pocketMoneyRoutes);
  apiRouter.use('/bills', authenticate, rateLimiter, billsRoutes);
  apiRouter.use('/attendance', authenticate, rateLimiter, attendanceRoutes);
  apiRouter.use('/report-cards', authenticate, rateLimiter, reportCardRoutes);
  apiRouter.use('/library', authenticate, rateLimiter, libraryRoutes);
  apiRouter.use('/savings', authenticate, rateLimiter, savingsRoutes);
  apiRouter.use('/infaq', authenticate, rateLimiter, infaqRoutes);
  apiRouter.use('/announcements', authenticate, rateLimiter, announcementsRoutes);
  apiRouter.use('/feedback', authenticate, rateLimiter, feedbackRoutes);
  apiRouter.use('/cps', authenticate, rateLimiter, cpsRoutes);
  apiRouter.use('/warid', authenticate, rateLimiter, waridRoutes);
  apiRouter.use('/payments', authenticate, rateLimiter, paymentRoutes);
  apiRouter.use('/notifications', authenticate, rateLimiter, notificationRoutes);
  apiRouter.use('/audit', authenticate, requireRole([UserRole.SUPER_ADMIN]), rateLimiter, auditRoutes);
  apiRouter.use('/system', authenticate, requireRole([UserRole.SUPER_ADMIN]), rateLimiter, systemRoutes);

  // Mount API routes
  app.use(`/api/${apiVersion}`, apiRouter);

  // 404 handler for API routes
  app.use(`/api/${apiVersion}/*`, (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'API endpoint not found',
        code: 'API_ENDPOINT_NOT_FOUND',
        path: req.originalUrl,
      },
      timestamp: new Date().toISOString(),
    });
  });
}
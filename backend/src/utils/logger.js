const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const logDir = 'logs';

// Ensure log directory exists
require('fs').mkdirSync(logDir, { recursive: true });

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'sinusa-backend',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // Error log file
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    
    // Combined log file
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    
    // Audit log file for security events
    new DailyRotateFile({
      filename: path.join(logDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'warn',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Custom logging methods for different types of events
const customLogger = {
  ...logger,
  
  // Authentication events
  auth: (message, meta = {}) => {
    logger.info(message, { type: 'AUTH', ...meta });
  },
  
  // Payment events
  payment: (message, meta = {}) => {
    logger.info(message, { type: 'PAYMENT', ...meta });
  },
  
  // Security events
  security: (message, meta = {}) => {
    logger.warn(message, { type: 'SECURITY', ...meta });
  },
  
  // Database events
  database: (message, meta = {}) => {
    logger.debug(message, { type: 'DATABASE', ...meta });
  },
  
  // API events
  api: (message, meta = {}) => {
    logger.info(message, { type: 'API', ...meta });
  },
  
  // Business logic events
  business: (message, meta = {}) => {
    logger.info(message, { type: 'BUSINESS', ...meta });
  },
  
  // Performance events
  performance: (message, meta = {}) => {
    logger.info(message, { type: 'PERFORMANCE', ...meta });
  },
  
  // Audit trail for financial transactions
  audit: (action, userId, details = {}) => {
    logger.warn('AUDIT_TRAIL', {
      type: 'AUDIT',
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...details,
    });
  },
  
  // Request logging
  request: (req, res, responseTime) => {
    const { method, url, ip, headers } = req;
    const { statusCode } = res;
    
    logger.info('HTTP_REQUEST', {
      type: 'REQUEST',
      method,
      url,
      ip,
      statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: headers['user-agent'],
      userId: req.user?.id,
    });
  },
  
  // Error logging with context
  errorWithContext: (error, context = {}) => {
    logger.error(error.message, {
      type: 'ERROR',
      stack: error.stack,
      name: error.name,
      ...context,
    });
  },
  
  // Transaction logging
  transaction: (type, amount, userId, details = {}) => {
    logger.info('TRANSACTION', {
      type: 'TRANSACTION',
      transactionType: type,
      amount,
      userId,
      timestamp: new Date().toISOString(),
      ...details,
    });
  },
  
  // System events
  system: (event, details = {}) => {
    logger.info(event, {
      type: 'SYSTEM',
      timestamp: new Date().toISOString(),
      ...details,
    });
  },
  
  // User activity logging
  userActivity: (userId, action, details = {}) => {
    logger.info('USER_ACTIVITY', {
      type: 'USER_ACTIVITY',
      userId,
      action,
      timestamp: new Date().toISOString(),
      ...details,
    });
  },
  
  // Data access logging
  dataAccess: (userId, resource, action, details = {}) => {
    logger.info('DATA_ACCESS', {
      type: 'DATA_ACCESS',
      userId,
      resource,
      action,
      timestamp: new Date().toISOString(),
      ...details,
    });
  },
  
  // Integration logging
  integration: (service, action, details = {}) => {
    logger.info('INTEGRATION', {
      type: 'INTEGRATION',
      service,
      action,
      timestamp: new Date().toISOString(),
      ...details,
    });
  },
  
  // Notification logging
  notification: (type, recipient, details = {}) => {
    logger.info('NOTIFICATION', {
      type: 'NOTIFICATION',
      notificationType: type,
      recipient,
      timestamp: new Date().toISOString(),
      ...details,
    });
  },
  
  // Cache events
  cache: (action, key, details = {}) => {
    logger.debug('CACHE', {
      type: 'CACHE',
      action,
      key,
      ...details,
    });
  },
  
  // Validation errors
  validation: (field, value, error, context = {}) => {
    logger.warn('VALIDATION_ERROR', {
      type: 'VALIDATION',
      field,
      value: typeof value === 'string' && value.length > 100 ? 
        `${value.substring(0, 100)}...` : value,
      error,
      ...context,
    });
  },
};

// Performance monitoring helper
const performanceLogger = {
  start: (operation) => {
    const startTime = Date.now();
    return {
      end: (details = {}) => {
        const duration = Date.now() - startTime;
        customLogger.performance(`${operation} completed`, {
          operation,
          duration: `${duration}ms`,
          ...details,
        });
        return duration;
      },
    };
  },
};

// Export both the original logger and custom logger
module.exports = {
  ...customLogger,
  performance: performanceLogger,
  winston: logger,
};
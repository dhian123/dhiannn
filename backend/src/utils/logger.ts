import fs from 'fs';
import path from 'path';
import { config } from '@/config';

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const logLevelMap: Record<string, LogLevel> = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
};

const currentLogLevel = logLevelMap[config.logging.level] || LogLevel.INFO;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Log format function
function formatLog(level: string, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
}

// Write to file
function writeToFile(logEntry: string): void {
  try {
    fs.appendFileSync(config.logging.file, logEntry + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Console output with colors
function writeToConsole(level: string, logEntry: string): void {
  const colorMap: Record<string, string> = {
    error: colors.red,
    warn: colors.yellow,
    info: colors.green,
    debug: colors.cyan,
  };

  const color = colorMap[level] || colors.white;
  console.log(`${color}${logEntry}${colors.reset}`);
}

// Main logging function
function log(level: LogLevel, levelName: string, message: string, meta?: any): void {
  if (level <= currentLogLevel) {
    const logEntry = formatLog(levelName, message, meta);
    
    // Always write to file
    writeToFile(logEntry);
    
    // Write to console in development
    if (config.env === 'development') {
      writeToConsole(levelName, logEntry);
    }
  }
}

// Logger interface
export const logger = {
  error: (message: string, meta?: any) => log(LogLevel.ERROR, 'error', message, meta),
  warn: (message: string, meta?: any) => log(LogLevel.WARN, 'warn', message, meta),
  info: (message: string, meta?: any) => log(LogLevel.INFO, 'info', message, meta),
  debug: (message: string, meta?: any) => log(LogLevel.DEBUG, 'debug', message, meta),
  
  // Specialized logging methods
  request: (method: string, url: string, statusCode: number, responseTime: number) => {
    const level = statusCode >= 400 ? 'warn' : 'info';
    const message = `${method} ${url} - ${statusCode} (${responseTime}ms)`;
    log(LogLevel.INFO, level, message);
  },
  
  database: (operation: string, table: string, duration: number, meta?: any) => {
    const message = `DB ${operation} on ${table} (${duration}ms)`;
    log(LogLevel.DEBUG, 'debug', message, meta);
  },
  
  payment: (gateway: string, transactionId: string, amount: number, status: string) => {
    const message = `Payment ${gateway}: ${transactionId} - ${amount} (${status})`;
    const level = status === 'success' ? 'info' : 'warn';
    log(LogLevel.INFO, level, message);
  },
  
  security: (event: string, userId?: string, ip?: string, meta?: any) => {
    const message = `Security: ${event}${userId ? ` | User: ${userId}` : ''}${ip ? ` | IP: ${ip}` : ''}`;
    log(LogLevel.WARN, 'warn', message, meta);
  },
  
  notification: (type: string, recipient: string, status: string, meta?: any) => {
    const message = `Notification ${type} to ${recipient} - ${status}`;
    const level = status === 'sent' ? 'info' : 'warn';
    log(LogLevel.INFO, level, message, meta);
  },
  
  audit: (action: string, userId: string, resource: string, details?: any) => {
    const message = `Audit: ${action} by ${userId} on ${resource}`;
    log(LogLevel.INFO, 'info', message, details);
  },
  
  performance: (operation: string, duration: number, meta?: any) => {
    const level = duration > 1000 ? 'warn' : 'debug';
    const message = `Performance: ${operation} took ${duration}ms`;
    log(LogLevel.DEBUG, level, message, meta);
  },
};

// Request logging middleware
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.request(req.method, req.originalUrl, res.statusCode, duration);
    });
    
    next();
  };
}

// Error logging
export function logError(error: Error, context?: string): void {
  logger.error(`Error${context ? ` in ${context}` : ''}: ${error.message}`, {
    stack: error.stack,
    name: error.name,
    context,
  });
}

// Performance monitoring
export function createPerformanceLogger(operation: string) {
  const start = Date.now();
  
  return (meta?: any) => {
    const duration = Date.now() - start;
    logger.performance(operation, duration, meta);
  };
}
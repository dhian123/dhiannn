const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Create audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User ID who performed the action
 * @param {string} params.action - Action performed (CREATE, UPDATE, DELETE, LOGIN, etc.)
 * @param {string} params.table - Database table affected
 * @param {string} params.recordId - ID of the record affected
 * @param {Object} params.oldValues - Previous values (for updates)
 * @param {Object} params.newValues - New values (for updates/creates)
 * @param {string} params.ipAddress - IP address of the user
 * @param {string} params.userAgent - User agent string
 */
const createAuditLog = async (params) => {
  try {
    const {
      userId,
      action,
      table,
      recordId,
      oldValues = null,
      newValues = null,
      ipAddress = null,
      userAgent = null,
    } = params;

    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        table,
        recordId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent,
      }
    });

    logger.info(`Audit log created: ${action} on ${table} by user ${userId}`);
    return auditLog;

  } catch (error) {
    logger.error('Error creating audit log:', error);
    // Don't throw error to avoid breaking the main operation
    return null;
  }
};

/**
 * Create financial audit log for transactions
 * @param {Object} params - Financial audit parameters
 * @param {string} params.userId - User ID
 * @param {string} params.action - Transaction action
 * @param {string} params.amount - Transaction amount
 * @param {string} params.type - Transaction type
 * @param {string} params.reference - Transaction reference
 * @param {string} params.status - Transaction status
 * @param {string} params.ipAddress - IP address
 */
const createFinancialAuditLog = async (params) => {
  try {
    const {
      userId,
      action,
      amount,
      type,
      reference,
      status,
      ipAddress = null,
      userAgent = null,
    } = params;

    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action: `FINANCIAL_${action}`,
        table: 'transactions',
        recordId: reference,
        newValues: JSON.stringify({
          amount,
          type,
          reference,
          status,
          timestamp: new Date().toISOString(),
        }),
        ipAddress,
        userAgent,
      }
    });

    logger.info(`Financial audit log created: ${action} - ${amount} - ${reference}`);
    return auditLog;

  } catch (error) {
    logger.error('Error creating financial audit log:', error);
    return null;
  }
};

/**
 * Get audit logs with filtering
 * @param {Object} filters - Filter parameters
 * @param {string} filters.userId - Filter by user ID
 * @param {string} filters.action - Filter by action
 * @param {string} filters.table - Filter by table
 * @param {Date} filters.startDate - Start date for filtering
 * @param {Date} filters.endDate - End date for filtering
 * @param {number} filters.page - Page number
 * @param {number} filters.limit - Items per page
 */
const getAuditLogs = async (filters = {}) => {
  try {
    const {
      userId,
      action,
      table,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const where = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (table) where.table = table;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };

  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    throw error;
  }
};

/**
 * Get financial audit summary
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
const getFinancialAuditSummary = async (startDate, endDate) => {
  try {
    const where = {
      action: {
        startsWith: 'FINANCIAL_'
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      }
    };

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      totalTransactions: auditLogs.length,
      totalAmount: 0,
      byType: {},
      byStatus: {},
      byAction: {},
    };

    auditLogs.forEach(log => {
      if (log.newValues) {
        const data = JSON.parse(log.newValues);
        summary.totalAmount += parseFloat(data.amount) || 0;
        
        // Count by type
        summary.byType[data.type] = (summary.byType[data.type] || 0) + 1;
        
        // Count by status
        summary.byStatus[data.status] = (summary.byStatus[data.status] || 0) + 1;
      }
      
      // Count by action
      const action = log.action.replace('FINANCIAL_', '');
      summary.byAction[action] = (summary.byAction[action] || 0) + 1;
    });

    return summary;

  } catch (error) {
    logger.error('Error getting financial audit summary:', error);
    throw error;
  }
};

/**
 * Clean old audit logs (older than specified days)
 * @param {number} days - Number of days to keep
 */
const cleanOldAuditLogs = async (days = 365) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    logger.info(`Cleaned ${result.count} old audit logs (older than ${days} days)`);
    return result.count;

  } catch (error) {
    logger.error('Error cleaning old audit logs:', error);
    throw error;
  }
};

module.exports = {
  createAuditLog,
  createFinancialAuditLog,
  getAuditLogs,
  getFinancialAuditSummary,
  cleanOldAuditLogs,
};
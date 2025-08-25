const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');
const logger = require('../utils/logger');
const { requireOwnership } = require('../middleware/auth');
const { createFinancialAuditLog } = require('../services/auditService');
const { processPayment } = require('../services/paymentService');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const topUpSchema = Joi.object({
  amount: Joi.number().positive().required(),
  paymentMethod: Joi.string().valid('BANK_TRANSFER', 'E_WALLET', 'CREDIT_CARD').required(),
  description: Joi.string().optional(),
});

const withdrawSchema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().optional(),
});

// Get pocket money balance
router.get('/:santriId', requireOwnership('pocketMoney'), async (req, res) => {
  try {
    const { santriId } = req.params;

    const pocketMoney = await prisma.pocketMoney.findUnique({
      where: { santriId },
      include: {
        santri: {
          select: {
            id: true,
            name: true,
            nis: true,
          }
        }
      }
    });

    if (!pocketMoney) {
      return res.status(404).json({
        success: false,
        error: 'Pocket money account not found',
        code: 'POCKET_MONEY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        balance: pocketMoney.balance,
        santri: pocketMoney.santri,
        lastUpdated: pocketMoney.updatedAt,
      }
    });

  } catch (error) {
    logger.error('Error fetching pocket money balance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'POCKET_MONEY_FETCH_ERROR'
    });
  }
});

// Get transaction history
router.get('/:santriId/transactions', requireOwnership('pocketMoney'), async (req, res) => {
  try {
    const { santriId } = req.params;
    const { page = 1, limit = 20, type, status } = req.query;

    const where = {
      pocketMoney: {
        santriId
      }
    };

    if (type) where.type = type;
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.pocketMoneyTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.pocketMoneyTransaction.count({ where })
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      }
    });

  } catch (error) {
    logger.error('Error fetching pocket money transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'TRANSACTIONS_FETCH_ERROR'
    });
  }
});

// Top up pocket money
router.post('/:santriId/top-up', requireOwnership('pocketMoney'), async (req, res) => {
  try {
    const { error, value } = topUpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { santriId } = req.params;
    const { amount, paymentMethod, description } = value;

    // Check if pocket money account exists
    const pocketMoney = await prisma.pocketMoney.findUnique({
      where: { santriId },
      include: {
        santri: {
          select: {
            id: true,
            name: true,
            nis: true,
          }
        }
      }
    });

    if (!pocketMoney) {
      return res.status(404).json({
        success: false,
        error: 'Pocket money account not found',
        code: 'POCKET_MONEY_NOT_FOUND'
      });
    }

    // Generate unique reference
    const reference = `TOPUP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create transaction record
    const transaction = await prisma.pocketMoneyTransaction.create({
      data: {
        pocketMoneyId: pocketMoney.id,
        type: 'TOP_UP',
        amount,
        description: description || 'Pocket money top-up',
        reference,
        status: 'PENDING',
      }
    });

    // Process payment
    const paymentResult = await processPayment({
      amount,
      paymentMethod,
      reference,
      description: `Top-up pocket money for ${pocketMoney.santri.name}`,
      userId: req.user.id,
    });

    if (paymentResult.success) {
      // Update transaction status
      await prisma.pocketMoneyTransaction.update({
        where: { id: transaction.id },
        data: { status: 'SUCCESS' }
      });

      // Update pocket money balance
      await prisma.pocketMoney.update({
        where: { id: pocketMoney.id },
        data: {
          balance: {
            increment: amount
          }
        }
      });

      // Create audit log
      await createFinancialAuditLog({
        userId: req.user.id,
        action: 'POCKET_MONEY_TOP_UP',
        amount: amount.toString(),
        type: 'TOP_UP',
        reference,
        status: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      logger.info(`Pocket money top-up successful: ${amount} for santri ${santriId}`);

      res.json({
        success: true,
        message: 'Pocket money top-up successful',
        data: {
          transactionId: transaction.id,
          reference,
          amount,
          newBalance: pocketMoney.balance + amount,
          paymentDetails: paymentResult.data,
        }
      });
    } else {
      // Update transaction status to failed
      await prisma.pocketMoneyTransaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' }
      });

      res.status(400).json({
        success: false,
        error: 'Payment processing failed',
        code: 'PAYMENT_FAILED',
        details: paymentResult.error
      });
    }

  } catch (error) {
    logger.error('Error processing pocket money top-up:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'TOP_UP_ERROR'
    });
  }
});

// Withdraw pocket money
router.post('/:santriId/withdraw', requireOwnership('pocketMoney'), async (req, res) => {
  try {
    const { error, value } = withdrawSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { santriId } = req.params;
    const { amount, description } = value;

    // Check if pocket money account exists
    const pocketMoney = await prisma.pocketMoney.findUnique({
      where: { santriId },
      include: {
        santri: {
          select: {
            id: true,
            name: true,
            nis: true,
          }
        }
      }
    });

    if (!pocketMoney) {
      return res.status(404).json({
        success: false,
        error: 'Pocket money account not found',
        code: 'POCKET_MONEY_NOT_FOUND'
      });
    }

    // Check if sufficient balance
    if (pocketMoney.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        code: 'INSUFFICIENT_BALANCE',
        data: {
          currentBalance: pocketMoney.balance,
          requestedAmount: amount,
        }
      });
    }

    // Generate unique reference
    const reference = `WITHDRAW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create transaction record
    const transaction = await prisma.pocketMoneyTransaction.create({
      data: {
        pocketMoneyId: pocketMoney.id,
        type: 'WITHDRAWAL',
        amount,
        description: description || 'Pocket money withdrawal',
        reference,
        status: 'SUCCESS',
      }
    });

    // Update pocket money balance
    await prisma.pocketMoney.update({
      where: { id: pocketMoney.id },
      data: {
        balance: {
          decrement: amount
        }
      }
    });

    // Create audit log
    await createFinancialAuditLog({
      userId: req.user.id,
      action: 'POCKET_MONEY_WITHDRAWAL',
      amount: amount.toString(),
      type: 'WITHDRAWAL',
      reference,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    logger.info(`Pocket money withdrawal successful: ${amount} for santri ${santriId}`);

    res.json({
      success: true,
      message: 'Pocket money withdrawal successful',
      data: {
        transactionId: transaction.id,
        reference,
        amount,
        newBalance: pocketMoney.balance - amount,
      }
    });

  } catch (error) {
    logger.error('Error processing pocket money withdrawal:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'WITHDRAWAL_ERROR'
    });
  }
});

// Get transaction details
router.get('/:santriId/transactions/:transactionId', requireOwnership('pocketMoney'), async (req, res) => {
  try {
    const { santriId, transactionId } = req.params;

    const transaction = await prisma.pocketMoneyTransaction.findFirst({
      where: {
        id: transactionId,
        pocketMoney: {
          santriId
        }
      },
      include: {
        pocketMoney: {
          include: {
            santri: {
              select: {
                id: true,
                name: true,
                nis: true,
              }
            }
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    logger.error('Error fetching transaction details:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'TRANSACTION_FETCH_ERROR'
    });
  }
});

module.exports = router;
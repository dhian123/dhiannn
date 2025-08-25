const midtransClient = require('midtrans-client');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Initialize Midtrans client
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

/**
 * Process payment through payment gateway
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Payment amount
 * @param {string} params.paymentMethod - Payment method
 * @param {string} params.reference - Payment reference
 * @param {string} params.description - Payment description
 * @param {string} params.userId - User ID
 * @param {Object} params.customer - Customer details
 */
const processPayment = async (params) => {
  try {
    const {
      amount,
      paymentMethod,
      reference,
      description,
      userId,
      customer = {}
    } = params;

    // Create payment transaction
    const transactionDetails = {
      transaction_details: {
        order_id: reference,
        gross_amount: amount,
      },
      item_details: [
        {
          id: 'POCKET_MONEY_TOPUP',
          price: amount,
          quantity: 1,
          name: description || 'Pocket Money Top-up',
        }
      ],
      customer_details: {
        first_name: customer.firstName || 'Customer',
        last_name: customer.lastName || '',
        email: customer.email || 'customer@example.com',
        phone: customer.phone || '',
      },
      enabled_payments: getEnabledPayments(paymentMethod),
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/payment/success`,
        error: `${process.env.FRONTEND_URL}/payment/error`,
        pending: `${process.env.FRONTEND_URL}/payment/pending`,
      }
    };

    // Create Snap transaction
    const transaction = await snap.createTransaction(transactionDetails);

    logger.info(`Payment transaction created: ${reference} - ${amount}`);

    return {
      success: true,
      data: {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        reference,
        amount,
        status: 'PENDING',
      }
    };

  } catch (error) {
    logger.error('Payment processing error:', error);
    return {
      success: false,
      error: error.message || 'Payment processing failed',
    };
  }
};

/**
 * Get enabled payment methods based on requested method
 * @param {string} paymentMethod - Requested payment method
 * @returns {Array} Array of enabled payment methods
 */
const getEnabledPayments = (paymentMethod) => {
  switch (paymentMethod) {
    case 'BANK_TRANSFER':
      return ['bca_va', 'bni_va', 'bri_va', 'mandiri_va', 'permata_va'];
    case 'E_WALLET':
      return ['gopay', 'ovo', 'dana', 'linkaja', 'shopeepay'];
    case 'CREDIT_CARD':
      return ['credit_card'];
    default:
      return ['bca_va', 'bni_va', 'bri_va', 'mandiri_va', 'permata_va', 'gopay', 'ovo', 'dana', 'linkaja', 'shopeepay', 'credit_card'];
  }
};

/**
 * Handle payment notification from payment gateway
 * @param {Object} notification - Payment notification data
 */
const handlePaymentNotification = async (notification) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Verify notification signature
    const isValid = snap.transaction.notification(notification);
    
    if (!isValid) {
      logger.error('Invalid payment notification signature');
      return { success: false, error: 'Invalid signature' };
    }

    const {
      order_id: reference,
      transaction_status: status,
      gross_amount: amount,
      payment_type: paymentType,
      transaction_time: transactionTime,
      fraud_status: fraudStatus,
    } = notification;

    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: {
        santri: true,
      }
    });

    if (!payment) {
      logger.error(`Payment not found for reference: ${reference}`);
      return { success: false, error: 'Payment not found' };
    }

    // Update payment status
    let paymentStatus = 'PENDING';
    
    switch (status) {
      case 'capture':
      case 'settlement':
        paymentStatus = 'SUCCESS';
        break;
      case 'pending':
        paymentStatus = 'PENDING';
        break;
      case 'deny':
      case 'expire':
      case 'cancel':
        paymentStatus = 'FAILED';
        break;
      default:
        paymentStatus = 'PENDING';
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        gatewayResponse: notification,
      }
    });

    // If payment is successful, update related records
    if (paymentStatus === 'SUCCESS') {
      // Update pocket money transaction if it's a top-up
      const pocketMoneyTransaction = await prisma.pocketMoneyTransaction.findFirst({
        where: { reference }
      });

      if (pocketMoneyTransaction) {
        await prisma.pocketMoneyTransaction.update({
          where: { id: pocketMoneyTransaction.id },
          data: { status: 'SUCCESS' }
        });

        // Update pocket money balance
        await prisma.pocketMoney.update({
          where: { id: pocketMoneyTransaction.pocketMoneyId },
          data: {
            balance: {
              increment: parseFloat(amount)
            }
          }
        });
      }

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: payment.santriId,
          title: 'Payment Successful',
          message: `Your payment of ${amount} has been processed successfully.`,
          type: 'PAYMENT',
        }
      });
    }

    logger.info(`Payment notification processed: ${reference} - ${status}`);

    return { success: true, status: paymentStatus };

  } catch (error) {
    logger.error('Error processing payment notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get payment status
 * @param {string} reference - Payment reference
 */
const getPaymentStatus = async (reference) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const payment = await prisma.payment.findUnique({
      where: { reference },
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

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    return {
      success: true,
      data: {
        reference: payment.reference,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        santri: payment.santri,
      }
    };

  } catch (error) {
    logger.error('Error getting payment status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancel payment
 * @param {string} reference - Payment reference
 */
const cancelPayment = async (reference) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const payment = await prisma.payment.findUnique({
      where: { reference }
    });

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status !== 'PENDING') {
      return { success: false, error: 'Payment cannot be cancelled' };
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'CANCELLED' }
    });

    // Update related pocket money transaction if exists
    const pocketMoneyTransaction = await prisma.pocketMoneyTransaction.findFirst({
      where: { reference }
    });

    if (pocketMoneyTransaction) {
      await prisma.pocketMoneyTransaction.update({
        where: { id: pocketMoneyTransaction.id },
        data: { status: 'CANCELLED' }
      });
    }

    logger.info(`Payment cancelled: ${reference}`);

    return { success: true, message: 'Payment cancelled successfully' };

  } catch (error) {
    logger.error('Error cancelling payment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate payment report
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} status - Payment status filter
 */
const generatePaymentReport = async (startDate, endDate, status = null) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      }
    };

    if (status) {
      where.status = status;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        santri: {
          select: {
            id: true,
            name: true,
            nis: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = {
      totalPayments: payments.length,
      totalAmount: 0,
      byStatus: {},
      byMethod: {},
      byDate: {},
    };

    payments.forEach(payment => {
      summary.totalAmount += parseFloat(payment.amount);
      
      // Count by status
      summary.byStatus[payment.status] = (summary.byStatus[payment.status] || 0) + 1;
      
      // Count by method
      summary.byMethod[payment.method] = (summary.byMethod[payment.method] || 0) + 1;
      
      // Count by date
      const date = payment.createdAt.toISOString().split('T')[0];
      summary.byDate[date] = (summary.byDate[date] || 0) + 1;
    });

    return {
      success: true,
      data: {
        payments,
        summary,
        period: {
          startDate,
          endDate,
        }
      }
    };

  } catch (error) {
    logger.error('Error generating payment report:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  processPayment,
  handlePaymentNotification,
  getPaymentStatus,
  cancelPayment,
  generatePaymentReport,
};
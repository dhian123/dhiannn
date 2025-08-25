const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/payments/topup:
 *   post:
 *     summary: Create top-up payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top-up payment created successfully
 */
router.post('/topup', paymentController.createTopUp);

/**
 * @swagger
 * /api/v1/payments/bills:
 *   get:
 *     summary: Get bills and installments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bills retrieved successfully
 */
router.get('/bills', paymentController.getBills);

/**
 * @swagger
 * /api/v1/payments/history:
 *   get:
 *     summary: Get payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 */
router.get('/history', paymentController.getPaymentHistory);

/**
 * @swagger
 * /api/v1/payments/webhook:
 *   post:
 *     summary: Payment gateway webhook
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
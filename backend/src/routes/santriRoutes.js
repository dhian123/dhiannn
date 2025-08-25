const express = require('express');
const santriController = require('../controllers/santriController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/santri:
 *   get:
 *     summary: Get santri data
 *     tags: [Santri]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Santri data retrieved successfully
 */
router.get('/', santriController.getSantriData);

/**
 * @swagger
 * /api/v1/santri/balance:
 *   get:
 *     summary: Get pocket money balance
 *     tags: [Santri]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 */
router.get('/balance', santriController.getBalance);

/**
 * @swagger
 * /api/v1/santri/savings:
 *   get:
 *     summary: Get santri savings
 *     tags: [Santri]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Savings data retrieved successfully
 */
router.get('/savings', santriController.getSavings);

module.exports = router;
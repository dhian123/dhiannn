const express = require('express');
const infaqController = require('../controllers/infaqController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/infaq:
 *   post:
 *     summary: Create infaq donation
 *     tags: [Infaq]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Infaq created successfully
 */
router.post('/', infaqController.createInfaq);

/**
 * @swagger
 * /api/v1/infaq/history:
 *   get:
 *     summary: Get infaq history
 *     tags: [Infaq]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Infaq history retrieved successfully
 */
router.get('/history', infaqController.getInfaqHistory);

module.exports = router;
const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/reports/financial:
 *   get:
 *     summary: Get financial reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial reports retrieved successfully
 */
router.get('/financial', authorize(['ADMIN', 'FINANCE', 'SUPER_ADMIN']), reportController.getFinancialReports);

/**
 * @swagger
 * /api/v1/reports/attendance:
 *   get:
 *     summary: Get attendance reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance reports retrieved successfully
 */
router.get('/attendance', authorize(['ADMIN', 'STAFF', 'SUPER_ADMIN']), reportController.getAttendanceReports);

module.exports = router;
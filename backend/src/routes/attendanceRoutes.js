const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/attendance:
 *   get:
 *     summary: Get attendance records
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 */
router.get('/', attendanceController.getAttendance);

/**
 * @swagger
 * /api/v1/attendance/summary:
 *   get:
 *     summary: Get attendance summary
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance summary retrieved successfully
 */
router.get('/summary', attendanceController.getAttendanceSummary);

module.exports = router;
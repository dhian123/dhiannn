const express = require('express');
const gradeController = require('../controllers/gradeController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/grades:
 *   get:
 *     summary: Get grades and report cards
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Grades retrieved successfully
 */
router.get('/', gradeController.getGrades);

/**
 * @swagger
 * /api/v1/grades/report-card:
 *   get:
 *     summary: Get report card
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Report card retrieved successfully
 */
router.get('/report-card', gradeController.getReportCard);

module.exports = router;
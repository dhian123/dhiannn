const express = require('express');
const libraryController = require('../controllers/libraryController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/library/books:
 *   get:
 *     summary: Get library books
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Books retrieved successfully
 */
router.get('/books', libraryController.getBooks);

/**
 * @swagger
 * /api/v1/library/borrowed:
 *   get:
 *     summary: Get borrowed books
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Borrowed books retrieved successfully
 */
router.get('/borrowed', libraryController.getBorrowedBooks);

module.exports = router;
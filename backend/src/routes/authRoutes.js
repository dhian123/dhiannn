const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validation');
const { rateLimitAuth } = require('../middleware/rateLimit');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - identifier
 *         - password
 *       properties:
 *         identifier:
 *           type: string
 *           description: Username, email, or phone number
 *         password:
 *           type: string
 *           description: User password
 *         deviceId:
 *           type: string
 *           description: Device identifier
 *     OTPRequest:
 *       type: object
 *       required:
 *         - identifier
 *       properties:
 *         identifier:
 *           type: string
 *           description: Phone number or email
 *     OTPVerifyRequest:
 *       type: object
 *       required:
 *         - identifier
 *         - otp
 *       properties:
 *         identifier:
 *           type: string
 *           description: Phone number or email
 *         otp:
 *           type: string
 *           description: 6-digit OTP code
 *         deviceId:
 *           type: string
 *           description: Device identifier
 *     AuthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             accessToken:
 *               type: string
 *             refreshToken:
 *               type: string
 *             expiresIn:
 *               type: number
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login with username/email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */
router.post(
  '/login',
  rateLimitAuth,
  [
    body('identifier')
      .notEmpty()
      .withMessage('Username, email, or phone number is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('deviceId')
      .optional()
      .isString()
      .withMessage('Device ID must be a string'),
  ],
  validateRequest,
  authController.login
);

/**
 * @swagger
 * /api/v1/auth/otp/send:
 *   post:
 *     summary: Send OTP to phone number or email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       429:
 *         description: Too many OTP requests
 */
router.post(
  '/otp/send',
  rateLimitAuth,
  [
    body('identifier')
      .notEmpty()
      .withMessage('Phone number or email is required'),
  ],
  validateRequest,
  authController.sendOTP
);

/**
 * @swagger
 * /api/v1/auth/otp/verify:
 *   post:
 *     summary: Verify OTP and login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPVerifyRequest'
 *     responses:
 *       200:
 *         description: OTP verified and login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid or expired OTP
 */
router.post(
  '/otp/verify',
  rateLimitAuth,
  [
    body('identifier')
      .notEmpty()
      .withMessage('Phone number or email is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits'),
    body('deviceId')
      .optional()
      .isString()
      .withMessage('Device ID must be a string'),
  ],
  validateRequest,
  authController.verifyOTP
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post(
  '/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
  ],
  validateRequest,
  authController.refreshToken
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or phone number
 *     responses:
 *       200:
 *         description: Password reset instructions sent
 *       404:
 *         description: User not found
 */
router.post(
  '/forgot-password',
  rateLimitAuth,
  [
    body('identifier')
      .notEmpty()
      .withMessage('Email or phone number is required'),
  ],
  validateRequest,
  authController.forgotPassword
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or passwords don't match
 */
router.post(
  '/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
  ],
  validateRequest,
  authController.resetPassword
);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Change password for authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password or passwords don't match
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/change-password',
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
  ],
  validateRequest,
  authController.changePassword
);

/**
 * @swagger
 * /api/v1/auth/verify-token:
 *   post:
 *     summary: Verify if token is valid
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Invalid token
 */
router.post('/verify-token', authController.verifyToken);

module.exports = router;
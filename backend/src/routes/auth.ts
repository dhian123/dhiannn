import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '@/middleware/errorHandler';
import { loginRateLimiter, otpRateLimiter } from '@/middleware/rateLimiter';
import { AuthController } from '@/controllers/auth';

const router = Router();
const authController = new AuthController();

// Validation rules
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').isMobilePhone('id-ID').withMessage('Valid Indonesian phone number is required'),
  body('role').isIn(['santri', 'wali_santri', 'admin', 'finance']).withMessage('Valid role is required'),
];

const otpValidation = [
  body('phone').isMobilePhone('id-ID').withMessage('Valid Indonesian phone number is required'),
];

const verifyOtpValidation = [
  body('phone').isMobilePhone('id-ID').withMessage('Valid Indonesian phone number is required'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('OTP must be 4-6 digits'),
];

const resetPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

const newPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array(),
      },
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// Routes

/**
 * @route POST /auth/login
 * @desc Login user with email and password
 * @access Public
 */
router.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  loginRateLimiter,
  asyncHandler(authController.login)
);

/**
 * @route POST /auth/register
 * @desc Register new user
 * @access Public
 */
router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  asyncHandler(authController.register)
);

/**
 * @route POST /auth/send-otp
 * @desc Send OTP to phone number
 * @access Public
 */
router.post(
  '/send-otp',
  otpValidation,
  handleValidationErrors,
  otpRateLimiter,
  asyncHandler(authController.sendOTP)
);

/**
 * @route POST /auth/verify-otp
 * @desc Verify OTP and login/register user
 * @access Public
 */
router.post(
  '/verify-otp',
  verifyOtpValidation,
  handleValidationErrors,
  asyncHandler(authController.verifyOTP)
);

/**
 * @route POST /auth/refresh-token
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],
  handleValidationErrors,
  asyncHandler(authController.refreshToken)
);

/**
 * @route POST /auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post(
  '/forgot-password',
  resetPasswordValidation,
  handleValidationErrors,
  asyncHandler(authController.forgotPassword)
);

/**
 * @route POST /auth/reset-password
 * @desc Reset password using reset token
 * @access Public
 */
router.post(
  '/reset-password',
  newPasswordValidation,
  handleValidationErrors,
  asyncHandler(authController.resetPassword)
);

/**
 * @route POST /auth/logout
 * @desc Logout user and invalidate token
 * @access Private
 */
router.post(
  '/logout',
  asyncHandler(authController.logout)
);

/**
 * @route GET /auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get(
  '/me',
  asyncHandler(authController.getProfile)
);

/**
 * @route PUT /auth/me
 * @desc Update current user profile
 * @access Private
 */
router.put(
  '/me',
  [
    body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('phone').optional().isMobilePhone('id-ID').withMessage('Valid Indonesian phone number is required'),
    body('avatar').optional().isURL().withMessage('Valid avatar URL is required'),
  ],
  handleValidationErrors,
  asyncHandler(authController.updateProfile)
);

/**
 * @route PUT /auth/change-password
 * @desc Change user password
 * @access Private
 */
router.put(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  handleValidationErrors,
  asyncHandler(authController.changePassword)
);

/**
 * @route POST /auth/verify-email
 * @desc Verify email address
 * @access Private
 */
router.post(
  '/verify-email',
  [
    body('token').notEmpty().withMessage('Verification token is required'),
  ],
  handleValidationErrors,
  asyncHandler(authController.verifyEmail)
);

/**
 * @route POST /auth/resend-verification
 * @desc Resend email verification
 * @access Private
 */
router.post(
  '/resend-verification',
  asyncHandler(authController.resendVerification)
);

/**
 * @route POST /auth/device-register
 * @desc Register device for push notifications
 * @access Private
 */
router.post(
  '/device-register',
  [
    body('deviceId').notEmpty().withMessage('Device ID is required'),
    body('deviceToken').notEmpty().withMessage('Device token is required'),
    body('platform').isIn(['android', 'ios', 'web']).withMessage('Valid platform is required'),
  ],
  handleValidationErrors,
  asyncHandler(authController.registerDevice)
);

/**
 * @route DELETE /auth/device-unregister
 * @desc Unregister device
 * @access Private
 */
router.delete(
  '/device-unregister',
  [
    body('deviceId').notEmpty().withMessage('Device ID is required'),
  ],
  handleValidationErrors,
  asyncHandler(authController.unregisterDevice)
);

export default router;
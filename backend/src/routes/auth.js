const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');
const logger = require('../utils/logger');
const { sendOTP, verifyOTP } = require('../services/otpService');
const { createAuditLog } = require('../services/auditService');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const loginSchema = Joi.object({
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
  password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('SANTRI', 'WALI_SANTRI').required(),
  name: Joi.string().min(2).required(),
  // Additional fields based on role
  nis: Joi.when('role', {
    is: 'SANTRI',
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  birthPlace: Joi.when('role', {
    is: 'SANTRI',
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  birthDate: Joi.when('role', {
    is: 'SANTRI',
    then: Joi.date().required(),
    otherwise: Joi.forbidden(),
  }),
  gender: Joi.when('role', {
    is: 'SANTRI',
    then: Joi.string().valid('MALE', 'FEMALE').required(),
    otherwise: Joi.forbidden(),
  }),
  address: Joi.string().required(),
  parentName: Joi.when('role', {
    is: 'SANTRI',
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  parentPhone: Joi.when('role', {
    is: 'SANTRI',
    then: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    otherwise: Joi.forbidden(),
  }),
  parentAddress: Joi.when('role', {
    is: 'SANTRI',
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  entryYear: Joi.when('role', {
    is: 'SANTRI',
    then: Joi.number().integer().min(2000).max(new Date().getFullYear()).required(),
    otherwise: Joi.forbidden(),
  }),
  currentClass: Joi.when('role', {
    is: 'SANTRI',
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  relation: Joi.when('role', {
    is: 'WALI_SANTRI',
    then: Joi.string().valid('FATHER', 'MOTHER', 'GUARDIAN').required(),
    otherwise: Joi.forbidden(),
  }),
});

const otpVerificationSchema = Joi.object({
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
  code: Joi.string().length(6).required(),
  type: Joi.string().valid('LOGIN', 'REGISTRATION', 'PASSWORD_RESET').required(),
});

const passwordResetSchema = Joi.object({
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
});

const newPasswordSchema = Joi.object({
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
  code: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required(),
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { phone, password } = value;

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        santri: true,
        waliSantri: true,
        admin: true,
        finance: true,
        superAdmin: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid phone number or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid phone number or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate OTP for login
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await prisma.oTP.create({
      data: {
        phone,
        code: otpCode,
        type: 'LOGIN',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      }
    });

    // Send OTP via SMS
    await sendOTP(phone, otpCode, 'login');

    logger.info(`Login OTP sent to ${phone}`);

    res.json({
      success: true,
      message: 'OTP sent to your phone number',
      data: {
        phone,
        requiresOTP: true,
        userId: user.id,
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'LOGIN_ERROR'
    });
  }
});

// OTP verification endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { error, value } = otpVerificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { phone, code, type } = value;

    // Verify OTP
    const otp = await prisma.oTP.findFirst({
      where: {
        phone,
        code,
        type,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP',
        code: 'INVALID_OTP'
      });
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { isUsed: true }
    });

    if (type === 'LOGIN') {
      // Complete login process
      const user = await prisma.user.findUnique({
        where: { phone },
        include: {
          santri: true,
          waliSantri: true,
          admin: true,
          finance: true,
          superAdmin: true,
        }
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Create session
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token,
          deviceInfo: req.headers['user-agent'],
          ipAddress: req.ip,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      });

      // Update user verification status if not verified
      if (!user.isVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true }
        });
      }

      // Create audit log
      await createAuditLog({
        userId: user.id,
        action: 'LOGIN',
        table: 'users',
        recordId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      logger.info(`User ${user.id} logged in successfully`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
            santri: user.santri,
            waliSantri: user.waliSantri,
            admin: user.admin,
            finance: user.finance,
            superAdmin: user.superAdmin,
          }
        }
      });
    } else if (type === 'REGISTRATION') {
      // Complete registration process
      res.json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          phone,
          verified: true
        }
      });
    }

  } catch (error) {
    logger.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'OTP_VERIFICATION_ERROR'
    });
  }
});

// Registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const {
      email, phone, password, role, name, nis, birthPlace, birthDate,
      gender, address, parentName, parentPhone, parentAddress,
      entryYear, currentClass, relation
    } = value;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or phone already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        role,
      }
    });

    // Create role-specific data
    if (role === 'SANTRI') {
      await prisma.santri.create({
        data: {
          userId: user.id,
          nis,
          name,
          birthPlace,
          birthDate,
          gender,
          address,
          parentName,
          parentPhone,
          parentAddress,
          entryYear,
          currentClass,
        }
      });

      // Create pocket money and savings accounts
      await prisma.pocketMoney.create({
        data: {
          santriId: user.id,
          balance: 0,
        }
      });

      await prisma.savings.create({
        data: {
          santriId: user.id,
          balance: 0,
        }
      });
    } else if (role === 'WALI_SANTRI') {
      await prisma.waliSantri.create({
        data: {
          userId: user.id,
          name,
          phone,
          email,
          address,
          relation,
        }
      });
    }

    // Generate OTP for registration verification
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await prisma.oTP.create({
      data: {
        phone,
        code: otpCode,
        type: 'REGISTRATION',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      }
    });

    // Send OTP via SMS
    await sendOTP(phone, otpCode, 'registration');

    logger.info(`Registration OTP sent to ${phone}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your phone number with the OTP sent.',
      data: {
        userId: user.id,
        phone,
        requiresOTP: true,
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { error, value } = passwordResetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { phone } = value;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await prisma.oTP.create({
      data: {
        phone,
        code: otpCode,
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      }
    });

    // Send OTP via SMS
    await sendOTP(phone, otpCode, 'password_reset');

    logger.info(`Password reset OTP sent to ${phone}`);

    res.json({
      success: true,
      message: 'Password reset OTP sent to your phone number',
      data: {
        phone,
        requiresOTP: true,
      }
    });

  } catch (error) {
    logger.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'PASSWORD_RESET_ERROR'
    });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { error, value } = newPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { phone, code, newPassword } = value;

    // Verify OTP
    const otp = await prisma.oTP.findFirst({
      where: {
        phone,
        code,
        type: 'PASSWORD_RESET',
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP',
        code: 'INVALID_OTP'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { phone },
      data: { password: hashedPassword }
    });

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { isUsed: true }
    });

    // Invalidate all existing sessions
    await prisma.session.deleteMany({
      where: {
        user: {
          phone
        }
      }
    });

    logger.info(`Password reset successful for ${phone}`);

    res.json({
      success: true,
      message: 'Password reset successful',
    });

  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'PASSWORD_RESET_ERROR'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Delete session
      await prisma.session.deleteMany({
        where: { token }
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'LOGOUT_ERROR'
    });
  }
});

module.exports = router;
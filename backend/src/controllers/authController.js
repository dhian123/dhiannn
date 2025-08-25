const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');

const { User } = require('../models');
const { cache, session } = require('../config/redis');
const { catchAsync, AuthenticationError, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { sendSMS, sendEmail } = require('../services/notificationService');
const { generateOTP, verifyOTP } = require('../utils/otpUtils');

// Generate JWT tokens
const generateTokens = (userId, role) => {
  const payload = { userId, role };
  
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
  
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  
  return { accessToken, refreshToken };
};

// Login with username/email/phone and password
const login = catchAsync(async (req, res) => {
  const { identifier, password, deviceId } = req.body;

  // Find user by identifier
  const user = await User.findByIdentifier(identifier);
  if (!user || !(await user.validatePassword(password))) {
    // Log failed login attempt
    logger.security('FAILED_LOGIN_ATTEMPT', {
      identifier,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      deviceId,
    });

    throw new AuthenticationError('Invalid credentials');
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingTime = Math.ceil((user.lockedUntil - new Date()) / 1000 / 60);
    throw new AuthenticationError(`Account is locked. Try again in ${remainingTime} minutes.`);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  // Create session
  const sessionId = require('uuid').v4();
  await session.create(sessionId, user.id, {
    deviceId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    loginMethod: 'PASSWORD',
  });

  // Update user login info
  await user.updateLastLogin();
  user.loginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  // Cache user data
  await cache.set(`user:${user.id}`, user.toJSON(), 3600);

  // Log successful login
  logger.auth('USER_LOGIN', {
    userId: user.id,
    username: user.username,
    role: user.role,
    ip: req.ip,
    deviceId,
  });

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken,
      sessionId,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    },
  });
});

// Send OTP for authentication
const sendOTP = catchAsync(async (req, res) => {
  const { identifier } = req.body;

  // Find user by identifier
  const user = await User.findByIdentifier(identifier);
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated');
  }

  // Generate OTP
  const otp = generateOTP();
  const otpKey = `otp:${identifier}`;
  
  // Store OTP in cache with expiry
  await cache.setWithExpiry(otpKey, {
    code: otp,
    userId: user.id,
    attempts: 0,
    createdAt: new Date(),
  }, 300); // 5 minutes

  // Determine if identifier is phone or email
  const isPhone = /^(\+62|62|0)[0-9]{9,13}$/.test(identifier);
  
  try {
    if (isPhone) {
      await sendSMS(identifier, `Your SiNusa OTP code is: ${otp}. Valid for 5 minutes.`);
    } else {
      await sendEmail(identifier, 'SiNusa OTP Code', `Your OTP code is: ${otp}. Valid for 5 minutes.`);
    }

    logger.auth('OTP_SENT', {
      userId: user.id,
      identifier,
      method: isPhone ? 'SMS' : 'EMAIL',
      ip: req.ip,
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `OTP sent to your ${isPhone ? 'phone' : 'email'}`,
      data: {
        expiresIn: 300, // 5 minutes
      },
    });
  } catch (error) {
    logger.error('Failed to send OTP:', error);
    throw new Error('Failed to send OTP. Please try again.');
  }
});

// Verify OTP and login
const verifyOTP = catchAsync(async (req, res) => {
  const { identifier, otp, deviceId } = req.body;

  const otpKey = `otp:${identifier}`;
  const otpData = await cache.get(otpKey);

  if (!otpData) {
    throw new AuthenticationError('OTP has expired or is invalid');
  }

  // Check attempts
  if (otpData.attempts >= 3) {
    await cache.del(otpKey);
    throw new AuthenticationError('Too many OTP attempts. Please request a new OTP.');
  }

  // Verify OTP
  if (otpData.code !== otp) {
    otpData.attempts += 1;
    await cache.set(otpKey, otpData, 300);
    
    logger.security('INVALID_OTP_ATTEMPT', {
      userId: otpData.userId,
      identifier,
      attempts: otpData.attempts,
      ip: req.ip,
    });

    throw new AuthenticationError('Invalid OTP code');
  }

  // Get user
  const user = await User.findByPk(otpData.userId);
  if (!user || !user.isActive) {
    throw new AuthenticationError('User not found or deactivated');
  }

  // Clear OTP
  await cache.del(otpKey);

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  // Create session
  const sessionId = require('uuid').v4();
  await session.create(sessionId, user.id, {
    deviceId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    loginMethod: 'OTP',
  });

  // Update user login info
  await user.updateLastLogin();

  // Cache user data
  await cache.set(`user:${user.id}`, user.toJSON(), 3600);

  // Log successful OTP login
  logger.auth('OTP_LOGIN', {
    userId: user.id,
    username: user.username,
    role: user.role,
    ip: req.ip,
    deviceId,
  });

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'OTP verification successful',
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken,
      sessionId,
      expiresIn: 24 * 60 * 60,
    },
  });
});

// Refresh access token
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AuthenticationError('Refresh token is required');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or deactivated');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);

    // Update cache
    await cache.set(`user:${user.id}`, user.toJSON(), 3600);

    logger.auth('TOKEN_REFRESHED', {
      userId: user.id,
      ip: req.ip,
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 24 * 60 * 60,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
    throw error;
  }
});

// Logout
const logout = catchAsync(async (req, res) => {
  const token = req.token;
  const user = req.user;

  if (token) {
    // Blacklist the token
    const decoded = jwt.decode(token);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    await cache.setWithExpiry(`blacklist:${token}`, true, expiresIn);
  }

  // Clear user cache
  if (user) {
    await cache.del(`user:${user.id}`);
    
    logger.auth('USER_LOGOUT', {
      userId: user.id,
      username: user.username,
      ip: req.ip,
    });
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Logout successful',
  });
});

// Forgot password
const forgotPassword = catchAsync(async (req, res) => {
  const { identifier } = req.body;

  const user = await User.findByIdentifier(identifier);
  if (!user) {
    // Don't reveal if user exists or not
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'If the account exists, password reset instructions have been sent.',
    });
  }

  // Generate reset token
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  user.passwordResetToken = resetToken;
  user.passwordResetExpires = resetTokenExpiry;
  await user.save();

  // Send reset email/SMS
  const isPhone = /^(\+62|62|0)[0-9]{9,13}$/.test(identifier);
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  try {
    if (isPhone) {
      await sendSMS(identifier, `Reset your SiNusa password: ${resetUrl}`);
    } else {
      await sendEmail(identifier, 'Password Reset', `Reset your password: ${resetUrl}`);
    }

    logger.security('PASSWORD_RESET_REQUESTED', {
      userId: user.id,
      identifier,
      ip: req.ip,
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Password reset instructions have been sent.',
    });
  } catch (error) {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    logger.error('Failed to send password reset:', error);
    throw new Error('Failed to send password reset instructions.');
  }
});

// Reset password
const resetPassword = catchAsync(async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    throw new ValidationError('Passwords do not match');
  }

  const user = await User.findOne({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  // Update password
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  logger.security('PASSWORD_RESET_COMPLETED', {
    userId: user.id,
    ip: req.ip,
  });

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Password has been reset successfully',
  });
});

// Change password
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const user = req.user;

  if (newPassword !== confirmPassword) {
    throw new ValidationError('New passwords do not match');
  }

  // Verify current password
  const fullUser = await User.findByPk(user.id);
  if (!(await fullUser.validatePassword(currentPassword))) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Update password
  fullUser.password = newPassword;
  await fullUser.save();

  logger.security('PASSWORD_CHANGED', {
    userId: user.id,
    ip: req.ip,
  });

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Password changed successfully',
  });
});

// Verify token
const verifyToken = catchAsync(async (req, res) => {
  const user = req.user;

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Token is valid',
    data: {
      user: user,
      isValid: true,
    },
  });
});

module.exports = {
  login,
  sendOTP,
  verifyOTP,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyToken,
};
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { config } from '@/config';
import { createError } from '@/middleware/errorHandler';
import { generateToken, generateRefreshToken, blacklistToken, getPermissionsByRole, UserRole } from '@/middleware/auth';
import { CacheService } from '@/config/redis';
import { logger } from '@/utils/logger';
import { EmailService } from '@/services/email';
import { SMSService } from '@/services/sms';
import { UserModel } from '@/models/user';
import { AuthenticatedRequest } from '@/middleware/auth';

export class AuthController {
  private emailService: EmailService;
  private smsService: SMSService;

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
  }

  /**
   * Login user with email and password
   */
  public async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      // Find user by email
      const user = await UserModel.query()
        .where('email', email)
        .where('is_active', true)
        .first();

      if (!user) {
        throw createError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw createError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
      }

      // Check if email is verified (for non-admin users)
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN && !user.email_verified) {
        throw createError.unauthorized('Please verify your email first', 'EMAIL_NOT_VERIFIED');
      }

      // Generate tokens
      const permissions = getPermissionsByRole(user.role as UserRole);
      const accessToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role as UserRole,
        permissions,
      });

      const refreshToken = generateRefreshToken(user.id);

      // Store session in Redis
      const session = {
        token: accessToken,
        refreshToken,
        lastActivity: Date.now(),
        deviceInfo: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        },
      };

      await CacheService.setSession(user.id, session);

      // Update last login
      await UserModel.query()
        .where('id', user.id)
        .patch({
          last_login: new Date(),
          login_count: user.login_count + 1,
        });

      // Log successful login
      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions,
            avatar: user.avatar,
            email_verified: user.email_verified,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: config.jwt.expiresIn,
          },
        },
        message: 'Login successful',
      });
    } catch (error) {
      logger.error('Login failed', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });
      throw error;
    }
  }

  /**
   * Register new user
   */
  public async register(req: Request, res: Response): Promise<void> {
    const { email, password, name, phone, role } = req.body;

    try {
      // Check if user already exists
      const existingUser = await UserModel.query()
        .where('email', email)
        .orWhere('phone', phone)
        .first();

      if (existingUser) {
        throw createError.conflict('User with this email or phone already exists', 'USER_EXISTS');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const user = await UserModel.query().insert({
        id: uuidv4(),
        email,
        password: hashedPassword,
        name,
        phone,
        role,
        email_verification_token: emailVerificationToken,
        is_active: true,
        email_verified: role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN, // Auto-verify admin users
      });

      // Send verification email (if not admin)
      if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
        await this.emailService.sendVerificationEmail(email, name, emailVerificationToken);
      }

      // Log registration
      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip,
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            email_verified: user.email_verified,
          },
        },
        message: role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN 
          ? 'Admin user created successfully' 
          : 'Registration successful. Please check your email to verify your account.',
      });
    } catch (error) {
      logger.error('Registration failed', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });
      throw error;
    }
  }

  /**
   * Send OTP to phone number
   */
  public async sendOTP(req: Request, res: Response): Promise<void> {
    const { phone } = req.body;

    try {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

      // Store OTP in Redis
      await CacheService.setOTP(phone, otp);

      // Send SMS
      await this.smsService.sendOTP(phone, otp);

      // Log OTP sent
      logger.info('OTP sent successfully', {
        phone,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          phone,
          expiresIn: config.otp.expiresIn / 1000, // Convert to seconds
        },
      });
    } catch (error) {
      logger.error('OTP sending failed', {
        phone,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });
      throw error;
    }
  }

  /**
   * Verify OTP and login/register user
   */
  public async verifyOTP(req: Request, res: Response): Promise<void> {
    const { phone, otp } = req.body;

    try {
      // Get stored OTP
      const storedOTP = await CacheService.getOTP(phone);
      
      if (!storedOTP || storedOTP !== otp) {
        throw createError.badRequest('Invalid OTP', 'INVALID_OTP');
      }

      // Find or create user
      let user = await UserModel.query()
        .where('phone', phone)
        .where('is_active', true)
        .first();

      if (!user) {
        // Create new user with phone number
        user = await UserModel.query().insert({
          id: uuidv4(),
          phone,
          name: `User ${phone.slice(-4)}`, // Temporary name
          role: UserRole.SANTRI, // Default role
          is_active: true,
          phone_verified: true,
        });
      } else {
        // Mark phone as verified
        await UserModel.query()
          .where('id', user.id)
          .patch({ phone_verified: true });
      }

      // Delete OTP
      await CacheService.deleteOTP(phone);

      // Generate tokens
      const permissions = getPermissionsByRole(user.role as UserRole);
      const accessToken = generateToken({
        userId: user.id,
        email: user.email || '',
        role: user.role as UserRole,
        permissions,
      });

      const refreshToken = generateRefreshToken(user.id);

      // Store session
      const session = {
        token: accessToken,
        refreshToken,
        lastActivity: Date.now(),
        deviceInfo: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        },
      };

      await CacheService.setSession(user.id, session);

      // Log OTP verification
      logger.info('OTP verified successfully', {
        userId: user.id,
        phone,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions,
            phone_verified: true,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: config.jwt.expiresIn,
          },
        },
        message: 'OTP verified successfully',
      });
    } catch (error) {
      logger.error('OTP verification failed', {
        phone,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, config.jwt.secret) as any;
      
      if (!payload.userId) {
        throw createError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      }

      // Get user
      const user = await UserModel.query()
        .where('id', payload.userId)
        .where('is_active', true)
        .first();

      if (!user) {
        throw createError.unauthorized('User not found', 'USER_NOT_FOUND');
      }

      // Generate new tokens
      const permissions = getPermissionsByRole(user.role as UserRole);
      const newAccessToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role as UserRole,
        permissions,
      });

      const newRefreshToken = generateRefreshToken(user.id);

      // Update session
      const session = {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        lastActivity: Date.now(),
        deviceInfo: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        },
      };

      await CacheService.setSession(user.id, session);

      // Blacklist old refresh token
      await blacklistToken(refreshToken);

      res.status(200).json({
        success: true,
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: config.jwt.expiresIn,
          },
        },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });
      throw error;
    }
  }

  /**
   * Forgot password
   */
  public async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    try {
      // Find user
      const user = await UserModel.query()
        .where('email', email)
        .where('is_active', true)
        .first();

      if (!user) {
        // Don't reveal if user exists
        res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        });
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token
      await UserModel.query()
        .where('id', user.id)
        .patch({
          password_reset_token: resetToken,
          password_reset_expires: resetTokenExpiry,
        });

      // Send reset email
      await this.emailService.sendPasswordResetEmail(email, user.name, resetToken);

      // Log password reset request
      logger.info('Password reset requested', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      logger.error('Password reset request failed', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });
      throw error;
    }
  }

  /**
   * Reset password
   */
  public async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;

    try {
      // Find user with valid reset token
      const user = await UserModel.query()
        .where('password_reset_token', token)
        .where('password_reset_expires', '>', new Date())
        .where('is_active', true)
        .first();

      if (!user) {
        throw createError.badRequest('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

      // Update password and clear reset token
      await UserModel.query()
        .where('id', user.id)
        .patch({
          password: hashedPassword,
          password_reset_token: null,
          password_reset_expires: null,
        });

      // Blacklist all user sessions
      await CacheService.deleteSession(user.id);

      // Log password reset
      logger.info('Password reset successfully', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Password reset successfully. Please login with your new password.',
      });
    } catch (error) {
      logger.error('Password reset failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });
      throw error;
    }
  }

  /**
   * Logout user
   */
  public async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        // Blacklist token
        await blacklistToken(token);
      }

      // Clear session
      if (req.user?.id) {
        await CacheService.deleteSession(req.user.id);
      }

      // Log logout
      logger.info('User logged out', {
        userId: req.user?.id,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error('Logout failed', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  public async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await UserModel.query()
        .where('id', req.user!.id)
        .where('is_active', true)
        .first();

      if (!user) {
        throw createError.notFound('User not found', 'USER_NOT_FOUND');
      }

      const permissions = getPermissionsByRole(user.role as UserRole);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            permissions,
            avatar: user.avatar,
            email_verified: user.email_verified,
            phone_verified: user.phone_verified,
            created_at: user.created_at,
            updated_at: user.updated_at,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update current user profile
   */
  public async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, phone, avatar } = req.body;

    try {
      const updateData: any = {};
      
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (avatar) updateData.avatar = avatar;

      // Check if phone is already taken by another user
      if (phone) {
        const existingUser = await UserModel.query()
          .where('phone', phone)
          .whereNot('id', req.user!.id)
          .first();

        if (existingUser) {
          throw createError.conflict('Phone number already in use', 'PHONE_EXISTS');
        }
      }

      // Update user
      const user = await UserModel.query()
        .where('id', req.user!.id)
        .patch(updateData)
        .returning('*')
        .first();

      const permissions = getPermissionsByRole(user.role as UserRole);

      // Log profile update
      logger.info('Profile updated', {
        userId: req.user!.id,
        updates: updateData,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            permissions,
            avatar: user.avatar,
            email_verified: user.email_verified,
            phone_verified: user.phone_verified,
            updated_at: user.updated_at,
          },
        },
        message: 'Profile updated successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change password
   */
  public async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;

    try {
      // Get user with password
      const user = await UserModel.query()
        .where('id', req.user!.id)
        .where('is_active', true)
        .first();

      if (!user) {
        throw createError.notFound('User not found', 'USER_NOT_FOUND');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw createError.badRequest('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

      // Update password
      await UserModel.query()
        .where('id', req.user!.id)
        .patch({ password: hashedNewPassword });

      // Blacklist all user sessions
      await CacheService.deleteSession(req.user!.id);

      // Log password change
      logger.info('Password changed', {
        userId: req.user!.id,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify email
   */
  public async verifyEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { token } = req.body;

    try {
      // Find user with verification token
      const user = await UserModel.query()
        .where('id', req.user!.id)
        .where('email_verification_token', token)
        .where('is_active', true)
        .first();

      if (!user) {
        throw createError.badRequest('Invalid verification token', 'INVALID_VERIFICATION_TOKEN');
      }

      // Mark email as verified
      await UserModel.query()
        .where('id', req.user!.id)
        .patch({
          email_verified: true,
          email_verification_token: null,
        });

      // Log email verification
      logger.info('Email verified', {
        userId: req.user!.id,
        email: user.email,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  public async resendVerification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await UserModel.query()
        .where('id', req.user!.id)
        .where('is_active', true)
        .first();

      if (!user) {
        throw createError.notFound('User not found', 'USER_NOT_FOUND');
      }

      if (user.email_verified) {
        throw createError.badRequest('Email is already verified', 'EMAIL_ALREADY_VERIFIED');
      }

      // Generate new verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      // Update verification token
      await UserModel.query()
        .where('id', req.user!.id)
        .patch({ email_verification_token });

      // Send verification email
      await this.emailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);

      // Log verification email resend
      logger.info('Verification email resent', {
        userId: req.user!.id,
        email: user.email,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Register device for push notifications
   */
  public async registerDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { deviceId, deviceToken, platform } = req.body;

    try {
      // Store device info in Redis
      const deviceKey = `device:${req.user!.id}:${deviceId}`;
      const deviceInfo = {
        deviceId,
        deviceToken,
        platform,
        userId: req.user!.id,
        registeredAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      };

      await CacheService.set(deviceKey, JSON.stringify(deviceInfo), 86400 * 30); // 30 days

      // Log device registration
      logger.info('Device registered', {
        userId: req.user!.id,
        deviceId,
        platform,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Device registered successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unregister device
   */
  public async unregisterDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { deviceId } = req.body;

    try {
      // Remove device from Redis
      const deviceKey = `device:${req.user!.id}:${deviceId}`;
      await CacheService.del(deviceKey);

      // Log device unregistration
      logger.info('Device unregistered', {
        userId: req.user!.id,
        deviceId,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Device unregistered successfully',
      });
    } catch (error) {
      throw error;
    }
  }
}
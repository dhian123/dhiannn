const twilio = require('twilio');
const logger = require('../utils/logger');

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send OTP via SMS
 * @param {string} phone - Phone number
 * @param {string} code - OTP code
 * @param {string} type - OTP type (login, registration, password_reset)
 */
const sendOTP = async (phone, code, type) => {
  try {
    let message = '';
    
    switch (type) {
      case 'login':
        message = `SiNusa: Your login verification code is ${code}. Valid for 5 minutes. Do not share this code with anyone.`;
        break;
      case 'registration':
        message = `SiNusa: Your registration verification code is ${code}. Valid for 10 minutes. Do not share this code with anyone.`;
        break;
      case 'password_reset':
        message = `SiNusa: Your password reset code is ${code}. Valid for 10 minutes. Do not share this code with anyone.`;
        break;
      case 'payment_verification':
        message = `SiNusa: Your payment verification code is ${code}. Valid for 5 minutes. Do not share this code with anyone.`;
        break;
      default:
        message = `SiNusa: Your verification code is ${code}. Do not share this code with anyone.`;
    }

    // Send SMS via Twilio
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    logger.info(`OTP sent successfully to ${phone}, SID: ${result.sid}`);
    return { success: true, sid: result.sid };

  } catch (error) {
    logger.error(`Failed to send OTP to ${phone}:`, error);
    
    // In development, log the OTP instead of sending SMS
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[DEV] OTP for ${phone}: ${code}`);
      return { success: true, dev: true };
    }
    
    throw new Error('Failed to send OTP');
  }
};

/**
 * Verify OTP code
 * @param {string} phone - Phone number
 * @param {string} code - OTP code to verify
 * @param {string} type - OTP type
 */
const verifyOTP = async (phone, code, type) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

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
      return { valid: false, message: 'Invalid or expired OTP' };
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { isUsed: true }
    });

    logger.info(`OTP verified successfully for ${phone}`);
    return { valid: true, message: 'OTP verified successfully' };

  } catch (error) {
    logger.error(`OTP verification error for ${phone}:`, error);
    throw new Error('OTP verification failed');
  }
};

/**
 * Generate OTP code
 * @returns {string} 6-digit OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Clean expired OTPs
 */
const cleanExpiredOTPs = async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const result = await prisma.oTP.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    if (result.count > 0) {
      logger.info(`Cleaned ${result.count} expired OTPs`);
    }

  } catch (error) {
    logger.error('Error cleaning expired OTPs:', error);
  }
};

// Clean expired OTPs every hour
setInterval(cleanExpiredOTPs, 60 * 60 * 1000);

module.exports = {
  sendOTP,
  verifyOTP,
  generateOTP,
  cleanExpiredOTPs,
};
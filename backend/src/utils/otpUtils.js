const crypto = require('crypto');

// Generate a random OTP
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

// Generate a secure OTP using crypto
const generateSecureOTP = (length = 6) => {
  const max = Math.pow(10, length) - 1;
  const min = Math.pow(10, length - 1);
  
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  const otp = (randomNumber % (max - min + 1)) + min;
  
  return otp.toString().padStart(length, '0');
};

// Verify OTP (basic implementation)
const verifyOTP = (inputOTP, storedOTP, expiryTime) => {
  // Check if OTP has expired
  if (new Date() > new Date(expiryTime)) {
    return { isValid: false, error: 'OTP has expired' };
  }
  
  // Check if OTP matches
  if (inputOTP !== storedOTP) {
    return { isValid: false, error: 'Invalid OTP' };
  }
  
  return { isValid: true };
};

// Generate OTP with expiry
const generateOTPWithExpiry = (length = 6, expiryMinutes = 5) => {
  const otp = generateSecureOTP(length);
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);
  
  return {
    otp,
    expiryTime,
  };
};

// Hash OTP for storage (optional security measure)
const hashOTP = (otp, secret = process.env.OTP_SECRET) => {
  return crypto
    .createHmac('sha256', secret)
    .update(otp)
    .digest('hex');
};

// Verify hashed OTP
const verifyHashedOTP = (inputOTP, hashedOTP, secret = process.env.OTP_SECRET) => {
  const inputHash = hashOTP(inputOTP, secret);
  return inputHash === hashedOTP;
};

// Generate numeric OTP for SMS
const generateNumericOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

// Generate alphanumeric OTP
const generateAlphanumericOTP = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return otp;
};

// Calculate remaining time for OTP
const getOTPRemainingTime = (expiryTime) => {
  const now = new Date();
  const expiry = new Date(expiryTime);
  const remainingMs = expiry - now;
  
  if (remainingMs <= 0) {
    return 0;
  }
  
  return Math.ceil(remainingMs / 1000); // Return in seconds
};

// Format OTP for display (e.g., "123 456" instead of "123456")
const formatOTP = (otp, separator = ' ', groupSize = 3) => {
  return otp.replace(new RegExp(`(.{${groupSize}})`, 'g'), `$1${separator}`).trim();
};

module.exports = {
  generateOTP,
  generateSecureOTP,
  verifyOTP,
  generateOTPWithExpiry,
  hashOTP,
  verifyHashedOTP,
  generateNumericOTP,
  generateAlphanumericOTP,
  getOTPRemainingTime,
  formatOTP,
};
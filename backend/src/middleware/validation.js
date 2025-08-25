const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const { ValidationError } = require('./errorHandler');
const logger = require('../utils/logger');

// Middleware to handle validation results
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    // Log validation errors
    logger.validation('REQUEST_VALIDATION_FAILED', {
      url: req.originalUrl,
      method: req.method,
      errors: errorDetails,
      userId: req.user?.id,
      ip: req.ip,
    });

    throw new ValidationError('Validation failed', errorDetails);
  }

  next();
};

// Custom validation helpers
const customValidators = {
  // Indonesian phone number validation
  isIndonesianPhone: (value) => {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    return phoneRegex.test(value);
  },

  // Indonesian ID number (NIK) validation
  isNIK: (value) => {
    const nikRegex = /^[0-9]{16}$/;
    return nikRegex.test(value);
  },

  // Strong password validation
  isStrongPassword: (value) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(value);
  },

  // Valid amount (positive number with max 2 decimals)
  isValidAmount: (value) => {
    const amount = parseFloat(value);
    return !isNaN(amount) && amount > 0 && /^\d+(\.\d{1,2})?$/.test(value.toString());
  },

  // Valid date range
  isDateInRange: (value, { req }) => {
    const date = new Date(value);
    const minDate = req.body.minDate ? new Date(req.body.minDate) : new Date('1900-01-01');
    const maxDate = req.body.maxDate ? new Date(req.body.maxDate) : new Date();
    
    return date >= minDate && date <= maxDate;
  },

  // Valid file type
  isValidFileType: (allowedTypes) => {
    return (value, { req }) => {
      if (!req.file) return true; // Skip if no file
      
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
      return allowedTypes.includes(fileExtension);
    };
  },

  // Valid file size
  isValidFileSize: (maxSizeInBytes) => {
    return (value, { req }) => {
      if (!req.file) return true; // Skip if no file
      return req.file.size <= maxSizeInBytes;
    };
  },

  // Valid enum value
  isInEnum: (enumValues) => {
    return (value) => {
      return enumValues.includes(value);
    };
  },

  // Valid UUID
  isUUID: (value) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  // Valid coordinates
  isLatitude: (value) => {
    const lat = parseFloat(value);
    return !isNaN(lat) && lat >= -90 && lat <= 90;
  },

  isLongitude: (value) => {
    const lng = parseFloat(value);
    return !isNaN(lng) && lng >= -180 && lng <= 180;
  },

  // Valid time format (HH:MM)
  isTimeFormat: (value) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(value);
  },

  // Valid academic year format (YYYY/YYYY)
  isAcademicYear: (value) => {
    const academicYearRegex = /^\d{4}\/\d{4}$/;
    if (!academicYearRegex.test(value)) return false;
    
    const [startYear, endYear] = value.split('/').map(Number);
    return endYear === startYear + 1;
  },

  // Valid semester (1 or 2)
  isSemester: (value) => {
    return ['1', '2'].includes(value.toString());
  },

  // Valid grade/score (0-100)
  isValidGrade: (value) => {
    const grade = parseFloat(value);
    return !isNaN(grade) && grade >= 0 && grade <= 100;
  },

  // Valid bank account number
  isBankAccount: (value) => {
    // Basic validation for Indonesian bank accounts (10-16 digits)
    const bankAccountRegex = /^[0-9]{10,16}$/;
    return bankAccountRegex.test(value);
  },

  // Valid postal code (Indonesian format)
  isPostalCode: (value) => {
    const postalCodeRegex = /^[0-9]{5}$/;
    return postalCodeRegex.test(value);
  },
};

// Sanitization helpers
const sanitizers = {
  // Sanitize Indonesian phone number
  sanitizePhone: (value) => {
    if (!value) return value;
    
    // Remove all non-digit characters except +
    let phone = value.replace(/[^\d+]/g, '');
    
    // Convert to standard format
    if (phone.startsWith('0')) {
      phone = '+62' + phone.substring(1);
    } else if (phone.startsWith('62')) {
      phone = '+' + phone;
    } else if (!phone.startsWith('+62')) {
      phone = '+62' + phone;
    }
    
    return phone;
  },

  // Sanitize amount (remove currency symbols, etc.)
  sanitizeAmount: (value) => {
    if (!value) return value;
    
    // Remove currency symbols and spaces
    return value.toString().replace(/[^\d.]/g, '');
  },

  // Sanitize string (trim and remove extra spaces)
  sanitizeString: (value) => {
    if (!value) return value;
    
    return value.toString().trim().replace(/\s+/g, ' ');
  },

  // Sanitize HTML (basic)
  sanitizeHTML: (value) => {
    if (!value) return value;
    
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  // Normalize email
  normalizeEmail: (value) => {
    if (!value) return value;
    
    return value.toLowerCase().trim();
  },
};

// Common validation chains
const commonValidations = {
  // Pagination validation
  pagination: () => {
    const { query } = require('express-validator');
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),
      query('sortBy')
        .optional()
        .isString()
        .withMessage('Sort by must be a string'),
      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
    ];
  },

  // Date range validation
  dateRange: () => {
    const { query } = require('express-validator');
    return [
      query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO8601 date')
        .toDate(),
      query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO8601 date')
        .toDate()
        .custom((value, { req }) => {
          if (req.query.startDate && value < new Date(req.query.startDate)) {
            throw new Error('End date must be after start date');
          }
          return true;
        }),
    ];
  },

  // Search validation
  search: () => {
    const { query } = require('express-validator');
    return [
      query('q')
        .optional()
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters')
        .trim(),
    ];
  },

  // ID parameter validation
  idParam: (paramName = 'id') => {
    const { param } = require('express-validator');
    return param(paramName)
      .isUUID()
      .withMessage(`${paramName} must be a valid UUID`);
  },
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  const formatted = {};
  
  errors.forEach(error => {
    const field = error.path || error.param;
    if (!formatted[field]) {
      formatted[field] = [];
    }
    formatted[field].push(error.msg);
  });
  
  return formatted;
};

module.exports = {
  validateRequest,
  customValidators,
  sanitizers,
  commonValidations,
  formatValidationErrors,
};
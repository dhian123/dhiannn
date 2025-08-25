const { StatusCodes } = require('http-status-codes');
const { User, Santri } = require('../models');
const { catchAsync, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');

// Get user profile
const getProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Santri,
        as: 'santriProfile',
      },
    ],
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      user: user.toJSON(),
    },
  });
});

// Update user profile
const updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const updateData = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Update user data
  await user.update(updateData);

  // Clear cache
  await cache.del(`user:${userId}`);

  logger.userActivity(userId, 'PROFILE_UPDATED', {
    updatedFields: Object.keys(updateData),
  });

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: user.toJSON(),
    },
  });
});

// Get all users (Admin only)
const getAllUsers = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    role,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  // Apply filters
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { username: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
    include: [
      {
        model: Santri,
        as: 'santriProfile',
        required: false,
      },
    ],
  });

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      users: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    },
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
};
const { StatusCodes } = require('http-status-codes');
const { Santri, Transaction, Bill, Attendance, Grade } = require('../models');
const { catchAsync, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Get santri data
const getSantriData = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const santri = await Santri.findOne({
    where: { userId },
    include: [
      { model: User, as: 'user' },
    ],
  });

  if (!santri) {
    throw new NotFoundError('Santri profile not found');
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      santri,
    },
  });
});

// Get pocket money balance
const getBalance = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const santri = await Santri.findOne({ where: { userId } });
  if (!santri) {
    throw new NotFoundError('Santri profile not found');
  }

  const balance = await santri.getCurrentBalance();
  
  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      balance: parseFloat(balance),
      currency: 'IDR',
    },
  });
});

// Get santri savings
const getSavings = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const santri = await Santri.findOne({ where: { userId } });
  if (!santri) {
    throw new NotFoundError('Santri profile not found');
  }

  const savings = await santri.getCurrentSavings();
  
  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      savings: parseFloat(savings),
      currency: 'IDR',
    },
  });
});

module.exports = {
  getSantriData,
  getBalance,
  getSavings,
};
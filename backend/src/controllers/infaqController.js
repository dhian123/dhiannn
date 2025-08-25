const { StatusCodes } = require('http-status-codes');
const { catchAsync } = require('../middleware/errorHandler');

// Create infaq donation
const createInfaq = catchAsync(async (req, res) => {
  // TODO: Implement create infaq functionality
  res.status(StatusCodes.CREATED).json({
    status: 'success',
    message: 'Create infaq endpoint - coming soon',
    data: {
      infaq: req.body,
    },
  });
});

// Get infaq history
const getInfaqHistory = catchAsync(async (req, res) => {
  // TODO: Implement infaq history functionality
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Infaq history endpoint - coming soon',
    data: {
      infaqHistory: [],
    },
  });
});

module.exports = {
  createInfaq,
  getInfaqHistory,
};
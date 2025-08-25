const { StatusCodes } = require('http-status-codes');
const { catchAsync } = require('../middleware/errorHandler');

// Get announcements
const getAnnouncements = catchAsync(async (req, res) => {
  // TODO: Implement announcements functionality
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Announcements endpoint - coming soon',
    data: {
      announcements: [],
    },
  });
});

// Get announcement by ID
const getAnnouncementById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // TODO: Implement get announcement by ID functionality
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Get announcement by ID endpoint - coming soon',
    data: {
      announcement: { id },
    },
  });
});

module.exports = {
  getAnnouncements,
  getAnnouncementById,
};
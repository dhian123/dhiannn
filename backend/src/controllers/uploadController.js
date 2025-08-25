const { StatusCodes } = require('http-status-codes');
const { catchAsync } = require('../middleware/errorHandler');

// Upload image file
const uploadImage = catchAsync(async (req, res) => {
  // TODO: Implement image upload functionality
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Image upload endpoint - coming soon',
    data: {
      file: req.file || null,
    },
  });
});

// Upload document file
const uploadDocument = catchAsync(async (req, res) => {
  // TODO: Implement document upload functionality
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Document upload endpoint - coming soon',
    data: {
      file: req.file || null,
    },
  });
});

module.exports = {
  uploadImage,
  uploadDocument,
};
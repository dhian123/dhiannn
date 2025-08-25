const { StatusCodes } = require('http-status-codes');
const { catchAsync } = require('../middleware/errorHandler');

// Get library books
const getBooks = catchAsync(async (req, res) => {
  // TODO: Implement library books functionality
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Library books endpoint - coming soon',
    data: {
      books: [],
    },
  });
});

// Get borrowed books
const getBorrowedBooks = catchAsync(async (req, res) => {
  // TODO: Implement borrowed books functionality
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Borrowed books endpoint - coming soon',
    data: {
      borrowedBooks: [],
    },
  });
});

module.exports = {
  getBooks,
  getBorrowedBooks,
};
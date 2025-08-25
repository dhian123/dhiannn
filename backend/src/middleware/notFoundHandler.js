const { StatusCodes } = require('http-status-codes');
const { AppError } = require('./errorHandler');

const notFoundHandler = (req, res, next) => {
  const message = `Can't find ${req.originalUrl} on this server!`;
  next(new AppError(message, StatusCodes.NOT_FOUND));
};

module.exports = notFoundHandler;
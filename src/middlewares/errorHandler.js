'use strict';

const { ERROR_CODES } = require('../constants');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Handles requests to undefined routes
const notFound = (req, res, next) => {
  next(new AppError(404, ERROR_CODES.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Central error handler for all Express errors
const errorHandler = (err, req, res, _next) => {
  logger.error(err.stack || err.message);

  // AppError — operational, trusted
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || ERROR_CODES.INTERNAL_ERROR,
        message: err.message,
        details: Array.isArray(err.details) ? err.details : (err.details ? [err.details] : []),
      },
    });
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
    });
  }

  // Multer errors (PRD: 400 FILE_TOO_LARGE, TOO_MANY_FILES, INVALID_FILE_TYPE)
  if (err.name === 'MulterError') {
    let statusCode = 400;
    let code = ERROR_CODES.VALIDATION_ERROR;
    let message = err.message;

    if (err.code === 'LIMIT_FILE_SIZE') {
      code = ERROR_CODES.FILE_TOO_LARGE;
      message = 'File size exceeds the allowed limit';
      statusCode = 400;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      code = ERROR_CODES.TOO_MANY_FILES;
      message = 'Too many files uploaded';
      statusCode = 400;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      code = ERROR_CODES.TOO_MANY_FILES;
      message = 'Unexpected or too many file fields';
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        details: [],
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Invalid token',
        details: [],
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Token has expired',
        details: [],
      },
    });
  }

  // Prisma known request errors
  if (err.code === 'P2002') {
    const target = err.meta?.target || [];
    return res.status(409).json({
      success: false,
      error: {
        code: ERROR_CODES.EMAIL_ALREADY_REGISTERED,
        message: `Unique constraint failed on: ${Array.isArray(target) ? target.join(', ') : target}`,
        details: [],
      },
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Record not found',
        details: [],
      },
    });
  }

  // Fallback — unknown / programming error
  return res.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      details: [],
    },
  });
};

module.exports = { notFound, errorHandler };

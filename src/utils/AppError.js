'use strict';

// Custom application error supporting both (status, code, message, details) per PRD and (message, status, code, details)
class AppError extends Error {
  constructor(arg1, arg2, arg3, arg4 = null) {
    let statusCode;
    let code;
    let message;
    let details;

    if (typeof arg1 === 'number') {
      // PRD specification: AppError(status, code, message, details)
      statusCode = arg1;
      code = arg2;
      message = arg3;
      details = arg4;
    } else {
      // Alternative signature: AppError(message, status, code, details)
      message = arg1;
      statusCode = arg2;
      code = arg3;
      details = arg4;
    }

    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

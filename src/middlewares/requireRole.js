// Role-based access control middleware factory
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../constants');

// Returns middleware that restricts access to the specified roles
const requireRole = (...roles) => {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'You do not have permission to access this resource');
    }
    next();
  };
};

module.exports = requireRole;

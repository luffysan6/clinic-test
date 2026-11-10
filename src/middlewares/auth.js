// Authentication middleware — verifies JWT and loads user
const { verifyToken } = require('../utils/token');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../constants');

// Authenticates requests via Bearer token and attaches user to req
const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Authentication required');
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, role: true, isVerified: true },
    });

    if (!user || !user.isVerified) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Authentication required');
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    // JWT errors (TokenExpiredError, JsonWebTokenError, etc.) propagate to errorHandler
    return next(err);
  }
};

module.exports = authenticate;

// Rate limiting middleware for auth endpoints
const rateLimit = require('express-rate-limit');
const { ERROR_CODES, LIMITS } = require('../constants');
const config = require('../config/env');

const FIFTEEN_MINUTES = LIMITS.RATE_LIMIT_AUTH_WINDOW_MS;
const AUTH_MAX_REQUESTS = LIMITS.RATE_LIMIT_AUTH_MAX;
const STRICT_MAX_REQUESTS = LIMITS.RATE_LIMIT_STRICT_MAX;

// Standardized rate limit response handler
const rateLimitHandler = (_req, res) => {
  res.status(429).json({
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests, please try again later',
      details: [],
    },
  });
};

const skipIfTest = () => config.NODE_ENV === 'test';

// General rate limiter for all /api/auth/* routes (10 req / 15 min)
const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: AUTH_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipIfTest,
});

// Strict rate limiter for verify-otp and resend-otp (5 req / 15 min)
const strictLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: STRICT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipIfTest,
});

module.exports = { authLimiter, strictLimiter };

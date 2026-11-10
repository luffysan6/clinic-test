// JWT sign and verify helpers
const jwt = require('jsonwebtoken');
const config = require('../config/env');

// Signs a JWT with userId and role
const signToken = (userId, role) => {
  return jwt.sign({ sub: userId, role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

// Verifies a JWT and returns the decoded payload
const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};

module.exports = { signToken, verifyToken };

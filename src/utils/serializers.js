'use strict';

// Strips sensitive fields and returns a safe user object
const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  isVerified: user.isVerified,
  hasProfileImage: Boolean(user.profileImage),
  createdAt: user.createdAt,
});

module.exports = { serializeUser };

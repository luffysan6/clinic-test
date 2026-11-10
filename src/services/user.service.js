// Service for user profile operations
const path = require('path');
const fs = require('fs/promises');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { serializeUser } = require('../utils/serializers');
const { ERROR_CODES, LIMITS } = require('../constants');

const BCRYPT_COST = 10;
const PROFILE_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'profile');

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isVerified: true,
  profileImage: true,
  createdAt: true,
};

// Retrieves a user profile by id
const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: SAFE_USER_SELECT,
  });

  if (!user) {
    throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, 'User not found');
  }

  return serializeUser(user);
};

// Updates user name only
const updateProfile = async (userId, data) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, 'User not found');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name: data.name },
    select: SAFE_USER_SELECT,
  });

  return serializeUser(updated);
};

// Changes user password after verifying current one
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, 'User not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError(400, ERROR_CODES.WRONG_PASSWORD, 'Current password is incorrect');
  }

  const isSame = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSame) {
    throw new AppError(400, ERROR_CODES.PASSWORD_SAME_AS_OLD, 'New password must be different from current password');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { message: 'Password changed successfully' };
};

// Uploads or replaces a profile image for the user
const uploadProfileImage = async (userId, file) => {
  if (!file) {
    throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Image file is required');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, profileImage: true },
  });

  if (!user) {
    throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, 'User not found');
  }

  // Delete old profile image if it exists
  if (user.profileImage) {
    const oldPath = path.join(PROFILE_UPLOAD_DIR, user.profileImage);
    await fs.unlink(oldPath).catch(() => {});
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { profileImage: file.filename },
    select: SAFE_USER_SELECT,
  });

  return serializeUser(updated);
};

// Returns the full file path of a user's profile image
const getProfileImage = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, profileImage: true },
  });

  if (!user) {
    throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, 'User not found');
  }

  if (!user.profileImage) {
    throw new AppError(404, ERROR_CODES.PROFILE_IMAGE_NOT_FOUND, 'Profile image not found');
  }

  const fullPath = path.join(PROFILE_UPLOAD_DIR, user.profileImage);
  try {
    await fs.access(fullPath);
  } catch {
    throw new AppError(404, ERROR_CODES.PROFILE_IMAGE_NOT_FOUND, 'Profile image file not found on disk');
  }

  return fullPath;
};

// Deletes the user's profile image from disk and database
const deleteProfileImage = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, profileImage: true },
  });

  if (!user) {
    throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, 'User not found');
  }

  if (!user.profileImage) {
    throw new AppError(404, ERROR_CODES.PROFILE_IMAGE_NOT_FOUND, 'Profile image not found');
  }

  const filePath = path.join(PROFILE_UPLOAD_DIR, user.profileImage);
  await fs.unlink(filePath).catch(() => {});

  await prisma.user.update({
    where: { id: userId },
    data: { profileImage: null },
  });

  return { message: 'Profile image deleted' };
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  getProfileImage,
  deleteProfileImage,
};

'use strict';

// Service for user profile operations
const path = require('path');
const fs = require('fs/promises');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { serializeUser } = require('../utils/serializers');
const { ERROR_CODES } = require('../constants');
const cloudinaryService = require('./cloudinary.service');

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

// Uploads or replaces a profile image for the user (Cloudinary or local storage)
const uploadProfileImage = async (userId, file) => {
  if (!file) {
    throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Image file is required');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, profileImage: true },
  });

  if (!user) {
    // Delete temp file if user not found
    await fs.unlink(file.path).catch(() => {});
    throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, 'User not found');
  }

  // Delete previous profile image if one exists
  if (user.profileImage) {
    if (user.profileImage.startsWith('http')) {
      await cloudinaryService.deleteImage(user.profileImage);
    } else {
      const oldPath = path.join(PROFILE_UPLOAD_DIR, user.profileImage);
      await fs.unlink(oldPath).catch(() => {});
    }
  }

  let newProfileImageValue;

  if (cloudinaryService.isConfigured) {
    // Upload to Cloudinary and clean up local file
    const result = await cloudinaryService.uploadProfileImage(file.path, userId);
    newProfileImageValue = result.url;
  } else {
    // Local storage fallback
    newProfileImageValue = file.filename;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { profileImage: newProfileImageValue },
    select: SAFE_USER_SELECT,
  });

  return serializeUser(updated);
};

// Returns profile image information (URL for Cloudinary or file path for local)
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

  if (user.profileImage.startsWith('http://') || user.profileImage.startsWith('https://')) {
    return { isRemote: true, url: user.profileImage };
  }

  const fullPath = path.join(PROFILE_UPLOAD_DIR, user.profileImage);
  try {
    await fs.access(fullPath);
  } catch {
    throw new AppError(404, ERROR_CODES.PROFILE_IMAGE_NOT_FOUND, 'Profile image file not found on disk');
  }

  return { isRemote: false, path: fullPath };
};

// Deletes the user's profile image from Cloudinary/disk and database
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

  if (user.profileImage.startsWith('http')) {
    await cloudinaryService.deleteImage(user.profileImage);
  } else {
    const filePath = path.join(PROFILE_UPLOAD_DIR, user.profileImage);
    await fs.unlink(filePath).catch(() => {});
  }

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

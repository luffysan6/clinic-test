'use strict';

// Cloudinary upload and deletion helper service
const fs = require('fs/promises');
const { cloudinary, isConfigured } = require('../config/cloudinary');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../constants');

// Extracts the public ID from a Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  // Format: .../upload/(v12345/)?folder/filename.ext
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
  return matches ? matches[1] : null;
};

// Uploads a local image file to Cloudinary and deletes the local temporary copy
const uploadProfileImage = async (filePath, userId) => {
  if (!isConfigured) {
    throw new AppError(500, ERROR_CODES.INTERNAL_ERROR, 'Cloudinary is not configured');
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'clinic/profiles',
      public_id: `${userId}_${Date.now()}`,
      overwrite: true,
      resource_type: 'image',
    });

    // Delete local temp file after successful upload to cloud
    await fs.unlink(filePath).catch(() => {});

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    // Ensure local temp file is removed even if upload fails
    await fs.unlink(filePath).catch(() => {});
    logger.error('Cloudinary upload failed:', err.message);
    throw new AppError(500, ERROR_CODES.INTERNAL_ERROR, 'Failed to upload image to cloud storage');
  }
};

// Deletes an image from Cloudinary by URL or public ID
const deleteImage = async (imageUrlOrPublicId) => {
  if (!isConfigured || !imageUrlOrPublicId) {
    return;
  }

  const publicId = imageUrlOrPublicId.startsWith('http')
    ? getPublicIdFromUrl(imageUrlOrPublicId)
    : imageUrlOrPublicId;

  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Deleted image from Cloudinary: ${publicId}`);
  } catch (err) {
    logger.error(`Failed to delete image from Cloudinary (${publicId}):`, err.message);
  }
};

module.exports = {
  isConfigured,
  uploadProfileImage,
  deleteImage,
  getPublicIdFromUrl,
};


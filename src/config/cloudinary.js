'use strict';

// Cloudinary configuration
const cloudinary = require('cloudinary').v2;
const config = require('./env');

const isConfigured = Boolean(
  config.CLOUDINARY_CLOUD_NAME &&
  config.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  config.CLOUDINARY_API_KEY &&
  config.CLOUDINARY_API_KEY !== 'your_api_key' &&
  config.CLOUDINARY_API_SECRET &&
  config.CLOUDINARY_API_SECRET !== 'your_api_secret'
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

module.exports = { cloudinary, isConfigured };


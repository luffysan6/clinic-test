'use strict';

// Multer upload configuration factories
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const {
  LIMITS,
  ALLOWED_FILE_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_PROFILE_IMAGE_TYPES,
  ALLOWED_PROFILE_IMAGE_EXTENSIONS,
  ERROR_CODES,
} = require('../constants');
const AppError = require('../utils/AppError');

const PROFILE_UPLOAD_DIR = 'uploads/profile/';
const RECORDS_UPLOAD_DIR = 'uploads/records/';

// Creates disk storage with the given destination directory
const createStorage = (dest) => {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, dest);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = `${crypto.randomUUID()}${ext}`;
      cb(null, name);
    },
  });
};

// File filter for profile images (jpeg, png, webp)
const profileFileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (
    ALLOWED_PROFILE_IMAGE_TYPES.includes(file.mimetype) &&
    ALLOWED_PROFILE_IMAGE_EXTENSIONS.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        400,
        ERROR_CODES.INVALID_FILE_TYPE,
        'Invalid file type. Allowed: jpeg, png, webp'
      ),
      false
    );
  }
};

// File filter for record files (pdf, jpeg, png) — checks both mimetype and extension
const recordFileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (
    ALLOWED_FILE_TYPES.includes(file.mimetype) &&
    ALLOWED_FILE_EXTENSIONS.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        400,
        ERROR_CODES.INVALID_FILE_TYPE,
        'Invalid file type. Allowed: pdf, jpeg, png'
      ),
      false
    );
  }
};

// Multer instance for single profile image upload
const profileImageUpload = multer({
  storage: createStorage(PROFILE_UPLOAD_DIR),
  fileFilter: profileFileFilter,
  limits: { fileSize: LIMITS.MAX_PROFILE_IMAGE_SIZE },
}).single('image');

// Multer instance for multiple record file uploads (max 5)
const recordFilesUpload = multer({
  storage: createStorage(RECORDS_UPLOAD_DIR),
  fileFilter: recordFileFilter,
  limits: { fileSize: LIMITS.MAX_FILE_SIZE_BYTES },
}).array('files', LIMITS.MAX_FILES_PER_UPLOAD);

module.exports = { profileImageUpload, recordFilesUpload };

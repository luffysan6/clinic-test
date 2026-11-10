// Service for medical file upload, download, list, and delete operations
const path = require('path');
const fs = require('fs/promises');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { ERROR_CODES, LIMITS } = require('../constants');

const RECORDS_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'records');
const PROFILE_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'profile');
const MAX_FILES_PER_USER = 10;

const FILE_SELECT = {
  id: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  category: true,
  createdAt: true,
};

// Removes a file from disk, ignoring ENOENT errors
const safeUnlink = async (filePath) => {
  await fs.unlink(filePath).catch(() => {});
};

// Uploads files and creates DB records, rolls back disk files on DB failure
const upload = async (userId, files, category) => {
  if (!files || files.length === 0) {
    throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'At least one file is required');
  }

  const existingCount = await prisma.recordFile.count({
    where: { userId },
  });

  if (existingCount + files.length > MAX_FILES_PER_USER) {
    // Clean up uploaded files since we're rejecting
    await Promise.all(files.map((f) => safeUnlink(f.path)));
    throw new AppError(
      400,
      ERROR_CODES.MAX_FILES_EXCEEDED,
      `Maximum ${MAX_FILES_PER_USER} files allowed per user. You have ${existingCount} and tried to upload ${files.length}.`
    );
  }

  const fileData = files.map((f) => ({
    userId,
    originalName: f.originalname,
    storedName: f.filename,
    mimeType: f.mimetype,
    sizeBytes: f.size,
    category: category || 'OTHER',
  }));

  try {
    const created = await prisma.$transaction(
      fileData.map((data) =>
        prisma.recordFile.create({
          data,
          select: FILE_SELECT,
        })
      )
    );
    return created;
  } catch (err) {
    // Roll back: delete uploaded files from disk
    await Promise.all(files.map((f) => safeUnlink(f.path)));
    throw err;
  }
};

// Lists all file metadata for a user
const listByUser = async (userId) => {
  const files = await prisma.recordFile.findMany({
    where: { userId },
    select: FILE_SELECT,
    orderBy: { createdAt: 'desc' },
  });

  return files;
};

// Returns file path and metadata for download (owner or admin)
const download = async (userId, fileId, isAdmin) => {
  const file = await prisma.recordFile.findUnique({
    where: { id: fileId },
    select: {
      ...FILE_SELECT,
      storedName: true,
      userId: true,
    },
  });

  if (!file || (file.userId !== userId && !isAdmin)) {
    throw new AppError(404, ERROR_CODES.FILE_NOT_FOUND, 'File not found');
  }

  const filePath = path.join(RECORDS_UPLOAD_DIR, file.storedName);
  try {
    await fs.access(filePath);
  } catch {
    throw new AppError(404, ERROR_CODES.FILE_NOT_FOUND, 'File not found on disk');
  }

  return {
    filePath,
    metadata: {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      category: file.category,
      createdAt: file.createdAt,
    },
  };
};

// Deletes a single file by id (owner only)
const remove = async (userId, fileId) => {
  const file = await prisma.recordFile.findFirst({
    where: { id: fileId, userId },
    select: { id: true, storedName: true },
  });

  if (!file) {
    throw new AppError(404, ERROR_CODES.FILE_NOT_FOUND, 'File not found');
  }

  await prisma.recordFile.delete({
    where: { id: file.id },
  });

  const filePath = path.join(RECORDS_UPLOAD_DIR, file.storedName);
  await safeUnlink(filePath);

  return { message: 'File deleted' };
};

// Deletes all files and profile image for a user (used by admin delete)
const deleteAllUserFiles = async (userId) => {
  const files = await prisma.recordFile.findMany({
    where: { userId },
    select: { storedName: true },
  });

  await prisma.recordFile.deleteMany({
    where: { userId },
  });

  // Delete record files from disk
  await Promise.all(
    files.map((f) => safeUnlink(path.join(RECORDS_UPLOAD_DIR, f.storedName)))
  );

  // Delete profile image if exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileImage: true },
  });

  if (user && user.profileImage) {
    await safeUnlink(path.join(PROFILE_UPLOAD_DIR, user.profileImage));
  }
};

module.exports = {
  upload,
  listByUser,
  download,
  remove,
  deleteAllUserFiles,
};

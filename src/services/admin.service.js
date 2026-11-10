'use strict';

const prisma = require('../config/prisma');
const { ROLES, ERROR_CODES, LIMITS } = require('../constants');
const AppError = require('../utils/AppError');
const { serializeUser } = require('../utils/serializers');
const { deleteAllUserFiles } = require('./file.service');
const logger = require('../utils/logger');

/** Safe fields to select when listing users */
const USER_LIST_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isVerified: true,
  profileImage: true,
  createdAt: true,
};

/** File metadata fields to select (no storedName / path) */
const FILE_METADATA_SELECT = {
  id: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  category: true,
  createdAt: true,
};

/** Paginated user list with optional search by name or email */
const listUsers = async ({ page, limit, search }) => {
  const safePage = page || LIMITS.PAGINATION_DEFAULT_PAGE;
  const safeLimit = Math.min(limit || LIMITS.PAGINATION_DEFAULT_LIMIT, LIMITS.PAGINATION_MAX_LIMIT);
  const skip = (safePage - 1) * safeLimit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_LIST_SELECT,
      skip,
      take: safeLimit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: items.map(serializeUser),
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit),
  };
};

/** Get full user detail including health record and file metadata */
const getUserDetail = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...USER_LIST_SELECT,
      healthRecord: true,
      files: { select: FILE_METADATA_SELECT, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND);
  }

  const { healthRecord, files, ...userData } = user;

  return {
    user: serializeUser(userData),
    healthRecord,
    files,
  };
};

/** Delete a non-admin user, removing all files from disk and DB rows via cascade */
const deleteUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND);
  }

  if (user.role === ROLES.ADMIN) {
    throw new AppError('Cannot delete an admin user', 400, ERROR_CODES.CANNOT_DELETE_ADMIN);
  }

  // Remove all files from disk (profile image + record files)
  await deleteAllUserFiles(userId);

  // Delete user from DB — cascade handles related rows
  await prisma.user.delete({ where: { id: userId } });

  logger.info(`User ${userId} deleted by admin`);

  return { message: 'User deleted successfully' };
};

module.exports = { listUsers, getUserDetail, deleteUser };

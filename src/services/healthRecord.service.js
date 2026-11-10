// Service for health record CRUD operations
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../constants');

// Creates a health record for a user (one per user)
const create = async (userId, data) => {
  const existing = await prisma.healthRecord.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new AppError(409, ERROR_CODES.HEALTH_RECORD_EXISTS, 'Health record already exists');
  }

  const record = await prisma.healthRecord.create({
    data: { userId, ...data },
  });

  return record;
};

// Retrieves a user's health record
const getByUserId = async (userId) => {
  const record = await prisma.healthRecord.findUnique({
    where: { userId },
  });

  if (!record) {
    throw new AppError(404, ERROR_CODES.HEALTH_RECORD_NOT_FOUND, 'Health record not found');
  }

  return record;
};

// Updates a user's health record with partial data
const update = async (userId, data) => {
  const existing = await prisma.healthRecord.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new AppError(404, ERROR_CODES.HEALTH_RECORD_NOT_FOUND, 'Health record not found');
  }

  const record = await prisma.healthRecord.update({
    where: { userId },
    data,
  });

  return record;
};

// Deletes a user's health record (does NOT delete files)
const remove = async (userId) => {
  const existing = await prisma.healthRecord.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new AppError(404, ERROR_CODES.HEALTH_RECORD_NOT_FOUND, 'Health record not found');
  }

  await prisma.healthRecord.delete({
    where: { userId },
  });

  return { message: 'Health record deleted' };
};

module.exports = {
  create,
  getByUserId,
  update,
  remove,
};

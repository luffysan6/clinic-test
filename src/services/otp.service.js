// OTP generation, storage, and verification service
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../constants');
const config = require('../config/env');

const BCRYPT_COST = 10;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

// Generates a cryptographically random 6-digit OTP string
const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Creates or replaces the OTP for a user, returns the plaintext OTP
const createOtp = async (userId) => {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_COST);
  const expiresAt = new Date(Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.emailOtp.upsert({
    where: { userId },
    update: {
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    },
    create: {
      userId,
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    },
  });

  return otp;
};

// Verifies the OTP for a user and marks them as verified
const verifyOtp = async (userId, otp) => {
  const otpRow = await prisma.emailOtp.findUnique({
    where: { userId },
  });

  if (!otpRow) {
    throw new AppError(400, ERROR_CODES.INVALID_OTP, 'Invalid or expired OTP');
  }

  if (otpRow.expiresAt < new Date()) {
    throw new AppError(400, ERROR_CODES.OTP_EXPIRED, 'OTP has expired, please request a new one');
  }

  if (otpRow.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError(429, ERROR_CODES.OTP_ATTEMPTS_EXCEEDED, 'Too many failed attempts, please request a new OTP');
  }

  const isValid = await bcrypt.compare(otp, otpRow.otpHash);

  if (!isValid) {
    const updated = await prisma.emailOtp.update({
      where: { userId },
      data: { attempts: { increment: 1 } },
    });
    if (updated.attempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError(429, ERROR_CODES.OTP_ATTEMPTS_EXCEEDED, 'Too many failed attempts, please request a new OTP');
    }
    throw new AppError(400, ERROR_CODES.INVALID_OTP, 'Invalid or expired OTP');
  }

  const user = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    await tx.emailOtp.delete({
      where: { userId },
    });

    return updatedUser;
  });

  return user;
};

// Checks if enough time has elapsed since the last OTP was sent
const canResendOtp = async (userId) => {
  const otpRow = await prisma.emailOtp.findUnique({
    where: { userId },
    select: { lastSentAt: true },
  });

  if (!otpRow) {
    return true;
  }

  const elapsed = (Date.now() - otpRow.lastSentAt.getTime()) / 1000;
  return elapsed >= RESEND_COOLDOWN_SECONDS;
};

module.exports = { generateOtp, createOtp, verifyOtp, canResendOtp };

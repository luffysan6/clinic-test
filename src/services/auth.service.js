'use strict';

// Authentication business logic service
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../constants');
const { signToken } = require('../utils/token');
const { serializeUser } = require('../utils/serializers');
const otpService = require('./otp.service');
const emailService = require('./email.service');

const BCRYPT_COST = 10;

// Registers a new user or updates an unverified user, then sends an OTP email
const register = async (name, email, password) => {
  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedEmail === config.ADMIN_EMAIL.toLowerCase().trim()) {
    throw new AppError(409, ERROR_CODES.EMAIL_ALREADY_REGISTERED, 'Email is already registered');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser && existingUser.isVerified) {
    throw new AppError(409, ERROR_CODES.EMAIL_ALREADY_REGISTERED, 'Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  let user;

  if (existingUser && !existingUser.isVerified) {
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: { name, passwordHash },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        passwordHash,
      },
    });
  }

  const otp = await otpService.createOtp(user.id);
  await emailService.sendOtpEmail(normalizedEmail, name, otp);

  return 'Registration successful. Please check your email for the verification code.';
};

// Authenticates a user with email and password, returns token and user
const login = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError(401, ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new AppError(401, ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password');
  }

  if (!user.isVerified) {
    throw new AppError(403, ERROR_CODES.EMAIL_NOT_VERIFIED, 'Please verify your email before logging in');
  }

  const token = signToken(user.id, user.role);

  return { token, user: serializeUser(user) };
};

// Verifies a user's OTP and returns token and user
const verifyOtp = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError(400, ERROR_CODES.INVALID_OTP, 'Invalid or expired OTP');
  }

  const verifiedUser = await otpService.verifyOtp(user.id, otp);
  const token = signToken(verifiedUser.id, verifiedUser.role);

  return { token, user: serializeUser(verifiedUser) };
};

// Resends the OTP email if conditions are met
const resendOtp = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const genericMessage = 'If the email is registered and unverified, a new verification code has been sent.';

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.isVerified) {
    return genericMessage;
  }

  const canResend = await otpService.canResendOtp(user.id);

  if (!canResend) {
    throw new AppError(429, ERROR_CODES.OTP_RESEND_COOLDOWN, 'Please wait before requesting a new code');
  }

  const otp = await otpService.createOtp(user.id);
  await emailService.sendOtpEmail(normalizedEmail, user.name, otp);

  return genericMessage;
};

module.exports = { register, login, verifyOtp, resendOtp };

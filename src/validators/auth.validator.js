'use strict';

// Zod validation schemas for auth routes
const { z } = require('zod');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const OTP_REGEX = /^\d{6}$/;
const NAME_MIN = 2;
const NAME_MAX = 60;
const EMAIL_MAX = 254;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 64;
const OTP_LENGTH = 6;

// Schema for POST /auth/register
const registerSchema = {
  body: z.object({
    name: z.string().trim().min(NAME_MIN, 'Name must be at least 2 characters').max(NAME_MAX, 'Name must be at most 60 characters'),
    email: z.string().email('Invalid email address').max(EMAIL_MAX, 'Email is too long').transform((v) => v.toLowerCase()),
    password: z.string()
      .min(PASSWORD_MIN, 'Password must be at least 8 characters')
      .max(PASSWORD_MAX, 'Password must be at most 64 characters')
      .regex(PASSWORD_REGEX, 'Password must contain at least one lowercase letter, one uppercase letter, and one digit'),
  }),
};

// Schema for POST /auth/verify-otp
const verifyOtpSchema = {
  body: z.object({
    email: z.string().email('Invalid email address').transform((v) => v.toLowerCase()),
    otp: z.string().length(OTP_LENGTH, 'OTP must be exactly 6 digits').regex(OTP_REGEX, 'OTP must contain only digits'),
  }),
};

// Schema for POST /auth/resend-otp
const resendOtpSchema = {
  body: z.object({
    email: z.string().email('Invalid email address').transform((v) => v.toLowerCase()),
  }),
};

// Schema for POST /auth/login
const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address').transform((v) => v.toLowerCase()),
    password: z.string().min(1, 'Password is required'),
  }),
};

module.exports = { registerSchema, verifyOtpSchema, resendOtpSchema, loginSchema };

'use strict';

const dotenv = require('dotenv');

dotenv.config();

// Reads and validates all required environment variables
const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'ADMIN_NAME',
];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[CONFIG] Missing required environment variables:\n  ${missing.join('\n  ')}`
  );
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV || 'development';
const port = parseInt(process.env.PORT, 10) || 4000;
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME;
const mailFrom = process.env.MAIL_FROM || 'Clinic <onboarding@resend.dev>';
const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Cloudinary configuration (optional: falls back to local disk storage if unconfigured)
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || '';
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || '';
  
// Resend HTTP Email API (works over Port 443 via native fetch)
const resendApiKey = process.env.RESEND_API_KEY || '';

const config = Object.freeze({
  NODE_ENV: nodeEnv,
  PORT: port,
  DATABASE_URL: databaseUrl,
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: jwtExpiresIn,
  ADMIN_EMAIL: adminEmail,
  ADMIN_PASSWORD: adminPassword,
  ADMIN_NAME: adminName,
  MAIL_FROM: mailFrom,
  OTP_EXPIRY_MINUTES: otpExpiryMinutes,
  CORS_ORIGIN: corsOrigin,
  CLOUDINARY_CLOUD_NAME: cloudinaryCloudName,
  CLOUDINARY_API_KEY: cloudinaryApiKey,
  CLOUDINARY_API_SECRET: cloudinaryApiSecret,
  RESEND_API_KEY: resendApiKey,

  // camelCase aliases
  nodeEnv,
  port,
  databaseUrl,
  jwtSecret,
  jwtExpiresIn,
  adminEmail,
  adminPassword,
  adminName,
  mailFrom,
  otpExpiryMinutes,
  corsOrigin,
  cloudinaryCloudName,
  cloudinaryApiKey,
  cloudinaryApiSecret,
  resendApiKey,
});

module.exports = config;

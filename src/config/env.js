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
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'MAIL_FROM',
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
const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM;
const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

const config = Object.freeze({
  NODE_ENV: nodeEnv,
  PORT: port,
  DATABASE_URL: databaseUrl,
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: jwtExpiresIn,
  ADMIN_EMAIL: adminEmail,
  ADMIN_PASSWORD: adminPassword,
  ADMIN_NAME: adminName,
  SMTP_HOST: smtpHost,
  SMTP_PORT: smtpPort,
  SMTP_USER: smtpUser,
  SMTP_PASS: smtpPass,
  MAIL_FROM: mailFrom,
  OTP_EXPIRY_MINUTES: otpExpiryMinutes,
  CORS_ORIGIN: corsOrigin,

  // camelCase aliases
  nodeEnv,
  port,
  databaseUrl,
  jwtSecret,
  jwtExpiresIn,
  adminEmail,
  adminPassword,
  adminName,
  smtpHost,
  smtpPort,
  smtpUser,
  smtpPass,
  mailFrom,
  otpExpiryMinutes,
  corsOrigin,
});

module.exports = config;

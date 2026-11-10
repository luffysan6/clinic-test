'use strict';

// Email sending service
const transporter = require('../config/mailer');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../constants');
const logger = require('../utils/logger');

// Sends an OTP verification email to the user
const sendOtpEmail = async (to, name, otp) => {
  const subject = 'Verify your email';
  const expiryMinutes = config.OTP_EXPIRY_MINUTES;

  const text = `Hi ${name},\n\nYour verification code is: ${otp}\n\nThis code expires in ${expiryMinutes} minutes.\n\nIf you did not request this, please ignore this email.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Email Verification</h2>
      <p>Hi ${name},</p>
      <p>Your verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 16px; background: #f4f4f4; border-radius: 8px; margin: 16px 0;">
        ${otp}
      </div>
      <p>This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  // In development/test, log the OTP to ease testing
  if (['development', 'test'].includes(config.NODE_ENV)) {
    logger.info(`[${config.NODE_ENV.toUpperCase()}] OTP for ${to}: ${otp}`);
  }

  // If in development/test with placeholder SMTP credentials, avoid failing on dummy SMTP
  if (
    ['development', 'test'].includes(config.NODE_ENV) &&
    (!config.SMTP_PASS || config.SMTP_PASS === 'app_password')
  ) {
    return;
  }

  try {
    await transporter.sendMail({
      from: config.MAIL_FROM,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    logger.error('Failed to send OTP email:', err.message);
    throw new AppError(502, ERROR_CODES.EMAIL_SEND_FAILED, 'Failed to send verification email');
  }
};

module.exports = { sendOtpEmail };

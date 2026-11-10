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
    !config.RESEND_API_KEY &&
    (!config.SMTP_PASS || config.SMTP_PASS === 'app_password')
  ) {
    return;
  }

  // If RESEND_API_KEY is configured, send via Resend HTTPS API (Port 443, immune to Render SMTP port blocks)
  if (config.RESEND_API_KEY) {
    // Resend requires sending from onboarding@resend.dev unless a custom domain is verified
    const resendFrom = config.MAIL_FROM && !config.MAIL_FROM.includes('@gmail.com') && !config.MAIL_FROM.includes('@you@')
      ? config.MAIL_FROM
      : 'Clinic <onboarding@resend.dev>';

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [to],
          subject,
          text,
          html,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        logger.error('Resend API error:', JSON.stringify(data));
        throw new AppError(502, ERROR_CODES.EMAIL_SEND_FAILED, 'Failed to send verification email');
      }

      logger.info(`OTP email sent via Resend API to ${to} (ID: ${data.id})`);
      return;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Resend request failed:', err.message);
      throw new AppError(502, ERROR_CODES.EMAIL_SEND_FAILED, 'Failed to send verification email');
    }
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
    logger.error('Failed to send OTP email:', {
      message: err.message,
      code: err.code,
      response: err.response,
      command: err.command,
    });
    throw new AppError(502, ERROR_CODES.EMAIL_SEND_FAILED, 'Failed to send verification email');
  }
};

module.exports = { sendOtpEmail };

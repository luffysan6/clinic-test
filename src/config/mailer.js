'use strict';

// Nodemailer transporter configuration
const nodemailer = require('nodemailer');
const config = require('./env');

const isGmail = Boolean(
  config.SMTP_HOST && config.SMTP_HOST.toLowerCase().includes('gmail')
);

const isSecure = Number(config.SMTP_PORT) === 465;

const transportOptions = isGmail
  ? {
      service: 'gmail',
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    }
  : {
      host: config.SMTP_HOST,
      port: Number(config.SMTP_PORT) || 587,
      secure: isSecure,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    };

const transporter = nodemailer.createTransport(transportOptions);

module.exports = transporter;

// Nodemailer transporter configuration
const nodemailer = require('nodemailer');
const config = require('./env');

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: false,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

module.exports = transporter;

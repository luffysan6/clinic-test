'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/env');
const { LIMITS } = require('./constants');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Builds and configures the Express application
const app = express();

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, '..', 'uploads', 'profile'),
  path.join(__dirname, '..', 'uploads', 'records'),
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
});

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: LIMITS.MAX_JSON_SIZE }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// 404 & error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;

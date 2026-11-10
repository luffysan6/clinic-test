'use strict';

// Lightweight logger with timestamped output
const timestamp = () => new Date().toISOString();

const logger = {
  info: (...args) => console.log(`[${timestamp()}] INFO:`, ...args),
  error: (...args) => console.error(`[${timestamp()}] ERROR:`, ...args),
};

module.exports = logger;

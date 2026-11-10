'use strict';

const config = require('./config/env');
const app = require('./app');
const logger = require('./utils/logger');

// Starts the HTTP server on the configured port
app.listen(config.port, () => {
  logger.info(`Clinic API running on port ${config.port} [${config.nodeEnv}]`);
});

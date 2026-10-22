/**
 * server.js
 * Process entrypoint: connects MongoDB, starts Express, and shuts down gracefully on SIGTERM/SIGINT.
 */
const mongoose = require('mongoose');

const { config } = require('./config');
const { logger } = require('./utils/logger');
const { connectOnce } = require('./db');
const { app } = require('./app');

/** Closes the server and DB connection, then exits. */
async function shutdown(signal) {
  logger.info('shutdown initiated', { signal });
  try {
    await mongoose.connection.close();
    logger.info('mongo connection closed');
  } catch (err) {
    logger.error('error closing mongo connection', { error: err.message });
  }
  process.exit(0);
}

/** Connects to MongoDB and starts the HTTP server. */
async function start() {
  try {
    await connectOnce();

    const server = app.listen(config.port, () => {
      logger.info('server started', { port: config.port, env: config.env });
    });

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('unhandled rejection', { reason: String(reason) });
    });

    return server;
  } catch (err) {
    logger.error('startup failed', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { start };

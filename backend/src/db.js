/**
 * db.js
 * Shared lazy MongoDB connection: connectOnce() caches one promise for serverless reuse; ensureDb middleware awaits it per request. Exports connectOnce, ensureDb.
 */
const mongoose = require('mongoose');
const { config } = require('./config');
const { logger } = require('./utils/logger');

let pending = null;

/** Returns a cached connect() promise so concurrent cold starts share one connection. */
function connectOnce() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }
  if (!pending) {
    pending = mongoose
      .connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 })
      .then(() => {
        logger.info('mongo connected', {
          uri: config.mongoUri.replace(/\/\/[^@]*@/, '//[REDACTED]@'),
        });
        return mongoose.connection;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}

/** Express middleware: guarantees a DB connection before handlers run (503 on failure). */
async function ensureDb(req, res, next) {
  try {
    await connectOnce();
    return next();
  } catch (err) {
    logger.error('mongo connection failed', { error: err.message });
    return res.status(503).json({
      error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable, try again shortly', details: [] },
    });
  }
}

module.exports = { connectOnce, ensureDb };

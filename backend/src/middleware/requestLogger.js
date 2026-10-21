/**
 * middleware/requestLogger.js
 * Assigns a request ID and logs method, URL, status, and duration per request. Exports requestLogger.
 */
const { randomUUID } = require('crypto');
const { logger } = require('../utils/logger');

/** Express middleware that attaches req.id and logs every finished request. */
function requestLogger(req, res, next) {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-Id', req.id);

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info('request', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  });

  next();
}

module.exports = { requestLogger };

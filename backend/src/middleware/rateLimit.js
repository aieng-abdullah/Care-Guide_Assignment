/**
 * middleware/rateLimit.js
 * Rate limiter factory backed by config; returns 429 with the standard error shape when exceeded. Exports createRateLimiter.
 */
const rateLimit = require('express-rate-limit');
const { config } = require('../config');

/** Returns an Express rate-limit middleware using the configured window and max. */
function createRateLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests, slow down',
          details: [],
        },
      });
    },
  });
}

module.exports = { createRateLimiter };

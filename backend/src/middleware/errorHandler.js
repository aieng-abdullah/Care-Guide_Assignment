/**
 * middleware/errorHandler.js
 * Converts thrown errors into the standard JSON error shape and logs them. Exports errorHandler, notFound, ApiError.
 */
const { logger } = require('../utils/logger');

/** Application error carrying an HTTP status, machine code, and optional field details. */
class ApiError extends Error {
  /** Creates an ApiError with status, code, message, and optional details array. */
  constructor(status, code, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Returns a 400 validation error with field-level details. */
  static badRequest(code, message, details = []) {
    return new ApiError(400, code, message, details);
  }

  /** Returns a 500 internal error. */
  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}

/** Express 404 middleware for unmatched routes. */
function notFound(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found`, details: [] },
  });
}

/** Express terminal error middleware producing the standard JSON error shape. */
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR');
  const message = err.message || 'Internal server error';
  const details = err.details || [];

  if (status >= 500) {
    logger.error('unhandled error', {
      requestId: req.id,
      code,
      message,
      stack: err.stack,
    });
  } else {
    logger.warn('request error', { requestId: req.id, code, status, message });
  }

  res.status(status).json({ error: { code, message, details } });
}

module.exports = { errorHandler, notFound, ApiError };

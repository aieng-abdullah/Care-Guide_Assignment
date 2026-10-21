/**
 * utils/logger.js
 * Structured Winston logger writing JSON to console and file. Exports logger.
 */
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const { config } = require('../config');

const logDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const jsonFormatter = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/** Returns the shared Winston logger instance. */
const logger = winston.createLogger({
  level: config.logLevel,
  format: jsonFormatter,
  defaultMeta: { service: 'api-monitor-backend' },
  transports: [
    new winston.transports.Console({
      format: config.env === 'development'
        ? winston.format.combine(winston.format.colorize(), winston.format.simple())
        : jsonFormatter,
    }),
    new winston.transports.File({ filename: path.join(logDir, 'app.log') }),
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
  ],
});

module.exports = { logger };

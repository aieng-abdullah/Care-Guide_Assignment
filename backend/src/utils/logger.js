/**
 * utils/logger.js
 * Structured Winston logger writing JSON to console (and to file outside serverless). Exports logger.
 */
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const { config } = require('../config');

// Vercel filesystem is read-only outside /tmp; file transports are console-only there.
const isServerless = Boolean(process.env.VERCEL);
const logDir = path.join(__dirname, '..', '..', 'logs');
if (!isServerless && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const jsonFormatter = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: config.env === 'development' && !isServerless
      ? winston.format.combine(winston.format.colorize(), winston.format.simple())
      : jsonFormatter,
  }),
];

if (!isServerless) {
  transports.push(
    new winston.transports.File({ filename: path.join(logDir, 'app.log') }),
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' })
  );
}

/** Returns the shared Winston logger instance. */
const logger = winston.createLogger({
  level: config.logLevel,
  format: jsonFormatter,
  defaultMeta: { service: 'api-monitor-backend' },
  transports,
});

module.exports = { logger };

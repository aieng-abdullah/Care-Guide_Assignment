/**
 * routes/health.routes.js
 * GET /health endpoint reporting server and MongoDB connectivity. Exports healthRouter.
 */
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/** Returns true when the Mongoose connection is ready. */
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

router.get('/health', (req, res) => {
  const dbConnected = isDbConnected();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    db: dbConnected ? 'connected' : 'disconnected',
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

module.exports = { healthRouter: router, isDbConnected };

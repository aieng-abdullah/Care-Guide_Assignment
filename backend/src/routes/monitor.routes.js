/**
 * routes/monitor.routes.js
 * POST /monitor route with rate limiting and batch shape validation. Exports monitorRouter.
 */
const express = require('express');

const { monitorController } = require('../controllers/monitor.controller');
const { validateBatch } = require('../middleware/validate');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/monitor', createRateLimiter(), validateBatch, (req, res, next) =>
  monitorController.create(req, res, next)
);

module.exports = { monitorRouter: router };

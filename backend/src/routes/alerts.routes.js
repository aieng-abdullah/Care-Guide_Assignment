/**
 * routes/alerts.routes.js
 * GET /alerts and PATCH /alerts/:id/resolve routes. Exports alertsRouter.
 */
const express = require('express');

const { alertsController } = require('../controllers/alerts.controller');

const router = express.Router();

router.get('/alerts', (req, res, next) => alertsController.list(req, res, next));
router.patch('/alerts/:id/resolve', (req, res, next) => alertsController.resolve(req, res, next));

module.exports = { alertsRouter: router };

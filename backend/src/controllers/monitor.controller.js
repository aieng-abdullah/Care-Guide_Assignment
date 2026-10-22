/**
 * controllers/monitor.controller.js
 * Handles POST /monitor: delegates to the monitor service and returns the batch summary. Exports monitorController.
 */
const { monitorService } = require('../services/monitor.service');

const monitorController = {
  /** Processes the validated batch and responds with the summary. */
  async create(req, res, next) {
    try {
      const summary = await monitorService.processBatch(req.body);
      res.status(200).json(summary);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { monitorController };

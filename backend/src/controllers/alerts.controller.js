/**
 * controllers/alerts.controller.js
 * Handles GET /alerts (paginated active list) and PATCH /alerts/:id/resolve. Exports alertsController.
 */
const { alertRepository } = require('../repositories/alert.repository');
const { ApiError } = require('../middleware/errorHandler');

const alertsController = {
  /** Returns active alerts with optional severity/api_name filters and pagination. */
  async list(req, res, next) {
    try {
      const { severity, api_name, page, limit } = req.query;
      if (severity && !['warning', 'critical'].includes(severity)) {
        throw ApiError.badRequest('VALIDATION_ERROR', 'severity must be "warning" or "critical"');
      }
      const result = await alertRepository.findActive({ severity, api_name, page, limit });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /** Marks one active alert resolved; 404 when the id is unknown. */
  async resolve(req, res, next) {
    try {
      const existing = await alertRepository.findById(req.params.id);
      if (!existing) {
        throw new ApiError(404, 'NOT_FOUND', `Alert ${req.params.id} not found`);
      }
      if (existing.status === 'resolved') {
        return res.status(200).json({ ...existing, already_resolved: true });
      }
      const resolved = await alertRepository.resolveById(req.params.id);
      return res.status(200).json(resolved);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = { alertsController };

/**
 * models/alert.model.js
 * Mongoose schema for anomalies with dedup fingerprint, occurrences counter, and query indexes. Exports Alert and ALERT_STATUSES.
 */
const mongoose = require('mongoose');

const ALERT_STATUSES = Object.freeze(['active', 'resolved']);

/** Alert document schema matching PRD FR-4 plus dedup fields. */
const alertSchema = new mongoose.Schema(
  {
    api_name: { type: String, required: true, match: /^[A-Za-z0-9_\- ]{1,100}$/ },
    fingerprint: { type: String, required: true },
    rules_triggered: { type: [String], required: true },
    severity: { type: String, enum: ['warning', 'critical'], required: true },
    metrics: {
      response_time_ms: { type: Number, required: true },
      status_code: { type: Number, required: true },
      records_returned: { type: Number, default: null },
    },
    message: { type: String, required: true },
    alert_source: { type: String, enum: ['llm', 'fallback'], required: true },
    prompt_version: { type: String },
    status: { type: String, enum: ALERT_STATUSES, default: 'active' },
    occurrences: { type: Number, default: 1 },
    last_seen: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
    resolved_at: { type: Date, default: null },
  },
  { versionKey: false }
);

alertSchema.index({ status: 1 });
alertSchema.index({ api_name: 1 });
alertSchema.index({ created_at: -1 });
alertSchema.index({ status: 1, api_name: 1, fingerprint: 1 }, { unique: true });

/** Returns the Alert model, creating it once across test reconnects. */
const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema);

module.exports = { Alert, ALERT_STATUSES };

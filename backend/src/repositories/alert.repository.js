/**
 * repositories/alert.repository.js
 * All alert database access: atomic upsert for dedup, active listing with filters and pagination, resolve. Exports alertRepository.
 */
const { Alert } = require('../models/alert.model');

/** Builds the dedup query for an active alert with the same api_name and rule set. */
function activeMatch(apiName, fingerprint) {
  return { api_name: apiName, fingerprint, status: 'active' };
}

const alertRepository = {
  /** Upserts an active alert: same api_name+fingerprint increments occurrences and refreshes last_seen. */
  async upsertActive(anomaly) {
    const now = new Date();
    return Alert.findOneAndUpdate(
      activeMatch(anomaly.api_name, anomaly.fingerprint),
      {
        $set: {
          rules_triggered: anomaly.rules_triggered,
          severity: anomaly.severity,
          metrics: anomaly.metrics,
          message: anomaly.message,
          alert_source: anomaly.alert_source,
          prompt_version: anomaly.prompt_version,
          last_seen: now,
        },
        $setOnInsert: {
          api_name: anomaly.api_name,
          fingerprint: anomaly.fingerprint,
          created_at: now,
          status: 'active',
          resolved_at: null,
        },
        $inc: { occurrences: 1 },
      },
      { upsert: true, new: true, lean: true }
    ).exec();
  },

  /** Returns active alerts filtered by severity/api_name with pagination and total count. */
  async findActive({ severity, api_name, page = 1, limit = 20 }) {
    const query = { status: 'active' };
    if (severity) query.severity = severity;
    if (api_name) query.api_name = api_name;

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);

    const [data, total] = await Promise.all([
      Alert.find(query)
        .sort({ created_at: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      Alert.countDocuments(query),
    ]);

    return { data, total, page: safePage, limit: safeLimit };
  },

  /** Marks one alert resolved by id; returns null when not found. */
  async resolveById(id) {
    return Alert.findOneAndUpdate(
      { _id: id, status: 'active' },
      { $set: { status: 'resolved', resolved_at: new Date() } },
      { new: true, lean: true }
    ).exec();
  },

  /** Returns one alert by id, or null. */
  async findById(id) {
    return Alert.findById(id).lean().exec();
  },
};

module.exports = { alertRepository };

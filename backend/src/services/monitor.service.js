/**
 * services/monitor.service.js
 * Batch orchestration: validates each item, runs detection, generates alert text, upserts with dedup, isolates per-item failures. Exports createMonitorService, monitorService.
 */
const { logger } = require('../utils/logger');
const { config } = require('../config');
const { thresholds } = require('../config/thresholds');
const { detectAnomalies } = require('./detector.service');
const { buildFingerprint } = require('../utils/fingerprint');
const { mapWithConcurrency } = require('../utils/concurrency');
const { apiResponseSchema } = require('../middleware/validate');

/**
 * Returns a monitor service with injected aiAlert and repository.
 * processBatch(batch) -> summary { processed, healthy, anomalies, failed, alerts, failures }.
 */
function createMonitorService({ aiAlert, repository }) {
  /** Processes one batch item through validate, detect, generate, and upsert. */
  async function processItem(item, index) {
    const parsed = apiResponseSchema.safeParse(item);
    if (!parsed.success) {
      return {
        index,
        status: 'invalid',
        api_name: item?.api_name ?? null,
        details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      };
    }

    const record = parsed.data;
    const anomaly = detectAnomalies(record, thresholds);
    if (!anomaly) {
      return { index, status: 'healthy', api_name: record.api_name };
    }

    const { message, alert_source, prompt_version } = await aiAlert.generate(anomaly);
    const fingerprint = buildFingerprint(anomaly.api_name, anomaly.rules_triggered);
    const saved = await repository.upsertActive({
      ...anomaly,
      fingerprint,
      message,
      alert_source,
      prompt_version,
    });

    return {
      index,
      status: 'anomaly',
      api_name: anomaly.api_name,
      severity: anomaly.severity,
      message,
      alert_source,
      fingerprint,
      occurrences: saved.occurrences,
    };
  }

  /** Processes the whole batch with bounded concurrency and per-item failure isolation. */
  async function processBatch(batch) {
    const results = await mapWithConcurrency(batch, config.llm.concurrency, async (item, index) => {
      try {
        return await processItem(item, index);
      } catch (err) {
        logger.error('batch item failed', { index, api_name: item?.api_name, error: err.message });
        return { index, status: 'failed', api_name: item?.api_name ?? null, error: err.message };
      }
    });

    const alerts = results
      .filter((r) => r.status === 'anomaly')
      .map((r) => ({
        api_name: r.api_name,
        severity: r.severity,
        message: r.message,
        alert_source: r.alert_source,
        fingerprint: r.fingerprint,
        occurrences: r.occurrences,
      }));
    const failures = results.filter((r) => r.status === 'invalid' || r.status === 'failed');
    const healthy = results.filter((r) => r.status === 'healthy').length;
    const anomalies = results.filter((r) => r.status === 'anomaly').length;

    const summary = {
      processed: batch.length,
      healthy,
      anomalies,
      failed: failures.length,
      alerts,
      failures,
    };

    logger.info('batch processed', {
      processed: summary.processed,
      healthy,
      anomalies,
      failed: summary.failed,
    });

    return summary;
  }

  return { processBatch };
}

const monitorService = createMonitorService({
  aiAlert: require('./aiAlert.service').aiAlertService,
  repository: require('../repositories/alert.repository').alertRepository,
});

module.exports = { createMonitorService, monitorService };

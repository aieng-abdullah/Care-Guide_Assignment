/**
 * services/detector.service.js
 * Runs the rule registry against one API response and combines triggered rules into one anomaly result. Exports detectAnomalies, SEVERITY_RANK.
 */
const { rules } = require('./rules');

/** Severity ordering used to pick the combined alert severity. */
const SEVERITY_RANK = Object.freeze({ warning: 1, critical: 2 });

/**
 * Returns the combined anomaly result for one API response, or null when healthy.
 * Result shape: { api_name, rules_triggered, severity, metrics }.
 */
function detectAnomalies(record, thresholds) {
  const triggered = [];
  let severity = null;

  for (const rule of rules) {
    const hit = rule.check(record, thresholds);
    if (!hit) continue;
    triggered.push(hit.ruleId);
    if (!severity || SEVERITY_RANK[hit.severity] > SEVERITY_RANK[severity]) {
      severity = hit.severity;
    }
  }

  if (triggered.length === 0) return null;

  return {
    api_name: record.api_name,
    rules_triggered: triggered,
    severity,
    metrics: {
      response_time_ms: record.response_time_ms,
      status_code: record.status_code,
      records_returned: record.records_returned ?? null,
    },
  };
}

module.exports = { detectAnomalies, SEVERITY_RANK };

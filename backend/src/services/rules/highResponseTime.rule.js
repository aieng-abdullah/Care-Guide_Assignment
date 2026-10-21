/**
 * services/rules/highResponseTime.rule.js
 * HIGH_RESPONSE_TIME rule: warning above warn threshold, critical above critical threshold. Exports id, check.
 */

/** Evaluates response time against warn/crit thresholds; returns an anomaly descriptor or null. */
function check(record, thresholds) {
  const { warnMs, critMs } = thresholds.responseTime;
  const ms = record.response_time_ms;
  if (typeof ms !== 'number' || Number.isNaN(ms)) return null;
  if (ms > critMs) return { ruleId: 'HIGH_RESPONSE_TIME', severity: 'critical' };
  if (ms > warnMs) return { ruleId: 'HIGH_RESPONSE_TIME', severity: 'warning' };
  return null;
}

module.exports = { id: 'HIGH_RESPONSE_TIME', check };

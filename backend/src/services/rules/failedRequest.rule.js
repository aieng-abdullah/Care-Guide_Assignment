/**
 * services/rules/failedRequest.rule.js
 * FAILED_REQUEST rule: critical anomaly on HTTP 5xx status. Exports id, check.
 */

/** Evaluates a 5xx status; returns an anomaly descriptor or null. */
function check(record) {
  if (record.status_code >= 500) {
    return { ruleId: 'FAILED_REQUEST', severity: 'critical' };
  }
  return null;
}

module.exports = { id: 'FAILED_REQUEST', check };

/**
 * services/rules/clientError.rule.js
 * CLIENT_ERROR rule: warning anomaly on HTTP 4xx status. Exports id, check.
 */

/** Evaluates a 4xx status; returns an anomaly descriptor or null. */
function check(record) {
  const { status_code: status } = record;
  if (status >= 400 && status <= 499) {
    return { ruleId: 'CLIENT_ERROR', severity: 'warning' };
  }
  return null;
}

module.exports = { id: 'CLIENT_ERROR', check };

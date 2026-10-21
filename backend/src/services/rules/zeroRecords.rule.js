/**
 * services/rules/zeroRecords.rule.js
 * ZERO_RECORDS rule: warning anomaly when a 2xx response returns zero records. Exports id, check.
 */

/** Evaluates zero records on a 2xx response; returns an anomaly descriptor or null. */
function check(record) {
  const { status_code: status, records_returned: records } = record;
  const is2xx = status >= 200 && status < 300;
  if (is2xx && records === 0) {
    return { ruleId: 'ZERO_RECORDS', severity: 'warning' };
  }
  return null;
}

module.exports = { id: 'ZERO_RECORDS', check };

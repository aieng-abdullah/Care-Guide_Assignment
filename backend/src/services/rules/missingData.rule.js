/**
 * services/rules/missingData.rule.js
 * MISSING_DATA rule: warning anomaly when records_returned is missing or null. Exports id, check.
 */

/** Evaluates missing/null record counts; returns an anomaly descriptor or null. */
function check(record) {
  if (record.records_returned === undefined || record.records_returned === null) {
    return { ruleId: 'MISSING_DATA', severity: 'warning' };
  }
  return null;
}

module.exports = { id: 'MISSING_DATA', check };

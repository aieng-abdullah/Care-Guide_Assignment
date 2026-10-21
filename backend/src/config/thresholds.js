/**
 * config/thresholds.js
 * Detection thresholds loaded from environment variables. Exports thresholds.
 */
const warnMs = Number.parseInt(process.env.THRESHOLD_RESPONSE_WARN_MS || '3000', 10);
const critMs = Number.parseInt(process.env.THRESHOLD_RESPONSE_CRIT_MS || '5000', 10);

if (Number.isNaN(warnMs) || Number.isNaN(critMs) || warnMs >= critMs) {
  throw new Error(
    'Response-time thresholds invalid: THRESHOLD_RESPONSE_WARN_MS and THRESHOLD_RESPONSE_CRIT_MS must be integers with warn < crit'
  );
}

/** Returns the frozen detection threshold set. */
const thresholds = Object.freeze({
  responseTime: Object.freeze({
    warnMs,
    critMs,
  }),
  maxBatchSize: 100,
});

module.exports = { thresholds };

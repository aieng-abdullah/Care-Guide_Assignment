/**
 * utils/fingerprint.js
 * Builds a stable dedup fingerprint from api_name plus sorted triggered rules. Exports buildFingerprint.
 */
const { createHash } = require('crypto');

/** Returns a sha256 hex fingerprint of api_name and its sorted rule set. */
function buildFingerprint(apiName, rulesTriggered) {
  const key = `${apiName}|${[...rulesTriggered].sort().join(',')}`;
  return createHash('sha256').update(key).digest('hex');
}

module.exports = { buildFingerprint };

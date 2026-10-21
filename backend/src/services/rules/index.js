/**
 * services/rules/index.js
 * Rule registry: ordered list of pure detection rule modules. Exports rules.
 */
const highResponseTime = require('./highResponseTime.rule');
const failedRequest = require('./failedRequest.rule');
const clientError = require('./clientError.rule');
const zeroRecords = require('./zeroRecords.rule');
const missingData = require('./missingData.rule');

/** Frozen registry of detection rules; adding a rule is one new file plus one entry here. */
const rules = Object.freeze([
  highResponseTime,
  failedRequest,
  clientError,
  zeroRecords,
  missingData,
]);

module.exports = { rules };

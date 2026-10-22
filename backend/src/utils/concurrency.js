/**
 * utils/concurrency.js
 * Bounded-concurrency helper wrapping p-limit. Exports mapWithConcurrency.
 */
const pLimit = require('p-limit');

/**
 * Maps items through fn with at most `concurrency` parallel calls,
 * preserving input order in the results array.
 */
async function mapWithConcurrency(items, concurrency, fn) {
  const limit = pLimit(Math.max(1, concurrency));
  return Promise.all(items.map((item, index) => limit(() => fn(item, index))));
}

module.exports = { mapWithConcurrency };

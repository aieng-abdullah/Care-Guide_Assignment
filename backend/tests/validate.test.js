/**
 * tests/validate.test.js
 * Unit tests for the Zod batch validation middleware: valid payloads pass, malformed and unknown fields 400.
 */
const { monitorBatchSchema, validateBatch } = require('../src/middleware/validate');

const validBatch = [
  { api_name: 'PatientDataAPI', response_time_ms: 1200, status_code: 200, records_returned: 50 },
];

/** Minimal express-like res/next doubles capturing the result. */
function run(body) {
  const req = { body };
  let nextErr = null;
  let nextCalled = false;
  const next = (err) => {
    nextCalled = true;
    nextErr = err || null;
  };
  validateBatch(req, {}, next);
  return { req, nextErr, nextCalled };
}

describe('monitorBatchSchema', () => {
  test('valid batch passes', () => {
    expect(monitorBatchSchema.safeParse(validBatch).success).toBe(true);
  });

  test('null records_returned passes (MISSING_DATA handles it)', () => {
    const batch = [{ ...validBatch[0], records_returned: null }];
    expect(monitorBatchSchema.safeParse(batch).success).toBe(true);
  });

  test('missing records_returned passes', () => {
    const rest = { ...validBatch[0] };
    delete rest.records_returned;
    expect(monitorBatchSchema.safeParse([rest]).success).toBe(true);
  });

  test('bad api_name charset fails', () => {
    const batch = [{ ...validBatch[0], api_name: 'bad$name!' }];
    expect(monitorBatchSchema.safeParse(batch).success).toBe(false);
  });

  test('status_code out of range fails', () => {
    const batch = [{ ...validBatch[0], status_code: 99 }];
    expect(monitorBatchSchema.safeParse(batch).success).toBe(false);
  });

  test('unknown field fails', () => {
    const batch = [{ ...validBatch[0], extra: true }];
    expect(monitorBatchSchema.safeParse(batch).success).toBe(false);
  });

  test('empty batch fails', () => {
    expect(monitorBatchSchema.safeParse([]).success).toBe(false);
  });
});

describe('validateBatch middleware', () => {
  test('valid body calls next without error and keeps data', () => {
    const { req, nextErr, nextCalled } = run(validBatch);
    expect(nextCalled).toBe(true);
    expect(nextErr).toBeNull();
    expect(req.body).toEqual(validBatch);
  });

  test('invalid body calls next with 400 field details', () => {
    const { nextErr, nextCalled } = run([{ api_name: 'x', response_time_ms: -1, status_code: 999 }]);
    expect(nextCalled).toBe(true);
    expect(nextErr.status).toBe(400);
    expect(nextErr.code).toBe('VALIDATION_ERROR');
    expect(nextErr.details.length).toBeGreaterThan(0);
  });
});

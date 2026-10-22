/**
 * tests/validate.test.js
 * Unit tests for batch shape validation and the per-item record schema.
 */
const { monitorBatchSchema, apiResponseSchema, validateBatch } = require('../src/middleware/validate');

const validRecord = {
  api_name: 'PatientDataAPI',
  response_time_ms: 1200,
  status_code: 200,
  records_returned: 50,
};

/** Minimal express-like next double capturing the result. */
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

describe('apiResponseSchema', () => {
  test('valid record passes', () => {
    expect(apiResponseSchema.safeParse(validRecord).success).toBe(true);
  });

  test('null records_returned passes (MISSING_DATA handles it)', () => {
    expect(apiResponseSchema.safeParse({ ...validRecord, records_returned: null }).success).toBe(true);
  });

  test('missing records_returned passes', () => {
    const rest = { ...validRecord };
    delete rest.records_returned;
    expect(apiResponseSchema.safeParse(rest).success).toBe(true);
  });

  test('bad api_name charset fails', () => {
    expect(apiResponseSchema.safeParse({ ...validRecord, api_name: 'bad$name!' }).success).toBe(false);
  });

  test('status_code out of range fails', () => {
    expect(apiResponseSchema.safeParse({ ...validRecord, status_code: 99 }).success).toBe(false);
  });

  test('unknown field fails', () => {
    expect(apiResponseSchema.safeParse({ ...validRecord, extra: true }).success).toBe(false);
  });

  test('negative response_time_ms fails', () => {
    expect(apiResponseSchema.safeParse({ ...validRecord, response_time_ms: -1 }).success).toBe(false);
  });
});

describe('monitorBatchSchema and validateBatch middleware', () => {
  test('valid batch array passes the middleware', () => {
    const { nextErr, nextCalled } = run([validRecord]);
    expect(nextCalled).toBe(true);
    expect(nextErr).toBeNull();
  });

  test('mixed batch passes shape check (per-item handling is the service job)', () => {
    const { nextErr } = run([validRecord, { broken: true }]);
    expect(nextErr).toBeNull();
  });

  test('non-array body fails with 400', () => {
    const { nextErr } = run({ api_name: 'x' });
    expect(nextErr.status).toBe(400);
    expect(nextErr.code).toBe('VALIDATION_ERROR');
  });

  test('empty array fails with 400', () => {
    const { nextErr } = run([]);
    expect(nextErr.status).toBe(400);
  });

  test('oversized batch fails with 400', () => {
    const batch = Array.from({ length: 101 }, () => ({ ...validRecord }));
    const { nextErr } = run(batch);
    expect(nextErr.status).toBe(400);
  });

  test('monitorBatchSchema accepts a valid array', () => {
    expect(monitorBatchSchema.safeParse([validRecord]).success).toBe(true);
  });
});

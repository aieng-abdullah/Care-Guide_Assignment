/**
 * tests/rules.test.js
 * Unit tests for every detection rule and the combined detector, including threshold edges and the sample inputs.
 */
const { detectAnomalies } = require('../src/services/detector.service');
const { buildFingerprint } = require('../src/utils/fingerprint');
const { rules } = require('../src/services/rules');

const thresholds = { responseTime: { warnMs: 3000, critMs: 5000 } };

/** Builds a fully valid healthy record, overridden per test. */
const record = (overrides = {}) => ({
  api_name: 'TestAPI',
  response_time_ms: 100,
  status_code: 200,
  records_returned: 10,
  ...overrides,
});

describe('HIGH_RESPONSE_TIME', () => {
  const rule = rules.find((r) => r.id === 'HIGH_RESPONSE_TIME');

  test('healthy below warn threshold', () => {
    expect(rule.check(record({ response_time_ms: 3000 }), thresholds)).toBeNull();
  });

  test('exactly at warn threshold is not an anomaly', () => {
    expect(rule.check(record({ response_time_ms: 3000 }), thresholds)).toBeNull();
  });

  test('just above warn threshold is warning', () => {
    expect(rule.check(record({ response_time_ms: 3001 }), thresholds)).toEqual({
      ruleId: 'HIGH_RESPONSE_TIME',
      severity: 'warning',
    });
  });

  test('exactly at crit threshold is still warning', () => {
    expect(rule.check(record({ response_time_ms: 5000 }), thresholds)).toEqual({
      ruleId: 'HIGH_RESPONSE_TIME',
      severity: 'warning',
    });
  });

  test('above crit threshold is critical', () => {
    expect(rule.check(record({ response_time_ms: 5001 }), thresholds)).toEqual({
      ruleId: 'HIGH_RESPONSE_TIME',
      severity: 'critical',
    });
  });
});

describe('FAILED_REQUEST', () => {
  const rule = rules.find((r) => r.id === 'FAILED_REQUEST');

  test('499 is not failed', () => {
    expect(rule.check(record({ status_code: 499 }))).toBeNull();
  });

  test('500 is critical', () => {
    expect(rule.check(record({ status_code: 500 }))).toEqual({
      ruleId: 'FAILED_REQUEST',
      severity: 'critical',
    });
  });

  test('503 is critical', () => {
    expect(rule.check(record({ status_code: 503 }))).toEqual({
      ruleId: 'FAILED_REQUEST',
      severity: 'critical',
    });
  });
});

describe('CLIENT_ERROR', () => {
  const rule = rules.find((r) => r.id === 'CLIENT_ERROR');

  test('399 is not a client error', () => {
    expect(rule.check(record({ status_code: 399 }))).toBeNull();
  });

  test('400 is warning', () => {
    expect(rule.check(record({ status_code: 400 }))).toEqual({
      ruleId: 'CLIENT_ERROR',
      severity: 'warning',
    });
  });

  test('404 is warning', () => {
    expect(rule.check(record({ status_code: 404 }))).toEqual({
      ruleId: 'CLIENT_ERROR',
      severity: 'warning',
    });
  });

  test('499 is warning', () => {
    expect(rule.check(record({ status_code: 499 }))).toEqual({
      ruleId: 'CLIENT_ERROR',
      severity: 'warning',
    });
  });

  test('500 is not a client error', () => {
    expect(rule.check(record({ status_code: 500 }))).toBeNull();
  });
});

describe('ZERO_RECORDS', () => {
  const rule = rules.find((r) => r.id === 'ZERO_RECORDS');

  test('zero records on 200 is warning', () => {
    expect(rule.check(record({ records_returned: 0 }))).toEqual({
      ruleId: 'ZERO_RECORDS',
      severity: 'warning',
    });
  });

  test('zero records on 204 is warning', () => {
    expect(rule.check(record({ status_code: 204, records_returned: 0 }))).toEqual({
      ruleId: 'ZERO_RECORDS',
      severity: 'warning',
    });
  });

  test('zero records on 500 is not this rule (failed request covers it)', () => {
    expect(rule.check(record({ status_code: 500, records_returned: 0 }))).toBeNull();
  });

  test('positive records on 2xx is clean', () => {
    expect(rule.check(record({ records_returned: 1 }))).toBeNull();
  });
});

describe('MISSING_DATA', () => {
  const rule = rules.find((r) => r.id === 'MISSING_DATA');

  test('null records is warning', () => {
    expect(rule.check(record({ records_returned: null }))).toEqual({
      ruleId: 'MISSING_DATA',
      severity: 'warning',
    });
  });

  test('undefined records is warning', () => {
    const rec = record();
    delete rec.records_returned;
    expect(rule.check(rec)).toEqual({ ruleId: 'MISSING_DATA', severity: 'warning' });
  });

  test('zero records is not missing', () => {
    expect(rule.check(record({ records_returned: 0 }))).toBeNull();
  });
});

describe('detectAnomalies', () => {
  test('healthy record produces no anomaly', () => {
    expect(detectAnomalies(record(), thresholds)).toBeNull();
  });

  test('assignment sample healthy input produces no anomaly', () => {
    expect(
      detectAnomalies(
        { api_name: 'PatientDataAPI', response_time_ms: 1200, status_code: 200, records_returned: 50 },
        thresholds
      )
    ).toBeNull();
  });

  test('assignment sample 500 with 0 records is critical with both rules', () => {
    const result = detectAnomalies(
      { api_name: 'AppointmentAPI', response_time_ms: 5500, status_code: 500, records_returned: 0 },
      thresholds
    );
    expect(result).toEqual({
      api_name: 'AppointmentAPI',
      rules_triggered: ['HIGH_RESPONSE_TIME', 'FAILED_REQUEST'],
      severity: 'critical',
      metrics: { response_time_ms: 5500, status_code: 500, records_returned: 0 },
    });
  });

  test('multiple rules combine into one result with highest severity', () => {
    const result = detectAnomalies(
      record({ response_time_ms: 4000, status_code: 200, records_returned: 0 }),
      thresholds
    );
    expect(result.rules_triggered).toEqual(['HIGH_RESPONSE_TIME', 'ZERO_RECORDS']);
    expect(result.severity).toBe('warning');
  });

  test('client error combines with missing data', () => {
    const result = detectAnomalies(
      record({ response_time_ms: 200, status_code: 404, records_returned: null }),
      thresholds
    );
    expect(result.rules_triggered).toEqual(['CLIENT_ERROR', 'MISSING_DATA']);
    expect(result.severity).toBe('warning');
  });

  test('critical wins over warning', () => {
    const result = detectAnomalies(
      record({ response_time_ms: 200, status_code: 503, records_returned: null }),
      thresholds
    );
    expect(result.severity).toBe('critical');
    expect(result.rules_triggered).toEqual(['FAILED_REQUEST', 'MISSING_DATA']);
  });
});

describe('buildFingerprint', () => {
  test('same api and rules produce same hash', () => {
    expect(buildFingerprint('A', ['X', 'Y'])).toBe(buildFingerprint('A', ['Y', 'X']));
  });

  test('different rules produce different hashes', () => {
    expect(buildFingerprint('A', ['X'])).not.toBe(buildFingerprint('A', ['X', 'Y']));
  });

  test('different api names produce different hashes', () => {
    expect(buildFingerprint('A', ['X'])).not.toBe(buildFingerprint('B', ['X']));
  });
});

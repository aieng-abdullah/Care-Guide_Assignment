/**
 * tests/fallback.test.js
 * Unit tests for buildFallbackMessage: PRD example wording and per-rule phrasing.
 */
const { buildFallbackMessage } = require('../src/services/aiAlert.service');

describe('buildFallbackMessage', () => {
  it('matches the PRD example sentence for the 500/0-records anomaly', () => {
    const message = buildFallbackMessage({
      api_name: 'AppointmentAPI',
      rules_triggered: ['HIGH_RESPONSE_TIME', 'FAILED_REQUEST'],
      severity: 'critical',
      metrics: { response_time_ms: 5500, status_code: 500, records_returned: 0 },
    });
    expect(message).toBe(
      'AppointmentAPI failed with status 500, was slow (5500 ms), returned 0 records. Possible outage or data issue.'
    );
  });

  it('phrases a client error as returned status without a record clause', () => {
    const message = buildFallbackMessage({
      api_name: 'PatientDataAPI',
      rules_triggered: ['CLIENT_ERROR'],
      severity: 'warning',
      metrics: { response_time_ms: 800, status_code: 404, records_returned: 10 },
    });
    expect(message).toBe(
      'PatientDataAPI returned status 404. Possible outage or data issue.'
    );
  });

  it('phrases missing records as unknown record count', () => {
    const message = buildFallbackMessage({
      api_name: 'LabResultsAPI',
      rules_triggered: ['MISSING_DATA'],
      severity: 'warning',
      metrics: { response_time_ms: 400, status_code: 200, records_returned: null },
    });
    expect(message).toBe(
      'LabResultsAPI returned an unknown record count. Possible outage or data issue.'
    );
  });

  it('always ends with the likely-cause sentence', () => {
    const message = buildFallbackMessage({
      api_name: 'BillingAPI',
      rules_triggered: ['FAILED_REQUEST'],
      severity: 'critical',
      metrics: { response_time_ms: 100, status_code: 503, records_returned: 0 },
    });
    expect(message).toMatch(/Possible outage or data issue\.$/);
  });
});

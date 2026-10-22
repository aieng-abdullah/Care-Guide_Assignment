/**
 * tests/api.integration.test.js
 * Integration tests for POST /monitor and GET /alerts against a real MongoDB, with the OpenAI client mocked.
 */
process.env.LOG_LEVEL = 'error';
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/api-monitor-test';
process.env.RATE_LIMIT_MAX = '1000';

const mongoose = require('mongoose');
const request = require('supertest');

const mockLlmResponse = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockLlmResponse,
      },
    },
  }));
});

const { app } = require('../src/app');
const { Alert } = require('../src/models/alert.model');

const healthy = { api_name: 'PatientDataAPI', response_time_ms: 1200, status_code: 200, records_returned: 50 };
const failing = { api_name: 'AppointmentAPI', response_time_ms: 5500, status_code: 500, records_returned: 0 };

/** Wraps text in the OpenAI chat response shape. */
const llmText = (text) => ({
  choices: [{ message: { content: text } }],
});

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Alert.deleteMany({});
  mockLlmResponse.mockResolvedValue(
    llmText('AppointmentAPI failed with status 500 and returned 0 records. Possible outage or data issue.')
  );
});

afterAll(async () => {
  await Alert.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Alert.deleteMany({});
  mockLlmResponse.mockClear();
  mockLlmResponse.mockResolvedValue(
    llmText('AppointmentAPI failed with status 500 and returned 0 records. Possible outage or data issue.')
  );
});

describe('POST /monitor', () => {
  test('processes the assignment batch with correct summary', async () => {
    const res = await request(app).post('/monitor').send([healthy, failing]).expect(200);

    expect(res.body.processed).toBe(2);
    expect(res.body.healthy).toBe(1);
    expect(res.body.anomalies).toBe(1);
    expect(res.body.failed).toBe(0);
    expect(res.body.alerts).toHaveLength(1);
    expect(res.body.alerts[0]).toMatchObject({
      api_name: 'AppointmentAPI',
      severity: 'critical',
      alert_source: 'llm',
    });
    expect(res.body.alerts[0].message).toContain('AppointmentAPI');

    const stored = await Alert.find({}).lean();
    expect(stored).toHaveLength(1);
    expect(stored[0].status).toBe('active');
    expect(stored[0].occurrences).toBe(1);
  });

  test('healthy-only batch creates no alerts', async () => {
    const res = await request(app).post('/monitor').send([healthy]).expect(200);
    expect(res.body.anomalies).toBe(0);
    expect(res.body.alerts).toHaveLength(0);
    expect(mockLlmResponse).not.toHaveBeenCalled();
  });

  test('uses fallback message when the LLM fails', async () => {
    mockLlmResponse.mockRejectedValue(new Error('LLM down'));

    const res = await request(app).post('/monitor').send([failing]).expect(200);

    expect(res.body.alerts[0].alert_source).toBe('fallback');
    expect(res.body.alerts[0].message).toContain('Possible outage or data issue');

    const stored = await Alert.findOne({}).lean();
    expect(stored.alert_source).toBe('fallback');
  });

  test('uses fallback when the LLM returns empty text', async () => {
    mockLlmResponse.mockResolvedValue(llmText(''));

    const res = await request(app).post('/monitor').send([failing]).expect(200);
    expect(res.body.alerts[0].alert_source).toBe('fallback');
  });

  test('a bad item does not block valid items', async () => {
    const badItem = { api_name: 'bad$name!', response_time_ms: -5, status_code: 999 };
    const res = await request(app).post('/monitor').send([healthy, badItem, failing]).expect(200);

    expect(res.body.processed).toBe(3);
    expect(res.body.healthy).toBe(1);
    expect(res.body.anomalies).toBe(1);
    expect(res.body.failed).toBe(1);
    expect(res.body.failures[0].status).toBe('invalid');
    expect(res.body.failures[0].index).toBe(1);
  });

  test('deduplicates: second identical anomaly increments occurrences', async () => {
    await request(app).post('/monitor').send([failing]).expect(200);
    await request(app).post('/monitor').send([failing]).expect(200);

    const stored = await Alert.find({}).lean();
    expect(stored).toHaveLength(1);
    expect(stored[0].occurrences).toBe(2);
    expect(new Date(stored[0].last_seen).getTime()).toBeGreaterThanOrEqual(
      new Date(stored[0].created_at).getTime()
    );
  });

  test('invalid body shape returns 400 with standard error', async () => {
    const res = await request(app).post('/monitor').send({ not: 'array' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error).toHaveProperty('message');
    expect(res.body.error).toHaveProperty('details');
  });
});

describe('GET /alerts', () => {
  test('returns only active alerts, filters by severity, paginates', async () => {
    await request(app).post('/monitor').send([failing]).expect(200);
    await request(app).post('/monitor').send([
      { api_name: 'SlowAPI', response_time_ms: 4000, status_code: 200, records_returned: 10 },
    ]).expect(200);

    const all = await request(app).get('/alerts').expect(200);
    expect(all.body.total).toBe(2);
    expect(all.body.data.every((a) => a.status === 'active')).toBe(true);

    const critical = await request(app).get('/alerts?severity=critical').expect(200);
    expect(critical.body.total).toBe(1);
    expect(critical.body.data[0].api_name).toBe('AppointmentAPI');

    const byApi = await request(app).get('/alerts?api_name=SlowAPI').expect(200);
    expect(byApi.body.total).toBe(1);

    const paged = await request(app).get('/alerts?page=1&limit=1').expect(200);
    expect(paged.body.data).toHaveLength(1);
    expect(paged.body.limit).toBe(1);
  });

  test('rejects bad severity with 400', async () => {
    const res = await request(app).get('/alerts?severity=bogus').expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /alerts/:id/resolve', () => {
  test('resolves an active alert and drops it from GET /alerts', async () => {
    const created = await request(app).post('/monitor').send([failing]).expect(200);
    const alert = await Alert.findOne({}).lean();

    const res = await request(app).patch(`/alerts/${alert._id}/resolve`).expect(200);
    expect(res.body.status).toBe('resolved');
    expect(res.body.resolved_at).toBeTruthy();

    const list = await request(app).get('/alerts').expect(200);
    expect(list.body.total).toBe(0);

    const again = await request(app).patch(`/alerts/${alert._id}/resolve`).expect(200);
    expect(again.body.already_resolved).toBe(true);
    expect(created.body.anomalies).toBe(1);
  });

  test('unknown id returns 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).patch(`/alerts/${fakeId}/resolve`).expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

/**
 * api.js
 * Fetch helpers for the monitor backend. Exports fetchAlerts, submitMonitorBatch, resolveAlert.
 */

/** Normalizes backend errors into a user-facing message. */
function toError(payload, status) {
  const message = payload?.error?.message || `Request failed (${status})`;
  const error = new Error(message);
  error.status = status;
  error.details = payload?.error?.details || [];
  return error;
}

/** Fetches active alerts with optional severity/api_name filters. */
export async function fetchAlerts({ severity = '', api_name = '', page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (severity) params.set('severity', severity);
  if (api_name) params.set('api_name', api_name);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const res = await fetch(`/alerts?${params.toString()}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw toError(body, res.status);
  return body;
}

/** Submits a batch of API responses to POST /monitor. */
export async function submitMonitorBatch(rawJson) {
  let payload;
  try {
    payload = JSON.parse(rawJson);
  } catch {
    const error = new Error('Input is not valid JSON');
    error.status = 400;
    throw error;
  }
  const res = await fetch('/monitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw toError(body, res.status);
  return body;
}

/** Marks an alert as resolved. */
export async function resolveAlert(id) {
  const res = await fetch(`/alerts/${id}/resolve`, { method: 'PATCH' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw toError(body, res.status);
  return body;
}

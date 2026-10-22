/**
 * MonitorForm.jsx
 * Textarea to paste a JSON batch and submit it to POST /monitor; shows the run summary.
 */
import { useState } from 'react';
import { submitMonitorBatch } from '../api.js';

const PLACEHOLDER = `[
  {
    "api_name": "PatientDataAPI",
    "response_time_ms": 1200,
    "status_code": 200,
    "records_returned": 50
  },
  {
    "api_name": "AppointmentAPI",
    "response_time_ms": 5500,
    "status_code": 500,
    "records_returned": 0
  }
]`;

/** JSON paste-and-submit form for POST /monitor. */
export default function MonitorForm({ onSubmitted, onError }) {
  const [text, setText] = useState(PLACEHOLDER);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState(null);

  /** Parses and submits the batch, then reports per-item errors. */
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setResult(null);
    try {
      const summary = await submitMonitorBatch(text);
      setResult(summary);
      if (summary.failed > 0) {
        const detail = (summary.failures || [])
          .map((f) => `item ${f.index}: ${f.error || (f.details || []).map((d) => d.message).join(', ')}`)
          .join('; ');
        onError?.(detail || `${summary.failed} item(s) failed validation`);
      } else {
        onError?.(null);
      }
      await onSubmitted?.();
    } catch (err) {
      setFormError(err.details?.map((d) => `${d.path}: ${d.message}`).join('; ') || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="monitor-form" onSubmit={handleSubmit}>
      <textarea
        rows={12}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="API responses JSON"
        spellCheck={false}
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit to /monitor'}
      </button>
      {formError && <p className="error" role="alert">{formError}</p>}
      {result && (
        <p className="result">
          Processed {result.processed} · Healthy {result.healthy} · Anomalies {result.anomalies} · Failed {result.failed}
        </p>
      )}
    </form>
  );
}

/**
 * AlertCard.jsx
 * Single alert: API name, severity badge, AI message, metrics, rules, timestamps, resolve button.
 */

/** Formats an ISO timestamp for display, falling back to a dash. */
function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

/** Renders one active alert card. */
export default function AlertCard({ alert, resolving, onResolve }) {
  const m = alert.metrics || {};
  return (
    <li className={`alert-card severity-${alert.severity}`}>
      <div className="alert-card-head">
        <h3>{alert.api_name}</h3>
        <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
        {alert.occurrences > 1 && <span className="occurrences">×{alert.occurrences}</span>}
      </div>
      <p className="alert-message">{alert.message}</p>
      <p className="alert-metrics">
        status {m.status_code ?? '—'} · {m.response_time_ms ?? '—'} ms · {m.records_returned ?? '—'} records
      </p>
      <p className="alert-rules">
        Rules: {(alert.rules_triggered || []).join(', ') || '—'}
        {alert.alert_source === 'fallback' && <span className="fallback-tag"> (template)</span>}
      </p>
      <div className="alert-card-foot">
        <span className="muted">First seen {formatTime(alert.created_at)} · Last seen {formatTime(alert.last_seen)}</span>
        <button type="button" disabled={resolving} onClick={() => onResolve(alert._id)}>
          {resolving ? 'Resolving…' : 'Resolve'}
        </button>
      </div>
    </li>
  );
}

/**
 * Filters.jsx
 * Severity/API-name filters plus auto-refresh toggle and manual refresh button.
 */

/** Renders the filter controls row. */
export default function Filters({
  severity,
  apiName,
  autoRefresh,
  onSeverityChange,
  onApiNameChange,
  onAutoRefreshChange,
  onRefresh,
}) {
  return (
    <div className="filters">
      <label>
        Severity
        <select value={severity} onChange={(e) => onSeverityChange(e.target.value)}>
          <option value="">All</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
        </select>
      </label>
      <label>
        API name
        <input
          type="text"
          value={apiName}
          placeholder="e.g. PatientDataAPI"
          onChange={(e) => onApiNameChange(e.target.value.trim())}
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(e) => onAutoRefreshChange(e.target.checked)}
        />
        Auto-refresh (10s)
      </label>
      <button type="button" onClick={onRefresh}>Refresh now</button>
    </div>
  );
}

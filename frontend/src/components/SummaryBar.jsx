/**
 * SummaryBar.jsx
 * Displays total, critical, and warning alert counters.
 */

/** Renders the three summary counters. */
export default function SummaryBar({ total, critical, warning }) {
  return (
    <div className="summary">
      <span className="chip chip-total">Total: {total}</span>
      <span className="chip chip-critical">Critical: {critical}</span>
      <span className="chip chip-warning">Warning: {warning}</span>
    </div>
  );
}

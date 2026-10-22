/**
 * AlertList.jsx
 * Renders loading, empty, or the list of AlertCard items.
 */
import AlertCard from './AlertCard.jsx';

/** Chooses loading/empty/list state for active alerts. */
export default function AlertList({ alerts, loading, resolving, onResolve }) {
  if (loading && alerts.length === 0) return <p className="muted">Loading alerts…</p>;
  if (alerts.length === 0) return <p className="muted">No active alerts. All clear.</p>;
  return (
    <ul className="alert-list">
      {alerts.map((alert) => (
        <AlertCard
          key={alert._id}
          alert={alert}
          resolving={resolving === alert._id}
          onResolve={onResolve}
        />
      ))}
    </ul>
  );
}

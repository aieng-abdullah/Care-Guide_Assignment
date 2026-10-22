/**
 * App.jsx
 * Dashboard shell: loads active alerts, filters, summary, monitor form, resolve actions.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAlerts, resolveAlert } from './api.js';
import SummaryBar from './components/SummaryBar.jsx';
import Filters from './components/Filters.jsx';
import AlertList from './components/AlertList.jsx';
import MonitorForm from './components/MonitorForm.jsx';

const REFRESH_MS = 10000;

/** Top-level dashboard component. */
export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severity, setSeverity] = useState('');
  const [apiName, setApiName] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [resolving, setResolving] = useState(null);
  const filtersRef = useRef({ severity, apiName });
  filtersRef.current = { severity, apiName };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchAlerts({
        severity: filtersRef.current.severity,
        api_name: filtersRef.current.apiName,
      });
      setAlerts(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, severity, apiName]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [autoRefresh, load]);

  /** Resolves one alert then reloads the list. */
  async function handleResolve(id) {
    setResolving(id);
    setError(null);
    try {
      await resolveAlert(id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setResolving(null);
    }
  }

  const critical = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <div className="app">
      <header className="app-header">
        <h1>API Monitor</h1>
        <SummaryBar total={alerts.length} critical={critical} warning={alerts.length - critical} />
      </header>

      <main className="app-main">
        <section className="panel">
          <h2>Active alerts</h2>
          <Filters
            severity={severity}
            apiName={apiName}
            autoRefresh={autoRefresh}
            onSeverityChange={setSeverity}
            onApiNameChange={setApiName}
            onAutoRefreshChange={setAutoRefresh}
            onRefresh={load}
          />
          {error && <p className="error" role="alert">{error}</p>}
          <AlertList alerts={alerts} loading={loading} resolving={resolving} onResolve={handleResolve} />
        </section>

        <section className="panel">
          <h2>Submit API responses</h2>
          <MonitorForm onSubmitted={load} onError={setError} />
        </section>
      </main>
    </div>
  );
}

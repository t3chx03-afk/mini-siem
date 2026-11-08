import { useEffect, useState } from 'react';
import './App.css';

const formatTime = (ts) => new Date(ts).toLocaleTimeString('pt-PT');
const formatDateTime = (ts) => new Date(ts).toLocaleString('pt-PT');

export default function App() {
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [topIps, setTopIps] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [now, setNow] = useState(new Date());

  // Relógio: atualiza a cada segundo
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Dados: vai buscar à API a cada 5 segundos
  useEffect(() => {
    async function load() {
      try {
        const get = (url) =>
          fetch(url).then((r) => {
            if (!r.ok) throw new Error(`${url}: ${r.status}`);
            return r.json();
          });

        const [e, a, t, s] = await Promise.all([
          get('/api/events?limit=25'),
          get('/api/alerts?limit=10'),
          get('/api/stats/top-ips'),
          get('/api/stats/summary'),
        ]);
        setEvents(e);
        setAlerts(a);
        setTopIps(t);
        setSummary(s);
        setError(null);
        setUpdatedAt(new Date());
      } catch (err) {
        setError(`Não foi possível ligar à API (${err.message})`);
      }
    }

    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const secondsAgo = updatedAt ? Math.floor((now - updatedAt) / 1000) : null;
  const stale = secondsAgo !== null && secondsAgo > 15;
  const maxAttempts = Math.max(1, ...topIps.map((t) => t.tentativas));

  return (
    <div className="app">
      <header className="header">
        <h1>Mini-SIEM · macmini</h1>
        <span className="status">
          <span className={error ? 'dot off' : stale ? 'dot stale' : 'dot'} />
          {formatTime(now)}
          {secondsAgo !== null ? ` · dados de há ${secondsAgo}s` : ' · a carregar...'}
        </span>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="stats">
        <Stat label="Eventos registados" value={summary?.total_events} />
        <Stat label="Falhas (24 h)" value={summary?.failed_24h} tone="red" />
        <Stat label="Alertas (24 h)" value={summary?.alerts_24h} tone="amber" />
        <Stat label="IPs atacantes" value={summary?.unique_ips} />
      </section>

      <div className="grid">
        <section className="panel">
          <h2>Últimos eventos</h2>
          {events.length === 0 ? (
            <p className="empty">Sem eventos.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Hora</th><th>Tipo</th><th>Utilizador</th><th>IP</th><th>Porta</th></tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td>{formatTime(ev.ts)}</td>
                    <td><span className={`badge ${ev.type}`}>{ev.type}</span></td>
                    <td>{ev.username || '(vazio)'}</td>
                    <td>{ev.ip}</td>
                    <td>{ev.port}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div className="side">
          <section className="panel">
            <h2>Alertas</h2>
            {alerts.length === 0 ? (
              <p className="empty">Sem alertas.</p>
            ) : (
              <table>
                <thead>
                  <tr><th>Quando</th><th>IP</th><th>Tent.</th></tr>
                </thead>
                <tbody>
                  {alerts.map((al) => (
                    <tr key={al.id} className="alert-row" title={al.rule}>
                      <td>{formatDateTime(al.last_seen)}</td>
                      <td>{al.ip}</td>
                      <td>{al.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="panel">
            <h2>Top IPs</h2>
            {topIps.length === 0 ? (
              <p className="empty">Sem dados.</p>
            ) : (
              <table>
                <tbody>
                  {topIps.map((t) => (
                    <tr key={t.ip}>
                      <td>{t.ip}</td>
                      <td className="bar-cell">
                        <div
                          className="bar"
                          style={{ width: `${(t.tentativas / maxAttempts) * 100}%` }}
                        />
                      </td>
                      <td>{t.tentativas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${tone || ''}`}>{value ?? '–'}</div>
    </div>
  );
}
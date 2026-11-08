const express = require('express');
const { pool } = require('./db');

const app = express();
const PORT = 4000;

// Garante que o limit é um número entre 1 e 500
function parseLimit(value, def = 50, max = 500) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return def;
  return Math.min(n, max);
}

// Últimos eventos
app.get('/api/events', async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const [rows] = await pool.query(
      `SELECT id, ts, type, username, method, ip, port
       FROM events ORDER BY ts DESC LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    console.error('[api]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Últimos alertas
app.get('/api/alerts', async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const [rows] = await pool.query(
      `SELECT id, rule, ip, count, first_seen, last_seen
       FROM alerts ORDER BY last_seen DESC LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    console.error('[api]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Top 10 IPs com mais tentativas falhadas
app.get('/api/stats/top-ips', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ip, COUNT(*) AS tentativas
       FROM events
       WHERE type = 'invalid_user'
       GROUP BY ip
       ORDER BY tentativas DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    console.error('[api]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});
// Resumo para os indicadores do topo
app.get('/api/stats/summary', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM events) AS total_events,
        (SELECT COUNT(*) FROM events
           WHERE type = 'invalid_user' AND ts >= NOW() - INTERVAL 24 HOUR) AS failed_24h,
        (SELECT COUNT(*) FROM alerts
           WHERE last_seen >= NOW() - INTERVAL 24 HOUR) AS alerts_24h,
        (SELECT COUNT(DISTINCT ip) FROM events
           WHERE type = 'invalid_user') AS unique_ips
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error('[api]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API a correr na porta ${PORT}`);
});
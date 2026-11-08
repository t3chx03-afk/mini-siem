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

// TODO (desafio): GET /api/stats/top-ips

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API a correr na porta ${PORT}`);
});
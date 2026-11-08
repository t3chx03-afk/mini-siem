const { pool } = require('./db');

const RULE = 'ssh_bruteforce';
const THRESHOLD = 5;        // tentativas
const WINDOW_SECONDS = 60;  // janela de tempo
const COOLDOWN_MINUTES = 10;

async function checkBruteForce(event) {
  if (event.type !== 'invalid_user') return null;

  const ts = new Date(event.timestamp);

  // Quantas falhas este IP teve no último minuto?
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total, MIN(ts) AS first_seen
     FROM events
     WHERE ip = ? AND type = 'invalid_user'
       AND ts >= DATE_SUB(?, INTERVAL ? SECOND)`,
    [event.ip, ts, WINDOW_SECONDS]
  );
  const { total, first_seen } = rows[0];
  if (total < THRESHOLD) return null;

    const [recent] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM alerts
     WHERE rule = ?
       AND ip = ?
       AND last_seen >= DATE_SUB(?, INTERVAL ? MINUTE)`,
    [RULE, event.ip, ts, COOLDOWN_MINUTES]
  );
  if (recent[0].total > 0) return null;

  await pool.execute(
    `INSERT INTO alerts (rule, ip, count, first_seen, last_seen)
     VALUES (?, ?, ?, ?, ?)`,
    [RULE, event.ip, total, first_seen, ts]
  );

  return { rule: RULE, ip: event.ip, count: total };
}

module.exports = { checkBruteForce };
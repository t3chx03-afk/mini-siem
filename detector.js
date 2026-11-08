const { pool } = require('./db');

const COOLDOWN_MINUTES = 10;

// Já existe um alerta desta regra para este IP nos últimos minutos?
async function inCooldown(rule, ip, ts) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM alerts
     WHERE rule = ? AND ip = ? AND last_seen >= DATE_SUB(?, INTERVAL ? MINUTE)`,
    [rule, ip, ts, COOLDOWN_MINUTES]
  );
  return rows[0].total > 0;
}

// Quantas falhas teve este IP na janela de tempo?
async function countFailures(ip, ts, windowSeconds) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total, MIN(ts) AS first_seen FROM events
     WHERE ip = ? AND type = 'invalid_user'
       AND ts >= DATE_SUB(?, INTERVAL ? SECOND)`,
    [ip, ts, windowSeconds]
  );
  return rows[0];
}

async function createAlert(rule, severity, ip, count, firstSeen, ts) {
  await pool.execute(
    `INSERT INTO alerts (rule, severity, ip, count, first_seen, last_seen)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [rule, severity, ip, count, firstSeen ?? ts, ts]
  );
  return { rule, severity, ip, count };
}

// Regra 1: 5+ falhas em 60 s
async function checkBruteForce(event) {
  if (event.type !== 'invalid_user') return null;
  const rule = 'ssh_bruteforce';
  const ts = new Date(event.timestamp);

  const { total, first_seen } = await countFailures(event.ip, ts, 60);
  if (total < 5) return null;
  if (await inCooldown(rule, event.ip, ts)) return null;

  return createAlert(rule, 'alta', event.ip, total, first_seen, ts);
}

// Regra 2: login com sucesso depois de 3+ falhas em 10 min
async function checkSuccessAfterFailures(event) {
  if (event.type !== 'login_success') return null;
  const rule = 'ssh_success_after_failures';
  const ts = new Date(event.timestamp);

  const { total, first_seen } = await countFailures(event.ip, ts, 600);
  if (total < 3) return null;
  if (await inCooldown(rule, event.ip, ts)) return null;

  return createAlert(rule, 'critica', event.ip, total, first_seen, ts);
}

// Corre todas as regras e devolve os alertas gerados
async function runRules(event) {
  const results = await Promise.all([
    checkBruteForce(event),
    checkSuccessAfterFailures(event),
  ]);
  return results.filter(Boolean);
}

module.exports = { runRules };
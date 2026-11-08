require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  timezone: 'Z',
});

async function insertEvent(e) {
  const sql = `INSERT INTO events (ts, host, type, username, method, ip, port)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  await pool.execute(sql, [
    new Date(e.timestamp),
    e.host,
    e.type,
    e.user ?? null,
    e.method ?? null,
    e.ip,
    e.port ?? null,
  ]);
}

module.exports = { pool, insertEvent };
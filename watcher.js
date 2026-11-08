const { spawn } = require('child_process');
const readline = require('readline');
const { parseLine } = require('./parser');
const { insertEvent } = require('./db');
const { runRules } = require('./detector');const { sendTelegram } = require('./notifier');
const LOG_FILE = '/var/log/auth.log';

// Segue o ficheiro e entrega as linhas novas ao Node
const tail = spawn('tail', ['-F', '-n', '0', LOG_FILE]);
const rl = readline.createInterface({ input: tail.stdout });

console.log(`A vigiar ${LOG_FILE}...`);

rl.on('line', async (line) => {
  const event = parseLine(line);
  if (!event) return;

  const hora = event.timestamp.slice(11, 19);
  const tipo = event.type.toUpperCase().padEnd(13);
  const user = (event.user || '(vazio)').padEnd(10);
  console.log(`[${hora}] ${tipo} ${user} de ${event.ip}`);

  try {
    await insertEvent(event);
    const alerts = await runRules(event);
    for (const alert of alerts) {
      console.log(`!!! ALERTA [${alert.severity.toUpperCase()}] ${alert.rule}: ${alert.ip} (${alert.count} falhas)`);

      await sendTelegram(
        `ALERTA ${alert.severity.toUpperCase()}: ${alert.rule}\n` +
        `Servidor: ${event.host}\n` +
        `IP: ${alert.ip}\n` +
        `Falhas antes: ${alert.count}\n` +
        (event.type === 'login_success' ? `Login como: ${event.user}\n` : '') +
        `Hora: ${event.timestamp.slice(11, 19)} UTC`
      );
    }
  } catch (err) {
    console.error('[db] Erro ao gravar:', err.message);
  }
});


tail.stderr.on('data', (data) => {
  console.error('[tail]', data.toString().trim());
});

tail.on('close', (code) => {
  console.error(`O tail terminou (código ${code})`);
  process.exit(1);
});
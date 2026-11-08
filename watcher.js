const { spawn } = require('child_process');
const readline = require('readline');
const { parseLine } = require('./parser');
const { insertEvent } = require('./db');
const { checkBruteForce } = require('./detector');
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
    const alert = await checkBruteForce(event);
    if (alert) {
        console.log(`!!! ALERTA ${alert.rule}: ${alert.ip} fez ${alert.count} tentativas em 60s`);
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
// Partes comuns: data, host, processo (sshd ou sshd-session) e mensagem
const LINE = /^(\S+)\s+(\S+)\s+sshd(?:-session)?\[(\d+)\]:\s+(.*)$/;

// "Accepted publickey for juniorst from 100.106.210.35 port 56820 ssh2"
const ACCEPTED = /^Accepted (\w+) for (\S+) from (\S+) port (\d+)/;

// TODO: "Invalid user hacker from 100.106.210.35 port 57474"
const INVALID_USER = /^Invalid user (\S*) from (\S+) port (\d+)/;

function parseLine(line) {
  const base = line.match(LINE);
  if (!base) return null;

  const [, timestamp, host, pid, message] = base;

  const ok = message.match(ACCEPTED);
  if (ok) {
    return {
      timestamp,
      host,
      type: 'login_success',
      method: ok[1],
      user: ok[2],
      ip: ok[3],
      port: Number(ok[4]),
    };
  }
   const bad = message.match(INVALID_USER);
    if (bad) {
        return {
        timestamp,
        host,
        type: 'invalid_user',
        user: bad[1],
        ip: bad[2],
        port: Number(bad[3]),
    };
  }

  // TODO: usa INVALID_USER e devolve um objeto com type: 'invalid_user'

  return null;
}

module.exports = { parseLine };
const { parseLine } = require('./parser');

const lines = [
  '2026-11-08T15:32:47.655313+00:00 macmini sshd-session[2625]: Accepted publickey for juniorst from 100.106.210.35 port 56820 ssh2',
  '2026-11-08T15:38:19.626156+00:00 macmini sshd-session[3090]: Invalid user hacker from 100.106.210.35 port 57474',
  '2026-11-08T15:40:00.000000+00:00 macmini CRON[1234]: pam_unix(cron:session): session opened',
];

for (const line of lines) {
  console.log(parseLine(line));
}
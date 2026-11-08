CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ts DATETIME(3) NOT NULL,
  host VARCHAR(64) NOT NULL,
  type VARCHAR(32) NOT NULL,
  username VARCHAR(64),
  method VARCHAR(32),
  ip VARCHAR(45) NOT NULL,
  port INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip_ts (ip, ts),
  INDEX idx_type_ts (type, ts)
);
CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rule VARCHAR(64) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  count INT NOT NULL,
  first_seen DATETIME(3) NOT NULL,
  last_seen DATETIME(3) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rule_ip_last (rule, ip, last_seen)
);
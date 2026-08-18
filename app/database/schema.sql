/**
 * Database Schema
 * SQLite schema for Deriv Analytics Pro
 */

const schema = `
-- Tick history
CREATE TABLE IF NOT EXISTS ticks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  value REAL NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  epoch_time INTEGER NOT NULL,
  tick_index INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticks_symbol_timestamp ON ticks(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_ticks_epoch ON ticks(epoch_time);

-- Analytics snapshots
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  symbol TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  tick_count INTEGER,
  confidence INTEGER,
  snapshot_data TEXT,
  even_percentage REAL,
  odd_percentage REAL,
  rise_percentage REAL,
  fall_percentage REAL,
  trend_strength REAL,
  volatility REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snapshots_session ON analytics_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_symbol_timestamp ON analytics_snapshots(symbol, timestamp);

-- High-confidence signals
CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL,
  direction TEXT,
  confidence INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  signal_data TEXT,
  action_taken TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_signals_session ON signals(session_id);
CREATE INDEX IF NOT EXISTS idx_signals_symbol_timestamp ON signals(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(type);

-- AI insights
CREATE TABLE IF NOT EXISTS insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  symbol TEXT NOT NULL,
  insight_text TEXT NOT NULL,
  type TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  severity TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insights_session ON insights(session_id);
CREATE INDEX IF NOT EXISTS idx_insights_symbol_timestamp ON insights(symbol, timestamp);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  message TEXT NOT NULL,
  severity TEXT,
  alert_type TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  dismissed INTEGER DEFAULT 0,
  rule_id TEXT,
  market TEXT,
  alert_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_session ON alerts(session_id);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_rule ON alerts(rule_id);
CREATE INDEX IF NOT EXISTS idx_alerts_market ON alerts(market);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  symbol TEXT NOT NULL,
  status TEXT,
  tick_count INTEGER DEFAULT 0,
  confidence_avg REAL,
  disconnections INTEGER DEFAULT 0,
  alerts_count INTEGER DEFAULT 0,
  signals_count INTEGER DEFAULT 0,
  session_data TEXT,
  version TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_symbol ON sessions(symbol);

-- Watchlists
CREATE TABLE IF NOT EXISTS watchlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  symbols TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON user_settings(key);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  start_time DATETIME,
  end_time DATETIME,
  symbol TEXT,
  format TEXT NOT NULL,
  file_path TEXT,
  tick_count INTEGER,
  file_size INTEGER,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_session ON reports(session_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);

-- Database metadata
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

module.exports = schema;

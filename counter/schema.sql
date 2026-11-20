-- SAHROUD COUNTER / Cloudflare D1
-- Store only city/country derived at the edge. Never store raw IP or GPS coordinates.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  city TEXT,
  country TEXT,
  version TEXT,
  page_path TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_app_created ON events(app_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(country, city);
CREATE INDEX IF NOT EXISTS idx_events_visitor ON events(visitor_hash, created_at);

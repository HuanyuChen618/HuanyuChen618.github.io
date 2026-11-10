-- Aggregate counters only. No IPs, user agents or per-visit rows are ever stored.
CREATE TABLE IF NOT EXISTS cities (
  city TEXT NOT NULL, region TEXT NOT NULL, country TEXT NOT NULL,
  lat REAL, lon REAL, visits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (city, region, country)
);
CREATE TABLE IF NOT EXISTS paths (path TEXT PRIMARY KEY, visits INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS daily (day TEXT PRIMARY KEY, visits INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS meta  (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT OR IGNORE INTO meta (key, value) VALUES ('total', '0');
INSERT OR IGNORE INTO meta (key, value) VALUES ('since', '2026-11-09');

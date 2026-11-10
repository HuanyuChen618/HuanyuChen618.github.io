-- Zero every counter and restart the "since" date (edit the date before running).
DELETE FROM cities;
DELETE FROM paths;
DELETE FROM daily;
UPDATE meta SET value = '0' WHERE key = 'total';
UPDATE meta SET value = '2026-11-09' WHERE key = 'since';

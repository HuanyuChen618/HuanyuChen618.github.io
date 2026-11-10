# visits — privacy-safe visitor counter

Cloudflare Worker + D1 behind `https://stats.huanyuchen.com`, used by the site footer and `/visitors`.
Stores only aggregate counters: per city (Cloudflare IP geolocation, lat/lon rounded to 0.1°), per page path,
per day, and a total. No IP, user agent, cookie or per-visit row is stored.

- `POST /hit` body `{"path": "/research"}` — counts one visit. Only accepted with `Origin: https://huanyuchen.com`
  (or `http://localhost:4321`); bot-like user agents are ignored. The site sends at most one hit per browser,
  per page, per day (localStorage), and never from localhost.
- `GET /stats` — `{total, since, cities[], top_countries[]}`, cached 60 s.

D1 database: `huanyu-visits` (id in `wrangler.toml`). Run wrangler from this folder
(Windows: `npx.cmd --yes wrangler@4 ...`; from Python use `encoding="utf-8"`).

## Deploy
    npx wrangler@4 deploy                    # worker + custom domain stats.huanyuchen.com
    npx wrangler@4 d1 execute huanyu-visits --remote --file schema.sql   # first time only (idempotent)

## Reset counters to zero
Edit the `since` date in `reset.sql`, then

    npx wrangler@4 d1 execute huanyu-visits --remote --file reset.sql

## Look at the raw numbers
    npx wrangler@4 d1 execute huanyu-visits --remote --command "SELECT * FROM paths ORDER BY visits DESC"

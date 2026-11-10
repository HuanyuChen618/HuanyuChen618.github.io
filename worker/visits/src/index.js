// Privacy-safe visitor counter for huanyuchen.com.
// Stores only aggregate counters: per city (from Cloudflare's IP geolocation, rounded to 0.1 deg),
// per page path, per day, and a grand total. No IP address, user agent, cookie or per-visit row is stored.

const ALLOWED_ORIGINS = new Set(['https://huanyuchen.com', 'http://localhost:4321']);
const BOT_RE = /bot|crawl|spider|preview|headless|slurp|facebookexternalhit|lighthouse/i;
const STATS_TTL = 60; // seconds

function cors(origin) {
  const h = { 'Vary': 'Origin' };
  if (ALLOWED_ORIGINS.has(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Content-Type';
    h['Access-Control-Max-Age'] = '86400';
  }
  return h;
}

const json = (obj, status, headers) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });

function cleanPath(p) {
  if (typeof p !== 'string') return '/';
  p = p.split(/[?#]/)[0].slice(0, 160);
  if (!p.startsWith('/') || !/^[A-Za-z0-9/_.\-~%]*$/.test(p)) return '/';
  if (p.length > 1) p = p.replace(/\/+$/, '').replace(/\/index\.html$/, '') || '/';
  return p;
}

const str = (v, n = 80) => (typeof v === 'string' && v ? v.slice(0, n) : '');
const round1 = (v) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? Math.round(x * 10) / 10 : null;
};

async function hit(request, env) {
  let body = {};
  try {
    body = JSON.parse((await request.text()).slice(0, 2000) || '{}');
  } catch (_) { /* sendBeacon may send text; ignore */ }
  const path = cleanPath(body.path);
  const cf = request.cf || {};
  const country = str(cf.country, 4) || 'XX';
  const city = str(cf.city) || '';
  const region = str(cf.region) || '';
  const lat = round1(cf.latitude);
  const lon = round1(cf.longitude);
  const day = new Date().toISOString().slice(0, 10);

  const stmts = [
    env.DB.prepare("UPDATE meta SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'total'"),
    env.DB.prepare('INSERT INTO daily (day, visits) VALUES (?1, 1) ON CONFLICT(day) DO UPDATE SET visits = visits + 1').bind(day),
    env.DB.prepare('INSERT INTO paths (path, visits) VALUES (?1, 1) ON CONFLICT(path) DO UPDATE SET visits = visits + 1').bind(path),
  ];
  if (lat !== null && lon !== null) {
    stmts.push(
      env.DB.prepare(
        `INSERT INTO cities (city, region, country, lat, lon, visits) VALUES (?1, ?2, ?3, ?4, ?5, 1)
         ON CONFLICT(city, region, country) DO UPDATE SET visits = visits + 1`
      ).bind(city, region, country, lat, lon)
    );
  }
  await env.DB.batch(stmts);
}

async function stats(env) {
  const [meta, cities, countries] = await env.DB.batch([
    env.DB.prepare('SELECT key, value FROM meta'),
    env.DB.prepare('SELECT city, region, country, lat, lon, visits FROM cities ORDER BY visits DESC LIMIT 1000'),
    env.DB.prepare('SELECT country, SUM(visits) AS visits FROM cities GROUP BY country ORDER BY visits DESC LIMIT 12'),
  ]);
  const m = Object.fromEntries(meta.results.map((r) => [r.key, r.value]));
  return {
    total: parseInt(m.total || '0', 10),
    since: m.since || null,
    cities: cities.results,
    top_countries: countries.results,
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const h = cors(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });

    if (url.pathname === '/hit' && request.method === 'POST') {
      const ua = request.headers.get('User-Agent') || '';
      if (!ALLOWED_ORIGINS.has(origin)) return json({ ok: false, error: 'origin' }, 403, h);
      if (!ua || BOT_RE.test(ua)) return json({ ok: true, counted: false }, 200, h);
      await hit(request, env);
      return json({ ok: true, counted: true }, 200, h);
    }

    if (url.pathname === '/stats' && request.method === 'GET') {
      // Cache the computed JSON (without CORS headers) for 60 s, then add per-origin headers.
      const cache = caches.default;
      const key = new Request(url.origin + '/stats', { method: 'GET' });
      let data = null;
      const cached = await cache.match(key);
      if (cached) data = await cached.text();
      else {
        data = JSON.stringify(await stats(env));
        ctx.waitUntil(cache.put(key, new Response(data, {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${STATS_TTL}` },
        })));
      }
      return new Response(data, {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${STATS_TTL}`, ...h },
      });
    }

    return json({ ok: false, error: 'not found' }, 404, h);
  },
};

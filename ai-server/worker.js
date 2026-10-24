// NOVATECH Risk Watch — AI server (Cloudflare Worker)
// Keeps the Claude API key secret so visitors of the dashboard can use the AI analysis without a key of their own.
// Only the dashboard's own address may call it, requests are size-limited, the model and output length are fixed,
// and each visitor is limited to a few calls per minute.
// It also serves the shared team database (Redis, see teamdb.js) at /db.

import BUILD_KEY from './build-key.js';
import BUILD_REDIS from './build-redis.js';
import {dbConfig, dbStatus, dbRead, dbWrite, validateWrite, DB_LIMITS} from './teamdb.js';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 2000;
const MAX_BODY = 24000;          // bytes accepted from the browser
const PER_MINUTE = 8;            // calls per visitor per minute (best effort, per server instance)
const hits = new Map();
const dbHits = new Map();
const DB_READS_PER_MINUTE = 600, DB_WRITES_PER_MINUTE = 240;   // a whole class shares one school IP
function limited(map, ip, max) {
  const now = Date.now(), recent = (map.get(ip) || []).filter(t => now - t < 60000);
  if (recent.length >= max) return true;
  recent.push(now); map.set(ip, recent);
  if (map.size > 5000) map.clear();
  return false;
}

function cors(origin, allowed) {
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
const reply = (status, body, headers) => new Response(typeof body === 'string' ? body : JSON.stringify(body), {status, headers: {...headers, 'content-type': 'application/json'}});

/* Status page: opening the server address in a browser tells you whether the Claude key works. Checked at most once a minute. */
let lastCheck = {at: 0, text: ''};
async function statusPage(KEY, env, h, db) {
  const src = env.ANTHROPIC_API_KEY ? 'Cloudflare secret' : 'build settings';
  let text;
  if (!KEY) text = 'Claude key: MISSING. In Cloudflare open this worker > Settings > Variables and Secrets > Add: Type Secret, name ANTHROPIC_API_KEY, value your key from console.anthropic.com. Then click Deploy.';
  else if (Date.now() - lastCheck.at < 60000) text = lastCheck.text;
  else {
    const kind = /^sk-ant-api/.test(KEY) ? 'API key format OK' : `this does not look like an API key (it starts with ${KEY.slice(0, 10)}…; API keys start with sk-ant-api03-)`;
    let verdict;
    try {
      const r = await fetch('https://api.anthropic.com/v1/models?limit=1', {headers: {'x-api-key': KEY, 'anthropic-version': '2023-06-01'}});
      const body = await r.text();
      verdict = r.ok ? 'Anthropic accepted the key. AI is READY.'
        : r.status === 401 ? 'Anthropic REFUSED the key (401). Create a new API key at console.anthropic.com > API Keys and put it in the ANTHROPIC_API_KEY secret.'
        : /credit|billing|balance/i.test(body) ? 'The Anthropic account has no credit. Add credit at console.anthropic.com > Billing.'
        : `Anthropic answered ${r.status}: ${body.slice(0, 160)}`;
    } catch (e) { verdict = 'Could not reach Anthropic from Cloudflare: ' + String(e && e.message || e).slice(0, 120); }
    text = `Claude key: found (from ${src}); ${kind}. ${verdict}`;
    lastCheck = {at: Date.now(), text};
  }
  const dbLine = await dbStatus(db);
  return new Response('NOVATECH Risk Watch AI server is running.\n' + text + '\n' + dbLine + '\nAllowed website: ' + ((env.ALLOWED_ORIGINS || 'https://ar-base.github.io')) + '\nAddress to paste in Start-up co-pilot > Analysis engine > Claude: AI server: this page\'s address.',
    {status: 200, headers: {...h, 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store'}});
}

export default {
  async fetch(request, env) {
    const KEY = env.ANTHROPIC_API_KEY || BUILD_KEY || '';
    const allowed = (env.ALLOWED_ORIGINS || 'https://ar-base.github.io').split(',').map(s => s.trim()).filter(Boolean);
    const origin = request.headers.get('Origin') || '';
    const h = cors(origin, allowed);
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: h});
    const url = new URL(request.url);
    const db = dbConfig(env, BUILD_REDIS || {});
    if (url.pathname === '/db') return teamDb(request, url, db, origin, allowed, h);
    if (request.method === 'GET') return statusPage(KEY, env, h, db);
    if (request.method !== 'POST') return reply(405, {error: 'Use POST'}, h);
    if (!allowed.includes(origin)) return reply(403, {error: 'Origin not allowed'}, h);
    if (!KEY) return reply(500, {error: 'Server key not configured'}, h);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now(), recent = (hits.get(ip) || []).filter(t => now - t < 60000);
    if (recent.length >= PER_MINUTE) return reply(429, {error: 'Too many requests, try again in a minute'}, h);
    recent.push(now); hits.set(ip, recent);

    const raw = await request.text();
    if (raw.length > MAX_BODY) return reply(413, {error: 'Request too large'}, h);
    let body;
    try { body = JSON.parse(raw); } catch { return reply(400, {error: 'Invalid JSON'}, h); }
    const {system, messages} = body || {};
    const okMessages = Array.isArray(messages) && messages.length >= 1 && messages.length <= 4 &&
      messages.every(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length <= 8000);
    if (typeof system !== 'string' || system.length > 8000 || !okMessages) return reply(400, {error: 'Invalid request'}, h);

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01'},
      body: JSON.stringify({model: MODEL, max_tokens: MAX_TOKENS, system, messages}),
    });
    const text = await upstream.text();
    return reply(upstream.status, text, h);
  },
};

/* Shared team database: GET reads (or says "nothing changed"), POST writes. Only the dashboard's own website may call it. */
async function teamDb(request, url, db, origin, allowed, h) {
  const hh = {...h, 'cache-control': 'no-store'};
  if (!allowed.includes(origin)) return reply(403, {error: 'Origin not allowed'}, hh);
  if (!db.ok) return reply(503, {error: 'Team database not configured'}, hh);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  try {
    if (request.method === 'GET') {
      if (limited(dbHits, 'r' + ip, DB_READS_PER_MINUTE)) return reply(429, {error: 'Too many requests'}, hh);
      return reply(200, await dbRead(db, url), hh);
    }
    if (request.method !== 'POST') return reply(405, {error: 'Use GET or POST'}, hh);
    if (limited(dbHits, 'w' + ip, DB_WRITES_PER_MINUTE)) return reply(429, {error: 'Too many changes, wait a minute'}, hh);
    const raw = await request.text();
    if (raw.length > DB_LIMITS.MAX_REPLACE) return reply(413, {error: 'Request too large'}, hh);
    let body; try { body = JSON.parse(raw); } catch { return reply(400, {error: 'Invalid JSON'}, hh); }
    const bad = validateWrite(body);
    if (bad) return reply(400, {error: bad}, hh);
    return reply(200, await dbWrite(db, body), hh);
  } catch (e) {
    return reply(e.status || 502, {error: String(e.message || e).slice(0, 200)}, hh);
  }
}

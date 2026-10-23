// NOVATECH Risk Watch — AI server (Cloudflare Worker)
// Keeps the Claude API key secret so visitors of the dashboard can use the AI analysis without a key of their own.
// Only the dashboard's own address may call it, requests are size-limited, the model and output length are fixed,
// and each visitor is limited to a few calls per minute.

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 2000;
const MAX_BODY = 24000;          // bytes accepted from the browser
const PER_MINUTE = 8;            // calls per visitor per minute (best effort, per server instance)
const hits = new Map();

function cors(origin, allowed) {
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
const reply = (status, body, headers) => new Response(typeof body === 'string' ? body : JSON.stringify(body), {status, headers: {...headers, 'content-type': 'application/json'}});

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGINS || 'https://ar-base.github.io').split(',').map(s => s.trim()).filter(Boolean);
    const origin = request.headers.get('Origin') || '';
    const h = cors(origin, allowed);
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: h});
    if (request.method === 'GET') return new Response('NOVATECH Risk Watch AI server is running. ' + (env.ANTHROPIC_API_KEY ? 'Claude key: set.' : 'Claude key: MISSING (add the secret ANTHROPIC_API_KEY in Cloudflare).') + ' Paste this address into Start-up co-pilot > Analysis engine > Claude: AI server.', {status: 200, headers: {...h, 'content-type': 'text/plain; charset=utf-8'}});
    if (request.method !== 'POST') return reply(405, {error: 'Use POST'}, h);
    if (!allowed.includes(origin)) return reply(403, {error: 'Origin not allowed'}, h);
    if (!env.ANTHROPIC_API_KEY) return reply(500, {error: 'Server key not configured'}, h);

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
      headers: {'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01'},
      body: JSON.stringify({model: MODEL, max_tokens: MAX_TOKENS, system, messages}),
    });
    const text = await upstream.text();
    return reply(upstream.status, text, h);
  },
};

// NOVATECH Risk Watch: shared team database on Redis (Upstash REST API).
// Every dashboard reads and writes the same records, so a reading logged on one laptop shows on all of them.
// Redis layout (prefix "nrw" by default):
//   <prefix>:docs   hash   path -> JSON record   (path like "kri/K20", "actions/A3", "log/abc123")
//   <prefix>:v      int    version, +1 on every write; dashboards poll it to know when to reload
//   <prefix>:audit  list   last 300 writes: who, when, which paths (append-only history for the teacher)

export const PATH_OK = /^(kri|actions|acks|reassess|clues|config|response|log|approval)\/[A-Za-z0-9_.-]{1,80}$/;
const MAX_DOC = 16000;           // bytes per record
const MAX_OPS = 25;              // records per write
const MAX_DOCS = 3000;           // records in the whole database
const MAX_REPLACE = 900000;      // bytes for a full replace (reset / backup import)
const BY_OK = /^[\p{L}][\p{L} .'-]{0,39}$/u;

/* Values are often pasted the way Upstash shows them: UPSTASH_REDIS_REST_URL="https://…" (with the name, quotes or a ;).
   Keep only the value itself. */
export const cleanSecret = v => String(v || '').trim().replace(/^(export\s+)?[A-Z_]+\s*[=:]\s*/, '').trim().replace(/^["'`\s]+|["'`;,\s]+$/g, '');
export function dbConfig(env, build = {}) {
  let url = cleanSecret(env.UPSTASH_REDIS_REST_URL || build.url).replace(/\/+$/, '');
  if (/^[A-Za-z0-9-]+\.upstash\.io$/.test(url)) url = 'https://' + url;          // pasted without https://
  const token = cleanSecret(env.UPSTASH_REDIS_REST_TOKEN || build.token);
  const prefix = /^[a-z0-9-]{1,20}$/.test(env.DB_PREFIX || '') ? env.DB_PREFIX : 'nrw';
  const urlOk = /^https:\/\/[A-Za-z0-9.-]+(:\d+)?$/.test(url), tokenOk = /^[A-Za-z0-9_=-]{20,}$/.test(token);
  let problem = '';
  if (!url && !token) problem = 'missing';
  else if (!url) problem = 'UPSTASH_REDIS_REST_URL is missing (the token is there).';
  else if (!token) problem = 'UPSTASH_REDIS_REST_TOKEN is missing (the URL is there).';
  else if (!urlOk) problem = /^redis(s)?:/.test(url) ? 'UPSTASH_REDIS_REST_URL is the redis:// connection string; use the https:// address from the REST API section instead.' : 'UPSTASH_REDIS_REST_URL should look like https://name-12345.upstash.io (it starts with ' + url.slice(0, 12) + '…).';
  else if (!tokenOk) problem = 'UPSTASH_REDIS_REST_TOKEN does not look like an Upstash REST token (copy the long token from the REST API section).';
  return {url, token, prefix, ok: urlOk && tokenOk, problem};
}

async function redis(cfg, cmds, atomic = false) {
  const r = await fetch(cfg.url + (atomic ? '/multi-exec' : '/pipeline'), {
    method: 'POST', headers: {Authorization: 'Bearer ' + cfg.token, 'content-type': 'application/json'}, body: JSON.stringify(cmds),
  });
  const out = await r.json().catch(() => null);
  if (!r.ok || !Array.isArray(out)) {
    const e = new Error(r.status === 401 ? 'Redis refused the token' : 'Redis error ' + r.status + (out && out.error ? ': ' + String(out.error).slice(0, 120) : ''));
    e.status = 502; throw e;
  }
  const bad = out.find(x => x && x.error); if (bad) { const e = new Error('Redis: ' + String(bad.error).slice(0, 120)); e.status = 502; throw e; }
  return out.map(x => x.result);
}

const isPlain = o => o && typeof o === 'object' && !Array.isArray(o);
function pairs(res) {               // HGETALL comes back as [field, value, field, value, ...] (or an object)
  const o = {};
  if (Array.isArray(res)) for (let k = 0; k + 1 < res.length; k += 2) o[res[k]] = res[k + 1];
  else if (isPlain(res)) Object.assign(o, res);
  const docs = {};
  for (const [p, v] of Object.entries(o)) { if (!PATH_OK.test(p)) continue; try { const d = JSON.parse(v); if (isPlain(d)) docs[p] = d; } catch {} }
  return docs;
}

export async function dbStatus(cfg) {
  if (!cfg.ok && cfg.problem !== 'missing') return 'Team database (Redis): NOT WORKING. ' + cfg.problem + ' Fix it in Cloudflare > this worker > Settings > Variables and Secrets, then Deploy.';
  if (!cfg.ok) return 'Team database (Redis): NOT SET UP. Add the secrets UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (from console.upstash.com > your database > REST API) to this worker. Until then each dashboard keeps its data on its own computer.';
  try { const [v, n] = await redis(cfg, [['GET', cfg.prefix + ':v'], ['HLEN', cfg.prefix + ':docs']]); return `Team database (Redis): CONNECTED. ${n} records, version ${v || 0}.`; }
  catch (e) { return 'Team database (Redis): ERROR. ' + e.message + '. Check the two Upstash secrets.'; }
}

/* GET /db[?since=V]  ->  {v, docs} or {v, same:true} when nothing changed since V */
export async function dbRead(cfg, url) {
  const since = url.searchParams.get('since');
  const [v] = await redis(cfg, [['GET', cfg.prefix + ':v']]);
  const ver = Number(v) || 0;
  if (since !== null && /^\d{1,12}$/.test(since) && Number(since) === ver) return {v: ver, same: true};
  const [v2, all] = await redis(cfg, [['GET', cfg.prefix + ':v'], ['HGETALL', cfg.prefix + ':docs']]);
  return {v: Number(v2) || 0, docs: pairs(all)};
}

/* POST /db  {by, ops:[{op:'set',path,data} | {op:'del',path} | {op:'replace',docs}]}  ->  {v} */
export function validateWrite(body) {
  if (!isPlain(body) || !Array.isArray(body.ops) || !body.ops.length || body.ops.length > MAX_OPS) return 'ops must be a list of 1 to ' + MAX_OPS + ' changes';
  const by = body.by == null || body.by === '' ? null : String(body.by);
  if (by !== null && !BY_OK.test(by)) return 'Invalid name';
  const replace = body.ops.filter(o => o && o.op === 'replace');
  if (replace.length && body.ops.length !== 1) return 'replace must be sent alone';
  for (const o of body.ops) {
    if (!isPlain(o)) return 'Invalid change';
    if (o.op === 'set') { if (!PATH_OK.test(o.path || '')) return 'Invalid path'; if (!isPlain(o.data)) return 'Record must be an object'; if (JSON.stringify(o.data).length > MAX_DOC) return 'Record too large'; }
    else if (o.op === 'del') { if (!PATH_OK.test(o.path || '')) return 'Invalid path'; }
    else if (o.op === 'replace') {
      if (!isPlain(o.docs)) return 'docs must be an object';
      const ent = Object.entries(o.docs);
      if (ent.length > MAX_DOCS) return 'Too many records';
      for (const [p, d] of ent) { if (!PATH_OK.test(p) || !isPlain(d)) return 'Invalid record ' + String(p).slice(0, 40); if (JSON.stringify(d).length > MAX_DOC) return 'Record too large'; }
    } else return 'Unknown change type';
  }
  return null;
}

export async function dbWrite(cfg, body) {
  const P = cfg.prefix, docs = P + ':docs';
  const sets = body.ops.filter(o => o.op === 'set');
  if (sets.length) {               // keep the database bounded
    const [n] = await redis(cfg, [['HLEN', docs]]);
    if (Number(n) + sets.length > MAX_DOCS) { const e = new Error('The team database is full (' + MAX_DOCS + ' records). Reset it from the dashboard.'); e.status = 507; throw e; }
  }
  const cmds = [];
  for (const o of body.ops) {
    if (o.op === 'set') cmds.push(['HSET', docs, o.path, JSON.stringify(o.data)]);
    else if (o.op === 'del') cmds.push(['HDEL', docs, o.path]);
    else if (o.op === 'replace') {
      cmds.push(['DEL', docs]);
      const flat = Object.entries(o.docs).flatMap(([p, d]) => [p, JSON.stringify(d)]);
      for (let k = 0; k < flat.length; k += 400) cmds.push(['HSET', docs, ...flat.slice(k, k + 400)]);
    }
  }
  const audit = JSON.stringify({at: new Date().toISOString(), by: body.by || null, ops: body.ops.map(o => o.op + ' ' + (o.path || Object.keys(o.docs || {}).length + ' records'))}).slice(0, 2000);
  cmds.push(['INCR', P + ':v'], ['LPUSH', P + ':audit', audit], ['LTRIM', P + ':audit', '0', '299']);
  const res = await redis(cfg, cmds, true);
  return {v: Number(res[res.length - 3]) || 0};
}
export const DB_LIMITS = {MAX_REPLACE};

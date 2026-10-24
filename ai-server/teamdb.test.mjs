// Run: node ai-server/teamdb.test.mjs
// Unit test for the team database route with a fake Upstash server.
import assert from 'node:assert/strict';
const R = {str:{}, hash:{}, list:{}}; let calls = 0, refuse = false;
function run([c, ...a]) {
  switch (c) {
    case 'GET': return R.str[a[0]] ?? null;
    case 'INCR': R.str[a[0]] = String((Number(R.str[a[0]]) || 0) + 1); return Number(R.str[a[0]]);
    case 'HLEN': return Object.keys(R.hash[a[0]] || {}).length;
    case 'HGETALL': return Object.entries(R.hash[a[0]] || {}).flat();
    case 'HSET': { const h = R.hash[a[0]] ||= {}; let n = 0; for (let k = 1; k < a.length; k += 2) { if (!(a[k] in h)) n++; h[a[k]] = a[k + 1]; } return n; }
    case 'HDEL': { const h = R.hash[a[0]] || {}; const had = a[1] in h; delete h[a[1]]; return had ? 1 : 0; }
    case 'DEL': delete R.hash[a[0]]; delete R.str[a[0]]; return 1;
    case 'LPUSH': (R.list[a[0]] ||= []).unshift(a[1]); return R.list[a[0]].length;
    case 'LTRIM': R.list[a[0]] = R.list[a[0]].slice(Number(a[1]), Number(a[2]) + 1); return 'OK';
    default: throw new Error('unsupported ' + c);
  }
}
globalThis.fetch = async (u, init) => {
  calls++;
  if (refuse) return new Response(JSON.stringify({error:'Unauthorized'}), {status:401});
  assert.equal(init.headers.Authorization, 'Bearer ' + 'x'.repeat(30));
  assert.ok(/\/(pipeline|multi-exec)$/.test(u));
  return new Response(JSON.stringify(JSON.parse(init.body).map(c => ({result:run(c)}))), {status:200});
};
const {default: worker} = await import('./worker.js');
const env = {UPSTASH_REDIS_REST_URL:'https://fake.upstash.io', UPSTASH_REDIS_REST_TOKEN:'x'.repeat(30)};
const O = 'https://ar-base.github.io';
const req = (method, path, body, origin = O) => worker.fetch(new Request('https://w.dev' + path, {method, headers:{Origin:origin, 'content-type':'application/json'}, body:body ? JSON.stringify(body) : undefined}), env);
let r, j;
r = await req('GET', '/db'); j = await r.json(); assert.equal(r.status, 200); assert.deepEqual(j, {v:0, docs:{}});
r = await req('GET', '/db', null, 'https://evil.example'); assert.equal(r.status, 403);
r = await req('POST', '/db', {by:'Fatah', ops:[{op:'set', path:'actions/A3', data:{status:'done'}}]}); j = await r.json(); assert.equal(j.v, 1, JSON.stringify(j));
r = await req('GET', '/db?since=0'); j = await r.json(); assert.equal(j.v, 1); assert.deepEqual(j.docs['actions/A3'], {status:'done'});
r = await req('GET', '/db?since=1'); j = await r.json(); assert.deepEqual(j, {v:1, same:true});
// validation
for (const bad of [{ops:[]}, {ops:[{op:'set', path:'../x', data:{}}]}, {ops:[{op:'set', path:'kri/K1', data:[1]}]}, {ops:[{op:'evil'}]},
  {by:'<script>', ops:[{op:'del', path:'kri/K1'}]}, {ops:[{op:'set', path:'kri/K1', data:{s:'x'.repeat(17000)}}]},
  {ops:[{op:'replace', docs:{}}, {op:'del', path:'kri/K1'}]}, {ops:[{op:'replace', docs:{'hack/x':{}}}]}]) {
  r = await req('POST', '/db', bad); assert.equal(r.status, 400, JSON.stringify(bad).slice(0, 80));
}
r = await worker.fetch(new Request('https://w.dev/db', {method:'POST', headers:{Origin:O}, body:'{nope'}), env); assert.equal(r.status, 400);
// replace + delete
r = await req('POST', '/db', {by:'Anish', ops:[{op:'replace', docs:{'kri/K20':{readings:[{v:40}]}, 'clues/a':{text:'x'}}}]}); j = await r.json(); assert.equal(j.v, 2);
r = await req('POST', '/db', {ops:[{op:'del', path:'clues/a'}]}); assert.equal((await r.json()).v, 3);
r = await req('GET', '/db'); j = await r.json(); assert.deepEqual(Object.keys(j.docs), ['kri/K20']);
assert.equal(R.list['nrw:audit'].length, 3); assert.match(R.list['nrw:audit'][2], /Fatah/);
// status page + not configured + refused token
r = await worker.fetch(new Request('https://w.dev/', {method:'GET'}), env); const t = await r.text(); assert.match(t, /Team database \(Redis\): CONNECTED\. 1 records, version 3/);
r = await worker.fetch(new Request('https://w.dev/db', {method:'GET', headers:{Origin:O}}), {}); assert.equal(r.status, 503);
refuse = true; r = await req('GET', '/db'); j = await r.json(); assert.equal(r.status, 502); assert.match(j.error, /refused/); refuse = false;
// AI route still guarded
r = await req('POST', '/', {system:'x', messages:[{role:'user', content:'hi'}]}); assert.equal(r.status, 500);
const {dbConfig, cleanSecret} = await import('./teamdb.js');
const tok = 'AYabc' + 'x'.repeat(40);
for (const [u, want] of [['"https://eu1-cat-123.upstash.io"', 'https://eu1-cat-123.upstash.io'], ['UPSTASH_REDIS_REST_URL="https://eu1-cat-123.upstash.io";', 'https://eu1-cat-123.upstash.io'], ['eu1-cat-123.upstash.io', 'https://eu1-cat-123.upstash.io'], [' https://eu1-cat-123.upstash.io/ ', 'https://eu1-cat-123.upstash.io']]) {
  const c = dbConfig({UPSTASH_REDIS_REST_URL:u, UPSTASH_REDIS_REST_TOKEN:'"' + tok + '"'}); assert.equal(c.url, want); assert.equal(c.token, tok); assert.ok(c.ok, u);
}
assert.match(dbConfig({UPSTASH_REDIS_REST_URL:'rediss://default:x@eu1.upstash.io:6379', UPSTASH_REDIS_REST_TOKEN:tok}).problem, /redis:\/\/ connection string/);
assert.match(dbConfig({UPSTASH_REDIS_REST_URL:'https://eu1-cat-123.upstash.io'}).problem, /TOKEN is missing/);
r = await worker.fetch(new Request('https://w.dev/', {method:'GET'}), {UPSTASH_REDIS_REST_URL:'https://a.upstash.io'}); assert.match(await r.text(), /NOT WORKING\. UPSTASH_REDIS_REST_TOKEN is missing/);
console.log('worker db tests passed;', calls, 'redis calls');

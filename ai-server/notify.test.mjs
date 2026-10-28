// Run: node ai-server/notify.test.mjs
// Unit test for the server's continuous phone reminders, with a fake Upstash and a fake ntfy.sh.
import assert from 'node:assert/strict';
import {plan, openAlerts, notifyConfig, personTopic, BUDGET} from './notify.js';

const T0 = Date.parse('2026-10-28T10:00:00Z'), MIN = 60000;
const TOPIC = 'novatech-rw-646087d3502ba9ca';
const at = (m = 0) => new Date(T0 - 3600000 + m * MIN).toISOString();
const base = () => ({
  'kri/K3': {readings: [{v: 6, at: at(-500)}, {v: 18, at: at(0)}]},     // R2 phishing click rate: red
  'kri/K11': {readings: [{v: 30, at: at(1)}]},                           // R8 untrained new hires: red
  'kri/K9': {readings: [{v: 20, at: at(2)}]},                            // R6 in range: no alert
});

/* 1. alerts are computed like the dashboard */
let a = openAlerts(base(), 8);
assert.deepEqual(a.map(x => x.rid).sort(), ['R2', 'R8']);
assert.equal(a.find(x => x.rid === 'R2').tier, 'critical');
assert.equal(a.find(x => x.rid === 'R2').score, 12);
{ const d = base(); d['acks/K3'] = {at: d['kri/K3'].readings[1].at}; assert.deepEqual(openAlerts(d).map(x => x.rid), ['R8'], 'acknowledged reading is not an alert'); }
{ const d = base(); d['response/R2'] = {at: at(5), steps: ['a'], people: ['Anish'], done: [true]}; assert.deepEqual(openAlerts(d).map(x => x.rid), ['R8'], 'contained risk is not an alert'); }
{ const d = base(); d['kri/K3'].readings.push({v: 20, at: at(10)}); d['response/R2'] = {at: at(5), steps: []}; assert.ok(openAlerts(d).some(x => x.rid === 'R2'), 'a newer reading after containment re-opens the alert'); }
assert.deepEqual(openAlerts(base(), 12).map(x => x.rid), ['R2'], 'critical-only filter');
assert.equal(notifyConfig({everyMin: 7, personal: 'x', topic: 'bad topic!', on: 'yes'}).everyMin, 5, 'unknown values fall back');
assert.equal(notifyConfig({topic: 'bad topic!'}).topic, TOPIC);

/* 2. first tick: team channel + the responsible people (R2: Anish, R8: Rambabu) */
const resp = () => ({...base(), 'config/notify': {personal: 'responsible'}});
let r = plan(resp(), {}, T0);
const topics = r.out.map(m => m.topic);
assert.equal(topics[0], TOPIC);
assert.ok(topics.includes(personTopic(TOPIC, 'Anish')) && topics.includes(personTopic(TOPIC, 'Rambabu')));
assert.ok(!topics.includes(personTopic(TOPIC, 'Mereena')), 'Mereena is not responsible for R2/R8');
assert.match(r.out[0].title, /2 open risk alerts/);
assert.equal(r.out[0].priority, 5);
assert.ok(r.out[0].actions.some(x => /CONTAIN R2/.test(x.body || '')), 'contain button');
assert.ok(r.out.every(m => m.message.length < 900 && m.title.length <= 120));

/* 3. one minute later nothing; five minutes later the team again; fifteen minutes later the people again */
let s = r.s;
r = plan(resp(), s, T0 + MIN); assert.equal(r.out.length, 0); s = r.s;
r = plan(resp(), s, T0 + 5 * MIN); assert.deepEqual(r.out.map(m => m.topic), [TOPIC]); s = r.s;
r = plan(resp(), s, T0 + 15 * MIN); assert.equal(r.out.length, 3, 'team + Anish + Rambabu'); s = r.s;
assert.ok(s.next > T0 + 15 * MIN && s.next <= T0 + 20 * MIN);

/* 4. "everyone" (the default): Mereena and every other teammate get their personal reminder too */
{ const d = {...base(), 'config/notify': {everyMin: 2}};
  const q = plan(d, {}, T0);
  for (const n of ['Anish', 'Mereena', 'Sudheer', 'Fatah', 'Rambabu', 'Krishna', 'Niranjan']) assert.ok(q.out.some(m => m.topic === personTopic(TOPIC, n)), n);
  const mer = q.out.find(m => m.topic === personTopic(TOPIC, 'Mereena'));
  assert.match(mer.title, /2 risk alerts open in the team/); assert.match(mer.message, /R2 Cyberattack/);
  const q2 = plan(d, q.s, T0 + 2 * MIN); assert.deepEqual(q2.out.map(m => m.topic), [TOPIC], 'team every 2 min, people every 15'); }

/* 5. CEO approval pending: Krishna gets Approve / Reject; open response tasks go to their owner with Done buttons */
{ const d = base(); d['approval/R2'] = {status: 'pending', at: at(50), requestedBy: 'Anish'};
  d['response/R8'] = {at: at(30), steps: ['Pause admin rights', 'Run the induction', 'Buddy'], people: ['Anish', 'Rambabu', 'Rambabu'], done: [true, false, false]};
  const q = plan(d, {}, T0);
  const k = q.out.find(m => m.topic === personTopic(TOPIC, 'Krishna'));
  assert.match(k.title, /CEO approval needed: R2/); assert.ok(k.actions.some(x => /APPROVE R2 by Krishna/.test(x.body)) && k.actions.some(x => /REJECT R2 by Krishna/.test(x.body)));
  const rb = q.out.find(m => m.topic === personTopic(TOPIC, 'Rambabu'));
  assert.match(rb.title, /2 response tasks/); assert.ok(rb.actions.some(x => /DONE R8 2 by Rambabu/.test(x.body)));
  assert.match(q.out[0].message, /waiting for Krishna \(CEO\)/);
  assert.ok(!q.out[0].actions.some(x => /CONTAIN R2/.test(x.body || '')), 'no Contain button for a risk already waiting for the CEO'); }

/* 6. switched off, quiet hours, nothing open */
assert.equal(plan({...base(), 'config/notify': {on: false}}, {}, T0).out.length, 0);
assert.equal(plan({...base(), 'config/notify': {day: true}}, {}, Date.parse('2026-10-28T23:30:00Z')).out.length, 0, 'night in Paris');
assert.equal(plan({...base(), 'config/notify': {day: true}}, {}, T0).out.length > 0, true, 'day in Paris');
assert.equal(plan({}, {}, T0).out.length, 0);

/* 7. budget: never more than ntfy allows; the team channel keeps priority */
{ let st = {}, n = 0, team = 0, t = T0; const d = {...base(), 'config/notify': {everyMin: 1, personal: 'all', personalMin: 5}};
  for (let m = 0; m < 24 * 60; m++, t += MIN) { const q = plan(d, st, t); st = q.s; n += q.out.length; team += q.out.filter(x => x.topic === TOPIC).length; }
  assert.ok(n <= BUDGET.CAP + 24 * 60 * MIN / BUDGET.REFILL_MS + 1, 'within the daily budget: ' + n);
  assert.ok(team >= 200, 'team channel keeps going all day: ' + team); }

/* 8. test button: team + every personal channel, once */
{ const d = {...base(), 'config/notify': {test: '2026-10-28T09:59:00Z'}};
  const q = plan(d, {}, T0); assert.ok(q.out.filter(m => /Test for|Server reminders work/.test(m.title)).length === 8);
  assert.equal(plan(d, q.s, T0 + MIN).out.filter(m => /Test for/.test(m.title)).length, 0); }

/* 9. the cron with a fake Upstash and a fake ntfy.sh, including ntfy's rate limit */
const R = {str: {}, hash: {}};
for (const [p, d] of Object.entries(base())) (R.hash['nrw:docs'] ||= {})[p] = JSON.stringify(d);
R.str['nrw:v'] = '7';
let ntfy = [], ntfyStatus = 200, redisCalls = 0;
globalThis.fetch = async (u, init) => {
  if (u === 'https://ntfy.sh/') { ntfy.push(JSON.parse(init.body)); return new Response('{}', {status: ntfyStatus}); }
  redisCalls++;
  const res = JSON.parse(init.body).map(([c, ...x]) => ({result: c === 'GET' ? R.str[x[0]] ?? null : c === 'HGETALL' ? Object.entries(R.hash[x[0]] || {}).flat() : c === 'SET' ? (R.str[x[0]] = x[1], 'OK') : null}));
  return new Response(JSON.stringify(res), {status: 200});
};
const {runNotify, notifyBeat} = await import('./notify.js');
(R.hash['nrw:docs'])['config/notify'] = JSON.stringify({personal: 'responsible'});
const db = {ok: true, url: 'https://fake.upstash.io', token: 'x'.repeat(30), prefix: 'nrw'};
let out = await runNotify(db, T0);
assert.equal(out.sent, 3); assert.equal(ntfy[0].topic, TOPIC);
let beat = notifyBeat(R.str['nrw:notify']); assert.equal(beat.active, 2); assert.equal(beat.sentToday, 3); assert.equal(beat.ok, true);
redisCalls = 0; out = await runNotify(db, T0 + MIN); assert.equal(out.skipped, 'idle'); assert.equal(redisCalls, 1, 'idle minute = one small Redis call');
ntfy = []; ntfyStatus = 429; out = await runNotify(db, T0 + 5 * MIN);
assert.equal(ntfy.length, 1); beat = notifyBeat(R.str['nrw:notify']); assert.ok(beat.backoff > T0 + 5 * MIN); assert.equal(beat.ok, false);
ntfy = []; ntfyStatus = 200; await runNotify(db, T0 + 8 * MIN); assert.equal(ntfy.length, 0, 'waits out the rate limit');
await runNotify(db, T0 + 16 * MIN); assert.ok(ntfy.length >= 1, 'resumes after the pause');
console.log('notify tests passed');

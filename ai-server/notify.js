// NOVATECH Risk Watch: continuous phone reminders, sent by the server (Cloudflare cron, every minute).
// The dashboards only push while one of them is open; this keeps reminding the team while an alert is open,
// even when every laptop is closed. It reads the team database, finds open alerts exactly like the dashboard,
// and posts to ntfy.sh:
//   - the TEAM channel (everyone subscribed gets it) every `everyMin` minutes,
//   - each person's own channel every `personalMin` minutes: the people responsible for an open risk, the CEO
//     while a containment waits for approval, and whoever still has an open response task (or everyone).
// ntfy.sh allows about 250 messages a day per sender, refilled slowly, so the server keeps its own budget
// (a token bucket a little stricter than ntfy's) and always serves the team channel before personal channels.
// State lives in Redis at <prefix>:notify; dashboards read it to know the server is reminding and stop their own.
import CASE from './casedata.js';

const {RISKS, ACTIONS, KRIS, RISK_OWNER, ROLE_PERSON, TEAM, PHONE_TOPIC, SITE} = CASE;
const riskById = Object.fromEntries(RISKS.map(r => [r.id, r]));
const actionsOf = rid => ACTIONS.filter(a => a.risks.includes(rid)).map(a => a.id);
const TOPIC_OK = /^[A-Za-z0-9_-]{8,64}$/;
export const NOTIFY_DEFAULT = {on: true, everyMin: 5, personal: 'all', personalMin: 15, min: 8, day: false, lang: 'en', topic: PHONE_TOPIC};
const EVERY = [1, 2, 5, 10, 15, 30, 60], PERSONAL_EVERY = [5, 10, 15, 30, 60];
export const BUDGET = {CAP: 200, REFILL_MS: 400000, RESERVE: 25};   // ntfy: 250 burst, +1 every 5.76 min per sender

/* config/notify, as saved by a dashboard; anything unexpected falls back to the default */
export function notifyConfig(d) {
  const c = {...NOTIFY_DEFAULT}; if (!d || typeof d !== 'object') return c;
  if (typeof d.on === 'boolean') c.on = d.on;
  if (EVERY.includes(d.everyMin)) c.everyMin = d.everyMin;
  if (['all', 'responsible', 'off'].includes(d.personal)) c.personal = d.personal;
  if (PERSONAL_EVERY.includes(d.personalMin)) c.personalMin = d.personalMin;
  if ([1, 8, 12].includes(d.min)) c.min = d.min;
  if (typeof d.day === 'boolean') c.day = d.day;
  if (d.lang === 'fr') c.lang = 'fr';
  if (typeof d.topic === 'string' && TOPIC_OK.test(d.topic)) c.topic = d.topic;
  if (typeof d.test === 'string' && !isNaN(Date.parse(d.test))) c.test = d.test;
  return c;
}
export const personTopic = (topic, name) => topic.slice(0, 50) + '-' + name.toLowerCase();
const cmdTopic = topic => topic.slice(0, 58) + '-cmd';
const ownerOf = rid => RISK_OWNER[rid] || 'Direction';
const personOf = (role, rid) => ROLE_PERSON[role] || riskById[rid].analyst;
const responsibleFor = rid => [...new Set([personOf(ownerOf(rid), rid), riskById[rid].analyst])];

/* ── the dashboard's scoring, on the raw records ── */
const num = x => (Number.isFinite(Number(x)) ? Number(x) : null);
const clampPI = n => Math.max(1, Math.min(4, Math.round(Number(n) || 1)));
function model(docs) {
  const doc = p => (docs[p] && typeof docs[p] === 'object' ? docs[p] : null);
  const inh = r => { const o = doc('reassess/' + r.id); return o && Number.isFinite(o.p) && Number.isFinite(o.i) ? {p: clampPI(o.p), i: clampPI(o.i)} : {p: r.p, i: r.i}; };
  const tgt = r => { const a = inh(r); return {p: Math.min(r.tp, a.p), i: Math.min(r.ti, a.i)}; };
  const STV = {not: 0, prog: 0.5, done: 1};
  const completion = r => { const ids = actionsOf(r.id); if (!ids.length) return 0; return ids.reduce((s, a) => { const d = doc('actions/' + a); return s + (d && d.status in STV ? STV[d.status] : 0); }, 0) / ids.length; };
  const nowPI = r => { const a = inh(r), t = tgt(r), c = completion(r); return {p: Math.round(a.p - (a.p - t.p) * c), i: Math.round(a.i - (a.i - t.i) * c)}; };
  const score = pi => pi.p * pi.i;
  const readings = k => { const d = doc('kri/' + k.id); const arr = d && Array.isArray(d.readings) ? d.readings : [];
    return arr.filter(x => x && num(x.v) !== null && typeof x.at === 'string' && !isNaN(Date.parse(x.at))).map(x => ({v: Number(x.v), at: x.at})).sort((a, b) => Date.parse(a.at) - Date.parse(b.at)); };
  const response = rid => { const d = doc('response/' + rid); return d && typeof d.at === 'string' && !isNaN(Date.parse(d.at)) ? d : null; };
  return {doc, inh, nowPI, score, readings, response};
}
function kriLevel(k, v) {
  if (v == null) return 'none';
  if (k.dir === 'up') { if (v >= k.red) return 'critical'; if (v >= k.amber) return 'warning'; }
  else { if (v <= k.red) return 'critical'; if (v <= k.amber) return 'warning'; }
  return 'ok';
}
function trend(k, rs) {
  const pts = rs.slice(-4); if (pts.length < 2) return null;
  const xs = pts.map(p => Date.parse(p.at) / 864e5), ys = pts.map(p => p.v);
  const avg = a => a.reduce((s, x) => s + x, 0) / a.length, mx = avg(xs), my = avg(ys);
  let n = 0, d = 0; for (let j = 0; j < xs.length; j++) { n += (xs[j] - mx) * (ys[j] - my); d += (xs[j] - mx) ** 2; }
  const worse = (d ? n / d * 7 : 0) * (k.dir === 'up' ? 1 : -1), band = Math.abs(k.red - k.amber) || 1;
  const dir = Math.abs(worse) < band * 0.02 ? 'stable' : worse > 0 ? 'worse' : 'better';
  const v = ys[ys.length - 1], gA = k.dir === 'up' ? k.amber - v : v - k.amber;
  return {dir, toAmber: dir === 'worse' && gA > 0 ? gA / worse : null};
}
/* Open alerts: indicator red, amber or trending to amber within 6 weeks; not contained since the reading; not acknowledged; score >= min */
export function openAlerts(docs, min = 8) {
  const m = model(docs), out = [];
  for (const k of KRIS) {
    const r = riskById[k.risk], rs = m.readings(k), last = rs[rs.length - 1]; if (!r || !last) continue;
    const lv = kriLevel(k, last.v), t = trend(k, rs);
    const tier = lv === 'critical' ? 'critical' : lv === 'warning' ? 'warning' : lv === 'ok' && t && t.dir === 'worse' && t.toAmber != null && t.toAmber <= 6 ? 'early' : null;
    if (!tier) continue;
    const resp = m.response(k.risk); if (resp && Date.parse(last.at) <= Date.parse(resp.at)) continue;
    const ack = m.doc('acks/' + k.id); if (ack && ack.at === last.at) continue;
    const score = tier === 'critical' ? Math.max(m.score(m.nowPI(r)), m.score(m.inh(r))) : m.score(m.nowPI(r));
    if (score < min) continue;
    out.push({rid: r.id, kid: k.id, tier, score, risk: r.name, kri: k.name, value: Math.round(last.v * 100) / 100 + k.unit, pri: {critical: 300, warning: 200, early: 100}[tier] + score * 6});
  }
  return out.sort((a, b) => b.pri - a.pri);
}
export function pendingApprovals(docs) {
  return RISKS.map(r => ({rid: r.id, d: docs['approval/' + r.id]})).filter(x => x.d && x.d.status === 'pending' && typeof x.d.at === 'string' && !isNaN(Date.parse(x.d.at)))
    .map(x => ({rid: x.rid, at: x.d.at, by: typeof x.d.requestedBy === 'string' ? x.d.requestedBy.slice(0, 40) : null}));
}
export function openTasks(docs) {
  const by = {};
  for (const r of RISKS) {
    const d = docs['response/' + r.id]; if (!d || !Array.isArray(d.steps)) continue;
    d.steps.slice(0, 9).forEach((step, k) => {
      if (Array.isArray(d.done) && d.done[k]) return;
      const p = Array.isArray(d.people) && TEAM.includes(d.people[k]) ? d.people[k] : personOf((Array.isArray(d.owners) && d.owners[k]) || ownerOf(r.id), r.id);
      (by[p] = by[p] || []).push({rid: r.id, n: k + 1, step: String(step).slice(0, 120)});
    });
  }
  return by;
}
const ceoOf = docs => { const g = docs['config/governance']; return g && TEAM.includes(g.ceo) ? g.ceo : 'Krishna'; };

/* ── messages ── */
const L = (c, en, fr) => (c.lang === 'fr' ? fr : en);
const TIER = {en: {critical: 'critical', warning: 'warning', early: 'early warning'}, fr: {critical: 'critique', warning: 'alerte', early: 'alerte précoce'}};
const mins = ms => Math.max(1, Math.round(ms / 60000));
const btn = (topic, label, cmd) => ({action: 'http', label, url: 'https://ntfy.sh/', method: 'POST', clear: true, body: JSON.stringify({topic: cmdTopic(topic), message: cmd, title: 'command'})});
const openBtn = c => ({action: 'view', label: L(c, 'Open dashboard', 'Ouvrir le tableau'), url: SITE});
const containBtns = (c, rids, who) => {
  const ids = [...new Set(rids)], by = who ? ' by ' + who : '';
  const list = ids.length > 2 ? [btn(c.topic, L(c, `Contain ${ids[0]}`, `Contenir ${ids[0]}`), `CONTAIN ${ids[0]}${by}`), btn(c.topic, L(c, 'Contain all', 'Tout contenir'), 'CONTAIN ALL' + by)]
    : ids.map(id => btn(c.topic, L(c, `Contain ${id}`, `Contenir ${id}`), `CONTAIN ${id}${by}`));
  return [...list, openBtn(c)].slice(0, 3);
};
const alertLine = (c, a) => `• ${a.rid} ${a.risk} (${L(c, 'score', 'score')} ${a.score}, ${TIER[c.lang][a.tier]}): ${a.kri} ${a.value}`;

export function teamMessage(c, alerts, pend, tasks, ceo, now) {
  const nTasks = Object.values(tasks).reduce((s, l) => s + l.length, 0);
  const crit = alerts.some(a => a.tier === 'critical');
  const head = alerts.length ? L(c, `${alerts.length} open risk alert${alerts.length > 1 ? 's' : ''}`, `${alerts.length} alerte${alerts.length > 1 ? 's' : ''} de risque ouverte${alerts.length > 1 ? 's' : ''}`)
    : pend.length ? L(c, `Waiting for ${ceo} (CEO)`, `En attente de ${ceo} (PDG)`) : L(c, `${nTasks} response task${nTasks > 1 ? 's' : ''} still open`, `${nTasks} tâche${nTasks > 1 ? 's' : ''} de réponse encore ouverte${nTasks > 1 ? 's' : ''}`);
  const lines = alerts.slice(0, 4).map(a => alertLine(c, a) + ` → ${responsibleFor(a.rid).join(', ')}`);
  if (alerts.length > 4) lines.push(L(c, `+${alerts.length - 4} more`, `+${alerts.length - 4} de plus`));
  pend.slice(0, 3).forEach(p => lines.push(L(c, `⏳ ${p.rid} ${riskById[p.rid].name}: waiting for ${ceo} (CEO) for ${mins(now - Date.parse(p.at))} min`, `⏳ ${p.rid} ${riskById[p.rid].name} : en attente de ${ceo} (PDG) depuis ${mins(now - Date.parse(p.at))} min`)));
  if (nTasks) lines.push(L(c, 'Open tasks: ', 'Tâches ouvertes : ') + Object.entries(tasks).map(([p, l]) => `${p} ${l.length}`).join(', '));
  lines.push(L(c, `Reminder every ${c.everyMin} min until it is contained or acknowledged.`, `Rappel toutes les ${c.everyMin} min jusqu’au confinement ou à l’acquittement.`));
  const rids = alerts.filter(a => !pend.some(p => p.rid === a.rid)).map(a => a.rid);
  return {topic: c.topic, title: head, message: lines.join('\n'), priority: crit ? 5 : alerts.length ? 4 : 3,
    tags: [crit ? 'rotating_light' : alerts.length ? 'warning' : pend.length ? 'hourglass' : 'clipboard'], click: SITE, actions: rids.length ? containBtns(c, rids) : [openBtn(c)]};
}
/* one message per person, combining everything that is theirs; null when nothing is */
export function personMessage(c, name, alerts, pend, tasks, ceo, now, everyone) {
  const mine = alerts.filter(a => responsibleFor(a.rid).includes(name)), myTasks = tasks[name] || [], approve = name === ceo ? pend : [];
  if (!mine.length && !myTasks.length && !approve.length && !(everyone && alerts.length)) return null;
  const lines = [], role = rid => (ROLE_PERSON[ownerOf(rid)] === name ? ownerOf(rid) : L(c, 'risk analyst', 'analyste du risque'));
  approve.forEach(p => lines.push(L(c, `Your decision: contain ${p.rid} ${riskById[p.rid].name}? Asked by ${p.by || 'the team'} ${mins(now - Date.parse(p.at))} min ago.`, `Votre décision : contenir ${p.rid} ${riskById[p.rid].name} ? Demandé par ${p.by || 'l’équipe'} il y a ${mins(now - Date.parse(p.at))} min.`)));
  mine.slice(0, 3).forEach(a => lines.push(alertLine(c, a) + L(c, ` (you: ${role(a.rid)})`, ` (vous : ${role(a.rid)})`)));
  myTasks.slice(0, 3).forEach(t => lines.push(L(c, `☐ ${t.rid} step ${t.n}: ${t.step}`, `☐ ${t.rid} étape ${t.n} : ${t.step}`)));
  if (myTasks.length > 3) lines.push(L(c, `+${myTasks.length - 3} more tasks`, `+${myTasks.length - 3} autres tâches`));
  const others = alerts.filter(a => !mine.includes(a));
  if (everyone && others.length) lines.push(L(c, 'Also open: ', 'Aussi ouvert : ') + others.slice(0, 4).map(a => `${a.rid} ${a.risk}`).join(', '));
  let title, actions, priority = 4, tags = ['bust_in_silhouette'];
  if (approve.length) {
    const target = approve.length > 1 ? 'ALL' : approve[0].rid;
    title = L(c, `${name}, CEO approval needed: ${approve.map(p => p.rid).join(', ')}`, `${name}, validation du PDG requise : ${approve.map(p => p.rid).join(', ')}`);
    actions = [btn(c.topic, L(c, 'Approve', 'Valider'), `APPROVE ${target} by ${name}`), btn(c.topic, L(c, 'Reject', 'Refuser'), `REJECT ${target} by ${name}`), openBtn(c)]; priority = 5; tags = ['briefcase', 'warning'];
  } else if (myTasks.length) {
    title = L(c, `${name}: ${myTasks.length} response task${myTasks.length > 1 ? 's' : ''} waiting for you`, `${name} : ${myTasks.length} tâche${myTasks.length > 1 ? 's' : ''} de réponse vous attend${myTasks.length > 1 ? 'ent' : ''}`);
    actions = [...myTasks.slice(0, 2).map(t => btn(c.topic, L(c, `Done: ${t.rid} step ${t.n}`, `Fait : ${t.rid} étape ${t.n}`), `DONE ${t.rid} ${t.n} by ${name}`)), openBtn(c)];
  } else if (mine.length) {
    title = L(c, `${name}: ${mine.map(a => a.rid).filter((x, i, l) => l.indexOf(x) === i).join(', ')} needs you`, `${name} : ${mine.map(a => a.rid).filter((x, i, l) => l.indexOf(x) === i).join(', ')} a besoin de vous`);
    actions = containBtns(c, mine.filter(a => !pend.some(p => p.rid === a.rid)).map(a => a.rid), name);
    if (mine.some(a => a.tier === 'critical')) priority = 5;
  } else {
    title = L(c, `${name}: ${alerts.length} risk alert${alerts.length > 1 ? 's' : ''} open in the team`, `${name} : ${alerts.length} alerte${alerts.length > 1 ? 's' : ''} ouverte${alerts.length > 1 ? 's' : ''} dans l’équipe`);
    actions = [openBtn(c)]; priority = 3; tags = ['busts_in_silhouette'];
  }
  return {topic: personTopic(c.topic, name), title, message: lines.join('\n'), priority, tags, click: SITE, actions};
}

/* ── one cron tick ── */
const parse = s => { try { const o = JSON.parse(s); return o && typeof o === 'object' && !Array.isArray(o) ? o : null; } catch { return null; } };
const parisHour = now => Number(new Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Paris', hour: 'numeric', hourCycle: 'h23'}).format(new Date(now)));

/* Decide what to send now. Pure: returns the messages and the new state (tested without the network). */
export function plan(docs, st, now) {
  const c = notifyConfig(docs['config/notify']);
  const s = {...st, person: {...(st.person || {})}};
  s.tokens = Math.min(BUDGET.CAP, (Number.isFinite(s.tokens) ? s.tokens : BUDGET.CAP) + Math.max(0, now - (s.tAt || now)) / BUDGET.REFILL_MS); s.tAt = now;
  const out = [];
  const take = (msg, reserve) => { if (msg && s.tokens >= 1 + reserve) { s.tokens -= 1; out.push(msg); return true; } return false; };
  const ceo = ceoOf(docs);
  if (c.test && c.test !== s.testDone) {                      // "Send a test" from the dashboard: team channel + every personal channel
    s.testDone = c.test;
    take({topic: c.topic, title: L(c, 'Server reminders work', 'Les rappels du serveur fonctionnent'), message: L(c, 'The NOVATECH server will remind this team channel while a risk alert is open, even when every dashboard is closed.', 'Le serveur NOVATECH rappellera ce canal d’équipe tant qu’une alerte est ouverte, même si tous les tableaux sont fermés.'), priority: 3, tags: ['white_check_mark'], click: SITE}, 0);
    if (c.personal !== 'off') TEAM.forEach(n => take({topic: personTopic(c.topic, n), title: L(c, `Test for ${n}`, `Test pour ${n}`), message: L(c, `If ${n} can read this, ${n}’s personal channel works.`, `Si ${n} lit ceci, son canal personnel fonctionne.`), priority: 3, tags: ['white_check_mark'], click: SITE}, 0));
  }
  const alerts = openAlerts(docs, c.min), pend = pendingApprovals(docs), tasks = openTasks(docs);
  const active = alerts.length + pend.length + Object.keys(tasks).length > 0;
  s.on = c.on; s.active = alerts.length; s.pending = pend.length; s.tasks = Object.values(tasks).reduce((n, l) => n + l.length, 0);
  s.everyMin = c.everyMin; s.personal = c.personal; s.quiet = c.day && (parisHour(now) < 8 || parisHour(now) >= 21);
  if (!c.on || !active || s.quiet || now < (s.backoff || 0)) {
    if (!active) { s.lastTeam = 0; s.person = {}; }
    s.next = now < (s.backoff || 0) ? s.backoff : now + 10 * 60000;     // a config change (new version) is picked up at once anyway
    return {c, out, s};
  }
  if (now - (s.lastTeam || 0) >= c.everyMin * 60000 - 20000 && take(teamMessage(c, alerts, pend, tasks, ceo, now), 0)) s.lastTeam = now;
  if (c.personal !== 'off') {
    const urgent = [ceo, ...Object.keys(tasks), ...alerts.flatMap(a => responsibleFor(a.rid))];
    const names = [...new Set([...urgent, ...(c.personal === 'all' ? TEAM : [])])].filter(n => TEAM.includes(n));
    for (const n of names) {
      if (now - (s.person[n] || 0) < c.personalMin * 60000 - 20000) continue;
      if (take(personMessage(c, n, alerts, pend, tasks, ceo, now, c.personal === 'all'), BUDGET.RESERVE)) s.person[n] = now;
    }
  }
  /* when to look again: the next reminder due, but not before the budget allows one */
  const tokenAt = need => now + Math.max(0, need - s.tokens) * BUDGET.REFILL_MS;
  let next = Math.max((s.lastTeam || 0) + c.everyMin * 60000, tokenAt(1));
  if (c.personal !== 'off') for (const n of TEAM) if (s.person[n] || c.personal === 'all') next = Math.min(next, Math.max((s.person[n] || 0) + c.personalMin * 60000, tokenAt(1 + BUDGET.RESERVE)));
  s.next = next;
  return {c, out, s};
}

async function redis(cfg, cmds) {
  const r = await fetch(cfg.url + '/pipeline', {method: 'POST', headers: {Authorization: 'Bearer ' + cfg.token, 'content-type': 'application/json'}, body: JSON.stringify(cmds)});
  const out = await r.json().catch(() => null);
  if (!r.ok || !Array.isArray(out)) throw new Error('Redis error ' + r.status);
  return out.map(x => x && x.result);
}
function docsOf(res) {
  const o = {}, docs = {};
  if (Array.isArray(res)) for (let k = 0; k + 1 < res.length; k += 2) o[res[k]] = res[k + 1]; else if (res && typeof res === 'object') Object.assign(o, res);
  for (const [p, v] of Object.entries(o)) { const d = parse(v); if (d) docs[p] = d; }
  return docs;
}
export async function runNotify(db, now = Date.now()) {
  if (!db.ok) return {skipped: 'no database'};
  const P = db.prefix;
  const [raw, v] = await redis(db, [['GET', P + ':notify'], ['GET', P + ':v']]);
  const st = parse(raw) || {}, ver = Number(v) || 0;
  /* nothing changed, nothing due: only refresh the heartbeat every 2 minutes */
  const due = !!(st.active || st.pending || st.tasks) && now >= (st.next || 0) - 20000;
  if (ver === st.v && !due && now - (st.at || 0) < 110000) return {skipped: 'idle'};
  let s = st, sent = 0, failed = '';
  if (ver !== st.v || due) {
    const [all] = await redis(db, [['HGETALL', P + ':docs']]);
    const r = plan(docsOf(all), st, now); s = r.s; s.v = ver;
    for (const m of r.out) {
      try {
        const res = await fetch('https://ntfy.sh/', {method: 'POST', body: JSON.stringify({...m, title: m.title.slice(0, 120), message: m.message.slice(0, 900)})});
        if (res.ok) { sent++; continue; }
        failed = 'ntfy.sh answered ' + res.status;
        if (res.status === 429) { s.backoff = now + 10 * 60000; s.tokens = 0; break; }
      } catch (e) { failed = 'ntfy.sh unreachable'; }
    }
    if (sent) { s.lastSent = now; s.sentToday = (s.day === new Date(now).toISOString().slice(0, 10) ? s.sentToday || 0 : 0) + sent; s.day = new Date(now).toISOString().slice(0, 10); }
    s.ok = !failed; s.err = failed ? failed.slice(0, 80) : ''; if (failed) s.errAt = now;
  }
  s.at = now;
  await redis(db, [['SET', P + ':notify', JSON.stringify(s), 'EX', '86400']]);
  return {sent, failed, active: s.active || 0};
}
/* Small public summary for dashboards (no message content) */
export function notifyBeat(raw) {
  const s = parse(raw); if (!s) return null;
  const n = x => (Number.isFinite(x) ? x : 0);
  return {at: n(s.at), on: s.on !== false, ok: s.ok !== false, err: typeof s.err === 'string' ? s.err.slice(0, 80) : '', lastSent: n(s.lastSent), sentToday: n(s.sentToday),
    active: n(s.active), pending: n(s.pending), tasks: n(s.tasks), quiet: !!s.quiet, backoff: n(s.backoff), tokens: Math.floor(n(s.tokens))};
}

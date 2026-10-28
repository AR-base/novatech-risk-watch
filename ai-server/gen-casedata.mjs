// Run from the repo root after changing the dashboard: node ai-server/gen-casedata.mjs index.html ai-server/casedata.js
// Writes ai-server/casedata.js from the dashboard's own constants, so the server computes alerts exactly like the dashboard.
import {readFileSync, writeFileSync} from 'node:fs';
const [src, out] = process.argv.slice(2);
const html = readFileSync(src, 'utf8');
function grab(name){
  const a = html.indexOf(`const ${name} = `); if (a < 0) throw new Error('missing ' + name);
  const open = html[a + name.length + 9]; const close = open === '[' ? ']' : '}';
  let depth = 0, i = a + name.length + 9, q = null;
  for (; i < html.length; i++) {
    const c = html[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === open) depth++; else if (c === close && --depth === 0) break;
  }
  return Function('return ' + html.slice(a + name.length + 9, i + 1))();
}
const RISKS = grab('RISKS').map(({id, name, analyst, p, i, tp, ti}) => ({id, name, analyst, p, i, tp, ti}));
const ACTIONS = grab('ACTIONS').map(({id, risks}) => ({id, risks}));
const KRIS = grab('KRIS').map(({id, risk, name, unit, dir, amber, red}) => ({id, risk, name, unit, dir, amber, red}));
const RISK_OWNER = grab('RISK_OWNER'), ROLE_PERSON = grab('ROLE_PERSON'), TEAM = grab('TEAM');
const PHONE_TOPIC = /const PHONE_TOPIC = '([A-Za-z0-9_-]{8,64})'/.exec(html)[1];
const SITE = 'https://ar-base.github.io/novatech-risk-watch/';
writeFileSync(out, '// Generated from the dashboard (index.html) by gen_casedata.mjs. Do not edit by hand.\n' +
  'export default ' + JSON.stringify({RISKS, ACTIONS, KRIS, RISK_OWNER, ROLE_PERSON, TEAM, PHONE_TOPIC, SITE}) + ';\n');
console.log('casedata', RISKS.length, ACTIONS.length, KRIS.length, TEAM.length, PHONE_TOPIC);

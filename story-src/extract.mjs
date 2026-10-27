// Pull the case data (risks, actions, indicators, playbooks, cost model) out of the built dashboard so both pages share one source.
import { readFileSync, writeFileSync } from 'node:fs';
const s = readFileSync('/home/claude/site/index.html', 'utf8');
const grab = (name, open = '[') => { const i = s.indexOf(`const ${name} = ${open}`); if (i < 0) throw new Error(name); let d = 0, j = s.indexOf(open, i);
  for (let k = j; k < s.length; k++) { const c = s[k]; if (c === '[' || c === '{') d++; else if (c === ']' || c === '}') { d--; if (!d) return s.slice(j, k + 1); } } };
const out = {};
for (const [n, o] of [['RISKS', '['], ['ACTIONS', '['], ['KRIS', '['], ['DEFAULT_ASSUMP', '{'], ['SEED', '{'], ['IMPACT_PROFILE', '{'], ['PLAYBOOKS', '{'], ['RISK_OWNER', '{'], ['ROLE_PERSON', '{'], ['SECTORS', '[']]) out[n] = Function('return ' + grab(n, o))();
writeFileSync('data.json', JSON.stringify(out));
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Array.isArray(v) ? v.length : Object.keys(v).length])));

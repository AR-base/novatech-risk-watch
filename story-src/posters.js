/* ───────────── Risk posters ─────────────
   One illustrated poster per risk, showing what the risk looks like when it happens. Shared by the story site and the
   dashboard. Pure SVG built from constant markup (no user data goes in), 300 × 450 portrait, ids prefixed per poster
   so many can sit on one page. */
const POSTER_ART = (() => {
  /* person silhouette: head + shoulders, standing at x,y (feet), height h */
  const person = (x, y, h, fill, extra = '') => { const s = h / 100;
    return `<g transform="translate(${x},${y}) scale(${s})" fill="${fill}" ${extra}><circle cx="0" cy="-88" r="11"/><path d="M-17,-74 Q0,-80 17,-74 L21,-40 L14,-40 L13,0 L3,0 L1,-34 L-1,-34 L-3,0 L-13,0 L-14,-40 L-21,-40 Z"/></g>`; };
  const hood = (x, y, h, fill, rim) => { const s = h / 100;
    return `<g transform="translate(${x},${y}) scale(${s})" fill="${fill}" ${rim ? `stroke="${rim}" stroke-width="1.6"` : ''}><path d="M0,-104 C-20,-104 -26,-86 -24,-70 C-40,-62 -46,-40 -48,0 L48,0 C46,-40 40,-62 24,-70 C26,-86 20,-104 0,-104 Z"/><path d="M-11,-88 Q0,-96 11,-88 L9,-72 Q0,-66 -9,-72 Z" fill="#000" opacity=".85"/></g>`; };
  const stars = (cx, cy, r, n, fill, size = 4) => Array.from({length:n}, (_, k) => { const a = k / n * Math.PI * 2 - Math.PI / 2; return `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="${size}" fill="${fill}"/>`; }).join('');
  const rnd = seed => { let x = seed; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };
  const dust = (seed, n, color, op = .5) => { const R = rnd(seed); return Array.from({length:n}, () => `<circle cx="${(R() * 300).toFixed(0)}" cy="${(R() * 450).toFixed(0)}" r="${(R() * 1.6 + .3).toFixed(1)}" fill="${color}" opacity="${(R() * op).toFixed(2)}"/>`).join(''); };
  /* each scene: [background top, background bottom, accent, markup(p) where p = id prefix] */
  return {
    R1:['#0a1a3a', '#020611', '#4fa8ff', p => `${dust(11, 70, '#bcd9ff', .7)}
      <circle cx="232" cy="70" r="26" fill="#cfe4ff" opacity=".18"/>
      <g fill="#c9d8ea"><path d="M60,190 Q60,150 100,150 Q112,112 156,116 Q196,100 214,140 Q252,140 252,176 Q252,206 222,206 L88,206 Q60,206 60,190 Z"/></g>
      <path d="M150,118 L136,160 L160,160 L140,206" fill="none" stroke="#0a1a3a" stroke-width="7" stroke-linejoin="round"/>
      <path d="M168,206 L146,252 L170,252 L140,312" fill="none" stroke="#ffd34d" stroke-width="6" stroke-linejoin="round" filter="url(#${p}glow)"/>
      ${[0, 1, 2].map(k => `<g transform="translate(${70 + k * 58},300)"><rect width="44" height="96" rx="3" fill="#0e1729" stroke="#22324d"/>${[0, 1, 2, 3, 4, 5].map(j => `<rect x="7" y="${10 + j * 14}" width="30" height="6" rx="1" fill="#16233a"/><circle cx="33" cy="${13 + j * 14}" r="2" fill="${(k + j) % 3 ? '#ff3b3b' : '#3a4a63'}"/>`).join('')}</g>`).join('')}`],
    R2:['#06140c', '#000', '#2bff88', p => { const R = rnd(7); return `${Array.from({length:22}, (_, k) => { const x = 8 + k * 13.5; return Array.from({length:14}, (_, j) => `<text x="${x}" y="${20 + j * 24 + (k % 3) * 9}" fill="#22d36f" opacity="${(R() * .55 + .05).toFixed(2)}" font-family="monospace" font-size="13">${R() > .5 ? 1 : 0}</text>`).join(''); }).join('')}
      <circle cx="150" cy="200" r="150" fill="url(#${p}spot)"/><circle cx="150" cy="190" r="80" fill="#2bff88" opacity=".12"/>
      ${hood(150, 450, 290, '#020703', '#2bff88')}
      <g transform="translate(150,330)" filter="url(#${p}glow)"><rect x="-26" y="-6" width="52" height="40" rx="6" fill="none" stroke="#ff2d4f" stroke-width="5"/><path d="M-16,-6 V-20 A16,16 0 0 1 16,-20 V-6" fill="none" stroke="#ff2d4f" stroke-width="5"/><circle cx="0" cy="12" r="5" fill="#ff2d4f"/><rect x="-2" y="14" width="4" height="10" fill="#ff2d4f"/></g>
      <text x="150" y="262" text-anchor="middle" font-family="monospace" font-size="12" fill="#ff2d4f" letter-spacing="2">FILES ENCRYPTED</text>`; }],
    R3:['#1b0f2e', '#06030c', '#ffcc33', p => `${stars(150, 150, 70, 12, '#ffcc33', 5)}
      <g transform="translate(150,170)"><rect x="-40" y="-26" width="80" height="62" rx="8" fill="#2a1a46" stroke="#ffcc33" stroke-width="4"/><path d="M-24,-26 V-48 A24,24 0 0 1 20,-56" fill="none" stroke="#ffcc33" stroke-width="7" stroke-linecap="round"/><circle cx="0" cy="2" r="7" fill="#ffcc33"/></g>
      ${[[-70, 300, -18], [-20, 270, 8], [40, 320, -6], [90, 280, 14], [-100, 360, 10], [10, 380, -12], [80, 380, 4]].map(([x, y, r], k) => `<g transform="translate(${150 + x},${y}) rotate(${r})"><rect x="-22" y="-28" width="44" height="56" rx="3" fill="#f3efe6" opacity="${.95 - k * .08}"/><rect x="-14" y="-18" width="28" height="3" fill="#9a8fb3"/><rect x="-14" y="-10" width="22" height="3" fill="#9a8fb3"/><rect x="-14" y="-2" width="26" height="3" fill="#9a8fb3"/><circle cx="-8" cy="12" r="5" fill="#c9b8ee"/></g>`).join('')}`],
    R4:['#3a1d06', '#0e0702', '#ffae2b', p => `<circle cx="150" cy="210" r="90" fill="#ff8c1a" opacity=".55"/><circle cx="150" cy="210" r="60" fill="#ffc15a" opacity=".6"/>
      <path d="M0,300 L300,300 L300,450 L0,450 Z" fill="#160a03"/><path d="M150,300 L120,450 M150,300 L180,450" stroke="#3b2210" stroke-width="3"/><path d="M150,316 L146,340 M150,360 L145,392 M149,410 L143,450" stroke="#ffae2b" stroke-width="4"/>
      <g transform="translate(70,300)" fill="#070301"><rect x="0" y="-66" width="104" height="58" rx="3"/><path d="M104,-50 L136,-50 L152,-28 L152,-8 L104,-8 Z"/><circle cx="22" cy="-6" r="13"/><circle cx="128" cy="-6" r="13"/><rect x="8" y="-60" width="88" height="2" fill="#2a1508"/></g>
      <g transform="translate(232,330)"><path d="M0,-30 L28,18 L-28,18 Z" fill="none" stroke="#ff4d2e" stroke-width="5" stroke-linejoin="round"/><rect x="-2" y="-12" width="4" height="16" fill="#ff4d2e"/><circle cx="0" cy="10" r="2.5" fill="#ff4d2e"/></g>`],
    R5:['#062a2c', '#010a0b', '#3ff0e0', p => `${dust(5, 50, '#9ff', .5)}
      <g transform="translate(140,340)" fill="#021213" stroke="#3ff0e0" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M-74,-104 Q-96,-92 -92,-56" fill="none" stroke-width="5"/>
        <rect x="-76" y="-122" width="128" height="52" rx="16"/>
        <path d="M-66,-72 V-12 M-46,-72 V-12 M26,-72 V-12 M44,-72 V-12" stroke-width="10"/>
        <path d="M30,-118 L50,-122 L86,-182 L66,-188 Z"/>
        <path d="M66,-188 L74,-206 L80,-190 L104,-176 L110,-160 L96,-156 L82,-166 Z"/>
        <path d="M-52,-112 H24 M-52,-96 H24 M-52,-80 H24" stroke-width="1.4" opacity=".7"/>
        <rect x="-90" y="-12" width="150" height="14" rx="3"/><circle cx="-64" cy="12" r="11"/><circle cx="34" cy="12" r="11"/>
        <rect x="-20" y="-110" width="22" height="18" rx="2" fill="#3ff0e0" fill-opacity=".25"/></g>
      <g stroke="#3ff0e0" stroke-width="1.6" fill="none" opacity=".75"><path d="M-40,280 H20 V300 H60" transform="translate(150,0)"/><path d="M-60,290 H-20 V310" transform="translate(150,0)"/><circle cx="210" cy="300" r="3" fill="#3ff0e0"/><circle cx="130" cy="310" r="3" fill="#3ff0e0"/></g>
      <g transform="translate(70,150) rotate(-30)" filter="url(#${p}glow)"><circle r="12" fill="none" stroke="#ffd65a" stroke-width="5"/><path d="M12,0 H48 M36,0 V10 M44,0 V8" stroke="#ffd65a" stroke-width="5"/></g>`],
    R6:['#2b2b33', '#08080b', '#e9e2d0', p => `<path d="M100,0 L200,0 L190,450 L110,450 Z" fill="#0f0f13"/>
      <path d="M0,0 L100,0 L110,450 L0,450 Z" fill="#17171d"/><path d="M300,0 L200,0 L190,450 L300,450 Z" fill="#17171d"/>
      <rect x="128" y="120" width="44" height="88" fill="#fff4d6"/><rect x="128" y="120" width="44" height="88" fill="url(#${p}spot)"/>
      ${person(150, 206, 62, '#08080b')}<rect x="157" y="180" width="12" height="9" rx="1" fill="#08080b"/>
      <path d="M128,208 L84,450 L216,450 L172,208 Z" fill="#fff4d6" opacity=".12"/>
      <g fill="#e9e2d0" opacity=".85"><rect x="34" y="96" width="34" height="5"/><rect x="34" y="106" width="22" height="5"/><rect x="232" y="96" width="34" height="5"/></g>`],
    R7:['#3a0711', '#0d0204', '#ff5a3c', p => `${[0, 1, 2, 3, 4].map(k => `<path d="M0,${380 - k * 70} H300" stroke="#5a1220" stroke-width="1"/>`).join('')}
      <path d="M20,400 L80,360 L120,370 L170,290 L210,250 L246,130" fill="none" stroke="#ff5a3c" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" filter="url(#${p}glow)"/>
      <path d="M246,130 L224,148 M246,130 L254,158" stroke="#ff5a3c" stroke-width="9" stroke-linecap="round"/>
      <path d="M232,0 L240,60 L222,96 L246,130 L268,170 L254,230 L274,300" fill="none" stroke="#ffd2c4" stroke-width="2.5" opacity=".9"/>
      <path d="M246,130 L290,110 M246,130 L300,150 M246,130 L210,90" stroke="#ffd2c4" stroke-width="1.6" opacity=".7"/>
      ${[[60, 330], [100, 345], [150, 300], [196, 262]].map(([x, y]) => `<g transform="translate(${x},${y + 70})">${person(0, 0, 34, '#1d0408')}</g>`).join('')}`],
    R8:['#3b3205', '#0d0b01', '#ffd23f', p => `<circle cx="150" cy="120" r="70" fill="#ffd23f" opacity=".22"/>
      <path d="M0,330 Q150,250 300,330 L300,450 L0,450 Z" fill="#080600"/>
      <g stroke="#2a2203" stroke-width="3">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => { const x = 18 + k * 26; return [3, 4, 7].includes(k) ? '' : `<rect x="${x}" y="${280 - Math.sin((k + .5) / 11 * Math.PI) * 26}" width="20" height="8" fill="#c9a24a"/>`; }).join('')}</g>
      <path d="M10,286 Q150,234 290,286" fill="none" stroke="#c9a24a" stroke-width="2"/><path d="M10,262 Q150,210 290,262" fill="none" stroke="#c9a24a" stroke-width="2"/>
      ${person(96, 262, 56, '#0d0b01')}
      <g fill="#ffd23f" opacity=".9"><path d="M114,290 l6,10 l-6,10 l-6,-10z"/><path d="M200,300 l5,8 l-5,8 l-5,-8z"/></g>`],
    R9:['#04384f', '#01131c', '#7fe3ff', p => `${dust(9, 40, '#e6fbff', .6)}
      <path d="M0,170 H300 V450 H0 Z" fill="#022a3b" opacity=".85"/>
      <path d="M118,170 L140,120 L156,138 L172,104 L190,170 Z" fill="#f2fdff"/>
      <path d="M118,170 L190,170 L250,250 L262,330 L210,410 L120,430 L52,370 L40,280 L80,210 Z" fill="#8fdcf2" opacity=".55"/>
      <path d="M118,170 L190,170 L222,240 L160,260 L96,236 Z" fill="#bff0ff" opacity=".35"/>
      <path d="M0,170 Q20,164 40,170 T80,170 T120,170 T160,170 T200,170 T240,170 T280,170 T320,170" fill="none" stroke="#bff0ff" stroke-width="2" opacity=".8"/>
      <g transform="translate(70,166)"><path d="M-22,0 L24,0 L16,8 L-16,8 Z" fill="#0b0b0b"/><rect x="-1" y="-30" width="2" height="30" fill="#0b0b0b"/><path d="M1,-28 L18,-6 L1,-6 Z" fill="#e8e1d4"/></g>`],
    R10:['#2a0b33', '#08020a', '#ff9a2e', p => `<circle cx="150" cy="150" r="90" fill="url(#${p}spot)"/>
      <g transform="translate(150,0)"><rect x="-30" y="190" width="60" height="190" fill="#e9dccf"/><path d="M-30,190 Q-20,214 -30,240 M30,190 Q24,226 30,262" stroke="#cdbcaa" stroke-width="10" fill="none"/>
      <path d="M-30,190 Q-36,230 -46,250 Q-40,262 -30,252" fill="#e9dccf"/><path d="M30,380 L30,380" />
      <path d="M0,190 L0,176" stroke="#2a1a12" stroke-width="3"/><path d="M0,120 Q22,150 12,172 Q0,186 -12,172 Q-22,150 0,120 Z" fill="#ff9a2e" filter="url(#${p}glow)"/><path d="M0,140 Q10,158 5,170 Q0,176 -5,170 Q-10,158 0,140 Z" fill="#ffe7a8"/>
      <path d="M-30,380 L30,380 L40,396 L-40,396 Z" fill="#180714"/>
      <g transform="rotate(180) translate(0,-420)"><path d="M0,0 Q8,14 4,22 Q0,28 -4,22 Q-8,14 0,0 Z" fill="#ff9a2e" transform="translate(0,26)" filter="url(#${p}glow)"/></g></g>
      ${dust(10, 30, '#ffcf8a', .6)}`],
    R11:['#2e2305', '#0a0701', '#ffcf3a', p => `<g transform="translate(150,236)">
      <path d="M-70,-160 H70 M-70,160 H70" stroke="#ffcf3a" stroke-width="10" stroke-linecap="round"/>
      <path d="M-58,-152 Q-58,-40 -8,0 Q-58,40 -58,152 M58,-152 Q58,-40 8,0 Q58,40 58,152" fill="none" stroke="#f6e7b0" stroke-width="5" opacity=".9"/>
      <path d="M-50,-140 Q-46,-70 0,-24 Q46,-70 50,-140 Z" fill="#ffcf3a" opacity=".22"/>
      ${[[-30, 100], [-12, 112], [10, 104], [28, 118], [-22, 130], [0, 124], [20, 138], [-38, 140], [36, 144], [-6, 144]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="4.5" fill="#ffcf3a" stroke="#8a6a0f" stroke-width="1.5"/>`).join('')}
      ${[0, 1, 2, 3].map(k => `<ellipse cx="0" cy="${-6 + k * 22}" rx="8" ry="3.4" fill="#ffcf3a" opacity="${1 - k * .15}"/>`).join('')}
      <path d="M-46,-120 L46,-120" stroke="#ffcf3a" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/></g>`],
    R12:['#0c1e44', '#030817', '#ffd400', p => `${stars(150, 120, 64, 12, '#ffd400', 6)}
      <g transform="translate(150,300) rotate(-6)"><rect x="-86" y="-90" width="172" height="200" rx="4" fill="#efe8d8"/>
      ${Array.from({length:16}, (_, k) => `<rect x="-70" y="${-74 + k * 11}" width="${k % 5 === 4 ? 80 : 140}" height="3.5" fill="#8a8170" opacity=".8"/>`).join('')}
      <path d="M-66,90 Q-40,70 -20,92 T20,86" fill="none" stroke="#1a2a5a" stroke-width="3"/></g>
      <g transform="translate(210,330)"><circle r="40" fill="#fff" fill-opacity=".14" stroke="#1b1b1b" stroke-width="8"/><path d="M28,28 L70,72" stroke="#1b1b1b" stroke-width="14" stroke-linecap="round"/>
      <rect x="-26" y="-6" width="52" height="3.5" fill="#c4122f"/><rect x="-26" y="2" width="40" height="3.5" fill="#c4122f"/></g>`],
    R13:['#1a0a2e', '#05020b', '#c56bff', p => `<rect x="0" y="330" width="300" height="120" fill="#0b0414"/>
      <path d="M118,330 L40,450 L300,450 L300,400 Z" fill="#000" opacity=".55"/>
      ${person(118, 330, 120, '#05020b')}
      ${[[176, 90, '#ff3d8b'], [228, 120, '#3df2ff'], [196, 170, '#ffd53d'], [248, 196, '#7dff6a'], [172, 236, '#c56bff'], [232, 262, '#ff7a3d'], [70, 120, '#3d8bff']].map(([x, y, c], k) => `<g transform="translate(${x},${y}) rotate(${(k % 3 - 1) * 8})" filter="url(#${p}glow)"><rect x="-17" y="-17" width="34" height="34" rx="9" fill="${c}" opacity=".9"/><rect x="-8" y="-8" width="16" height="16" rx="4" fill="#000" opacity=".35"/></g>`).join('')}
      <g stroke="#c56bff" stroke-width="1" opacity=".4" fill="none"><path d="M118,230 L176,90 M118,230 L228,120 M118,230 L196,170"/></g>`],
    R14:['#2b1406', '#0a0502', '#ff8a3d', p => `<circle cx="150" cy="150" r="80" fill="#ff8a3d" opacity=".25"/>
      <path d="M0,340 H300 V450 H0 Z" fill="#0d0603"/>
      ${[[26, 150, '#1a0d05'], [114, 120, '#1a0d05'], [202, 160, '#1a0d05']].map(([x, h, c], k) => `<g transform="translate(${x},340)"><rect x="0" y="${-h}" width="72" height="${h}" fill="${c}"/>${Array.from({length:Math.floor(h / 26)}, (_, j) => [0, 1, 2].map(i => `<rect x="${10 + i * 20}" y="${-h + 12 + j * 26}" width="12" height="14" fill="${k === 1 && (i + j) % 4 === 0 ? '#3b2617' : '#ffcf8a'}" opacity="${k === 1 ? .35 : .85}"/>`).join('')).join('')}
        ${k === 1 ? `<rect x="24" y="-40" width="24" height="40" fill="#ff8a3d"/><path d="M48,-40 L62,-34 L62,6 L48,0 Z" fill="#3b2617"/>` : `<rect x="26" y="-34" width="20" height="34" fill="#2a170a"/>`}</g>`).join('')}
      <path d="M150,340 L110,450 L190,450 Z" fill="#ff8a3d" opacity=".25"/>
      <g font-family="Archivo, sans-serif" font-size="11" fill="#ffcf8a" text-anchor="middle" opacity=".8"><text x="62" y="360">NANTES</text><text x="150" y="360">ANGERS</text><text x="238" y="360">RENNES</text></g>`],
    R15:['#05261a', '#010a06', '#3dff8b', p => `<rect x="0" y="0" width="300" height="450" fill="#04140d"/>
      <g transform="translate(150,0)"><rect x="-60" y="140" width="120" height="250" fill="#000"/><path d="M-60,140 L20,154 L20,402 L-60,390 Z" fill="#0f2a1e"/><circle cx="8" cy="270" r="4" fill="#3dff8b"/>
      <path d="M-60,140 L-60,390 L60,390 L60,140" fill="none" stroke="#1d3d2e" stroke-width="6"/>
      <path d="M60,150 L60,390 L150,450 L150,150 Z" fill="#3dff8b" opacity=".06"/>${person(40, 380, 90, '#000')}</g>
      <g transform="translate(150,96)" filter="url(#${p}glow)"><rect x="-44" y="-16" width="88" height="32" rx="3" fill="#0b3b25" stroke="#3dff8b" stroke-width="2"/><text x="0" y="6" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="16" fill="#3dff8b" letter-spacing="3">EXIT</text></g>
      <g transform="translate(86,270) rotate(-20)" fill="#ffd65a"><circle r="8" fill="none" stroke="#ffd65a" stroke-width="3"/><rect x="8" y="-2" width="26" height="4"/><rect x="26" y="0" width="3" height="8"/></g>`],
    R16:['#330509', '#0a0102', '#ff2d4f', p => `<circle cx="150" cy="190" r="110" fill="url(#${p}spot)"/>
      <g transform="translate(150,200)"><path d="M-70,-90 Q0,-120 70,-90 Q80,-10 50,60 Q0,110 -50,60 Q-80,-10 -70,-90 Z" fill="#f1e6da"/>
      <path d="M0,-108 Q-8,0 0,92 Q60,70 64,0 Q76,-60 70,-90 Q40,-104 0,-108 Z" fill="#0d0203"/>
      <path d="M-46,-36 Q-30,-48 -14,-36 Q-30,-28 -46,-36 Z" fill="#0d0203"/><path d="M14,-36 Q30,-48 46,-36 Q30,-28 14,-36 Z" fill="#ff2d4f" filter="url(#${p}glow)"/>
      <path d="M-30,30 Q-14,22 0,30" fill="none" stroke="#0d0203" stroke-width="4" stroke-linecap="round"/></g>
      <g transform="translate(218,360) rotate(18)"><rect x="-16" y="-34" width="32" height="56" rx="5" fill="#d8d0c6"/><rect x="-10" y="-50" width="20" height="18" rx="2" fill="#8a8178"/><rect x="-6" y="-46" width="4" height="5" fill="#2a2522"/><rect x="2" y="-46" width="4" height="5" fill="#2a2522"/></g>`],
  };
})();
const POSTER_TONE = rid => (POSTER_ART[rid] || ['#222', '#000', '#fff'])[2];
/* Full poster markup. opts: {title, score, lv, color} drawn on the poster; ids unique per call. */
let posterSeq = 0;
function posterSVG(rid, opts = {}){
  const art = POSTER_ART[rid]; if (!art) return '';
  const [top, bot, acc, draw] = art, p = `pz${rid}${++posterSeq}`;
  const t = String(opts.title || '').replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]));
  const words = t.toUpperCase().split(/\s+/), lines = []; words.forEach(w => { const l = lines[lines.length - 1]; if (l && (l + ' ' + w).length <= 11) lines[lines.length - 1] = l + ' ' + w; else lines.push(w); });
  const fs = lines.length > 2 ? 34 : 42, y0 = 432 - (lines.length - 1) * fs * .92;
  return `<svg viewBox="0 0 300 450" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${t}">
  <defs><linearGradient id="${p}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient>
  <radialGradient id="${p}spot" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="${acc}" stop-opacity=".45"/><stop offset="1" stop-color="${acc}" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".92"/></linearGradient>
  <filter id="${p}glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="${p}grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .06 0"/></filter></defs>
  <rect width="300" height="450" fill="url(#${p}bg)"/>${draw(p)}
  <rect width="300" height="450" fill="url(#${p}fade)"/><rect width="300" height="450" filter="url(#${p}grain)" opacity=".9"/>
  ${opts.score != null ? `<g transform="translate(266,30)"><circle r="19" fill="#000" fill-opacity=".55" stroke="${opts.color || acc}" stroke-width="3"/><text y="7" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="20" fill="#fff">${Number(opts.score)}</text></g>` : ''}
  <text x="18" y="34" font-family="Archivo, sans-serif" font-weight="800" font-size="13" letter-spacing="3" fill="${acc}">${rid}</text>
  ${lines.map((l, k) => `<text x="18" y="${(y0 + k * fs * .92).toFixed(0)}" font-family="Anton, Impact, sans-serif" font-size="${fs}" fill="#fff" letter-spacing=".5">${l}</text>`).join('')}
</svg>`;
}

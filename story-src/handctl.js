/* ───────────── Hand control ─────────────
   Move the page with your hand through the laptop camera (MediaPipe Hand Landmarker, running in this browser).
   Index fingertip = cursor · pinch thumb and index = click · closed fist = back · point at the top or bottom edge
   to scroll. The video never leaves the device: frames go to the model in the page and nowhere else.
   Each page passes hooks: t (translate), onMove(x, y, el), onBack(), and optionally onFrame(hand). */
const HandCtl = (() => {
  const VER = '0.10.14';
  const LIB = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/vision_bundle.mjs`;
  const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`;
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
  const BONES = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
  let o = {}, on = false, starting = false, stream = null, model = null, raf = 0, lastT = -1;
  let ui = null, cur = {x:.5, y:.5}, seen = false, pinching = false, lastClick = 0, fistSince = 0, lastBack = 0, hoverEl = null, lostAt = 0;
  const T = s => (o.t ? o.t(s) : s);
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function css(){
    if (document.getElementById('hand-css')) return;
    const st = document.createElement('style'); st.id = 'hand-css';
    st.textContent = `
.hand-cursor{position:fixed;z-index:2147483000;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:3px solid #E0182F;box-shadow:0 0 0 3px rgba(255,255,255,.75),0 0 24px rgba(224,24,47,.7);pointer-events:none;transition:width .12s,height .12s,margin .12s,background .12s,opacity .3s;opacity:0}
.hand-cursor.on{opacity:1}
.hand-cursor.pinch{width:22px;height:22px;margin:-11px 0 0 -11px;background:#E0182F}
.hand-cursor.lost{opacity:.25}
.hand-cam{position:fixed;z-index:2147482999;right:16px;bottom:16px;width:220px;border-radius:14px;overflow:hidden;background:#0b0808;color:#F4EDE4;border:1px solid rgba(255,240,230,.18);box-shadow:0 20px 50px rgba(0,0,0,.55);font:500 12.5px/1.35 Archivo,system-ui,sans-serif}
.hand-cam .v{position:relative;aspect-ratio:4/3;background:#000}
.hand-cam video,.hand-cam canvas{position:absolute;inset:0;width:100%;height:100%;transform:scaleX(-1);object-fit:cover}
.hand-cam video{opacity:.55}
.hand-cam .s{padding:8px 10px}
.hand-cam .s b{display:block;font-size:13px;margin-bottom:2px}
.hand-cam .row{display:flex;gap:6px;padding:0 10px 10px}
.hand-cam button{all:unset;cursor:pointer;flex:1;text-align:center;padding:6px 8px;border-radius:7px;background:rgba(255,255,255,.12);font-weight:700}
.hand-cam button:hover{background:rgba(255,255,255,.2)}
.hand-cam button:focus-visible{outline:2px solid #E0182F}
.hand-cam .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#3DD07A;margin-right:6px;box-shadow:0 0 8px #3DD07A}
.hand-cam.err .dot{background:#FF9A2E;box-shadow:none}
.hand-hover{outline:3px solid rgba(224,24,47,.9)!important;outline-offset:3px!important}
@media (max-width:600px){.hand-cam{width:160px}}`;
    document.head.append(st);
  }
  function build(){
    css();
    const cursor = document.createElement('div'); cursor.className = 'hand-cursor'; cursor.setAttribute('aria-hidden', 'true');
    const box = document.createElement('section'); box.className = 'hand-cam'; box.setAttribute('aria-label', T('Hand control'));
    box.innerHTML = '<div class="v"><video playsinline muted></video><canvas width="320" height="240"></canvas></div><div class="s" role="status" aria-live="polite"><b></b><span></span></div><div class="row"><button type="button" data-a="help"></button><button type="button" data-a="stop"></button></div>';
    box.querySelector('[data-a="stop"]').textContent = T('Turn off');
    box.querySelector('[data-a="help"]').textContent = T('How to');
    box.querySelector('[data-a="stop"]').addEventListener('click', stop);
    box.querySelector('[data-a="help"]').addEventListener('click', () => status(T('Hand control'), T('Point with your index finger. Pinch thumb and index to click. Close your fist to go back. Point at the top or bottom edge to scroll.')));
    document.body.append(cursor, box);
    ui = {cursor, box, video:box.querySelector('video'), canvas:box.querySelector('canvas'), b:box.querySelector('.s b'), span:box.querySelector('.s span')};
  }
  function status(title, text, err){ if (!ui) return; ui.b.textContent = title; ui.span.textContent = text; ui.box.classList.toggle('err', !!err); if (!err && !ui.b.querySelector('.dot')) { const i = document.createElement('i'); i.className = 'dot'; ui.b.prepend(i); } }

  async function start(opts){
    if (on || starting) return;
    o = opts || o; starting = true;
    if (!ui) build(); ui.box.hidden = false;
    status(T('Starting the camera…'), T('Allow the camera when the browser asks. The video stays on this device.'));
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('nocam'), {name:'NoCam'});
      stream = await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640}, height:{ideal:480}, facingMode:'user'}, audio:false});
      ui.video.srcObject = stream; await ui.video.play();
      status(T('Loading hand tracking…'), T('The first time takes a few seconds.'));
      if (!model) {
        const lib = await import(LIB);
        const files = await lib.FilesetResolver.forVisionTasks(WASM);
        const make = delegate => lib.HandLandmarker.createFromOptions(files, {baseOptions:{modelAssetPath:MODEL, delegate}, runningMode:'VIDEO', numHands:1, minHandDetectionConfidence:.6, minTrackingConfidence:.5});
        try { model = await make('GPU'); } catch (e) { model = await make('CPU'); }
      }
      on = true; starting = false; lastT = -1; seen = false;
      ui.cursor.classList.add('on');
      status(T('Hand control is on'), T('Show your hand to the camera. Pinch to click, fist to go back.'));
      if (o.onState) o.onState(true);
      loop();
    } catch (e) {
      starting = false; release();
      const n = e && e.name;
      const msg = n === 'NotAllowedError' || n === 'SecurityError' ? T('Camera permission was refused. Allow the camera for this site in the address bar, then try again.')
        : n === 'NotFoundError' || n === 'OverconstrainedError' ? T('No camera was found on this device.')
        : n === 'NotReadableError' ? T('The camera is used by another app. Close it and try again.')
        : n === 'NoCam' ? T('This browser cannot use the camera here.')
        : T('Hand tracking could not load. It needs an internet connection the first time.');
      status(T('Hand control is off'), msg, true);
      if (o.onState) o.onState(false);
    }
  }
  function release(){ if (stream) { stream.getTracks().forEach(tr => tr.stop()); stream = null; } if (ui) ui.video.srcObject = null; }
  function stop(){
    on = false; starting = false; cancelAnimationFrame(raf); release(); setHover(null);
    if (ui) { ui.cursor.classList.remove('on'); ui.box.hidden = true; }
    if (o.onState) o.onState(false);
  }
  const toggle = opts => (on || starting ? stop() : start(opts));

  function loop(){
    if (!on) return;
    raf = requestAnimationFrame(loop);
    const v = ui.video; if (v.readyState < 2 || v.currentTime === lastT) return;
    lastT = v.currentTime;
    let res; try { res = model.detectForVideo(v, performance.now()); } catch (e) { return; }
    const hand = res && res.landmarks && res.landmarks[0];
    draw(hand);
    if (!hand || hand.length < 21) { if (seen && !lostAt) lostAt = performance.now(); if (lostAt && performance.now() - lostAt > 400) { ui.cursor.classList.add('lost'); setHover(null); } return; }
    lostAt = 0; seen = true; ui.cursor.classList.remove('lost');
    handle(hand);
  }
  function draw(hand){
    const c = ui.canvas, g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
    if (!hand) return;
    g.strokeStyle = '#E0182F'; g.lineWidth = 3; g.beginPath();
    BONES.forEach(([a, b]) => { g.moveTo(hand[a].x * c.width, hand[a].y * c.height); g.lineTo(hand[b].x * c.width, hand[b].y * c.height); }); g.stroke();
    g.fillStyle = '#F4EDE4'; hand.forEach(p => { g.beginPath(); g.arc(p.x * c.width, p.y * c.height, 3, 0, 7); g.fill(); });
  }
  function setHover(el){
    if (el === hoverEl) return;
    if (hoverEl) hoverEl.classList.remove('hand-hover');
    hoverEl = el; if (el) el.classList.add('hand-hover');
  }
  const CLICKABLE = 'button, a[href], [role="button"], [role="option"], [role="tab"], summary, label, select, .strip, .pstrip';
  function handle(h){
    const s = d(h[0], h[9]) || .1;
    /* the centre 70 % of the camera covers the whole screen, mirrored like a mirror */
    const nx = Math.min(1, Math.max(0, ((1 - h[8].x) - .15) / .7)), ny = Math.min(1, Math.max(0, (h[8].y - .12) / .66));
    const k = .35; cur.x += (nx - cur.x) * k; cur.y += (ny - cur.y) * k;
    const px = cur.x * innerWidth, py = cur.y * innerHeight;
    ui.cursor.style.transform = `translate(${px.toFixed(0)}px,${py.toFixed(0)}px)`;
    const under = document.elementFromPoint(px, py);
    const target = under && !ui.box.contains(under) ? under.closest(CLICKABLE) : null;
    setHover(target);
    if (o.onMove) o.onMove(px, py, under, h);
    /* pinch = click, with hysteresis and a short cooldown */
    const pr = d(h[4], h[8]) / s, now = performance.now();
    if (!pinching && pr < .33) { pinching = true; ui.cursor.classList.add('pinch'); if (target && now - lastClick > 650) { lastClick = now; target.click(); if (target.matches('select, input')) target.focus(); } }
    else if (pinching && pr > .5) { pinching = false; ui.cursor.classList.remove('pinch'); }
    /* fist held for 0.6 s = back */
    const tips = [8, 12, 16, 20].reduce((a, i) => a + d(h[i], h[0]), 0) / 4 / s;
    if (tips < 1.15 && !pinching) { if (!fistSince) fistSince = now; else if (now - fistSince > 600 && now - lastBack > 1300) { lastBack = now; fistSince = 0; if (o.onBack) o.onBack(); } }
    else fistSince = 0;
    /* point at the top or bottom edge to scroll */
    if (!pinching && tips >= 1.15 && (!o.canScroll || o.canScroll())) { if (cur.y < .07) scrollBy(0, -22); else if (cur.y > .93) scrollBy(0, 22); }
  }
  /* a modal <dialog> sits in the top layer: move the cursor and camera box into it while it is open */
  function mount(parent){ if (!ui) return; (parent || document.body).append(ui.cursor, ui.box); }
  return {start, stop, toggle, mount, isOn:() => on || starting};
})();

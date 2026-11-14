// Explainer kit: the channel's look as code. No image assets: every shape is drawn, then lit.
// Not a fixed asset library: each video draws whatever it needs with plain canvas calls and wraps the shapes in K.lit()
// so they pick up the same light, bevel, rim light and shadows. Reusable pieces (bg, earth, person, helmet, bubble, sphere)
// are just shortcuts. Everything is a pure function of time t (seconds) so HyperFrames can seek to any frame.
const K = (() => {
  const W = 1080, H = 1920;
  const P = { bg0: '#07031a', bg1: '#230a5e', bg2: '#4c1796', lime: '#c6ff3a', pink: '#ff4fa3', teal: '#2fe6d2', lav: '#b79bff',
              white: '#fff8ff', ink: '#14072e', skin: '#ffc4d8', hair: '#4a2390', pants: '#6a3fd6' };
  const CL = x => x < 0 ? 0 : x > 1 ? 1 : x, LERP = (a, b, t) => a + (b - a) * t;
  const EIO = x => { x = CL(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const E3 = x => 1 - Math.pow(1 - CL(x), 3);
  const EBK = x => { x = CL(x); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const seg = (t, a, b) => CL((t - a) / (b - a));            // 0..1 progress of t between a and b
  function R0(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w || W; c.height = h || H; return c; }
  function glow(g, c, b) { g.shadowColor = c; g.shadowBlur = b; }

  // ---- light: flat shape -> bevel highlight (key light top-left), core shadow (bottom-right), rim light, soft drop shadow
  function edge(L, dx, dy, col) { const c = mk(L.width, L.height), x = c.getContext('2d'); x.drawImage(L, 0, 0);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, L.width, L.height);
    x.globalCompositeOperation = 'destination-out'; x.drawImage(L, dx, dy); return c; }
  // o: k (bevel size, ~object scale), box [x,y,w,h] (draw area, keeps it fast), hi/dk/rim colours, glow+gb, shadow:false
  function lit(g, draw, o) { o = o || {}; const k = o.k || 1, b = o.box || [0, 0, W, H];
    const bx = Math.floor(b[0]), by = Math.floor(b[1]), L = mk(Math.ceil(b[2]), Math.ceil(b[3])), x = L.getContext('2d');
    x.save(); x.translate(-bx, -by); draw(x); x.restore();
    const eD = edge(L, -18 * k, -22 * k, o.dk || 'rgba(45,0,95,.62)'), eH = edge(L, 9 * k, 11 * k, o.hi || 'rgba(255,255,255,.62)'),
          eR = o.rim && edge(L, -5 * k, -6 * k, o.rim);
    x.globalCompositeOperation = 'source-atop';
    x.filter = `blur(${15 * k}px)`; x.drawImage(eD, 0, 0); x.filter = `blur(${6 * k}px)`; x.drawImage(eH, 0, 0);
    if (eR) { x.filter = `blur(${2.5 * k}px)`; x.drawImage(eR, 0, 0); }
    g.save(); g.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.gb || 50; }
    else if (o.shadow !== false) { g.shadowColor = 'rgba(4,0,22,.5)'; g.shadowBlur = 34 * k; g.shadowOffsetX = 12 * k; g.shadowOffsetY = 22 * k; }
    g.drawImage(L, bx, by); g.restore(); }

  function sphere(g, x, y, r, c0, c1, a) { g.save(); g.globalAlpha *= a == null ? 1 : a; glow(g, c0, r * 1.2);
    const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .05, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(.35, c0); gr.addColorStop(1, c1);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); }
  function bubble(g, x, y, r, col, a) { col = col || P.lime; g.save(); g.globalAlpha *= a == null ? 1 : a; glow(g, col, r * .9);
    const b = g.createRadialGradient(x, y, r * .2, x, y, r); b.addColorStop(0, 'rgba(198,255,58,.08)'); b.addColorStop(.75, 'rgba(198,255,58,.3)'); b.addColorStop(1, 'rgba(225,255,140,.95)');
    g.fillStyle = b; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(x - r * .38, y - r * .42, r * .24, r * .13, -.7, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x + r * .4, y + r * .45, r * .1, 0, 7); g.fill(); g.restore(); }

  // ---- background: violet night with colour haze, key-light bloom, twinkling stars, drifting out-of-focus dust
  const BG = {};
  function bg(g, t, seed) { seed = seed || 7; let c = BG[seed];
    if (!c) { c = BG[seed] = { base: mk(), R: R0(seed), stars: [], dust: [] }; const p = c.base.getContext('2d');
      const gr = p.createRadialGradient(540, 1000, 50, 540, 1000, 1300); gr.addColorStop(0, P.bg2); gr.addColorStop(.5, P.bg1); gr.addColorStop(1, P.bg0); p.fillStyle = gr; p.fillRect(0, 0, W, H);
      p.save(); p.filter = 'blur(120px)'; [[160, 1500, 320, 'rgba(255,60,160,.42)'], [950, 650, 300, 'rgba(40,230,215,.28)'], [880, 1500, 260, 'rgba(150,110,255,.34)']].forEach(([x, y, r, col]) => { p.fillStyle = col; p.beginPath(); p.arc(x, y, r, 0, 7); p.fill(); }); p.restore();
      p.save(); p.globalCompositeOperation = 'lighter'; const s = p.createRadialGradient(-40, 120, 10, -40, 120, 900); s.addColorStop(0, 'rgba(255,220,240,.5)'); s.addColorStop(.25, 'rgba(255,120,200,.16)'); s.addColorStop(1, 'rgba(0,0,0,0)'); p.fillStyle = s; p.fillRect(0, 0, W, H); p.restore();
      for (let i = 0; i < 90; i++) c.stars.push([c.R() * W, i < 3 ? 250 + c.R() * 850 : c.R() * H, 1 + c.R() * 3, .25 + c.R() * .55, c.R() < .5 ? '#fff' : (c.R() < .5 ? P.lav : P.teal), c.R() * 6.28, i < 3]);
      for (let i = 0; i < 7; i++) c.dust.push([c.R() * W, c.R() * H, 60 + c.R() * 90, .10 + c.R() * .1, c.R() < .5 ? '255,79,163' : '183,155,255', c.R() * 6.28]); }
    g.drawImage(c.base, 0, 0);
    c.stars.forEach(([x, y, r, a, col, ph, big]) => { const yy = big ? y - t * 5 : ((y - t * 5) % H + H) % H; g.globalAlpha = a * (.55 + .45 * Math.sin(t * 2 + ph)); g.fillStyle = col; g.beginPath(); g.arc(x, yy, r, 0, 7); g.fill();
      if (big) { const l = 14 + 8 * Math.sin(t * 1.6 + ph); g.save(); g.globalAlpha = .85; glow(g, '#fff', 18); g.strokeStyle = '#fff'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - l, yy); g.lineTo(x + l, yy); g.moveTo(x, yy - l); g.lineTo(x, yy + l); g.stroke(); g.restore(); } });
    c.dust.forEach(([x, y, r, a, col, ph]) => { const xx = x + Math.sin(t * .3 + ph) * 40, yy = ((y - t * 14) % (H + 300) + H + 300) % (H + 300) - 150;
      const d = g.createRadialGradient(xx, yy, 0, xx, yy, r); d.addColorStop(0, `rgba(${col},${a})`); d.addColorStop(1, `rgba(${col},0)`); g.globalAlpha = 1; g.fillStyle = d; g.beginPath(); g.arc(xx, yy, r, 0, 7); g.fill(); });
    g.globalAlpha = 1; }

  // ---- finishing pass on the whole frame: saturation, vignette, film grain. Call last (before nothing else on the canvas).
  let NOISE;
  function post(g, t) { const tmp = mk(); tmp.getContext('2d').drawImage(g.canvas, 0, 0); g.save(); g.filter = 'saturate(1.4) contrast(1.06)'; g.drawImage(tmp, 0, 0); g.restore();
    const v = g.createRadialGradient(540, 960, 600, 540, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(3,0,16,.6)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    if (!NOISE) { NOISE = mk(W + 256, H + 256); const x = NOISE.getContext('2d'), d = x.createImageData(NOISE.width, NOISE.height), R = R0(99); for (let i = 0; i < d.data.length; i += 4) { const n = R() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = n; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); }
    const f = Math.floor((t || 0) * 12), sd = (f * 7919) % 997; g.save(); g.globalAlpha = .09; g.globalCompositeOperation = 'overlay'; g.drawImage(NOISE, -(sd % 256), -((sd * 31) % 256)); g.restore(); }

  // ---- Earth horizon at the bottom of the frame (top = y of the highest point)
  const EARTH = {};
  function earth(g, top, t) { let c = EARTH[top];
    if (!c) { c = EARTH[top] = mk(W, H); const p = c.getContext('2d'), cy = top + 1050;
      const at = p.createRadialGradient(540, cy, 1040, 540, cy, 1230); at.addColorStop(0, 'rgba(47,230,210,.75)'); at.addColorStop(.35, 'rgba(47,230,210,.22)'); at.addColorStop(1, 'rgba(47,230,210,0)'); p.fillStyle = at; p.beginPath(); p.arc(540, cy, 1230, 0, 7); p.fill();
      const oc = p.createRadialGradient(260, top + 60, 40, 540, cy, 1100); oc.addColorStop(0, '#3cc6e0'); oc.addColorStop(.25, '#1787ad'); oc.addColorStop(1, '#0a2a5a'); p.fillStyle = oc; p.beginPath(); p.arc(540, cy, 1050, 0, 7); p.fill();
      lit(p, q => { q.beginPath(); q.arc(540, cy, 1050, 0, 7); q.clip(); q.fillStyle = '#35cf93'; [[250, top + 80, 170, 58], [700, top + 52, 220, 66], [980, top + 140, 160, 60], [90, top + 200, 120, 50]].forEach(([x, y, a, b]) => { q.beginPath(); q.ellipse(x, y, a, b, -.1, 0, 7); q.fill(); }); },
        { k: .7, shadow: false, dk: 'rgba(0,60,70,.7)', hi: 'rgba(220,255,200,.7)' });
      p.save(); p.beginPath(); p.arc(540, cy, 1050, 0, 7); p.clip(); p.filter = 'blur(5px)'; p.fillStyle = 'rgba(255,255,255,.6)'; [[430, top + 44, 150, 15], [860, top + 120, 130, 13], [180, top + 140, 90, 10]].forEach(([x, y, a, b]) => { p.beginPath(); p.ellipse(x, y, a, b, 0, 0, 7); p.fill(); }); p.filter = 'none';
      const tm = p.createLinearGradient(620, 0, W, 0); tm.addColorStop(0, 'rgba(5,0,30,0)'); tm.addColorStop(1, 'rgba(5,0,30,.45)'); p.fillStyle = tm; p.fillRect(0, top - 20, W, 400); p.restore();
      p.save(); glow(p, '#bffff6', 26); p.strokeStyle = 'rgba(200,255,248,.9)'; p.lineWidth = 5; p.beginPath(); p.arc(540, cy, 1051, -Math.PI * .78, -Math.PI * .5); p.stroke(); p.restore(); }
    g.drawImage(c, 0, Math.sin((t || 0) * .5) * 4); }

  // ---- the channel's person. o: x,y,rot,sc, sw (0..1 swollen), blink (0 open..1 closed), mouth (0..1 open), wob (limb sway, radians-ish), alpha
  function person(g, o) { const x = o.x, y = o.y, rot = o.rot || 0, sc = o.sc || 1, sw = o.sw || 0, wb = o.wob || 0, bl = o.blink || 0, mo = o.mouth == null ? 1 : o.mouth;
    const r = 520 * sc * (1 + sw * .2), box = [x - r, y - r, 2 * r, 2 * r];
    const T = c => { c.translate(x, y); c.rotate(rot); c.scale(sc, sc); c.lineCap = 'round'; };
    const part = (fn, q) => lit(g, c => { c.save(); T(c); fn(c); c.restore(); }, Object.assign({ k: sc, box, alpha: o.alpha }, q));
    part(c => { c.strokeStyle = P.pants; c.lineWidth = 74 + sw * 46; c.beginPath(); c.moveTo(-40, 150); c.quadraticCurveTo(-90 - wb * 30, 260, -60 - wb * 50, 360); c.moveTo(40, 150); c.quadraticCurveTo(110 + wb * 20, 230, 140 + wb * 40, 330); c.stroke(); }, { rim: 'rgba(47,230,210,.9)' });
    part(c => { c.fillStyle = '#fff8ff'; [[-60 - wb * 50, 372], [146 + wb * 40, 344]].forEach(([a, b]) => { c.beginPath(); c.ellipse(a, b, 46 + sw * 14, 26 + sw * 10, .3, 0, 7); c.fill(); }); }, { k: sc * .6, dk: 'rgba(90,60,170,.7)' });
    part(c => { c.strokeStyle = P.skin; c.lineWidth = 52 + sw * 40; c.beginPath(); c.moveTo(-70, -40); c.quadraticCurveTo(-190, -10 + wb * 30, -200 - wb * 20, -130 + wb * 60); c.moveTo(70, -40); c.quadraticCurveTo(190, 20 - wb * 30, 215 + wb * 20, -70 - wb * 60); c.stroke(); }, { dk: 'rgba(190,40,120,.6)', rim: 'rgba(47,230,210,.8)' });
    part(c => { const tg = c.createLinearGradient(-100, -80, 100, 170); tg.addColorStop(0, '#5ff5e4'); tg.addColorStop(1, '#16b8a8'); c.fillStyle = tg; c.beginPath(); c.roundRect(-95 - sw * 34, -80, 190 + sw * 68, 250 + sw * 20, 70 + sw * 30); c.fill(); }, { dk: 'rgba(0,70,110,.65)' });
    part(c => { const hg = c.createRadialGradient(-30, -210, 10, 0, -175, 110); hg.addColorStop(0, '#ffe3ee'); hg.addColorStop(1, '#ffb3cf'); c.fillStyle = hg; c.beginPath(); c.arc(0, -175, 92 + sw * 16, 0, 7); c.fill(); }, { dk: 'rgba(190,40,120,.6)', rim: 'rgba(47,230,210,.8)' });
    part(c => { c.fillStyle = P.hair; c.beginPath(); c.arc(0, -190, 94 + sw * 16, Math.PI * 1.02, Math.PI * 1.98); c.quadraticCurveTo(10, -250, -92 - sw * 16, -200); c.fill(); }, { shadow: false, hi: 'rgba(190,150,255,.8)', dk: 'rgba(10,0,40,.7)' });
    g.save(); g.globalAlpha *= o.alpha == null ? 1 : o.alpha; T(g);
    [[-32, -170], [32, -170]].forEach(([a, b]) => { if (bl > .6) { g.strokeStyle = P.ink; g.lineWidth = 6; g.beginPath(); g.arc(a, b - 4, 12, .15, Math.PI - .15); g.stroke(); }
      else { g.fillStyle = P.ink; g.beginPath(); g.ellipse(a, b, 11, 11 * (1 - bl * .8), 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(a - 3, b - 4, 3.5, 0, 7); g.fill(); } });
    g.filter = 'blur(5px)'; g.fillStyle = 'rgba(255,90,160,.75)'; g.beginPath(); g.arc(-55, -140, 15 + sw * 8, 0, 7); g.arc(55, -140, 15 + sw * 8, 0, 7); g.fill(); g.filter = 'none';
    const mg = g.createRadialGradient(0, -112, 2, 0, -118, 26); mg.addColorStop(0, '#b0306f'); mg.addColorStop(1, '#4d0c38'); g.fillStyle = mg; g.beginPath(); g.ellipse(0, -118, 14 + 6 * mo, 6 + 18 * mo, 0, 0, 7); g.fill(); g.restore(); }

  function helmet(g, x, y, rot, s, alpha) { const T = c => { c.translate(x, y); c.rotate(rot); c.scale(s, s); }, box = [x - 200 * s, y - 200 * s, 400 * s, 400 * s];
    lit(g, c => { c.save(); T(c); c.fillStyle = '#cfc4f5'; c.beginPath(); c.roundRect(-70, 104, 140, 34, 14); c.fill(); c.restore(); }, { k: .6 * s, box, alpha });
    lit(g, c => { c.save(); T(c); const h = c.createRadialGradient(-40, -50, 10, 0, 0, 125); h.addColorStop(0, '#ffffff'); h.addColorStop(1, '#d9cffa'); c.fillStyle = h; c.beginPath(); c.arc(0, 0, 120, 0, 7); c.fill(); c.restore(); }, { k: s, box, alpha, dk: 'rgba(70,40,160,.7)', rim: 'rgba(47,230,210,.9)' });
    g.save(); g.globalAlpha *= alpha == null ? 1 : alpha; T(g); const v = g.createLinearGradient(-84, -62, 84, 54); v.addColorStop(0, '#3b1d86'); v.addColorStop(.5, '#170a40'); v.addColorStop(1, '#0a0424'); g.fillStyle = v; g.beginPath(); g.roundRect(-84, -62, 168, 116, 54); g.fill();
    g.beginPath(); g.roundRect(-84, -62, 168, 116, 54); g.clip(); g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(-90, -70); g.lineTo(-10, -70); g.lineTo(-70, 60); g.lineTo(-90, 60); g.fill(); g.fillStyle = 'rgba(47,230,210,.5)'; g.beginPath(); g.ellipse(40, 34, 50, 14, -.2, 0, 7); g.fill(); g.restore(); }

  // slow camera move: everything drawn inside fn is zoomed by z around (cx, cy)
  function cam(g, z, cx, cy, fn) { g.save(); g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy); fn(); g.restore(); }

  return { W, H, P, CL, LERP, EIO, E3, EBK, seg, R0, mk, glow, lit, sphere, bubble, bg, post, earth, person, helmet, cam };
})();

// space01: What happens to your body in space without a suit?
// Facts and sources:
//  - unconscious in about 10-15 s; the body swells but the skin holds, no explosion: ESA (S. de Mey) via Space.com
//    https://www.space.com/how-long-could-you-survive-in-space-without-spacesuit
//  - do not hold your breath (expanding air can damage the lungs); no instant freezing; survivable up to ~90 s with fast
//    recompression (1950s-60s research); 1965 NASA chamber accident: unconscious in 14 s, saliva on the tongue began to boil:
//    https://aerospaceweb.org/question/atmosphere/q0291.shtml
// 12 shots, a cut every 2-3 s on the voice, camera distance changes shot to shot (wide -> close -> detail).
const CUTS = [0, 7, 10, 14, 20, 24, 32, 36, 39, 42, 47, 52];
const T0 = CUTS.map((i, k) => k ? S[i] - 0.1 : 0);
const { P, EX, mixEx, EIO, E3, EBK, CL, seg, LERP } = K;
const lungLobe = (c, cx, cy, s, d) => { c.moveTo(cx + d * 22 * s, cy - 170 * s); c.bezierCurveTo(cx + d * 150 * s, cy - 200 * s, cx + d * 200 * s, cy + 50 * s, cx + d * 176 * s, cy + 170 * s); c.bezierCurveTo(cx + d * 120 * s, cy + 226 * s, cx + d * 34 * s, cy + 196 * s, cx + d * 26 * s, cy + 120 * s); c.closePath(); };
function lungs(g, cx, cy, s, hot, t) {
  // x-ray window in the chest
  const wg = g.createRadialGradient(cx, cy, 40, cx, cy, 460); wg.addColorStop(0, '#2a0d5c'); wg.addColorStop(1, '#0d0328'); g.fillStyle = wg; g.beginPath(); g.roundRect(cx - 300, cy - 330, 600, 680, 120); g.fill();
  g.save(); g.beginPath(); g.roundRect(cx - 300, cy - 330, 600, 680, 120); g.clip();
  g.strokeStyle = 'rgba(183,155,255,.25)'; g.lineWidth = 18; g.lineCap = 'round'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(cx, cy - 180 + i * 95, 250, 60, 0, .15, Math.PI - .15); g.stroke(); }
  K.lit(g, c => { c.strokeStyle = '#ffb3cf'; c.lineWidth = 34; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy - 330); c.lineTo(cx, cy - 150 * s); c.stroke(); }, { k: .8, shadow: false, box: [cx - 60, cy - 340, 120, 300] });
  const col = `rgb(255,${Math.round(111 - 60 * hot)},${Math.round(174 - 70 * hot)})`;
  K.lit(g, c => { c.fillStyle = col; c.beginPath(); lungLobe(c, cx, cy, s, -1); lungLobe(c, cx, cy, s, 1); c.fill(); }, { k: 1.6, glow: hot > .3 ? 'rgba(255,60,120,.9)' : 'rgba(255,79,163,.5)', gb: 40 + 60 * hot, dk: 'rgba(140,0,80,.7)', box: [cx - 330, cy - 340, 660, 700] });
  g.setLineDash([16, 14]); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 5; g.beginPath(); lungLobe(g, cx, cy, 1, -1); lungLobe(g, cx, cy, 1, 1); g.stroke(); g.setLineDash([]);
  const R = K.R0(31); for (let i = 0; i < 26; i++) { const a = R() * 6.28, r0 = R() * 90 * s, sp = 20 + R() * 30, d = i % 2 ? -1 : 1, x = cx + d * 100 * s + Math.cos(a) * (r0 + ((t * sp) % 40)), y = cy + Math.sin(a) * (r0 * 1.4 + ((t * sp) % 40)); K.sphere(g, x, y, 7 + R() * 5, P.teal, '#0c8f9c', .85); }
  g.restore();
}
function mouth(g, X, Y, t) {
  const el = c => { c.beginPath(); c.ellipse(X, Y, 400, 330, 0, 0, 7); };
  g.save(); K.glow(g, 'rgba(255,79,163,.5)', 90); const sg = g.createRadialGradient(X - 300, Y - 560, 40, X, Y - 120, 820); sg.addColorStop(0, '#ffeaf2'); sg.addColorStop(.6, '#ffb9d3'); sg.addColorStop(1, '#e879ad'); g.fillStyle = sg; g.beginPath(); g.arc(X, Y - 110, 570, 0, 7); g.fill(); g.restore();
  g.save(); g.filter = 'blur(30px)'; g.fillStyle = 'rgba(255,90,160,.6)'; g.beginPath(); g.arc(X - 480, Y - 60, 130, 0, 7); g.arc(X + 480, Y - 60, 130, 0, 7); g.fill(); g.restore();
  const cv = g.createRadialGradient(X, Y + 40, 30, X, Y, 400); cv.addColorStop(0, '#7a1c5c'); cv.addColorStop(1, '#25051f'); g.fillStyle = cv; el(g); g.fill();
  const bx = [X - 440, Y - 380, 880, 760];
  K.lit(g, c => { el(c); c.clip(); c.fillStyle = '#fff8ff'; for (let i = 0; i < 6; i++) { c.beginPath(); c.roundRect(X - 288 + i * 97, Y - 380, 90, 150 - Math.abs(i - 2.5) * 16, 26); c.fill(); } }, { k: .8, shadow: false, dk: 'rgba(150,110,210,.5)', box: bx });
  K.lit(g, c => { el(c); c.clip(); const q = c.createRadialGradient(X - 90, Y + 130, 20, X, Y + 250, 340); q.addColorStop(0, '#ff9cc8'); q.addColorStop(1, '#f0468f'); c.fillStyle = q; c.beginPath(); c.ellipse(X, Y + 250 + Math.sin(t * 3) * 6, 330, 210, 0, 0, 7); c.fill(); }, { k: 2.2, shadow: false, dk: 'rgba(120,0,70,.7)', hi: 'rgba(255,230,240,.7)', box: bx });
  g.save(); el(g); g.clip(); g.filter = 'blur(8px)'; g.strokeStyle = 'rgba(170,20,90,.6)'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(X, Y + 100); g.lineTo(X, Y + 330); g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(X - 150, Y + 130, 90, 22, -.25, 0, 7); g.fill(); g.restore();
  K.lit(g, c => { c.strokeStyle = '#ff5fa0'; c.lineWidth = 40; el(c); c.stroke(); }, { k: 1.6, dk: 'rgba(140,0,80,.7)', hi: 'rgba(255,220,235,.8)', box: bx });
  g.save(); el(g); g.clip(); const R = K.R0(5); for (let i = 0; i < 22; i++) { const x0 = X - 250 + R() * 500, sp = .35 + R() * .5, ph = R(), u = (t * sp + ph) % 1, r = (14 + R() * 34) * (0.4 + 0.6 * Math.sin(Math.min(1, u * 1.6) * Math.PI / 2)); K.bubble(g, x0 + Math.sin(t * 3 + i) * 10, Y + 190 - u * 400, r, P.lime, 1 - u * u); } g.restore();
}
function ring(g, x, y, r, w, p, col) { g.save(); g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = w; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.restore();
  if (p > .005) K.lit(g, c => { c.lineCap = 'round'; c.lineWidth = w; c.strokeStyle = col; c.beginPath(); c.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); c.stroke(); }, { k: .6, glow: col, gb: 50, box: [x - r - w * 2, y - r - w * 2, 2 * r + 4 * w, 2 * r + 4 * w] }); }
function bigNum(g, txt, unit, x, y, size, col) { g.save(); g.font = `800 ${size}px Bri`; g.textAlign = 'right'; const tg = g.createLinearGradient(0, y - size * .75, 0, y); tg.addColorStop(0, '#fff'); tg.addColorStop(1, col); g.fillStyle = tg; K.glow(g, col, 40); g.fillText(txt, x, y); g.shadowBlur = 0; g.font = `800 ${size * .47}px Bri`; g.textAlign = 'left'; g.fillStyle = P.white; g.fillText(unit, x + size * .12, y); g.restore(); }
function burst(g, x, y, s, a) { if (a <= 0) return; const k = EBK(a), bx = [x - 190 * s, y - 190 * s, 380 * s, 380 * s];
  K.lit(g, c => { c.translate(x, y); c.scale(s * k, s * k); c.fillStyle = P.pink; c.beginPath(); for (let i = 0; i < 16; i++) { const q = i / 16 * 6.283, r = i % 2 ? 52 : 104; c.lineTo(Math.cos(q) * r, Math.sin(q) * r); } c.closePath(); c.fill(); }, { k: .7 * s, glow: P.pink, gb: 36, box: bx, alpha: CL(a * 3) });
  const sl = CL((a - .45) / .4); if (sl > 0) K.lit(g, c => { c.translate(x, y); c.scale(s, s); c.strokeStyle = '#fff8ff'; c.lineWidth = 18; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, 128, -Math.PI * .75, -Math.PI * .75 + 6.283 * sl); c.stroke(); c.beginPath(); c.moveTo(-90, 90); c.lineTo(-90 + 180 * sl, 90 - 180 * sl); c.stroke(); }, { k: .5 * s, dk: 'rgba(90,60,170,.8)', box: bx }); }

const SHOTS = [
  // 0 WIDE: the helmet drifts away (hook)
  (g, lt, u, t) => { K.bg(g, t, 7); K.cam(g, 1 + .06 * u, 540, 900, () => { K.earth(g, 1680, t); const d = EIO(seg(lt, 0, 2.6));
      g.save(); g.setLineDash([6, 26]); g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 7; g.beginPath(); g.moveTo(575, 660); g.quadraticCurveTo(650, 630, 700 + 60 * d, 650 - 40 * d); g.stroke(); g.restore();
      K.helmet(g, 760 + 90 * d, 660 - 60 * d, .3 + .5 * d + lt * .05, .95);
      K.person(g, { x: 470 + Math.sin(t * .6) * 10, y: 880 + Math.sin(t * .9) * 14, rot: -.2 + Math.sin(t * .5) * .05, sc: .95, wob: Math.sin(t * 1.4) * .5, ex: mixEx(EX.neutral, EX.shock, seg(lt, .2, .7)), t }); }); },
  // 1 CLOSE, slightly tilted: the face realises it
  (g, lt, u, t) => { K.bg(g, t, 11); K.cam(g, 1.02 + .08 * u, 540, 760, () => { K.helmet(g, 900 + 50 * u, 560 - 60 * u, 1 + u, .3, .8);
      K.bust(g, { x: 540 + Math.sin(t * 22) * 3 * (1 - u), y: 700 + Math.sin(t * .9) * 8, r: 215, rot: .07, ex: mixEx(EX.shock, EX.scared, seg(u, .25, .7)), t, arms: seg(u, .1, .5) }); }); },
  // 2 CLOSE from the other side: holding the breath, then letting it out
  (g, lt, u, t) => { K.bg(g, t, 13); const rel = seg(u, .62, .8); K.cam(g, 1.08 - .06 * u, 540, 760, () => {
      K.bust(g, { x: 500 + Math.sin(t * 34) * 5 * (1 - rel), y: 700, r: 215, rot: -.08, ex: mixEx(EX.hold, EX.gasp, rel), t });
      for (let i = 0; i < 9; i++) { const q = CL((u - .66 - i * .02) / .3); if (q > 0) K.sphere(g, 500 + 90 + q * (260 + i * 22), 830 - q * (120 + i * 30) + Math.sin(i * 2) * 30, 26 - q * 12, '#dffcff', '#7fd9ee', 1 - q); } }); },
  // 3 DETAIL, x-ray: the air in the lungs expands
  (g, lt, u, t) => { K.bg(g, t, 17); K.cam(g, 1 + .04 * u, 540, 750, () => {
      K.lit(g, c => { const tg = c.createLinearGradient(100, 300, 900, 1300); tg.addColorStop(0, '#5ff5e4'); tg.addColorStop(1, '#16b8a8'); c.fillStyle = tg; c.beginPath(); c.roundRect(170, 300, 740, 900, 200); c.fill(); }, { k: 2.4, dk: 'rgba(0,70,110,.65)', rim: 'rgba(47,230,210,.8)' });
      lungs(g, 540, 750, 1 + .28 * EIO(u), 0, t); }); },
  // 4 EXTREME DETAIL: ...and could tear them
  (g, lt, u, t) => { K.bg(g, t, 17); K.cam(g, 1.34 + .1 * u, 540, 760, () => {
      const hot = seg(u, 0, .6); lungs(g, 540 + Math.sin(t * 30) * 4 * hot, 760, 1.28 + .08 * hot + Math.sin(t * 14) * .012, hot, t);
      const cr = seg(u, .3, .75); if (cr > 0) { g.save(); K.glow(g, '#fff', 24); g.strokeStyle = '#fff8ff'; g.lineWidth = 9; g.lineJoin = 'round'; g.lineCap = 'round'; const pts = [[742, 660], [716, 702], [752, 738], [712, 782], [746, 820], [718, 860]]; g.beginPath(); pts.slice(0, 1 + Math.ceil(cr * 5)).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.restore(); } }); },
  // 5 DETAIL of the mouth: saliva boils
  (g, lt, u, t) => { K.bg(g, t, 19); K.cam(g, 1 + .1 * u, 540, 800, () => mouth(g, 540, 780, t)); },
  // 6 MEDIUM, head and the 15 s timer: oxygen runs out
  (g, lt, u, t) => { K.bg(g, t, 11); const p = EIO(seg(u, 0, .9)); K.cam(g, 1 + .05 * u, 540, 860, () => { ring(g, 540, 850, 400, 38, p, P.pink);
      K.head(g, { x: 540, y: 850 + Math.sin(t) * 6, r: 290, rot: Math.sin(t * .8) * .04 + .1 * p, ex: mixEx(EX.scared, EX.faint, p), t, glow: 'rgba(255,79,163,.5)', gb: 80 });
      for (let i = 0; i < 12; i++) { const q = ((lt * .45 + i / 12) % 1); K.sphere(g, 600 + q * 380 + Math.sin(i * 3) * 30, 1030 - q * q * 520 - Math.cos(i * 2) * 30, 24 - q * 14, P.teal, '#0c8f9c', (1 - q * .8) * (1 - p * .6)); } });
    bigNum(g, String(Math.round(15 * p)), 's', 560, 330, 150, P.pink); },
  // 7 EXTREME CLOSE on one eye: black out
  (g, lt, u, t) => { const X = 540, Y = 720, cl = EIO(seg(u, .05, .7)); K.bg(g, t, 11); g.save(); K.glow(g, 'rgba(255,79,163,.5)', 90); const sg = g.createRadialGradient(250, 250, 60, 540, 700, 760); sg.addColorStop(0, '#ffeaf2'); sg.addColorStop(.7, '#ffb9d3'); sg.addColorStop(1, '#e879ad'); g.fillStyle = sg; g.beginPath(); g.arc(540, 640, 640, 0, 7); g.fill(); g.restore();
    K.cam(g, 1 + .08 * u, X, Y, () => { const alm = c => { c.beginPath(); c.moveTo(X - 420, Y); c.quadraticCurveTo(X, Y - 330, X + 420, Y); c.quadraticCurveTo(X, Y + 300, X - 420, Y); };
      g.save(); K.glow(g, 'rgba(120,0,70,.5)', 60); g.fillStyle = '#fff8ff'; alm(g); g.fill(); g.restore();
      g.save(); alm(g); g.clip(); const ix = X + Math.sin(t * 1.2) * 12 * (1 - cl), iy = Y + 30 * cl; K.sphere(g, ix, iy, 150, '#9a6bff', '#4a2390'); g.fillStyle = P.ink; g.beginPath(); g.arc(ix, iy, 70 + 20 * cl, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ix - 50, iy - 55, 26, 0, 7); g.fill();
      // the upper lid comes down
      const ly = Y - 330 + cl * 520; g.fillStyle = '#ffb0cd'; g.beginPath(); g.moveTo(X - 480, Y - 400); g.lineTo(X + 480, Y - 400); g.lineTo(X + 480, Y - 60 + cl * 60); g.quadraticCurveTo(X, ly, X - 480, Y - 60 + cl * 60); g.closePath(); g.fill();
      g.restore();
      g.strokeStyle = P.hair; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(X - 420, Y); g.quadraticCurveTo(X, LERP(Y - 330, Y + 150, cl), X + 420, Y); g.stroke();
      for (let i = 0; i < 7; i++) { const q = .14 + i * .12, lx = X - 420 + 840 * q, lyy = Y + (LERP(-330, 150, cl)) * 2 * q * (1 - q); g.beginPath(); g.moveTo(lx, lyy); g.lineTo(lx + (q - .5) * 90, lyy - 70 + 110 * cl); g.stroke(); } });
    const bo = EIO(seg(u, .3, 1)), vg = g.createRadialGradient(540, 720, Math.max(1, 900 - 820 * bo), 540, 720, 1500 - 900 * bo); vg.addColorStop(0, 'rgba(7,3,26,0)'); vg.addColorStop(1, 'rgba(7,3,26,.97)'); g.fillStyle = vg; g.fillRect(0, 0, 1080, 1920); },
  // 8 WIDE: the body swells
  (g, lt, u, t) => { K.bg(g, t, 23); const sw = EIO(seg(u, .05, .8)); K.cam(g, 1.06 - .06 * u, 540, 850, () => { K.earth(g, 1700, t);
      K.person(g, { x: 540, y: 830 + Math.sin(t * .8) * 10, rot: -.1 + Math.sin(t * .5) * .04, sc: 1.02, sw, ex: EX.out, t });
      g.save(); g.translate(540, 830 + Math.sin(t * .8) * 10); g.rotate(-.1 + Math.sin(t * .5) * .04); g.scale(1.02, 1.02); g.setLineDash([14, 14]); g.strokeStyle = `rgba(255,255,255,${.9 * sw})`; g.lineWidth = 5; g.beginPath(); g.roundRect(-95, -80, 190, 250, 70); g.stroke(); g.beginPath(); g.arc(0, -175, 92, 0, 7); g.stroke(); g.restore();
      if (sw > .1) K.lit(g, c => { c.strokeStyle = P.lime; c.fillStyle = P.lime; c.lineWidth = 14; c.lineCap = 'round'; [-1, 1].forEach(d => { const x0 = 540 + d * 190, x1 = 540 + d * (200 + 110 * sw), y = 890; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); c.beginPath(); c.moveTo(x1 + d * 30, y); c.lineTo(x1 - d * 6, y - 28); c.lineTo(x1 - d * 6, y + 28); c.closePath(); c.fill(); }); }, { k: .5, glow: P.lime, gb: 30, dk: 'rgba(60,110,0,.7)', box: [150, 820, 780, 140] }); }); },
  // 9 MEDIUM, off-centre: ...but no explosion
  (g, lt, u, t) => { K.bg(g, t, 29); K.cam(g, 1.12 + .06 * u, 560, 800, () => {
      K.person(g, { x: 400 + Math.sin(t * .6) * 8, y: 900 + Math.sin(t * .8) * 10, rot: .08, sc: .92, sw: 1, ex: EX.out, t });
      burst(g, 800, 560, 1.25, seg(u, .08, .8)); }); },
  // 10 WIDE at the station: pulled back inside within 90 s
  (g, lt, u, t) => { K.bg(g, t, 31); const p = EIO(u); K.cam(g, 1 + .05 * u, 620, 850, () => {
      g.save(); K.glow(g, 'rgba(4,0,22,.6)', 60); const wg = g.createLinearGradient(640, 0, 1140, 0); wg.addColorStop(0, '#f3eeff'); wg.addColorStop(.12, '#d9cffa'); wg.addColorStop(1, '#8f7fd8'); g.fillStyle = wg; g.fillRect(640, -200, 700, 2400); g.restore();
      g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(640, -200, 10, 2400); g.strokeStyle = 'rgba(90,60,170,.35)'; g.lineWidth = 6; [200, 1440].forEach(y => { g.beginPath(); g.moveTo(650, y); g.lineTo(1140, y); g.stroke(); });
      [[700, 260], [700, 1380], [1010, 260], [1010, 1380]].forEach(([x, y]) => K.sphere(g, x, y, 16, '#cfc4f5', '#7d6bc4'));
      // porthole, handrail and status lights so the wall reads as a station
      g.save(); g.beginPath(); g.arc(860, 330, 78, 0, 7); g.clip(); const pg = g.createLinearGradient(780, 250, 940, 410); pg.addColorStop(0, '#3b1d86'); pg.addColorStop(1, '#0a0424'); g.fillStyle = pg; g.fillRect(770, 240, 180, 180); g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(780, 240); g.lineTo(840, 240); g.lineTo(800, 420); g.lineTo(770, 420); g.fill(); g.restore();
      K.lit(g, c => { c.strokeStyle = '#8f7fd8'; c.lineWidth = 22; c.beginPath(); c.arc(860, 330, 84, 0, 7); c.stroke(); }, { k: .7, box: [740, 210, 240, 240], dk: 'rgba(40,10,110,.8)' });
      K.lit(g, c => { c.strokeStyle = '#fff8ff'; c.lineWidth = 20; c.lineCap = 'round'; c.beginPath(); c.moveTo(700, 1200); c.lineTo(700, 1130); c.lineTo(1000, 1130); c.lineTo(1000, 1200); c.stroke(); }, { k: .5, box: [660, 1090, 380, 150], dk: 'rgba(90,60,170,.8)' });
      [0, 1, 2].forEach(i => K.sphere(g, 760 + i * 60, 1290, 13, i === Math.floor(t * 3) % 3 ? P.lime : '#6f5fc0', i === Math.floor(t * 3) % 3 ? '#5d9a00' : '#3a2b8a'));
      g.save(); K.glow(g, P.lime, 90); const hg = g.createRadialGradient(880, 830, 20, 880, 830, 260); hg.addColorStop(0, '#f4ffd0'); hg.addColorStop(.6, '#c6ff3a'); hg.addColorStop(1, '#5d9a00'); g.fillStyle = hg; g.beginPath(); g.arc(880, 830, 240, 0, 7); g.fill(); g.restore();
      K.lit(g, c => { c.strokeStyle = '#8f7fd8'; c.lineWidth = 44; c.beginPath(); c.arc(880, 830, 250, 0, 7); c.stroke(); }, { k: 1.2, box: [580, 530, 600, 600], dk: 'rgba(40,10,110,.8)' });
      const px = 300 + 240 * p, py = 900 - 40 * p;
      K.lit(g, c => { c.strokeStyle = '#fff8ff'; c.lineWidth = 58; c.lineCap = 'round'; c.beginPath(); c.moveTo(900, 860); c.quadraticCurveTo(820, 900, px + 215, py - 80); c.stroke(); }, { k: .9, dk: 'rgba(90,60,170,.7)', box: [300, 600, 780, 500] });
      K.person(g, { x: px, y: py + Math.sin(t) * 6, rot: -.25 + .2 * p, sc: .82, sw: 1 - .5 * p, ex: EX.out, t }); });
    ring(g, 250, 420, 130, 26, .1 + .82 * p, P.teal); bigNum(g, String(Math.round(90 * (.1 + .9 * p))), 's', 262, 462, 110, P.teal); },
  // 11 CLOSE, inside: alive (answer) + end card
  (g, lt, u, t) => { const ig = g.createRadialGradient(540, 760, 80, 540, 900, 1300); ig.addColorStop(0, '#6a2fd0'); ig.addColorStop(.55, '#2c0e7a'); ig.addColorStop(1, '#0d0330'); g.fillStyle = ig; g.fillRect(0, 0, 1080, 1920);
    K.cam(g, 1.1 - .07 * EIO(u), 540, 820, () => {
      g.strokeStyle = 'rgba(183,155,255,.16)'; g.lineWidth = 6; for (let i = 0; i < 6; i++) { g.beginPath(); g.roundRect(60 + i * 40, 120 + i * 40, 960 - i * 80, 1560 - i * 80, 80); g.stroke(); }
      g.save(); g.beginPath(); g.arc(850, 400, 130, 0, 7); g.clip(); g.fillStyle = '#07031a'; g.fillRect(700, 250, 300, 300); const R = K.R0(3); for (let i = 0; i < 16; i++) { g.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * 2 + i)); g.fillStyle = '#fff'; g.beginPath(); g.arc(720 + R() * 260, 270 + R() * 260, 2 + R() * 3, 0, 7); g.fill(); } g.restore();
      K.lit(g, c => { c.strokeStyle = '#cfc4f5'; c.lineWidth = 30; c.beginPath(); c.arc(850, 400, 140, 0, 7); c.stroke(); }, { k: .9, box: [670, 220, 360, 360], dk: 'rgba(70,40,160,.8)' });
      K.bust(g, { x: 500, y: 760 + Math.sin(t * 2.2) * 8, r: 225, rot: -.04, ex: mixEx(EX.faint, EX.relief, seg(u, .1, .5)), t, arms: 0 }); }); },
];
function SCENE(g, t) { let k = 0; for (let i = 0; i < T0.length; i++) if (t >= T0[i]) k = i;
  const lt = t - T0[k], d = (k + 1 < T0.length ? T0[k + 1] : DUR) - T0[k]; SHOTS[k](g, lt, CL(lt / d), t); K.post(g, t); }

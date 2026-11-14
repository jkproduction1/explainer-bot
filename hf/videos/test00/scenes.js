// test00: engine + kit smoke test (not a real video). The hook frame: a helmet drifts away from a floating person.
function SCENE(g, t) {
  K.bg(g, t, 7);
  K.cam(g, 1 + 0.05 * t / DUR, 540, 900, () => {
    K.earth(g, 1680, t);
    const d = K.EIO(K.seg(t, 0, 3.5));
    g.save(); g.setLineDash([6, 26]); g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(575, 660); g.quadraticCurveTo(650, 630, 700 + 60 * d, 650 - 40 * d); g.stroke(); g.restore();
    K.helmet(g, 760 + 90 * d, 660 - 60 * d, .3 + .5 * d + t * .05, .95);
    K.person(g, { x: 470 + Math.sin(t * .6) * 10, y: 880 + Math.sin(t * .9) * 14, rot: -.2 + Math.sin(t * .5) * .05, sc: .95, wob: Math.sin(t * 1.4) * .5, blink: (t % 2.6) > 2.45 ? 1 : 0 });
  });
  K.post(g, t);
}

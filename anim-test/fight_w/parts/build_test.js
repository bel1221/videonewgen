function buildAll() {
  // pose check: B steps through every weapon pose (each held 0.4 s), A holds guard. Use with ?vid=...&cho=test
  at('A', 0, -1.3, 0); at('A', 20, -1.3, 0); at('B', 0, 1.3, 0); at('B', 20, 1.3, 0);
  K_('A', 0, G); K_('A', 20, G);
  const list = ['spGuard', 'spWind', 'spThrust', 'spJab', 'spSweepW', 'spSweep', 'spOverW', 'spOver', 'spBlock', 'spBlockH',
    'hmGuard', 'hmRest', 'hmWindO', 'hmSlam', 'hmWindS', 'hmSwing', 'hmUpperW', 'hmUpper', 'hmBlock', 'hmSpin', 'bwIdle', 'bwNock', 'bwDraw', 'bwLoose', 'bwBlock'];
  list.forEach((n, i) => { const t = 0.5 + i * 0.6; K_('B', t, L[n], 'io'); K_('B', t + 0.4, L[n], 'lin'); });
  ARROWS.push({ tn: 12.9, t0: 13.75, t1: 14.1, mode: 'deflect' });
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}
function K_(c, t, pose, e, d) { k(c, t, pose, e, d); }
function near(a, ref) { while (a - ref > 180) a -= 360; while (a - ref < -180) a += 360; return a; }
function evalPosT(c, t) { const K_ = P[c].slice().sort((a, b) => a[0] - b[0]); return evalPos(K_, t); }
let BIND_C = [0, 0], SH = null;

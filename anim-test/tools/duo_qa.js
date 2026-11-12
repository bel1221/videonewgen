(() => {
  // 2 v 2 QA (fight4.js): what the per-duel tools cannot see.
  //   track  - where all four fighters are over time (root x, z), for laying out the cross-duel moments
  //   near   - cross-duel pairs closer than 0.75 block root to root (the duels' own collision does not know the other duel),
  //            except the planned kick at T_SHOVE
  //   speed  - root speed spikes over 16 blocks/s (a position key out of order shows up as a teleport)
  //   bounds - anyone further than 9 blocks from the arena centre
  // window.__qa_step (s, default 0.25) sets the track spacing.   node render.mjs eval "$(cat tools/duo_qa.js)"  with PAGE=...index4.html
  const D = window.__duels, T = window.TOTAL, names = [['1A', 0, 'A'], ['1B', 0, 'B'], ['2A', 1, 'A'], ['2B', 1, 'B']], step = window.__qa_step || 0.25;
  const at = (i, k, t) => { const p = D[i].C.pose(k, t).pos; return [p[0], p[2], p[1]]; };
  const track = {}; for (let t = 0; t <= T + 1e-6; t += step) track[t.toFixed(2)] = names.map(([n, i, k]) => at(i, k, Math.min(t, T - 0.01)).slice(0, 2).map(v => +v.toFixed(1)).join(',')).join('  ');
  const near = [], speed = [], bounds = []; let prev = null, last = {};
  for (let t = 0.05; t < T - 0.02; t += 1 / 30) { const P = names.map(([n, i, k]) => at(i, k, t));
    for (const a of [0, 1]) for (const b of [2, 3]) { const d = Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]), key = names[a][0] + '-' + names[b][0];
      if (d < 0.75 && !(Math.abs(t - 19.05) < 0.5 && key === '1A-2A') && (last[key] == null || t - last[key] > 0.4)) { near.push(t.toFixed(2) + ' ' + key + ' ' + d.toFixed(2)); } if (d < 0.75) last[key] = t; }
    if (prev) P.forEach((p, j) => { const v = Math.hypot(p[0] - prev[j][0], p[1] - prev[j][1]) * 30; if (v > 16) speed.push(t.toFixed(2) + ' ' + names[j][0] + ' ' + v.toFixed(0)); });
    P.forEach((p, j) => { if (Math.hypot(p[0], p[1]) > 9 && (last['b' + j] == null || t - last['b' + j] > 1)) { bounds.push(t.toFixed(2) + ' ' + names[j][0] + ' ' + p[0].toFixed(1) + ',' + p[1].toFixed(1)); last['b' + j] = t; } });
    prev = P; }
  return { track, near, speed, bounds };
})()

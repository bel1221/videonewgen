(() => {
  // Pre-render QA for the AnimationGPT fight (eval in fight_agpt/index.html): contact accuracy at every sync point,
  // foot sliding / floor penetration, body overlap, blade-in-floor, and the planted-foot lock quality.
  const { cast, C, applyPose, THREE, floorAt } = window.__probe;
  const v = new THREE.Vector3();
  const put = (k, t) => { const P = C.pose(k, t); applyPose(cast[k], P); cast[k].root.updateMatrixWorld(true); return P; };
  const bl = (k, t, a) => { put(k, t); return a.map(x => cast[k].weapon.localToWorld(new THREE.Vector3(0, x, 0))); };
  function segD(p1, q1, p2, q2) { const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b;
    let s = den > 1e-6 ? THREE.MathUtils.clamp((b * f - c * e) / den, 0, 1) : 0, t = (b * s + f) / e; if (t < 0) { t = 0; s = THREE.MathUtils.clamp(-c / a, 0, 1); } else if (t > 1) { t = 1; s = THREE.MathUtils.clamp((b - c) / a, 0, 1); }
    return p1.clone().addScaledVector(d1, s).distanceTo(p2.clone().addScaledVector(d2, t)); }
  const sync = C.CLASHES.map(c => {
    const s = c.s, t = c.t, A = put(s.att, t), D = put(s.def, t), dist = Math.hypot(A.pos[0] - D.pos[0], A.pos[2] - D.pos[2]);
    let contact;
    if (s.kind === 'clash') { let best = 9; for (let d = -0.05; d <= 0.05; d += 0.0125) { const [a0, a1] = bl(s.att, t + d, [4, 27]), [b0, b1] = bl(s.def, t + d, [4, 27]); best = Math.min(best, segD(a0, a1, b0, b1)); } contact = best; }
    else { let best = 9; for (let d = -0.06; d <= 0.06; d += 0.015) { const pts = bl(s.att, t + d, [10, 16, 22, 27]), q = C.pose(s.def, t + d);
        for (const p of pts) { if (p.y < q.pos[1] - 0.1 || p.y > q.pos[1] + 1.9) continue; best = Math.min(best, Math.max(0, Math.hypot(p.x - q.pos[0], p.z - q.pos[2]) - 0.3)); } } contact = best; }
    return [+t.toFixed(2), s.kind, s.att + '>' + s.def, +dist.toFixed(2), +contact.toFixed(2)];
  });
  const out = { sync, feet: {}, minGap: 9, overlapFrames: 0, bladeFloor: 0 };
  for (const k of ['A', 'B']) {
    let slide = 0, pinned = 0, pen = 0, maxPen = 0, floatF = 0; let prev = null;
    for (let t = 0.1; t < C.TOTAL - 0.05; t += 1 / 30) {
      const P = put(k, t), so = ['rSn', 'lSn'].map(b => cast[k].bones[b].localToWorld(new THREE.Vector3(0, -6, 0)));
      so.forEach((p, i) => { const f = floorAt(p.x, p.z), d = f - p.y; if (d > 0.04) { pen++; maxPen = Math.max(maxPen, d); } });
      const lo = Math.min(...so.map(p => p.y - floorAt(p.x, p.z))); if (lo > 0.12 && !(P.ik && (P.ik.r || P.ik.l))) floatF++;
      if (prev) so.forEach((p, i) => { const side = i ? 'l' : 'r'; if (P.ik && P.ik[side] && prev.ik && prev.ik[side] && P.ik['w' + side] === 1) { pinned++; slide += Math.hypot(p.x - prev.so[i].x, p.z - prev.so[i].z); } });
      prev = { so, ik: P.ik };
    }
    out.feet[k] = { pinnedFrames: pinned, slidePerPinnedFrame: +(slide / Math.max(1, pinned)).toFixed(4), floorPenFrames: pen, maxPen: +maxPen.toFixed(3), floatingFrames: floatF };
  }
  for (let t = 0.1; t < C.TOTAL; t += 1 / 30) { const a = C.pose('A', t).pos, b = C.pose('B', t).pos, d = Math.hypot(a[0] - b[0], a[2] - b[2]); out.minGap = Math.min(out.minGap, d); if (d < 0.7) out.overlapFrames++;
    for (const k of ['A', 'B']) { const [tip] = bl(k, t, [27]); if (tip.y < floorAt(tip.x, tip.z) - 0.05) out.bladeFloor++; } }
  out.minGap = +out.minGap.toFixed(2);
  out.steps = C.STEPS.length; out.actEnd = +C.act(C.TOTAL).toFixed(2);
  return out;
})()

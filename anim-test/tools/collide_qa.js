(() => {
  // v8 collision QA (every frame): body overlap, blade inside the opponent's body, blade-through-blade outside contacts,
  // blade below the sand. Reads window.__probe (same harness as ab_metrics.js).
  const { cast, C, applyPose, THREE, floorAt } = window.__probe;
  const DT = 1 / (window.__qa_hz || 30), T1 = C.TOTAL - DT, v = new THREE.Vector3(), out = { bodyOverlap: [], bladeInBody: [], bladePhase: [], bladeFloor: [] };
  const clashT = C.CLASHES.map(c => c.t);
  const segD = (p1, q1, p2, q2) => { const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b;
    let s = den > 1e-6 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0, t = (b * s + f) / e; if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); }
    return p1.clone().addScaledVector(d1, s).distanceTo(p2.clone().addScaledVector(d2, t)); };
  let prevSide = null;
  for (let t = 0; t <= T1 + 1e-6; t += DT) {
    const P = { A: C.pose('A', t), B: C.pose('B', t) }, BL = {};
    for (const k of ['A', 'B']) { applyPose(cast[k], P[k]); cast[k].root.updateMatrixWorld(true);
      BL[k] = (cast[k].seg || [4, 10, 16, 22, 28]).map(a => cast[k].weapon.localToWorld(v.set(0, a, 0)).clone()); }
    const g = Math.hypot(P.A.pos[0] - P.B.pos[0], P.A.pos[2] - P.B.pos[2]); if (g < 0.6) out.bodyOverlap.push([+t.toFixed(2), +g.toFixed(2)]);
    for (const k of ['A', 'B']) { const o = P[k === 'A' ? 'B' : 'A'].pos; let pen = 0, fl = 0;
      for (const p of BL[k]) { const r = Math.hypot(p.x - o[0], p.z - o[2]); if (p.y > o[1] + 0.1 && p.y < o[1] + 1.8 && r < 0.2) pen = Math.max(pen, 0.2 - r);
        fl = Math.max(fl, floorAt(p.x, p.z) - p.y); }
      if (pen > 0.03) out.bladeInBody.push([+t.toFixed(2), k, +pen.toFixed(2)]); if (fl > 0.03) out.bladeFloor.push([+t.toFixed(2), k, +fl.toFixed(2)]); }
    const near = clashT.some(c => Math.abs(t - c) < 0.12), d = segD(BL.A[0], BL.A[4], BL.B[0], BL.B[4]);
    if (!near && d < 0.035) out.bladePhase.push([+t.toFixed(2), +d.toFixed(3)]);
  }
  out.counts = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length]));
  return out;
})()

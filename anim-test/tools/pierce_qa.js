(() => {
  // Finisher check: where A's spear runs relative to B's torso (spine2 frame, px). inside = sample points of the shaft inside the
  // torso box; out = how far the tip sticks out of B's back (blocks, along the shaft past the last inside point).
  const { cast, C, applyPose, THREE } = window.__probe, out = [], inv = new THREE.Matrix4();
  for (const t of (window.__qa_ts || [26.2, 26.3, 26.4, 26.6, 27.0, 27.3, 27.45, 27.6])) {
    for (const k of ['A', 'B']) { applyPose(cast[k], C.pose(k, t)); cast[k].root.updateMatrixWorld(true); }
    const sp = cast.B.rest.spine2[1]; inv.copy(cast.B.bones.spine2.matrixWorld).invert(); let n = 0, last = null;
    for (let a = 0; a <= 24.5; a += 0.5) { const q = cast.A.weapon.localToWorld(new THREE.Vector3(0, a, 0)).applyMatrix4(inv);
      if (Math.abs(q.x) < 4 && q.y > 12 - sp && q.y < 24 - sp && Math.abs(q.z) < 2) { n++; last = a; } }
    let best = [99]; for (let a = -10; a <= 24.5; a += 0.5) { const q = cast.A.weapon.localToWorld(new THREE.Vector3(0, a, 0)).applyMatrix4(inv), d = Math.hypot(q.x, q.z); if (d < best[0]) best = [+d.toFixed(1), a, +q.x.toFixed(1), +(q.y + sp).toFixed(1), +q.z.toFixed(1)]; }
    const tip = cast.A.weapon.localToWorld(new THREE.Vector3(0, 24.5, 0)), pa = C.pose('A', t).pos, pb = C.pose('B', t).pos;
    out.push({ t, inside: n, lastIn: last, tipPast: last == null ? null : +((24.5 - last) * 0.79 / 16).toFixed(2), gap: +Math.hypot(pa[0] - pb[0], pa[2] - pb[2]).toFixed(2), tipY: +(tip.y - pb[1]).toFixed(2), pierce: +(C.pose('A', t).pierce || 0).toFixed(2), near: best.join('/'), yawA: Math.round(C.pose('A', t).yaw), yawB: Math.round(C.pose('B', t).yaw) });
  }
  return out;
})()

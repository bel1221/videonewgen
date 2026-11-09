(() => {
  // Skeleton-level A/B metrics, identical for both code versions (reads window.__probe).
  const { cast, C, applyPose, THREE, floorAt } = window.__probe;
  const BONES = ['hips', 'spine2', 'chest2', 'head', 'rSh', 'rEl', 'lSh', 'lEl', 'rTh', 'rSn', 'lTh', 'lSn'].filter(b => cast.A.bones[b]);
  const T0 = +(window.__ab_t0 || 0.2), T1 = +(window.__ab_t1 || Math.min(19.8, C.TOTAL - 0.2)), DT = 1 / 30;
  const pct = (a, q) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
  const out = {};
  for (const k of ['A', 'B']) {
    const ch = cast[k], prevQ = {}, prevW = {}, acc = {}, vel = {}; let pops = 0; BONES.forEach(b => { acc[b] = []; vel[b] = []; });
    const bladeStep = [], wristOut = [], grip = [], rootAcc = [], rootYj = [], elbowBack = [], kneeBack = [];
    let pRoot = null, pVel = null, pY = [], pBlade = null;
    const v = new THREE.Vector3(), h = new THREE.Vector3(), q = new THREE.Quaternion();
    for (let t = T0; t <= T1 + 1e-6; t += DT) {
      const P = C.pose(k, t); applyPose(ch, P); ch.root.updateMatrixWorld(true);
      for (const b of BONES) {
        ch.bones[b].getWorldQuaternion(q);
        if (prevQ[b]) { const w = 2 * Math.acos(Math.min(1, Math.abs(q.dot(prevQ[b])))) * 180 / Math.PI; vel[b].push(w); if (prevW[b] !== undefined) { const a = Math.abs(w - prevW[b]); acc[b].push(a); if (a > 25) pops++; } prevW[b] = w; }
        prevQ[b] = q.clone();
      }
      if (ch.weapon) {
        ch.weapon.localToWorld(v.set(0, 26, 0)); ch.bones.rHand.getWorldPosition(h); const d = v.clone().sub(h).normalize();
        if (pBlade) bladeStep.push(Math.acos(Math.min(1, Math.max(-1, d.dot(pBlade)))) * 180 / Math.PI); pBlade = d;
        const gw = new THREE.Vector3(); ch.weapon.getWorldPosition(gw); grip.push(gw.distanceTo(h));
        const wr = ch.weapon.rotation.x * 180 / Math.PI; wristOut.push(wr < 20 || wr > 175 ? 1 : 0);
      }
      const r = ch.root.position.clone();
      if (pRoot) { const vv = r.clone().sub(pRoot).multiplyScalar(30); vv.y = 0; if (pVel) rootAcc.push(vv.clone().sub(pVel).length()); pVel = vv; }
      pY.push(r.y); if (pY.length >= 3) { const n = pY.length; rootYj.push(Math.abs(pY[n - 1] - 2 * pY[n - 2] + pY[n - 3])); }
      pRoot = r;
      elbowBack.push(ch.bones.rEl.rotation.x > 5 * Math.PI / 180 || ch.bones.lEl.rotation.x > 5 * Math.PI / 180 ? 1 : 0);
      kneeBack.push(ch.bones.rSn.rotation.x < -5 * Math.PI / 180 || ch.bones.lSn.rotation.x < -5 * Math.PI / 180 ? 1 : 0);
    }
    const allAcc = BONES.flatMap(b => acc[b]);
    out[k] = {
      joint_angacc_med: +pct(allAcc, 0.5).toFixed(2), joint_angacc_p95: +pct(allAcc, 0.95).toFixed(1), joint_pops: pops,
      worst_bones_p95: Object.fromEntries(BONES.map(b => [b, +pct(acc[b], 0.95).toFixed(1)]).sort((a, b) => b[1] - a[1]).slice(0, 4)),
      blade_step_p95: +pct(bladeStep, 0.95).toFixed(1), blade_step_max: +Math.max(...bladeStep).toFixed(1), blade_over45: bladeStep.filter(x => x > 45).length,
      wrist_out_of_range_pct: +(100 * wristOut.reduce((a, b) => a + b, 0) / wristOut.length).toFixed(1), grip_offset_max: +Math.max(...grip).toFixed(3),
      root_acc_p95: +pct(rootAcc, 0.95).toFixed(2), root_vertical_jerk_p95: +pct(rootYj, 0.95).toFixed(4),
      elbow_backward_pct: +(100 * elbowBack.reduce((a, b) => a + b, 0) / elbowBack.length).toFixed(1), knee_backward_pct: +(100 * kneeBack.reduce((a, b) => a + b, 0) / kneeBack.length).toFixed(1),
    };
  }
  let ov = 0, n = 0, mind = 9;
  for (let t = T0; t <= T1; t += DT) { const a = C.pose('A', t).pos, b = C.pose('B', t).pos, d = Math.hypot(a[0] - b[0], a[2] - b[2]); n++; if (d < 0.75) ov++; mind = Math.min(mind, d); }
  out.spacing = { overlap_pct: +(100 * ov / n).toFixed(1), min_gap: +mind.toFixed(2) };
  return out;
})()

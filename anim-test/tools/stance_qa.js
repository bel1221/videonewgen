(() => {
  // Stance QA (permanent-standard checks): bounce (pelvis up/down reversals >= 0.035), forward lean (> 30 deg pitch),
  // knee/sole below the sand (> 0.03), planted-foot sliding (> 0.03 block/frame outside slide windows). Per fighter, per second bins.
  const { cast, C, applyPose, THREE, floorAt } = window.__probe, DT = 1 / 30, T0 = +(window.__qa_t0 || 0.1), T1 = +(window.__qa_t1 || C.TOTAL - 0.1), out = {};
  const v = new THREE.Vector3();
  for (const k of ['A', 'B']) {
    const ch = cast[k], ys = [], o = { bounce: [], lean: [], belowFloor: [], footSlide: [] }; let prevIk = null;
    for (let t = T0; t <= T1 + 1e-6; t += DT) {
      const p = C.pose(k, t); applyPose(ch, p); ch.root.updateMatrixWorld(true);
      ys.push([t, ch.bones.hips.getWorldPosition(v).y - floorAt(p.pos[0], p.pos[2])]);
      const pitch = (p.waist[0] || 0) + (p.chest[0] || 0) * 0.6 + (p.tilt ? p.tilt[0] : 0); if (pitch > 30 && Math.abs(p.y) < 0.6) o.lean.push(+t.toFixed(2));
      for (const [kn, sole] of [['rSn', 'rSn'], ['lSn', 'lSn']]) {
        const kp = ch.bones[kn].getWorldPosition(new THREE.Vector3()), sp = ch.bones[sole].localToWorld(new THREE.Vector3(0, -6, 0));
        const dk = kp.y - floorAt(kp.x, kp.z), ds = sp.y - floorAt(sp.x, sp.z); if (dk < -0.03 || ds < -0.05) o.belowFloor.push([+t.toFixed(2), kn, +dk.toFixed(2), +ds.toFixed(2), p.ik && p.ik[kn[0]] ? 1 : 0]); }
      if (p.ik) { const inSlide = (C.SLIDES[k] || []).some(([a, b]) => t >= a - 0.05 && t <= b + 0.1);
        for (const f of ['r', 'l']) { const q = p.ik[f], q0 = prevIk && prevIk[f]; if (!q || !q0 || inSlide) continue;
          const planted = q[1] - floorAt(q[0], q[2]) < 0.05 && q0[1] - floorAt(q0[0], q0[2]) < 0.05, mv = Math.hypot(q[0] - q0[0], q[2] - q0[2]);
          if (planted && mv > 0.03 && mv < 0.4) o.footSlide.push([+t.toFixed(2), f, +mv.toFixed(2)]); } }
      prevIk = p.ik ? { r: p.ik.r && p.ik.r.slice(), l: p.ik.l && p.ik.l.slice() } : null;
    }
    let hi = ys[0][1], lo = ys[0][1], dir = 0;   // reversal counter with a running max/min (0.035 block hysteresis)
    for (const [t, y] of ys) { if (dir !== -1) hi = Math.max(hi, y); if (dir !== 1) lo = Math.min(lo, y);
      if (dir !== -1 && hi - y > 0.035) { o.bounce.push(+t.toFixed(2)); dir = -1; lo = y; } else if (dir !== 1 && y - lo > 0.035) { o.bounce.push(+t.toFixed(2)); dir = 1; hi = y; } }
    const bins = a => { const b = {}; for (const x of a) { const s = Math.floor(Array.isArray(x) ? x[0] : x); b[s] = (b[s] || 0) + 1; } return b; };
    out[k] = Object.fromEntries(Object.entries(o).map(([n, a]) => [n, { n: a.length, perSec: bins(a), first: a.slice(0, 12) }]));
  }
  return out;
})()

(() => {
  // Where do blade steps > 45 deg/frame happen, and is the TARGET (pose bd) jumping too or only the rig's result?
  // Run in fight/ or fight_v5/ (window.__probe).
  const { cast, C, applyPose, THREE } = window.__probe, out = { A: [], B: [] }, v = new THREE.Vector3(), h = new THREE.Vector3();
  for (const k of ['A', 'B']) {
    let pb = null, pt = null;
    for (let t = 0.2; t <= C.TOTAL - 0.2; t += 1 / 30) {
      const P = C.pose(k, t); applyPose(cast[k], P); cast[k].root.updateMatrixWorld(true);
      cast[k].weapon.localToWorld(v.set(0, 26, 0)); cast[k].bones.rHand.getWorldPosition(h); const d = v.clone().sub(h).normalize();
      const y = (P.yaw || 0) * Math.PI / 180, b = P.bd || [0, 1, 0];      // target blade dir (world, from yaw like rig2 without hR)
      const tw = new THREE.Vector3(b[0] * Math.cos(y) + b[2] * Math.sin(y), b[1], -b[0] * Math.sin(y) + b[2] * Math.cos(y)).normalize();
      if (pb) { const s = Math.acos(Math.min(1, Math.max(-1, d.dot(pb)))) * 57.3, st = Math.acos(Math.min(1, Math.max(-1, tw.dot(pt)))) * 57.3, err = Math.acos(Math.min(1, Math.max(-1, d.dot(tw)))) * 57.3;
        if (s > 45) out[k].push([+t.toFixed(2), +s.toFixed(0), +st.toFixed(0), +err.toFixed(0)]); }
      pb = d; pt = tw;
    }
  }
  return out;   // [t, actual step, target step, actual-vs-target error] per flip
})()

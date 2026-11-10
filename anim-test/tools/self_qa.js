(() => {
  // Self-collision QA: points along each arm (upper arm, forearm, hand) tested against the fighter's OWN torso box
  // (spine2 frame: x +-4 px, z +-2 px, y 12..24 px abs, inflated by 1.2 px for limb thickness), and the two shins/thighs
  // against each other (segment distance < 2.6 px). Per fighter: count, per-second bins, worst depth, first samples.
  const { cast, C, applyPose, THREE } = window.__probe, DT = 1 / (window.__qa_hz || 30), T1 = C.TOTAL - DT, out = {};
  const segD = (p1, q1, p2, q2) => { const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b;
    let s = den > 1e-6 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0, t = (b * s + f) / e; if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); }
    return p1.clone().addScaledVector(d1, s).distanceTo(p2.clone().addScaledVector(d2, t)); };
  for (const k of ['A', 'B']) {
    const ch = cast[k], b = ch.bones, o = { armInTorso: [], legsCross: [] }; let worst = 0;
    for (let t = 0.05; t <= T1; t += DT) {
      applyPose(ch, C.pose(k, t)); ch.root.updateMatrixWorld(true);
      const inv = new THREE.Matrix4().copy(b.spine2.matrixWorld).invert(), spAbs = ch.rest.spine2[1];   // spine2 bind y (px)
      for (const sd of ['r', 'l']) {
        const sh = b[sd + 'Sh'].getWorldPosition(new THREE.Vector3()), el = b[sd + 'El'].getWorldPosition(new THREE.Vector3()), hd = b[sd + 'Hand'].getWorldPosition(new THREE.Vector3());
        let depth = 0;
        for (const [p0, p1, u0] of [[sh, el, 0.35], [el, hd, 0]]) for (let u = u0; u <= 1.001; u += 0.2) {
          const q = p0.clone().lerp(p1, u).applyMatrix4(inv), y = q.y + spAbs;   // local px (y relative to the bind height)
          const dx = 4 + 1.2 - Math.abs(q.x), dz = 2 + 1.2 - Math.abs(q.z), dy = Math.min(y - 12, 24 - y);
          if (dx > 0 && dz > 0 && dy > 0) depth = Math.max(depth, Math.min(dx, dz)); }
        if (depth > 0.6) { o.armInTorso.push([+t.toFixed(2), sd, +depth.toFixed(1)]); worst = Math.max(worst, depth); }
      }
      const P = n => b[n].getWorldPosition(new THREE.Vector3()), sole = n => b[n].localToWorld(new THREE.Vector3(0, -6, 0));
      const dS = segD(P('rSn'), sole('rSn'), P('lSn'), sole('lSn')) * 16, dT = segD(P('rTh'), P('rSn'), P('lTh'), P('lSn')) * 16;
      if (Math.min(dS, dT) < 2.6) o.legsCross.push([+t.toFixed(2), +Math.min(dS, dT).toFixed(1)]);
    }
    const bins = a => { const r = {}; for (const x of a) { const s = Math.floor(x[0]); r[s] = (r[s] || 0) + 1; } return r; };
    out[k] = { armInTorso: o.armInTorso.length, armBins: bins(o.armInTorso), worstPx: +worst.toFixed(1), armFirst: o.armInTorso.slice(0, 10), legsCross: o.legsCross.length, legBins: bins(o.legsCross), legFirst: o.legsCross.slice(0, 6) };
  }
  return out;
})()

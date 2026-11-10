(() => {
  // LEG-CROSSING QA (user, test-1 review 2026-11-10: "ANY crossing makes the movement look poorly done").
  // phase_qa's legsCross only catches legs passing THROUGH each other. This flags a leg crossing OVER the other one's line,
  // even without touching. For every sample, both legs are measured in the pelvis frame (hips bone; +x = body left):
  //   gapSole / gapKnee = lateral offset (px) of the left sole/knee minus the right sole/knee. Standing apart is about +4 px or more.
  //   cross   - gap < 0: one foot (or knee) is past the other one's line
  //   narrow  - 0 <= gap < 2.5 px: the feet are nearly in line (they touch, since a leg is 4 px wide), "tightrope" steps
  // Samples where both feet are off the floor (jumps, flips) are reported separately as 'air' and don't count.
  // window.__qa_hz (default 60), __qa_t0/__qa_t1. Run with:  node render.mjs eval "$(cat tools/cross_qa.js)"
  const { cast, C, applyPose, THREE, floorAt } = window.__probe, HZ = window.__qa_hz || 60, T0 = window.__qa_t0 || 0.05, T1 = window.__qa_t1 || C.TOTAL - 0.05;
  const V = () => new THREE.Vector3(), inv = new THREE.Matrix4(), out = {};
  for (const k of ['A', 'B']) out[k] = { cross: [], narrow: [], air: 0, minGap: 99, n: 0 };
  for (let t = T0; t <= T1 + 1e-6; t += 1 / HZ) {
    for (const k of ['A', 'B']) {
      const ch = cast[k]; applyPose(ch, C.pose(k, t)); ch.root.updateMatrixWorld(true);
      inv.copy(ch.bones.hips.matrixWorld).invert();
      const loc = (bn, y) => ch.bones[bn].localToWorld(V().set(0, y, 0));
      const sR = loc('rSn', -6), sL = loc('lSn', -6), kR = loc('rSn', 0), kL = loc('lSn', 0);
      const air = [sR, sL].every(p => p.y - floorAt(p.x, p.z) > 0.12);
      if (air) { out[k].air++; continue; }
      const lat = p => p.clone().applyMatrix4(inv).x;           // px in the pelvis frame, +x = body left
      const gS = lat(sL) - lat(sR), gK = lat(kL) - lat(kR), g = Math.min(gS, gK), R = out[k];
      R.n++; R.minGap = Math.min(R.minGap, g);
      const hR = +(sR.y - floorAt(sR.x, sR.z)).toFixed(2), hL = +(sL.y - floorAt(sL.x, sL.z)).toFixed(2);
      if (g < 0) R.cross.push([+t.toFixed(3), +gS.toFixed(1), +gK.toFixed(1), hR, hL]);
      else if (g < 2.5) R.narrow.push([+t.toFixed(3), +gS.toFixed(1), +gK.toFixed(1), hR, hL]);
    }
  }
  const spans = a => { const s = []; for (const x of a) { const l = s[s.length - 1]; if (l && x[0] - l[1] < 2.5 / HZ) { l[1] = x[0]; l[2] = Math.min(l[2], x[1], x[2]); } else s.push([x[0], x[0], Math.min(x[1], x[2])]); } return s.map(v => v.map(n => +n.toFixed(2))); };
  const res = {};
  for (const k of ['A', 'B']) { const R = out[k];
    res[k] = { samples: R.n, air: R.air, minGap: +R.minGap.toFixed(1), cross: R.cross.length, narrow: R.narrow.length,
      crossSpans: spans(R.cross), narrowSpans: spans(R.narrow).slice(0, 30) }; }
  return res;
})()

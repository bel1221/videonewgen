// eval in studio/index.html: per contact, distance from the planned contact point to each blade at tc, and where the
// hand ended up vs the engine's hand target (IK reach), in blocks.
(() => {
  const { M, cast, applyPose, THREE } = window.__studio;
  const segPt = (a, b, p) => { const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq())); return a.clone().addScaledVector(ab, t).distanceTo(p); };
  const info = (k, t, C) => {
    const P = M.pose(k, t); applyPose(cast[k], P); cast[k].root.updateMatrixWorld(true);
    const a = cast[k].weapon.localToWorld(new THREE.Vector3(0, 0, 0)), b = cast[k].weapon.localToWorld(new THREE.Vector3(0, 27, 0));
    const hand = cast[k].bones.rHand.getWorldPosition(new THREE.Vector3());
    const tgt = cast[k].root.localToWorld(new THREE.Vector3(P.hRw[0] * 16, P.hRw[1] * 16, P.hRw[2] * 16));
    const dirWant = new THREE.Vector3(...P.bdR).applyQuaternion(cast[k].root.getWorldQuaternion(new THREE.Quaternion())).normalize();
    const dirGot = b.clone().sub(a).normalize();
    return { toC: +segPt(a, b, C).toFixed(2), handErr: +hand.distanceTo(tgt).toFixed(2), gripOff: +a.distanceTo(hand).toFixed(2), bladeErrDeg: +(Math.acos(Math.min(1, dirWant.dot(dirGot))) * 57.3).toFixed(0) };
  };
  return M.contacts.map(c => { const C = new THREE.Vector3(...c.p); return { t: c.t, kind: c.kind, att: info(c.att, c.t, C), def: c.kind === 'clash' ? info(c.def, c.t, C) : null }; });
})()

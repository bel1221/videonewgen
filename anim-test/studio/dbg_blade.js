// eval in studio/index.html: per frame around window.__T for window.__K: wanted blade dir (engine bdR, world) vs actual,
// world turn per frame, and the hand target. Usage: prepend window.__K='A';window.__T=6.05; to this file and eval it.
(() => {
  const { M, cast, applyPose, THREE } = window.__studio, k = window.__K || 'A', T0 = window.__T || 6.05, out = [];
  let prev = null;
  for (let f = -14; f <= 6; f++) {
    const t = T0 + f / 30, P = M.pose(k, t); applyPose(cast[k], P); cast[k].root.updateMatrixWorld(true);
    const a = cast[k].weapon.localToWorld(new THREE.Vector3(0, 0, 0)), b = cast[k].weapon.localToWorld(new THREE.Vector3(0, 27, 0)), got = b.clone().sub(a).normalize();
    const want = new THREE.Vector3(...P.bdR).applyQuaternion(cast[k].root.getWorldQuaternion(new THREE.Quaternion())).normalize();
    const el = cast[k].bones.rEl.getWorldPosition(new THREE.Vector3()), hd = cast[k].bones.rHand.getWorldPosition(new THREE.Vector3()), fa = hd.clone().sub(el).normalize();
    out.push({ f, err: +(Math.acos(Math.min(1, want.dot(got))) * 57.3).toFixed(0), turn: prev ? +(Math.acos(Math.min(1, got.dot(prev))) * 57.3).toFixed(0) : 0,
      wantTurn: out.length ? +(Math.acos(Math.min(1, want.dot(out[out.length - 1]._w))) * 57.3).toFixed(0) : 0, faDot: +fa.dot(got).toFixed(2), h: P.hRw.map(v => +v.toFixed(2)), _w: want });
    prev = got;
  }
  return out.map(o => { delete o._w; return o; });
})()

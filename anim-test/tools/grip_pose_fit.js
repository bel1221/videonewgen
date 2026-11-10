(() => {
  // Fits main-arm angles for a two-handed pose. For each target: the main (right) hand should sit at H (chest2-local px:
  // +x = body left, +y = up, +z = forward) with the weapon along bd = [elevation, azimuth] (deg, torso frame). Searches
  // rArm x/z and rElbow x, then reports the hand position reached, the weapon direction actually produced (chest2-local) and the
  // support hand's reach ratio to the point `lhAt` px along the weapon (<= 0.95 = holdable).
  const { cast, C, applyPose, THREE } = window.__probe, k = 'A', ch = cast[k], b = ch.bones, out = {};
  const bdv = (el, az) => { const e = el * Math.PI / 180, a = az * Math.PI / 180; return [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)]; };
  const T = window.__qa_targets || { thrustSide: { H: [2, 17, 6], bd: [0, 88], lhAt: 8 }, thrustSideNeg: { H: [2, 17, 6], bd: [0, -88], lhAt: 8 }, windSide: { H: [-6, 17, 4], bd: [4, 88], lhAt: 8 },
    pierceSide: { H: [3, 17, 6], bd: [0, 88], lhAt: 8 }, plunge: { H: [0, 17, 5], bd: [-80, 0], lhAt: -7 }, brake: { H: [0, 16, 5.5], bd: [-62, 20], lhAt: -7 } };
  const p0 = C.pose(k, 1.0), sp = ch.rest.chest2 ? ch.rest.chest2[1] : 21;
  const evalP = (ax, az, el, bd) => { const p = { ...p0, lh: 0, gk: 0, spinK: 0, rArm: [ax, 0, az], rElbow: [el, 0, 0], bd: bdv(...bd) }; applyPose(ch, p); ch.root.updateMatrixWorld(true);
    const h = b.chest2.worldToLocal(b.rHand.getWorldPosition(new THREE.Vector3())); return [h.x, h.y + sp, h.z]; };
  for (const name in T) { const { H, bd, lhAt } = T[name]; let best = null;
    for (let ax = -180; ax <= 30; ax += 6) for (let az = -80; az <= 80; az += 8) for (let el = -140; el <= 0; el += 10) { const h = evalP(ax, az, el, bd), d = Math.hypot(h[0] - H[0], h[1] - H[1], h[2] - H[2]); if (!best || d < best[0]) best = [d, ax, az, el, h]; }
    for (let it = 0; it < 3; it++) { const [, ax0, az0, el0] = best; for (let ax = ax0 - 6; ax <= ax0 + 6; ax += 2) for (let az = az0 - 8; az <= az0 + 8; az += 2) for (let el = el0 - 10; el <= el0 + 10; el += 2) { const h = evalP(ax, az, el, bd), d = Math.hypot(h[0] - H[0], h[1] - H[1], h[2] - H[2]); if (d < best[0]) best = [d, ax, az, el, h]; } }
    const [d, ax, az, el] = best, h = evalP(ax, az, el, bd);
    const w0 = b.chest2.worldToLocal(ch.weapon.localToWorld(new THREE.Vector3(0, 0, 0))), w1 = b.chest2.worldToLocal(ch.weapon.localToWorld(new THREE.Vector3(0, 10, 0))), dir = w1.sub(w0).normalize();
    const sh = b.lSh.getWorldPosition(new THREE.Vector3()), le = b.lEl.getWorldPosition(new THREE.Vector3()), lhd = b.lHand.getWorldPosition(new THREE.Vector3()), L = sh.distanceTo(le) + le.distanceTo(lhd);
    const reach = a => +(sh.distanceTo(ch.weapon.localToWorld(new THREE.Vector3(0, a, 0))) / L).toFixed(2);
    out[name] = `rArm [${ax}, 0, ${az}] rElbow [${el}, 0, 0] miss ${d.toFixed(1)} hand ${h.map(v => v.toFixed(1))} dir ${[dir.x, dir.y, dir.z].map(v => v.toFixed(2))} reach@${lhAt} ${reach(lhAt)} @-7 ${reach(-7)} @4 ${reach(4)} @8 ${reach(8)} @12 ${reach(12)}`; }
  return out;
})()

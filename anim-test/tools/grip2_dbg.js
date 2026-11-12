(() => {
  // Two-handed grip debug: for fighter window.__qa_k (default 'A') between __qa_t0 and __qa_t1, every 1/15 s: pose lh, grip weight, reach
  // ratio of the second hand's point (1 = arm straight), how far the second hand is from that point (px), how far the weapon's real
  // direction is from the pose's wanted direction (deg; the collision pass may turn it), and where the main hand sits in the chest frame.
  const { cast, C, applyPose, THREE } = window.__probe, k = window.__qa_k || 'A', ch = cast[k], b = ch.bones, o = [];
  for (let t = window.__qa_t0 || 5; t <= (window.__qa_t1 || 7); t += 1 / 15) { const p = C.pose(k, t); applyPose(ch, p); ch.root.updateMatrixWorld(true);
    const tg = ch.weapon.localToWorld(new THREE.Vector3(0, ch.lh + (p.lhAt || 0), 0)), miss = b.lHand.getWorldPosition(new THREE.Vector3()).distanceTo(tg) * 16;
    const e = ch.weapon.matrixWorld.elements, ax = new THREE.Vector3(e[4], e[5], e[6]).normalize(), ty = ((p.yaw || 0) + (p.waist[1] || 0) + (p.chest[1] || 0)) * Math.PI / 180;
    const want = new THREE.Vector3(...p.bd).applyAxisAngle(new THREE.Vector3(0, 1, 0), ty).normalize(), off = Math.acos(Math.max(-1, Math.min(1, ax.dot(want)))) * 180 / Math.PI;
    const h = b.chest2.worldToLocal(b.rHand.getWorldPosition(new THREE.Vector3())), l = b.chest2.worldToLocal(tg.clone());
    o.push(t.toFixed(2) + ' lh ' + (p.lh || 0).toFixed(2) + ' w ' + (p.gripW ?? 1).toFixed(2) + ' reach ' + (ch.gripReach == null ? '-' : ch.gripReach.toFixed(2)) + ' miss ' + miss.toFixed(1) + ' dirOff ' + off.toFixed(0) +
      ' R ' + [h.x, h.y, h.z].map(v => v.toFixed(0)).join(',') + ' L* ' + [l.x, l.y, l.z].map(v => v.toFixed(0)).join(',') + ' bd ' + p.bd.map(v => v.toFixed(2)).join(',')); }
  return o;
})()

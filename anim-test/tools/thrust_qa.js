(() => {
  // Two-handed thrust check at given times: aim = cos of the angle between the weapon axis and the direction to the opponent
  // (1 = pointing straight at him), reach = support-hand reach ratio (<= 0.95 holdable), w = grip weight, tipGap = distance
  // from the weapon tip to the opponent's chest (blocks). window.__qa_th = [[fighter, t], ...]
  const { cast, C, applyPose, THREE } = window.__probe, out = [];
  for (const [k, t] of (window.__qa_th || [['A', 3.33], ['A', 3.55], ['B', 3.55], ['A', 4.42], ['B', 6.8], ['B', 8.4], ['A', 26.5], ['A', 27.0]])) { const o = k === 'A' ? 'B' : 'A';
    for (const c of ['A', 'B']) { applyPose(cast[c], C.pose(c, t)); cast[c].root.updateMatrixWorld(true); }
    const p = C.pose(k, t), q = C.pose(o, t), w0 = cast[k].weapon.localToWorld(new THREE.Vector3(0, 0, 0)), w1 = cast[k].weapon.localToWorld(new THREE.Vector3(0, 24.5, 0));
    const dir = w1.clone().sub(w0).normalize(), to = new THREE.Vector3(q.pos[0] - p.pos[0], 0, q.pos[2] - p.pos[2]).normalize(), chest = new THREE.Vector3(q.pos[0], q.pos[1] + 1.2, q.pos[2]);
    out.push(`${k}@${t}: aim ${dir.dot(to).toFixed(2)} elev ${dir.y.toFixed(2)} reach ${cast[k].gripReach == null ? '-' : cast[k].gripReach.toFixed(2)} lh ${(p.lh || 0).toFixed(2)} w ${(p.gripW ?? 1).toFixed(2)} tipGap ${w1.distanceTo(chest).toFixed(2)} yawOff ${Math.round(p.yawOff || 0)}`); }
  return out;
})()

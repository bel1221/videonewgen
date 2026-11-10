(() => {
  // For each two-handed pose (sampled at a time it is held), sweep the main arm's inward angle (rArm z) and report the support
  // hand's reach ratio to the grip point (<= ~0.95 = a real two-handed grip is possible). window.__qa_fit = [[label, fighter, t], ...]
  const { cast, C, applyPose, THREE } = window.__probe, out = {};
  const LIST = window.__qa_fit || [['spCharge', 'A', 3.1], ['spWind', 'A', 3.33], ['spThrust', 'A', 3.55], ['spPierce', 'A', 26.7], ['spBrake', 'A', 10.4], ['gsPlungeW', 'A', 13.72], ['gsPlunge', 'A', 14.02]];
  for (const [name, k, t] of LIST) { const ch = cast[k], b = ch.bones, p0 = C.pose(k, t), rows = [];
    for (const dz of [0, 15, 30, 45, 60]) for (const lh of [-7, -4]) { const p = { ...p0, lh: 0, rArm: [p0.rArm[0], p0.rArm[1], p0.rArm[2] + dz] }; applyPose(ch, p); ch.root.updateMatrixWorld(true);
      const sh = b.lSh.getWorldPosition(new THREE.Vector3()), el = b.lEl.getWorldPosition(new THREE.Vector3()), hd = b.lHand.getWorldPosition(new THREE.Vector3()), L = sh.distanceTo(el) + el.distanceTo(hd);
      rows.push(`z+${dz} lh${lh}: ${(sh.distanceTo(ch.weapon.localToWorld(new THREE.Vector3(0, lh, 0))) / L).toFixed(2)}`); }
    out[name + ' rArm ' + p0.rArm.map(Math.round)] = rows.join('  '); }
  return out;
})()

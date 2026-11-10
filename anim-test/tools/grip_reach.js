(() => {
  // For candidate support-hand points along the weapon (px from the main hand, + = toward the tip), how far each is from the
  // support shoulder as a fraction of the arm length (<= 1 = reachable), per two-handed pose window. window.__qa_k.
  const { cast, C, applyPose, THREE } = window.__probe, out = {}, CAND = window.__qa_c || [-7, -4, 4, 6, 8, 10, 12];
  for (const k of ['A', 'B']) { const ch = cast[k], b = ch.bones, acc = CAND.map(() => ({ n: 0, ok: 0, max: 0, sum: 0 }));
    for (let t = 0.1; t < C.TOTAL - 0.1; t += 1 / 30) { const p = C.pose(k, t); if ((p.lh || 0) < 0.9) continue; applyPose(ch, { ...p, lh: 0 }); ch.root.updateMatrixWorld(true);
      const sh = b.lSh.getWorldPosition(new THREE.Vector3()), el = b.lEl.getWorldPosition(new THREE.Vector3()), hd = b.lHand.getWorldPosition(new THREE.Vector3()), L = sh.distanceTo(el) + el.distanceTo(hd);
      CAND.forEach((a, i) => { const r = sh.distanceTo(ch.weapon.localToWorld(new THREE.Vector3(0, a, 0))) / L, q = acc[i]; q.n++; q.sum += r; q.max = Math.max(q.max, r); if (r <= 0.97) q.ok++; }); }
    out[k] = CAND.map((a, i) => `lh ${a}: mean ${(acc[i].sum / Math.max(1, acc[i].n)).toFixed(2)} max ${acc[i].max.toFixed(2)} reachable ${Math.round(100 * acc[i].ok / Math.max(1, acc[i].n))}% of ${acc[i].n}`); }
  return out;
})()

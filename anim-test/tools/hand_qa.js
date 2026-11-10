(() => {
  // Hand spasm QA: each hand's position in the chest frame (px), sampled at 30 Hz. A "spasm" is a direction reversal where the
  // hand moved more than 1.5 px in both frames (it jerks one way, then back). Also reports the fastest single-frame move and
  // how much of the time the support hand is on the weapon (grip weight > 0.5).
  const { cast, C, applyPose, THREE } = window.__probe, T0 = window.__qa_t0 || 0.1, T1 = window.__qa_t1 || C.TOTAL - 0.1, out = {};
  for (const k of ['A', 'B']) { const o = { l: { spasm: [], max: 0 }, r: { spasm: [], max: 0 }, gripOn: 0, n: 0 }, hist = { l: [], r: [] };
    for (let t = T0; t <= T1; t += 1 / 30) { const p = C.pose(k, t); applyPose(cast[k], p); cast[k].root.updateMatrixWorld(true); o.n++;
      if ((p.lh || 0) * (p.gripW ?? 1) > 0.5) o.gripOn++;
      for (const sd of ['l', 'r']) { const q = cast[k].bones.chest2.worldToLocal(cast[k].bones[sd + 'Hand'].getWorldPosition(new THREE.Vector3())), h = hist[sd]; h.push(q);
        if (h.length >= 3) { const a = h[h.length - 2].clone().sub(h[h.length - 3]), b = q.clone().sub(h[h.length - 2]); o[sd].max = Math.max(o[sd].max, b.length());
          if (a.length() > 1.5 && b.length() > 1.5 && a.dot(b) / (a.length() * b.length()) < -0.3) o[sd].spasm.push(+t.toFixed(2)); } } }
    out[k] = { leftSpasms: o.l.spasm.length, leftAt: o.l.spasm.join(' '), leftMaxPx: +o.l.max.toFixed(1), rightSpasms: o.r.spasm.length, rightAt: o.r.spasm.join(' '), rightMaxPx: +o.r.max.toFixed(1), twoHandedPct: Math.round(100 * o.gripOn / o.n) }; }
  return out;
})()

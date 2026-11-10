(() => {
  // prints the support-hand grip numbers for one fighter: lh (pose wants two hands), reach (1 = arm straight), v (grip-point speed
  // in the chest frame, blocks/s), w (grip weight after the release logic). window.__qa_k, __qa_t0, __qa_t1.
  const { cast, C, applyPose } = window.__probe, k = window.__qa_k || 'A', o = []; let prev = null;
  for (let t = window.__qa_t0 || 2.7; t <= (window.__qa_t1 || 4.6); t += 1 / 30) { const p = C.pose(k, t); applyPose(cast[k], p);
    const r = cast[k].gripReach, q = cast[k].gripLocal, v = prev && q ? q.distanceTo(prev) / 16 * 30 : 0; prev = q ? q.clone() : null;
    o.push(t.toFixed(2) + ' lh ' + (p.lh || 0).toFixed(2) + ' r ' + (r == null ? '-' : r.toFixed(2)) + ' v ' + v.toFixed(1) + ' w ' + (p.gripW ?? 1).toFixed(2)); }
  return o;
})()

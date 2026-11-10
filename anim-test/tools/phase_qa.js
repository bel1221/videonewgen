(() => {
  // COMPLETE phasing QA (permanent standard: "no phasing or collision issue"). Uses the real body-part boxes of the rig
  // (bone-local, px; limb half-thickness included) - not a coarse capsule:
  //   weaponOwn  - every point along the weapon inside the WIELDER's head/torso/legs (except within 3 px of a holding hand)
  //   weaponOpp  - every point along the weapon inside the OPPONENT's head/torso/arms/legs
  //   armOwn     - arm centre line inside the own torso or head
  //   armOpp     - arm/hand inside the opponent's torso or head
  //   legsCross  - own shins/thighs through each other
  //   bodyBody   - torsos interpenetrating (root gap < 0.55)
  // Per category: count, worst depth (px), per-second bins, first samples. window.__qa_hz (default 30), __qa_t0/__qa_t1.
  const { cast, C, applyPose, THREE } = window.__probe, HZ = window.__qa_hz || 30, T0 = window.__qa_t0 || 0.05, T1 = window.__qa_t1 || C.TOTAL - 0.05;
  const V = () => new THREE.Vector3(), inv = new THREE.Matrix4();
  // boxes: [bone, x0,x1, y0,y1, z0,z1] in the bone's local frame (px). Head pivot at y=24 abs; torso in the spine2 frame (abs y 12..24).
  const parts = ch => { const aw = ch.aw, sp = ch.rest.spine2[1];
    return { head: ['head', -4.2, 4.2, -0.2, 8.2, -4.2, 4.2], torso: ['spine2', -4.2, 4.2, 12 - sp, 24 - sp, -2.3, 2.3],
      rUp: ['rSh', -aw / 2 - 0.2, aw / 2 + 0.2, -4, 2, -2.2, 2.2], rLo: ['rEl', -aw / 2 - 0.2, aw / 2 + 0.2, -6, 0, -2.2, 2.2],
      lUp: ['lSh', -aw / 2 - 0.2, aw / 2 + 0.2, -4, 2, -2.2, 2.2], lLo: ['lEl', -aw / 2 - 0.2, aw / 2 + 0.2, -6, 0, -2.2, 2.2],
      rTh: ['rTh', -2.2, 2.2, -6, 0, -2.2, 2.2], rSn: ['rSn', -2.2, 2.2, -6, 0, -2.2, 2.2], lTh: ['lTh', -2.2, 2.2, -6, 0, -2.2, 2.2], lSn: ['lSn', -2.2, 2.2, -6, 0, -2.2, 2.2] }; };
  const inside = (ch, box, pw) => { const [bn, x0, x1, y0, y1, z0, z1] = box; inv.copy(ch.bones[bn].matrixWorld).invert(); const q = pw.clone().applyMatrix4(inv);
    const d = Math.min(q.x - x0, x1 - q.x, q.y - y0, y1 - q.y, q.z - z0, z1 - q.z); return d > 0 ? d : 0; };
  const wpnRange = ch => { const bb = new THREE.Box3(); ch.weapon.children.forEach(m => { m.geometry.computeBoundingBox(); bb.union(m.geometry.boundingBox); }); return [bb.min.y + 0.5, bb.max.y - 0.5]; };
  const R = { A: {}, B: {} }, push = (k, cat, t, extra) => { (R[k][cat] = R[k][cat] || []).push([+t.toFixed(2), ...extra]); };
  const PA = parts(cast.A), PB = parts(cast.B), rg = { A: wpnRange(cast.A), B: wpnRange(cast.B) };
  for (let t = T0; t <= T1 + 1e-6; t += 1 / HZ) {
    for (const k of ['A', 'B']) { applyPose(cast[k], C.pose(k, t)); cast[k].root.updateMatrixWorld(true); }
    for (const k of ['A', 'B']) {
      const me = cast[k], op = cast[k === 'A' ? 'B' : 'A'], PM = k === 'A' ? PA : PB, PO = k === 'A' ? PB : PA;
      // weapon samples (weapon-local px along its axis), excluding the grip and the two-hand point for the OWN body test
      if (me.weapon) { const [a0, a1] = rg[k]; let wOwn = 0, wOpp = 0, wOwnP = '', wOppP = '';
        for (let a = a0; a <= a1; a += 1.5) { const pw = me.weapon.localToWorld(V().set(0, a, 0));
          const nearHand = Math.abs(a) < 3 || (me.lh != null && Math.abs(a - me.lh) < 3);
          if (!nearHand) for (const pn of ['head', 'torso', 'rTh', 'rSn', 'lTh', 'lSn']) { const d = inside(me, PM[pn], pw); if (d > wOwn) { wOwn = d; wOwnP = pn; } }
          for (const pn in PO) { const d = inside(op, PO[pn], pw); if (d > wOpp) { wOpp = d; wOppP = pn; } } }
        if (wOwn > 0.4) push(k, 'weaponOwn', t, [wOwnP, +wOwn.toFixed(1)]); if (wOpp > 0.4) push(k, 'weaponOpp', t, [wOppP, +wOpp.toFixed(1)]); }
      // arms: centre line vs own torso/head, and vs the opponent's torso/head
      for (const sd of ['r', 'l']) { const sh = me.bones[sd + 'Sh'].getWorldPosition(V()), el = me.bones[sd + 'El'].getWorldPosition(V()), hd = me.bones[sd + 'Hand'].getWorldPosition(V());
        let aOwn = 0, aOpp = 0;
        for (const [p0, p1, u0] of [[sh, el, 0.4], [el, hd, 0]]) for (let u = u0; u <= 1.001; u += 0.2) { const pw = p0.clone().lerp(p1, u);
          aOwn = Math.max(aOwn, inside(me, PM.torso, pw) - 1.6, inside(me, PM.head, pw) - 1.6); aOpp = Math.max(aOpp, inside(op, PO.torso, pw) - 1.6, inside(op, PO.head, pw) - 1.6); }
        if (aOwn > 0.3) push(k, 'armOwn', t, [sd, +aOwn.toFixed(1)]); if (aOpp > 0.3) push(k, 'armOpp', t, [sd, +aOpp.toFixed(1)]); }
      // legs through each other: sample the right shin/thigh centre lines inside the left leg boxes (and vice versa)
      { let dl = 0; for (const [a, b2] of [['rTh', 'lTh'], ['rSn', 'lSn'], ['rTh', 'lSn'], ['rSn', 'lTh']]) for (let y = -5.5; y <= -0.5; y += 1) {
          const pw = me.bones[a].localToWorld(V().set(0, y, 0)); dl = Math.max(dl, inside(me, PM[b2], pw) - 1.8); }
        if (dl > 0.3) push(k, 'legsCross', t, [+dl.toFixed(1)]); }
    }
    const pa = C.pose('A', t).pos, pb = C.pose('B', t).pos, g = Math.hypot(pa[0] - pb[0], pa[2] - pb[2]); if (g < 0.55) push('A', 'bodyBody', t, [+g.toFixed(2)]);
  }
  const out = {};
  for (const k of ['A', 'B']) { out[k] = {}; for (const c in R[k]) { const a = R[k][c], bins = {}; for (const x of a) { const s = Math.floor(x[0]); bins[s] = (bins[s] || 0) + 1; }
    out[k][c] = { n: a.length, worst: Math.max(...a.map(x => x[x.length - 1])), bins, first: a.slice(0, 40) }; } }
  return out;
})()

(window.__jt = [5.4, 22.7], window.__jz = [9.0, 9.05], (() => {
  // Sword-tip path of both fighters, 60 Hz, over window.__jt = [t0, t1]: where does the blade jump or reverse (jitter), and what moves?
  // Per fighter: reversals = count of frames where the tip velocity turns by more than 100 degrees at over 5 blocks/s on both sides;
  // worst = the 14 fastest frames with: tip speed (blocks/s), hand speed, blade direction change (deg per 1/60 s), root yaw, pose bd elevation,
  // rArm x, wrist, roll; plus tip / hand height at 30 Hz.
  const { cast, C, applyPose, THREE, floorAt } = window.__probe, [t0, t1] = window.__jt || [5.4, 7.3], HZ = 60, out = {};
  for (const k of ['A', 'B']) { const ch = cast[k], fr = [];
    for (let t = t0; t <= t1 + 1e-6; t += 1 / HZ) { const p = C.pose(k, t); applyPose(ch, p); ch.root.updateMatrixWorld(true);
      const tip = ch.weapon.localToWorld(new THREE.Vector3(0, ch.tip || 25, 0)), g = ch.weapon.localToWorld(new THREE.Vector3(0, 0, 0)), hand = ch.bones.rHand.getWorldPosition(new THREE.Vector3());
      fr.push({ t, tip, hand, dir: tip.clone().sub(g).normalize(), yaw: p.yaw, bdEl: p.bd ? Math.asin(Math.max(-1, Math.min(1, p.bd[1] / (Math.hypot(...p.bd) || 1)))) * 180 / Math.PI : null, ax: p.rArm[0], az: p.rArm[2], el: p.rElbow[0], wrist: p.wrist, roll: p.roll, chy: p.chest[1] }); }
    const fl = floorAt(fr[0].tip.x, fr[0].tip.z), rows = []; let rev = 0;
    for (let i = 1; i < fr.length; i++) { const a = fr[i], b = fr[i - 1]; const r1 = v => +v.toFixed(1);
      rows.push({ t: +a.t.toFixed(3), tipV: r1(a.tip.distanceTo(b.tip) * HZ), handV: r1(a.hand.distanceTo(b.hand) * HZ), dDir: r1(a.dir.angleTo(b.dir) * 180 / Math.PI), dYaw: r1(a.yaw - b.yaw), dBdEl: r1(a.bdEl - b.bdEl), dAx: r1(a.ax - b.ax), dAz: r1(a.az - b.az), dEl: r1(a.el - b.el), dWrist: r1(a.wrist - b.wrist), dRoll: r1(a.roll - b.roll), dChY: r1(a.chy - b.chy) });
      if (i > 1) { const u = a.tip.clone().sub(b.tip), w = b.tip.clone().sub(fr[i - 2].tip); if (u.length() * HZ > 5 && w.length() * HZ > 5 && u.angleTo(w) > 100 * Math.PI / 180) rev++; } }
    const zw = window.__jz || [6.25, 6.5], deg = v => Math.round(v * 180 / Math.PI);
    out[k] = { corr: C.CORR[k].filter(e => e.t >= t0 - 0.5 && e.t <= t1 + 0.5).map(e => [+e.t.toFixed(2), 'ax', e.ax, 'az', e.az, 'el', e.el, 'wr', e.wr, 'ba', e.ba, 'ch', e.ch, 'fw', +e.fw.toFixed(2)].join(' ')),
      zoom: fr.filter(f => f.t >= zw[0] - 1e-6 && f.t <= zw[1] + 1e-6).map(f => [f.t.toFixed(3), 'dirEl', deg(Math.asin(f.dir.y)), 'dirAz', deg(Math.atan2(f.dir.x, f.dir.z)), 'bdEl', Math.round(f.bdEl), 'ax', Math.round(f.ax), 'wrist', Math.round(f.wrist), 'tipY', (f.tip.y - fl).toFixed(2)].join(' ')),
      reversals: rev, maxTipV: Math.max(...rows.map(r => r.tipV)), worst: rows.slice().sort((x, y) => y.tipV - x.tipV).slice(0, 14).sort((x, y) => x.t - y.t),
      tipY: fr.filter((_, i) => i % 2 === 0).map(f => +(f.tip.y - fl).toFixed(2)), handY: fr.filter((_, i) => i % 2 === 0).map(f => +(f.hand.y - fl).toFixed(2)) }; }
  return out;
})())

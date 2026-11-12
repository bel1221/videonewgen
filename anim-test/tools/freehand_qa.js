(() => {
  // HANDS QA (user, 2026-11-12): "2handed weapons attacks are fixed to using 2 hand grip", "1 hand always raising up ... stays raised up for
  // too long", "make hand have more free motion and flows smoothly with each attack". Per fighter of the probed duel, sampled at 30 Hz:
  //   twoHandedPct   - share of the time both hands are on the weapon (pose lh x grip weight > 0.5)
  //   strikes2H      - strikes (events().swings) made with both hands on the weapon / all strikes
  //   fistMissPx     - while two-handed: distance from the second hand to its point on the shaft (mean, max). 0 = really holding it
  //   releases       - times the grip was forced off (out of reach)
  //   FREE hand (the one holding nothing; window.__qa_off = { A: 'l', B: 'l' } to override, the bow's free hand is 'r'):
  //   raisedPct      - share of its free time the hand is up at chest height or higher (less than 4 px below its shoulder)
  //   longestRaised  - longest unbroken stretch raised (seconds)
  //   meanSpeed      - how much it moves, px per frame in the chest frame (a parked hand reads near 0)
  //   jerks          - direction reversals over 1.5 px in both frames (spasms)
  const { cast, C, applyPose, THREE } = window.__probe, T0 = 3.8, T1 = Math.min(C.TOTAL, window.__qa_t1 || 30.4), HZ = 30, ev = C.events(), out = {};
  for (const k of ['A', 'B']) { const ch = cast[k], b = ch.bones, bow = !!ch.bow, off = (window.__qa_off || {})[k] || (bow ? 'r' : 'l');
    let n = 0, two = 0, miss = 0, missMax = 0, nm = 0, rel = 0, prevTwo = false, free = 0, raised = 0, run = 0, longest = 0, sp = 0, jerks = 0; const hist = [], twoAt = [];
    for (let t = T0; t <= T1; t += 1 / HZ) { const p = C.pose(k, t); applyPose(ch, p); ch.root.updateMatrixWorld(true); n++;
      const w = bow ? (p.rh || 0) : (p.lh || 0) * (p.gripW ?? 1), is2 = !bow && ch.lh != null && w > 0.5; twoAt.push([t, is2]);
      if (is2) { two++; const tg = ch.weapon.localToWorld(new THREE.Vector3(0, ch.lh + (p.lhAt || 0), 0)), d = b.lHand.getWorldPosition(new THREE.Vector3()).distanceTo(tg) * 16; miss += d; missMax = Math.max(missMax, d); nm++; }
      if (prevTwo && !is2 && (p.lh || 0) > 0.5) rel++; prevTwo = is2;
      const held = off === 'l' ? w > 0.5 : (p.rh || 0) > 0.5;
      if (held) { run = 0; hist.length = 0; continue; }
      free++; const hd = b[off + 'Hand'].getWorldPosition(new THREE.Vector3()), sh = b[off + 'Sh'].getWorldPosition(new THREE.Vector3()), up = (hd.y - sh.y) * 16 > -4;
      if (up) { raised++; run += 1 / HZ; longest = Math.max(longest, run); } else run = 0;
      const q = b.chest2.worldToLocal(hd.clone()); hist.push(q);
      if (hist.length >= 2) sp += q.distanceTo(hist[hist.length - 2]);
      if (hist.length >= 3) { const a = hist[hist.length - 2].clone().sub(hist[hist.length - 3]), c = q.clone().sub(hist[hist.length - 2]); if (a.length() > 1.5 && c.length() > 1.5 && a.dot(c) / (a.length() * c.length()) < -0.3) jerks++; } }
    const st = ev.swings.filter(s => s[1] === k && s[0] >= T0 && s[0] <= T1).map(s => s[0]), s2 = st.filter(t => { const e = twoAt[Math.round((t - T0) * HZ)]; return e && e[1]; }).length;
    out[k] = { weapon: ch.wname || '', twoHandedWeapon: !!ch.th, twoHandedPct: Math.round(100 * two / n), strikes2H: s2 + '/' + st.length, fistMissPx: nm ? [+(miss / nm).toFixed(1), +missMax.toFixed(1)] : null, releases: rel,
      freeHand: off, freePct: Math.round(100 * free / n), raisedPct: free ? Math.round(100 * raised / free) : 0, longestRaised: +longest.toFixed(2), meanSpeed: free ? +(sp / free).toFixed(2) : 0, jerks }; }
  return out;
})()

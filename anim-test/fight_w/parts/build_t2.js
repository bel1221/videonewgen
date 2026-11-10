function buildAll() {
  // TEST 2 "GREATSWORD VS SPEAR" (10 s): A = Goldreaper (two-handed) vs B = Boltspear. Tests two-handed grips (arm clearance),
  // high blocks in front of the forehead, the jump plunge, straight idle legs, the spear's charge run, knockback and a show-off.
  CANDS.A = ['gsParryH', 'gsParryR', 'gsParryL', 'gsParryLowR', 'gsParryLowL']; CANDS.B = ['spBlock', 'spBlockL', 'spBlockV', 'spBlockH', 'spGuard'];
  const tipFloor = (c, tt) => (cast, blade) => { const tip = blade(c, tt, [24])[0]; return [tip.x, W.floorAt(tip.x, tip.z) + 0.05, tip.z]; };
  // ---- 0-1.05 idle: A lowers the greatsword from his shoulder, B holds the spear upright
  at('A', 0, -2.4, 0); at('B', 0, 4.4, 0); at('B', 1.05, 4.4, 0);
  K('A', 0, L.gsRest); K('A', 0.45, L.gsRest); K('A', 0.95, L.gsIdle, 'o'); K('A', 1.3, L.gsGuard, 'io'); K('B', 0, L.spIdle); K('B', 0.8, L.spIdle); K('B', 1.05, L.spCharge, 'io');
  // ---- 1.05-2.8 the spear charges: thrust, jab, jab (A gives ground), sweep (A hops)
  RUN.B.push([1.08, 1.55, 'charge']); at('B', 1.08, 4.4, 0); at('B', 1.6, -0.35, 0, 'lin'); at('A', 1.6, -2.4, 0);
  K('B', 1.5, L.spCharge, 'lin'); K('B', 1.6, L.spWind, 'o'); K('B', 1.78, L.spThrust, 'i'); blk('A', 1.62, 1.78, 'gsParryR'); clash(1.78, true);
  DRIFT.push([1.85, 2.5, 'pushB', 1.5]);
  hit('B', 'A', 2.02, 'spWind', 'spJab', 'gsParryL', false, 0.12); hit('B', 'A', 2.26, 'spWind', 'spJab', 'gsParryL', false, 0.12);
  K('B', 2.42, L.spSweepW, 'o'); K('B', 2.62, L.spSweep, 'i'); K('B', 2.85, L.spGuard, 'io');
  K('A', 2.42, L.gsCrouch, 'o'); K('A', 2.52, L.gsHop, 'o'); K('A', 2.76, L.gsLand, 'o'); K('A', 2.95, L.gsGuard, 'io');
  // ---- 3.0-3.9 jump plunge: A leaps and drives the greatsword into the sand where B stood; B side-steps into a slide
  { const a = evalPosT('A', 2.9), b = evalPosT('B', 2.9), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    K('A', 3.02, L.gsCrouch, 'o'); K('A', 3.14, L.takeoff, 'o', { y: 0.9, lh: 1 }); K('A', 3.32, L.gsPlungeW, 'o', { y: 1.4 }); K('A', 3.58, L.gsPlunge, 'i'); K('A', 3.82, L.gsPlunge, 'lin', { y: -0.4 }); K('A', 4.05, L.gsGuard, 'io');
    at('A', 3.14, ...a); at('A', 3.58, b[0] - ux * 0.5, b[1] - uz * 0.5, 'o'); clash(3.58, true, 'slam', { at: tipFloor('A', 3.6) });
    K('B', 3.3, L.dodge, 'o'); K('B', 3.42, L.skid, 'o'); K('B', 3.7, L.skid, 'lin'); K('B', 3.88, L.spGuard, 'io');
    at('B', 3.28, ...b); at('B', 3.72, b[0] + px * 1.4 + ux * 0.3, b[1] + pz * 1.4 + uz * 0.3, 'o'); slide('B', 3.38, 3.72); }
  // ---- 4.0-5.1 the spear counters overhead; A blocks it high in front of his forehead (big); A shoves B away
  hit('B', 'A', 4.3, 'spOverW', 'spOver', 'gsParryH', true, 0.22, {}, { y: -0.2 });
  K('A', 4.5, L.gsThrust, 'o', { y: -0.25 }); K('A', 4.72, L.gsGuard, 'io'); clash(4.5, false, 'kick', { at: () => { const q = pose('B', 4.52).pos; return [q[0], q[1] + 1.2, q[2]]; } });
  K('B', 4.52, L.hitBack, 'o'); K('B', 4.64, L.skid, 'o'); K('B', 4.94, L.skid, 'lin'); K('B', 5.1, L.spGuard, 'io');
  { const a = evalPosT('A', 4.5), b = evalPosT('B', 4.5), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz);
    at('B', 4.5, ...b); at('B', 4.98, a[0] + dx / d * (d + 1.0), a[1] + dz / d * (d + 1.0), 'o'); slide('B', 4.6, 4.98); at('A', 4.5, ...a); at('A', 5.2, ...a); }
  // ---- 5.2-7.4 heavy two-handed combo pressing B back; the last cut knocks him into a slide
  DRIFT.push([5.25, 7.0, 'pushA', 1.5]);
  hit('A', 'B', 5.6, 'gsWindR', 'gsSlashR', 'spBlock', false, 0.24);
  K('A', 5.82, L.gsWindL, 'o'); K('A', 6.0, L.gsSlashL, 'i'); K('B', 5.84, L.duck, 'o'); K('B', 6.04, L.duck, 'lin'); K('B', 6.18, L.spGuard, 'io');
  hit('A', 'B', 6.42, 'gsWindT', 'gsThrust', 'spBlockL', false, 0.2); hit('A', 'B', 6.86, 'gsWindO', 'gsSlashO', 'spBlockH', true, 0.26, {}, { y: -0.25 });
  K('B', 6.92, L.hitBack, 'o'); K('B', 7.04, L.skid, 'o'); K('B', 7.34, L.skid, 'lin'); K('B', 7.5, L.spGuard, 'io');
  { const a = evalPosT('A', 6.86), b = evalPosT('B', 6.86), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz);
    at('B', 6.86, ...b); at('B', 7.38, a[0] + dx / d * (d + 1.3), a[1] + dz / d * (d + 1.3), 'o'); slide('B', 6.98, 7.38); at('A', 6.86, ...a);
    // ---- 7.6-10 show-off: B spins the spear; A shoulders the greatsword and steps forward
    at('B', 10, a[0] + dx / d * (d + 1.3), a[1] + dz / d * (d + 1.3)); WALK.A.push([8.8, 9.8]); at('A', 8.75, ...a); at('A', 9.85, a[0] + dx / d * 0.9, a[1] + dz / d * 0.9, 'lin'); at('A', 10, a[0] + dx / d * 0.9, a[1] + dz / d * 0.9); }
  K('B', 7.75, L.twirlF, 'io'); K('B', 8.55, L.twirlF, 'lin'); tw('B', 7.8, 8.55, 2); K('B', 8.85, L.spReady, 'o'); K('B', 10, L.spReady);
  K('A', 7.6, L.gsGuard); K('A', 8.3, L.gsRest, 'io'); K('A', 10, L.gsRest);
  BR.A.push([7.4, 10]); BR.B.push([8.6, 10]);
  export_cross.mid = [0, 0]; export_cross.u = [1, 0]; export_cross.p = [0, 1];
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}

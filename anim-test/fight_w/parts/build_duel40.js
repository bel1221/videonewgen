function buildAll() {
  // DUEL 40: A = Boltspear (spear), B = Goldreaper (two-handed greatsword). Built to notes/fight-animation-standard.md:
  // every exchange travels, attacks have wind-up / strike / follow-through / recovery, hits get reactions, idle->move and
  // move->idle transitions are eased, twirls only in the show-off scene, slow motion on the slide and the finish.
  CANDS.A = ['spBlock', 'spBlockL', 'spBlockV', 'spBlockH', 'spGuard'];
  CANDS.B = ['gsParryH', 'gsParryR', 'gsParryL', 'gsParryLowR', 'gsParryLowL'];
  SLOWMO.push([21.6, 22.25, 0.3], [25.55, 25.95, 0.3]);
  const SP = { ...SW, lh: 0 };                                          // spear trailing low while sprinting
  const chest = (c, t) => () => { const q = pose(c, t).pos; return [q[0], q[1] + 1.2, q[2]]; };
  const tipFloor = (c, tt) => (cast, blade) => { const tip = blade(c, tt, [24])[0]; return [tip.x, W.floorAt(tip.x, tip.z) + 0.05, tip.z]; };
  // ================= S1 0-2.6  arena idle: B lowers the greatsword from his shoulder to guard; A walks in =================
  at('A', 0, -5.0, 0); at('A', 1.0, -5.0, 0); WALK.A.push([1.0, 2.45]); at('A', 2.5, -3.6, 0, 'lin');
  at('B', 0, 5.0, 0); at('B', 2.6, 5.0, 0);
  K('A', 0, L.spIdle); K('A', 2.2, L.spIdle); K('B', 0, L.gsRest); K('B', 1.1, L.gsRest); K('B', 1.75, L.gsIdle, 'o'); K('B', 2.6, L.gsIdle); K('B', 3.02, L.gsGuard, 'io');
  // (no heavy breathing at the start - they have not fought yet)
  // ================= S2 2.55-4.8  the spear lunges first: sprint, lunge thrust (blocked), jab, jab, sweep (hopped), overhead (side-stepped)
  RUN.A.push([2.55, 3.15, 'charge']); at('A', 2.55, -3.6, 0); at('A', 3.15, 2.7, 0, 'lin'); at('A', 3.35, 3.15, 0, 'o');
  K('A', 2.6, L.spCharge, 'io'); K('A', 2.95, L.spCharge, 'lin'); K('A', 3.08, L.spWind, 'o'); K('A', 3.35, L.spThrust, 'i');
  blk('B', 3.2, 3.35, 'gsParryR'); clash(3.35, true);
  DRIFT.push([3.4, 4.85, 'pushA', 1.6]);
  hit('A', 'B', 3.62, 'spWind', 'spJab', 'gsParryL', false, 0.12); hit('A', 'B', 3.86, 'spWind', 'spJab', 'gsParryR', false, 0.12);
  K('A', 4.0, L.spSweepW, 'o'); K('A', 4.22, L.spSweep, 'i');
  K('B', 3.95, L.gsCrouch, 'o'); K('B', 4.09, L.gsHop, 'o', { y: 0.55 }); K('B', 4.3, L.gsLand, 'o'); K('B', 4.42, L.gsGuard, 'io');
  at('B', 4.0, 5.0, 0); at('B', 4.3, 5.45, 0, 'o');
  K('A', 4.42, L.spOverW, 'o'); K('A', 4.66, L.spOver, 'i'); K('A', 4.85, L.spGuard, 'io');
  K('B', 4.5, L.gsGuard); K('B', 4.58, L.dodge, 'o', { lh: 1 }); at('B', 4.5, 5.45, 0); at('B', 4.78, 5.3, 0.95, 'o');
  // ================= S3 4.8-7.4  the greatsword counters: heavy cut knocks A back, overhead, thrust, cross cut -> A slides =====
  hit('B', 'A', 5.05, 'gsWindR', 'gsSlashR', 'spBlock', true, 0.24);
  K('A', 5.1, L.hitBack, 'o'); K('A', 5.22, L.skid, 'o'); K('A', 5.52, L.skid, 'lin'); K('A', 5.7, L.spGuard, 'io');
  { const a = evalPosT('A', 5.05), b = evalPosT('B', 5.05), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz);
    at('A', 5.05, ...a); at('A', 5.55, b[0] + dx / d * (d + 1.3), b[1] + dz / d * (d + 1.3), 'o'); slide('A', 5.18, 5.55);
    at('B', 5.05, ...b); at('B', 5.6, b[0] + dx / d * 1.1, b[1] + dz / d * 1.1, 'io'); }
  DRIFT.push([5.6, 7.0, 'pushB', 1.6]);
  hit('B', 'A', 5.88, 'gsWindO', 'gsSlashO', 'spBlockH', false, 0.24, {}, { y: -0.3 });
  hit('B', 'A', 6.28, 'gsWindT', 'gsThrust', 'spBlockL', false, 0.18); K('A', 6.4, L.dodge, 'o');
  hit('B', 'A', 6.68, 'gsWindR', 'gsSlashR', 'spBlock', false, 0.22);
  K('A', 6.74, L.hitBack, 'o', { y: -0.05 }); K('A', 6.85, L.skid, 'o'); K('A', 7.12, L.skid, 'lin'); K('A', 7.3, L.spReady, 'io'); K('B', 6.9, L.gsGuard, 'io');
  { const a = evalPosT('A', 6.68), b = evalPosT('B', 6.68), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz);
    at('A', 6.68, ...a); at('A', 7.15, a[0] + dx / d * 1.2, a[1] + dz / d * 1.2, 'o'); slide('A', 6.82, 7.15); at('B', 6.68, ...b); }
  // ================= S4 7.4-11.3  both back off for a breather, then circle at a walk =================
  { const a = evalPosT('A', 7.15), b = evalPosT('B', 6.68), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const P2 = (r, th) => [[mx - Math.cos(th) * r, mz - Math.sin(th) * r], [mx + Math.cos(th) * r, mz + Math.sin(th) * r]];
    WALK.A.push([7.45, 8.9]); WALK.B.push([7.3, 8.9]); const [pa1, pb1] = P2(2.6, ang);
    at('A', 7.45, ...a); at('A', 8.95, ...pa1, 'io'); at('B', 7.3, ...b); at('B', 8.95, ...pb1, 'io');
    WALK.A.push([9.4, 11.1]); WALK.B.push([9.4, 11.1]); const [pa2, pb2] = P2(2.6, ang + 0.75);
    at('A', 9.35, ...pa1); at('B', 9.35, ...pb1); at('A', 11.15, ...pa2, 'io'); at('B', 11.15, ...pb2, 'io'); at('A', 14.6, ...pa2); at('B', 14.6, ...pb2);
    BR.A.push([7.3, 11.4]); BR.B.push([7.3, 11.4]); }
  K('A', 7.6, L.spReady); K('A', 8.1, L.spIdle, 'io'); K('A', 11.2, L.spIdle);
  K('B', 7.4, L.gsGuard, 'io', { y: -0.06 }); K('B', 8.3, L.gsRest, 'io'); K('B', 10.2, L.gsRest); K('B', 10.85, L.gsGuard, 'o'); K('B', 11.2, L.gsGuard);
  // ================= S5 11.3-14.6  show-off: A spins the spear, B windmills the greatsword and levels it at A =================
  K('A', 11.35, L.twirlF, 'io'); K('A', 12.2, L.twirlF, 'lin'); tw('A', 11.4, 12.2, 2); K('A', 12.5, L.spReady, 'o');
  K('B', 12.6, L.twirlS, 'io', { lh: 0 }); K('B', 13.55, L.twirlS, 'lin', { lh: 0 }); tw('B', 12.65, 13.55, 2); K('B', 13.85, L.gsPoint, 'o'); K('B', 14.2, L.gsPoint, 'lin'); K('B', 14.5, L.gsGuard, 'io');
  K('A', 14.3, L.spReady); BR.A.push([12.5, 14.5]);
  // ================= S6 14.6-21.0  the multi combo =================
  { const a = evalPosT('A', 14.6), b = evalPosT('B', 14.6), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    RUN.A.push([14.62, 15.2, 'charge']); RUN.B.push([14.68, 15.2]);
    at('A', 14.62, ...a); at('A', 15.25, m[0] - ux * 0.95, m[1] - uz * 0.95, 'lin'); at('B', 14.68, ...b); at('B', 15.25, m[0] + ux * 0.95, m[1] + uz * 0.95, 'lin');
    K('A', 14.62, L.spCharge, 'io'); K('A', 15.05, L.spCharge, 'lin'); K('B', 14.68, L.sprintGo, 'io', { lh: 1 }); K('B', 15.05, L.sprintGo, 'lin', { lh: 1 });
    K('A', 15.22, L.spWind, 'o'); K('A', 15.45, L.spThrust, 'i'); K('B', 15.2, L.gsWindR, 'o'); K('B', 15.45, L.gsSlashR, 'i'); clash(15.45, true);
    at('A', 15.45, m[0] - ux * 0.95, m[1] - uz * 0.95); at('B', 15.45, m[0] + ux * 0.95, m[1] + uz * 0.95);
    at('A', 15.8, m[0] - ux * 1.25, m[1] - uz * 1.25, 'o'); at('B', 15.8, m[0] + ux * 0.62, m[1] + uz * 0.62, 'o'); slide('A', 15.5, 15.8); slide('B', 15.5, 15.8);
    K('A', 15.55, L.skid, 'o'); K('A', 15.82, L.spGuard, 'io'); K('B', 15.55, L.skid, 'o'); K('B', 15.82, L.gsGuard, 'io'); }
  DRIFT.push([15.85, 17.45, 'strafeL', 1.9]);
  { const keep = CANDS.B; CANDS.B = ['gsParryL', 'gsParryLowL'];   // both jabs parried on the same side (no blade sweep across the face between them)
    hit('A', 'B', 16.02, 'spWind', 'spJab', 'gsParryL', false, 0.12); hit('A', 'B', 16.25, 'spWind', 'spJab', 'gsParryL', false, 0.12); CANDS.B = keep; }
  K('A', 16.36, L.spSweepW, 'o'); K('A', 16.58, L.spSweep, 'i'); K('A', 16.8, L.spGuard, 'io');
  K('B', 16.33, L.gsCrouch, 'o'); K('B', 16.47, L.gsHop, 'o'); K('B', 16.7, L.gsLand, 'o');
  hit('B', 'A', 17.05, 'gsWindO', 'gsSlashO', 'spBlockH', false, 0.22, {}, { y: -0.3 });
  K('B', 17.22, L.gsWindR, 'o'); K('B', 17.42, L.gsSlashR, 'i'); K('A', 17.24, L.duck, 'o'); K('A', 17.45, L.duck, 'lin'); K('A', 17.6, L.spGuard, 'io');   // ducked
  // jump plunge: B leaps and drives the greatsword down where A stood; A rolls aside, the blade bursts the sand
  { const a = evalPosT('A', 17.6), b = evalPosT('B', 17.6), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    K('B', 17.62, L.crouch, 'o', { y: -0.35, lh: 1 }); K('B', 17.74, L.takeoff, 'o', { y: 0.9, lh: 1 }); K('B', 17.96, L.gsPlungeW, 'o', { y: 1.5 }); K('B', 18.25, L.gsPlunge, 'i'); K('B', 18.5, L.gsPlunge, 'lin', { y: -0.4 }); K('B', 18.68, L.gsGuard, 'io');
    at('B', 17.74, ...b); at('B', 18.25, a[0] - ux * 0.55, a[1] - uz * 0.55, 'o');
    clash(18.25, true, 'slam', { at: tipFloor('B', 18.28) });
    K('A', 17.9, L.dodge, 'o'); K('A', 18.05, L.skid, 'o'); K('A', 18.35, L.skid, 'lin'); K('A', 18.5, L.spGuard, 'io');
    at('A', 17.9, ...a); at('A', 18.35, a[0] + px * 1.45 + ux * 0.4, a[1] + pz * 1.45 + uz * 0.4, 'o'); slide('A', 18.0, 18.35); }
  hit('A', 'B', 18.88, 'spWind', 'spThrust', 'gsParryL', false, 0.16);
  K('A', 19.0, L.spSweepW, 'o', { yawOff: -160 }); K('A', 19.2, L.spSweep, 'i', { yawOff: -360 }); D.A = { yawOff: -360 }; K('A', 19.4, L.spGuard, 'io');
  K('B', 18.96, L.gsCrouch, 'o'); K('B', 19.1, L.gsHop, 'o', { y: 0.65 }); K('B', 19.34, L.gsLand, 'o');
  DRIFT.push([19.35, 20.45, 'strafeR', 1.7]);
  hit('B', 'A', BIND_T, 'gsWindO', 'gsSlashO', 'spBlockH', true, 0.25, {}, { y: -0.32 });
  for (let t = BIND_T + 0.12; t < BIND_END; t += 0.12) { const s = Math.sin(t * 40) * 0.5 + 0.5;
    K('B', t, L.gsBind, 'io', { chest: [22 + 8 * s, 10, 0], y: -0.3 - 0.06 * s }); K('A', t, L.spBlockH, 'io', { y: -0.34 - 0.05 * (1 - s), chest: [-8 - 6 * s, 0, 0] }); }
  K('B', 20.5, L.gsThrust, 'o', { rArm: [-80, 0, 0], y: -0.3 }); K('B', 20.75, L.gsGuard, 'io'); clash(20.5, false, 'kick', { at: chest('A', 20.52) });
  K('A', 20.52, L.hitBack, 'o'); K('A', 20.64, L.skid, 'o'); K('A', 20.95, L.skid, 'lin'); K('A', 21.1, L.spGuard, 'io');
  { const a = evalPosT('A', 20.5), b = evalPosT('B', 20.5), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz);
    at('A', 20.5, ...a); at('A', 20.98, b[0] + dx / d * (d + 1.5), b[1] + dz / d * (d + 1.5), 'o'); slide('A', 20.6, 20.98); at('B', 20.5, ...b); at('B', 21.1, ...b); }
  // ================= S7 21.1-24.6  SLOW MOTION: A's charging thrust, B slides low ACROSS it and comes up behind him ============
  { const a = evalPosT('A', 20.98), b = evalPosT('B', 21.1), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    RUN.A.push([21.15, 21.62, 'charge']); at('A', 21.15, ...a); at('A', 21.7, b[0] - ux * 1.55, b[1] - uz * 1.55, 'lin'); at('A', 21.95, b[0] - ux * 1.2, b[1] - uz * 1.2, 'o');
    K('A', 21.15, L.spCharge, 'io'); K('A', 21.55, L.spCharge, 'lin'); K('A', 21.66, L.spWind, 'o'); K('A', 21.9, L.spThrust, 'i'); K('A', 22.15, L.spThrust, 'lin', { chest: [14, 6, 0] });
    at('B', 21.55, ...b); at('B', 21.9, b[0] - ux * 0.9 + px * 1.12, b[1] - uz * 0.9 + pz * 1.12, 'lin'); at('B', 22.28, b[0] - ux * 2.75 + px * 0.35, b[1] - uz * 2.75 + pz * 0.35, 'o');
    slide('B', 21.62, 22.28); K('B', 21.55, L.gsGuard); K('B', 21.66, L.slideLow, 'o'); K('B', 22.15, L.slideLow, 'lin'); K('B', 22.38, L.gsGuard, 'io');
    // B behind A: spin cut at his back; A turns and blocks just in time, stumbles
    K('B', 22.45, L.gsWindR, 'o'); K('B', 22.7, L.gsSlashR, 'i');
    K('A', 22.3, L.spGuard, 'io'); blk('A', 22.55, 22.7, 'spBlock'); clash(22.7, true);
    K('A', 22.76, L.hitBack, 'o'); K('A', 22.86, L.skid, 'o'); K('A', 23.12, L.skid, 'lin'); K('A', 23.25, L.spGuard, 'io');
    const b2 = [b[0] - ux * 2.75 + px * 0.35, b[1] - uz * 2.75 + pz * 0.35], a2 = [b[0] - ux * 1.2, b[1] - uz * 1.2];
    at('A', 22.7, ...a2); at('A', 23.15, a2[0] + ux * 0.9, a2[1] + uz * 0.9, 'o'); slide('A', 22.84, 23.15); at('B', 22.7, ...b2); }
  DRIFT.push([23.25, 24.55, 'strafeL', 1.8]);
  hit('A', 'B', 23.45, 'spWind', 'spJab', 'gsParryL', false, 0.12); hit('B', 'A', 23.8, 'gsWindR', 'gsSlashR', 'spBlock', false, 0.22);
  hit('B', 'A', 24.12, 'gsWindO', 'gsSlashO', 'spBlockH', false, 0.2); hit('A', 'B', 24.48, 'spOverW', 'spOver', 'gsParryH', false, 0.2);
  // ================= S8 24.6-27.6  the finish (slow motion): A's last running lunge; B spins round it and rips upward =========
  { const a = evalPosT('A', 24.48), b = evalPosT('B', 24.48), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    at('A', 24.6, ...a); at('A', 24.95, a[0] - ux * 1.3, a[1] - uz * 1.3, 'o'); K('A', 24.7, L.spGuard, 'io'); at('B', 24.6, ...b);
    RUN.A.push([25.0, 25.42, 'charge']); at('A', 25.0, a[0] - ux * 1.3, a[1] - uz * 1.3); at('A', 25.5, b[0] - ux * 1.4, b[1] - uz * 1.4, 'lin'); at('A', 25.75, b[0] - ux * 1.05, b[1] - uz * 1.05, 'o');
    K('A', 25.0, L.spCharge, 'io'); K('A', 25.36, L.spCharge, 'lin'); K('A', 25.45, L.spWind, 'o'); K('A', 25.62, L.spThrust, 'i'); K('A', FLASH, L.spThrust, 'lin', { chest: [12, 8, 0] });
    K('B', 25.3, L.gsGuard); K('B', 25.5, L.dodge, 'o', { lh: 1, yawOff: -170 }); { const keep = CANDS.B; CANDS.B = ['gsSlashR', 'gsSlashL', 'gsSlashO'];   // the finishing cut: whichever two-handed strike meets the spear
      blk('B', 25.6, FLASH, 'gsSlashR', { yawOff: -300 }, { yawOff: -360, y: 0.05 }); CANDS.B = keep; } D.B = { yawOff: -360 };
    at('B', 25.45, ...b); at('B', FLASH, b[0] + px * 0.75 - ux * 0.15, b[1] + pz * 0.75 - uz * 0.15, 'o');
    clash(FLASH, true, 'cross');
    // A is blown back off his feet and falls; B follows through and settles
    K('A', 25.85, L.hitBack, 'o', { y: 0.35 }); K('A', 26.2, L.hitBack, 'lin', { y: 0.2, tilt: [-30, 0] }); K('A', 26.5, L.hitBack, 'o', { y: 0.12, tilt: [-58, 0] }); K('A', FALL_T, L.lieBack, 'o'); K('A', 37.55, L.lieBack, 'lin', { head: [16, 0, 0] });
    at('A', 25.75, b[0] - ux * 1.05, b[1] - uz * 1.05); at('A', 26.45, b[0] - ux * 3.3, b[1] - uz * 3.3, 'o'); at('A', 37.55, b[0] - ux * 3.4, b[1] - uz * 3.4);
    K('B', 26.15, L.gsGuard, 'io', { y: -0.12 }); K('B', 26.7, L.gsIdle, 'io'); BR.B.push([26.1, 37.5]);
    export_cross.mid = [b[0] - ux * 0.5, b[1] - uz * 0.5]; export_cross.u = [ux, uz]; export_cross.p = [px, pz];
    // ================= S9 27.6-37.55  B shoulders the greatsword and walks out of the arena =================
    const bE = [b[0] + px * 0.75 - ux * 0.15, b[1] + pz * 0.75 - uz * 0.15], out = [bE[0] + ux * 9.5, bE[1] + uz * 9.5];
    // turn smoothly from facing the fallen A to the exit (explicit headings on every key: no auto->fixed snap)
    const yA = Math.atan2(-ux, -uz) * 180 / Math.PI, yOut = near(Math.atan2(ux, uz) * 180 / Math.PI, yA + 120);
    K('B', 27.2, L.gsIdle, 'io', { yawAbs: yA }); K('B', 27.8, L.gsRest, 'io', { yawAbs: yA }); K('B', 28.65, L.gsRest, 'io', { yawAbs: yOut });
    at('B', 28.6, ...bE); WALK.B.push([28.7, 37.3]); at('B', 37.35, ...out, 'lin'); at('B', 37.55, ...out);
    K('B', 37.55, L.gsRest, 'lin', { yawAbs: yOut }); }
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}

function buildAll() {
  // BOLT 30: A = Boltspear vs B = Lancebolt (spear vs spear), 29 s of animation + 1 s of slow motion = 30 s of video.
  // User brief (2026-11-11): open on both faces up close, slowly looking up (split panels); both lunge in and clash; lots of
  // movement - backing off from a swing, being pushed back by a swing, kicked into a slide that is braked by plunging the spear
  // head into the ground; finish: a forward dash, both arms extended, the spear through the enemy's body.
  // Built to notes/fight-animation-standard.md (exchanges travel, wind-up/strike/follow-through/recovery, hit reactions, one twirl).
  CANDS.A = ['spBlock', 'spBlockL', 'spBlockV', 'spBlockH', 'spGuard']; CANDS.B = CANDS.A.slice();
  SLOWMO.push([26.42, 26.42 + 3 / 7, 0.3]);                              // +1.0 s of video on the pierce
  const chest = (c, t) => () => { const q = pose(c, t).pos; return [q[0], q[1] + 1.2, q[2]]; };
  const tipFloor = (c, tt) => (cast, blade) => { const tip = blade(c, tt, [24])[0]; return [tip.x, W.floorAt(tip.x, tip.z) + 0.05, tip.z]; };
  // ---- new poses
  // spear brake: sliding back in a deep crouch, both hands drive the spear head into the sand in front (plant = the weapon may enter the floor)
  L.spBrake = S(L.slideLow, { waist: [30, -8, 0], chest: [16, -6, 0], head: [-24, 10, 0], rArm: [-58, 0, -10], rElbow: [-34, 0, 0], lh: 1, plant: 1, y: -0.52 }); L.spBrake.bd = bdv(-50, 8);
  // the finishing thrust: deep lunge, both arms straight out along the shaft (pierce = the weapon ignores the opponent's body)
  L.spPierce = S(L.spThrust, { rArm: [-92, 0, -2], rElbow: [-2, 0, 0], waist: [16, -4, 0], chest: [8, -2, 0], head: [-14, 6, 0], lh: 1, pierce: 1, y: -0.36 }); L.spPierce.bd = bdv(20, 3);
  // user rule (bolt30 review): the spear is two-handed ONLY for a lunge or stab (wind-up, thrust, charge, pierce) and for the two
  // plunges into the ground (leap plunge, brake). Guards, blocks, sweeps, overheads, hops and reactions are one-handed.
  for (const n of ['spGuard', 'spReady', 'spBlock', 'spBlockL', 'spBlockV', 'spBlockH', 'spSweepW', 'spSweep', 'spOverW', 'spOver', 'gsCrouch', 'gsHop', 'gsLand']) { L[n].lh = 0; delete L[n]._flat; }
  // ---- two-handed spear grip, Minecraft proportions (measured with tools/grip_fit.js / grip_pose_fit.js): arms are 9.5 px and the
  // shoulders 12 px apart, so two hands can only share a shaft that lies ACROSS the chest. A forward-pointing spear can never be
  // held in two hands (reach ratio 1.3-2.1). So lunges and stabs are SIDE-ON: the body turns its left side to the enemy and both
  // arms push the shaft along the shoulder line, left hand ahead of the right (lhAt). Everything else is one-handed.
  const QS2 = new URLSearchParams(globalThis.location ? location.search : ''), YS = +(QS2.get('ys') ?? -50), TS = +(QS2.get('ts') ?? -1);
  L.spThrust1 = S(L.spThrust, { lh: 0 });                                // quick exchange thrust: one hand, front-on (no body turn)
  L.spJabW = S(L.spWind, { lh: 0 });                                     // the old front-on wind-up, for one-handed jabs
  const SIDE = { lh: 1, lhAt: 15, yawOff: YS };
  L.spWind = S(L.spGuard, { ...SIDE, rArm: [-26, 0, 50], rElbow: [-14, 0, 0], waist: [6, TS * 22, 0], chest: [0, TS * 18, 0], head: [-6, -(YS + TS * 40) * 0.9, 0],
    rLeg: [0, 0, -12], rKnee: [14, 0, 0], lLeg: [0, 0, 30], lKnee: [24, 0, 0], y: -0.2 }); L.spWind.bd = bdv(4, 88);
  L.spThrust = S(L.spGuard, { ...SIDE, rArm: [14, 0, 64], rElbow: [-58, 0, 0], waist: [10, TS * 24, 0], chest: [2, TS * 18, 0], head: [-8, -(YS + TS * 42) * 0.9, 0],
    rLeg: [0, 0, -22], rKnee: [6, 0, 0], lLeg: [0, 0, 44], lKnee: [40, 0, 0], y: -0.34 }); L.spThrust.bd = bdv(0, 88);
  L.spPierce = S(L.spThrust, { pierce: 1, waist: [10, TS * 24, +(QS2.get('prz') ?? -18)], y: -0.3 }); L.spPierce.bd = bdv(0, +(QS2.get('paz') ?? 118));   // angled back in so the shaft runs through the centre of the body in front of the left shoulder
  L.spCharge = S(L.spCharge, { lh: 0 });                                 // the run-up carries the spear in one hand
  L.gsPlungeW = S(L.gsPlungeW, { lh: 0 }); L.gsPlunge = S(L.gsPlunge, { lh: 0 }); L.spBrake = S(L.spBrake, { lh: 0 });   // plunges into the ground: one hand (no reachable two-hand grip)
  // ---- movement helpers (positions are taken from the keys already laid down; DRIFT is added to both fighters on top)
  const dist = (c, o, t) => { const a = evalPosT(c, t), b = evalPosT(o, t); return Math.hypot(a[0] - b[0], a[1] - b[1]); };
  const mv = (c, o, t0, t1, gap, e = 'io') => { const a = evalPosT(c, t0), b = evalPosT(o, t1), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz) || 1; at(c, t0, ...a); at(c, t1, b[0] + dx / d * gap, b[1] + dz / d * gap, e); };
  const mvd = (c, o, t0, t1, delta, e = 'o') => mv(c, o, t0, t1, dist(c, o, t0) + delta, e);
  const lat = (c, o, t0, t1, side, e = 'o') => { const a = evalPosT(c, t0), b = evalPosT(o, t0), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz) || 1; at(c, t0, ...a); at(c, t1, a[0] - dz / d * side, a[1] + dx / d * side, e); };
  // pushed back by a blocked heavy hit: stagger, standing slide, recover
  const knock = (c, o, t, far, dur = 0.45, end = L.spGuard) => { K(c, t + 0.05, L.hitBack, 'o'); K(c, t + 0.17, L.skid, 'o'); K(c, t + dur, L.skid, 'lin'); K(c, t + dur + 0.17, end, 'io');
    at(o, t, ...evalPosT(o, t)); mvd(c, o, t, t + dur + 0.03, far); slide(c, t + 0.13, t + dur + 0.03); };

  // ================= S0 0-2.9  split-panel intro: both stand ready, heads down, and slowly look up =================
  at('A', 0, -4.6, 0); at('B', 0, 4.6, 0);
  K('A', 0, L.spIdle, undefined, { head: [30, 0, 0] }); K('A', 0.4, L.spIdle, 'lin', { head: [30, 0, 0] }); K('A', 2.3, L.spIdle, 'io', { head: [-14, 0, 0] }); K('A', 2.78, L.spReady, 'io');
  K('B', 0, L.spIdle, undefined, { head: [32, 0, 0] }); K('B', 0.6, L.spIdle, 'lin', { head: [32, 0, 0] }); K('B', 2.45, L.spIdle, 'io', { head: [-12, 0, 0] }); K('B', 2.8, L.spReady, 'io');
  // ================= S1 2.9-4.0  both lunge in, the spears cross (impact frame), both recoil =================
  for (const [c, s] of [['A', -1], ['B', 1]]) { RUN[c].push([2.9, 3.38, 'charge']); at(c, 2.9, 4.6 * s, 0); at(c, 3.4, 1.2 * s, 0, 'lin'); at(c, 3.55, 1.05 * s, 0, 'o');
    K(c, 2.92, L.spCharge, 'io'); K(c, 3.1, L.spCharge, 'lin'); K(c, 3.36, L.spWind, 'io'); K(c, 3.55, L.spThrust, 'i');
    at(c, 3.6, 1.05 * s, 0); at(c, 3.98, 1.8 * s, 0, 'o'); slide(c, 3.66, 3.98); K(c, 3.68, L.skid, 'o'); K(c, 4.0, L.spGuard, 'io'); }
  clash(3.55, true);
  // ================= S2 4.0-6.4  A presses: lunge, jab, low sweep (B backs off from it), overhead (B is pushed back) =================
  mv('A', 'B', 4.05, 4.3, 2.1); hit('A', 'B', 4.42, 'spJabW', 'spThrust1', 'spBlock', false, 0.16);
  DRIFT.push([4.45, 5.5, 'pushA', 1.6]);
  hit('A', 'B', 4.7, 'spJabW', 'spJab', 'spBlockL', false, 0.12);
  K('A', 4.86, L.spSweepW, 'o'); K('A', 5.1, L.spSweep, 'i'); K('A', 5.3, L.spGuard, 'io');
  K('B', 4.95, L.dodge, 'o'); K('B', 5.2, L.dodge, 'lin'); K('B', 5.36, L.spGuard, 'io'); mvd('B', 'A', 4.9, 5.2, 0.95);   // backs off from the sweep
  mv('A', 'B', 5.25, 5.52, 2.1);
  hit('A', 'B', 5.75, 'spOverW', 'spOver', 'spBlockH', true, 0.22, {}, { y: -0.3 }); K('A', 5.95, L.spGuard, 'io');
  knock('B', 'A', 5.75, 1.5);
  // ================= S3 6.4-9.0  B answers: lunge, two jabs, low sweep (A hops back over it), heavy thrust (A is pushed back) ========
  mv('B', 'A', 6.38, 6.68, 2.15); hit('B', 'A', 6.8, 'spJabW', 'spThrust1', 'spBlockL', false, 0.18);
  DRIFT.push([6.85, 7.5, 'pushB', 1.6]);
  hit('B', 'A', 7.1, 'spJabW', 'spJab', 'spBlock', false, 0.12); hit('B', 'A', 7.36, 'spJabW', 'spJab', 'spBlockL', false, 0.12);
  K('B', 7.55, L.spSweepW, 'o'); K('B', 7.8, L.spSweep, 'i'); K('B', 7.96, L.spGuard, 'io');
  K('A', 7.56, L.gsCrouch, 'o'); K('A', 7.69, L.gsHop, 'o', { y: 0.6 }); K('A', 7.92, L.gsLand, 'o'); K('A', 8.05, L.spGuard, 'io'); mvd('A', 'B', 7.6, 7.92, 0.5);
  mv('B', 'A', 7.98, 8.22, 2.1);
  hit('B', 'A', 8.4, 'spWind', 'spThrust', 'spBlock', true, 0.16); K('B', 8.62, L.spGuard, 'io');
  knock('A', 'B', 8.4, 1.3);
  // ================= S4 9.0-11.0  A lunges back in; B parries, steps inside and KICKS; A slides and brakes with the spear head =========
  mv('A', 'B', 9.02, 9.28, 2.1); hit('A', 'B', 9.38, 'spJabW', 'spThrust1', 'spBlockL', false, 0.16);
  mv('B', 'A', 9.4, 9.64, 1.3, 'o');
  K('B', 9.5, L.kickW, 'o', { lh: 0 }); K('B', 9.68, L.kick, 'i', { lh: 0 }); K('B', 9.9, L.spGuard, 'io'); clash(9.68, false, 'kick', { at: chest('A', 9.7) });
  K('A', 9.72, L.hitBack, 'o', { y: 0.1 }); K('A', 9.86, L.skid, 'o'); K('A', 10.04, L.spBrake, 'o'); K('A', 10.74, L.spBrake, 'lin'); K('A', 11.0, L.spGuard, 'io'); K('A', 11.22, L.spReady, 'io');
  at('B', 9.68, ...evalPosT('B', 9.68)); mvd('A', 'B', 9.68, 10.02, 1.3, 'lin'); mvd('A', 'B', 10.02, 10.8, 2.2, 'o2'); slide('A', 9.8, 10.8);
  for (let ts = 10.08; ts < 10.76; ts += 0.08) clash(+ts.toFixed(2), false, 'drag', { at: tipFloor('A', ts) });   // the planted head ploughs a furrow
  // ================= S5 11.0-13.0  breather: A spins the spear once (show-off); B levels his at A =================
  K('A', 11.35, L.twirlF, 'io'); K('A', 12.1, L.twirlF, 'lin'); tw('A', 11.4, 12.1, 2); K('A', 12.4, L.spReady, 'o'); K('A', 12.95, L.spReady);
  K('B', 10.4, L.spGuard); K('B', 10.95, L.spIdle, 'io'); K('B', 11.85, L.point, 'o', { lh: 0 }); K('B', 12.5, L.point, 'lin', { lh: 0 }); K('B', 12.85, L.spReady, 'io');
  BR.A.push([10.9, 12.9]); BR.B.push([10.2, 12.9]);
  // ================= S6 13.0-16.7  A runs in and leaps: the plunge bursts the sand where B stood (B rolls aside); circling exchange ====
  RUN.A.push([13.0, 13.4, 'charge']); K('A', 13.0, L.spCharge, 'io'); K('A', 13.3, L.spCharge, 'lin'); mv('A', 'B', 13.0, 13.42, 2.5, 'lin');
  K('A', 13.42, L.crouch, 'o', { y: -0.3 }); K('A', 13.52, L.takeoff, 'o', { y: 0.9 }); K('A', 13.72, L.gsPlungeW, 'o', { y: 1.5 }); K('A', 13.98, L.gsPlunge, 'i'); K('A', 14.2, L.gsPlunge, 'lin', { y: -0.4 }); K('A', 14.38, L.spGuard, 'io');
  mv('A', 'B', 13.5, 13.98, 0.6, 'o'); clash(13.98, true, 'slam', { at: tipFloor('A', 14.0) });
  K('B', 13.6, L.dodge, 'o'); K('B', 13.78, L.skid, 'o'); K('B', 14.08, L.skid, 'lin'); K('B', 14.22, L.spGuard, 'io');
  { const b = evalPosT('B', 13.6); at('B', 13.6, ...b); at('B', 14.08, b[0] + 0.45, b[1] + 1.55, 'o'); slide('B', 13.72, 14.08); }
  mv('B', 'A', 14.15, 14.38, 2.1); hit('B', 'A', 14.52, 'spJabW', 'spThrust1', 'spBlock', false, 0.18);
  DRIFT.push([14.55, 16.0, 'strafeL', 1.9]);
  hit('A', 'B', 14.82, 'spJabW', 'spJab', 'spBlockL', false, 0.12); hit('B', 'A', 15.12, 'spJabW', 'spThrust1', 'spBlockL', false, 0.15);
  hit('A', 'B', 15.42, 'spOverW', 'spOver', 'spBlockH', false, 0.2, {}, { y: -0.3 }); hit('B', 'A', 15.75, 'spJabW', 'spJab', 'spBlock', false, 0.12);
  hit('B', 'A', 16.08, 'spOverW', 'spOver', 'spBlockH', true, 0.22, {}, { y: -0.3 }); K('B', 16.3, L.spGuard, 'io');
  knock('A', 'B', 16.08, 1.3);
  // ================= S7 16.7-19.7  A's turn to kick: B slides back low; A sprints after him, B side-steps the lunge and hits his flank =====
  mv('A', 'B', 16.78, 17.02, 2.1); hit('A', 'B', 17.12, 'spJabW', 'spThrust1', 'spBlock', false, 0.16);
  mv('A', 'B', 17.15, 17.36, 1.3, 'o');
  K('A', 17.22, L.kickW, 'o', { lh: 0 }); K('A', 17.4, L.kick, 'i', { lh: 0 }); K('A', 17.62, L.spGuard, 'io'); clash(17.4, false, 'kick', { at: chest('B', 17.42) });
  K('B', 17.44, L.hitBack, 'o'); K('B', 17.58, L.slideLow, 'o'); K('B', 18.0, L.slideLow, 'lin'); K('B', 18.2, L.spGuard, 'io');
  at('A', 17.4, ...evalPosT('A', 17.4)); mvd('B', 'A', 17.4, 18.05, 2.3, 'o'); slide('B', 17.52, 18.05);
  RUN.A.push([17.95, 18.4, 'charge']); K('A', 17.95, L.spCharge, 'io'); K('A', 18.16, L.spCharge, 'lin'); K('A', 18.44, L.spWind, 'io'); K('A', 18.62, L.spThrust, 'i'); K('A', 18.82, L.spGuard, 'io');
  mv('A', 'B', 17.95, 18.42, 2.3, 'lin'); mv('A', 'B', 18.42, 18.62, 1.8, 'o');
  K('B', 18.44, L.dodge, 'o'); lat('B', 'A', 18.42, 18.68, 1.15); K('B', 18.72, L.spGuard, 'io');   // side-steps the lunge
  hit('B', 'A', 19.05, 'spOverW', 'spOver', 'spBlockH', true, 0.22, {}, { y: -0.3 }); K('B', 19.28, L.spGuard, 'io');
  knock('A', 'B', 19.05, 1.1);
  // ================= S8 19.7-23.2  last exchange: circling trade, sweep (B hops), A drives B back; the last blow drops B to a knee =====
  mv('B', 'A', 19.56, 19.82, 2.1);
  DRIFT.push([19.85, 21.3, 'strafeR', 1.8]);
  hit('B', 'A', 19.95, 'spJabW', 'spJab', 'spBlock', false, 0.12); hit('A', 'B', 20.25, 'spJabW', 'spThrust1', 'spBlockL', false, 0.15);
  hit('B', 'A', 20.58, 'spOverW', 'spOver', 'spBlockH', false, 0.2, {}, { y: -0.3 }); hit('A', 'B', 20.9, 'spJabW', 'spJab', 'spBlock', false, 0.12);
  K('A', 21.02, L.spSweepW, 'o'); K('A', 21.25, L.spSweep, 'i'); K('A', 21.45, L.spGuard, 'io');
  K('B', 21.0, L.gsCrouch, 'o'); K('B', 21.13, L.gsHop, 'o', { y: 0.6 }); K('B', 21.36, L.gsLand, 'o'); K('B', 21.5, L.spGuard, 'io');
  DRIFT.push([21.55, 22.4, 'pushA', 1.7]);
  hit('A', 'B', 21.8, 'spJabW', 'spJab', 'spBlockL', false, 0.12); hit('A', 'B', 22.1, 'spJabW', 'spThrust1', 'spBlock', false, 0.15);
  hit('A', 'B', 22.5, 'spOverW', 'spOver', 'spBlockH', true, 0.24, {}, { y: -0.32 });
  K('B', 22.55, L.hitBack, 'o'); K('B', 22.68, L.skid, 'o'); K('B', 23.02, L.kneelG, 'o'); K('B', 24.3, L.kneelG, 'lin'); K('B', 24.78, L.spGuard, 'io'); K('B', 25.6, L.spGuard);
  at('A', 22.5, ...evalPosT('A', 22.5)); mvd('B', 'A', 22.5, 23.02, 1.8, 'o'); slide('B', 22.65, 23.02);
  K('A', 22.72, L.spGuard, 'io'); K('A', 23.3, L.spReady, 'io'); K('A', 25.3, L.spReady); BR.A.push([23.0, 25.4]); BR.B.push([23.0, 25.8]);
  // ================= S9 25.4-29  the finish: A dashes in under B's thrust, both arms straight, the spear through B's body =================
  const YP = +(new URLSearchParams(globalThis.location ? location.search : '').get('yp') ?? 0);   // turn of the body that lines the shaft up with B's centre
  RUN.A.push([25.5, 26.06, 'charge']); K('A', 25.45, L.spCharge, 'io'); K('A', 25.8, L.spCharge, 'lin'); K('A', 26.1, L.spWind, 'io'); K('A', 26.3, L.spPierce, 'i', { yawOff: YS + YP }); K('A', 27.3, L.spPierce, 'lin', { yawOff: YS + YP });
  at('B', 25.5, ...evalPosT('B', 25.5)); mv('A', 'B', 25.5, 26.08, 1.8, 'lin'); mv('A', 'B', 26.08, 26.3, +(QS2.get('pgap') ?? 0.68), 'o');
  K('B', 25.95, L.spWind, 'o'); K('B', 26.2, L.spThrust, 'i');
  K('B', 26.36, L.hitBack, 'o', { lh: 0, y: 0.02 }); K('B', 26.9, L.hitBack, 'lin', { lh: 0, y: -0.04, waist: [20, 0, 0], head: [26, 0, 0] }); K('B', 27.3, L.hitBack, 'lin', { lh: 0, y: -0.06, waist: [24, 0, 0], head: [30, 0, 0] });
  clash(26.32, true, 'hit', { at: chest('B', 26.33) });
  K('A', 27.5, L.spWind, 'o', { pierce: 1, yawOff: YS + YP * 0.6 }); mv('A', 'B', 27.3, 27.62, 2.3); K('A', 27.82, L.spGuard, 'io'); K('A', 28.6, L.spIdle, 'io'); K('A', 29.0, L.spIdle);
  K('B', 27.62, L.knees, 'o', { lh: 0 }); K('B', 28.05, L.knees, 'lin', { lh: 0 }); K('B', FALL_T, L.fallen, 'o'); K('B', 29.0, L.fallen);
  at('B', 29.0, ...evalPosT('B', 28.0)); at('A', 29.0, ...evalPosT('A', 28.0));
  export_cross.mid = [0, 0]; export_cross.u = [1, 0]; export_cross.p = [0, 1];
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}

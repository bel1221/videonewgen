function buildAll() {
  // v8 "blade masters" (30 s): new choreography on the v6/v7 mechanics. Sword skill first (twirls), then fast exchanges
  // that keep moving. Skids are standing slides (L.skid + sand spray), never a sitting crouch. x/z = sand, centre (0,0).
  const D = { A: {}, B: {} };                                         // persistent per-character overrides (spin offsets)
  const K = (c, t, pose, e, d) => k(c, t, pose, e, { ...D[c], ...(d || {}) });
  const SW = { rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 };   // sword trailing low while sprinting
  const tw = (c, t0, t1, turns) => TWIRL[c].push([t0, t1, turns]);
  const STRIKE = { R: ['windR', 'slashR', 'parryL'], L: ['windL', 'slashL', 'parryR'], O: ['windO', 'slashO', 'parryH'], T: ['windT', 'thrust', 'parryR'] };
  // defence keys go through blk(): the parry pose is re-chosen in fight.js (parryL/R/H, whichever meets the real blade)
  const blk = (def, t0, t1, name, d1 = {}, d2 = {}, e0 = 'o') => { const b0 = { ...D[def] }; K(def, t0, L[name], e0, d1); K(def, t1, L[name], 'lin', d2);
    const k2 = T[def][T[def].length - 1], k1 = T[def][T[def].length - 2]; PARRY.push({ t: t1, def, apply: n => { k1[1] = S(L[n], { ...b0, ...d1 }); k2[1] = S(L[n], { ...b0, ...d2 }); } }); };
  const ex = (att, def, t, s, big = false, wind = 0.16) => { const [w, sl, pa] = STRIKE[s]; K(att, t - wind, L[w], 'o'); K(att, t, L[sl], 'i'); blk(def, t - wind + 0.02, t, pa, {}, s === 'T' ? { waist: [10, 0, -18] } : {}); clash(t, big); };
  const sprint = (c, t0, t1, from, to) => { RUN[c].push([t0, t1]); at(c, t0, from[0], from[1]); at(c, t1, to[0], to[1], 'lin'); };
  // ================= S1 0-2.4  sword skill: both twirl their swords, B points the blade at A =================
  at('A', 0, -3.4, 0); at('A', 2.15, -3.4, 0); at('B', 0, 3.4, 0); at('B', 2.2, 3.4, 0);
  K('A', 0, L.relaxed); K('A', 0.28, L.twirlS, 'io'); K('A', 1.0, L.twirlS, 'lin'); K('A', 1.18, G, 'o'); K('A', 1.9, G, 'io');
  tw('A', 0.3, 1.02, 2);
  K('B', 0, L.relaxed); K('B', 0.8, L.relaxed, 'io'); K('B', 0.95, L.twirlF, 'io'); K('B', 1.62, L.twirlF, 'lin'); K('B', 1.8, L.point, 'o'); K('B', 2.05, L.point, 'lin'); K('B', 2.22, G, 'io');
  tw('B', 0.97, 1.63, 2);
  BR.A.push([0, 2.1]); BR.B.push([0, 2.1]);
  // ================= S2 2.15-5.0  sprint in, exchange while strafing sideways, big clash, both skid apart ==========
  sprint('A', 2.15, 2.72, [-3.4, 0], [-0.62, 0.2]); sprint('B', 2.2, 2.72, [3.4, 0], [0.62, -0.1]);
  K('A', 2.15, L.crouch, 'io', SW); K('A', 2.55, L.guard, 'lin', SW); K('B', 2.22, L.crouch, 'io', SW); K('B', 2.5, L.guard, 'lin', SW);
  const S2 = [[2.95, -0.62, 0.6, 0.66, 0.42], [3.3, -0.7, 1.2, 0.58, 1.0], [3.65, -0.55, 1.8, 0.7, 1.62], [4.0, -0.48, 2.4, 0.8, 2.3], [4.35, -0.56, 2.9, 0.6, 2.85]];
  for (const [t, ax, az, bx, bz] of S2) { at('A', t, ax, az, 'io'); at('B', t, bx, bz, 'io'); }
  ex('B', 'A', 2.95, 'R', false, 0.3); ex('A', 'B', 3.3, 'R'); ex('B', 'A', 3.65, 'O', false, 0.2); ex('A', 'B', 4.0, 'T', false, 0.18);
  K('A', 4.15, L.windR, 'o'); K('A', 4.35, L.slashR, 'i'); K('B', 4.17, L.windL, 'o'); K('B', 4.35, L.slashL, 'i'); clash(4.35, true);
  at('A', 4.9, -2.6, 3.2, 'o'); at('B', 4.9, 2.5, 2.9, 'o');
  K('A', 4.5, L.skid, 'o'); K('A', 4.85, L.skid, 'lin'); K('A', 5.0, G, 'io'); K('B', 4.5, L.skid, 'o'); K('B', 4.85, L.skid, 'lin'); K('B', 5.0, G, 'io');
  // ================= S3 5.0-7.4  B rushes with a flat cut, A ducks and slips past, spins twice, rising cut =========
  RUN.B.push([5.05, 5.45]); at('B', 5.05, 2.5, 2.9); at('B', 5.5, 0.55, 2.6, 'lin'); at('B', 5.8, 0.15, 2.65, 'o');
  K('B', 5.05, L.crouch, 'io', SW); K('B', 5.35, L.guard, 'lin', SW); K('B', 5.45, L.windL, 'o'); K('B', 5.62, L.slashL, 'i'); K('B', 5.85, L.skid, 'o'); K('B', 6.0, G, 'io');
  at('A', 5.2, -2.6, 3.2); at('A', 5.62, -0.25, 3.62, 'lin'); at('A', 5.95, 1.6, 2.45, 'o');
  K('A', 5.25, G); K('A', 5.45, L.duck, 'o'); K('A', 5.75, L.duck, 'lin'); K('A', 5.92, L.skid, 'o');
  K('A', 6.03, L.spin, 'lin', { yawOff: -200 }); K('A', 6.15, L.slashR, 'i', { yawOff: -360 }); D.A = { yawOff: -360 };
  blk('B', 6.0, 6.15, 'parryL'); clash(6.15);
  K('A', 6.33, L.spin, 'lin', { yawOff: -560 }); K('A', 6.48, L.slashR, 'i', { yawOff: -720 }); D.A = { yawOff: -720 };
  blk('B', 6.32, 6.48, 'parryL', { y: -0.2 }); clash(6.48);
  K('A', 6.64, L.upperW, 'o'); K('A', 6.85, L.upper, 'i'); blk('B', 6.68, 6.85, 'parryR', {}, { y: -0.3 }); clash(6.85, true);
  at('A', 6.15, 1.02, 2.5, 'io'); at('A', 6.48, 1.0, 2.5, 'io'); at('A', 6.85, 0.6, 2.5, 'o'); at('A', 7.15, 1.0, 2.5, 'o');
  at('B', 6.15, 0.08, 2.7, 'io'); at('B', 6.48, -0.25, 2.7, 'io'); at('B', 6.85, -0.62, 2.65, 'o'); at('B', 7.35, -2.6, 2.8, 'o');
  K('A', 7.05, G, 'io'); K('B', 6.98, L.hitBack, 'o'); K('B', 7.08, L.skid, 'o'); K('B', 7.35, L.skid, 'lin'); K('B', 7.5, G, 'io');
  // ================= S4 7.5-9.6  B sprints and leaps into an aerial spinning overhead; A blocks and is driven back ==
  RUN.B.push([7.65, 8.0]); at('B', 7.65, -2.6, 2.8); at('B', 8.06, -0.95, 2.6, 'lin'); at('B', 8.5, 0.05, 2.55, 'lin'); at('B', 8.62, 0.15, 2.55, 'o');
  at('A', 8.3, 1.3, 2.5); at('A', 8.5, 1.35, 2.5); at('A', 9.0, 2.6, 2.4, 'o');
  K('B', 7.65, L.crouch, 'io', SW); K('B', 7.95, L.crouch, 'o', { y: -0.4 }); K('B', 8.08, L.takeoff, 'o', { y: 0.9 });
  K('B', 8.3, L.spin, 'lin', { y: 1.6, yawOff: -180 }); K('B', 8.5, L.slashO, 'i', { y: 0.6, yawOff: -360 }); D.B = { yawOff: -360 };
  K('B', 8.62, L.land, 'o'); K('B', 8.85, G, 'io');
  K('A', 8.2, G); blk('A', 8.35, 8.5, 'parryH', {}, { y: -0.3 }); clash(8.5, true);
  K('A', 8.6, L.skid, 'o'); K('A', 8.95, L.skid, 'lin'); K('A', 9.08, G, 'io');
  at('B', 9.2, 1.4, 2.45, 'io'); at('B', 9.45, 1.6, 2.4, 'io'); at('A', 9.2, 2.75, 2.35, 'io'); at('A', 9.45, 3.0, 2.3, 'io');
  ex('B', 'A', 9.2, 'R', false, 0.15); ex('B', 'A', 9.45, 'L', false, 0.13);
  // ================= S5 9.6-12.1  B thrusts, A deflects and sidesteps, B overruns; A strikes, flourishes, overhead =
  const yB5 = face('B', 9.8, 90);
  K('B', 9.62, L.windT, 'o', { yawAbs: yB5 }); K('B', 9.8, L.thrust, 'i', { yawAbs: yB5 }); K('B', 10.0, L.thrust, 'lin', { yawAbs: yB5, chest: [16, 6, 0] });
  at('B', 9.8, 2.05, 2.35, 'o'); at('B', 10.02, 2.72, 2.25, 'o');
  K('A', 9.62, G); blk('A', 9.7, 9.8, 'parryR', { waist: [10, 0, -20] }, { waist: [10, 0, -20] }); clash(9.8); K('A', 9.95, L.dodge, 'o');
  at('A', 9.8, 3.0, 2.3); at('A', 10.05, 3.2, 3.5, 'o'); at('A', 10.1, 3.15, 3.45, 'io');
  const yB5b = face('B', 10.25, yB5);
  blk('B', 10.13, 10.25, 'parryH', { yawAbs: yB5b }, { yawAbs: yB5b, y: -0.25 }); K('B', 10.45, G, 'io', { yawAbs: face('B', 10.45, yB5b) }); K('B', 10.55, G);
  K('A', 10.1, L.windO, 'o'); K('A', 10.25, L.slashO, 'i'); clash(10.25);
  at('A', 10.25, 3.15, 3.45); at('A', 10.7, 3.6, 4.55, 'o'); at('B', 10.55, 2.85, 2.3); at('B', 11.05, 3.0, 2.9, 'io'); at('B', 11.5, 2.9, 2.8, 'io');
  K('A', 10.42, L.twirlF, 'o'); K('A', 11.02, L.twirlF, 'lin'); tw('A', 10.45, 11.02, 1);
  K('A', 11.3, L.windO, 'o'); K('A', 11.5, L.slashO, 'i'); at('A', 11.2, 3.5, 4.35, 'io'); at('A', 11.5, 3.2, 3.92, 'o');
  blk('B', 11.32, 11.5, 'parryH', {}, { y: -0.32 }); clash(11.5, true);
  at('B', 11.95, 2.6, 1.3, 'o'); K('B', 11.62, L.skid, 'o'); K('B', 11.92, L.skid, 'lin'); K('B', 12.1, G, 'io');
  // ================= S6 12.1-15.1  A drives B back in a straight line: six strikes, B ducks the 7th and counters ==
  at('A', 12.15, 2.7, 2.65, 'io'); at('B', 12.1, 2.62, 1.3);
  const FL = ['R', 'L', 'O', 'R', 'L', 'T'];
  for (let i = 0; i < FL.length; i++) { const t = 12.4 + 0.28 * i, az = 2.5 - 0.33 * i, sx = 0.08 * (i % 2 ? 1 : -1);
    at('A', t, 2.68 + sx, az, 'io'); at('B', t, 2.62 - sx, az - 1.2, 'io'); ex('A', 'B', t, FL[i], false, 0.15); }
  K('A', 13.92, L.windR, 'o'); K('A', 14.08, L.slashR, 'i');                                      // whiff: B ducks under it
  K('B', 13.96, L.duck, 'o'); K('B', 14.12, L.duck, 'lin'); K('B', 14.18, L.upperW, 'o'); K('B', 14.3, L.upper, 'i');
  blk('A', 14.2, 14.3, 'parryR', {}, { y: -0.2 }); clash(14.3, true);
  at('A', 14.08, 2.66, 0.55, 'io'); at('B', 14.08, 2.62, -0.7, 'io'); at('A', 14.3, 2.66, 0.5); at('B', 14.3, 2.62, -0.58, 'o');
  at('A', 15.0, 2.6, 2.3, 'o'); K('A', 14.45, L.hitBack, 'o', { y: 0.2 }); K('A', 14.6, L.skid, 'o'); K('A', 14.95, L.skid, 'lin'); K('A', 15.1, G, 'io');
  K('B', 14.55, G, 'io');
  // ================= S7 15.1-17.5  stalking, B's twirl, running thrust, A deflects aside, jump slash at the skid ===
  at('A', 15.1, 2.6, 2.3); at('A', 15.95, 1.6, 2.6, 'io'); at('B', 14.6, 2.62, -0.58); at('B', 15.95, 3.4, -0.9, 'io');
  BR.A.push([15.1, 16.2]); BR.B.push([14.6, 16.0]);
  K('B', 15.05, L.twirlS, 'io'); K('B', 15.78, L.twirlS, 'lin'); K('B', 15.95, G, 'io'); tw('B', 15.12, 15.78, 2);
  K('A', 15.4, G); K('A', 16.1, G);
  RUN.B.push([16.0, 16.38]); at('B', 16.0, 3.4, -0.9); at('B', 16.5, 2.05, 1.6, 'lin'); at('B', 16.95, 0.7, 3.9, 'o');
  K('B', 16.0, L.crouch, 'io', SW); K('B', 16.3, L.windT, 'o'); K('B', 16.5, L.thrust, 'i'); K('B', 16.7, L.skid, 'o'); K('B', 16.95, L.skid, 'lin');
  at('A', 16.2, 1.6, 2.6); at('A', 16.55, 0.9, 1.7, 'o');
  K('A', 16.32, G); blk('A', 16.42, 16.5, 'parryR', { waist: [10, 0, -20] }, { waist: [10, 0, -20] }); clash(16.5); K('A', 16.62, L.dodge, 'o');
  K('A', 16.75, L.crouch, 'o', { y: -0.35 }); K('A', 16.86, L.takeoff, 'o', { y: 0.7 }); K('A', 17.0, L.windO, 'o', { y: 1.2 }); K('A', 17.18, L.slashO, 'i', { y: 0.4 });
  at('A', 16.75, 0.9, 1.7); at('A', 17.18, 0.85, 2.72, 'o');
  blk('B', 17.02, 17.18, 'parryH', {}, { y: -0.3 }); clash(17.18, true);
  K('A', 17.32, L.land, 'o'); K('A', 17.48, G, 'io'); K('B', 17.36, G, 'io');
  // ================= S8 17.5-20.5  low sweep -> A hops it and cuts in the air; thrust dodged; trade; shoulder check =
  K('B', 17.56, L.sweepW, 'o'); K('B', 17.75, L.sweep, 'i');
  K('A', 17.6, L.crouch, 'o', { y: -0.3 }); K('A', 17.7, L.takeoff, 'o', { y: 0.75 }); K('A', 17.82, L.windO, 'o', { y: 0.9 }); K('A', 17.98, L.slashO, 'i', { y: 0.3 });
  blk('B', 17.86, 17.98, 'parryH', { y: -0.35 }, { y: -0.4 }); clash(17.98);
  K('A', 18.12, L.land, 'o'); K('A', 18.3, G, 'io'); K('B', 18.15, G, 'io');
  K('B', 18.3, L.windT, 'o'); K('B', 18.45, L.thrust, 'i'); K('A', 18.3, G); K('A', 18.42, L.dodge, 'o'); at('A', 18.3, 0.85, 2.72); at('A', 18.5, 1.4, 2.8, 'o');
  ex('A', 'B', 18.7, 'R', false, 0.15); ex('B', 'A', 18.95, 'O', false, 0.15);
  K('A', 19.1, L.windO, 'o'); K('B', 19.12, L.crouch, 'o', { y: -0.2 }); K('B', 19.25, L.charge, 'i');
  at('B', 18.95, 0.98, 3.65, 'io'); at('B', 19.05, 0.98, 3.65); at('B', 19.25, 1.25, 3.25, 'o');
  clash(19.25, false, 'kick', { at: () => { const q = pose('A', 19.27).pos; return [q[0], q[1] + 1.25, q[2]]; } });
  at('A', 19.25, 1.4, 2.8); at('A', 19.7, 1.9, 1.2, 'o');
  K('A', 19.27, L.hitBack, 'o'); K('A', 19.4, L.skid, 'o'); K('A', 19.7, L.skid, 'lin');
  K('A', 19.85, L.twirlF, 'o'); K('A', 20.3, L.twirlF, 'lin'); K('A', 20.45, G, 'io'); tw('A', 19.86, 20.3, 1);
  K('B', 19.5, G, 'io'); at('B', 20.4, 1.6, 2.5, 'io');
  // ================= S9 20.5-24.6  both spin-cut into a blade lock that drifts, shove, B's three, A's riposte =======
  at('A', 20.45, 1.9, 1.2); at('A', 20.78, 1.8, 1.55, 'o'); at('B', 20.78, 1.65, 2.6, 'o');
  K('A', 20.5, G); K('A', 20.64, L.spin, 'lin', { yawOff: -920 }); K('A', BIND_T, L.slashR, 'i', { yawOff: -1080 }); D.A = { yawOff: -1080 };
  K('B', 20.5, G); K('B', 20.64, L.spin, 'lin', { yawOff: -160 }); K('B', BIND_T, L.slashL, 'i', { yawOff: 0 }); D.B = { yawOff: 0 };
  clash(BIND_T, true);
  K('A', BIND_T + 0.06, L.bind, 'o'); K('B', BIND_T + 0.06, L.bind, 'o');
  for (let t = BIND_T + 0.18; t < BIND_END; t += 0.12) { const s = Math.sin(t * 40) * 0.5 + 0.5;
    K('A', t, L.bind, 'io', { chest: [22 + 8 * s, 10, 0], y: -0.3 - 0.06 * s, lArm: [-80 + 10 * s, 0, 30] }); K('B', t, L.bind, 'io', { chest: [22 + 8 * (1 - s), 10, 0], y: -0.3 - 0.06 * (1 - s) }); }
  at('A', BIND_END, 2.95, 1.6, 'io'); at('B', BIND_END, 2.8, 2.65, 'io');
  K('B', 21.6, L.thrust, 'o', { rArm: [-80, 0, 0], lArm: [-90, 0, 20], lElbow: [-10, 0, 0], y: -0.3 }); K('B', 21.85, G, 'io');
  clash(21.6, false, 'kick', { at: () => { const q = pose('A', 21.62).pos; return [q[0], q[1] + 1.2, q[2]]; } });
  K('A', 21.62, L.hitBack, 'o'); K('A', 21.75, L.skid, 'o'); K('A', 22.05, L.skid, 'lin'); K('A', 22.2, G, 'io');
  at('A', 21.6, 2.95, 1.6); at('A', 22.05, 3.1, -0.05, 'o'); at('B', 21.6, 2.8, 2.65, 'o');
  const S9 = [[22.45, 'B', 'R', 3.05, 0.0, 2.95, 1.2], [22.7, 'B', 'L', 3.05, -0.3, 2.95, 0.9], [22.95, 'B', 'O', 3.0, -0.6, 2.9, 0.6],
              [23.25, 'A', 'T', 3.0, -0.55, 2.95, 0.68], [23.55, 'B', 'O', 3.0, -0.7, 2.95, 0.52], [23.85, 'A', 'L', 3.05, -0.55, 3.0, 0.68]];   // 23.85 is made big below: both blown apart
  for (const [t, att, s, ax, az, bx, bz] of S9) { at('A', t, ax, az, 'io'); at('B', t, bx, bz, 'io'); ex(att, att === 'A' ? 'B' : 'A', t, s, t === 23.85, 0.15); }
  at('A', 24.5, 3.3, -3.6, 'o'); at('B', 24.5, 2.75, 3.9, 'o');
  K('A', 24.08, L.skid, 'o'); K('A', 24.45, L.skid, 'lin'); K('A', 24.6, G, 'io'); K('B', 24.08, L.skid, 'o'); K('B', 24.45, L.skid, 'lin'); K('B', 24.6, G, 'io');
  // ================= S10 24.6-30  mirrored twirl standoff, sprint, A slides under B's cut and rips upward; B falls ===
  K('A', 24.72, L.twirlS, 'io'); K('A', 25.28, L.twirlS, 'lin'); tw('A', 24.75, 25.28, 2);
  K('B', 24.78, L.twirlF, 'io'); K('B', 25.3, L.twirlF, 'lin'); tw('B', 24.8, 25.3, 2);
  { const pa = evalPosT('A', 24.5), pb = evalPosT('B', 24.5), dx = pb[0] - pa[0], dz = pb[1] - pa[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    const m = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], P_ = (s) => [m[0] + ux * s, m[1] + uz * s];
    at('A', 25.4, pa[0], pa[1]); at('B', 25.45, pb[0], pb[1]);
    RUN.A.push([25.45, 25.92]); RUN.B.push([25.5, 25.9]);
    at('A', 25.95, ...P_(-1.25), 'lin'); at('A', 26.1, ...P_(-0.5), 'lin'); at('A', 26.4, ...P_(-0.15), 'o');
    at('B', 25.92, ...P_(0.9), 'lin'); at('B', 26.08, ...P_(0.7), 'o');
    at('B', FLASH, ...P_(0.8)); at('B', 26.85, ...P_(3.2), 'o'); at('B', 27.3, ...P_(3.8), 'o'); at('B', 30, ...P_(3.8));
    at('A', 30, ...P_(-0.15));
    export_cross.mid = m; export_cross.u = [ux, uz]; export_cross.p = [-uz, ux]; }
  K('A', 25.4, G); K('A', 25.48, L.crouch, 'io', SW); K('A', 25.8, L.guard, 'lin', SW); K('A', 25.95, L.duck, 'o'); K('A', 26.12, L.duck, 'lin');
  K('A', 26.2, L.upperW, 'o'); K('A', FLASH, L.upper, 'i'); K('A', 26.65, G, 'io');
  K('B', 25.45, G); K('B', 25.52, L.crouch, 'io', SW); K('B', 25.78, L.guard, 'lin', SW); K('B', 25.92, L.windL, 'o'); K('B', 26.08, L.slashL, 'i');
  blk('B', 26.24, FLASH, 'parryR', {}, { y: -0.2 }); clash(FLASH, true, 'cross');
  K('B', 26.5, L.hitBack, 'o', { y: 0.3 }); K('B', 26.85, L.land, 'i'); K('B', 26.98, L.skid, 'o'); K('B', 27.28, L.skid, 'lin'); K('B', FALL_T - 0.3, L.knees, 'io');
  K('B', FALL_T, L.kneelG, 'o'); K('B', 30, L.kneelG, 'lin', { head: [20, 0, 0] });
  BR.A.push([26.6, 30]); BR.B.push([26.6, 30]);
  K('A', 27.2, L.relaxed, 'io'); K('A', 27.55, L.twirlS, 'io'); K('A', 28.3, L.twirlS, 'lin'); tw('A', 27.6, 28.3, 2);
  K('A', 28.55, L.flick, 'o'); K('A', 29.1, L.relaxed, 'io'); K('A', 30, L.relaxed, 'io');
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}
// helpers for buildAll: angle wrap toward a reference, planned position lookup before sorting is final
function near(a, ref) { while (a - ref > 180) a -= 360; while (a - ref < -180) a += 360; return a; }
function evalPosT(c, t) { const K_ = P[c].slice().sort((a, b) => a[0] - b[0]); return evalPos(K_, t); }
function face(c, t, ref = 0) { const o = c === 'A' ? 'B' : 'A', a = evalPosT(c, t), b = evalPosT(o, t); return near(Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI, ref); }
let BIND_C = [0, 0], SH = null;

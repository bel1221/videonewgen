function buildAll() {
  // v7 "moving duel": every exchange happens on the move. Positions first (at), then facing locks computed from them
  // (so turns never snap), then poses (k) and contacts (clash). x = arena long axis, centre (0,0).
  const D = { A: {}, B: {} };                                         // persistent per-character overrides (spin offsets)
  const K = (c, t, pose, e, d) => k(c, t, pose, e, { ...D[c], ...(d || {}) });
  const SW = { rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 };   // sword trailing low while sprinting
  // ================= positions =================
  // S1 0-3.0  running cross: both sprint the length of the sand and clash in passing, skid, turn
  at('A', 0, -11, -1.2); at('A', 0.32, -11, -1.2); at('A', 2.1, -0.25, -0.45, 'lin'); at('A', 2.8, 3.6, -0.75, 'o');
  at('B', 0, 11, 1.2); at('B', 0.36, 11, 1.2); at('B', 2.1, 0.25, 0.45, 'lin'); at('B', 2.8, -3.6, 0.75, 'o');
  RUN.A.push([0.32, 2.0]); RUN.B.push([0.36, 2.0]);
  // S2 3.0-4.9  B sprints and leaps for an overhead; A slides UNDER the jump; B slams the sand where A was
  at('A', 3.0, 3.6, -0.75); at('A', 3.92, 3.5, -0.75); at('A', 4.42, -0.4, -1.05, 'o');
  at('B', 3.0, -3.6, 0.75); at('B', 3.85, -0.9, 0.2, 'lin'); at('B', 4.36, 2.6, -0.5, 'lin'); at('B', 4.5, 2.75, -0.55, 'o');
  RUN.B.push([3.05, 3.8]);
  // S3 5.0-7.0  A drives B back across the sand: advance-strike x3 (B parries backing off), thrust, B sidesteps + spin counter
  at('A', 4.9, -0.4, -1.05); at('A', 5.3, 0.55, -0.9, 'o'); at('A', 5.7, 1.35, -0.8, 'o'); at('A', 6.1, 2.15, -0.7, 'o'); at('A', 6.55, 3.1, -0.6, 'o');
  at('B', 4.9, 2.75, -0.55); at('B', 5.3, 2.55, -0.5, 'o'); at('B', 5.7, 3.35, -0.45, 'o'); at('B', 6.1, 4.1, -0.4, 'o'); at('B', 6.5, 4.5, 0.75, 'o');
  at('B', 6.95, 4.15, 0.6, 'io'); at('A', 6.95, 3.25, -0.5, 'io');
  // S4 7.0-9.0  B kicks, A rolls back and springs up; B charges, A sidesteps at the last moment, B skids past
  at('B', 7.25, 3.9, 0.5, 'o'); at('A', 7.3, 3.2, -0.5); at('A', 7.9, -0.6, -0.9, 'o');
  RUN.B.push([7.95, 8.55]); at('B', 7.95, 3.9, 0.5); at('B', 8.6, 0.2, -0.75, 'lin'); at('B', 9.05, -2.7, -0.9, 'o');
  at('A', 8.38, -0.6, -0.9); at('A', 8.6, -0.75, 0.55, 'o');
  // S5 9.0-10.5  A zig-zag dash (two cuts) into a leaping slash; B blocks low
  at('A', 9.05, -0.75, 0.55); at('A', 9.35, -0.45, -0.45, 'io'); at('A', 9.65, -0.95, 0.5, 'io'); at('A', 10.05, -1.35, -0.2, 'o');   // cut right (run-up), cut left, leap in
  at('B', 9.05, -2.7, -0.9); at('B', 10.05, -3.15, -0.45, 'io');
  // S6 10.5-12.4  fast wide circling flurry
  { const pa = evalPosT('A', 10.05), pb = evalPosT('B', 10.05), c0 = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], r = 1.05, th0 = Math.atan2(pb[1] - c0[1], pb[0] - c0[0]);
    for (let t = 10.45; t <= 12.25 + 1e-9; t += 0.1) { const th = th0 + (t - 10.45) / 1.8 * Math.PI * 1.05;
      at('B', t, c0[0] + Math.cos(th) * r, c0[1] + Math.sin(th) * r, 'lin'); at('A', t, c0[0] - Math.cos(th) * r, c0[1] - Math.sin(th) * r, 'lin'); }
    BIND_C = c0; }
  // S7 12.4-14.1  bind that drifts sideways across the sand, then B shoves A away (A slides)
  { const pa = evalPosT('A', 12.25), pb = evalPosT('B', 12.25), dx = pb[0] - pa[0], dz = pb[1] - pa[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    const ca = [pa[0] + ux * (d - 1.05) / 2, pa[1] + uz * (d - 1.05) / 2], cb = [pb[0] - ux * (d - 1.05) / 2, pb[1] - uz * (d - 1.05) / 2];
    at('A', 12.45, ca[0], ca[1], 'o'); at('B', 12.45, cb[0], cb[1], 'o');
    at('A', 13.3, ca[0] + px * 1.8, ca[1] + pz * 1.8, 'io'); at('B', 13.3, cb[0] + px * 1.8, cb[1] + pz * 1.8, 'io');
    at('A', 14.05, ca[0] + px * 1.8 - ux * 3.2, ca[1] + pz * 1.8 - uz * 3.2, 'o'); at('B', 13.6, cb[0] + px * 1.8 + ux * 0.3, cb[1] + pz * 1.8 + uz * 0.3, 'o');
    SH = { ux, uz, px, pz }; }
  // S8 14.1-15.6  B rushes in with a low sweep; A hops it and chops down; B blocks from the knee
  { const pa = evalPosT('A', 14.05), pb = evalPosT('B', 13.6), dx = pa[0] - pb[0], dz = pa[1] - pb[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    at('B', 14.15, pb[0], pb[1]); at('B', 14.6, pa[0] - ux * 1.5, pa[1] - uz * 1.5, 'o');
    at('A', 14.6, pa[0], pa[1]); at('A', 15.05, pa[0] - ux * 0.35, pa[1] - uz * 0.35, 'o'); }
  // S9 15.6-20  break apart, then A sprints and LEAPS from the run; B launches up to meet it: mid-air clash, both blown apart
  { const pa = evalPosT('A', 15.05), pb = evalPosT('B', 14.6), dx = pb[0] - pa[0], dz = pb[1] - pa[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    at('A', 15.5, pa[0], pa[1]); at('A', 16.2, pa[0] - ux * 2.8, pa[1] - uz * 2.8, 'o');
    at('B', 15.5, pb[0], pb[1]); at('B', 16.2, pb[0] + ux * 0.8, pb[1] + uz * 0.8, 'o');
    const a0 = [pa[0] - ux * 2.8, pa[1] - uz * 2.8], b0 = [pb[0] + ux * 0.8, pb[1] + uz * 0.8];
    RUN.A.push([16.35, 16.95]); at('A', 16.35, a0[0], a0[1]); at('A', 16.95, b0[0] - ux * 3.6, b0[1] - uz * 3.6, 'lin');
    at('A', FLASH, b0[0] - ux * 1.1, b0[1] - uz * 1.1, 'lin');
    at('A', 18.1, b0[0] - ux * 4.4, b0[1] - uz * 4.4, 'o');                       // blown back, slides on landing
    at('B', 17.0, b0[0], b0[1]); at('B', 18.1, b0[0] + ux * 2.6, b0[1] + uz * 2.6, 'o');
    at('A', 20, b0[0] - ux * 4.4, b0[1] - uz * 4.4); at('B', 20, b0[0] + ux * 2.6, b0[1] + uz * 2.6);
    export_cross.mid = [(a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2]; export_cross.u = [ux, uz]; export_cross.p = [-uz, ux]; }
  for (const c of ['A', 'B']) P[c].sort((a, b) => a[0] - b[0]);
  // ================= facing locks (continuous: computed from the planned positions, wrapped to the previous value) ==
  const face = (c, t, ref) => { const o = c === 'A' ? 'B' : 'A', a = evalPos(P[c], t), b = evalPos(P[o], t); return near(Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI, ref); };
  const trav = (c, t0, t1, ref) => { const a = evalPos(P[c], t0), b = evalPos(P[c], t1); return near(Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI, ref); };
  // ================= poses =================
  // ---- S1: ready crouch, sprint, clash in passing, skid + turn round
  const yA1 = trav('A', 0.32, 2.1, 90), yB1 = trav('B', 0.36, 2.1, -90);
  K('A', 0, L.crouch, 'io', { ...SW, yawAbs: yA1 }); K('B', 0, L.crouch, 'io', { ...SW, yawAbs: yB1 });
  K('A', 0.32, L.crouch, 'lin', { ...SW, yawAbs: yA1 }); K('B', 0.36, L.crouch, 'lin', { ...SW, yawAbs: yB1 });
  K('A', 1.7, L.guard, 'lin', { ...SW, yawAbs: yA1 }); K('A', 1.96, L.windR, 'o', { yawAbs: yA1 }); K('A', 2.1, L.slashR, 'i', { yawAbs: yA1 });
  K('B', 1.7, L.guard, 'lin', { ...SW, yawAbs: yB1 }); K('B', 1.96, L.windL, 'o', { yawAbs: yB1 }); K('B', 2.1, L.slashL, 'i', { yawAbs: yB1 });
  clash(2.1, true);
  const yA1e = face('A', 2.95, yA1 + 180), yB1e = face('B', 2.95, yB1 - 180);
  K('A', 2.3, L.slide, 'o', { yawAbs: yA1 + 40, rArm: [-74, 0, -62], rElbow: [-4, 0, 0], wrist: 160 }); K('A', 2.78, L.slide, 'lin', { yawAbs: yA1e - 20, y: -0.46 }); K('A', 2.98, G, 'io', { yawAbs: yA1e });
  K('B', 2.3, L.slide, 'o', { yawAbs: yB1 - 40, rArm: [-74, 0, -62], rElbow: [-4, 0, 0], wrist: 160 }); K('B', 2.78, L.slide, 'lin', { yawAbs: yB1e + 20, y: -0.46 }); K('B', 2.98, G, 'io', { yawAbs: yB1e });
  K('A', 3.05, G);
  // ---- S2: B sprints + leaps (overhead), A slides under, B slams the sand
  const yB2 = trav('B', 3.0, 4.36, 90), yA2 = face('A', 3.9, 0);
  K('B', 3.05, L.crouch, 'o', { ...SW, yawAbs: yB2 }); K('B', 3.62, L.guard, 'lin', { ...SW, yawAbs: yB2 });
  K('B', 3.82, L.crouch, 'o', { yawAbs: yB2, y: -0.4 }); K('B', 3.92, L.takeoff, 'o', { yawAbs: yB2, y: 0.9 }); K('B', 4.12, L.tuck, 'o', { yawAbs: yB2, y: 2.3 });
  K('B', 4.24, L.windO, 'o', { yawAbs: yB2, y: 1.5 }); K('B', 4.38, L.slam, 'i', { yawAbs: yB2 }); K('B', 4.7, L.slam, 'lin', { yawAbs: yB2, y: -0.55 });
  const yB2e = face('B', 5.0, yB2 + 180); K('B', 4.95, G, 'io', { yawAbs: yB2e }); K('B', 5.05, G);
  K('A', 3.85, G, 'io', { yawAbs: yA2 }); K('A', 3.96, L.duck, 'o', { yawAbs: yA2 }); K('A', 4.05, L.slide, 'o', { yawAbs: yA2, head: [-40, 0, 0] });
  K('A', 4.42, L.slide, 'lin', { yawAbs: yA2, y: -0.5 }); const yA2e = face('A', 4.85, yA2 + 180);
  K('A', 4.62, L.crouch, 'o', { yawAbs: (yA2 + yA2e) / 2 }); K('A', 4.8, G, 'io', { yawAbs: yA2e }); K('A', 4.9, G);
  clash(4.4, true, 'slam', { at: (cast, blade) => { const tip = blade('B', 4.44, [26])[0]; return [tip.x, W.floorAt(tip.x, tip.z) + 0.05, tip.z]; } });
  // ---- S3: A advances striking, B backs off parrying; thrust; B sidesteps and spin-counters
  K('A', 5.12, L.windR, 'o'); K('A', 5.3, L.slashR, 'i'); K('B', 5.14, L.parryL, 'o'); clash(5.3);
  K('A', 5.5, L.windL, 'o'); K('A', 5.7, L.slashL, 'i'); K('B', 5.52, L.parryR, 'o'); clash(5.7);
  K('A', 5.88, L.windO, 'o'); K('A', 6.1, L.slashO, 'i'); K('B', 5.92, L.parryH, 'o'); clash(6.1);
  K('A', 6.32, L.windT, 'o'); K('A', 6.5, L.thrust, 'i'); K('A', 6.7, L.thrust, 'lin', { chest: [8, 10, 0] });
  K('B', 6.3, L.parryH); K('B', 6.44, L.dodge, 'o'); K('B', 6.58, L.windR, 'o', { y: -0.3 });
  K('B', 6.8, L.spin, 'lin', { yawOff: -300 }); K('B', 6.95, L.slashR, 'o', { yawOff: -360 }); D.B = { yawOff: -360 }; K('B', 7.08, G);
  K('A', 6.82, L.parryR, 'o'); K('A', 6.98, L.parryR, 'lin', { y: -0.34 }); clash(6.95, true);
  // ---- S4: kick, A rolls back and springs up; B charges, A sidesteps, B skids past
  K('B', 7.12, L.kickW, 'o'); K('B', 7.25, L.kick, 'i'); K('B', 7.42, L.kick, 'lin'); K('B', 7.65, G, 'io');
  K('A', 7.15, G); K('A', 7.3, L.hitBack, 'o'); K('A', 7.48, L.slide, 'o'); K('A', 7.85, L.crouch, 'o'); K('A', 8.0, L.takeoff, 'o', { y: 0.35 }); K('A', 8.18, G, 'io');
  clash(7.27, false, 'kick', { at: () => { const q = pose('A', 7.3).pos; return [q[0], q[1] + 1.3, q[2]]; } });
  const yB4 = trav('B', 7.95, 8.6, -90);
  K('B', 7.82, L.crouch, 'o', { ...SW }); K('B', 7.95, L.crouch, 'lin', { ...SW, yawAbs: yB4 }); K('B', 8.3, L.guard, 'lin', { ...SW, yawAbs: yB4 });
  K('B', 8.45, L.windR, 'o', { yawAbs: yB4 }); K('B', 8.6, L.slashR, 'i', { yawAbs: yB4 }); K('B', 8.75, L.slide, 'o', { yawAbs: yB4 - 30, rArm: [-74, 0, -62], rElbow: [-4, 0, 0], wrist: 160 });
  const yB4e = face('B', 9.15, yB4 + 180); K('B', 9.0, L.slide, 'lin', { yawAbs: yB4e - 25, y: -0.45 }); K('B', 9.15, G, 'io', { yawAbs: yB4e }); K('B', 9.22, G);
  K('A', 8.35, G); K('A', 8.48, L.dodge, 'o', { waist: [10, 0, -22], chest: [6, 0, -12] }); K('A', 8.75, L.dodge, 'lin'); K('A', 9.0, G, 'io');
  // ---- S5: zig-zag dash, leaping slash, B blocks from the knee
  K('A', 9.1, G, 'io', { waist: [16, -14, 8] }); K('A', 9.38, G, 'io', { waist: [16, -14, -10], y: -0.24 }); K('A', 9.66, G, 'io', { waist: [16, -14, 10], y: -0.24 });
  K('A', 9.8, L.crouch, 'o', { y: -0.4 }); K('A', 9.9, L.takeoff, 'o', { y: 0.55 }); K('A', 9.98, L.windO, 'o', { y: 0.9 }); K('A', 10.1, L.slashO, 'i', { y: 0.2 }); K('A', 10.35, L.land, 'o'); K('A', 10.5, G, 'io');
  K('B', 9.4, G); K('B', 9.85, L.kneelG, 'o'); K('B', 10.0, L.kneelBlock, 'o'); K('B', 10.14, L.kneelBlock, 'lin', { y: -0.5 }); K('B', 10.45, G, 'io');
  clash(10.1, true);
  // ---- S6: fast circling flurry (5 clashes)
  K('A', 10.5, G); K('B', 10.5, G);
  K('B', 10.58, L.windR, 'o'); K('B', 10.68, L.slashR, 'i'); K('A', 10.6, L.parryL, 'o'); clash(10.68);
  K('A', 10.82, L.windL, 'o'); K('A', 10.98, L.slashL, 'i'); K('B', 10.85, L.parryR, 'o'); clash(10.98);
  K('B', 11.12, L.windO, 'o'); K('B', 11.28, L.slashO, 'i'); K('A', 11.15, L.parryH, 'o'); clash(11.28);
  K('A', 11.42, L.windR, 'o'); K('A', 11.58, L.slashR, 'i'); K('B', 11.45, L.parryL, 'o'); clash(11.58);
  K('B', 11.72, L.windL, 'o'); K('B', 11.88, L.slashL, 'i'); K('A', 11.75, L.parryR, 'o'); clash(11.88);
  K('A', 12.05, L.windO, 'o'); K('B', 12.08, L.windR, 'o');
  // ---- S7: bind drifting sideways, shove
  K('A', BIND_T, L.bind, 'i'); K('B', BIND_T, L.bind, 'i'); clash(BIND_T, true);
  for (let t = BIND_T + 0.12; t < BIND_END; t += 0.12) { const s = Math.sin(t * 40) * 0.5 + 0.5;
    K('A', t, L.bind, 'io', { chest: [22 + 8 * s, 10, 0], y: -0.3 - 0.06 * s, lArm: [-80 + 10 * s, 0, 30] }); K('B', t, L.bind, 'io', { chest: [22 + 8 * (1 - s), 10, 0], y: -0.3 - 0.06 * (1 - s) }); }
  K('B', 13.42, L.thrust, 'o', { rArm: [-80, 0, 0], lArm: [-90, 0, 20], lElbow: [-10, 0, 0], y: -0.3 }); K('B', 13.7, G, 'io');
  K('A', 13.45, L.hitBack, 'o'); K('A', 13.6, L.slide, 'o'); K('A', 14.0, L.slide, 'lin', { y: -0.48 }); K('A', 14.2, G, 'io');
  clash(13.42, false, 'kick', { at: () => { const q = pose('A', 13.45).pos; return [q[0], q[1] + 1.2, q[2]]; } });
  // ---- S8: low sweep, A hops it and chops down, B blocks from the knee
  K('B', 14.2, G); K('B', 14.42, L.sweepW, 'o'); K('B', 14.6, L.sweep, 'i'); K('B', 14.82, L.kneelG, 'o'); K('B', 14.95, L.kneelBlock, 'o'); K('B', 15.1, L.kneelBlock, 'lin', { y: -0.52 }); K('B', 15.45, G, 'io');
  K('A', 14.4, G); K('A', 14.52, L.crouch, 'o', { y: -0.35 }); K('A', 14.6, L.takeoff, 'o', { y: 0.8 }); K('A', 14.74, L.tuck, 'o', { y: 1.4 });
  K('A', 14.88, L.windO, 'o', { y: 0.8 }); K('A', 15.05, L.slashO, 'i'); K('A', 15.3, L.land, 'o'); K('A', 15.5, G, 'io');
  clash(15.05, true);
  // ---- S9: break apart; A sprints, LEAPS from the run; B springs up to meet it: mid-air clash; both blown apart
  K('A', 15.6, G); K('A', 16.2, G, 'io'); K('B', 15.6, G); K('B', 16.2, G, 'io'); BR.A.push([15.6, 16.3]); BR.B.push([15.6, 16.9]);
  const yA9 = trav('A', 16.35, 16.95, 0);
  K('A', 16.28, L.crouch, 'o', { ...SW, yawAbs: yA9 }); K('A', 16.35, L.crouch, 'lin', { ...SW, yawAbs: yA9 }); K('A', 16.8, L.guard, 'lin', { ...SW, yawAbs: yA9 });
  K('A', 16.92, L.crouch, 'o', { yawAbs: yA9, y: -0.35 }); K('A', 17.0, L.takeoff, 'o', { yawAbs: yA9, y: 1.0 }); K('A', 17.15, L.windO, 'o', { yawAbs: yA9, y: 1.9 });
  K('A', FLASH, L.slashO, 'i', { yawAbs: yA9, y: 1.35 }); K('A', 17.55, L.hitBack, 'o', { yawAbs: yA9, y: 1.1 }); K('A', 17.85, L.land, 'i', { yawAbs: yA9 });
  K('A', 18.1, L.slide, 'lin', { yawAbs: yA9, y: -0.45 }); K('A', 18.5, G, 'io', { yawAbs: yA9 }); K('A', 19.2, L.relaxed, 'io', { yawAbs: yA9 }); K('A', 19.45, L.flick, 'o', { yawAbs: yA9 }); K('A', 20, L.relaxed, 'io', { yawAbs: yA9 });
  const yB9 = near(yA9 + 180, 0);
  K('B', 16.6, G, 'io', { yawAbs: yB9 }); K('B', 17.05, L.crouch, 'o', { yawAbs: yB9, y: -0.45 }); K('B', 17.18, L.upperW, 'o', { yawAbs: yB9, y: -0.2 });
  K('B', FLASH, L.upper, 'i', { yawAbs: yB9, y: 1.1 }); K('B', 17.6, L.hitBack, 'o', { yawAbs: yB9, y: 0.5 }); K('B', 17.85, L.land, 'i', { yawAbs: yB9 });
  K('B', 18.1, L.slide, 'lin', { yawAbs: yB9, y: -0.45 }); K('B', FALL_T - 0.4, L.knees, 'io', { yawAbs: yB9 }); K('B', FALL_T, L.kneelG, 'o', { yawAbs: yB9 }); K('B', 20, L.kneelG, 'lin', { yawAbs: yB9, head: [20, 0, 0] });
  clash(FLASH, true, 'cross');
  BR.A.push([18.5, 20]);
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}
// helpers for buildAll: angle wrap toward a reference, planned position lookup before sorting is final
function near(a, ref) { while (a - ref > 180) a -= 360; while (a - ref < -180) a += 360; return a; }
function evalPosT(c, t) { const K_ = P[c].slice().sort((a, b) => a[0] - b[0]); return evalPos(K_, t); }
let BIND_C = [0, 0], SH = null;

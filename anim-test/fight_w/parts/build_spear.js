function buildAll() {
  // SWORD (A, Aegisblade) vs SPEAR (B, Boltspear). Spear style: fights at reach (~2 blocks) with fast one-hand jabs and
  // two-hand power thrusts, sweeps the legs, blocks and shoves with the shaft. Sword style: parries the point aside and
  // tries to get INSIDE the reach, where the spear is clumsy. Twirls: B's spear spin (start) and A's flourish (end) only.
  CANDS.B = ['spBlock', 'spBlockL', 'spBlockV', 'spBlockH', 'spGuard'];
  // the fight keeps travelling: strafes and presses over every exchange (see DRIFT in assemble_w.py)
  DRIFT.push([2.5, 3.45, 'strafeL', 1.9], [3.95, 4.6, 'strafeR', 2.1], [5.85, 7.0, 'pushA', 1.7], [7.5, 8.95, 'strafeL', 1.7], [11.7, 12.05, 'strafeR', 2.1], [12.32, 13.15, 'strafeR', 2.1], [14.05, 15.2, 'pushB', 1.5]);
  const AY = 0;
  // ================= S1 0-2.2  B spins the spear and levels it; A walks in =================
  at('A', 0, -3.6, 0); at('A', 2.2, -2.2, 0, 'io'); at('B', 0, 3.0, 0); at('B', 2.2, 2.6, 0, 'io');
  K('A', 0, G); K('A', 2.2, G); BR.A.push([0, 2.2]);
  K('B', 0, L.relaxed); K('B', 0.25, L.twirlF, 'io'); K('B', 1.05, L.twirlF, 'lin'); tw('B', 0.3, 1.05, 2); K('B', 1.3, L.spGuard, 'o'); K('B', 2.2, L.spGuard);
  // ================= S2 2.2-5.2  jabs at reach, A slips the power thrust, gets inside, B shoves him off ==============
  at('A', 2.75, 0.55, 0, 'io'); at('A', 3.0, 0.62, 0, 'io'); at('A', 3.25, 0.7, 0, 'io'); at('A', 3.45, 0.75, 0);
  hit('B', 'A', 2.75, 'spWind', 'spJab', 'parryL', false, 0.13); hit('B', 'A', 3.0, 'spWind', 'spJab', 'parryR', false, 0.12); hit('B', 'A', 3.25, 'spWind', 'spJab', 'parryL', false, 0.12);
  K('B', 3.4, L.spWind, 'o'); K('B', 3.65, L.spThrust, 'i'); at('B', 3.4, 2.6, 0); at('B', 3.65, 2.25, 0, 'o');               // power thrust: A sidesteps it
  K('A', 3.45, G); K('A', 3.55, L.dodge, 'o'); at('A', 3.72, 0.95, 0.75, 'o');
  at('A', 4.0, 1.32, 0.38, 'o'); K('A', 3.8, G, 'io');                                                                          // inside the reach
  hit('A', 'B', 4.15, 'windR', 'slashR', 'spBlock', false, 0.15); hit('A', 'B', 4.4, 'windL', 'slashL', 'spBlock', false, 0.13);
  K('B', 4.52, L.spBlock, 'o'); K('B', 4.65, L.spThrust, 'i'); clash(4.65, false, 'kick', { at: () => { const q = pose('A', 4.67).pos; return [q[0], q[1] + 1.25, q[2]]; } });
  K('A', 4.67, L.hitBack, 'o'); K('A', 4.8, L.skid, 'o'); K('A', 5.12, L.skid, 'lin'); K('A', 5.28, G, 'io'); at('A', 4.65, 1.32, 0.38); at('A', 5.15, 0.25, 0.4, 'o'); slide('A', 4.75, 5.15);
  at('B', 4.65, 2.25, 0); at('B', 5.05, 2.55, 0.05, 'io'); K('B', 5.0, L.spGuard, 'io');
  // ================= S3 5.2-7.7  leg sweep hopped, overhead rush (big), shaft overhead, thrust parried -> A slides =====
  at('B', 5.3, 2.35, 0.1, 'io'); K('B', 5.28, L.spSweepW, 'o'); K('B', 5.55, L.spSweep, 'i');
  at('A', 5.55, 0.4, 0.4); K('A', 5.36, L.crouch, 'o', { y: -0.3 }); K('A', 5.46, L.takeoff, 'o', { y: 0.75 }); K('A', 5.6, L.tuck, 'o', { y: 0.85 }); K('A', 5.76, L.land, 'o');
  at('A', 5.78, 0.45, 0.38); at('A', 6.05, 1.36, 0.18, 'o'); hit('A', 'B', 6.05, 'windO', 'slashO', 'spBlockH', true, 0.2);
  K('B', 5.75, L.spGuard, 'io'); at('B', 6.05, 2.33, 0.1);
  hit('B', 'A', 6.45, 'spOverW', 'spOver', 'parryH', false, 0.2); at('B', 6.6, 2.5, 0.1, 'io'); at('A', 6.45, 1.1, 0.2, 'io');
  hit('B', 'A', 6.85, 'spWind', 'spThrust', 'parryR', false, 0.16); at('B', 6.85, 2.35, 0.1, 'o'); at('A', 6.85, 0.95, 0.25);
  K('A', 7.0, L.skid, 'o'); K('A', 7.4, L.skid, 'lin'); K('A', 7.58, G, 'io'); at('A', 7.45, -0.3, 0.5, 'o'); slide('A', 6.98, 7.45);
  K('B', 7.1, L.spGuard, 'io');
  // ================= S4 7.7-10.6  stalking at reach, a jab, A ducks the thrust and comes up inside (big) ===============
  at('A', 8.45, 0.2, -0.5, 'io'); at('B', 7.4, 2.35, 0.1); at('B', 8.45, 1.7, 0.9, 'io'); BR.A.push([7.6, 8.6]);
  K('A', 8.0, G); K('B', 8.2, L.spGuard);
  hit('B', 'A', 8.9, 'spWind', 'spJab', 'parryL', false, 0.13); at('A', 8.9, 0.22, -0.48); at('B', 8.9, 1.7, 0.9);
  K('B', 9.12, L.spWind, 'o'); K('B', 9.32, L.spThrust, 'i');                                                                   // thrust over A's head
  K('A', 9.05, G); K('A', 9.2, L.duck, 'o'); K('A', 9.42, L.duck, 'lin'); at('A', 9.05, 0.22, -0.48); at('A', 9.45, 1.0, 0.25, 'o');
  K('A', 9.52, L.upperW, 'o'); K('A', 9.7, L.upper, 'i'); blk('B', 9.55, 9.7, 'spBlock'); clash(9.7, true); at('B', 9.7, 1.75, 0.92);
  K('B', 9.82, L.crouch, 'o', { y: -0.3 }); K('B', 9.92, L.takeoff, 'o', { y: 0.5 }); K('B', 10.15, L.land, 'o'); K('B', 10.3, L.skid, 'o'); K('B', 10.5, L.spGuard, 'io');
  at('B', 9.8, 1.78, 0.95); at('B', 10.4, 2.9, 1.9, 'o'); slide('B', 10.15, 10.45); K('A', 9.95, G, 'io');
  // ================= S5 10.6-13.8  running two-hand thrust parried aside, spinning sweep, trade, kick ==================
  RUN.B.push([10.85, 11.3]); at('B', 10.85, 2.9, 1.9); at('B', 11.45, 1.75, 0.95, 'lin');
  K('B', 10.85, L.spGuard); K('B', 11.3, L.spWind, 'o'); K('B', 11.5, L.spThrust, 'i');
  at('A', 11.38, 1.0, 0.28); blk('A', 11.38, 11.5, 'parryR'); clash(11.5); at('A', 11.8, 0.6, 1.1, 'o'); at('B', 11.8, 1.08, -0.22, 'o');
  K('A', 11.65, L.dodge, 'o'); K('A', 11.85, G, 'io');
  K('B', 11.7, L.spGuard, 'io'); K('B', 11.95, L.spSweepW, 'o', { yawOff: -160 }); K('B', 12.2, L.spSweep, 'i', { yawOff: -360 }); D.B = { yawOff: -360 };
  blk('A', 12.06, 12.2, 'parryR', {}, { y: -0.3 }); clash(12.2);
  K('B', 12.35, L.spGuard, 'io');
  hit('A', 'B', 12.55, 'windL', 'slashL', 'spBlock', false, 0.15); hit('A', 'B', 12.85, 'windR', 'slashR', 'spBlock', false, 0.15);
  K('B', 13.02, L.kickW, 'o'); K('B', 13.15, L.kick, 'i'); K('B', 13.4, L.spGuard, 'io'); clash(13.15, false, 'kick', { at: () => { const q = pose('A', 13.17).pos; return [q[0], q[1] + 1.2, q[2]]; } });
  K('A', 13.17, L.hitBack, 'o'); K('A', 13.3, L.skid, 'o'); K('A', 13.68, L.skid, 'lin'); K('A', 13.85, G, 'io'); at('A', 13.15, 0.6, 1.1); at('A', 13.7, 0.0, 2.7, 'o'); slide('A', 13.28, 13.7);
  at('B', 13.6, 0.92, 0.22);
  // ================= S6 13.8-16.9  five-jab flurry; A beats the last one wide (big), spins in, shaft-blade bind ==========
  { const a0 = evalPosT('A', 13.7), b0 = evalPosT('B', 13.6), dx = a0[0] - b0[0], dz = a0[1] - b0[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    for (let i = 0; i < 5; i++) { const t = +(14.2 + 0.22 * i).toFixed(2);
      at('B', t, b0[0] + ux * (0.5 + 0.12 * i), b0[1] + uz * (0.5 + 0.12 * i), 'io'); at('A', t, a0[0] - ux * 0.12 * i, a0[1] - uz * 0.12 * i, 'io');
      hit('B', 'A', t, 'spWind', 'spJab', i % 2 ? 'parryR' : 'parryL', i === 4, 0.11); }
    K('B', 15.25, L.spGuard, 'o');
    const bA = [a0[0] - ux * 0.62, a0[1] - uz * 0.62], bB = [b0[0] + ux * 1.0, b0[1] + uz * 1.0];   // A steps in to ~1.0
    at('A', 15.45, ...bA, 'o'); at('B', 15.45, ...bB, 'io');
    K('A', 15.25, L.spin, 'lin', { yawOff: -200 }); K('A', BIND_T, L.slashR, 'i', { yawOff: -360 }); D.A = { yawOff: -360 };
    blk('B', 15.3, BIND_T, 'spBlock'); clash(BIND_T, false);
    for (let t = BIND_T + 0.12; t < BIND_END; t += 0.12) { const s = Math.sin(t * 40) * 0.5 + 0.5;
      K('A', t, L.bind, 'io', { chest: [22 + 8 * s, 10, 0], y: -0.3 - 0.06 * s }); K('B', t, L.spBlock, 'io', { chest: [8 + 8 * (1 - s), -10, 0], y: -0.3 - 0.06 * (1 - s) }); }
    const px = -uz, pz = ux;
    at('A', BIND_END, bA[0] + px * 1.2, bA[1] + pz * 1.2, 'io'); at('B', BIND_END, bB[0] + px * 1.2, bB[1] + pz * 1.2, 'io');
    at('A', 16.7, bA[0] + px * 1.2 + ux * 1.6, bA[1] + pz * 1.2 + uz * 1.6, 'o'); at('B', 16.7, bB[0] + px * 1.2 - ux * 1.5, bB[1] + pz * 1.2 - uz * 1.5, 'o');
    K('A', 16.3, L.skid, 'o'); K('A', 16.65, L.skid, 'lin'); K('B', 16.3, L.skid, 'o'); K('B', 16.65, L.skid, 'lin'); slide('A', 16.25, 16.7); slide('B', 16.25, 16.7);
    K('A', 16.85, G, 'io'); K('B', 16.85, L.spGuard, 'io'); }
  // ================= S7 16.9-20  B's leaping two-hand thrust from above; A meets it rising (flash); face-off, A flourish ==
  { const a0 = evalPosT('A', 16.7), b0 = evalPosT('B', 16.7), dx = a0[0] - b0[0], dz = a0[1] - b0[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    at('A', 17.3, ...a0); at('B', 17.25, ...b0);
    at('B', FLASH, a0[0] - ux * 0.8, a0[1] - uz * 0.8, 'lin'); at('B', 18.3, a0[0] - ux * 2.9, a0[1] - uz * 2.9, 'o'); slide('B', 18.3, 18.6); at('B', 18.65, a0[0] - ux * 3.1, a0[1] - uz * 3.1, 'o');
    K('B', 17.25, L.spGuard); K('B', 17.35, L.crouch, 'o', { y: -0.35 }); K('B', 17.48, L.takeoff, 'o', { y: 0.9 }); K('B', 17.66, L.spOverW, 'o', { y: 1.5 });
    K('B', FLASH, L.spThrust, 'i', { y: 1.0 }); K('B', 18.05, L.hitBack, 'o', { y: 0.6 }); K('B', 18.3, L.land, 'i'); K('B', 18.45, L.skid, 'o'); K('B', 18.7, L.spGuard, 'io'); K('B', 20, L.spGuard);
    K('A', 17.45, G); K('A', 17.62, L.upperW, 'o'); K('A', FLASH, L.upper, 'i'); K('A', 18.15, G, 'io');
    clash(FLASH, true, 'cross');
    at('A', 18.3, a0[0] - ux * 0.25, a0[1] - uz * 0.25, 'o'); at('A', 20, a0[0] - ux * 0.25, a0[1] - uz * 0.25);
    K('A', 18.8, L.twirlS, 'io'); K('A', 19.5, L.twirlS, 'lin'); tw('A', 18.85, 19.5, 2); K('A', 19.75, G, 'io'); K('A', 20, G);
    BR.A.push([18.2, 20]); BR.B.push([18.6, 20]);
    export_cross.mid = [a0[0] - ux * 0.7, a0[1] - uz * 0.7]; export_cross.u = [-ux, -uz]; export_cross.p = [uz, -ux]; }
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}

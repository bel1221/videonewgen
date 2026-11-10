function buildAll() {
  // TEST 1 "BLADE DANCE" (10 s): A = Aegisblade vs B = Veilblade. Fencing footwork test: idle -> walk -> sprint, a travelling
  // exchange (DRIFT gait), parry/riposte, knockback slide + recovery steps, a slide past the opponent, edge-up blades.
  CANDS.A = ['parryL', 'parryR', 'parryH', 'parryLowR', 'parryLowL']; CANDS.B = CANDS.A.slice();
  // ---- 0-1.3 idle, B walks in
  at('A', 0, -3.6, 0); at('A', 1.25, -3.6, 0); at('B', 0, 4.6, 0.4); WALK.B.push([0.15, 1.25]); at('B', 1.3, 3.2, 0.1, 'lin');
  K('A', 0, L.relaxed); K('A', 0.9, L.relaxed); K('A', 1.25, L.ready, 'io'); K('B', 0, L.relaxed); K('B', 1.25, L.relaxed); K('B', 1.55, L.ready, 'io');
  // ---- 1.3-2.2 A sprints in, first cut
  RUN.A.push([1.3, 1.85]); at('A', 1.3, -3.6, 0); at('A', 1.92, 1.95, 0.05, 'lin'); at('B', 1.92, 3.2, 0.1);
  K('A', 1.3, L.sprintGo, 'io', SW); K('A', 1.75, L.sprintGo, 'lin', SW); K('A', 1.85, G, 'io');
  hit('A', 'B', 2.08, 'windR', 'slashR', 'parryL', false, 0.16);
  // ---- 2.1-4.1 travelling exchange (strafe), ends in a big cut that knocks A back into a slide
  DRIFT.push([2.15, 3.75, 'strafeL', 1.9]);
  hit('B', 'A', 2.42, 'windL', 'slashL', 'parryR', false, 0.15); hit('A', 'B', 2.72, 'windT', 'thrust', 'parryR', false, 0.15);
  hit('B', 'A', 3.02, 'windO', 'slashO', 'parryH', false, 0.17); hit('A', 'B', 3.32, 'windR', 'slashR', 'parryL', false, 0.15);
  hit('B', 'A', 3.66, 'windR', 'slashR', 'parryL', true, 0.2);
  K('A', 3.72, L.hitBack, 'o'); K('A', 3.84, L.skid, 'o'); K('A', 4.12, L.skid, 'lin'); K('A', 4.3, G, 'io');
  { const a = evalPosT('A', 3.66), b = evalPosT('B', 3.66), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz);
    at('A', 3.66, ...a); at('A', 4.15, b[0] + dx / d * (d + 1.3), b[1] + dz / d * (d + 1.3), 'o'); slide('A', 3.8, 4.15); at('B', 3.66, ...b); at('B', 4.4, ...b); }
  // ---- 4.4-6.5 B leaps in with an overhead; A blocks in front of his face, ducks the next cut and slides past B, spins and cuts
  { const a = evalPosT('A', 4.15), b = evalPosT('B', 4.4), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    at('B', 4.55, ...b); at('B', 5.15, a[0] - ux * 1.15, a[1] - uz * 1.15, 'o'); at('A', 5.15, ...a);
    K('B', 4.45, G); K('B', 4.62, L.crouch, 'o', { y: -0.3 }); K('B', 4.74, L.takeoff, 'o', { y: 0.7 }); K('B', 4.94, L.windO, 'o', { y: 1.0 }); K('B', 5.15, L.slashO, 'i', { y: 0.2 });
    blk('A', 4.98, 5.15, 'parryH', {}, { y: -0.25 }); clash(5.15, true); K('B', 5.32, L.land, 'o'); K('B', 5.45, G, 'io');
    K('B', 5.5, L.windL, 'o'); K('B', 5.66, L.slashL, 'i'); K('B', 5.85, G, 'io');                         // A slides under it
    const b2 = [a[0] - ux * 1.15, a[1] - uz * 1.15];
    at('A', 5.5, ...a); at('A', 5.68, a[0] - ux * 0.7 + px * 0.95, a[1] - uz * 0.7 + pz * 0.95, 'lin'); at('A', 5.98, b2[0] - ux * 1.2 + px * 0.6, b2[1] - uz * 1.2 + pz * 0.6, 'o');
    slide('A', 5.52, 5.98); K('A', 5.45, G); K('A', 5.55, L.slideLow, 'o'); K('A', 5.9, L.slideLow, 'lin');
    K('A', 6.0, L.spin, 'lin', { yawOff: -200 }); K('A', 6.2, L.slashR, 'i', { yawOff: -360 }); D.A = { yawOff: -360 };
    at('B', 5.85, ...b2); at('B', 6.2, ...b2); blk('B', 6.05, 6.2, 'parryR'); clash(6.2); K('A', 6.4, G, 'io'); }
  // ---- 6.5-8.2 A presses B back with a three-cut combo; the last parry knocks B back
  DRIFT.push([6.45, 7.75, 'pushA', 1.7]);
  hit('A', 'B', 6.78, 'windR', 'slashR', 'parryL', false, 0.15); hit('A', 'B', 7.08, 'windO', 'slashO', 'parryH', false, 0.17); hit('A', 'B', 7.42, 'windR', 'slashR', 'parryL', true, 0.18);
  K('B', 7.48, L.hitBack, 'o'); K('B', 7.6, L.skid, 'o'); K('B', 7.88, L.skid, 'lin'); K('B', 8.05, G, 'io');
  { const a = evalPosT('A', 7.42), b = evalPosT('B', 7.42), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz);
    at('B', 7.42, ...b); at('B', 7.9, a[0] + dx / d * (d + 1.2), a[1] + dz / d * (d + 1.2), 'o'); slide('B', 7.55, 7.9); at('A', 7.42, ...a);
    // ---- 8.2-10 reset: A walks back two steps, B levels his blade at A
    WALK.A.push([8.2, 9.3]); at('A', 8.15, ...a); at('A', 9.35, a[0] - dx / d * 1.1, a[1] - dz / d * 1.1, 'lin'); at('A', 10, a[0] - dx / d * 1.1, a[1] - dz / d * 1.1);
    at('B', 10, a[0] + dx / d * (d + 1.2), a[1] + dz / d * (d + 1.2)); }
  K('A', 7.7, G); K('A', 8.15, L.ready, 'io'); K('A', 10, L.ready);
  K('B', 8.5, G); K('B', 8.85, L.point, 'o'); K('B', 9.5, L.point, 'lin'); K('B', 10, L.ready, 'io');
  BR.A.push([8.2, 10]); BR.B.push([8.2, 10]);
  export_cross.mid = [0, 0]; export_cross.u = [1, 0]; export_cross.p = [0, 1];
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}

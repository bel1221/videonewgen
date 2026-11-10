function buildAll() {
  // TEST 3 "HAMMER VS BLADE" (10 s video): A = golem_hammer (two-handed) vs B = Aegisblade. Tests the heavy walk, a sprint run-in,
  // dodging slams (side-step slides + recovery), a swing that spins into a second swing (blocked, long knockback slide in SLOW
  // MOTION), a leaping overhead, a shove, and the calm end (hammer back on the ground, B walks off to the side).
  CANDS.A = ['hmBlock', 'hmBlockL', 'hmBlockV', 'hmGuard']; CANDS.B = ['parryL', 'parryR', 'parryH', 'parryLowR', 'parryLowL'];
  SLOWMO.push([4.8, 5.1, 0.35]);
  const slamAt = tt => (cast, blade) => { const tip = blade('A', tt, [18])[0]; return [tip.x, W.floorAt(tip.x, tip.z) + 0.05, tip.z]; };
  // ---- 0-1.3 the hammer rests on the sand; A heaves it up and walks in; B readies
  at('A', 0, -3.0, 0); at('A', 1.0, -3.0, 0); WALK.A.push([1.0, 2.0]); at('A', 2.05, -2.1, 0, 'lin'); at('B', 0, 4.2, 0);
  K('A', 0, L.hmRest); K('A', 0.55, L.hmRest); K('A', 1.0, L.hmGuard, 'o'); K('A', 2.0, L.hmGuard);
  K('B', 0, L.relaxed); K('B', 0.8, L.relaxed); K('B', 1.15, L.ready, 'io');
  // ---- 1.3-2.3 B sprints in and cuts; A takes it on the haft
  RUN.B.push([1.3, 1.85]); at('B', 1.3, 4.2, 0); at('B', 1.95, -0.85, 0, 'lin');
  K('B', 1.3, L.sprintGo, 'io', SW); K('B', 1.75, L.sprintGo, 'lin', SW); K('B', 1.85, G, 'io');
  hit('B', 'A', 2.12, 'windR', 'slashR', 'hmBlock', false, 0.16);
  // ---- 2.3-3.7 overhead SLAM (B side-steps into a slide), B's two quick cuts on the move
  { const a = evalPosT('A', 2.12), b = evalPosT('B', 2.12), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    K('A', 2.32, L.hmWindO, 'o'); K('A', 2.75, L.hmSlam, 'i'); K('A', 3.0, L.hmSlam, 'lin', { y: -0.42 }); K('A', 3.25, L.hmGuard, 'io');
    clash(2.75, true, 'slam', { at: slamAt(2.78) });
    K('B', 2.4, L.dodge, 'o'); K('B', 2.5, L.skid, 'o'); K('B', 2.78, L.skid, 'lin'); K('B', 2.92, G, 'io');
    at('B', 2.38, ...b); at('B', 2.8, b[0] + px * 1.3 - ux * 0.1, b[1] + pz * 1.3 - uz * 0.1, 'o'); slide('B', 2.46, 2.8); at('A', 2.32, ...a); at('A', 2.95, ...a); }
  DRIFT.push([2.95, 3.65, 'strafeR', 1.8]);
  hit('B', 'A', 3.1, 'windR', 'slashR', 'hmBlock', false, 0.15); hit('B', 'A', 3.38, 'windO', 'slashO', 'hmBlock', false, 0.17);
  // ---- 3.7-5.6 flat swing (B ducks), the momentum spins into a second swing: B blocks it and is blown away (SLOW MOTION)
  K('A', 3.7, L.hmWindS, 'o'); K('A', 4.1, L.hmSwing, 'i'); K('B', 3.9, L.duck, 'o'); K('B', 4.14, L.duck, 'lin'); K('B', 4.3, G, 'io');
  K('A', 4.42, L.hmSpin, 'lin', { yawOff: -200 }); K('A', 4.82, L.hmSwing, 'i', { yawOff: -360 }); D.A = { yawOff: -360 };
  blk('B', 4.66, 4.82, 'parryR'); clash(4.82, true);
  K('B', 4.88, L.hitBack, 'o'); K('B', 5.02, L.skid, 'o'); K('B', 5.45, L.skid, 'lin'); K('B', 5.62, G, 'io'); K('A', 5.1, L.hmGuard, 'io');
  { const a = evalPosT('A', 4.82), b = evalPosT('B', 4.82), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz);
    at('B', 4.82, ...b); at('B', 5.5, a[0] + dx / d * (d + 2.4), a[1] + dz / d * (d + 2.4), 'o'); slide('B', 4.95, 5.5); at('A', 4.82, ...a); at('A', 5.9, ...a);
    // ---- 5.8-7.6 B charges back and leaps into an overhead on the haft (big); A shoves him off into a slide
    const b2 = [a[0] + dx / d * (d + 2.4), a[1] + dz / d * (d + 2.4)];
    RUN.B.push([5.85, 6.3]); at('B', 5.85, ...b2); at('B', 6.32, a[0] + dx / d * 1.9, a[1] + dz / d * 1.9, 'lin'); at('B', 6.65, a[0] + dx / d * 1.2, a[1] + dz / d * 1.2, 'o');
    K('B', 5.85, L.sprintGo, 'io', SW); K('B', 6.22, L.sprintGo, 'lin', SW); K('B', 6.3, L.crouch, 'o', { y: -0.3 }); K('B', 6.4, L.takeoff, 'o', { y: 0.8 }); K('B', 6.52, L.windO, 'o', { y: 1.1 }); K('B', 6.65, L.slashO, 'i', { y: 0.3 });
    blk('A', 6.5, 6.65, 'hmBlock'); clash(6.65, true); K('B', 6.8, L.land, 'o'); K('B', 6.92, G, 'io');
    K('A', 6.88, L.hmBlock, 'o'); K('A', 7.0, L.hmBlock, 'i', { chest: [20, 0, 0], waist: [20, 0, 0] }); K('A', 7.25, L.hmGuard, 'io');
    clash(7.0, false, 'kick', { at: () => { const q = pose('B', 7.02).pos; return [q[0], q[1] + 1.2, q[2]]; } });
    K('B', 7.02, L.hitBack, 'o'); K('B', 7.14, L.skid, 'o'); K('B', 7.42, L.skid, 'lin'); K('B', 7.6, G, 'io');
    const b3 = [a[0] + dx / d * 2.4, a[1] + dz / d * 2.4];
    at('B', 7.0, a[0] + dx / d * 1.2, a[1] + dz / d * 1.2); at('B', 7.45, ...b3, 'o'); slide('B', 7.1, 7.45);
    // ---- 7.7-9.45 calm: A sets the hammer down on the sand; B walks off to the side, still facing A
    WALK.B.push([8.2, 9.3]); at('B', 8.15, ...b3); at('B', 9.35, b3[0] - dz / d * 1.1, b3[1] + dx / d * 1.1, 'lin'); at('B', 9.45, b3[0] - dz / d * 1.1, b3[1] + dx / d * 1.1); }
  K('A', 7.9, L.hmGuard); K('A', 8.6, L.hmRest, 'io'); K('A', 9.45, L.hmRest);
  K('B', 7.9, G); K('B', 8.3, L.ready, 'io'); K('B', 9.45, L.ready);
  BR.A.push([7.6, 9.45]); BR.B.push([7.6, 9.45]);
  export_cross.mid = [0, 0]; export_cross.u = [1, 0]; export_cross.p = [0, 1];
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}

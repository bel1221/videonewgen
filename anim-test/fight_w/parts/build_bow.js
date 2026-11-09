function buildAll() {
  // SWORD (A, Aegisblade) vs BOW (B, Voidbow, left hand). Bow style: keeps distance, shoots, hops back and kites
  // sideways, blocks with the bow and kicks when caught close, jump-shoots in mid-air, ends on a long charged shot.
  // Sword style: runs the archer down, cutting arrows out of the air, side-stepping the ones it can't reach.
  // Twirl: A's flourish at the end only.
  CANDS.B = ['bwBlock']; GKC.B = 0;
  DRIFT.push([4.85, 5.6, 'strafeL', 2.1], [9.5, 10.05, 'strafeR', 1.7], [10.6, 11.05, 'strafeL', 1.9]);
  // one shot: nock at tn, full draw, loose at t0, arrow arrives at t1. mode 'deflect' = A cuts it (swing R/L/O)
  const shoot = (tn, t0, t1, mode, swing = 'R', ex = {}, dB = {}) => {
    K('B', tn, L.bwNock, 'o', dB); K('B', Math.max(tn + 0.12, t0 - 0.3), L.bwDraw, 'o', dB); K('B', t0, L.bwDraw, 'lin', dB); K('B', t0 + 0.09, L.bwLoose, 'o', dB);
    arrow(tn, t0, t1, mode, ex);
    if (mode === 'deflect') { const [w, s] = { R: ['windR', 'slashR'], L: ['windL', 'slashL'], O: ['windO', 'slashO'] }[swing];
      K('A', t1 - 0.14, L[w], 'o'); K('A', t1, L[s], 'i'); clash(t1, !!ex.big, 'arrow', { at: (cast, blade) => blade('A', t1, [16])[0].toArray() }); }
    if (mode === 'ground') clash(t1, false, 'arrowg', { at: (cast, blade) => { const q = pose('A', t1).pos, x = q[0] + (ex.dx || 0), z = q[2] + (ex.dz || 0); return [x, W.floorAt(x, z), z]; } });
  };
  // ================= S1 0-1.9  the first arrow from far away; A cuts it out of the air (impact frame) =================
  at('A', 0, -6.5, 0); at('A', 1.9, -6.4, 0); at('B', 0, 5.5, 0); at('B', 3.3, 5.5, 0);
  K('A', 0, G); K('A', 1.3, G); K('B', 0, L.bwIdle);
  shoot(0.35, 1.3, 1.65, 'deflect', 'R', { big: true }); K('A', 1.85, G, 'io');
  // ================= S2 1.9-4.6  A charges; arrows cut / side-stepped on the run; B hops back =================
  RUN.A.push([1.95, 2.42]); at('A', 1.95, -6.4, 0); at('A', 2.45, -4.4, 0.05, 'lin'); at('A', 2.65, -3.65, 0.05, 'lin'); RUN.A.push([2.72, 3.05]); at('A', 3.05, -2.3, 0.1, 'lin');
  K('A', 1.95, L.crouch, 'io', SW); K('A', 2.4, L.guard, 'lin', SW);
  shoot(1.75, 2.38, 2.65, 'deflect', 'L');
  K('A', 2.75, L.guard, 'lin', SW); K('A', 3.08, L.dodge, 'o'); at('A', 3.22, -1.75, 0.75, 'o');                     // side-step the third
  shoot(2.75, 3.06, 3.24, 'dodge', 'R', { dx: 0.0, dz: -0.6 });
  K('B', 3.3, L.crouch, 'o', { y: -0.3 }); K('B', 3.42, L.takeoff, 'o', { y: 0.6 }); K('B', 3.68, L.land, 'o'); K('B', 3.8, L.skid, 'o'); at('B', 3.4, 5.5, 0); at('B', 3.95, 7.0, 0.1, 'o'); slide('B', 3.7, 3.95);
  RUN.A.push([3.3, 4.15]); at('A', 3.3, -1.75, 0.75); at('A', 4.2, 2.6, 0.3, 'lin'); K('A', 3.3, L.crouch, 'io', SW); K('A', 4.05, L.guard, 'lin', SW);
  shoot(3.98, 4.37, 4.45, 'deflect', 'R'); at('A', 4.45, 3.45, 0.2, 'lin');
  // ================= S3 4.6-7.6  caught close: bow block, ducked cut, kick; backflip jump-shot cut (impact frame) =======
  at('A', 4.95, 5.68, 0.1, 'o'); K('A', 4.7, G, 'io'); K('B', 4.6, L.bwIdle, 'io');
  hit('A', 'B', 5.05, 'windR', 'slashR', 'bwBlock', false, 0.15); at('B', 5.05, 7.0, 0.1);
  K('A', 5.2, L.windO, 'o'); K('A', 5.36, L.slashO, 'i'); K('B', 5.22, L.duck, 'o'); K('B', 5.4, L.duck, 'lin');
  K('B', 5.48, L.kickW, 'o'); K('B', 5.6, L.kick, 'i'); clash(5.6, false, 'kick', { at: () => { const q = pose('A', 5.62).pos; return [q[0], q[1] + 1.2, q[2]]; } });
  K('A', 5.62, L.hitBack, 'o'); K('A', 5.75, L.skid, 'o'); K('A', 5.98, L.skid, 'lin'); at('A', 5.6, 5.68, 0.1); at('A', 6.0, 4.55, 0.2, 'o'); slide('A', 5.72, 6.0);
  K('B', 5.72, L.crouch, 'o', { y: -0.35 }); K('B', 5.84, L.takeoff, 'o', { y: 1.0 });
  shoot(5.9, 6.17, 6.28, 'deflect', 'L', { big: true }, { y: 1.15 });
  K('B', 6.36, L.land, 'i'); K('B', 6.48, L.skid, 'o'); K('B', 6.75, L.bwIdle, 'io'); at('B', 5.75, 7.0, 0.1); at('B', 6.36, 8.9, 0.3, 'lin'); at('B', 6.75, 9.6, 0.4, 'o'); slide('B', 6.4, 6.75);
  K('A', 6.45, G, 'io');
  // ================= S4 7.0-9.6  kiting: B runs sideways, a warning arrow into the sand, A zig-zags in =================
  RUN.B.push([7.0, 7.62]); at('B', 7.0, 9.6, 0.4); at('B', 7.65, 9.0, 3.6, 'lin'); at('B', 7.85, 8.95, 3.75, 'o');
  K('B', 7.0, L.bwIdle); K('B', 7.6, L.bwIdle, 'lin');
  at('A', 7.0, 4.55, 0.2); at('A', 8.3, 4.6, 0.3); K('A', 7.2, G); BR.A.push([6.5, 8.3]);
  shoot(7.75, 8.18, 8.32, 'ground', 'R', { dx: 0.5, dz: 0.35 });
  RUN.A.push([8.42, 8.72]); at('A', 8.42, 4.6, 0.3); at('A', 8.75, 6.0, 1.8, 'lin'); K('A', 8.42, L.crouch, 'io', SW); K('A', 8.7, L.guard, 'lin', SW);
  K('A', 8.8, L.dodge, 'o', { waist: [10, 0, 22] }); at('A', 8.92, 6.35, 1.4, 'o');                                           // cut sideways: the arrow misses
  shoot(8.45, 8.83, 8.92, 'dodge', 'R', { dx: -0.5, dz: 0.4 });
  RUN.A.push([9.0, 9.3]); at('A', 9.0, 6.35, 1.4); at('A', 9.35, 7.55, 2.85, 'lin'); K('A', 9.0, L.crouch, 'io', SW); K('A', 9.28, L.guard, 'lin', SW);
  shoot(9.0, 9.43, 9.48, 'deflect', 'O'); at('A', 9.48, 7.85, 3.1, 'o');
  // ================= S5 9.6-12.3  overhead on the bow (impact frame), B spins out, point-blank shot cut, B rolls away =====
  hit('A', 'B', 9.85, 'windO', 'slashO', 'bwBlock', true, 0.2);
  K('B', 10.0, L.dodge, 'o', { yawOff: -200 }); K('B', 10.25, L.bwIdle, 'o', { yawOff: -360 }); D.B = { yawOff: -360 }; at('B', 9.85, 8.95, 3.75); at('B', 10.3, 9.9, 4.9, 'o');
  shoot(10.32, 10.65, 10.7, 'deflect', 'R');
  K('A', 10.95, L.windL, 'o'); K('A', 11.1, L.slashL, 'i'); at('A', 11.1, 8.55, 3.9, 'o');                                       // whiff: B hops back
  K('B', 10.95, L.crouch, 'o', { y: -0.3 }); K('B', 11.05, L.takeoff, 'o', { y: 0.5 }); K('B', 11.3, L.land, 'o'); at('B', 11.0, 9.9, 4.9); at('B', 11.45, 10.6, 6.2, 'o');
  K('B', 11.5, L.duck, 'o'); K('B', 11.9, L.duck, 'lin'); at('B', 11.95, 12.4, 4.4, 'o'); slide('B', 11.5, 11.95); K('B', 12.1, L.bwIdle, 'io');
  K('A', 11.3, G, 'io'); at('A', 11.6, 8.6, 3.95);
  // ================= S6 12.3-20  B sprints clear, a long CHARGED shot; A runs straight at it and cuts it (flash), ends at B's throat ==
  RUN.B.push([12.3, 12.95]); at('B', 12.3, 12.4, 4.4); at('B', 13.0, 13.4, 1.0, 'lin'); at('B', 13.2, 13.5, 0.8, 'o');
  K('B', 12.3, L.bwIdle); K('B', 12.95, L.bwIdle, 'lin');
  K('B', 13.4, L.bwNock, 'o'); K('B', 13.75, L.bwDraw, 'o'); K('B', FLASH - 0.08, L.bwDraw, 'lin', { head: [-8, 64, 0], chest: [-4, 0, 0] });
  K('B', FLASH - 0.02, L.bwLoose, 'o'); arrow(13.4, FLASH - 0.08, FLASH, 'deflect');
  { const b0 = evalPosT('B', 13.2), a1 = [8.6, 3.95];
    RUN.A.push([13.65, 14.62]); at('A', 13.6, ...a1); const dx = b0[0] - a1[0], dz = b0[1] - a1[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    at('A', 14.66, a1[0] + ux * 2.6, a1[1] + uz * 2.6, 'lin'); at('A', FLASH, a1[0] + ux * 3.0, a1[1] + uz * 3.0, 'o');
    K('A', 13.6, G); K('A', 13.65, L.crouch, 'io', SW); K('A', 14.55, L.guard, 'lin', SW); K('A', FLASH - 0.16, L.windR, 'o'); K('A', FLASH, L.slashR, 'i');
    clash(FLASH, true, 'cross', { at: (cast, blade) => blade('A', FLASH, [16])[0].toArray() });
    RUN.A.push([15.15, 15.55]); at('A', 15.15, a1[0] + ux * 3.0, a1[1] + uz * 3.0); at('A', 15.6, b0[0] - ux * 1.3, b0[1] - uz * 1.3, 'o');
    K('A', 15.15, L.crouch, 'io', SW); K('A', 15.5, L.guard, 'lin', SW); K('A', 15.72, L.point, 'o'); K('A', 16.9, L.point, 'lin');
    K('B', 15.3, L.bwNock, 'io'); K('B', 15.9, L.bwIdle, 'o', { head: [18, 0, 0], lArm: [-6, 0, 30] }); K('B', 20, L.bwIdle, 'lin', { head: [22, 0, 0], lArm: [-6, 0, 30] });
    K('A', 17.2, L.twirlS, 'io'); K('A', 17.9, L.twirlS, 'lin'); tw('A', 17.25, 17.9, 2); K('A', 18.2, L.point, 'io'); K('A', 20, L.point);
    at('A', 16.95, b0[0] - ux * 1.3, b0[1] - uz * 1.3); at('A', 17.3, b0[0] - ux * 2.1, b0[1] - uz * 2.1, 'io'); at('A', 20, b0[0] - ux * 2.1, b0[1] - uz * 2.1); at('B', 20, ...b0);   // steps back to twirl clear of the bow
    BR.A.push([15.6, 20]); BR.B.push([15.6, 20]);
    export_cross.mid = [a1[0] + ux * 3.5, a1[1] + uz * 3.5]; export_cross.u = [ux, uz]; export_cross.p = [-uz, ux]; }
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}

function buildAll() {
  // SWORD (A, Aegisblade) vs HEAVY TWO-HANDED HAMMER (B, golem_hammer). Hammer style: slow heavy wind-ups, ground slams
  // that crater the sand, wide swings whose momentum carries into a full spin, haft blocks and shoves. Sword style: never
  // meets a full swing head-on unless forced (and is blown back when it does); dodges, ducks, hops, then punishes the
  // recovery with fast cuts from different angles. Twirl: A's flourish at the start only.
  CANDS.B = ['hmBlock', 'hmBlockL', 'hmBlockV', 'hmGuard'];
  DRIFT.push([2.4, 3.4, 'strafeR', 1.3], [4.2, 5.0, 'strafeL', 2.1], [5.55, 6.3, 'strafeR', 1.7], [8.9, 9.4, 'pushA', 1.7], [9.5, 10.2, 'strafeL', 2.1], [12.95, 13.3, 'pushA', 1.3], [14.6, 15.25, 'strafeR', 1.9], [17.4, 18.6, 'strafeL', 0.8]);
  const slamAt = (tt) => (cast, blade) => { const tip = blade('B', tt, [18])[0]; return [tip.x, W.floorAt(tip.x, tip.z) + 0.05, tip.z]; };
  // ================= S1 0-2.4  B rests the hammer, heaves it onto the shoulder; A's flourish =================
  at('A', 0, -3.2, 0); at('A', 2.4, -2.6, 0.1, 'io'); at('B', 0, 3.0, 0); at('B', 2.4, 3.0, 0);
  K('B', 0, L.hmRest); K('B', 0.9, L.hmRest); K('B', 1.4, L.hmGuard, 'o'); K('B', 2.4, L.hmGuard);
  K('A', 0, L.relaxed); K('A', 0.3, L.twirlS, 'io'); K('A', 1.05, L.twirlS, 'lin'); tw('A', 0.35, 1.05, 2); K('A', 1.3, G, 'o'); K('A', 2.4, G);
  BR.B.push([0, 2.4]);
  // ================= S2 2.4-5.6  heavy advance, overhead SLAM (A dashes aside), A's three cuts on the haft, shove ======
  at('B', 3.4, 1.6, 0, 'io'); K('B', 2.9, L.hmGuard, 'io', { y: -0.26 }); K('B', 3.4, L.hmGuard, 'io');
  at('A', 3.5, 0.1, 0, 'io'); K('A', 3.5, G); K('A', 3.62, L.dodge, 'o'); at('A', 3.88, 0.3, 1.3, 'o');
  K('B', 3.45, L.hmWindO, 'o'); K('B', 3.9, L.hmSlam, 'i'); K('B', 4.15, L.hmSlam, 'lin', { y: -0.42 });
  clash(3.9, true, 'slam', { at: slamAt(3.94) });
  K('B', 4.2, L.hmGuard, 'io');
  at('A', 4.22, 0.75, 0.75, 'o'); K('A', 4.0, G, 'io');
  hit('A', 'B', 4.35, 'windR', 'slashR', 'hmBlock', false, 0.13); hit('A', 'B', 4.6, 'windL', 'slashL', 'hmBlock', false, 0.13); hit('A', 'B', 4.85, 'windO', 'slashO', 'hmBlock', false, 0.15);
  K('B', 4.98, L.hmBlock, 'o'); K('B', 5.1, L.hmBlock, 'i', { chest: [20, 0, 0], waist: [20, 0, 0] }); K('B', 5.35, L.hmGuard, 'io');
  clash(5.1, false, 'kick', { at: () => { const q = pose('A', 5.12).pos; return [q[0], q[1] + 1.25, q[2]]; } });
  K('A', 5.12, L.hitBack, 'o'); K('A', 5.25, L.skid, 'o'); K('A', 5.5, L.skid, 'lin'); K('A', 5.65, G, 'io'); at('A', 5.1, 0.75, 0.75); at('A', 5.5, -0.6, 0.6, 'o'); slide('A', 5.22, 5.5);
  // ================= S3 5.6-7.9  flat swing ducked, momentum spins into a second swing: A blocks it and is blown away =====
  at('A', 6.0, 0.2, 0.3, 'io'); at('B', 6.0, 1.6, 0);
  K('B', 5.75, L.hmWindS, 'o'); K('B', 6.2, L.hmSwing, 'i'); K('A', 5.98, L.duck, 'o'); K('A', 6.25, L.duck, 'lin'); K('A', 6.42, G, 'io');
  K('B', 6.48, L.hmSpin, 'lin', { yawOff: -200 }); K('B', 6.85, L.hmSwing, 'i', { yawOff: -360 }); D.B = { yawOff: -360 };
  blk('A', 6.68, 6.85, 'parryR'); clash(6.85, true);
  K('A', 6.9, L.hitBack, 'o'); K('A', 7.05, L.skid, 'o'); K('A', 7.45, L.skid, 'lin'); K('A', 7.65, G, 'io'); at('A', 6.85, 0.2, 0.3); at('A', 7.5, -2.2, 1.0, 'o'); slide('A', 6.95, 7.5);
  K('B', 7.1, L.hmGuard, 'io'); BR.B.push([7.0, 8.0]);
  // ================= S4 7.9-10.6  A sprints and leaps an overhead onto the haft; B's uppercut dodged; two side cuts ======
  RUN.A.push([8.0, 8.4]); at('A', 8.0, -2.2, 1.0); at('A', 8.45, -0.3, 0.5, 'lin');
  K('A', 8.0, L.crouch, 'io', SW); K('A', 8.4, L.crouch, 'o', { y: -0.35 }); K('A', 8.52, L.takeoff, 'o', { y: 0.8 }); K('A', 8.68, L.windO, 'o', { y: 1.3 }); K('A', 8.85, L.slashO, 'i', { y: 0.5 });
  at('A', 8.85, 0.42, 0.25, 'o'); blk('B', 8.68, 8.85, 'hmBlock'); clash(8.85); K('A', 9.0, L.land, 'o'); K('A', 9.15, G, 'io');
  K('B', 9.2, L.hmUpperW, 'o'); K('B', 9.45, L.hmUpper, 'i'); K('B', 9.7, L.hmGuard, 'io');
  K('A', 9.28, L.dodge, 'o'); at('A', 9.25, 0.42, 0.25); at('A', 9.5, 0.55, -0.62, 'o'); K('A', 9.55, G, 'io');
  hit('A', 'B', 9.8, 'windR', 'slashR', 'hmBlock', false, 0.14); hit('A', 'B', 10.05, 'windL', 'slashL', 'hmBlock', false, 0.13);
  at('B', 10.1, 1.6, 0); at('B', 10.55, 2.2, 0.1, 'o');
  // ================= S5 10.6-13.0  rage combo: slam (A rolls aside), flat swing (A hops back), uppercut parried (big) ====
  at('A', 10.9, 0.9, -0.4, 'io'); K('A', 10.7, G);
  K('B', 10.75, L.hmWindO, 'o'); K('B', 11.2, L.hmSlam, 'i'); K('B', 11.4, L.hmSlam, 'lin', { y: -0.42 }); clash(11.2, false, 'slam', { at: slamAt(11.24) });
  K('A', 10.98, L.dodge, 'o'); at('A', 11.18, 1.45, -1.35, 'o'); K('A', 11.3, G, 'io');
  K('B', 11.48, L.hmWindS, 'o'); K('B', 11.78, L.hmSwing, 'i');
  K('A', 11.52, L.crouch, 'o', { y: -0.3 }); K('A', 11.6, L.takeoff, 'o', { y: 0.6 }); K('A', 11.85, L.land, 'o'); at('A', 11.55, 1.45, -1.35); at('A', 11.85, 0.85, -2.2, 'o');
  K('B', 12.0, L.hmUpperW, 'o'); K('B', 12.3, L.hmUpper, 'i'); at('A', 12.22, 1.4, -1.1, 'o'); at('B', 12.3, 2.2, 0.1);
  blk('A', 12.15, 12.3, 'parryH'); clash(12.3, true);
  K('A', 12.42, L.hitBack, 'o', { y: 0.3 }); K('A', 12.58, L.skid, 'o'); K('A', 12.9, L.skid, 'lin'); K('A', 13.05, G, 'io'); at('A', 12.9, 0.4, -2.4, 'o'); slide('A', 12.55, 12.9);
  K('B', 12.6, L.hmGuard, 'io');
  // ================= S6 13.0-15.8  A circles in fast, cuts from three angles; low sweep hopped; overhead; haft shove ====
  { const c = evalPosT('B', 12.9), r = 1.15, a0 = Math.atan2(-2.4 - c[1], 0.4 - c[0]);
    [13.3, 13.6, 13.9].forEach((t, i) => { const a = a0 + (i + 1) * 0.75; at('A', t, c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, 'io'); });
    hit('A', 'B', 13.3, 'windR', 'slashR', 'hmBlock', false, 0.14); hit('A', 'B', 13.6, 'windL', 'slashL', 'hmBlock', false, 0.14); hit('A', 'B', 13.9, 'windO', 'slashO', 'hmBlock', true, 0.15);
    const a3 = a0 + 3 * 0.75; at('A', 14.4, c[0] + Math.cos(a3) * 1.35, c[1] + Math.sin(a3) * 1.35, 'io'); }
  K('B', 14.12, L.hmWindS, 'o'); K('B', 14.4, L.hmSweep, 'i'); K('B', 14.65, L.hmGuard, 'io');
  K('A', 14.24, L.crouch, 'o', { y: -0.3 }); K('A', 14.32, L.takeoff, 'o', { y: 0.8 }); K('A', 14.45, L.tuck, 'o', { y: 0.9 }); K('A', 14.62, L.land, 'o');
  hit('A', 'B', 14.95, 'windO', 'slashO', 'hmBlock', false, 0.18);
  K('B', 15.15, L.hmBlock, 'o'); K('B', 15.3, L.hmBlock, 'i', { chest: [20, 0, 0], waist: [20, 0, 0] }); K('B', 15.55, L.hmGuard, 'io');
  clash(15.3, false, 'kick', { at: () => { const q = pose('A', 15.32).pos; return [q[0], q[1] + 1.25, q[2]]; } });
  K('A', 15.32, L.hitBack, 'o'); K('A', 15.45, L.skid, 'o'); K('A', 15.85, L.skid, 'lin'); K('A', 16.0, G, 'io');
  { const a = evalPosT('A', 15.3), b = evalPosT('B', 15.3), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz);
    at('A', 15.3, ...a); at('A', 15.9, b[0] + dx / d * 3.6, b[1] + dz / d * 3.6, 'o'); slide('A', 15.42, 15.9); }
  // ================= S7 16-20  B's LEAPING SLAM (flash) - A slides clear of the crater; the hammer goes back on the shoulder ==
  { const a0 = evalPosT('A', 15.9), b0 = evalPosT('B', 15.3), dx = a0[0] - b0[0], dz = a0[1] - b0[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    at('B', 16.3, ...b0); at('B', FLASH, b0[0] + ux * 1.6, b0[1] + uz * 1.6, 'lin'); at('B', 20, b0[0] + ux * 1.6, b0[1] + uz * 1.6);
    K('B', 16.25, L.hmGuard); K('B', 16.35, L.crouch, 'o', { y: -0.4, lh: 1 }); K('B', 16.5, L.takeoff, 'o', { y: 1.0, lh: 1 }); K('B', 16.72, L.hmWindO, 'o', { y: 1.8 });
    K('B', FLASH, L.hmSlam, 'i'); K('B', 17.35, L.hmSlam, 'lin', { y: -0.42 }); K('B', 17.9, L.hmGuard, 'io'); K('B', 18.6, L.hmGuard); K('B', 19.3, L.hmRest, 'io'); K('B', 20, L.hmRest);
    clash(FLASH, true, 'slam', { at: slamAt(FLASH + 0.04) });
    at('A', 16.75, ...a0); at('A', 17.2, a0[0] + ux * 1.2, a0[1] + uz * 1.2, 'o'); slide('A', 16.85, 17.2);
    K('A', 16.6, G); K('A', 16.85, L.skid, 'o'); K('A', 17.15, L.skid, 'lin'); K('A', 17.4, G, 'io'); K('A', 18.4, L.point, 'o'); K('A', 19.2, L.point, 'lin'); K('A', 19.6, G, 'io'); K('A', 20, G);
    at('A', 20, a0[0] + ux * 1.2, a0[1] + uz * 1.2);
    BR.A.push([17.2, 20]); BR.B.push([17.4, 20]);
    export_cross.mid = [b0[0] + ux * 2.3, b0[1] + uz * 2.3]; export_cross.u = [ux, uz]; export_cross.p = [-uz, ux]; }
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}

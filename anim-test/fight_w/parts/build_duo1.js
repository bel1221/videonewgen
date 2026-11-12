function buildAll() {
  // DUO 40 - duel 1 of 2 (2 v 2, 37.3 s of animation + slow motion = 40 s of video): A = Blinkblade (blue team, skin 1) vs
  // B = Boltspear (red team, skin 3). Runs beside duel 2 (build_duo2.js: Jingu Bang vs Seekerbow) in the same arena; the shared
  // timeline and world coordinates are in duo_shared.js, the camera and everything that crosses the duels in duo_director.js.
  // Timings come from the weapons' weight classes (weapons() + whit / wsprint), built to notes/fight-animation-standard.md.
  weapons('blinkblade', 'boltspear'); spearSetup();
  CANDS.A = ['parryL', 'parryR', 'parryH', 'parryLowR', 'parryLowL']; CANDS.B = ['spBlock', 'spBlockL', 'spBlockV', 'spBlockH', 'spGuard'];
  const Z1 = -1.8;
  // ================= 0-3.7 intro: teams stand side by side; blue looks at each other first, then red =================
  at('A', 0, -5, Z1); at('B', 0, 5, Z1);
  K('A', 0, L.relaxed); K('A', 0.45, L.relaxed); K('A', 0.95, L.relaxed, 'io', { head: [2, -58, 0] }); K('A', 1.22, L.relaxed, 'io', { head: [12, -58, 0] }); K('A', 1.45, L.relaxed, 'io', { head: [2, -58, 0] });
  K('A', 1.95, L.relaxed, 'io'); K('A', 3.2, L.relaxed); K('A', 3.6, L.ready, 'io');
  K('B', 0, L.spIdle); K('B', 2.0, L.spIdle); K('B', 2.45, L.spIdle, 'io', { head: [2, 58, 0] }); K('B', 2.72, L.spIdle, 'io', { head: [12, 58, 0] }); K('B', 2.95, L.spIdle, 'io', { head: [2, 58, 0] });
  K('B', 3.3, L.spIdle, 'io'); K('B', 3.62, L.spReady, 'io');
  // ================= 3.7-4.9 both run in (same class, same speed), first clash, both recoil =================
  const tA = wsprint('A', T_GO, [-5, Z1], [-1.05, Z1]), tB = wsprint('B', T_GO, [5, Z1], [1.05, Z1], 'charge');
  K('A', T_GO + 0.02, L.sprintGo, 'io', SW); K('A', tA - 0.1, L.sprintGo, 'lin', SW); K('A', tA + 0.02, L.windR, 'io'); K('A', tA + 0.2, L.slashR, 'i');
  K('B', T_GO + 0.02, L.spCharge, 'io'); K('B', tA - 0.08, L.spCharge, 'lin'); K('B', tA + 0.04, L.spJabW, 'io'); K('B', tA + 0.2, L.spThrust1, 'i');
  const tc = tA + 0.2; clash(tc, true);
  for (const [c, s, g] of [['A', -1, G], ['B', 1, L.spGuard]]) { at(c, tc + 0.05, 1.05 * s, Z1); at(c, tc + 0.42, 1.8 * s, Z1, 'o'); slide(c, tc + 0.1, tc + 0.42); K(c, tc + 0.13, L.skid, 'o'); K(c, tc + 0.45, g, 'io'); }
  // ================= 4.9-6.6 the sword presses: three cuts on the move, the last one pushes the spear back =================
  mv('A', 'B', 4.92, 5.14, 1.55); whit('A', 'B', 5.34, 'windR', 'slashR', 'spBlock', { knock: false });
  DRIFT.push([5.36, 6.2, 'pushA', 1.5]);
  whit('A', 'B', 5.74, 'windT', 'thrust', 'spBlockV', { knock: false });
  whit('A', 'B', 6.16, 'windO', 'slashO', 'spBlockH', { rest: 'guard', defRest: 'spGuard' });
  // ================= 6.8-9.4 the spear answers: two jabs driving the sword back, a low sweep (hopped), a heavy thrust =================
  mv('B', 'A', 6.82, 7.06, 2.05); whit('B', 'A', 7.26, 'spJabW', 'spThrust1', 'parryL', { knock: false });
  DRIFT.push([7.28, 8.0, 'pushB', 1.5]);
  whit('B', 'A', 7.66, 'spJabW', 'spJab', 'parryR', { knock: false });
  K('B', 7.84, L.spSweepW, 'o'); K('B', 8.1, L.spSweep, 'i'); K('B', 8.3, L.spGuard, 'io');
  K('A', 7.9, L.crouch, 'o', { y: -0.3 }); K('A', 8.02, L.takeoff, 'o', { y: 0.62 }); K('A', 8.26, L.land, 'o'); K('A', 8.4, G, 'io'); mvd('A', 'B', 7.92, 8.26, 0.55);
  mv('B', 'A', 8.5, 8.76, 2.05); whit('B', 'A', 9.04, 'spWind', 'spThrust', 'parryR', { rest: 'spGuard' });   // 0.94 s after the sweep: a new attack, not a 4th hit of the combo
  // ================= 9.6-11.6 the sword runs in and SLIDES under an overhead that buries itself in the sand, comes up behind =========
  { const a = evalPosT('A', 9.72), b = evalPosT('B', 9.72), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    const t1 = wsprint('A', 9.74, a, [b[0] - ux * 1.5 + px * 0.5, b[1] - uz * 1.5 + pz * 0.5]);
    K('A', 9.76, L.sprintGo, 'io', SW); K('A', t1 - 0.04, L.sprintGo, 'lin', SW); K('A', t1 + 0.08, L.slideLow, 'o'); K('A', t1 + 0.5, L.slideLow, 'lin'); K('A', t1 + 0.72, G, 'io');
    at('A', t1 + 0.55, b[0] + ux * 1.45 + px * 0.75, b[1] + uz * 1.45 + pz * 0.75, 'o'); slide('A', t1 + 0.04, t1 + 0.55);
    K('B', t1 - 0.2, L.spOverW, 'o'); K('B', t1 + 0.14, L.spOver, 'i'); K('B', t1 + 0.4, L.spOver, 'lin', { y: -0.4 }); K('B', t1 + 0.66, L.spGuard, 'io');
    clash(t1 + 0.14, true, 'slam', { at: tipFloor('B', t1 + 0.16) }); at('B', 9.72, ...b); at('B', t1 + 0.42, ...b); at('B', t1 + 0.86, b[0] - px * 0.5 - ux * 0.15, b[1] - pz * 0.5 - uz * 0.15, 'io');   // he STEPS round to face the sword behind him (turning on planted feet crossed his legs)
    whit('A', 'B', t1 + 1.14, 'windR', 'slashR', 'spBlock', { rest: 'guard', defRest: 'spGuard' }); }
  // ================= 12.4-14.4 circling exchange: jab, riposte, jab =================
  mv('B', 'A', 12.36, 12.6, 2.0); DRIFT.push([12.62, 14.3, 'strafeL', 1.7]);
  whit('B', 'A', 12.86, 'spJabW', 'spJab', 'parryL', { knock: false, rest: 'spGuard' });
  mv('A', 'B', 13.0, 13.2, 1.6, 'o'); whit('A', 'B', 13.46, 'windO', 'slashO', 'spBlockH', { knock: false, rest: 'guard' });
  mv('B', 'A', 13.62, 13.8, 2.0, 'o'); whit('B', 'A', 14.02, 'spJabW', 'spThrust1', 'parryR', { knock: false, rest: 'spGuard' });
  // ================= CLOSE CALL 1 (slow motion 14.86-15.31): the spear head comes straight at the face; the sword leans out of its line =====
  K('B', 14.5, L.spJabW, 'o'); K('B', 15.1, L.spJab, 'i', { head: [-14, 4, 0] }); K('B', 15.3, L.spJab, 'lin'); K('B', 15.5, L.spGuard, 'io'); mv('B', 'A', 14.48, 14.86, 2.0, 'o');
  K('A', 14.74, G, 'io'); K('A', 15.04, L.dodge, 'o'); K('A', 15.26, L.dodge, 'lin'); lat('A', 'B', 14.9, 15.16, 0.62);
  // ...and kicks him away: the spear is driven into the sand to brake the slide
  K('A', 15.32, L.kickW, 'o'); K('A', 15.5, L.kick, 'i'); K('A', 15.74, G, 'io'); clash(15.5, false, 'kick', { at: chest('B', 15.52) });
  K('B', 15.54, L.hitBack, 'o', { y: 0.1 }); K('B', 15.68, L.skid, 'o'); K('B', 15.86, L.spBrake, 'o'); K('B', 16.5, L.spBrake, 'lin'); K('B', 16.78, L.spGuard, 'io');
  at('A', 15.5, ...evalPosT('A', 15.5)); mvd('B', 'A', 15.5, 16.52, 2.5); slide('B', 15.62, 16.52);
  for (let ts = 15.9; ts < 16.5; ts += 0.08) clash(+ts.toFixed(2), false, 'drag', { at: tipFloor('B', ts) });
  // ================= 16.9-17.9 the sword follows up: two cuts, the second throws the spear far back =================
  { const a = evalPosT('A', 16.6), b = evalPosT('B', 16.6), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz), t1 = wsprint('A', 16.62, a, [b[0] + dx / d * 1.6, b[1] + dz / d * 1.6]);
    K('A', 16.64, L.sprintGo, 'io', SW); K('A', t1 - 0.06, L.sprintGo, 'lin', SW); K('A', t1 + 0.06, G, 'io'); at('B', 16.6, ...b); at('B', 17.2, ...b); }
  whit('A', 'B', 17.32, 'windR', 'slashR', 'spBlock', { knock: false });
  whit('A', 'B', 17.74, 'windO', 'slashO', 'spBlockH', { rest: 'guard', defRest: 'spGuard', knockK: 2.3 });
  // ================= 18.1-19.6 TEAM WORK: he sees his archer down under the staff, runs across and kicks the staff fighter off =================
  { const SHOVE_A = W_(SHOVE_A_W, T_SHOVE), a = evalPosT('A', 18.1), d = Math.hypot(SHOVE_A[0] - a[0], SHOVE_A[1] - a[1]), t0 = T_SHOVE - 0.13 - d / (WEAPON_DATA.runBase * WGT.A.move), ry = Math.atan2(SHOVE_A[0] - a[0], SHOVE_A[1] - a[1]) * 180 / Math.PI;
    const f0 = face('A', t0 - 0.2, ry);
    K('A', t0 - 0.2, G, 'io', { yawAbs: f0, head: [-6, ry - f0, 0] }); RUN.A.push([t0, T_SHOVE - 0.13]); at('A', t0, ...a); at('A', T_SHOVE - 0.13, ...SHOVE_A, 'lin'); at('A', T_SHOVE + 0.5, ...SHOVE_A);
    K('A', t0 + 0.04, L.sprintGo, 'io', { ...SW, yawAbs: ry }); K('A', T_SHOVE - 0.2, L.sprintGo, 'lin', { ...SW, yawAbs: ry }); K('A', T_SHOVE - 0.12, L.kickW, 'o', { yawAbs: 0 }); K('A', T_SHOVE, L.kick, 'i', { yawAbs: 0 });
    K('A', T_SHOVE + 0.26, G, 'io', { yawAbs: 0 });
    // ...glances down at his teammate, then turns to meet the spear charging back in
    K('A', T_SHOVE + 0.6, L.ready, 'io', { yawAbs: -70, head: [14, -30, 0] }); const tb = 20.25, fb = () => face('A', tb, 110);
    at('A', 19.75, ...SHOVE_A); at('A', tb, SHOVE_A[0] + 1.15, SHOVE_A[1] - 0.9, 'io'); }
  // the spear, thrown back at 17.74, gets up and charges across at him
  { const b = evalPosT('B', 18.6); K('B', 18.5, L.spGuard, 'io'); K('B', 19.3, L.spReady, 'io'); at('B', 19.5, ...b);
    const sa = W_(SHOVE_A_W, T_SHOVE), t1 = wsprint('B', Math.max(19.2, 20.2 - Math.hypot(sa[0] + 3.2 - b[0], sa[1] - 1.95 - b[1]) / (WEAPON_DATA.runBase * WGT.B.move)), b, [sa[0] + 3.2, sa[1] - 1.95], 'charge');
    K('B', t1 - 0.6, L.spCharge, 'io'); K('B', t1 - 0.06, L.spCharge, 'lin'); K('B', t1 + 0.1, L.spGuard, 'io'); }
  K('A', 20.25, G, 'io', { yawAbs: face('A', 20.25, -70) }); K('A', 20.5, G, 'io');
  // ================= 20.7-23.4 they meet again: thrust parried, cut blocked, the fight drifts back to its own side =================
  mv('B', 'A', 20.55, 20.8, 2.05); whit('B', 'A', 21.02, 'spWind', 'spThrust', 'parryL', { knock: false, rest: 'spGuard' });
  DRIFT.push([21.05, 23.3, 'strafeR', 1.5]);
  mv('A', 'B', 21.2, 21.4, 1.55, 'o'); whit('A', 'B', 21.66, 'windR', 'slashR', 'spBlock', { knock: false });
  whit('A', 'B', 22.08, 'windT', 'thrust', 'spBlockV', { rest: 'guard', defRest: 'spGuard' });
  mv('B', 'A', 22.7, 22.92, 2.0); whit('B', 'A', 23.14, 'spJabW', 'spJab', 'parryR', { knock: false, rest: 'spGuard' });
  // ================= 23.5-25.4 JUMP ATTACK: the sword leaps and comes down on the raised shaft; the spear shoves him off into a slide =========
  { const a = evalPosT('A', 23.5), b = evalPosT('B', 23.5), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    at('A', 23.5, ...a); at('A', 23.72, a[0] - ux * 0.5, a[1] - uz * 0.5, 'io'); at('A', 24.36, b[0] - ux * 1.25, b[1] - uz * 1.25, 'io'); at('B', 23.5, ...b); at('B', 24.5, ...b);
    K('A', 23.74, L.crouch, 'o', { y: -0.32 }); K('A', 23.9, L.takeoff, 'o', { y: 0.85 }); K('A', 24.14, L.windO, 'o', { y: 1.15 }); K('A', 24.36, L.slashO, 'i', { y: 0.3 }); K('A', 24.52, L.land, 'o');
    blk('B', 24.18, 24.36, 'spBlockH'); clash(24.36, true);
    K('B', 24.56, L.kickW, 'o', { lh: 0 }); K('B', 24.74, L.kick, 'i', { lh: 0 }); K('B', 24.98, L.spGuard, 'io'); clash(24.74, false, 'kick', { at: chest('A', 24.76) });
    K('A', 24.78, L.hitBack, 'o', { y: 0.08 }); K('A', 24.92, L.skid, 'o'); K('A', 25.24, L.skid, 'lin'); K('A', 25.44, G, 'io');
    at('A', 24.74, b[0] - ux * 1.25, b[1] - uz * 1.25); at('A', 25.28, b[0] - ux * 3.0, b[1] - uz * 3.0, 'o'); slide('A', 24.86, 25.28); }
  // ================= 25.6-27.0 the spear presses the tired sword: jab, jab, then a low sweep takes his legs - he goes down =================
  mv('B', 'A', 25.5, 25.74, 2.0); whit('B', 'A', 25.94, 'spJabW', 'spThrust1', 'parryL', { knock: false });
  whit('B', 'A', 26.3, 'spJabW', 'spJab', 'parryR', { knock: false });
  K('B', 26.46, L.spSweepW, 'o'); K('B', 26.72, L.spSweep, 'i'); K('B', 26.94, L.spGuard, 'io'); clash(26.72, false, 'kick', { at: () => { const q = pose('A', 26.74).pos; return [q[0], q[1] + 0.35, q[2]]; } });
  K('A', 26.6, G, 'io'); K('A', 26.78, L.hitBack, 'o', { y: 0.16 }); K('A', 27.14, L.lieBack, 'o'); K('A', 28.5, L.lieBack);
  { const a = evalPosT('A', 26.72), b = evalPosT('B', 26.72), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz);
    at('A', 26.72, ...a); at('A', 27.12, a[0] + dx / d * 0.75, a[1] + dz / d * 0.75, 'o'); at('A', 28.6, a[0] + dx / d * 0.75, a[1] + dz / d * 0.75); at('B', 26.74, ...b); }
  // he steps over him and raises the spear for the finishing plunge...
  mv('B', 'A', 27.0, 27.4, 1.2); K('B', 27.42, L.gsPlungeW, 'o', { y: 0.0 }); K('B', 28.02, L.gsPlungeW, 'lin', { y: 0.0, chest: [-14, 0, 0] });
  // ================= CLOSE CALL 2 (slow motion 28.02-28.47): the plunge starts down - the archer's arrow knocks the spear out of his hands =====
  K('B', T_XHIT, L.gsPlungeW, 'i', { y: 0.0, rArm: [-128, 0, -8], rElbow: [-30, 0, 0], chest: [6, 0, 0], waist: [8, 0, 0] });
  K('B', T_XHIT + 0.12, L.hitBack, 'o', { rArm: [-150, 0, -50] }); K('B', T_XHIT + 0.5, L.guard, 'io', { rArm: [-30, 0, -20], rElbow: [-40, 0, 0] }); mvd('B', 'A', T_XHIT + 0.02, T_XHIT + 0.5, 0.45);
  clash(T_XHIT, true, 'arrow', { at: (cast, blade) => blade('B', T_XHIT, [XHIT_ALONG])[0].toArray() });
  // the sword rolls to a knee and cuts him down
  K('A', 28.74, L.kneelG, 'o'); K('A', 28.94, L.windR, 'o'); K('A', 29.2, L.slashR, 'i'); K('A', 29.42, L.slashR, 'lin'); K('A', 29.75, G, 'io'); mv('A', 'B', 28.76, 29.12, 1.3, 'o');
  clash(29.2, true, 'kick', { at: chest('B', 29.22) });
  K('B', 29.0, L.guard, 'io', { rArm: [-30, 0, -20], rElbow: [-40, 0, 0] }); K('B', 29.24, L.hitBack, 'o'); K('B', 29.72, L.knees, 'o', { lh: 0 }); K('B', 30.1, L.knees, 'lin', { lh: 0 }); K('B', T_FALL1, L.fallen, 'o'); K('B', TOTAL, L.fallen);
  { const b = evalPosT('B', 29.2), a = evalPosT('A', 29.2), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz); at('B', 29.2, ...b); at('B', 29.7, b[0] + dx / d * 0.6, b[1] + dz / d * 0.6, 'o'); at('B', TOTAL, b[0] + dx / d * 0.6, b[1] + dz / d * 0.6); }
  // ================= 30.6-37.3 the winners: he lowers the sword, walks to his archer, they look at each other (the intro, mirrored) =========
  { const END_A = W_(END_A_W, 31), a = evalPosT('A', 30.6), wy = Math.atan2(END_A[0] - a[0], END_A[1] - a[1]) * 180 / Math.PI, f0 = face('A', 30.9, wy);
    K('A', 30.5, L.relaxed, 'io'); K('A', 30.9, L.relaxed, 'io', { yawAbs: f0 }); K('A', 31.3, L.relaxed, 'io', { yawAbs: wy }); WALK.A.push([31.3, 32.9]); at('A', 31.25, ...a); at('A', 32.95, ...END_A, 'lin'); at('A', TOTAL, ...END_A);
    K('A', 32.9, L.relaxed, 'lin', { yawAbs: wy }); K('A', 33.4, L.relaxed, 'io', { yawAbs: near(90, wy) }); K('A', 33.9, L.relaxed, 'io', { yawAbs: near(90, wy), head: [2, -56, 0] }); K('A', 34.5, L.relaxed, 'io', { yawAbs: near(90, wy), head: [10, -56, 0] });
    K('A', 34.9, L.relaxed, 'io', { yawAbs: near(90, wy), head: [2, -56, 0] }); K('A', 35.6, L.relaxed, 'io', { yawAbs: near(90, wy) }); K('A', TOTAL, L.relaxed, 'lin', { yawAbs: near(90, wy) }); }
  BR.A.push([30.4, TOTAL]);
  export_cross.mid = [0, 0]; export_cross.u = [1, 0]; export_cross.p = [0, 1];
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}

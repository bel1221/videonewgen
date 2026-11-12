function buildAll() {
  // DUO 40 - duel 2 of 2: A = Jingu Bang (red team, skin 4: a wooden kung-fu staff - sweeps, spins, overheads, thrusts) vs
  // B = Seekerbow (blue team, skin 2, left hand: keeps distance, shoots, hops and slides away, blocks with the bow, kicks when caught).
  // Runs beside duel 1 (build_duo1.js). Shared timeline and coordinates: duo_shared.js. Cross-duel moments: duo_director.js.
  weapons('jingu bang', 'seekerbow'); spearSetup(); OFFH.B = 'r';   // the archer's bow is in the left hand: his free hand is the right one
  CANDS.A = ['spBlock', 'spBlockL', 'spBlockV', 'spBlockH', 'spGuard']; CANDS.B = ['bwBlock']; GKC.B = 0;
  // BOW HOLD (user, 2026-11-12: "bow gripping looks wrong ... not what it looked like in the grid image test"). As on the reference sheet: the
  // fist on the riser, the bow UPRIGHT in front of the body on a half-raised arm, string toward the archer. Before, the idle hold let the bow
  // hang slanted from a lowered arm, and every non-bow pose (crouch, run, dodge, hit...) carried a SWORD blade direction into the bow hand.
  const BOW_ARM = { lArm: [-62, 0, 8], lElbow: [-20, 0, 0] }, BOW_UP = bdv(80, 0);
  L.bwIdle = S(L.bwIdle, BOW_ARM); L.bwIdle.bd = BOW_UP.slice();
  L.bwStand = S(L.relaxed, { ...BOW_ARM, rArm: [-4, 0, -10], rElbow: [-10, 0, 0] }); L.bwStand.bd = BOW_UP.slice();   // intro / outro: standing straight (idle legs are never bent)
  for (const n of ['bwIdle', 'bwStand', 'bwNock', 'bwDraw', 'bwLoose', 'bwBlock']) L[n]._bw = 1;
  const Z2 = 1.8; let SHOVE_B, SHOVE_S, X_ARCHER, END_B;   // world points -> this duel's keyed positions (W_ undoes the drift), set where they are used
  // one shot: nock at tn, full draw, loose at t0, the arrow arrives at t1. dB = pose overrides for the archer (yawAbs for a shot elsewhere)
  const shoot = (tn, t0, t1, mode, ex = {}, dB = {}) => {
    K('B', tn, L.bwNock, 'o', dB); K('B', Math.max(tn + 0.12, t0 - 0.3), L.bwDraw, 'o', dB); K('B', t0, L.bwDraw, 'lin', dB); K('B', t0 + 0.09, L.bwLoose, 'o', dB);
    arrow(tn, t0, t1, mode, ex);
    if (mode === 'deflect') clash(t1, !!ex.big, 'arrow', { at: (cast, blade) => blade('A', t1, [ex.along ?? 8])[0].toArray() });
    if (mode === 'ground') clash(t1, false, 'arrowg', { at: () => { const q = pose('A', t1).pos, x = q[0] + (ex.dx || 0), z = q[2] + (ex.dz || 0); return [x, W.floorAt(x, z), z]; } });
  };
  // ================= 0-3.7 intro: blue (the archer) looks at the sword first, then red (the staff) looks at the spear =================
  at('A', 0, 5, Z2); at('B', 0, -5, Z2);
  K('B', 0, L.bwStand); K('B', 0.5, L.bwStand); K('B', 1.0, L.bwStand, 'io', { head: [2, 58, 0] }); K('B', 1.26, L.bwStand, 'io', { head: [12, 58, 0] }); K('B', 1.5, L.bwStand, 'io', { head: [2, 58, 0] }); K('B', 2.0, L.bwStand, 'io'); K('B', 3.3, L.bwStand);
  K('A', 0, L.spIdle); K('A', 2.05, L.spIdle); K('A', 2.5, L.spIdle, 'io', { head: [2, -58, 0] }); K('A', 2.76, L.spIdle, 'io', { head: [12, -58, 0] }); K('A', 3.0, L.spIdle, 'io', { head: [2, -58, 0] });
  K('A', 3.34, L.spIdle, 'io'); K('A', 3.64, L.spReady, 'io');
  // ================= 3.7-4.9 the staff charges; the first arrow is spun out of the air; the archer hops back =================
  const tA = wsprint('A', T_GO, [5, Z2], [-2.9, Z2], 'charge'); K('A', T_GO + 0.02, L.spCharge, 'io'); K('A', tA - 0.06, L.spCharge, 'lin'); K('A', tA + 0.12, L.spGuard, 'io');
  shoot(3.42, 4.0, 4.16, 'deflect', { along: 6, big: true }); wtw('A', 3.98, 4.36, 1);
  K('B', 4.22, L.crouch, 'o', { y: -0.3 }); K('B', 4.34, L.takeoff, 'o', { y: 0.6 }); K('B', 4.6, L.land, 'o'); K('B', 4.72, L.skid, 'o'); K('B', 4.92, L.bwIdle, 'io');
  at('B', 4.3, -5, Z2); at('B', 4.86, -6.3, 2.6, 'o'); slide('B', 4.62, 4.86);
  // ================= 5.0-6.9 caught: thrust on the bow, a low sweep (hopped), an overhead that knocks the archer back =================
  mv('A', 'B', 4.9, 5.14, 1.95); whit('A', 'B', 5.36, 'spJabW', 'spThrust1', 'bwBlock', { knock: false });
  K('A', 5.52, L.spSweepW, 'o'); K('A', 5.78, L.spSweep, 'i'); K('A', 5.98, L.spGuard, 'io');
  K('B', 5.6, L.crouch, 'o', { y: -0.3 }); K('B', 5.72, L.takeoff, 'o', { y: 0.62 }); K('B', 5.96, L.land, 'o'); K('B', 6.1, L.bwIdle, 'io');
  { const b = evalPosT('B', 5.6); at('B', 5.6, ...b); at('B', 5.96, b[0] + 0.5, b[1] + 0.9, 'o'); }
  mv('A', 'B', 6.02, 6.24, 1.95); whit('A', 'B', 6.52, 'spOverW', 'spOver', 'bwBlock', { rest: 'spGuard', defRest: 'bwIdle', knockK: 1.4 });
  // ================= 7.0-9.4 the archer kicks free, runs for room, turns and shoots twice: one side-stepped, one into the sand at his feet ====
  mv('A', 'B', 7.02, 7.22, 1.5);
  K('B', 7.2, L.kickW, 'o'); K('B', 7.38, L.kick, 'i'); clash(7.38, false, 'kick', { at: chest('A', 7.4) });
  K('A', 7.42, L.hitBack, 'o'); K('A', 7.56, L.skid, 'o'); K('A', 7.84, L.skid, 'lin'); K('A', 8.02, L.spGuard, 'io'); mvd('A', 'B', 7.38, 7.86, 1.0); slide('A', 7.52, 7.86);
  { const b = evalPosT('B', 7.45), to = [-2.6, 4.3], ry = Math.atan2(to[0] - b[0], to[1] - b[1]) * 180 / Math.PI, f0 = face('B', 7.44, ry);
    K('B', 7.44, L.bwIdle, 'o', { yawAbs: f0 }); const t1 = wsprint('B', 7.5, b, to); K('B', 7.54, L.sprintGo, 'io', { yawAbs: ry }); K('B', t1 - 0.06, L.sprintGo, 'lin', { yawAbs: ry });
    at('B', t1 + 0.1, ...to); const f1 = face('B', t1 + 0.22, ry); K('B', t1 + 0.22, L.bwIdle, 'io', { yawAbs: f1 });
    shoot(t1 + 0.3, t1 + 0.74, t1 + 0.86, 'dodge', { dx: 0, dz: -0.55 }); const td = t1 + 0.86;
    K('A', td - 0.2, L.spGuard, 'io'); K('A', td - 0.04, L.dodge, 'o'); K('A', td + 0.2, L.dodge, 'lin'); K('A', td + 0.36, L.spGuard, 'io'); lat('A', 'B', td - 0.16, td + 0.06, 0.7);
    shoot(td + 0.12, td + 0.5, td + 0.62, 'ground', { dx: -0.5, dz: 0.25 });
    // the staff runs him down
    const a = evalPosT('A', td + 0.66), ta = wsprint('A', td + 0.68, a, [to[0] + 1.75, to[1] - 0.45], 'charge'); K('A', td + 0.7, L.spCharge, 'io'); K('A', ta - 0.06, L.spCharge, 'lin'); K('A', ta + 0.1, L.spGuard, 'io'); }
  // ================= 9.9-12.3 melee: thrust on the bow, a swing ducked, the archer slides under a sweep and shoots point blank (blocked) =====
  whit('A', 'B', 10.06, 'spJabW', 'spThrust1', 'bwBlock', { knock: false });
  K('A', 10.3, L.spSweepW, 'o', { y: -0.1 }); K('A', 10.54, L.spOver, 'i', { rArm: [-80, 0, 34], chest: [10, 34, 0], waist: [12, 20, 0] }); K('A', 10.76, L.spGuard, 'io');
  K('B', 10.36, L.duck, 'o'); K('B', 10.6, L.duck, 'lin'); K('B', 10.76, L.bwIdle, 'io');
  { const a = evalPosT('A', 10.8), b = evalPosT('B', 10.8), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    K('A', 10.86, L.spSweepW, 'o'); K('A', 11.1, L.spSweep, 'i'); K('A', 11.34, L.spGuard, 'io'); at('A', 10.8, ...a); at('A', 11.4, ...a);
    K('B', 10.92, L.slideLow, 'o'); K('B', 11.34, L.slideLow, 'lin'); K('B', 11.52, L.bwIdle, 'io');
    at('B', 10.84, ...b); at('B', 11.14, a[0] - ux * 0.15 + px * 1.3, a[1] - uz * 0.15 + pz * 1.3, 'lin'); at('B', 11.5, a[0] + ux * 1.45 + px * 1.15, a[1] + uz * 1.45 + pz * 1.15, 'o'); slide('B', 10.94, 11.48); }   // round the outside of the sweep, not through it
  shoot(11.56, 11.96, 12.04, 'deflect', { along: 2, big: true }); K('A', 11.8, L.spBlockV, 'o'); K('A', 12.04, L.spBlockV, 'lin'); K('A', 12.3, L.spGuard, 'io');
  // ================= 12.4-17.2 the staff takes over: he drives the archer across the sand with combinations =================
  mv('A', 'B', 12.36, 12.6, 1.95); DRIFT.push([12.64, 13.6, 'pushA', 1.4]);
  whit('A', 'B', 12.84, 'spJabW', 'spThrust1', 'bwBlock', { knock: false }); whit('A', 'B', 13.24, 'spOverW', 'spOver', 'bwBlock', { knock: false });
  whit('A', 'B', 13.7, 'spJabW', 'spThrust1', 'bwBlock', { rest: 'spGuard', defRest: 'bwIdle', knockK: 1.6 });
  // the archer backs off shooting; the staff walks the arrow down behind an upright block
  { const tn = 14.5; shoot(tn, tn + 0.44, tn + 0.56, 'deflect', { along: 4 }); K('A', tn + 0.3, L.spBlockV, 'o'); K('A', tn + 0.56, L.spBlockV, 'lin'); K('A', tn + 0.8, L.spGuard, 'io'); }
  // run to the place where the two duels cross: the archer is driven to SHOVE_B
  SHOVE_B = W_(SHOVE_B_W, T_SHOVE); SHOVE_S = W_(SHOVE_S_W, T_SHOVE);
  { const b = evalPosT('B', 15.15), to = [SHOVE_B[0] - 1.0, SHOVE_B[1] + 0.2], ry = Math.atan2(to[0] - b[0], to[1] - b[1]) * 180 / Math.PI, f0 = face('B', 15.14, ry);
    K('B', 15.14, L.bwIdle, 'o', { yawAbs: f0 }); const t1 = wsprint('B', 15.2, b, to); K('B', 15.24, L.sprintGo, 'io', { yawAbs: ry }); K('B', t1 - 0.06, L.sprintGo, 'lin', { yawAbs: ry });
    at('B', t1 + 0.12, ...to); const f1 = face('B', t1 + 0.24, ry); K('B', t1 + 0.24, L.bwIdle, 'io', { yawAbs: f1 });
    const a = evalPosT('A', 15.3), ta = wsprint('A', 15.36, a, [to[0] + 2.6, to[1] - 0.1], 'charge'); K('A', 15.38, L.spCharge, 'io'); K('A', ta - 0.06, L.spCharge, 'lin'); K('A', ta + 0.1, L.spGuard, 'io'); }
  mv('A', 'B', 16.5, 16.72, 1.95); whit('A', 'B', 16.94, 'spJabW', 'spThrust1', 'bwBlock', { knock: false });
  whit('A', 'B', 17.36, 'spOverW', 'spOver', 'bwBlock', { knock: false, rest: 'spGuard' });
  // ================= 17.6-19.0 a low sweep takes the archer's legs; the staff steps in and raises for the finish =================
  K('A', 17.6, L.spSweepW, 'o'); K('A', 17.86, L.spSweep, 'i'); K('A', 18.08, L.spGuard, 'io'); clash(17.86, false, 'kick', { at: () => { const q = pose('B', 17.88).pos; return [q[0], q[1] + 0.35, q[2]]; } });
  K('B', 17.72, L.bwIdle, 'io'); K('B', 17.92, L.hitBack, 'o', { y: 0.16 }); K('B', 18.3, L.lieBack, 'o'); K('B', 19.4, L.lieBack);
  at('B', 17.86, ...evalPosT('B', 17.86)); at('B', 18.28, ...SHOVE_B, 'o'); at('B', 19.6, ...SHOVE_B);
  at('A', 18.1, ...evalPosT('A', 18.1)); at('A', 18.46, ...SHOVE_S, 'io'); K('A', 18.52, L.spOverW, 'o'); K('A', T_SHOVE, L.spOverW, 'lin', { chest: [-18, -10, 0] });
  // ================= T_SHOVE 19.05 TEAM WORK: the sword's kick (duel 1) throws him off; he slides and brakes by planting the staff =========
  clash(T_SHOVE, true, 'kick', { at: chest('A', T_SHOVE + 0.02) });
  K('A', T_SHOVE + 0.04, L.hitBack, 'o', { y: 0.12 }); K('A', T_SHOVE + 0.2, L.skid, 'o'); K('A', T_SHOVE + 0.4, L.spBrake, 'o'); K('A', 20.1, L.spBrake, 'lin'); K('A', 20.42, L.spGuard, 'io');
  at('A', T_SHOVE, ...SHOVE_S); at('A', 20.12, SHOVE_S[0] + 0.3, SHOVE_S[1] + 2.9, 'o'); slide('A', T_SHOVE + 0.14, 20.12);
  for (let ts = T_SHOVE + 0.46; ts < 20.08; ts += 0.08) clash(+ts.toFixed(2), false, 'drag', { at: tipFloor('A', ts, 15) });
  // the archer gets up
  K('B', 19.78, L.kneelG, 'o'); K('B', 20.2, L.bwIdle, 'io');
  // ================= 20.3-24.6 round two: an arrow spun aside, a slam the archer side-steps, a kick, a thrust that drives him back =========
  { const b = evalPosT('B', 20.3); at('B', 20.3, ...b); at('B', 20.9, b[0] - 1.9, b[1] + 0.5, 'io'); }
  shoot(20.5, 21.02, 21.14, 'deflect', { along: 5 }); wtw('A', 20.96, 21.36, 1);
  { const a = evalPosT('A', 21.4), b = evalPosT('B', 21.4), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    const t1 = wsprint('A', 21.42, a, [b[0] - ux * 1.9, b[1] - uz * 1.9], 'charge'); K('A', 21.44, L.spCharge, 'io'); K('A', t1 - 0.06, L.spCharge, 'lin');
    K('A', t1 + 0.08, L.spOverW, 'o'); K('A', t1 + 0.42, L.spOver, 'i'); K('A', t1 + 0.66, L.spOver, 'lin', { y: -0.4 }); K('A', t1 + 0.9, L.spGuard, 'io'); clash(t1 + 0.42, true, 'slam', { at: tipFloor('A', t1 + 0.44, 15) });
    K('B', t1 + 0.2, L.dodge, 'o'); K('B', t1 + 0.34, L.skid, 'o'); K('B', t1 + 0.62, L.skid, 'lin'); K('B', t1 + 0.8, L.bwIdle, 'io');
    at('B', t1 + 0.18, ...b); at('B', t1 + 0.64, b[0] + px * 1.35 + ux * 0.2, b[1] + pz * 1.35 + uz * 0.2, 'o'); slide('B', t1 + 0.3, t1 + 0.64); at('A', t1 + 0.95, b[0] - ux * 1.9, b[1] - uz * 1.9); }
  mv('B', 'A', 22.9, 23.1, 1.45, 'o'); K('B', 23.08, L.kickW, 'o'); K('B', 23.26, L.kick, 'i'); K('B', 23.5, L.bwIdle, 'io'); clash(23.26, false, 'kick', { at: chest('A', 23.28) });
  K('A', 23.3, L.hitBack, 'o'); K('A', 23.44, L.skid, 'o'); K('A', 23.7, L.skid, 'lin'); K('A', 23.88, L.spGuard, 'io'); mvd('A', 'B', 23.26, 23.72, 0.9); slide('A', 23.4, 23.72);
  mv('A', 'B', 23.9, 24.12, 1.95); whit('A', 'B', 24.4, 'spJabW', 'spThrust1', 'bwBlock', { rest: 'spGuard', defRest: 'bwIdle', knockK: 1.7 });
  // ================= 24.9-27.2 the staff LEAPS for the finish; the archer slides out from under it; the staff buries itself; point-blank shot ====
  { const a = evalPosT('A', 24.95), b = evalPosT('B', 24.95), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    X_ARCHER = W_(X_ARCHER_W, 26); END_B = W_(END_B_W, 31);
    at('A', 24.95, ...a); at('A', 25.15, a[0] - ux * 0.4, a[1] - uz * 0.4, 'io'); at('A', 25.78, b[0] - ux * 1.5, b[1] - uz * 1.5, 'io'); at('A', TOTAL, b[0] - ux * 1.5, b[1] - uz * 1.5);
    K('A', 25.16, L.crouch, 'o', { y: -0.32 }); K('A', 25.32, L.takeoff, 'o', { y: 0.85, lh: 0 }); K('A', 25.56, L.spOverW, 'o', { y: 1.15 }); K('A', 25.78, L.spOver, 'i', { y: 0.2 }); K('A', 26.0, L.spOver, 'lin', { y: -0.42, plant: 1 }); K('A', 26.3, L.spOver, 'lin', { y: -0.42, plant: 1 });
    clash(25.78, true, 'slam', { at: tipFloor('A', 25.8, 15) });
    K('B', 25.5, L.dodge, 'o'); K('B', 25.62, L.slideLow, 'o'); K('B', 25.96, L.slideLow, 'lin'); at('B', 25.46, ...b); at('B', 26.0, ...X_ARCHER, 'o'); at('B', TOTAL - 6.4, ...X_ARCHER); slide('B', 25.6, 26.0);
    shoot(26.04, 26.44, 26.5, 'hit');
    K('A', 26.54, L.hitBack, 'o', { y: 0.1 }); K('A', 26.9, L.knees, 'o', { lh: 0 }); K('A', T_FALL2, L.fallen, 'o'); K('A', TOTAL, L.fallen); clash(26.5, true, 'kick', { at: chest('A', 26.52) }); }
  // ================= 27.3-28.4 he sees his teammate on the ground under the spear: turns, draws, and shoots the spear out of the enemy's hands ====
  { const tg = [XSPEAR[0], XSPEAR[1]], ya = Math.atan2(tg[0] - X_ARCHER_W[0], tg[1] - X_ARCHER_W[1]) * 180 / Math.PI, f0 = face('B', 27.0, ya), YA = { yawAbs: ya };
    K('B', 26.72, L.bwIdle, 'io'); K('B', 27.0, L.bwIdle, 'io', { yawAbs: f0, head: [-4, (ya - f0) * 0.5, 0] }); K('B', 27.34, L.bwIdle, 'io', YA);
    shoot(T_XNOCK, T_XLOOSE, T_XHIT, 'x', {}, YA);
    K('B', 28.7, L.bwStand, 'io', YA); K('B', 30.6, L.bwStand, 'lin', YA);
    // ================= 30.6-37.3 the winners: he walks to the sword; they stand side by side and look at each other =================
    const wy = Math.atan2(END_B_W[0] - X_ARCHER_W[0], END_B_W[1] - X_ARCHER_W[1]) * 180 / Math.PI, w1 = near(wy, ya), e = near(90, w1);
    K('B', 31.1, L.bwStand, 'io', { yawAbs: w1 }); WALK.B.push([31.15, 32.7]); at('B', 31.1, ...X_ARCHER); at('B', 32.75, ...END_B, 'lin'); at('B', TOTAL, ...END_B);
    K('B', 32.7, L.bwStand, 'lin', { yawAbs: w1 }); K('B', 33.3, L.bwStand, 'io', { yawAbs: e }); K('B', 33.95, L.bwStand, 'io', { yawAbs: e, head: [2, 56, 0] }); K('B', 34.55, L.bwStand, 'io', { yawAbs: e, head: [10, 56, 0] });
    K('B', 34.95, L.bwStand, 'io', { yawAbs: e, head: [2, 56, 0] }); K('B', 35.6, L.bwStand, 'io', { yawAbs: e }); K('B', TOTAL, L.bwStand, 'lin', { yawAbs: e }); }
  BR.B.push([30.4, TOTAL]);
  // every key of the archer that is not a bow pose keeps the bow upright on the half-raised arm (lying down: the bow lies along the body)
  for (const k of T.B) if (!k[1]._bw) { const down = k[1].tilt && Math.abs(k[1].tilt[0]) > 60; k[1] = S(k[1], { bd: down ? bdv(6, 80) : bdv(74, 6), ...(down ? {} : { lArm: [-56, 0, 10], lElbow: [-26, 0, 0] }) }); k[1]._bw = 1; }
  export_cross.mid = [0, 0]; export_cross.u = [1, 0]; export_cross.p = [0, 1];
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}

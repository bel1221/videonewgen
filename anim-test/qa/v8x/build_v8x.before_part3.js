function buildAll() {
  // V8X = the v8 "blade masters" remake (user, 2026-11-12), 37.75 s of animation + 2 slow-motion moments = 40.0 s of video.
  // A = Aegisblade vs B = Veilblade, both at the reference sheet's size and grip (medium class). What changed against v8:
  //   + split-panel face intro like bolt30 (0-2.9 s), heads down, slowly looking up
  //   - the duplicate jump attack at 17 s (S8's hop-and-cut) and the blade lock at 20 s ("hugging") are gone
  //   + one new exchange (N1): run in, cut, riposte, a thrust that misses the face in slow motion, a kick into a slide
  //   + new ending: A ducks under the cut and runs B through the chest, holds, pulls the sword out; B drops; logo outro
  //   ~ every wind-up at least 0.22 s, no flurry over 3 hits (weight class), twirls only in the opening (user: once or twice a video),
  //     the free hand flows instead of sitting raised (assemble_w.py freeArm), no corner texts
  // v8's own scenes are kept as they were and moved in time by W8(); the body below is build_v8.js with the cuts above.
  weapons('aegisblade', 'veilblade');
  const LN = 3.55, TEND = TOTAL - 0.8 - LN;                               // N1's length; the end of the animation in v8's own time
  const W8 = t => t < 17.9 ? t + 2.9 : t < 21.5 ? t + 2.1 : t < 24.58 ? t + 0.8 : t + 0.8 + LN;
  SLOWMO.push([27.0, 27.45, 0.25], [W8(26.38) - 0.12, W8(26.38) + 0.18, 0.25]);   // the close call, and the stab
  // ================= 0-2.9 face intro: both stand with their heads down and slowly look up =================
  k('A', 0, S(L.relaxed, { head: [30, 0, 0] })); k('A', 0.4, S(L.relaxed, { head: [30, 0, 0] }), 'lin'); k('A', 2.3, S(L.relaxed, { head: [-12, 0, 0] }), 'io'); k('A', 2.86, L.relaxed, 'io');
  k('B', 0, S(L.relaxed, { head: [32, 0, 0] })); k('B', 0.6, S(L.relaxed, { head: [32, 0, 0] }), 'lin'); k('B', 2.45, S(L.relaxed, { head: [-10, 0, 0] }), 'io'); k('B', 2.88, L.relaxed, 'io');
  BR.A.push([0, 2.9]); BR.B.push([0, 2.9]);
  // ================= v8, time-warped =================
  const wrap = o => ({ A: { push: (...ws) => ws.forEach(w => o.A.push([W8(w[0]), W8(w[1])].concat(w.slice(2)))) }, B: { push: (...ws) => ws.forEach(w => o.B.push([W8(w[0]), W8(w[1])].concat(w.slice(2)))) } });
  const noTw = p => (p === L.twirlS || p === L.twirlF);                    // twirls only in the opening (old time < 2.4)
  (function (k, at, clash, RUN, BR, PARRY, evalPosT, face, pose, FLASH, tw, sprint) {
  const D = { A: {}, B: {} };                                         // persistent per-character overrides (spin offsets)
  const K = (c, t, pose, e, d) => k(c, t, pose, e, { ...D[c], ...(d || {}) });
  const SW = { rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 };   // sword trailing low while sprinting
  const STRIKE = { R: ['windR', 'slashR', 'parryL'], L: ['windL', 'slashL', 'parryR'], O: ['windO', 'slashO', 'parryH'], T: ['windT', 'thrust', 'parryR'] };
  // defence keys go through blk(): the parry pose is re-chosen in fight.js (parryL/R/H, whichever meets the real blade)
  const blk = (def, t0, t1, name, d1 = {}, d2 = {}, e0 = 'o') => { const b0 = { ...D[def] }; K(def, t0, L[name], e0, d1); K(def, t1, L[name], 'lin', d2);
    const k2 = T[def][T[def].length - 1], k1 = T[def][T[def].length - 2]; PARRY.push({ t: t1, def, apply: n => { k1[1] = S(L[n], { ...b0, ...d1 }); k2[1] = S(L[n], { ...b0, ...d2 }); } }); };
  const ex = (att, def, t, s, big = false, wind = 0.16) => { const [w, sl, pa] = STRIKE[s]; wind = Math.max(wind, 0.22); /* medium swords: a real wind-up (weight class) */ K(att, t - wind, L[w], 'o'); K(att, t, L[sl], 'i'); blk(def, t - wind + 0.02, t, pa, {}, s === 'T' ? { waist: [10, 0, -18] } : {}); clash(t, big); };
  // ================= SHARED sword work (user reviews 2026-11-13; every part built from here on uses these) =================
  // What part 1 taught, measured with qa/v8x/part_check.mjs + jitter_probe.js (rules in notes/fight-animation-standard.md):
  //   - hits about 2.1 blocks apart so the blades meet mid-blade, clashes at head / chest level (never above the heads);
  //   - the sword stays beside and in front of the body: the overhead wind-up, a forward-leaning guard and the low sprint carry all
  //     sat inside the blade-is-solid push-out and were thrown 60-128 deg in one frame (the jitter);
  //   - a cut is one even-speed 0.3 s sweep that stops ON the guard; the defender's sword travels to the guard over the whole gap;
  //   - hits 0.5 s or more apart; a knock-back is a real slide (1.4-3 blocks) that runs straight into the next move, never a wait.
  const far = (o = {}) => Object.assign(CLASHES[CLASHES.length - 1], { gap: 1.4, fwMax: 0.2, hmin: 0.95, hmax: 1.45, ...o });   // spacing + contact height for the clash just keyed
  const SWm = { rArm: [-10, 0, -20], rElbow: [-62, 0, 0], bd: bdv(28, -18) };                               // run carry: sword at the hip pointing forward-up
  const midWind = S(L.windR, { rArm: [-72, 0, -72], rElbow: [-58, 0, 0], bd: bdv(16, -128) });            // drawn back to the right side at chest height
  const midCut = S(L.slashR, { rArm: [-82, 0, 18], rElbow: [-16, 0, 0], bd: bdv(12, 38) });               // the cut stops in front of the chest, on the guard
  const loParry = S(L.parryL, { rArm: [-42, 0, 46], rElbow: [-76, 0, 0], bd: bdv(68, 34) });              // guard: hand at chest height close to the body, blade upright
  // hit(att, def, t, big, { wind, da, dd, meta }): a chest-level cut into a guard at time t. Key both roots about 2.1 blocks apart at t.
  // The blade intent (bd) is blended as a straight line between keys, so two keys pointing nearly opposite ways (wind-back -> cut is
  // 166 deg) do all their turning in the middle of the segment: 80-150 deg in 1/60 s (measured, part 2). So the cut gets a half-way key
  // (midSweep), and an attacker coming straight from his own cut passes through the guard first ({ rec: true }).
  const midSweep = S(L.slashR, { rArm: [-78, 0, -28], rElbow: [-36, 0, 0], chest: [6, 4, 0], waist: [8, 2, 0], bd: bdv(14, -46) });
  const hit = (att, def, t, big = false, o = {}) => { const wind = o.wind ?? 0.3; if (o.rec) K(att, t - wind - 0.14, loParry, 'io', o.da);
    K(att, t - wind, midWind, 'io', o.da); K(att, t - wind * 0.5, midSweep, 'lin', o.da); K(att, t, midCut, 'lin', o.da);
    K(def, t - 0.08, loParry, 'io', o.dd); K(def, t, loParry, 'lin', o.dd); clash(t, big); far(o.meta); };
  // knockTo(c, t, x, z, dur, rest): c is thrown back from a hit at t and slides to (x, z) over dur seconds with sand spray; rest = false
  // when the next move (a sprint) starts straight out of the slide.
  // step(c, t0, t1, stride): c travels on REAL steps between t0 and t1 (a stepping-gait window; stride = blocks per right + left step).
  // user, 2026-11-13: "LEGS not moving wide enough again theres a bunch of small steps that make the movement looks cursed ... we fixed
  // this before". The fix existed (assemble_w.py, DRIFT footwork) but only inside gait windows: any travel keyed with at() OUTSIDE a
  // RUN / WALK / step window is walked by the reactive planner, one tiny step each time a foot falls 0.17 blocks behind.
  // Since the "fix the not right part" round the stepping is AUTOMATIC (assemble_w.py, STEP PLANNER 2): all ground travel outside a
  // sprint (RUN), a slide (knockTo / slide) or a jump is walked on real steps, one foot at a time. Nothing to declare here; a move
  // faster than about 3.5 blocks/s still has to be a RUN window. Check with qa/v8x/steps_probe.js (part_check.mjs prints it).
  const knockTo = (c, t, x, z, dur = 0.55, rest = true) => { at(c, t + dur, x, z, 'o'); K(c, t + 0.1, L.hitBack, 'io'); K(c, t + 0.26, L.skid, 'io'); K(c, t + dur - 0.05, L.skid, 'lin');
    if (rest) K(c, t + dur + 0.12, G, 'io'); slide(c, W8(t + 0.12), W8(t + dur)); };
  // ================= S1 0-2.4  sword skill: both twirl their swords, B points the blade at A =================
  at('A', 0, -3.4, 0); at('A', 2.15, -3.4, 0); at('B', 0, 3.4, 0); at('B', 2.2, 3.4, 0);
  K('A', 0, L.relaxed); K('A', 0.28, L.twirlS, 'io'); K('A', 1.0, L.twirlS, 'lin'); K('A', 1.18, G, 'o'); K('A', 1.9, G, 'io');
  tw('A', 0.3, 1.02, 2);
  K('B', 0, L.relaxed); K('B', 0.8, L.relaxed, 'io'); K('B', 0.95, L.twirlF, 'io'); K('B', 1.62, L.twirlF, 'lin'); K('B', 1.8, L.point, 'o'); K('B', 2.05, L.point, 'lin'); K('B', 2.22, G, 'io');
  tw('B', 0.97, 1.63, 2);
  BR.A.push([0, 2.1]); BR.B.push([0, 2.1]);
  // ================= S2 2.15-5.0  sprint in, exchange while strafing sideways, big clash, both skid apart ==========
  // user, part-1 review 2026-11-13: "fighters on first exchanges are too close ... sword have no space", "skid apart also too short",
  // swords too quick to read -> a 1.6-block gap held at every hit (was 1.2 keyed, about 0.9 after the solver stepped them in; 2.0 was measured too far for the blades to meet), 3 cuts 0.42 s apart with 0.3 s wind-ups (was 4 at 0.35 s), a longer skid with sand spray
  sprint('A', 2.15, 2.72, [-3.4, 0], [-1.05, 0.2]); sprint('B', 2.2, 2.72, [3.4, 0], [1.05, -0.1]);
  K('A', 2.15, L.crouch, 'io', SWm); K('A', 2.55, L.guard, 'lin', SWm); K('B', 2.22, L.crouch, 'io', SWm); K('B', 2.5, L.guard, 'lin', SWm);
  // per-hit distances are the ones measured to let the blades meet (clash distance 0-0.13 blocks): 1.9 for a cut from range, 1.5 for the close reply
  // user, part-1 v2 review 2026-11-13: "the swords are like jittering when theyre raising their sword up for clashing" and "i want to see
  // more motions where swords are clashing below their head ... at head level or chest level".
  // Measured (qa/v8x/jitter_probe.js): the blade direction snapped 45-125 deg in 1/60 s - the cut ('i' ease) landed in 2 frames, and the
  // defender's sword whipped up to its parry in 2 frames ('o' ease, 0.14 s) right after its own cut; every clash was 1.9-2.3 blocks up
  // (head top = 1.6). So here: 3 hits 0.55 s apart, a smooth wind-back, an even-speed 0.3 s cut that stops ON the parry, the defender's
  // sword travelling to a LOW parry over the whole gap, and a ceiling on the contact height (hmax, the solver keeps the blades under it).
  // 2.1 blocks apart: the blades meet mid-blade. Closer (1.5-1.9) the attacker's forearm reached the defender's blade and the
  // blade-is-solid push-out threw that blade 127 deg in one frame (measured).
  const S2 = [[3.0, -1.05, 0.6, 1.05, 0.5], [3.55, -1.05, 1.5, 1.05, 1.4], [4.1, -1.05, 2.5, 1.05, 2.4]];
  for (const [t, ax, az, bx, bz] of S2) { at('A', t, ax, az, 'io'); at('B', t, bx, bz, 'io'); }
  hit('B', 'A', 3.0); hit('A', 'B', 3.55); hit('B', 'A', 4.1, true);   // the last one is the big one (impact insert): both thrown back
  at('A', 4.95, -3.2, 3.1, 'o'); at('B', 4.95, 3.1, 2.8, 'o');
  K('A', 4.42, L.skid, 'io'); K('A', 4.86, L.skid, 'lin'); K('A', 5.0, G, 'io'); K('B', 4.42, L.skid, 'io'); K('B', 4.86, L.skid, 'lin'); K('B', 5.0, G, 'io');   // eased into the skid pose: on a hard 'o' at 4.26 the blade whipped 74 deg in 1/60 s off the clash
  slide('A', W8(4.28), W8(4.9)); slide('B', W8(4.28), W8(4.9));
  // ================= S3 5.0-7.5  B rushes with a flat cut, A ducks and slips past, ONE spin cut, a big cut; B is thrown 3 blocks back =========
  // part 2 (user, 2026-11-13): "the fighter gets knocked back only a little and they takes too long to get back into the fight" ->
  // longer knock-backs that run straight into the next attack, no standing waits. Was: two spin cuts 0.33 s apart from 0.9 blocks
  // (both missed by 0.6), a rising cut, a 2-block knock-back and 0.6 s of both standing.
  RUN.B.push([5.05, 5.45]); at('B', 5.05, 3.1, 2.8); at('B', 5.5, 0.55, 2.6, 'lin'); at('B', 5.8, 0.15, 2.65, 'o');
  K('B', 5.05, L.crouch, 'io', SWm); K('B', 5.2, L.guard, 'lin', SWm); K('B', 5.26, midWind, 'io'); K('B', 5.38, midSweep, 'lin'); K('B', 5.5, midCut, 'lin'); K('B', 5.85, L.skid, 'io'); K('B', 6.0, G, 'io');   // the cut lands at 5.5, while A is still out of reach (at 5.62 it ran 2 px through the ducking A)
  // A slips past 1.6 blocks wide of B (0.9 before: B's cut and A's sword were pushed out of each other's bodies, 150 deg in a frame)
  at('A', 5.05, -3.2, 3.1); at('A', 5.62, -0.25, 4.2, 'lin'); at('A', 6.0, 2.0, 2.45, 'o');
  RUN.A.push([5.08, 5.9, 'charge']);   // 5.6 blocks in under a second is a run, not a shuffle (it had no gait window at all)
  K('A', 5.25, G); K('A', 5.45, L.duck, 'o'); K('A', 5.75, L.duck, 'lin'); K('A', 5.95, L.skid, 'o');
  K('A', 6.12, L.spin, 'lin', { yawOff: -190 }); K('A', 6.34, midCut, 'lin', { yawOff: -360 }); D.A = { yawOff: -360 };
  K('B', 6.26, loParry, 'io'); K('B', 6.34, loParry, 'lin'); clash(6.34); far();
  at('A', 6.34, 2.0, 2.5, 'io'); at('B', 6.34, -0.1, 2.7, 'io');
  at('A', 6.88, 1.75, 2.5, 'io'); at('B', 6.88, -0.35, 2.68, 'io'); hit('A', 'B', 6.88, true, { rec: true });
  knockTo('B', 6.88, -3.7, 2.8, 0.62, false);
  K('A', 7.12, G, 'io'); at('A', 7.2, 1.75, 2.5);
  // ================= S4 7.6-9.4  B sprints straight out of the slide and leaps into an aerial spinning overhead; A blocks and is driven back; B follows with a cut ==
  RUN.B.push([7.6, 8.02]); at('B', 7.6, -3.7, 2.8); at('B', 8.06, -0.65, 2.6, 'lin'); at('B', 8.5, 0.35, 2.55, 'lin'); at('B', 8.62, 0.45, 2.55, 'o');
  at('A', 8.3, 1.75, 2.5); at('A', 8.5, 1.8, 2.5); at('A', 9.0, 3.0, 2.4, 'o');
  K('B', 7.6, L.crouch, 'io', SWm); K('B', 7.95, L.crouch, 'o', { y: -0.4 }); K('B', 8.08, L.takeoff, 'o', { y: 0.9 });
  K('B', 8.3, L.spin, 'lin', { y: 1.6, yawOff: -180 }); K('B', 8.5, L.slashO, 'lin', { y: 0.6, yawOff: -360 }); D.B = { yawOff: -360 };
  K('B', 8.62, L.land, 'o'); K('B', 8.85, G, 'io');
  K('A', 8.2, G); blk('A', 8.35, 8.5, 'parryH', {}, { y: -0.3 }); clash(8.5, true);   // the jump attack plunges from above: the one high block of this part
  K('A', 8.6, G, 'io'); K('A', 8.74, L.skid, 'io'); K('A', 8.95, L.skid, 'lin'); K('A', 9.08, G, 'io'); slide('A', W8(8.6), W8(9.0));   // through the guard: high block -> skid pose directly is a near-opposite blade flip
  at('B', 9.4, 0.9, 2.45, 'io'); at('A', 9.4, 3.0, 2.38, 'io'); hit('B', 'A', 9.4);
  // ================= S5 9.6-12.0  B thrusts, A deflects and sidesteps, B overruns; A cuts, B is driven back, A follows and cuts again (big) =
  const yB5 = 90;   // B thrusts straight along +x at where A WAS: A is already stepping off the line (the thrust ran 2 px through A's torso and was pushed out, 174 deg in a frame)
  K('B', 9.6, L.windT, 'io', { yawAbs: yB5 }); K('B', 9.85, L.thrust, 'lin', { yawAbs: yB5 }); K('B', 10.05, L.thrust, 'lin', { yawAbs: yB5, chest: [16, 6, 0] });
  at('B', 9.6, 0.9, 2.45); at('B', 9.85, 2.0, 2.36, 'o'); at('B', 10.07, 2.7, 2.25, 'o');
  K('A', 9.66, G, 'io'); blk('A', 9.75, 9.85, 'parryR', { waist: [10, 0, -20] }, { waist: [10, 0, -20] }); clash(9.85); K('A', 10.0, L.dodge, 'o');
  at('A', 9.58, 3.0, 2.38); at('A', 9.82, 3.12, 3.2, 'io'); at('A', 10.2, 3.3, 4.1, 'o');
  const yB5b = face('B', 10.4, yB5);
  K('A', 10.12, midWind, 'io'); K('A', 10.4, midCut, 'lin'); K('B', 10.32, loParry, 'io', { yawAbs: yB5b }); K('B', 10.4, loParry, 'lin', { yawAbs: yB5b }); clash(10.4); far();
  at('A', 10.4, 3.3, 4.1); at('B', 10.4, 2.7, 2.25);
  knockTo('B', 10.4, 2.3, 0.92, 0.5);                                           // driven back 1.4 blocks...
  K('A', 10.6, G, 'io'); at('A', 10.55, 3.3, 4.1); at('A', 11.2, 3.0, 2.95, 'io');   // ...and A walks him down (was: A stood with the sword raised for 0.6 s)
  at('A', 11.5, 3.0, 2.95); at('B', 11.5, 2.3, 0.92); hit('A', 'B', 11.5, true);
  knockTo('B', 11.5, 1.95, -0.35, 0.5);
  K('A', 11.72, G, 'io');
  // ================= S6 12.1-15.1  A drives B back in a straight line: six strikes, B ducks the 7th and counters ==
  const at6 = (c, t, x, z, e) => at(c, t, x - 0.67, z - 1.65, e);   // part 2 now ends with B at (1.95, -0.35): S6 is shifted to start there until part 3 is re-blocked
  at6('A', 12.15, 2.7, 2.65, 'io'); at6('B', 12.1, 2.62, 1.3);
  const FL = ['R', 'L', 'O', 'R', 'L', 'T'];
  for (let i = 0; i < FL.length; i++) { const t = 12.4 + 0.28 * i, az = 2.5 - 0.33 * i, sx = 0.08 * (i % 2 ? 1 : -1);
    at6('A', t, 2.68 + sx, az, 'io'); at6('B', t, 2.62 - sx, az - 1.28, 'io'); if (i === 3) ex('B', 'A', t, FL[i], false, 0.15); else ex('A', 'B', t, FL[i], false, 0.15); }
  K('A', 13.92, L.windR, 'o'); K('A', 14.08, L.slashR, 'i');                                      // whiff: B ducks under it
  K('B', 13.96, L.duck, 'o'); K('B', 14.12, L.duck, 'lin'); K('B', 14.18, L.upperW, 'o'); K('B', 14.3, L.upper, 'i');
  blk('A', 14.2, 14.3, 'parryR', {}, { y: -0.2 }); clash(14.3, true);
  at6('A', 14.08, 2.66, 0.55, 'io'); at6('B', 14.08, 2.62, -0.7, 'io'); at6('A', 14.3, 2.66, 0.5); at6('B', 14.3, 2.62, -0.58, 'o');
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
  at('A', 20.45, 1.9, 1.2); K('A', 20.5, G); K('B', 20.5, G); K('A', 22.25, G); K('B', 22.25, G);   // (blade lock removed) they step round to the next exchange
  const S9 = [[22.45, 'B', 'R', 3.05, 0.0, 2.95, 1.2], [22.7, 'B', 'L', 3.05, -0.3, 2.95, 0.9], [22.95, 'B', 'O', 3.0, -0.6, 2.9, 0.6],
              [23.25, 'A', 'T', 3.0, -0.55, 2.95, 0.68], [23.55, 'B', 'O', 3.0, -0.7, 2.95, 0.52], [23.85, 'A', 'L', 3.05, -0.55, 3.0, 0.68]];   // 23.85 is made big below: both blown apart
  for (const [t, att, s, ax, az, bx, bz] of S9) { at('A', t, ax, az, 'io'); at('B', t, bx, bz, 'io'); ex(att, att === 'A' ? 'B' : 'A', t, s, t === 23.85, 0.15); }
  at('A', 24.5, 3.3, -3.6, 'o'); at('B', 24.5, 2.75, 3.9, 'o');
  K('A', 24.08, L.skid, 'o'); K('A', 24.45, L.skid, 'lin'); K('A', 24.6, G, 'io'); K('B', 24.08, L.skid, 'o'); K('B', 24.45, L.skid, 'lin'); K('B', 24.6, G, 'io');
  // ================= S10 24.6-30  mirrored twirl standoff, sprint, A slides under B's cut and rips upward; B falls ===
  K('A', 24.72, L.twirlS, 'io'); K('A', 25.28, L.twirlS, 'lin'); tw('A', 24.75, 25.28, 2);
  K('B', 24.78, L.twirlF, 'io'); K('B', 25.3, L.twirlF, 'lin'); tw('B', 24.8, 25.3, 2);
  { const pa = evalPosT('A', 24.62), pb = evalPosT('B', 24.62), dx = pb[0] - pa[0], dz = pb[1] - pa[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    const m = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], P_ = (s) => [m[0] + ux * s, m[1] + uz * s];
    at('A', 25.4, pa[0], pa[1]); at('B', 25.45, pb[0], pb[1]);
    RUN.A.push([25.45, 25.92]); RUN.B.push([25.5, 25.9]);
    at('A', 25.95, ...P_(-1.25), 'lin'); at('A', 26.1, ...P_(-0.5), 'lin'); at('A', 26.4, ...P_(-0.15), 'o');
    at('B', 25.92, ...P_(0.9), 'lin'); at('B', 26.08, ...P_(0.7), 'o');
    at('B', FLASH, ...P_(0.95)); at('B', 27.14, ...P_(0.95)); at('B', 27.5, ...P_(1.4), 'o'); at('B', TEND, ...P_(1.4));
    at('A', 27.12, ...P_(-0.15)); at('A', 27.42, ...P_(-0.62), 'o'); at('A', TEND, ...P_(-0.62));
    export_cross.mid = m; export_cross.u = [ux, uz]; export_cross.p = [-uz, ux]; }
  K('A', 25.4, G); K('A', 25.48, L.crouch, 'io', SW); K('A', 25.8, L.guard, 'lin', SW); K('A', 25.95, L.duck, 'o'); K('A', 26.12, L.duck, 'lin');
  K('A', 26.2, L.windT, 'o'); K('A', FLASH, L.thrust, 'i', { pierce: 1 }); K('A', 27.12, L.thrust, 'lin', { pierce: 1, chest: [14, 4, 0] }); K('A', 27.36, L.windT, 'o'); K('A', 27.75, G, 'io');   // through the chest, held, then pulled out
  K('B', 25.45, G); K('B', 25.52, L.crouch, 'io', SW); K('B', 25.78, L.guard, 'lin', SW); K('B', 25.92, L.windL, 'o'); K('B', 26.08, L.slashL, 'i');
  clash(FLASH, true, 'kick', { at: () => { const q = pose('B', FLASH + 0.02).pos; return [q[0], q[1] + 1.25, q[2]]; } });
  K('B', FLASH + 0.06, L.hitBack, 'o', { y: 0.04 }); K('B', 27.12, L.hitBack, 'lin', { y: 0.0, head: [14, 0, 0] }); K('B', 27.45, L.skid, 'o'); K('B', 27.95, L.knees, 'io');
  K('B', 28.6, L.fallen, 'o'); K('B', TEND, L.fallen);
  BR.A.push([27.8, TEND]);
  K('A', 28.3, L.flick, 'o'); K('A', 28.85, L.relaxed, 'io'); K('A', TEND, L.relaxed, 'io');   // flicks the blade clean, lowers it
  })((c, t, p, e, d) => k(c, W8(t), t > 2.4 && noTw(p) ? G : p, e, d), (c, t, x, z, e) => at(c, W8(t), x, z, e), (t, big, kind, extra) => clash(W8(t), big, kind, extra),
     wrap(RUN), wrap(BR), { push: r => PARRY.push({ ...r, t: W8(r.t) }) }, (c, t) => evalPosT(c, W8(t)), (c, t, ref) => face(c, W8(t), ref), (c, t) => pose(c, W8(t)), 26.38,
     (c, t0, t1, turns) => { if (t0 < 2.4) TWIRL[c].push([W8(t0), W8(t1), turns]); }, (c, t0, t1, from, to) => { RUN[c].push([W8(t0), W8(t1)]); at(c, W8(t0), from[0], from[1]); at(c, W8(t1), to[0], to[1], 'lin'); });
  // ================= N1 25.4-28.95 (new): run in, cut and riposte, the thrust at the face in SLOW MOTION, kick into a slide =================
  { const a = evalPosT('A', 25.38), b = evalPosT('B', 25.38), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const tA = wsprint('A', 25.42, a, [m[0] - ux * 0.78, m[1] - uz * 0.78]), tB = wsprint('B', 25.42, b, [m[0] + ux * 0.78, m[1] + uz * 0.78]);
    for (const [c, t1] of [['A', tA], ['B', tB]]) { K(c, 25.44, L.sprintGo, 'io', SW); K(c, t1 - 0.08, L.sprintGo, 'lin', SW); K(c, t1 + 0.06, G, 'io'); at(c, t1 + 0.04, ...evalPosT(c, t1)); }
    const t0 = Math.max(tA, tB);
    whit('B', 'A', t0 + 0.34, 'windR', 'slashR', 'parryL', { knock: false, rest: 'guard' });
    whit('A', 'B', t0 + 0.78, 'windO', 'slashO', 'parryH', { rest: 'guard', defRest: 'guard' });
    // the close call: B lunges at the face; A leans out of the line (slow motion 27.0-27.45), then kicks him away
    mv8('B', 'A', 26.72, 26.98, 1.7); K('B', 26.8, L.windT, 'o'); K('B', 27.3, L.thrust, 'i', { head: [-8, 4, 0] }); K('B', 27.48, L.thrust, 'lin'); K('B', 27.66, G, 'io');
    K('A', 27.0, G, 'io'); K('A', 27.24, L.dodge, 'o'); K('A', 27.46, L.dodge, 'lin'); lat8('A', 'B', 27.08, 27.34, 0.62);
    K('A', 27.5, L.kickW, 'o'); K('A', 27.68, L.kick, 'i'); K('A', 27.92, G, 'io'); clash(27.68, false, 'kick', { at: () => { const q = pose('B', 27.7).pos; return [q[0], q[1] + 1.2, q[2]]; } });
    K('B', 27.72, L.hitBack, 'o', { y: 0.08 }); K('B', 27.86, L.skid, 'o'); K('B', 28.3, L.skid, 'lin'); K('B', 28.5, G, 'io');
    at('A', 27.68, ...evalPosT('A', 27.68)); at('A', 28.9, ...evalPosT('A', 27.68)); { const q = evalPosT('B', 27.68), p = evalPosT('A', 27.68), ex_ = q[0] - p[0], ez = q[1] - p[1], e = Math.hypot(ex_, ez) || 1;
      at('B', 27.68, ...q); at('B', 28.34, q[0] + ex_ / e * 2.3, q[1] + ez / e * 2.3, 'o'); at('B', 28.9, q[0] + ex_ / e * 2.3, q[1] + ez / e * 2.3); slide('B', 27.82, 28.34); }
    K('A', 28.9, G); K('B', 28.9, G); }
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}
// movement helpers for N1 (positions from the keys laid down so far)
const mv8 = (c, o, t0, t1, gap, e = 'io') => { const a = evalPosT(c, t0), b = evalPosT(o, t1), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz) || 1; at(c, t0, ...a); at(c, t1, b[0] + dx / d * gap, b[1] + dz / d * gap, e); };
const lat8 = (c, o, t0, t1, side, e = 'o') => { const a = evalPosT(c, t0), b = evalPosT(o, t0), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz) || 1; at(c, t0, ...a); at(c, t1, a[0] - dz / d * side, a[1] + dx / d * side, e); };

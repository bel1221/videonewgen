function buildAll() {
  // WEIGHT TEST "wt" (8 s, mechanics only - not a video for publishing): A = golem_hammer (heavy) vs B = Aegisblade (medium).
  // Every timing comes from the weapons' weight classes through the w-helpers in common_w.js: wsprint (run speed), whit (wind-up,
  // follow-through, recovery, knockback scaled by the defender's brace), wtw (twirl refused for the heavy weapon).
  // Expect: B arrives first although both start together; B's cuts barely move A; A's two slow swings throw B back about a block.
  weapons('golem_hammer', 'aegisblade');
  CANDS.A = ['hmBlock', 'hmBlockL', 'hmBlockV', 'hmGuard']; CANDS.B = ['parryL', 'parryR', 'parryH'];
  // step to `gap` blocks from the opponent (the gait planner turns the travel into steps)
  const mv = (c, o, t0, t1, gap, e = 'io') => { const a = evalPosT(c, t0), b = evalPosT(o, t1), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz) || 1; at(c, t0, ...a); at(c, t1, b[0] + dx / d * gap, b[1] + dz / d * gap, e); };
  // ---- 0-0.8 both stand ready, 9 blocks apart
  at('A', 0, -4.5, 0); at('B', 0, 4.5, 0);
  K('A', 0, L.hmGuard); K('A', 0.8, L.hmGuard); K('B', 0, L.ready); K('B', 0.8, L.ready);
  // ---- 0.8 both run in at the SAME moment: the sword (medium, 8.1 blocks/s) covers its 3.3 blocks before the hammer (heavy, 6.75) covers its own
  const tA = wsprint('A', 0.8, [-4.5, 0], [-1.2, 0], 'charge'), tB = wsprint('B', 0.8, [4.5, 0], [1.2, 0]);
  K('B', 0.82, L.sprintGo, 'io', SW); K('B', tB - 0.08, L.sprintGo, 'lin', SW); K('B', tB + 0.06, G, 'io');
  at('A', tA + 0.05, -1.2, 0); at('B', tB + 0.05, 1.2, 0);
  // ---- 1.5-2.6 the sword cuts twice (a 2-hit combo, allowed for medium); the hammer wielder is braced and gives little ground
  mv('B', 'A', 1.45, 1.62, 1.35); let fB = whit('B', 'A', 1.78, 'windR', 'slashR', 'hmBlock', { rest: 'guard', defRest: 'hmGuard' });
  mv('B', 'A', 2.2, 2.34, 1.35); fB = whit('B', 'A', 2.5, 'windO', 'slashO', 'hmBlock', { rest: 'guard', defRest: 'hmGuard' });
  // ---- 3.2-4.6 the hammer answers: long wind-up, flat swing; the sword blocks and is thrown back
  mv('A', 'B', 3.05, 3.3, 1.5); let fA = whit('A', 'B', 3.85, 'hmWindS', 'hmSwing', 'parryR', { rest: 'hmGuard' });
  // ---- 5.0-5.8 the sword steps back in and cuts once more
  mv('B', 'A', 4.95, 5.25, 1.35); fB = whit('B', 'A', 5.45, 'windR', 'slashR', 'hmBlock', { rest: 'guard', defRest: 'hmGuard' });
  // ---- 6.0-7.2 overhead slam on the raised sword: thrown back again
  mv('A', 'B', 6.0, 6.2, 1.5); fA = whit('A', 'B', 6.7, 'hmWindO', 'hmSlam', 'parryH', { rest: 'hmGuard' });
  // ---- twirls: the sword may show off once, the hammer may not (wtw refuses and logs it)
  wtw('A', 7.3, 7.8, 1); wtw('B', 7.45, 7.9, 1);
  K('A', 8.0, L.hmGuard); K('B', 8.0, G);
  export_cross.mid = [0, 0]; export_cross.u = [1, 0]; export_cross.p = [0, 1];
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}

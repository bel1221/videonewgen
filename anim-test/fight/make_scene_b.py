"""Generate choreo_b.js (test fight #2: Ocean Sword vs Thundermaul) from choreo.js, reusing every system
(rig, IK feet, gait, collision, blade intent + physics, style pass) and replacing only the timeline, shots and
scene-specific constants.  Run from anim-test/fight/:  python make_scene_b.py"""
import re
s = open('choreo.js', encoding='utf-8').read()
def rp(a, b, cnt=1):
    global s
    assert a in s, a[:80]; s = s.replace(a, b, cnt)

rp("export const TOTAL = 20.0;", "export const TOTAL = 14.0;")
a = s.index("function buildAll() {"); b = s.index("export const export_cross = {};")
s = s[:a] + r'''function buildAll() {
  // A: Ocean Sword (fast, light)  vs  B: Thundermaul (heavy). Study rules: low committed stances, hold-then-explode
  // timing (heavy wind-ups held 3-8 frames), camera kept on one side of the fighting line, still shots for beats.
  const shoulder = S(L.relaxed, { rArm: [-150, 0, -24], rElbow: [-112, 0, 0], bda: [45, 170], lArm: [6, 0, 10], head: [4, -8, 0] });
  // ---------- 0-1.6 standoff: circling sidesteps
  at('A', 0, -3.6, 0.3); at('B', 0, 3.6, -0.3);
  k('A', 0, G); k('B', 0, shoulder);
  at('A', 0.7, -3.5, 0.75); at('A', 1.5, -3.3, 1.2); at('B', 0.9, 3.5, -0.8);
  // ---------- B raises the hammer, holds, charges, hops, smashes the ground; A sidesteps
  k('B', 1.15, shoulder); k('B', 1.45, L.windO, 'o'); k('B', 1.62, L.windO, 'lin');
  RUN.B.push([1.62, 2.28]); at('B', 1.62, 3.5, -0.8); at('B', 2.28, -1.3, 0.7, 'lin'); at('B', 2.55, -2.0, 0.9, 'o');
  k('B', 2.28, L.windO, 'lin'); k('B', 2.42, L.windO, 'o', { y: 0.22, waist: [-14, 0, 0] });
  k('B', 2.55, L.slam, 'i'); k('B', 2.82, L.slam, 'lin', { y: -0.62 });
  clash(2.55, true, 'slam', { at: (cast, blade) => { const tip = blade('B', 2.57, [24])[0]; return [tip.x, W.floorAt(tip.x, tip.z) + 0.05, tip.z]; } });
  k('A', 1.9, G); k('A', 2.3, L.dodge, 'o'); at('A', 1.95, -3.3, 1.2); at('A', 2.4, -2.9, 2.3, 'o');
  // ---------- A counters: double slash, B blocks on the haft
  k('A', 2.62, L.windR, 'o'); k('A', 2.75, L.windR, 'lin'); k('A', 3.05, L.slashR, 'i'); at('A', 3.05, -2.3, 1.5, 'o');
  k('B', 3.0, L.parryH, 'o'); clash(3.05);
  k('A', 3.16, L.windL, 'o'); k('A', 3.35, L.slashL, 'i'); at('A', 3.35, -2.1, 1.2, 'o');
  k('B', 3.3, L.parryL, 'o'); clash(3.35);
  // ---------- B horizontal sweep with body follow-through; A ducks under
  k('B', 3.55, L.windR, 'o'); k('B', 3.82, L.windR, 'lin', { y: -0.26 });
  k('B', 4.05, L.slashR, 'i'); k('B', 4.28, L.slashR, 'o', { yawOff: -55 }); k('B', 4.5, G, 'io', { yawOff: 0 });
  k('A', 3.5, G); k('A', 3.9, L.duck, 'o'); k('A', 4.15, L.duck, 'lin');
  // ---------- A rises into a thrust; B catches it on the hammer head (big clash)
  k('A', 4.35, L.windT, 'o'); k('A', 4.65, L.thrust, 'i'); at('A', 4.35, -2.1, 1.2); at('A', 4.65, -1.4, 0.95, 'o');
  k('B', 4.6, L.parryR, 'o'); clash(4.65, true);
  // ---------- B kicks A away; A slides to one knee
  k('B', 4.82, L.kickW, 'o'); k('B', 5.0, L.kick, 'i'); k('B', 5.2, L.kick, 'lin'); k('B', 5.45, G, 'io');
  clash(5.0, false, 'kick', { at: () => { const q = pose('A', 5.02).pos; return [q[0], q[1] + 1.3, q[2]]; } });
  k('A', 4.85, L.thrust, 'lin'); k('A', 5.05, L.hitBack, 'o'); k('A', 5.3, L.slide, 'o'); k('A', 5.65, L.slide, 'lin'); k('A', 5.9, L.kneelG, 'o');
  at('A', 5.0, -1.4, 0.95); at('A', 5.7, -5.4, 1.4, 'o');
  // ---------- breathing hold (still shot); B shoulders the hammer again
  BR.A.push([5.9, 6.75]); BR.B.push([5.45, 6.75]);
  k('B', 5.9, G); k('B', 6.2, shoulder, 'io'); k('B', 6.6, shoulder);
  k('A', 6.3, L.kneelG); k('A', 6.62, G, 'o');
  // ---------- A sprints in and leaps into an aerial overhead; B blocks from a kneel (big clash), bind, push apart
  RUN.A.push([6.7, 7.45]); at('A', 6.7, -5.4, 1.4); at('A', 7.45, -1.9, 0.6, 'lin');
  k('A', 7.45, L.crouch, 'o'); k('A', 7.55, L.takeoff, 'o', { y: 0.6 }); k('A', 7.78, L.tuck, 'o', { y: 2.1 });
  k('A', 8.1, L.slashO, 'i', { y: 0.35 }); k('A', 8.2, L.bind, 'o');
  at('A', 7.55, -1.7, 0.55); at('A', 8.1, -0.6, 0.15, 'lin');
  k('B', 7.4, shoulder); k('B', 7.7, G, 'o'); k('B', 7.95, L.kneelBlock, 'o'); k('B', 8.12, L.kneelBlock, 'lin', { y: -0.5 });
  clash(8.1, true);
  for (let t = 8.25; t < 8.7; t += 0.11) { const s_ = Math.sin(t * 40) * 0.5 + 0.5;
    k('A', t, L.bind, 'io', { chest: [22 + 8 * s_, 10, 0], y: -0.3 - 0.06 * s_ }); k('B', t, L.kneelBlock, 'io', { chest: [-8 + 6 * (1 - s_), 0, 0], y: -0.5 }); }
  k('A', 8.85, L.hitBack, 'o'); k('A', 9.1, G, 'io'); at('A', 8.7, -0.6, 0.15); at('A', 9.05, -1.9, 0.5, 'o');
  k('B', 8.85, L.upper, 'o'); k('B', 9.05, G, 'io');
  // ---------- B uppercut (held wind-up) meets A's late parry; A is knocked back
  k('B', 9.15, L.upperW, 'o'); k('B', 9.32, L.upperW, 'lin', { y: -0.6 }); k('B', 9.5, L.upper, 'i'); k('B', 9.8, G, 'io');
  k('A', 9.3, G); k('A', 9.45, L.parryL, 'o'); clash(9.5, true);
  k('A', 9.6, L.hitBack, 'o'); k('A', 9.95, G, 'io'); at('A', 9.5, -1.9, 0.5); at('A', 9.95, -3.4, 0.9, 'o');
  // ---------- hold beat, then the final cross on a flash
  const fa = [-3.4, 0.9], fb = evalPos(P.B, 9.9);
  at('A', 10.6, fa[0], fa[1]); at('B', 10.6, fb[0], fb[1]);
  k('A', 10.25, L.flick, 'io'); k('A', 10.55, G, 'io'); BR.A.push([10.0, 10.6]); BR.B.push([10.0, 10.6]);
  const mx = (fa[0] + fb[0]) / 2, mz = (fa[1] + fb[1]) / 2, dx = fb[0] - fa[0], dz = fb[1] - fa[1], dd = Math.hypot(dx, dz), ux = dx / dd, uz = dz / dd, px = -uz, pz = ux;
  export_cross.mid = [mx, mz]; export_cross.u = [ux, uz]; export_cross.p = [px, pz];
  const yA = Math.atan2(ux, uz) * 180 / Math.PI, yB = yA + 180, lockA = { yawAbs: yA, yawOff: 0 }, lockB = { yawAbs: yB, yawOff: 0 };
  k('A', 10.65, L.crouch, 'o', { rArm: [20, 0, -12], rElbow: [-30, 0, 0] }); k('B', 10.65, L.crouch, 'o');
  RUN.A.push([10.75, 11.15]); RUN.B.push([10.78, 11.15]);
  at('A', 10.75, fa[0], fa[1]); at('A', 11.3, mx - px * 0.45, mz - pz * 0.45, 'lin'); at('A', 11.7, mx + ux * 3.6 - px * 0.5, mz + uz * 3.6 - pz * 0.5, 'o');
  at('B', 10.78, fb[0], fb[1]); at('B', 11.3, mx + px * 0.45, mz + pz * 0.45, 'lin'); at('B', 11.65, mx - ux * 3.0 + px * 0.5, mz - uz * 3.0 + pz * 0.5, 'o');
  k('A', 11.0, L.guard, 'lin', lockA); k('A', 11.18, L.windR, 'o', lockA); k('A', 11.3, L.slashR, 'i', lockA);
  k('A', 11.7, L.slide, 'o', { ...lockA, rArm: [-74, 0, -62], rElbow: [-4, 0, 0], waist: [24, -40, 0], chest: [8, -50, 0], head: [-14, 40, 0] });
  k('A', 12.3, L.slide, 'lin', { ...lockA, rArm: [-74, 0, -62], rElbow: [-4, 0, 0], waist: [24, -40, 0], chest: [8, -50, 0], head: [-14, 40, 0] });
  k('A', 12.65, L.relaxed, 'io', lockA); k('A', 12.85, L.flick, 'o', lockA); k('A', 13.2, L.relaxed, 'io', { ...lockA, head: [6, -30, 0] });
  k('B', 11.0, L.guard, 'lin', lockB); k('B', 11.15, L.windO, 'o', lockB); k('B', 11.3, L.slashO, 'i', lockB);
  k('B', 11.65, L.slashO, 'o', { ...lockB, y: -0.4 }); k('B', 11.95, L.slashO, 'lin', { ...lockB, y: -0.42 });
  k('B', 12.15, L.knees, 'i', lockB); k('B', 12.35, L.knees, 'lin', lockB); k('B', 12.7, L.fallen, 'i', lockB);
  clash(11.3, true, 'cross');
  BR.A.push([12.9, 14.0]);
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}
''' + s[b:]
rp("export const SLIDES = { A: [[6.92, 7.6], [17.32, 17.75]], B: [[4.88, 5.3], [8.76, 9.1], [15.22, 15.7], [17.32, 17.72]] };",
   "export const SLIDES = { A: [[5.1, 5.7], [11.32, 11.72]], B: [[11.32, 11.62]] };")
rp("t > 17.25", "t > 11.25", 2)
a = s.index("const INS = ["); b = s.index("export function shotAt(t)")
s = s[:a] + r'''const INS = [4.65, 8.1, 9.5];
const FLASH = 11.3;
const SHOTS = [
  [0.0, 'estLock'], [1.4, 'raiseB'], [1.9, 'chargeSide'], [2.48, 'slamB'], [2.95, 'exchange'], [3.7, 'duckLow'], [4.35, 'twoShotLow'],
  [4.65, 'ins'], [4.75, 'wideKick'], [5.85, 'holdBeat'], [6.75, 'runA'], [7.5, 'leapLow2'], [8.1, 'ins'], [8.2, 'bindFaces'],
  [8.85, 'pushWide'], [9.5, 'ins'], [9.6, 'knockWide'], [10.0, 'holdBeat'], [10.7, 'chargeSide'], [FLASH, 'flash'],
  [FLASH + 3 * DT, 'hero'], [12.0, 'fallClose'], [12.9, 'endLock'],
];
''' + s[b:]
# new camera cases (inserted at the top of the switch; one side of the fighting line, faces favoured)
rp("  switch (S.label) {", r"""  const at0 = c_ => v3(...pose(c_, S.t0 + 0.01).pos);
  switch (S.label) {
    case 'estLock': { const a0 = at0('A'), b0 = at0('B'), m0 = a0.clone().lerp(b0, 0.5); pos = m0.clone().add(side.clone().multiplyScalar(9.5)).add(up(1.9)); look = m0.clone().add(up(1.0)); fov = 36; break; }
    case 'holdBeat': { const a0 = at0('A'), b0 = at0('B'), m0 = a0.clone().lerp(b0, 0.5); pos = m0.clone().add(side.clone().multiplyScalar(6.2)).add(ab.clone().multiplyScalar(-0.8)).add(up(1.3)); look = m0.clone().add(up(1.15)); fov = 38; break; }
    case 'endLock': { const a0 = at0('A'), b0 = at0('B'), m0 = a0.clone().lerp(b0, 0.5); pos = m0.clone().add(side.clone().multiplyScalar(8.5)).add(up(2.6)); look = m0.clone().add(up(0.8)); fov = 38; break; }
    case 'raiseB': pos = B.clone().add(fB.clone().multiplyScalar(3.2)).add(side.clone().multiplyScalar(1.4)).add(up(0.6)); look = B.clone().add(up(1.9)); fov = 40; break;
    case 'slamB': pos = B.clone().add(up(5.5)).add(side.clone().multiplyScalar(3.0)).add(ab.clone().multiplyScalar(1.6)); look = B.clone().add(up(0.3)).add(fB.clone().multiplyScalar(1.0)); fov = 46; break;
    case 'exchange': pos = mid.clone().add(side.clone().multiplyScalar(3.6)).add(ab.clone().multiplyScalar(-0.5)).add(up(1.45)); look = mid.clone().add(up(1.3)); fov = 42; break;
    case 'duckLow': pos = mid.clone().add(side.clone().multiplyScalar(3.4)).add(up(0.45)); look = mid.clone().add(up(1.25)); fov = 48; break;
    case 'twoShotLow': pos = mid.clone().add(side.clone().multiplyScalar(3.0)).add(ab.clone().multiplyScalar(-1.0)).add(up(0.9)); look = mid.clone().lerp(B, 0.3).add(up(1.4)); fov = 44; break;
    case 'leapLow2': { const a0 = at0('A'); pos = a0.clone().add(side.clone().multiplyScalar(3.2)).add(ab.clone().multiplyScalar(1.6)).add(up(0.35)); look = A.clone().add(up(1.4)); fov = 52; break; }""")
rp("  { const pb = rootXZ('B', 19.38); puff(soft, t, 19.38,", "  { const pb = rootXZ('B', 12.7); puff(soft, t, 12.7,")
rp("const bc = CONT.find(x => Math.abs(x.t - 11.62) < 0.01);\n  if (bc) for (let tb = 11.7; tb < 12.5; tb += 0.11)",
   "const bc = CONT.find(x => Math.abs(x.t - 8.1) < 0.01);\n  if (bc) for (let tb = 8.25; tb < 8.7; tb += 0.11)")
# impacts: warm flare + yellow star (Marlow/Desert) instead of the inked frame
rp("if (ii >= 0) { const f = Math.round((t - INS[ii]) / DT); impact = f === 0 ? 1 : 0; ca = 0.8; bloomBoost = 0.08; }",
   "if (ii >= 0) { const f = Math.round((t - INS[ii]) / DT), c0 = CONT.find(x => Math.abs(x.t - INS[ii]) < 0.02); impact = 0; ca = 0.35; bloomBoost = 0.06;\n    if (c0) { flares.push({ p: c0.p, s: 0.42 - 0.08 * f, a: 1, c: [2.6, 1.9, 0.5], rot: 0.35 }); flares.push({ p: c0.p, s: 0.26, a: 0.9, c: [2.4, 2.2, 0.8], rot: 1.1 }); } }")
open('choreo_b.js', 'w', encoding='utf-8').write(s); print('choreo_b.js written', len(s))

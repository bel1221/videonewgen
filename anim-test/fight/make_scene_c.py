"""Generate choreo_c.js: sword-vs-sword test fight rebuilt at the source (see notes §8):
arm IK + rigid grip, a fight director (spacing, anticipation/strike/follow/recover, defences timed to the strike line,
directional hit reactions), calm one-side camera, subtle effects. Reuses rig/IK feet/gait/collision from choreo.js.
Run from anim-test/fight/:  python make_scene_c.py"""
s = open('choreo.js', encoding='utf-8').read()
def rp(a, b, cnt=1):
    global s
    assert a in s, a[:80]; s = s.replace(a, b, cnt)

rp("export const TOTAL = 20.0;", "export const TOTAL = 12.0;")
# ---- pose plumbing: hand targets (spherical around the shoulder, chest frame) travel through keys like joint angles
rp("yawAbs: null, bda: [70, 0] };", "yawAbs: null, bda: [70, 0], hR: [-18, -8, 0.4], hL: [30, -45, 0.32] };")
rp("  { const ba = a.bda || [70, 0], bb = b.bda || [70, 0]; o.bda = [lerp(ba[0], bb[0], u), lerp(ba[1], bb[1], u)]; }",
   "  { const ba = a.bda || [70, 0], bb = b.bda || [70, 0]; o.bda = [lerp(ba[0], bb[0], u), lerp(ba[1], bb[1], u)]; }\n  for (const hk of ['hR', 'hL']) { const ha = a[hk] || [0, -40, 0.35], hb = b[hk] || [0, -40, 0.35]; o[hk] = ha.map((v, i) => lerp(v, hb[i], u)); }")
rp("a.push(...(p.bda || [70, 0]));", "a.push(...(p.bda || [70, 0])); a.push(...(p.hR || [-18, -8, 0.4])); a.push(...(p.hL || [30, -45, 0.32]));")
rp("  o.bda = [a[i++], a[i++]];", "  o.bda = [a[i++], a[i++]]; o.hR = [a[i++], a[i++], a[i++]]; o.hL = [a[i++], a[i++], a[i++]];")
# running: sword hand low and back (blade trailing), off hand pumping, as hand targets
rp("  p.lArm = [-52 * s, 0, 8]; p.lElbow = [-84 - 16 * Math.max(0, s), 0, 0];",
   "  p.hL = [18, -70 + 42 * s, 0.42];")
rp("  if (swordToo) { p.rArm = [28 + 12 * s, 0, -10]; p.rElbow = [-32 - 6 * s, 0, 0]; p.wrist = 214 + 6 * s; p.bda = [-22 + 6 * s, -160]; p.chest = [6, 10 * s, 0]; p.head = [-16, -6 * s, 0]; }",
   "  if (swordToo) { p.hR = [-28, -105 + 10 * s, 0.5]; p.bda = [-22 + 6 * s, -160]; p.chest = [6, 10 * s, 0]; p.head = [-16, -6 * s, 0]; }")
# clash solver corrections now move the HAND (az/el/reach) instead of FK arm angles
rp("    p.rArm[0] += e.ax * w; p.rArm[2] += e.az * w; p.rElbow[0] += e.el * w; p.chest[1] += e.ch * w;",
   "    p.hR = [p.hR[0] + e.az * w, p.hR[1] - e.ax * 0.6 * w, Math.min(0.58, p.hR[2] + e.el * 0.004 * w)]; p.chest[1] += e.ch * w;")
rp("export const STYLE = { on: true,", "export const STYLE = { on: false,")
rp("const WARP = { io: u => u,", "const WARP = { q: u => u * u, io: u => u,")
rp("t > 11.25", "t > 99", 2) if "t > 11.25" in s else rp("t > 17.25", "t > 99", 2)

# ---- the fight director
a = s.index("function buildAll() {"); b = s.index("export const export_cross = {};")
s = s[:a] + r'''function buildAll() {
  const X = { A: -4.0, B: 4.0 };                                          // positions on the fighting line (x axis)
  const dir = c => c === 'A' ? 1 : -1;                                    // A faces +x, B faces -x
  const mv = (c, t, x, e = 'io') => { at(c, t, x, 0, e); X[c] = x; };
  const P0 = (o) => S(N(), o);
  // stance: left foot forward, weight centred, knees soft, sword up in front (blade vertical), off hand guarding
  const guard = P0({ rLeg: [-14, 0, -6], rKnee: [22, 0, 0], lLeg: [-26, 0, 6], lKnee: [26, 0, 0], waist: [8, -14, 0], chest: [4, -8, 0], head: [-6, 18, 0], y: -0.06,
    hR: [-16, -6, 0.4], hL: [34, -38, 0.3], bda: [80, 6] });
  const walkG = S(guard, { y: -0.02 });
  const B_ = o => S(guard, o);
  const MV = {
    fore: { wind: B_({ hR: [-100, 34, 0.38], bda: [62, -112], chest: [-2, -34, 0], waist: [4, -20, 0], head: [-8, 26, 0], hL: [40, -10, 0.32], y: -0.12, lKnee: [34, 0, 0] }),
            strike: B_({ hR: [-2, -2, 0.56], bda: [6, 12], chest: [16, 30, 0], waist: [16, 16, 0], head: [-6, -10, 0], hL: [10, -55, 0.3], y: -0.2, lLeg: [-40, 0, 6], lKnee: [44, 0, 0], rLeg: [10, 0, -6], rKnee: [14, 0, 0] }),
            follow: B_({ hR: [80, -28, 0.44], bda: [-38, 118], chest: [18, 42, 0], waist: [16, 22, 0], hL: [-10, -60, 0.3], y: -0.22 }), line: 'L', reach: 0.35 },
    back: { wind: B_({ hR: [56, 28, 0.34], bda: [56, 108], chest: [0, 30, 0], waist: [6, 16, 0], head: [-8, -18, 0], hL: [60, -30, 0.25], y: -0.12 }),
            strike: B_({ hR: [-6, -2, 0.56], bda: [6, -12], chest: [14, -34, 0], waist: [14, -18, 0], head: [-6, 16, 0], hL: [50, -40, 0.32], y: -0.2, lLeg: [-38, 0, 6], lKnee: [40, 0, 0] }),
            follow: B_({ hR: [-88, -26, 0.44], bda: [-36, -118], chest: [16, -44, 0], waist: [14, -24, 0], y: -0.22 }), line: 'R', reach: 0.3 },
    over: { wind: B_({ hR: [-10, 70, 0.42], bda: [98, -5], hL: [10, 66, 0.4], chest: [-12, -4, 0], waist: [-6, -4, 0], head: [-12, 0, 0], y: 0.0, rKnee: [10, 0, 0], lKnee: [12, 0, 0] }),
            strike: B_({ hR: [-4, 24, 0.56], bda: [16, 0], hL: [8, 22, 0.5], chest: [24, 0, 0], waist: [22, 0, 0], head: [4, 0, 0], y: -0.28, lLeg: [-42, 0, 6], lKnee: [52, 0, 0] }),
            follow: B_({ hR: [-6, -18, 0.52], bda: [-28, 0], hL: [8, -16, 0.48], chest: [26, 0, 0], waist: [24, 0, 0], y: -0.32 }), line: 'H', reach: 0.45 },
    thrust: { wind: B_({ hR: [-42, -16, 0.22], bda: [2, 8], chest: [2, -36, 0], waist: [6, -20, 0], hL: [50, -10, 0.32], y: -0.16, lKnee: [36, 0, 0] }),
            strike: B_({ hR: [2, 4, 0.58], bda: [0, 0], chest: [14, 12, 0], waist: [16, 8, 0], hL: [60, -40, 0.3], y: -0.24, lLeg: [-48, 0, 6], lKnee: [50, 0, 0], rLeg: [16, 0, -6], rKnee: [8, 0, 0] }),
            follow: B_({ hR: [4, 2, 0.56], bda: [-4, 0], chest: [12, 10, 0], waist: [14, 6, 0], y: -0.24 }), line: 'T', reach: 0.45 },
  };
  const DEF = {
    L: B_({ hR: [8, 10, 0.44], bda: [74, 14], chest: [0, 12, 0], hL: [42, 8, 0.28], y: -0.14, lKnee: [32, 0, 0] }),      // attack arriving on the defender's left
    R: B_({ hR: [-28, 8, 0.44], bda: [74, -14], chest: [0, -18, 0], hL: [20, -30, 0.3], y: -0.14 }),                     // ... on the right
    H: B_({ hR: [-10, 56, 0.4], bda: [8, 84], hL: [24, 56, 0.38], chest: [-6, 0, 0], waist: [4, 0, 0], y: -0.26, rKnee: [40, 0, 0], lKnee: [44, 0, 0] }),   // overhead
    T1: B_({ hR: [-26, 0, 0.46], bda: [55, -36], chest: [0, -12, 0] }), T2: B_({ hR: [26, -6, 0.46], bda: [32, 42], chest: [0, 14, 0] }),               // parry across
  };
  const HIT = {   // reaction follows the direction of the blow
    L: B_({ waist: [-16, 16, 10], chest: [-14, 24, 8], head: [-18, 22, 0], hR: [-70, -10, 0.44], bda: [30, -130], hL: [80, 0, 0.4], y: -0.06, lKnee: [12, 0, 0] }),
    R: B_({ waist: [-16, -16, -10], chest: [-14, -24, -8], head: [-18, -22, 0], hR: [-95, -24, 0.46], bda: [10, -150], hL: [70, -5, 0.42], y: -0.06 }),
    K: B_({ waist: [-26, 0, 0], chest: [-18, 0, 0], head: [-24, 0, 0], hR: [-60, -5, 0.45], bda: [40, -110], hL: [70, -5, 0.42], y: -0.04, lLeg: [-36, 0, 6], lKnee: [10, 0, 0] }),
  };
  const kneel = B_({ rLeg: [-80, 0, -6], rKnee: [88, 0, 0], lLeg: [8, 0, 6], lKnee: [92, 0, 0], waist: [22, 0, 0], chest: [8, 0, 0], head: [-6, 0, 0], y: -0.42, hR: [-40, -60, 0.4], bda: [-60, -20], hL: [30, -50, 0.3] });
  const knees = P0({ rLeg: [0, 0, -4], rKnee: [90, 0, 0], lLeg: [0, 0, 4], lKnee: [90, 0, 0], waist: [30, 0, 0], chest: [16, 0, 0], head: [26, 0, 0], y: -0.38, hR: [-30, -75, 0.44], bda: [-70, -30], hL: [25, -75, 0.4] });
  const relaxed = P0({ hR: [-20, -70, 0.48], bda: [-42, -20], hL: [25, -78, 0.42], head: [4, -10, 0], rKnee: [4, 0, 0], lKnee: [4, 0, 0] });
  const flick = S(relaxed, { hR: [-55, -45, 0.5], bda: [-30, -70] });
  const duck = B_({ waist: [38, 0, 0], chest: [16, 0, 0], head: [-28, 0, 0], rLeg: [-30, 0, -8], rKnee: [96, 0, 0], lLeg: [-44, 0, 8], lKnee: [96, 0, 0], y: -0.5, hR: [-30, -20, 0.42], bda: [40, -20] });
  const evade = B_({ waist: [-14, 0, 0], chest: [-10, 0, 0], head: [-12, 0, 0], y: -0.12, hR: [-30, -2, 0.42], bda: [70, -20] });
  const kickW = B_({ fkR: true, rLeg: [-62, 0, -4], rKnee: [104, 0, 0], lKnee: [26, 0, 0], waist: [-8, 0, 0], hR: [-30, 0, 0.4], bda: [70, -20] });
  const kickS = S(kickW, { rLeg: [-96, 0, -4], rKnee: [6, 0, 0], waist: [-22, 0, 0], chest: [-8, 0, 0] });

  // ---- move expanders. ts = strike (contact) time.
  function attack(c, ts, m, step) {
    const M = MV[m], x0 = X[c];
    kt(c, ts - 0.46, guard, 'io', 'lead'); k(c, ts - 0.28, M.wind, 'o'); k(c, ts - 0.2, M.wind, 'lin');  // anticipation + short hold
    k(c, ts, M.strike, 'q'); k(c, ts + 0.15, M.follow, 'o'); kt(c, ts + 0.5, guard, 'io', 'rec');        // strike (6 frames), follow-through, recover
    win(c, ts - 0.3, ts + 0.2);
    at(c, ts - 0.28, x0, 0); mv(c, ts, x0 + dir(c) * step, 'o');                                        // step in with the strike
  }
  function block(c, ts, line, push = 0.15) {
    const x0 = X[c];
    kt(c, ts - 0.3, guard, 'io', 'lead'); k(c, ts - 0.04, DEF[line], 'o'); k(c, ts + 0.12, DEF[line], 'lin'); kt(c, ts + 0.44, guard, 'io', 'rec'); win(c, ts - 0.1, ts + 0.16);
    at(c, ts, x0, 0); mv(c, ts + 0.2, x0 - dir(c) * push, 'o');                                         // absorb: pushed back a little
  }
  function parry(c, ts) { const x0 = X[c]; kt(c, ts - 0.28, guard, 'io', 'lead'); k(c, ts - 0.03, DEF.T1, 'o'); k(c, ts + 0.09, DEF.T2, 'o'); kt(c, ts + 0.42, guard, 'io', 'rec'); win(c, ts - 0.1, ts + 0.14); at(c, ts, x0, 0); mv(c, ts + 0.2, x0 - dir(c) * 0.12, 'o'); }
  function dodgeBack(c, ts, d = 0.7) { const x0 = X[c]; kt(c, ts - 0.3, guard, 'io', 'lead'); k(c, ts - 0.06, evade, 'o'); k(c, ts + 0.12, evade, 'lin'); kt(c, ts + 0.42, guard, 'io', 'rec'); win(c, ts - 0.12, ts + 0.16); at(c, ts - 0.24, x0, 0); mv(c, ts + 0.04, x0 - dir(c) * d, 'o'); }
  function duckUnder(c, ts) { win(c, ts - 0.1, ts + 0.2); kt(c, ts - 0.28, guard, 'io', 'lead'); k(c, ts - 0.06, duck, 'o'); k(c, ts + 0.14, duck, 'lin'); }
  function hit(c, ts, side, knock, slideT) {
    const x0 = X[c]; win(c, ts - 0.02, ts + 0.36); kt(c, ts - 0.02, guard, 'lin', 'lead'); k(c, ts + 0.08, HIT[side], 'o'); k(c, ts + 0.32, HIT[side], 'lin', { y: -0.1 });
    at(c, ts, x0, 0); mv(c, ts + (slideT || 0.3), x0 - dir(c) * knock, 'o');
  }
  const WIN = { A: [], B: [] };
  const kt = (c, t, pose, e, tag) => { T[c].push([t, pose, e || 'io', tag]); };
  const win = (c, a, b) => WIN[c].push([a, b]);
  const contactAt = (c, ts, h = 1.25) => () => { const q = pose(c, ts + 0.01).pos; return [q[0], q[1] + h, q[2]]; };

  // ================= the fight (A: Ocean Sword, B: Veilblade) =================
  // 0.0-1.6  both walk in to engagement distance, guards up
  k('A', 0, walkG); k('B', 0, walkG); at('A', 0, -4.0, 0); at('B', 0, 4.0, 0);
  mv('A', 1.6, -1.0); mv('B', 1.6, 1.0); k('A', 1.6, guard); k('B', 1.6, guard);
  // exchange 1: A forehand, B blocks left; A backhand, B blocks right
  attack('A', 2.1, 'fore', 0.35); block('B', 2.1, 'L'); clash(2.1);
  attack('A', 2.62, 'back', 0.25); block('B', 2.62, 'R'); clash(2.62);
  // B takes the initiative: overhead, A steps back out of range (blade lands short)
  attack('B', 3.32, 'over', 0.35); dodgeBack('A', 3.32, 0.75);
  // A punishes the recovery with a thrust; B parries late and gives ground
  attack('A', 3.9, 'thrust', 0.45); parry('B', 3.9); clash(3.9);
  mv('B', 4.25, X.B + 0.3);
  // B forehand, A ducks under it and answers with a rising backhand that lands
  attack('B', 4.62, 'fore', 0.35); duckUnder('A', 4.62);
  k('A', 4.85, MV.back.wind, 'o', { y: -0.3 }); k('A', 5.08, MV.back.strike, 'i'); k('A', 5.22, MV.back.follow, 'o'); k('A', 5.6, guard, 'io');
  at('A', 4.85, X.A, 0); mv('A', 5.08, X.A + 0.3, 'o');
  hit('B', 5.08, 'R', 0.85); clash(5.08, false, 'hit', { at: contactAt('B', 5.08) });
  // reset: both re-guard and reclaim distance
  k('B', 5.75, guard, 'io'); mv('A', 5.95, X.A - 0.15); mv('B', 6.0, X.B - 0.35);
  // B kicks into A's approach; A is driven back to one knee
  k('A', 6.05, guard); mv('A', 6.3, X.A + 0.35);
  k('B', 6.12, guard); k('B', 6.24, kickW, 'o'); k('B', 6.38, kickS, 'i'); k('B', 6.55, kickS, 'lin'); k('B', 6.8, guard, 'io'); at('B', 6.2, X.B, 0); mv('B', 6.38, X.B - 0.3, 'o');
  hit('A', 6.38, 'K', 1.4, 0.38); clash(6.38, false, 'kick', { at: contactAt('A', 6.38, 1.05) });
  k('A', 6.85, kneel, 'o'); k('A', 7.12, kneel, 'lin');
  // A rises and charges; overhead into B's high block, bind, push apart
  k('A', 7.3, guard, 'o'); RUN.A.push([7.32, 7.72]); at('A', 7.32, X.A, 0); mv('A', 7.72, X.B - 2.2, 'lin');
  attack('A', 7.98, 'over', 0.3); block('B', 7.98, 'H', 0.1); clash(7.98, true);
  for (let tb = 8.12; tb < 8.42; tb += 0.1) { k('A', tb, MV.over.strike, 'io', { chest: [26 + 4 * Math.sin(tb * 30), 0, 0] }); k('B', tb, DEF.H, 'io', { y: -0.3 + 0.03 * Math.sin(tb * 30) }); }
  k('A', 8.55, evade, 'o'); k('B', 8.55, evade, 'o'); mv('A', 8.6, X.A - 0.4, 'o'); mv('B', 8.6, X.B + 0.35, 'o'); k('A', 8.8, guard, 'io'); k('B', 8.8, guard, 'io');
  // B thrust, A parries across and steps in; forehand blocked; backhand lands; B goes down
  attack('B', 9.15, 'thrust', 0.4); parry('A', 9.15); mv('A', 9.2, X.A + 0.2); clash(9.15);
  attack('A', 9.58, 'fore', 0.3); block('B', 9.58, 'L'); clash(9.58);
  attack('A', 10.02, 'back', 0.28); hit('B', 10.02, 'R', 0.9); clash(10.02, true, 'hit', { at: contactAt('B', 10.02) });
  k('B', 10.5, knees, 'i'); k('B', 11.0, knees, 'lin');
  k('A', 10.6, guard, 'io'); k('A', 10.95, relaxed, 'io'); k('A', 11.25, flick, 'o'); k('A', 11.6, relaxed, 'io');
  BR.A.push([10.6, 12.0]); BR.B.push([10.5, 12.0]);
  for (const c of ['A', 'B']) T[c] = T[c].filter(key => !key[3] || !WIN[c].some(([a, b]) => key[0] > a - 0.06 && key[0] < b + 0.06));
  export_cross.mid = [0, 0]; export_cross.u = [1, 0]; export_cross.p = [0, 1];
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}
''' + s[b:]
rp("export const SLIDES = { A: [[6.92, 7.6], [17.32, 17.75]], B: [[4.88, 5.3], [8.76, 9.1], [15.22, 15.7], [17.32, 17.72]] };",
   "export const SLIDES = { A: [[6.4, 6.78]], B: [[5.1, 5.38], [10.04, 10.32]] };")

# ---- calm camera: one side of the line (+z), smoothed tracking, cuts every 1.5-3 s, no shake / orbit / handheld
a = s.index("const INS = ["); b = s.index("export function shotAt(t)")
s = s[:a] + r'''const INS = [];
const FLASH = 99;
const SHOTS = [[0.0, 'wide'], [1.75, 'med'], [3.1, 'medLow'], [4.4, 'med'], [5.6, 'wide'], [7.2, 'track'], [7.8, 'med'], [8.95, 'medLow'], [10.25, 'wide'], [11.0, 'closeA']];
function smoothMid(t) { let x = 0, z = 0, n = 0; for (let d = -0.35; d <= 0.351; d += 0.1) { const a = pose('A', t + d).pos, b = pose('B', t + d).pos; x += (a[0] + b[0]) / 2; z += (a[2] + b[2]) / 2; n++; } return v3(x / n, F, z / n); }
''' + s[b:]
rp("export function blurOK(t) { const l = shotAt(t).label; return l !== 'ins' && l !== 'flash'; }", "export function blurOK(t) { return true; }")
rp("export function trailGate(c, t) { return shotAt(t).label === 'ins' ? 0 : 1; }", "export function trailGate(c, t) { return 0; }")
rp("  switch (S.label) {", r"""  const SM = smoothMid(t), Z = v3(0, 0, 1);
  switch (S.label) {
    case 'wide': pos = SM.clone().add(Z.clone().multiplyScalar(7.8)).add(up(1.7)); look = SM.clone().add(up(1.05)); fov = 38; break;
    case 'track': pos = SM.clone().add(Z.clone().multiplyScalar(6.8)).add(up(1.35)); look = SM.clone().add(up(1.0)); fov = 40; break;
    case 'med': pos = SM.clone().add(Z.clone().multiplyScalar(4.9)).add(up(1.45)); look = SM.clone().add(up(1.15)); fov = 40; break;
    case 'medLow': pos = SM.clone().add(Z.clone().multiplyScalar(4.5)).add(up(0.85)); look = SM.clone().add(up(1.3)); fov = 42; break;
    case 'closeA': pos = A.clone().add(v3(1.4, 1.55, 2.8)); look = A.clone().add(up(1.35)); fov = 34; break;""")
rp("  const hh = v3(0.035 * Math.sin(t * 1.7) + 0.02 * Math.sin(t * 4.3), 0.025 * Math.sin(t * 2.3 + 1), 0.03 * Math.cos(t * 1.9));   // handheld drift",
   "  const hh = v3(0, 0, 0);   // no handheld drift")
rp("function shake(t) {", "function shake(t) { return v3(0, 0, 0);")
# ---- subtle effects only
a = s.index("export function effects(t, cam) {")
s = s[:a] + r'''export function effects(t, cam) {
  const add = [], soft = [], flares = [], rings = [], debris = []; const sparkLight = { i: 0, p: [0, 0, 0] };
  const cx = cam.position.x, cz = cam.position.z;
  for (let i = 0; i < 160; i++) {   // a few drifting sand motes for depth
    const x = ((h(i, 1) * 30 + 0.8 * t) % 30 + 30) % 30 - 15 + cx, z = ((h(i, 2) * 30 + 0.3 * t) % 30 + 30) % 30 - 15 + cz;
    const y = F + 0.3 + ((h(i, 4) * 5 + 0.1 * t) % 5 + 5) % 5; soft.push({ p: [x, y, z], c: [1.0, 0.92, 0.75], s: 0.02, a: 0.3 });
  }
  for (const st of STEPS) { const d = t - st.t; if (d < 0 || d > 0.8 || (st.kind !== 'land' && st.kind !== 'skid')) continue;
    const g = W.floorAt(st.p[0], st.p[2]); puff(soft, t, st.t, [st.p[0], g, st.p[2]], st.kind === 'land' ? 6 : 3, Math.round(st.t * 977), 0.3, 0.2, [0.9, 0.8, 0.62], 0.6); }
  for (const c of CONT) { const d = t - c.t, p = c.p; if (d < 0 || d > 0.6) continue;
    if (c.kind === 'blade') { burst(add, t, c.t, p, c.big ? 26 : 16, Math.round(c.t * 100), 0.7);
      if (d < 0.07) { flares.push({ p, s: c.big ? 0.3 : 0.2, a: 1 - d / 0.07 }); sparkLight.i = 3 * (1 - d / 0.07); sparkLight.p = p; } }
  }
  return { add, soft, flares, rings, debris, flash: 0, black: 0, ca: 0, impact: 0, bloomBoost: 0, sparkLight };
}
'''
open('choreo_c.js', 'w', encoding='utf-8').write(s); print('choreo_c.js written', len(s))

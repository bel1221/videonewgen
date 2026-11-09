"""Build fight_v8/choreo.js from fight_v7/choreo.js (mechanics) + parts/build_v8.js (new 30 s choreography) +
parts/camera_v8.js (shots). Run from anim-test/:  python fight_v8/parts/assemble.py"""
import sys
src = open('fight_v7/choreo.js', encoding='utf-8').read()
build = open('fight_v8/parts/build_v8.js', encoding='utf-8').read()
BIND_T = '20.78'
cam = open('fight_v8/parts/camera_v8.js', encoding='utf-8').read().replace('BIND_T_', BIND_T)

def region(s, start, end, new):
    a = s.index(start); b = s.index(end, a)
    return s[:a] + new + s[b:]
def rep(s, old, new, count=1):
    n = s.count(old)
    if n != count: sys.exit(f'expected {count}x, found {n}x: {old[:90]}')
    return s.replace(old, new)

s = src
s = region(s, 'function buildAll() {', 'export const export_cross = {};', build + '\n')
s = region(s, 'const INS = [', '// ------------------------------------------------------------------ effects', cam + '\n')
s = rep(s, '// Choreography, cameras and effect timing for the 20 s fight test.', '// Choreography, cameras and effect timing for the 30 s fight test v8 ("blade masters").')
s = rep(s, 'export const TOTAL = 20.0;', 'export const TOTAL = 30.0;')
s = rep(s, '// v7 = v6 mechanics + new movement-led choreography, wider limbs, Minecraft grip, overhead light.',
        '// v8 = v7 mechanics + NEW choreography (sword skill twirls, strafing/duck/aerial/flurry/bind/finale), sword moves with\n'
        '// the arm (grip blend), standing skids with sand spray, 1.15x sword, bright overhead sun (fight.js).')
# ---- standing slide windows (must match build_v8.js)
s = rep(s, "export const SLIDES = { A: [[2.2, 2.8], [4.0, 4.5], [7.45, 7.9], [13.6, 14.05], [17.88, 18.3]], B: [[2.2, 2.8], [8.7, 9.05], [17.88, 18.3]] };",
        "export const SLIDES = { A: [[4.42, 4.85], [5.85, 6.0], [8.55, 9.0], [14.5, 14.95], [19.3, 19.7], [21.7, 22.05], [24.08, 24.5], [25.95, 26.3]],\n"
        "                        B: [[4.42, 4.85], [5.78, 6.0], [7.0, 7.35], [11.55, 11.95], [16.62, 16.95], [24.08, 24.5], [26.9, 27.3]] };")
# skid drag marks + puffs every 0.05 s instead of 0.25 s (continuous slide trail)
s = rep(s, "if (i % 60 === 0) STEPS.push({ c, t, foot: f, p: [feet[f][0], 0, feet[f][1]], kind: 'skid' });",
        "if (i % 12 === 0) STEPS.push({ c, t, foot: f, p: [feet[f][0], 0, feet[f][1]], kind: 'skid' });")
# ---- new poses
s = rep(s, "L.fallen = S(L.knees,", """// v8 poses
L.skid = S(G, { waist: [-4, -10, 0], chest: [-6, -6, 0], head: [-8, 14, 0], rLeg: [-30, 0, -8], rKnee: [40, 0, 0], lLeg: [22, 0, 10], lKnee: [18, 0, 0],
  rArm: [-40, 0, -52], rElbow: [-18, 0, 0], wrist: 150, lArm: [-24, 0, 60], lElbow: [-20, 0, 0], y: -0.3 });   // standing slide (feet drag), never sitting
L.twirlS = S(G, { rArm: [-38, 0, -72], rElbow: [-24, 0, 0], wrist: 90, chest: [2, -14, 0], waist: [6, -8, 0], head: [-6, 22, 0], lArm: [-30, 0, 34], lElbow: [-50, 0, 0],
  rKnee: [26, 0, 0], lKnee: [22, 0, 0], y: -0.1 });                                                              // sword spun at the side
L.twirlF = S(G, { rArm: [-78, 0, -22], rElbow: [-22, 0, 0], wrist: 90, chest: [4, 10, 0], waist: [6, 4, 0], head: [-8, -6, 0], lArm: [-26, 0, 30], lElbow: [-40, 0, 0], y: -0.12 });   // spun in front
L.point = S(G, { rArm: [-96, 0, -6], rElbow: [-4, 0, 0], wrist: 178, chest: [4, 16, 0], waist: [6, 8, 0], head: [-6, -12, 0], lArm: [-16, 0, 36], lElbow: [-20, 0, 0],
  rLeg: [-30, 0, -6], rKnee: [30, 0, 0], lLeg: [26, 0, 6], lKnee: [18, 0, 0], y: -0.12 });                         // blade levelled at the opponent
L.charge = S(G, { waist: [24, -34, 0], chest: [16, -36, 0], head: [-14, 30, 0], rArm: [-34, 0, -40], rElbow: [-60, 0, 0], wrist: 150, lArm: [-84, 0, 18], lElbow: [-96, 0, 0],
  rLeg: [-52, 0, -6], rKnee: [56, 0, 0], lLeg: [34, 0, 6], lKnee: [14, 0, 0], y: -0.3 });                         // shoulder check
L.fallen = S(L.knees,""")
s = rep(s, "  knees: [-50, -25], fallen: [-10, -90],", "  knees: [-50, -25], fallen: [-10, -90], skid: [10, -115], twirlS: [0, -90], twirlF: [0, -60], point: [2, 0], charge: [40, -60],")
# ---- timelines: twirl windows
s = rep(s, "const T = { A: [], B: [] }, P = { A: [], B: [] }, RUN = { A: [], B: [] }, BR = { A: [], B: [] };",
        "const T = { A: [], B: [] }, P = { A: [], B: [] }, RUN = { A: [], B: [] }, BR = { A: [], B: [] }, TWIRL = { A: [], B: [] };   // TWIRL: [t0, t1, turns]\n"
        "export const PARRY = [];   // v8: defence keys whose parry pose fight.js re-chooses from the real blade geometry")
# ---- grip blend + twirl in poseRaw (after the blade-direction track)
s = rep(s, "  if (BDT[c]) { const v = samp(BDT[c], t), n = Math.hypot(...v) || 1; p.bd = v.map(x => x / n); }",
        """  if (BDT[c]) { const v = samp(BDT[c], t), n = Math.hypot(...v) || 1; p.bd = v.map(x => x / n); }
  // v8: the sword follows the forearm (rigid-grip blend in the rig), eased off around contacts so the clash solve stays exact
  { let m = 1; for (const cl of CLASHES) { const d = Math.abs(t - cl.t); if (d < 0.14) m = Math.min(m, 0.35 + 0.65 * E.io(d / 0.14)); }
    // and where the sword arm itself whips (> ~25 deg/frame), so a fast arm can't snap the blade more than a frame's worth
    const q0 = evalKeysS(T[c], t - 1 / 60), q1 = evalKeysS(T[c], t + 1 / 60), av = Math.max(...[0, 1, 2].map(i => Math.abs(q1.rArm[i] - q0.rArm[i]) + Math.abs(q1.rElbow[i] - q0.rElbow[i])));
    m *= clamp(1 - (av - 25) / 35); p.gk = GK * m; }
  // v8: sword twirls - the blade spins about the forearm; fades in/out over 0.14 s around each window
  p.spinK = 0; p.spin = 0;
  for (const [t0, t1, n] of TWIRL[c]) if (t > t0 - 0.12 && t < t1 + 0.12) { p.spin = 360 * n * E.io(clamp((t - t0) / (t1 - t0))); p.spinK = clamp(Math.min((t - t0 + 0.12) / 0.14, (t1 + 0.12 - t) / 0.14)); }""")
s = rep(s, "const PSIG = (QS_.has('psig') ? +QS_.get('psig') : 30) / 1000;   // v5 default 30 ms",
        "const PSIG = (QS_.has('psig') ? +QS_.get('psig') : 30) / 1000;   // v5 default 30 ms\nconst GK = QS_.has('gk') ? +QS_.get('gk') : 0.38;              // v8 grip blend weight")
# ---- events: twirl swishes (one per half turn)
s = rep(s, "clashes: CONT.map(c => [c.t, c.big, c.kind]), swings: SWINGS() }; }",
        "clashes: CONT.map(c => [c.t, c.big, c.kind]), swings: SWINGS(), twirls: TWIRLS(), ins: INS.slice(), flash: FLASH }; }\n"
        "function TWIRLS() { const out = []; for (const c of ['A', 'B']) for (const [t0, t1, n] of TWIRL[c]) { let k = 1;\n"
        "  for (let t = t0; t <= t1 && k <= 2 * n; t += 1 / 480) if (n * 2 * E.io(clamp((t - t0) / (t1 - t0))) >= k - 0.5) { out.push([+t.toFixed(3), c]); k++; } }\n"
        "  return out.sort((a, b) => a[0] - b[0]); }")
# ---- effects: continuous sand spray while sliding
s = rep(s, "  // bind sparks: small repeating bursts",
        """  // v8: standing slides throw a continuous sand spray from the feet
  for (const c of ['A', 'B']) for (const [a, b] of SLIDES[c]) { if (t < a || t > b + 0.9) continue;
    for (let ts = a; ts <= Math.min(t, b); ts += 0.045) { const q = rootXZ(c, ts), g = W.floorAt(q[0], q[1]);
      puff(soft, t, ts, [q[0], g, q[1]], 3, Math.round(ts * 911) + (c === 'A' ? 1 : 2), 0.22, 0.5, [0.92, 0.82, 0.62], 0.8); } }
  // bind sparks: small repeating bursts""")
# ---- gait overlay: BAD as v7 had it (user 2026-11-10, fight_w spear/hammer: "characters are shaking back and forth so much").
s = rep(s, """    const shift = ls - rs; p.waist[2] += 7 * shift; p.chest[2] -= 5 * shift; p.head[2] -= 2.5 * shift;
    // pelvis rotates with the swinging leg, shoulders counter-rotate (contralateral gait), head holds its aim
    const twist = 11 * (rs - ls); p.waist[1] += twist; p.chest[1] -= twist * 1.4; p.head[1] -= (p.waist[1] + p.chest[1]) * 0.35 * Math.max(rs, ls); }""",
"""    // BAD (do not restore): v7 applied this gait overlay on EVERY planner step at full strength (shift 7, twist 11, head
    // counter-turn 0.35 x torso yaw). Fighting on the spot the planner re-steps ~4.7x/s, so the hips tilted +-7 deg and the
    // pelvis twisted +-11 deg every 0.1-0.15 s and the head yaw toggled -> the whole body shook back and forth (user:
    // "characters are shaking back and forth so much"). Fixed: the overlay only applies in proportion to real travel speed.
    const r0 = samp(S_.root, Math.max(0, t - 0.04)), r1 = samp(S_.root, Math.min(TOTAL, t + 0.04)), gsp = Math.hypot(r1[0] - r0[0], r1[1] - r0[1]) / 0.08;
    const gate = clamp((gsp - 0.8) / 1.6);                      // 0 standing / shuffling, 1 from ~2.4 blocks/s (walk-run)
    const shift = (ls - rs) * gate; p.waist[2] += 5 * shift; p.chest[2] -= 3.5 * shift; p.head[2] -= 2 * shift;
    // pelvis rotates with the swinging leg, shoulders counter-rotate (contralateral gait), head holds its aim
    const twist = 8 * (rs - ls) * gate; p.waist[1] += twist; p.chest[1] -= twist * 1.4; p.head[1] -= (p.waist[1] + p.chest[1]) * 0.35 * Math.max(rs, ls) * gate; }""")
# ---- slide recovery (user, v8 ~5 s: "after sliding back their legs never fully recovered and just glided/hovered into the fight
# again"): the skid drags the planted feet; when the slide ends they stayed where the slide left them, so the next move glided
# on split legs. Now each foot takes a real recovery step back under the body as the slide ends (right, then left 0.07 s later).
s = rep(s, "const feet = { r: null, l: null }, step = { r: null, l: null }, outs = { r: [], l: [] }, Dsm = { r: null, l: null }, lastStep = { r: -9, l: -9 };",
        "const feet = { r: null, l: null }, step = { r: null, l: null }, outs = { r: [], l: [] }, Dsm = { r: null, l: null }, lastStep = { r: -9, l: -9 }, rec = { r: null, l: null };")
s = rep(s, "        const o = f === 'r' ? 'l' : 'r';\n        if (step[f]) {",
        "        if (i > 0 && inWin(SLIDES[c], (i - 1) / HZ) && feet[f] && rec[f] == null) rec[f] = t + (f === 'r' ? 0 : 0.07);   // slide just ended\n"
        "        if (rec[f] != null && t >= rec[f] && !step[f]) { const sd = f === 'r' ? -1 : 1; step[f] = { from: feet[f].slice(), to: [root[i][0] + sd * 0.14 * cy + 0.05 * sy + vx * 0.12, root[i][1] - sd * 0.14 * sy + 0.05 * cy + vz * 0.12], t0: t, dur: 0.15, h: 0.16 }; rec[f] = null; }   // neutral stance under the hips\n"
        "        const o = f === 'r' ? 'l' : 'r';\n        if (step[f]) {")
# ---- run start: BAD as v7 had it (user, v8 ~5 s: legs "glided/hovered into the fight"). Contacts sit at 0.25 / 0.75 of a 2.7-block
# stride, so the second foot first lands after ~2 blocks of travel (~0.5 s) and hangs behind the accelerating body. Now a
# foot whose first contact is late gets a push-off step right at the start of the run.
s = rep(s, """    for (const f of ['r', 'l']) {
      const cs = con.filter(q => q.f === f);""",
"""    { const mk = (i, f) => { const vx = root[i][0] - root[Math.max(i0, i - 6)][0], vz = root[i][1] - root[Math.max(i0, i - 6)][1], vn = Math.hypot(vx, vz) || 1;
        const fx = vx / vn, fz = vz / vn, side = f === 'r' ? -1 : 1; return { i, f, p: [root[i][0] + fx * 0.28 + fz * 0.16 * side, root[i][1] + fz * 0.28 - fx * 0.16 * side] }; };
      for (const f of ['r', 'l']) { const fc = con.find(q => q.f === f), lim = fc ? fc.i : i1; if (fc && (fc.i - i0) / HZ <= 0.2) continue;
        let ie = i0 + 1; while (ie < lim && phiAt(ie) < 0.06) ie++; ie = Math.min(ie + Math.round(0.06 * HZ), lim - Math.round(0.12 * HZ)); if (ie > i0) con.push(mk(ie, f)); }
      con.sort((a, b) => a.i - b.i); }
    for (const f of ['r', 'l']) {
      const cs = con.filter(q => q.f === f);""")
s = rep(s, "for (const [f, off] of [['r', 0.25], ['l', 0.75]]) if", "for (const [f, off] of [['r', 0.12], ['l', 0.62]]) if")   # first contacts sooner after a run starts
open('fight_v8/choreo.js', 'w', encoding='utf-8').write(s)
print('fight_v8/choreo.js', len(s), 'chars')

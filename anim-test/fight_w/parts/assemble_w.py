"""Build fight_w/choreo_<vid>.js from fight_v8/choreo.js (mechanics) + parts/poses_w.js + parts/build_<vid>.js +
parts/camera_<vid>.js. Run from anim-test/:  python fight_w/parts/assemble_w.py spear|hammer|bow|test"""
import sys
vid = sys.argv[1]
src = open('fight_v8/choreo.js', encoding='utf-8').read()
poses = open('fight_w/parts/poses_w.js', encoding='utf-8').read()
build = open(f'fight_w/parts/build_{vid}.js', encoding='utf-8').read() + '\n' + (open('fight_w/parts/common_w.js', encoding='utf-8').read() if vid != 'test' else '')
cam = open(f'fight_w/parts/camera_{vid}.js', encoding='utf-8').read()

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
s = rep(s, '// Choreography, cameras and effect timing for the 30 s fight test v8 ("blade masters").',
        f'// Choreography, cameras and effect timing for the fight_w "{vid}" duel (sword vs a different legendary weapon).')
s = rep(s, 'export const TOTAL = 30.0;', 'export const TOTAL = ' + ('29.0' if vid == 'bolt30' else '37.55' if vid == 'duel40' else '9.45' if vid == 't3' else '10.0' if vid in ('t1', 't2') else '20.0') + ';')
# new pose channels: lh (two-hand IK), rh/draw (bowstring hand), aimK (bow arm aims)
s = rep(s, "function N() { const p = { wrist: 160, roll: 0, y: 0, yawOff: 0, tilt: [0, 0], yawAbs: null, bd: [0, 0.94, 0.34] };",
        "function N() { const p = { wrist: 160, roll: 0, y: 0, yawOff: 0, lh: 0, rh: 0, draw: 0, aimK: 0, wide: 1, plant: 0, pierce: 0, lhAt: 0, tilt: [0, 0], yawAbs: null, bd: [0, 0.94, 0.34] };")
s = rep(s, "const FLAT_KEYS = ['wrist', 'roll', 'y', 'yawOff'];", "const FLAT_KEYS = ['wrist', 'roll', 'y', 'yawOff', 'lh', 'rh', 'draw', 'aimK', 'wide', 'plant', 'pierce', 'lhAt'];")
s = rep(s, "  const o = { wrist: lerp(a.wrist, b.wrist, u), roll: lerp(a.roll, b.roll, u), y: lerp(a.y, b.y, u), yawOff: lerp(a.yawOff, b.yawOff, u),",
        "  const o = { wrist: lerp(a.wrist, b.wrist, u), roll: lerp(a.roll, b.roll, u), y: lerp(a.y, b.y, u), yawOff: lerp(a.yawOff, b.yawOff, u),\n"
        "    lh: lerp(a.lh || 0, b.lh || 0, u), rh: lerp(a.rh || 0, b.rh || 0, u), draw: lerp(a.draw || 0, b.draw || 0, u), aimK: lerp(a.aimK || 0, b.aimK || 0, u), wide: lerp(a.wide ?? 1, b.wide ?? 1, u), plant: lerp(a.plant || 0, b.plant || 0, u), pierce: lerp(a.pierce || 0, b.pierce || 0, u), lhAt: lerp(a.lhAt || 0, b.lhAt || 0, u),")
# weapon poses + their weapon-axis intents
s = rep(s, "// ------------------------------------------------------------------ blade intent", poses + "\n// ------------------------------------------------------------------ blade intent")
s = rep(s, "for (const k in BD) if (L[k]) L[k].bd = bdv(...BD[k]);",
        "for (const k in BD) if (L[k]) L[k].bd = bdv(...BD[k]);\n"
        "const BDW = { windO: [42, -150], windL: [30, 130], gsCrouch: [60, 18], gsHop: [60, 18], gsLand: [60, 18], spIdle: [72, 8], gsIdle: [-32, 8], spCharge: [-4, 30], lieBack: [-8, -95], ready: [64, -6], sprintGo: [20, -150], spReady: [-6, 40], gsGuard: [60, 18], gsPlungeW: [-70, 4], gsPlunge: [-50, 0], gsRest: [-12, 175], slideLow: [10, -115],\n"
        "  parryLowR: [-55, -35], parryLowL: [-55, 35], spGuard: [-6, 46], spWind: [-2, 68], spThrust: [0, 16], spJab: [0, 8], spSweepW: [-28, -60], spSweep: [-30, -60], spOverW: [40, 140], spOver: [-30, 12],\n"
        "  spBlock: [12, -80], spBlockL: [12, 70], spBlockV: [72, 10], spBlockH: [6, -88], hmGuard: [55, 20], hmRest: [-70, -10], hmWindO: [30, 180], hmSlam: [-22, 0], hmWindS: [12, -110], hmSwing: [4, -44],\n"
        "  hmUpperW: [-50, 30], hmUpper: [75, 0], hmBlock: [20, -84], hmBlockL: [20, 84], hmBlockV: [72, 0], hmSweep: [-30, -44], hmSpin: [0, -100], bwIdle: [-50, 20], bwNock: [84, 62], bwDraw: [84, 62], bwLoose: [84, 62], bwBlock: [5, 90] };\n"
        "for (const k in BDW) if (L[k]) L[k].bd = bdv(...BDW[k]);\n"
        "for (const n in L) if (n.startsWith('gs') && !BDW[n]) { const b = n[2].toLowerCase() + n.slice(3); if (L[b] && L[b].bd) { L[n].bd = L[b].bd.slice(); delete L[n]._flat; } }   // greatsword copies inherit the sword blade intents\n"
        "if (L.gsWindR) L.gsWindR.bd = bdv(25, -135);   // greatsword wind-up held out to the side")
# slides are declared by the build (slide(c, t0, t1)); twirls and arrows too
s = region(s, 'export const SLIDES = {', '\nconst inWin', 'export const SLIDES = { A: [], B: [] };')
s = rep(s, "if (e === 'i' && t > 2.5) out.push", "if (e === 'i' && t > 0.3) out.push")
s = rep(s, "export const PARRY = [];", "export const PARRY = [];\nexport const ARROWS = [];   // fight_w bow: { tn (nock), t0 (release), t1 (arrives), mode: 'deflect'|'dodge'|'ground', dx, dz }\nconst GKC = { A: null, B: null };   // per-fighter grip-blend override (bow: 0)")
s = rep(s, "m *= clamp(1 - (av - 25) / 35); p.gk = GK * m; }", "m *= clamp(1 - (av - 25) / 35); p.gk = (GKC[c] ?? GK) * m * (1 - clamp(p.lh || 0)); }")   # two hands on the shaft: its direction comes from the pose (bd), not from the main forearm
s = rep(s, "swings: SWINGS(), twirls: TWIRLS(), ins: INS.slice(), flash: FLASH }; }",
        "swings: SWINGS(), twirls: TWIRLS(), ins: INS.slice(), flash: FLASH, arrows: ARROWS.map(a => [a.tn, a.t0, a.t1, a.mode]), vid: '" + vid + "' }; }")
# effects: arrow deflections (small burst + flare), arrows into the sand (puff), heavy hammer ground hits use 'slam'
s = rep(s, "    if (c.kind === 'kick') { puff(soft, t, c.t, p, 10, 77, 0.5, 0.2); }",
        "    if (c.kind === 'kick') { puff(soft, t, c.t, p, 10, 77, 0.5, 0.2); }\n"
        "    if (c.kind === 'arrow') { burst(add, t, c.t, p, 34, Math.round(c.t * 131), 0.75); if (d >= 0 && d < 0.1) { flares.push({ p, s: 0.7 * (1 - d / 0.1), a: 1 - d / 0.1, rot: c.t * 5 }); sparkLight.i = Math.max(sparkLight.i, 4 * (1 - d / 0.1)); sparkLight.p = p; } }\n"
        "    if (c.kind === 'drag') { const g_ = W.floorAt(p[0], p[2]); puff(soft, t, c.t, [p[0], g_, p[2]], 9, Math.round(c.t * 613), 0.4, 0.7, [0.92, 0.82, 0.62], 0.9); burst(add, t, c.t, [p[0], g_ + 0.05, p[2]], 8, Math.round(c.t * 419), 0.45); }\n"
        "    if (c.kind === 'arrowg') puff(soft, t, c.t, [p[0], W.floorAt(p[0], p[2]), p[2]], 8, Math.round(c.t * 71), 0.35, 0.4, [0.92, 0.82, 0.62], 0.8);")
# ---- DRIFT: keep the fight travelling (user: "where did the fast paced pvp and movements go? theyre standing in place swinging").
# Builds push [t0, t1, mode, speed]: 'strafeL'/'strafeR' = both slide sideways to the fighters' line, 'pushA' = both move from A
# toward B (A presses B back), 'pushB' = the reverse. Integrated at 240 Hz with 0.2 s ease in/out; it is added to both roots, so
# spacing (and every contact) is unchanged while the exchange moves across the sand.
s = rep(s, "function rootXZ(c, t) { return evalPos(P[c], t); }",
"""export const DRIFT = []; let DTAB = null;
function driftTab() {
  const N = Math.ceil(TOTAL * 240) + 2, tab = new Float32Array(N * 2); let x = 0, z = 0;
  for (let i = 0; i < N; i++) { const t = i / 240;
    for (const [t0, t1, mode, spd] of DRIFT) { if (t < t0 || t > t1) continue;
      const w = Math.min(1, (t - t0) / 0.2, (t1 - t) / 0.2), a = evalPos(P.A, t0), b = evalPos(P.B, t0), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz) || 1;
      const ux = dx / d, uz = dz / d, v = mode === 'strafeL' ? [-uz, ux] : mode === 'strafeR' ? [uz, -ux] : mode === 'pushA' ? [ux, uz] : [-ux, -uz];
      x += v[0] * spd * w / 240; z += v[1] * spd * w / 240; }
    tab[i * 2] = x; tab[i * 2 + 1] = z; }
  return tab; }
function driftAt(t) { if (!DRIFT.length) return [0, 0]; if (!DTAB) DTAB = driftTab(); const i = Math.max(0, Math.min(DTAB.length / 2 - 1, Math.round(t * 240))); return [DTAB[i * 2], DTAB[i * 2 + 1]]; }
function rootXZ(c, t) { const p = evalPos(P[c], t), d = driftAt(t); return [p[0] + d[0], p[1] + d[1]]; }""")
# ---- WALK gait (walking out of the arena, calm repositioning): same planner as the run with a short stride, low foot lift,
# long stance and an upright body; the weapon arm keeps its pose (carry), only the free arm swings.
s = rep(s, "const T = { A: [], B: [] }, P = { A: [], B: [] }, RUN = { A: [], B: [] }, BR = { A: [], B: [] }",
           "const WALK = { A: [], B: [] };\nconst T = { A: [], B: [] }, P = { A: [], B: [] }, RUN = { A: [], B: [] }, BR = { A: [], B: [] }")
s = rep(s, """  for (const [t0, t1] of RUN[c]) if (t >= t0 && t <= t1) {
    const a = rootXZ(c, t0), d = Math.hypot(x - a[0], z - a[1]); const phi = d / STRIDE;
    const blend = clamp(Math.min((t - t0) / 0.08, (t1 - t) / 0.1));""",
"""  for (const [t0, t1] of WALK[c]) if (t >= t0 && t <= t1) {   // walk: upright, free arm swings, weapon arm keeps its carry pose
    const a = rootXZ(c, t0), d = Math.hypot(x - a[0], z - a[1]), sw = Math.sin(2 * Math.PI * d / 0.95), bl = clamp(Math.min((t - t0) / 0.25, (t1 - t) / 0.25));
    p.waist = p.waist.map((v, i) => lerp(v, [4, -5 * sw, 0][i], bl)); p.chest[1] += 4 * sw * bl; p.head[1] -= 2 * sw * bl;
    p.lArm = p.lArm.map((v, i) => lerp(v, [-22 * sw, 0, 8][i], bl)); p.lElbow = p.lElbow.map((v, i) => lerp(v, [-14 - 8 * Math.max(0, sw), 0, 0][i], bl)); p.y = lerp(p.y, 0, bl); p.wide = lerp(p.wide ?? 1, 0, bl);
    for (const j of ['rLeg', 'lLeg', 'rKnee', 'lKnee']) p[j] = p[j].map(v => v * (1 - bl)); }   // upright walk: legs straight, gait drives the feet
  for (const [t0, t1] of RUN[c]) if (t >= t0 && t <= t1) {
    const a = rootXZ(c, t0), d = Math.hypot(x - a[0], z - a[1]); const phi = d / STRIDE;
    const blend = clamp(Math.min((t - t0) / 0.18, (t1 - t) / 0.16));   // standard: idle -> run eases in (was a 0.08 s snap)""")
s = rep(s, "  for (const [t0, t1] of RUN[c]) {\n    const i0 = Math.round(t0 * HZ), i1 = Math.min(N - 1, Math.round(t1 * HZ)), a = rawXZ[i0];",
           "  for (const [t0, t1, kind] of [...RUN[c].map(w => [w[0], w[1], 'run']), ...WALK[c].map(w => [w[0], w[1], 'walk'])]) {\n"
           "    const WK = kind === 'walk', STR = WK ? 0.95 : STRIDE, SWH = WK ? 0.12 : 0.5, STF = WK ? 0.55 : 0.22, BOB = WK ? 0.008 : 0.025;\n"
           "    const i0 = Math.round(t0 * HZ), i1 = Math.min(N - 1, Math.round(t1 * HZ)), a = rawXZ[i0];")
s = rep(s, "    const phiAt = i => Math.hypot(rawXZ[i][0] - a[0], rawXZ[i][1] - a[1]) / STRIDE;", "    const phiAt = i => Math.hypot(rawXZ[i][0] - a[0], rawXZ[i][1] - a[1]) / STR;")
s = rep(s, "stance = Math.round(stepLen * 0.22);", "stance = Math.round(stepLen * STF);")
s = rep(s, "0.42 * Math.sin(Math.PI * u) * (1 - 0.3 * u)", "SWH * Math.sin(Math.PI * u) * (1 - 0.3 * u)")
s = rep(s, "g.yoff[i] = -0.025 * Math.cos(2 * Math.PI * (u - 0.25)) - 0.01; } }", "g.yoff[i] = -BOB * Math.cos(2 * Math.PI * (u - 0.25)) - BOB * 0.4; } }")
s = rep(s, "const forced = i => inWin(RUN[c], i / HZ) ||", "const forced = i => inWin(RUN[c], i / HZ) || inWin(WALK[c], i / HZ) ||")
# ---- SLOW MOTION: SLOWMO = [[ta0, ta1, rate]] in animation time. Video time v -> animation time via animAt(v); VIDEO_TOTAL is
# the rendered length. Everything (poses, effects, camera) runs on animation time; fight.js maps each frame through animAt.
s = rep(s, "export const DRIFT = []; let DTAB = null;",
"""export const SLOWMO = [];   // [ta0, ta1, rate] (animation seconds), e.g. [26.1, 26.9, 0.3]
export function animAt(v) { let ta = 0, tv = 0; const segs = SLOWMO.slice().sort((a, b) => a[0] - b[0]);
  for (const [a0, a1, r] of segs) { if (v <= tv + (a0 - ta)) return ta + (v - tv); tv += a0 - ta; ta = a0;
    const dv = (a1 - a0) / r; if (v <= tv + dv) return a0 + (v - tv) * r; tv += dv; ta = a1; } return ta + (v - tv); }
export function videoAt(t) { let ta = 0, tv = 0; for (const [a0, a1, r] of SLOWMO.slice().sort((a, b) => a[0] - b[0])) { if (t <= a0) break; tv += a0 - ta; ta = a0; if (t <= a1) return tv + (t - a0) / r; tv += (a1 - a0) / r; ta = a1; } return tv + (t - ta); }
export function rateAt(t) { for (const [a0, a1, r] of SLOWMO) if (t >= a0 && t <= a1) return r; return 1; }
export const DRIFT = []; let DTAB = null;""")
s = rep(s, "arrows: ARROWS.map(a => [a.tn, a.t0, a.t1, a.mode]), vid: '", "arrows: ARROWS.map(a => [a.tn, a.t0, a.t1, a.mode]), slowmo: SLOWMO, video_total: videoAt(TOTAL), vid: '")
# ---- 'charge' runs: RUN window [t0, t1, 'charge'] keeps the pose's arms (e.g. a spear levelled two-handed) and only runs the body
# and legs - no swing-the-weapon-back-and-forth-again at the end of every sprint (measured 140 deg/frame flips with trailing arms)
s = rep(s, "  for (const [t0, t1] of RUN[c]) if (t >= t0 && t <= t1) {\n    const a = rootXZ(c, t0), d = Math.hypot(x - a[0], z - a[1]); const phi = d / STRIDE;",
           "  for (const [t0, t1, mode] of RUN[c]) if (t >= t0 && t <= t1) {\n    const a = rootXZ(c, t0), d = Math.hypot(x - a[0], z - a[1]); const phi = d / STRIDE;")
s = rep(s, "    const sw = clamp((t1 - 0.12 - t) / 0.2), rb = runBody(phi, cp(p)), r = mix(runArms(phi, cp(rb), false), runArms(phi, cp(rb), true), sw);",
           "    const sw = clamp((t1 - 0.12 - t) / 0.2), rb = runBody(phi, cp(p)), r = mode === 'charge' ? rb : mix(runArms(phi, cp(rb), false), runArms(phi, cp(rb), true), sw);")
# ---- DRIFT FOOTWORK (user: "if leg movement exists make it wide and have fluid motion, not stiff staying in place and sliding across the
# floor"). BAD as it was: during DRIFT the body travelled ~2 blocks/s while the planner only stepped when a foot fell 0.17 behind -> legs
# stayed put and the body glided. Now every DRIFT window is a gait window too ('strafe': stride 1.15, wide 0.21 side stance, lift 0.2).
s = rep(s, "  for (const [t0, t1, kind] of [...RUN[c].map(w => [w[0], w[1], 'run']), ...WALK[c].map(w => [w[0], w[1], 'walk'])]) {\n"
           "    const WK = kind === 'walk', STR = WK ? 0.95 : STRIDE, SWH = WK ? 0.12 : 0.5, STF = WK ? 0.55 : 0.22, BOB = WK ? 0.008 : 0.025;",
           "  for (const [t0, t1, kind] of [...RUN[c].map(w => [w[0], w[1], 'run']), ...WALK[c].map(w => [w[0], w[1], 'walk']), ...DRIFT.map(w => [w[0], w[1], 'strafe'])]) {\n"
           "    const WK = kind === 'walk', SF = kind === 'strafe', STR = SF ? 1.15 : WK ? 0.95 : STRIDE, SWH = SF ? 0.2 : WK ? 0.12 : 0.5, STF = SF ? 0.4 : WK ? 0.55 : 0.22,\n"
           "      BOB = SF ? 0.012 : WK ? 0.008 : 0.025, LAT = SF ? 0.21 : 0.15, FWD = SF ? 0.12 : 0.28;")
s = rep(s, "        con.push({ i, f, p: [root[i][0] + fx * 0.28 + side * 0.15 * lx, root[i][1] + fz * 0.28 + side * 0.15 * lz] });",
           "        con.push({ i, f, p: [root[i][0] + fx * FWD + side * LAT * lx, root[i][1] + fz * FWD + side * LAT * lz] });")
s = rep(s, "return { i, f, p: [root[i][0] + fx * 0.28 + side * 0.15 * lx, root[i][1] + fz * 0.28 + side * 0.15 * lz] }; };",
           "return { i, f, p: [root[i][0] + fx * FWD + side * LAT * lx, root[i][1] + fz * FWD + side * LAT * lz] }; };")
s = rep(s, "const forced = i => inWin(RUN[c], i / HZ) || inWin(WALK[c], i / HZ) ||", "const forced = i => inWin(RUN[c], i / HZ) || inWin(WALK[c], i / HZ) || inWin(DRIFT, i / HZ) ||")
s = rep(s, "  { const o = c === 'A' ? 'B' : 'A', ro = samp(SIM[o].root, t); p.opp = [ro[0], W.floorAt(ro[0], ro[1]), ro[1]]; }",
           "  { const o = c === 'A' ? 'B' : 'A', ro = samp(SIM[o].root, t); p.opp = [ro[0], W.floorAt(ro[0], ro[1]), ro[1]];\n"
           "    const ob = basePose(o, t), pitch = ((ob.waist[0] || 0) + (ob.chest[0] || 0) * 0.6) * Math.PI / 180, oy = ob.yaw * Math.PI / 180, lean = Math.sin(pitch) * 0.95;\n"
           "    p.oppLean = [Math.sin(oy) * lean, 0, Math.cos(oy) * lean, yEff(ob) + 0.035 - (1 - Math.cos(pitch)) * 0.9];   // opponent chest/head offset for the weapon collision\n"
           "    p.oppArms = oppArmPts(ob, ro, p.oppLean);\n"
           "    p.oppFeet = ['r', 'l'].map(s => { const f = samp(SIM[o][s], t); return f ? [f[0], W.floorAt(f[0], f[2]) + f[1] + 0.05, f[2]] : null; });   // opponent legs for the weapon collision\n"
           "    { let k = 1; for (const cl of CLASHES) k = Math.min(k, clamp((Math.abs(t - cl.t) - 0.08) / 0.14)); p.oppFeetK = k; }   // eased off around clashes so the clash solve stays exact\n"
           "  }")
s = rep(s, "  const fr = samp(S_.r, t), fl = samp(S_.l, t);", "  if (GRIPT && GRIPT[c]) { const g = GRIPT[c], x = Math.max(0, Math.min(g.w.length - 2, t * g.hz)), i = Math.floor(x); p.gripW = g.w[i] + (g.w[i + 1] - g.w[i]) * (x - i); }   // support-hand grip (fight.js setGrip)\n  const fr = samp(S_.r, t), fl = samp(S_.l, t);")
s = rep(s, "export const PARRY = [];\nexport const ARROWS", "let GRIPT = null; export function setGrip(g) { GRIPT = g; }\nexport const PARRY = [];\nexport const ARROWS")
s = rep(s, "function rootXZ(c, t) {", "function oppArmPts(ob, ro, lean) {   // opponent arms (shoulder, elbow, hand) from his FK angles + torso turn - weapon collision keeps blades off them\n"
  "  const ty = (ob.yaw + (ob.waist[1] || 0) + (ob.chest[1] || 0)) * Math.PI / 180, cy = Math.cos(ty), sy = Math.sin(ty), g = W.floorAt(ro[0], ro[1]), out = [];\n"
  "  const toW = (x, y, z) => [ro[0] + x * cy + z * sy + lean[0] * 0.8, g + y + lean[3], ro[1] - x * sy + z * cy + lean[2] * 0.8];\n"
  "  for (const sd of ['r', 'l']) { const sx = (sd === 'r' ? -6 : 6) / 16, q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(...ob[sd + 'Arm'].map(v => v * Math.PI / 180), 'XYZ'));\n"
  "    const q2 = q1.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...ob[sd + 'Elbow'].map(v => v * Math.PI / 180), 'XYZ')));\n"
  "    const d1 = new THREE.Vector3(0, -1, 0).applyQuaternion(q1), d2 = new THREE.Vector3(0, -1, 0).applyQuaternion(q2);\n"
  "    const sh = [sx, 22 / 16, 0], el = [sh[0] + d1.x * 4 / 16, sh[1] + d1.y * 4 / 16, sh[2] + d1.z * 4 / 16], hd = [el[0] + d2.x * 5.5 / 16, el[1] + d2.y * 5.5 / 16, el[2] + d2.z * 5.5 / 16];\n"
  "    out.push([toW(...sh), toW(...el), toW(...hd)]); }\n  return out; }\nfunction rootXZ(c, t) {")


open(f'fight_w/choreo_{vid}.js', 'w', encoding='utf-8').write(s)
print(f'fight_w/choreo_{vid}.js', len(s), 'chars')

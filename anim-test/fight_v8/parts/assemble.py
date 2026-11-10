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
# ---- BOUNCE fix (permanent standard: "no player bouncing"; measured ~5 pelvis reversals/s, 8-10/s standing at the spear start).
# BAD as it was: poseRaw lowered the hips each frame from the CURRENT foot targets, lift included, so every planner step raised
# the hips while the foot was in the air and dropped them on landing. Now the drop is computed in the planner from PLANTED feet
# only (lifted feet count at floor height), Gaussian-smoothed (sigma 0.08 s), and sampled in poseRaw. Run bob halved.
s = rep(s, "g.yoff[i] = -0.05 * Math.cos(2 * Math.PI * (u - 0.25)) - 0.01; } }",
        "g.yoff[i] = -0.025 * Math.cos(2 * Math.PI * (u - 0.25)) - 0.01; } }")
s = rep(s, "    SIM[c] = { root: root2, raw: rawXZ, r: outs.r, l: outs.l, yoff: Array.from(G.yoff, v => [v]) };",
"""    // pelvis drop from planted feet only, smoothed (was per-frame in poseRaw from lifted feet too -> bounce on every step)
    const dropRaw = new Float32Array(N);
    for (let i = 0; i < N; i++) { const p = raw[c][i], yawR = p.yaw * Math.PI / 180, rt = root2[i];
      const hipY = W.floorAt(rt[0], rt[1]) + (isAir(p) ? p.y : p.y * 0.8) + G.yoff[i] + 0.75; let drop = 0;
      for (const [f, hx] of [['r', -2 / 16], ['l', 2 / 16]]) { const q = outs[f][i]; if (!q) continue;
        const fy = W.floorAt(q[0], q[2]) + 0.035, hxw = rt[0] + hx * Math.cos(yawR), hzw = rt[1] - hx * Math.sin(yawR), dh = Math.hypot(q[0] - hxw, q[2] - hzw), reach = 0.748;   // real leg length (0.735 bent idle knees ~24 deg)
        if (dh < reach * 0.97) { const need = hipY - fy - Math.sqrt(reach * reach - dh * dh); if (need > drop) drop = need; } }   // out-of-reach (trailing) feet are about to step: never sink the hips for them (that folded knees through the sand)
      dropRaw[i] = Math.min(0.42, drop); }
    const SGd = Math.round(0.11 * HZ), dropS = []; for (let i = 0; i < N; i++) { let a = 0, w = 0; for (let j = -3 * SGd; j <= 3 * SGd; j += 4) { const q = dropRaw[Math.min(N - 1, Math.max(0, i + j))], g = Math.exp(-0.5 * (j / SGd) ** 2); a += q * g; w += g; } dropS.push([a / w]); }
    SIM[c] = { root: root2, raw: rawXZ, r: outs.r, l: outs.l, yoff: Array.from(G.yoff, v => [v]), drop: dropS };""")
s = rep(s, """    const yaw = p.yaw * Math.PI / 180, hipY = p.pos[1] + 0.75; let drop = 0;
    for (const [k, hx] of [['r', -2 / 16], ['l', 2 / 16]]) { const tg = p.ik[k]; if (!tg) continue;
      const hxw = p.pos[0] + hx * Math.cos(yaw), hzw = p.pos[2] - hx * Math.sin(yaw), dh = Math.hypot(tg[0] - hxw, tg[2] - hzw), reach = 0.735;
      if (dh < reach) { const need = hipY - tg[1] - Math.sqrt(reach * reach - dh * dh); if (need > drop) drop = need; } else drop = Math.max(drop, hipY - tg[1]); }
    p.pos[1] -= Math.min(0.42, drop); }""",
"""    p.pos[1] -= samp(S_.drop, t)[0]; }   // smoothed planted-foot pelvis drop from the planner (see simulate)""")
# ---- run arms: BAD as v7 had it (permanent standard: "no frame jumps"). The weapon arm switched from the trailing run pose to the
# fighting pose with a hard cut 0.25 s before a run ended (swordToo = t < t1 - 0.25) -> 100-150 deg/frame weapon flips at every
# sprint start/end. Now both arm states are computed and cross-faded over 0.2 s.
s = rep(s, "    const r = runArms(phi, runBody(phi, cp(p)), t < t1 - 0.25);\n    Object.assign(p, mix(p, r, blend));",
        "    const sw = clamp((t1 - 0.12 - t) / 0.2), rb = runBody(phi, cp(p)), r = mix(runArms(phi, cp(rb), false), runArms(phi, cp(rb), true), sw);\n"
        "    Object.assign(p, mix(p, r, blend));")
# ---- LEGS CROSSING (self-collision QA: shins/thighs passing through each other ~70 frames per duel, mostly when moving sideways).
# BAD as it was: run/walk contacts put each foot to the side of the TRAVEL direction, so strafing/circling placed the feet in front of
# each other and they crossed; the step planner could also aim a foot across the body's midline. Now contacts use the BODY's left/
# right, and every desired foot position keeps >= 0.07 block on its own side of the body.
s = rep(s, "function runGait(c, root, rawXZ, N) {", "function runGait(c, root, rawXZ, N, rawP) {")
s = rep(s, "const rawXZ = raw[c].map(p => [p.pos[0], p.pos[2]]), G = runGait(c, root, rawXZ, N), entry = {};",
           "const rawXZ = raw[c].map(p => [p.pos[0], p.pos[2]]), G = runGait(c, root, rawXZ, N, raw[c]), entry = {};")
s = rep(s, "        con.push({ i, f, p: [root[i][0] + fx * 0.28 + fz * 0.16 * side, root[i][1] + fz * 0.28 - fx * 0.16 * side] });",
           "        const yl = rawP[i].yaw * Math.PI / 180, lx = Math.cos(yl), lz = -Math.sin(yl);   // body LEFT in world (not travel-relative)\n"
           "        con.push({ i, f, p: [root[i][0] + fx * 0.28 + side * 0.15 * lx, root[i][1] + fz * 0.28 + side * 0.15 * lz] });")
s = rep(s, "const fx = vx / vn, fz = vz / vn, side = f === 'r' ? -1 : 1; return { i, f, p: [root[i][0] + fx * 0.28 + fz * 0.16 * side, root[i][1] + fz * 0.28 - fx * 0.16 * side] }; };",
           "const fx = vx / vn, fz = vz / vn, side = f === 'r' ? -1 : 1, yl = rawP[i].yaw * Math.PI / 180, lx = Math.cos(yl), lz = -Math.sin(yl); return { i, f, p: [root[i][0] + fx * 0.28 + side * 0.15 * lx, root[i][1] + fz * 0.28 + side * 0.15 * lz] }; };")
s = rep(s, "Dsm[f] = Dsm[f] ? [lerp(Dsm[f][0], Dr[0], 1), lerp(Dsm[f][1], Dr[1], 1)] : Dr.slice(); const D = Dsm[f];",
           "Dsm[f] = Dsm[f] ? [lerp(Dsm[f][0], Dr[0], 1), lerp(Dsm[f][1], Dr[1], 1)] : Dr.slice(); const D = Dsm[f];\n"
           "        { const sgn = f === 'l' ? 1 : -1, lx = Math.cos(yaw), lz = -Math.sin(yaw), s_ = (D[0] - root[i][0]) * lx + (D[1] - root[i][1]) * lz;   // keep each foot on its own side\n"
           "          if (sgn * s_ < 0.07) { const kk = 0.07 * sgn - s_; D[0] += lx * kk; D[1] += lz * kk; } }")
# ---- STANCE-LEG BOB (user, duel40 start and ~29 s: "the player's stance leg was bobbing again"). BAD as it was: breathing also
# moved the whole body (p.y += 0.008 * amp * sin), so with planted feet the knees flexed rhythmically (+-0.02 at amp 2.6).
# Breathing now moves only the ribcage and head; the pelvis never bobs with breath.
s = rep(s, "p.head[0] -= 1.2 * amp * Math.sin(t * 3.1 + ph + 0.4); p.y += 0.008 * amp * Math.sin(t * 3.1 + ph);",
           "p.head[0] -= 1.2 * amp * Math.sin(t * 3.1 + ph + 0.4);   // BAD removed: p.y += 0.008*amp*sin (breath bobbed the legs)")
# ---- IDLE RE-STEP LOOP (user: "stance leg bobbing" at the start and after the finish). BAD as it was: a foot farther than 0.5 block from
# the hips was forced to step every ~0.2 s, but the wide fighting stance itself puts the back foot ~0.58 away -> it stepped onto the very
# spot it stood on, again and again (lift 0.08, same position). Now the forced step needs the foot to be clearly farther than where the
# pose wants it AND away from that spot; a step never targets the spot the foot already occupies.
s = rep(s, "|| (reach > 0.5 && !step[f] && t - lastStep[f] > 0.06)) {",
           "|| (reach > Math.max(0.5, Math.hypot(D[0] - root[i][0], D[1] - root[i][1]) + 0.15) && Math.hypot(feet[f][0] - D[0], feet[f][1] - D[1]) > 0.08 && !step[f] && t - lastStep[f] > 0.06)) {")
# ---- STANCE WIDTH per pose (user: "stop bending the players leg when they're standing ... walking/idling their legs should be normal").
# v7 widened EVERY stance (x1.45, min 1.9 px): idle and walk poses then needed a deep pelvis drop -> bent knees. Now pose.wide (0..1,
# default 1) scales it: fighting stances stay wide, idle/walk stances are natural width with straight legs.
s = rep(s, "function legFK(leg, knee, hipX) {", "function legFK(leg, knee, hipX, wide = 1) {")
s = rep(s, "const sx = hipX + _v1.x * 1.45; return [Math.sign(hipX) * Math.max(1.9, Math.abs(sx)), _v1.z * 1.35];",
           "const sx = hipX + _v1.x * (1.2 + 0.25 * wide); return [Math.sign(hipX) * Math.max(1.5 + 0.4 * wide, Math.abs(sx)), _v1.z * (1.15 + 0.2 * wide)];")
s = rep(s, "const off = legFK(leg, knee, hx), lx = off[0] / 16, lz = off[1] / 16;", "const off = legFK(leg, knee, hx, p.wide ?? 1), lx = off[0] / 16, lz = off[1] / 16;")
# ---- SPRINT (user: "make their sprint wider and put more motion into it"): longer stride, more hip/shoulder rotation
s = rep(s, "const STRIDE = 2.7;", "const STRIDE = 3.1;")
s = rep(s, "p.waist = [18, -15 * s, 0]; p.chest = [8, p.chest[1] + 10 * s, 0]; p.y = -0.08; return p;",
           "p.waist = [16, -20 * s, 0]; p.chest = [8, p.chest[1] + 15 * s, 0]; p.head = [p.head[0], p.head[1] - 6 * s, 0]; p.y = -0.06; return p;")
# ---- BENT LEGS WHILE STANDING (user: "stop bending the players leg when they're standing", "legs being bent for no reason while fighting").
# BAD as it was: the hips sat at exactly leg length (0.75) while the sole targets sat 0.035 ABOVE the sand -> a 0.035 shortfall that
# the 2-bone IK turns into a ~35 deg knee bend (law of cosines) even in a straight standing pose; and every fighting pose's y (-0.14..-0.34)
# lowered the hips further -> 60-70 deg crouches. Now: the body is lifted by the same 0.035 (straight legs when standing) and shallow
# crouches are compressed (y -0.14 -> -0.06) while deep moves (slam, duck, slide) keep their depth.
s = rep(s, "function isAir(p) {", "function yEff(p) { if (isAir(p) || p.y >= 0) return isAir(p) ? p.y : p.y * 0.8; const a = -p.y; return -(0.25 * a + 0.75 * Math.max(0, a - 0.3)); }   // guard -0.14 -> -0.035 (light athletic bend), slam -0.62 -> -0.4\nfunction isAir(p) {")
s = rep(s, "p.pos = [X, g + (isAir(p) ? p.y : p.y * 0.8) + samp(S_.yoff, t)[0], Z];", "p.pos = [X, g + yEff(p) + 0.035 + samp(S_.yoff, t)[0], Z];")
s = rep(s, "const hipY = W.floorAt(rt[0], rt[1]) + (isAir(p) ? p.y : p.y * 0.8) + G.yoff[i] + 0.75;", "const hipY = W.floorAt(rt[0], rt[1]) + yEff(p) + 0.035 + G.yoff[i] + 0.75;")
open('fight_v8/choreo.js', 'w', encoding='utf-8').write(s)
print('fight_v8/choreo.js', len(s), 'chars')

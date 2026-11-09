"""Build fight_w/choreo_<vid>.js from fight_v8/choreo.js (mechanics) + parts/poses_w.js + parts/build_<vid>.js +
parts/camera_<vid>.js. Run from anim-test/:  python fight_w/parts/assemble_w.py spear|hammer|bow|test"""
import sys
vid = sys.argv[1]
src = open('fight_v8/choreo.js', encoding='utf-8').read()
poses = open('fight_w/parts/poses_w.js', encoding='utf-8').read()
build = open(f'fight_w/parts/build_{vid}.js', encoding='utf-8').read() + '\n' + (open('fight_w/parts/common_w.js', encoding='utf-8').read() if vid != 'test' else '')
cam = open(f'fight_w/parts/camera_{vid if vid != "test" else "test"}.js', encoding='utf-8').read()

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
s = rep(s, 'export const TOTAL = 30.0;', 'export const TOTAL = 20.0;')
# new pose channels: lh (two-hand IK), rh/draw (bowstring hand), aimK (bow arm aims)
s = rep(s, "function N() { const p = { wrist: 160, roll: 0, y: 0, yawOff: 0, tilt: [0, 0], yawAbs: null, bd: [0, 0.94, 0.34] };",
        "function N() { const p = { wrist: 160, roll: 0, y: 0, yawOff: 0, lh: 0, rh: 0, draw: 0, aimK: 0, tilt: [0, 0], yawAbs: null, bd: [0, 0.94, 0.34] };")
s = rep(s, "const FLAT_KEYS = ['wrist', 'roll', 'y', 'yawOff'];", "const FLAT_KEYS = ['wrist', 'roll', 'y', 'yawOff', 'lh', 'rh', 'draw', 'aimK'];")
s = rep(s, "  const o = { wrist: lerp(a.wrist, b.wrist, u), roll: lerp(a.roll, b.roll, u), y: lerp(a.y, b.y, u), yawOff: lerp(a.yawOff, b.yawOff, u),",
        "  const o = { wrist: lerp(a.wrist, b.wrist, u), roll: lerp(a.roll, b.roll, u), y: lerp(a.y, b.y, u), yawOff: lerp(a.yawOff, b.yawOff, u),\n"
        "    lh: lerp(a.lh || 0, b.lh || 0, u), rh: lerp(a.rh || 0, b.rh || 0, u), draw: lerp(a.draw || 0, b.draw || 0, u), aimK: lerp(a.aimK || 0, b.aimK || 0, u),")
# weapon poses + their weapon-axis intents
s = rep(s, "// ------------------------------------------------------------------ blade intent", poses + "\n// ------------------------------------------------------------------ blade intent")
s = rep(s, "for (const k in BD) if (L[k]) L[k].bd = bdv(...BD[k]);",
        "for (const k in BD) if (L[k]) L[k].bd = bdv(...BD[k]);\n"
        "const BDW = { parryLowR: [-55, -35], parryLowL: [-55, 35], spGuard: [-6, 46], spWind: [-2, 68], spThrust: [0, 16], spJab: [0, 8], spSweepW: [-28, -60], spSweep: [-30, -60], spOverW: [55, 160], spOver: [-30, 12],\n"
        "  spBlock: [12, -80], spBlockL: [12, 70], spBlockV: [72, 10], spBlockH: [6, -88], hmGuard: [55, 20], hmRest: [-70, -10], hmWindO: [30, 180], hmSlam: [-22, 0], hmWindS: [12, -110], hmSwing: [4, -44],\n"
        "  hmUpperW: [-50, 30], hmUpper: [75, 0], hmBlock: [20, -84], hmBlockL: [20, 84], hmBlockV: [72, 0], hmSweep: [-30, -44], hmSpin: [0, -100], bwIdle: [-50, 20], bwNock: [84, 62], bwDraw: [84, 62], bwLoose: [84, 62], bwBlock: [5, 90] };\n"
        "for (const k in BDW) if (L[k]) L[k].bd = bdv(...BDW[k]);")
# slides are declared by the build (slide(c, t0, t1)); twirls and arrows too
s = region(s, 'export const SLIDES = {', '\nconst inWin', 'export const SLIDES = { A: [], B: [] };')
s = rep(s, "if (e === 'i' && t > 2.5) out.push", "if (e === 'i' && t > 0.3) out.push")
s = rep(s, "export const PARRY = [];", "export const PARRY = [];\nexport const ARROWS = [];   // fight_w bow: { tn (nock), t0 (release), t1 (arrives), mode: 'deflect'|'dodge'|'ground', dx, dz }\nconst GKC = { A: null, B: null };   // per-fighter grip-blend override (bow: 0)")
s = rep(s, "m *= clamp(1 - (av - 25) / 35); p.gk = GK * m; }", "m *= clamp(1 - (av - 25) / 35); p.gk = (GKC[c] ?? GK) * m; }")
s = rep(s, "swings: SWINGS(), twirls: TWIRLS(), ins: INS.slice(), flash: FLASH }; }",
        "swings: SWINGS(), twirls: TWIRLS(), ins: INS.slice(), flash: FLASH, arrows: ARROWS.map(a => [a.tn, a.t0, a.t1, a.mode]), vid: '" + vid + "' }; }")
# effects: arrow deflections (small burst + flare), arrows into the sand (puff), heavy hammer ground hits use 'slam'
s = rep(s, "    if (c.kind === 'kick') { puff(soft, t, c.t, p, 10, 77, 0.5, 0.2); }",
        "    if (c.kind === 'kick') { puff(soft, t, c.t, p, 10, 77, 0.5, 0.2); }\n"
        "    if (c.kind === 'arrow') { burst(add, t, c.t, p, 34, Math.round(c.t * 131), 0.75); if (d >= 0 && d < 0.1) { flares.push({ p, s: 0.7 * (1 - d / 0.1), a: 1 - d / 0.1, rot: c.t * 5 }); sparkLight.i = Math.max(sparkLight.i, 4 * (1 - d / 0.1)); sparkLight.p = p; } }\n"
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
open(f'fight_w/choreo_{vid}.js', 'w', encoding='utf-8').write(s)
print(f'fight_w/choreo_{vid}.js', len(s), 'chars')

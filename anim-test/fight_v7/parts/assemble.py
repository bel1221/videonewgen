"""Build fight_v7/choreo.js from fight_v6/choreo.js: new choreography + camera, wider limb motion. Run from anim-test/."""
import io, sys
src = open('fight_v6/choreo.js', encoding='utf-8').read()
build = open('fight_v7/parts/build_v7.js', encoding='utf-8').read()
cam = open('fight_v7/parts/camera_v7.js', encoding='utf-8').read()

def region(s, start, end, new):
    a = s.index(start); b = s.index(end, a)
    return s[:a] + new + s[b:]
def rep(s, old, new, count=1):
    n = s.count(old)
    if n != count: sys.exit(f'expected {count}x, found {n}x: {old[:80]}')
    return s.replace(old, new)

s = src
s = rep(s, '// v4 fight', '// v7 fight', 0) if False else s
s = region(s, 'function buildAll() {', 'export const export_cross = {};', build + '\n')
s = region(s, 'const INS = [', '// ------------------------------------------------------------------ effects', cam + '\n')
s = rep(s, "export const SLIDES = { A: [[6.92, 7.6], [17.32, 17.75]], B: [[4.88, 5.3], [8.76, 9.1], [15.22, 15.7], [17.32, 17.72]] };",
        "export const SLIDES = { A: [[2.2, 2.8], [4.0, 4.5], [7.45, 7.9], [13.6, 14.05], [17.88, 18.3]], B: [[2.2, 2.8], [8.7, 9.05], [17.88, 18.3]] };")
# effects that pointed at v4 moments
s = rep(s, "const bc = CONT.find(x => Math.abs(x.t - 11.62) < 0.01);", "const bc = CONT.find(x => Math.abs(x.t - BIND_T) < 0.01);")
s = rep(s, "for (let tb = 11.7; tb < 12.5; tb += 0.11)", "for (let tb = BIND_T + 0.08; tb < BIND_END; tb += 0.11)")
s = rep(s, "{ const pb = rootXZ('B', 19.38); puff(soft, t, 19.38, [pb[0], F, pb[1]]", "{ const pb = rootXZ(FALL_C, FALL_T); puff(soft, t, FALL_T, [pb[0], F, pb[1]]")
# ---- wider, more natural limb motion (user: arms and legs swing out more and wider)
s = rep(s, "const STRIDE = 2.2;", "const STRIDE = 2.7;")                                               # longer strides
s = rep(s, "p.waist = [16, -9 * s, 0]; p.chest = [6, p.chest[1] + 6 * s, 0];", "p.waist = [18, -15 * s, 0]; p.chest = [8, p.chest[1] + 10 * s, 0];")
s = rep(s, "p.lArm = [-52 * s, 0, 8]; p.lElbow = [-84 - 16 * Math.max(0, s), 0, 0];", "p.lArm = [-82 * s, 0, 14]; p.lElbow = [-78 - 28 * Math.max(0, s), 0, 0];")
s = rep(s, "p.rArm = [28 + 12 * s, 0, -10]; p.rElbow = [-32 - 6 * s, 0, 0];", "p.rArm = [26 + 30 * s, 0, -16]; p.rElbow = [-30 - 14 * s, 0, 0];")
s = rep(s, "[root[i][0] + fx * 0.2 + fz * 0.13 * side, root[i][1] + fz * 0.2 - fx * 0.13 * side]", "[root[i][0] + fx * 0.28 + fz * 0.16 * side, root[i][1] + fz * 0.28 - fx * 0.16 * side]")
s = rep(s, "0.3 * Math.sin(Math.PI * u) * (1 - 0.3 * u)", "0.42 * Math.sin(Math.PI * u) * (1 - 0.3 * u)")   # knees come up higher
s = rep(s, "h: run ? 0.2 : Math.min(0.2, 0.05 + 0.2 * err)", "h: run ? 0.28 : Math.min(0.26, 0.07 + 0.24 * err)")
s = rep(s, "to: [D[0] + vx * dur * 0.6, D[1] + vz * dur * 0.6]", "to: [D[0] + vx * dur * 0.75, D[1] + vz * dur * 0.75]")
s = rep(s, "const sx = hipX + _v1.x * 1.25; return [Math.sign(hipX) * Math.max(1.6, Math.abs(sx)), _v1.z * 1.2];",
        "const sx = hipX + _v1.x * 1.45; return [Math.sign(hipX) * Math.max(1.9, Math.abs(sx)), _v1.z * 1.35];")   # wider, longer stance
s = rep(s, "const shift = ls - rs; p.waist[2] += 5 * shift; p.chest[2] -= 3.5 * shift; p.head[2] -= 2 * shift;",
        "const shift = ls - rs; p.waist[2] += 7 * shift; p.chest[2] -= 5 * shift; p.head[2] -= 2.5 * shift;")
s = rep(s, "const twist = 7 * (rs - ls);", "const twist = 11 * (rs - ls);")
s = rep(s, "const LAG = { waist: 0.03, chest: 0.015, lArm: -0.012, rElbow: -0.02, lElbow: -0.03, head: -0.035 };",
        "const LAG = { waist: 0.03, chest: 0.015, lArm: -0.04, rElbow: -0.025, lElbow: -0.05, head: -0.035 };")   # free arm trails more
s = rep(s, "  for (const j in LAG) { const q = evalKeysS(T[c], t + LAG[j]); p[j] = p[j].map((v, i) => v + (q[j][i] - k0[j][i])); }",
        "  for (const j in LAG) { const q = evalKeysS(T[c], t + LAG[j]); p[j] = p[j].map((v, i) => v + (q[j][i] - k0[j][i])); }\n"
        "  p.lArm = p.lArm.map(v => v * 1.25); p.lElbow = p.lElbow.map(v => v * 1.1);                   // v7: free arm swings out wider")
s = rep(s, "// v6: blade-direction track.", "// v7 = v6 mechanics + new movement-led choreography, wider limbs, Minecraft grip, overhead light.\n// v6: blade-direction track.")
open('fight_v7/choreo.js', 'w', encoding='utf-8').write(s)
print('fight_v7/choreo.js', len(s), 'chars')

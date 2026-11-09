"""Patch a fight.js (v4 baseline or current) with the SAME isolated-test harness, without changing its animation code:
  ?iso=1     locked side camera (one side of the line, smoothed midpoint, fixed height/distance/FOV), no shake
  ?novfx=1   every visual effect off: particles, flares, rings, debris, trails, ghost copies, footprints, flash/CA/impact
  window.__probe = { cast, C, applyPose, THREE, floorAt }   for direct skeleton measurements
python ab_harness.py path/to/fight.js"""
import sys
p = sys.argv[1]; f = open(p, encoding='utf-8').read()
if '__probe' in f: print('already patched', p); sys.exit()
def rp(a, b):
    global f
    assert a in f, (p, a[:70]); f = f.replace(a, b, 1)
rp("for (const k in cast) scene.add(cast[k].root);", "for (const k in cast) scene.add(cast[k].root);\nwindow.__probe = { cast, C, applyPose, THREE, floorAt };")
cam_line = "let cam = C.camera(t, cast);" if "let cam = C.camera(t, cast);" in f else "const cam = C.camera(t, cast);"
rp(cam_line, cam_line.replace("const cam", "let cam") + """
  if (params.get('iso')) { let mx = 0, mz = 0, n = 0; for (let d = -0.5; d <= 0.501; d += 0.125) { const a = C.pose('A', t + d).pos, b = C.pose('B', t + d).pos; mx += (a[0] + b[0]) / 2; mz += (a[2] + b[2]) / 2; n++; }
    mx /= n; mz /= n; cam = { pos: new THREE.Vector3(mx, FLOOR + 1.5, mz + 7.2), look: new THREE.Vector3(mx, FLOOR + 1.0, mz), fov: 40, roll: 0, label: 'iso' }; }""")
rp("  const fx = C.effects(t, camera);", """  const fx = C.effects(t, camera);
  if (params.get('novfx')) { fx.add = []; fx.soft = []; fx.flares = []; fx.rings = []; fx.debris = []; fx.flash = 0; fx.black = 0; fx.ca = 0; fx.impact = 0; fx.bloomBoost = 0; fx.sparkLight = { i: 0, p: [0, 0, 0] };
    for (const k of ['A', 'B']) { TRAIL[k].mesh.visible = false; if (typeof GHOSTS !== 'undefined') GHOSTS[k].forEach(g => g.visible = false); }
    if (typeof FP !== 'undefined') FP.count = 0; }""")
open(p, 'w', encoding='utf-8').write(f); print('patched', p)

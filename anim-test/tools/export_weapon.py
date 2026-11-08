"""Export a legendary weapon from the user's .bbmodel to JSON quads + PNG textures for the three.js test.
Grip at the origin, blade along +y (local), length in pixels (1 block = 16 px).
    python anim-test/tools/export_weapon.py Aegisblade 20     (run from the repo root)"""
import sys, os, json
import numpy as np
from PIL import Image
sys.path.insert(0, 'newgen-ban/tools')
import mcchar as MC
name, length = sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 20.0
R = MC._bb(); g = next(g for g in R.d['outliner'] if g['name'] == name)
fl = [x for e in R.collect(g) for x in R.faces(e)]
pts = np.array([p for _, P, _ in fl for p in P] + [P[1] + P[2] - P[0] for _, P, _ in fl])
mn, mx = pts.min(0), pts.max(0); s = length / max(1e-6, mx[1] - mn[1])
gp = np.array([(mn[0] + mx[0]) / 2, mn[1] + 0.12 * (mx[1] - mn[1]), (mn[2] + mx[2]) / 2])
out = dict(name=name, textures=[], quads=[])
os.makedirs('anim-test/web/assets', exist_ok=True); used = {}
for k, P, fc in fl:
    ti = fc['texture']
    if ti not in used:
        frs, uw, uh, ft = R.TEX[ti]; fn = f'{name.lower()}_{ti}.png'
        Image.fromarray(np.asarray(frs[0])).save('anim-test/web/assets/' + fn); used[ti] = len(out['textures'])
        out['textures'].append(dict(file=fn, w=int(frs[0].shape[1]), h=int(frs[0].shape[0]), uw=uw, uh=uh))
    u1, v1, u2, v2 = fc['uv']; uvs = [(u1, v1), (u2, v1), (u2, v2), (u1, v2)]
    r = int(fc.get('rotation', 0)) // 90 % 4; uvs = uvs[r:] + uvs[:r]
    (ua, va), (ub, vb), _, (uc, vc) = uvs
    q = [((p - gp) * s).round(4).tolist() for p in P[:3]]
    out['quads'].append(dict(t=used[ti], p=q, uv=[[ua, va], [ub, vb], [uc, vc]]))
json.dump(out, open(f'anim-test/web/assets/{name.lower()}.json', 'w'))
print(name, len(out['quads']), 'quads', len(out['textures']), 'textures')

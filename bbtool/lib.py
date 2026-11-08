import os, sys, json, importlib.util
import numpy as np
sys.argv = ['x', sys.argv[1]]
spec = importlib.util.spec_from_file_location('R', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'render.py')); R = importlib.util.module_from_spec(spec); spec.loader.exec_module(R)
from PIL import Image
G = [(g['name'], R.collect(g)) for g in R.d['outliner'] if g['name'] not in R.DUPES]
OUT = os.environ.get('OUT', 'bb_out') + '/'; os.makedirs(OUT, exist_ok=True)
def pack(color, path):
    w, h = color.size; a = color.getchannel('A')
    out = Image.new('RGB', (w, h * 2), (0, 0, 0)); out.paste(color.convert('RGB'), (0, 0), a)
    out.paste(Image.merge('RGB', (a, a, a)), (0, h)); out.save(path, optimize=True); print(path, out.size)
T = 320
# all weapons, 3/4 view, centred in tiles
C = 7; sheet = Image.new('RGBA', (C * T, C * T), (0, 0, 0, 0)); names = []
R.YAW, R.PITCH = -35, 25
for i, (n, els) in enumerate(G):
    im = R.render(els, 900); im.thumbnail((T - 16, T - 16), Image.LANCZOS)
    r, c = divmod(i, C); sheet.alpha_composite(im, (c * T + (T - im.width) // 2, r * T + (T - im.height) // 2)); names.append(n)
pack(sheet, OUT + 'lib_all.png')
# turntables
HERO = ['Aegisblade', 'Veilblade', 'Ocean Sword', 'Thundermaul']; NF = 30
D = dict(G); sheet = Image.new('RGBA', (12 * T, 10 * T), (0, 0, 0, 0))
for h, n in enumerate(HERO):
    els = D[n]; pts = np.array([p for e in els for _, P, _ in R.faces(e) for p in P]); c0 = (pts.min(0) + pts.max(0)) / 2; rad = np.linalg.norm(pts - c0, axis=1).max()
    for f in range(NF):
        R.YAW = -35 + 360 * f / NF; R.PITCH = 18
        V = R.rmat([R.PITCH, 0, 0]) @ R.rmat([0, R.YAW, 0]); q = V @ c0
        R.FIT = (900 * 0.49 / rad, q[0], q[1])
        im = R.render(els, 900, crop=False).resize((T, T), Image.LANCZOS)
        k = h * NF + f; r, c = divmod(k, 12); sheet.alpha_composite(im, (c * T, r * T))
    R.FIT = None
pack(sheet, OUT + 'lib_spin.png')
json.dump({'all': names, 'tile': T, 'cols_all': 7, 'hero': HERO, 'nf': NF, 'cols_spin': 12}, open(OUT + 'lib_meta.json', 'w'))
print(names)

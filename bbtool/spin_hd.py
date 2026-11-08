import os, sys, importlib.util
import numpy as np
sys.argv = ['x', sys.argv[1]]
spec = importlib.util.spec_from_file_location('R', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'render.py')); R = importlib.util.module_from_spec(spec); spec.loader.exec_module(R)
from PIL import Image
OUT = os.environ.get('OUT', 'bb_out') + '/'; os.makedirs(OUT, exist_ok=True)
D = {g['name']: R.collect(g) for g in R.d['outliner']}
T, NF, C = 360, 144, 12
for n, fn in (('Aegisblade', 'spin_aegisblade'), ('Veilblade', 'spin_veilblade'), ('Ocean Sword', 'spin_oceansword'), ('Thundermaul', 'spin_thundermaul')):
    els = D[n]; pts = np.array([p for e in els for _, P, _ in R.faces(e) for p in P]); c0 = (pts.min(0) + pts.max(0)) / 2; rad = np.linalg.norm(pts - c0, axis=1).max()
    sheet = Image.new('RGBA', (C * T, (NF // C) * T), (0, 0, 0, 0))
    for f in range(NF):
        R.YAW = -35 + 360 * f / NF; R.PITCH = 18
        V = R.rmat([R.PITCH, 0, 0]) @ R.rmat([0, R.YAW, 0]); q = V @ c0
        R.FIT = (1080 * 0.49 / rad, q[0], q[1])
        im = R.render(els, 1080, crop=False).resize((T, T), Image.LANCZOS)
        sheet.alpha_composite(im, ((f % C) * T, (f // C) * T))
    w, h = sheet.size; a = sheet.getchannel('A'); out = Image.new('RGB', (w, h * 2)); out.paste(sheet.convert('RGB'), (0, 0), a); out.paste(Image.merge('RGB', (a, a, a)), (0, h))
    out.save(OUT + fn + '.png', optimize=True); print(fn, out.size, flush=True)

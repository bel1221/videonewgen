# 144-angle spin of one legendary -> src/spin_<key>.npy (144,360,360,4). python tools/spin_br.py <bbmodel> <group name> <key>
import os, sys, importlib.util, time
import numpy as np
name, key = sys.argv[2], sys.argv[3]
sys.argv = ['x', sys.argv[1], 'comp/bb_tmp']
spec = importlib.util.spec_from_file_location('R', '../bbtool/render.py'); R = importlib.util.module_from_spec(spec); spec.loader.exec_module(R)
from PIL import Image
D = {g['name']: R.collect(g) for g in R.d['outliner'] if isinstance(g, dict)}
if name == '?': print(sorted(D)); sys.exit()
T, NF = 360, 144; els = D[name]
pts = np.array([p for e in els for _, P, _ in R.faces(e) for p in P]); c0 = (pts.min(0) + pts.max(0)) / 2; rad = np.linalg.norm(pts - c0, axis=1).max()
out = np.zeros((NF, T, T, 4), np.uint8); t0 = time.time()
for f in range(NF):
    R.YAW = -35 + 360 * f / NF; R.PITCH = 18
    V = R.rmat([R.PITCH, 0, 0]) @ R.rmat([0, R.YAW, 0]); q = V @ c0
    R.FIT = (1080 * 0.49 / rad, q[0], q[1])
    out[f] = np.asarray(R.render(els, 1080, crop=False).resize((T, T), Image.LANCZOS))
    if f == 2: print(key, 'eta', round((time.time() - t0) / 3 * NF), 's', flush=True)
np.save(f'src/spin_{key}.npy', out); print(key, 'done', round(time.time() - t0), flush=True)

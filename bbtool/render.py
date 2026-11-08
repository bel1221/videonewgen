import json, base64, io, math, sys, os, re
import numpy as np
from PIL import Image
SRC, OUT = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else '/tmp/x'
YAW, PITCH = float(os.environ.get('YAW', '-35')), float(os.environ.get('PITCH', '25'))
os.makedirs(OUT, exist_ok=True)
d = json.load(open(SRC))
TEX = []
for t in d['textures']:
    im = Image.open(io.BytesIO(base64.b64decode(t['source'].split(',', 1)[1]))).convert('RGBA')
    w = im.width; fh = int(w * t.get('uv_height', 16) / t.get('uv_width', 16))
    a = np.asarray(im); fr = [a[i:i + fh] for i in range(0, im.height - fh + 1, fh)] if im.height > fh and im.height % fh == 0 else [a]
    TEX.append((fr, t.get('uv_width', 16), t.get('uv_height', 16), t.get('frame_time', 1) or 1))
EL = {e['uuid']: e for e in d['elements']}
def rmat(r):
    x, y, z = [math.radians(a) for a in r]
    Rx = np.array([[1, 0, 0], [0, math.cos(x), -math.sin(x)], [0, math.sin(x), math.cos(x)]])
    Ry = np.array([[math.cos(y), 0, math.sin(y)], [0, 1, 0], [-math.sin(y), 0, math.cos(y)]])
    Rz = np.array([[math.cos(z), -math.sin(z), 0], [math.sin(z), math.cos(z), 0], [0, 0, 1]])
    return Rz @ Ry @ Rx
SHADE = {'up': 1.0, 'down': 0.55, 'north': 0.82, 'south': 0.82, 'east': 0.68, 'west': 0.68}
def faces(e, M=np.eye(3), O=np.zeros(3)):
    inf = e.get('inflate', 0); f = np.array(e['from'], float) - inf; t = np.array(e['to'], float) + inf
    R = rmat(e.get('rotation', [0, 0, 0])); o = np.array(e.get('origin', [0, 0, 0]), float)
    fx, fy, fz = f; tx, ty, tz = t
    C = {'north': ((tx, ty, fz), (fx, ty, fz), (tx, fy, fz)), 'south': ((fx, ty, tz), (tx, ty, tz), (fx, fy, tz)),
         'east': ((tx, ty, tz), (tx, ty, fz), (tx, fy, tz)), 'west': ((fx, ty, fz), (fx, ty, tz), (fx, fy, fz)),
         'up': ((fx, ty, fz), (tx, ty, fz), (fx, ty, tz)), 'down': ((fx, fy, tz), (tx, fy, tz), (fx, fy, fz))}
    for k, fc in e['faces'].items():
        if fc.get('texture') is None or k not in C: continue
        P = [(R @ (np.array(p) - o) + o) for p in C[k]]
        P = [M @ (p - O) + O for p in P]
        yield k, P, fc
TIME = 0.0
FIT = None
def render(els, S=1100, crop=True):
    fl = [x for e in els for x in faces(e)]
    if not fl: return None
    pts = np.array([p for _, P, _ in fl for p in P] + [P[1] + P[2] - P[0] for _, P, _ in fl])
    V = rmat([PITCH, 0, 0]) @ rmat([0, YAW, 0])
    sp = pts @ V.T; mn, mx = sp.min(0), sp.max(0); ext = max(mx[0] - mn[0], mx[1] - mn[1]) or 1
    sc = (S * 0.9) / ext; cx, cy = (mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2
    if FIT: sc, cx, cy = FIT
    def proj(p): q = V @ p; return np.array([S / 2 + (q[0] - cx) * sc, S / 2 - (q[1] - cy) * sc, q[2]])
    img = np.zeros((S, S, 4), np.float32); zb = np.full((S, S), -1e9, np.float32)
    for k, P, fc in fl:
        A, B, Cc = [proj(p) for p in P]
        e1, e2 = B - A, Cc - A; det = e1[0] * e2[1] - e1[1] * e2[0]
        if abs(det) < 1e-6: continue
        D = A + e1 + e2; xs = [A[0], B[0], Cc[0], D[0]]; ys = [A[1], B[1], Cc[1], D[1]]
        x0, x1 = max(0, int(min(xs))), min(S - 1, int(math.ceil(max(xs)))); y0, y1 = max(0, int(min(ys))), min(S - 1, int(math.ceil(max(ys))))
        if x1 < x0 or y1 < y0: continue
        X, Y = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        dx, dy = X - A[0], Y - A[1]
        s = (dx * e2[1] - dy * e2[0]) / det; t = (e1[0] * dy - e1[1] * dx) / det
        m = (s >= 0) & (s <= 1) & (t >= 0) & (t <= 1)
        if not m.any(): continue
        z = A[2] + s * e1[2] + t * e2[2]
        u1, v1, u2, v2 = fc['uv']; uvs = [(u1, v1), (u2, v1), (u2, v2), (u1, v2)]
        r = int(fc.get('rotation', 0)) // 90 % 4; uvs = uvs[r:] + uvs[:r]
        (ua, va), (ub, vb), _, (uc, vc) = uvs
        U = ua + s * (ub - ua) + t * (uc - ua); W_ = va + s * (vb - va) + t * (vc - va)
        frs, uw, uh, ft = TEX[fc['texture']]; tex = frs[int(TIME * 20 / ft) % len(frs)]; th, tw = tex.shape[:2]
        px = np.clip((U * tw / uw).astype(int), 0, tw - 1); py = np.clip((W_ * th / uh).astype(int), 0, th - 1)
        c = tex[py, px].astype(np.float32)
        m &= c[..., 3] >= 128
        sub = zb[y0:y1 + 1, x0:x1 + 1]; m &= z > sub
        if not m.any(): continue
        c[..., :3] *= SHADE[k]; c[..., 3] = 255
        sub[m] = z[m]; img[y0:y1 + 1, x0:x1 + 1][m] = c[m]
    im = Image.fromarray(img.clip(0, 255).astype(np.uint8), 'RGBA')
    bb = im.getbbox(); im = im.crop(bb) if (bb and crop) else im
    return im
def collect(node):
    out = []
    for c in node['children']:
        if isinstance(c, str):
            if c in EL and EL[c].get('visibility', True) is not False: out.append(EL[c])
        else: out += collect(c)
    return out
DUPES = {'Bloodchain (red)', 'Cursed Katar (cursed_katar_right)', 'golem_hammer (resonant)', 'Jingu Bang (jingubang_2)', 'Sakura Tessen (off)'}
if __name__ == '__main__':
  names = []
  only = os.environ.get('ONLY')
  for i, g in enumerate(d['outliner']):
      if only and str(i) not in only.split(','): continue
      if g['name'] in DUPES: continue
      im = render(collect(g))
      if im is None: continue
      fn = f"{len(names) + 1:02d}_{re.sub(r'[^A-Za-z0-9]+', '_', g['name']).strip('_')}.png"
      im.save(os.path.join(OUT, fn)); names.append((g['name'], fn)); print(fn, im.size, flush=True)
  json.dump(names, open(os.path.join(OUT, 'index.json'), 'w'))

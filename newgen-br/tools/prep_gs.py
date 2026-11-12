import subprocess, numpy as np
from PIL import Image
W, H = 1920, 1080
def frames(ss, to):
    raw = subprocess.run(["ffmpeg", '-v', 'error', '-ss', str(ss), '-to', str(to), '-i', 'src/gs.mp4', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
def key(f):
    f = f.astype(np.int16); r, g, b = f[..., 0], f[..., 1], f[..., 2]; m = np.maximum(r, b)
    k = g - m; a = 1 - np.clip((k - 25) / 50, 0, 1)
    g2 = np.minimum(g, m + 10); out = np.stack([r, g2, b, (a * 255).astype(np.int16)], -1)
    return np.clip(out, 0, 255).astype(np.uint8)
for name, ss, to, tw in (('hp', 0, 12.9, 560), ('death', 12.95, 16.0, 440)):
    fr = frames(ss, to); ks = [key(f) for f in fr]
    al = np.max(np.stack([k[..., 3] for k in ks]), 0); ys, xs = np.nonzero(al > 20)
    x0, x1, y0, y1 = xs.min() - 6, xs.max() + 6, ys.min() - 6, ys.max() + 6
    if name == 'death': cx, cy = (x0 + x1) // 2, (y0 + y1) // 2; s = max(x1 - x0, y1 - y0) // 2 + 6; x0, x1, y0, y1 = cx - s, cx + s, cy - s, cy + s
    th = int(tw * (y1 - y0) / (x1 - x0))
    arr = np.stack([np.asarray(Image.fromarray(k[max(0, y0):y1, max(0, x0):x1]).resize((tw, th), Image.NEAREST if name == 'hp' else Image.BILINEAR)) for k in ks])
    np.save(f'src/{name}_keyed.npy', arr); print(name, arr.shape, (x0, y0, x1, y1))
    Image.fromarray(arr[len(arr) // 6]).save(f'qa/{name}_key.png')

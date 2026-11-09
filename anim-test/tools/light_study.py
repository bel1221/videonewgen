"""Lighting + shadow breakdown of single frames.  python -I light_study.py OUT.jpg LABEL=VIDEO@T [LABEL=VIDEO@T ...]
Per frame, one row: original | luminance heat map (+ dominant light direction arrow from shading gradients) |
shadow map (darkest 22 %, coloured by shadow tint) | highlights (top 6 %, coloured by highlight tint).
Numbers on the row: key/fill ratio (p90 L / p20 L), shadow penumbra width in px at 960 wide (hard sun < 3, soft > 8),
shadow tint and highlight tint (CIELAB a,b: +b warm, -b cool), and the light direction in the picture plane."""
import sys, subprocess, json
import numpy as np, cv2
W, H = 960, 540
rows, stats = [], {}
def grab(v, t):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', v, '-frames:v', '1', '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(H, W, 3).copy()
def txt(img, s, y, col=(255, 255, 255)):
    cv2.putText(img, s, (8, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 3, cv2.LINE_AA); cv2.putText(img, s, (8, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, col, 1, cv2.LINE_AA)
for spec in sys.argv[2:]:
    lab, rest = spec.split('=', 1); v, t = rest.rsplit('@', 1); f = grab(v, float(t))
    L = cv2.cvtColor(f, cv2.COLOR_BGR2LAB).astype(np.float32); Ll, A, B = L[..., 0] * 100 / 255, L[..., 1] - 128, L[..., 2] - 128
    p20, p90, p94 = np.percentile(Ll, [20, 90, 94]); sh = Ll <= np.percentile(Ll, 22); hi = Ll >= p94
    # heat map + light direction (luminance gradient, averaged over mid-tones: points from dark to lit side)
    blur = cv2.GaussianBlur(Ll, (0, 0), 3); gx = cv2.Sobel(blur, cv2.CV_32F, 1, 0, 5); gy = cv2.Sobel(blur, cv2.CV_32F, 0, 1, 5)
    mid = (Ll > p20) & (Ll < p90); dx, dy = gx[mid].mean(), gy[mid].mean(); ang = np.degrees(np.arctan2(-dy, dx))
    heat = cv2.applyColorMap(np.clip(Ll * 2.55, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
    c0 = np.array([W - 70, 70]); d = np.array([dx, dy]); d = d / (np.linalg.norm(d) + 1e-6) * 50
    cv2.arrowedLine(heat, tuple((c0 - d).astype(int)), tuple((c0 + d).astype(int)), (255, 255, 255), 3, tipLength=0.3)
    # shadow edge hardness: contrast across the shadow boundary / peak gradient there = penumbra width in px
    edge = cv2.morphologyEx(sh.astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
    gm = np.hypot(cv2.Sobel(Ll, cv2.CV_32F, 1, 0, 3), cv2.Sobel(Ll, cv2.CV_32F, 0, 1, 3)) / 8
    contrast = max(1, np.median(Ll[~sh & ~hi]) - np.median(Ll[sh])); pen = float(np.median(contrast / (gm[edge] + 1e-3))) if edge.any() else 0
    st = dict(key_fill=round(float(p90 / max(1, p20)), 2), penumbra_px=round(pen, 1), shadow_ab=[round(float(A[sh].mean()), 1), round(float(B[sh].mean()), 1)],
              highlight_ab=[round(float(A[hi].mean()), 1), round(float(B[hi].mean()), 1)], light_dir_deg=round(float(ang)), shadow_area=round(float(sh.mean()), 2))
    stats[lab] = st
    shm = np.zeros_like(f); shm[sh] = (40, 40, 40); tint_s = np.clip(np.array([128 + 0, 128 + st['shadow_ab'][0] * 4, 128 + st['shadow_ab'][1] * 4]), 0, 255)
    shm[sh] = cv2.cvtColor(np.uint8([[[120, tint_s[1], tint_s[2]]]]), cv2.COLOR_LAB2BGR)[0, 0]; shm = cv2.addWeighted(f, 0.35, shm, 0.65, 0)
    him = (f * 0.25).astype(np.uint8); him[hi] = f[hi]
    txt(f, lab, 22, (0, 255, 255)); txt(heat, f'key/fill {st["key_fill"]}  light dir {st["light_dir_deg"]} deg', 22)
    txt(shm, f'shadows {int(st["shadow_area"]*100)}%  penumbra {st["penumbra_px"]}px  tint a,b {st["shadow_ab"]}', 22)
    txt(him, f'highlights tint a,b {st["highlight_ab"]}', 22)
    rows.append(np.hstack([cv2.resize(x, (480, 270)) for x in (f, heat, shm, him)]))
cv2.imwrite(sys.argv[1], np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 86])
json.dump(stats, open(sys.argv[1].replace('.jpg', '.json'), 'w'), indent=1); print(json.dumps(stats))

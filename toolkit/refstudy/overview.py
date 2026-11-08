"""overview grid (mid frame of every shot) or dense filmstrip of a time range.
overview: an src name out           filmstrip: src out t0 t1 step [cols]"""
import sys, json, numpy as np, cv2
def lab(im, t):
    cv2.putText(im, t, (4, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0), 3, cv2.LINE_AA)
    cv2.putText(im, t, (4, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA); return im
def grid(ims, cols):
    while len(ims) % cols: ims.append(np.zeros_like(ims[0]))
    return np.vstack([np.hstack(ims[r:r + cols]) for r in range(0, len(ims), cols)])
if sys.argv[1] == "overview":
    an, src, name, out = sys.argv[2:6]
    shots = json.load(open(f"{an}/{name}_shots.json")); cap = cv2.VideoCapture(src); ims = []
    for s in shots:
        cap.set(cv2.CAP_PROP_POS_MSEC, (s["t0"] + s["t1"]) / 2 * 1000); ok, f = cap.read()
        ims.append(lab(cv2.resize(f, (192, 108)), f"#{s['i']} {s['t0']:.1f} {s['dur']}s"))
    for k in range(0, len(ims), 100):
        cv2.imwrite(out.replace(".jpg", f"_{k // 100}.jpg"), grid(ims[k:k + 100], 10), [cv2.IMWRITE_JPEG_QUALITY, 82])
else:
    src, out, t0, t1, step = sys.argv[2], sys.argv[3], *map(float, sys.argv[4:7])
    cols = int(sys.argv[7]) if len(sys.argv) > 7 else 8
    cap = cv2.VideoCapture(src); cap.set(cv2.CAP_PROP_POS_MSEC, t0 * 1000); fps = cap.get(cv2.CAP_PROP_FPS)
    ims, t, nxt = [], t0, t0
    while t <= t1:
        ok, f = cap.read(); t = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000
        if not ok: break
        if t + 1e-6 >= nxt:
            ims.append(lab(cv2.resize(f, (240, 135)), f"{t:.3f}")); nxt += step
    cv2.imwrite(out, grid(ims, cols), [cv2.IMWRITE_JPEG_QUALITY, 82])

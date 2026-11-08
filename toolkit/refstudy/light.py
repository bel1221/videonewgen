"""Lighting/grade stats per shot mid-frame: contrast, black/white level, shadow vs highlight colour (split tone),
vignette, saturation of highlights, glow (bloom) around bright areas. Prints per-video medians."""
import sys, json, numpy as np, cv2
an, src, name = sys.argv[1:4]
shots = [s for s in json.load(open(f"{an}/{name}_shots.json")) if s["luma"] > 15]
cap = cv2.VideoCapture(src); R = []
for s in shots:
    cap.set(cv2.CAP_PROP_POS_MSEC, (s["t0"] + s["t1"]) / 2 * 1000); ok, f = cap.read()
    if not ok: continue
    f = cv2.resize(f, (640, 360)); lab = cv2.cvtColor(f, cv2.COLOR_BGR2LAB).astype(np.float32)
    L, A, B = lab[..., 0] * 100 / 255, lab[..., 1] - 128, lab[..., 2] - 128
    p = np.percentile(L, [2, 20, 50, 80, 98])
    sh, hi = L <= p[1], L >= p[3]
    yy, xx = np.mgrid[0:360, 0:640]; r = np.hypot((xx - 320) / 320, (yy - 180) / 180)
    vig = L[r > 1.05].mean() / max(1, L[r < 0.5].mean())
    # glow: luma just outside the brightest blobs vs further away
    br = (L > 90).astype(np.uint8)
    glow = 0.0
    if br.mean() > 0.002:
        d1 = cv2.dilate(br, np.ones((9, 9), np.uint8)) - br; d2 = cv2.dilate(br, np.ones((41, 41), np.uint8)) - cv2.dilate(br, np.ones((21, 21), np.uint8))
        if d1.any() and d2.any(): glow = L[d1 > 0].mean() - L[d2 > 0].mean()
    R.append(dict(black=p[0], white=p[4], contrast=p[4] - p[0], sh_a=A[sh].mean(), sh_b=B[sh].mean(), hi_a=A[hi].mean(), hi_b=B[hi].mean(),
                  vig=vig, glow=glow, sat_hi=np.hypot(A[hi], B[hi]).mean(), sat_sh=np.hypot(A[sh], B[sh]).mean()))
m = {k: float(np.median([r[k] for r in R])) for k in R[0]}
split = np.mean([(r["hi_b"] - r["sh_b"]) > 4 for r in R])
print(f"{name}: n={len(R)} black {m['black']:.0f} white {m['white']:.0f} contrast {m['contrast']:.0f} | shadows a,b ({m['sh_a']:+.1f},{m['sh_b']:+.1f}) highlights ({m['hi_a']:+.1f},{m['hi_b']:+.1f}) "
      f"| warm-highlight/cool-shadow shots {split:.0%} | vignette corner/centre {m['vig']:.2f} | glow halo {m['glow']:.1f} | chroma hi {m['sat_hi']:.1f} sh {m['sat_sh']:.1f}")

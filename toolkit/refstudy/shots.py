"""Shot table + labelled contact sheets (first / mid / last frame of each shot) from analyze.py output."""
import sys, json, os, numpy as np, cv2
an, src, name, outdir = sys.argv[1:5]
d = json.load(open(f"{an}/{name}.json")); fr = d["frames"]; fps = d["fps"]; n = len(fr)
b = [0] + d["cuts"] + [n]
shots = []
for s, e in zip(b[:-1], b[1:]):
    seg = fr[s + 1:e] if e - s > 2 else fr[s:e]
    g = lambda k: np.array([r.get(k, 0) for r in seg])
    px, py, z, ob = g("pan_x"), g("pan_y"), g("zoom"), g("obj")
    shots.append(dict(i=len(shots), t0=round(s / fps, 2), t1=round(e / fps, 2), dur=round((e - s) / fps, 2),
        # pan in % of frame width per second; zoom in % scale per second
        pan_x=round(float(np.median(px)) * fps / 320 * 100, 1), pan_y=round(float(np.median(py)) * fps / 180 * 100, 1),
        zoom=round(float(np.median(z)) * fps * 100, 1), obj=round(float(np.median(ob)), 2),
        pan_std=round(float(np.std(px)), 2), luma=round(float(g("luma").mean())), sat=round(float(g("sat").mean()))))
json.dump(shots, open(f"{an}/{name}_shots.json", "w"), indent=0)
durs = np.array([s["dur"] for s in shots])
print(f"{name}: {len(shots)} shots, median {np.median(durs):.2f}s, mean {durs.mean():.2f}s, p10 {np.percentile(durs,10):.2f} p90 {np.percentile(durs,90):.2f}")

cap = cv2.VideoCapture(src)
def grab(t):
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, f = cap.read()
    return cv2.resize(f, (320, 180)) if ok else np.zeros((180, 320, 3), np.uint8)
os.makedirs(outdir, exist_ok=True)
PER = 8  # shots per sheet, 3 frames each -> 8 rows x 3 cols
for k in range(0, len(shots), PER):
    rows = []
    for s in shots[k:k + PER]:
        ts = [s["t0"] + 0.05, (s["t0"] + s["t1"]) / 2, max(s["t0"], s["t1"] - 0.08)]
        ims = [grab(t) for t in ts]
        lab = np.zeros((180, 300, 3), np.uint8)
        for j, txt in enumerate([f"#{s['i']} {s['t0']:.2f}-{s['t1']:.2f}", f"dur {s['dur']}s",
                                 f"pan {s['pan_x']},{s['pan_y']} %/s", f"zoom {s['zoom']} %/s", f"obj {s['obj']} luma {s['luma']}"]):
            cv2.putText(lab, txt, (6, 28 + j * 32), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
        rows.append(np.hstack([lab] + ims))
    cv2.imwrite(f"{outdir}/{name}_{k // PER:02d}.jpg", np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 80])

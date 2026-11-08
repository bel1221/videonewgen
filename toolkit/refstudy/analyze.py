"""Per-frame analysis of a reference video: cuts, camera motion (affine fit to optical flow), object motion,
brightness/saturation; plus audio onsets/beats/loudness and cut-to-beat sync. Writes <out>/<name>.json."""
import sys, os, json, subprocess, numpy as np, cv2, librosa

src, out = sys.argv[1], sys.argv[2]
name = sys.argv[3]
W, H, FPS = 320, 180, 30
os.makedirs(out, exist_ok=True)

cmd = ["ffmpeg", "-v", "error", "-i", src, "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"]
p = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=10**8)
fs = W * H * 3
ys, xs = np.mgrid[8:H:16, 8:W:16]
xs_c, ys_c = (xs - W / 2).ravel(), (ys - H / 2).ravel()
A = np.stack([np.ones_like(xs_c), xs_c, ys_c], 1)  # affine per axis: d = a + b x + c y

rows, prev_g, prev_h = [], None, None
i = 0
while True:
    buf = p.stdout.read(fs)
    if len(buf) < fs: break
    f = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    h = cv2.calcHist([hsv], [0, 1], None, [16, 8], [0, 180, 0, 256]); cv2.normalize(h, h)
    r = dict(t=i / FPS, luma=float(g.mean()), sat=float(hsv[..., 1].mean()), hue=float(np.median(hsv[..., 0])))
    if prev_g is not None:
        r["hdiff"] = float(cv2.compareHist(prev_h, h, cv2.HISTCMP_BHATTACHARYYA))
        r["pdiff"] = float(np.abs(g.astype(np.int16) - prev_g).mean())
        fl = cv2.calcOpticalFlowFarneback(prev_g, g, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        dx, dy = fl[8:H:16, 8:W:16, 0].ravel(), fl[8:H:16, 8:W:16, 1].ravel()
        cx, *_ = np.linalg.lstsq(A, dx, rcond=None); cy, *_ = np.linalg.lstsq(A, dy, rcond=None)
        res = np.hypot(dx - A @ cx, dy - A @ cy)
        # pan in px/frame at 320 wide; zoom = mean divergence; rot = curl
        r.update(pan_x=float(cx[0]), pan_y=float(cy[0]), zoom=float((cx[1] + cy[2]) / 2), rot=float((cy[1] - cx[2]) / 2),
                 obj=float(np.percentile(res, 90)), mag=float(np.hypot(dx, dy).mean()))
    rows.append(r); prev_g, prev_h = g, h; i += 1
p.wait()

# cuts: histogram jump that is large relative to the local median
hd = np.array([r.get("hdiff", 0) for r in rows]); pdv = np.array([r.get("pdiff", 0) for r in rows])
med = np.array([np.median(hd[max(0, k - 15):k + 15]) for k in range(len(hd))])
cand = (hd > np.maximum(0.28, med * 3)) | ((pdv > 40) & (hd > 0.18))
cuts = []
for k in np.where(cand)[0]:
    if not cuts or k - cuts[-1] > 6: cuts.append(int(k))
# flashes / dips to black or white
fl = [r["t"] for r in rows if r["luma"] < 8]
wh = [r["t"] for r in rows if r["luma"] > 235]

# audio
sr = 22050
y = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                                 capture_output=True).stdout, np.float32).copy()
wav = os.path.join(out, name + ".wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "2", "-ar", "44100", wav])
tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
bt = librosa.frames_to_time(beats, sr=sr)
on = librosa.onset.onset_detect(y=y, sr=sr, units="time", backtrack=False)
oenv = librosa.onset.onset_strength(y=y, sr=sr)
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
db = 20 * np.log10(rms + 1e-9)
ct = np.array([c / FPS for c in cuts])
def near(ts, ref):
    return [float(ref[np.argmin(np.abs(ref - x))] - x) if len(ref) else None for x in ts]
rng = np.random.default_rng(0)
rnd = rng.uniform(0, rows[-1]["t"], 2000)
def frac_within(off, w): o = np.abs(np.array([v for v in off if v is not None])); return float((o <= w).mean()) if len(o) else 0
sync = dict(beat_within_50ms=frac_within(near(ct, bt), 0.05), beat_chance_50ms=frac_within(near(rnd, bt), 0.05),
            onset_within_50ms=frac_within(near(ct, on), 0.05), onset_chance_50ms=frac_within(near(rnd, on), 0.05))

json.dump(dict(name=name, fps=FPS, frames=rows, cuts=cuts, black=fl, white=wh,
               audio=dict(tempo=float(np.atleast_1d(tempo)[0]), beats=bt.tolist(), onsets=on.tolist(),
                          rms_t=rt[::4].tolist(), rms_db=db[::4].tolist()), sync=sync), open(f"{out}/{name}.json", "w"))
print(name, "frames", len(rows), "cuts", len(cuts), "tempo", tempo, sync)

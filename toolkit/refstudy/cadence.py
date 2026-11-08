"""Animation cadence at native fps: how many unique poses per second (on 1s / 2s / 3s), and hold lengths.
Uses a centre crop downscaled; a frame is a 'repeat' if it is nearly identical to the previous one."""
import sys, subprocess, numpy as np, json
src, name, t0, dur = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
W, H = 480, 270
cmd = ["ffmpeg", "-v", "error", "-ss", str(t0), "-t", str(dur), "-i", src, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"]
raw = subprocess.run(cmd, capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.int16)
d = np.array([np.abs(f[i] - f[i - 1]).mean() for i in range(1, len(f))])
rep = d < 0.35
# run lengths of identical frames (=how many native frames each drawn pose is held)
runs, k = [], 1
for r in rep:
    if r: k += 1
    else: runs.append(k); k = 1
runs.append(k)
runs = np.array(runs); moving = d[~rep]
print(json.dumps(dict(name=name, t0=t0, frames=len(f), repeat_frac=round(float(rep.mean()), 3),
      hold_hist={int(v): int((runs == v).sum()) for v in sorted(set(runs.tolist()))[:8]},
      unique_poses_per_s=round(len(runs) / dur, 1), mean_change=round(float(moving.mean()), 2) if len(moving) else 0)))

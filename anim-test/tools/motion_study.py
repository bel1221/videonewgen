"""Skeletal motion curves from mesh_study keypoints.  python -I motion_study.py OUTDIR NAME [NAME ...]
For each clip: the longest tracked character's wrist / elbow / hip / knee paths (px, normalised by torso length),
plotted over time, plus a smoothness score = median |2nd difference| (jerk proxy) of the joints in torso-lengths per frame^2,
and the fraction of frames where a joint 'pops' (> 0.35 torso per frame jump that reverses next frame = jitter)."""
import sys, json
import numpy as np, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
out = sys.argv[1]; names = sys.argv[2:]; J = {'R wrist': 10, 'L wrist': 9, 'R elbow': 8, 'R hip': 12, 'R knee': 14}
fig, axes = plt.subplots(len(names), 1, figsize=(13, 2.7 * len(names)), squeeze=False); res = {}
for ax, name in zip(axes[:, 0], names):
    rec = json.load(open(f'{out}/{name}_kp.json')); by = {}
    for fi, r in enumerate(rec):
        for p in r['people']: by.setdefault(p['id'], []).append((fi, r['t'], np.array(p['kp'])))
    if not by: ax.set_title(f'{name}: no tracked skeleton'); continue
    tid, tr = max(by.items(), key=lambda kv: len(kv[1]))
    torso = np.median([np.linalg.norm((k[5, :2] + k[6, :2]) / 2 - (k[11, :2] + k[12, :2]) / 2) for _, _, k in tr if (k[[5, 6, 11, 12], 2] > 0.25).all()] or [60])
    jerks, pops, n = [], 0, 0
    for lab, j in J.items():
        pts = [(fi, t, k[j, :2] / torso) for fi, t, k in tr if k[j, 2] > 0.25]
        if len(pts) < 5: continue
        fi = np.array([p[0] for p in pts]); t = np.array([p[1] for p in pts]); xy = np.array([p[2] for p in pts])
        ax.plot(t, xy[:, 1] - xy[0, 1], '-o', ms=2, lw=1, label=lab)
        cont = np.where(np.diff(fi) == 1)[0]
        for i in cont:
            if i + 1 < len(xy) - 1 and fi[i + 2] - fi[i + 1] == 1:
                a = xy[i + 2] - 2 * xy[i + 1] + xy[i]; jerks.append(np.linalg.norm(a)); n += 1
                v1, v2 = xy[i + 1] - xy[i], xy[i + 2] - xy[i + 1]
                if np.linalg.norm(v1) > 0.35 and np.linalg.norm(v2) > 0.35 and v1 @ v2 < 0: pops += 1
    jk = float(np.median(jerks)) if jerks else float('nan'); res[name] = dict(track=tid, frames_tracked=len(tr), torso_px=round(float(torso), 1), jerk_med=round(jk, 3), pop_rate=round(pops / max(1, n), 3), samples=n)
    ax.set_title(f'{name}: character #{tid}, {len(tr)} frames tracked | joint jerk (median) {jk:.3f} torso/frame² | pops {res[name]["pop_rate"]:.1%}', fontsize=9)
    ax.set_ylabel('vertical travel\n(torso lengths)', fontsize=8); ax.legend(fontsize=7, ncol=5, loc='upper right'); ax.invert_yaxis()
axes[-1, 0].set_xlabel('seconds'); plt.tight_layout(); plt.savefig(f'{out}/motion_curves.png', dpi=75)
json.dump(res, open(f'{out}/motion_curves.json', 'w'), indent=1); print(json.dumps(res, indent=0))

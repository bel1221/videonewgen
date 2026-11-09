"""Animation quality test: pose dynamism from skeletons (mesh_study *_kp.json) + motion rhythm (analyze.py per-frame flow).
python -I pose_test.py STUDY_DIR AN_DIR OUT.png  REF:name1,name2,...  OURS:name3,...  RHYTHM:label=anname,...
Pose metrics per detected skeleton (single-frame, so robust to tracking breaks):
  lean      torso angle from vertical (deg)          - how far bodies commit into actions
  reach     max wrist-to-shoulder distance / torso   - arm extension
  spread    ankle-to-ankle distance / torso          - stance width
  knee      180 - knee angle (deg)                   - how deep the legs bend
  asym      |L arm angle - R arm angle| (deg)        - arms doing different things (not mirrored puppets)
Rhythm metrics per video from flow residual (in-frame motion): hold fraction (frames < 30 % of the shot's p90),
burst ratio (p90 / median), i.e. 'hold then explode' vs 'everything moves at one speed'."""
import sys, json, glob
import numpy as np, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
study, an, outp = sys.argv[1], sys.argv[2], sys.argv[3]
groups = {}; rhythm = {}
for arg in sys.argv[4:]:
    k, v = arg.split(':', 1)
    if k == 'RHYTHM': rhythm = dict(x.split('=') for x in v.split(','))
    else: groups[k] = v.split(',')
def ang(v): return np.degrees(np.arctan2(v[0], -v[1]))
def joint(a, b, c):
    u, w = a - b, c - b; return np.degrees(np.arccos(np.clip(u @ w / (np.linalg.norm(u) * np.linalg.norm(w) + 1e-9), -1, 1)))
M = {'lean': [], 'reach': [], 'spread': [], 'knee': [], 'asym': []}; vals = {g: {m: [] for m in M} for g in groups}
for g, names in groups.items():
    for n in names:
        for r in json.load(open(f'{study}/{n}_kp.json')):
            for p in r['people']:
                k = np.array(p['kp']); ok = k[:, 2] > 0.25
                if not (ok[[5, 6, 11, 12]].all()): continue
                sh = (k[5, :2] + k[6, :2]) / 2; hp = (k[11, :2] + k[12, :2]) / 2; T = np.linalg.norm(sh - hp)
                if T < 15: continue
                vals[g]['lean'].append(abs(ang(sh - hp)))
                rr = [np.linalg.norm(k[w, :2] - k[s, :2]) / T for s, w in ((5, 9), (6, 10)) if ok[w]]
                if rr: vals[g]['reach'].append(max(rr))
                if ok[15] and ok[16]: vals[g]['spread'].append(np.linalg.norm(k[15, :2] - k[16, :2]) / T)
                kn = [180 - joint(k[h, :2], k[kk, :2], k[a, :2]) for h, kk, a in ((11, 13, 15), (12, 14, 16)) if ok[h] and ok[kk] and ok[a]]
                if kn: vals[g]['knee'].append(max(kn))
                if ok[[5, 7, 6, 8]].all(): d_ = abs(ang(k[7, :2] - k[5, :2]) - ang(k[8, :2] - k[6, :2])) % 360; vals[g]['asym'].append(min(d_, 360 - d_))
res = {g: {m: dict(n=len(v), med=round(float(np.median(v)), 2) if v else None, p80=round(float(np.percentile(v, 80)), 2) if v else None) for m, v in d.items()} for g, d in vals.items()}
for lab, nm in rhythm.items():
    d = json.load(open(f'{an}/{nm}.json')); fr = d['frames']; cuts = [0] + d['cuts'] + [len(fr)]; hold = []; burst = []
    obj = np.array([f.get('obj', 0) for f in fr])
    for a, b in zip(cuts[:-1], cuts[1:]):
        s = obj[a + 1:b]
        if len(s) < 8 or np.percentile(s, 90) < 2: continue
        hold.append(float((s < 0.3 * np.percentile(s, 90)).mean())); burst.append(float(np.percentile(s, 90) / max(0.3, np.median(s))))
    rhythm[lab] = dict(shots=len(hold), hold_frac=round(float(np.median(hold)), 3) if hold else None, burst_ratio=round(float(np.median(burst)), 2) if burst else None)
fig, ax = plt.subplots(1, 6, figsize=(20, 4.2))
cols = {g: c for g, c in zip(groups, ['#e0a040', '#5b8def', '#d55', '#3a3', '#a5a'])}
for a, m in zip(ax[:5], M):
    data = [vals[g][m] for g in groups]; bp = a.boxplot(data, tick_labels=list(groups), patch_artist=True, showfliers=False)
    for patch, g in zip(bp['boxes'], groups): patch.set_facecolor(cols[g])
    a.set_title({'lean': 'torso lean (deg)', 'reach': 'arm reach (/torso)', 'spread': 'stance width (/torso)', 'knee': 'knee bend (deg)', 'asym': 'arm asymmetry (deg)'}[m]); a.tick_params(axis='x', labelsize=8)
labs = list(rhythm); a = ax[5]; x = np.arange(len(labs))
a.bar(x - 0.2, [rhythm[l]['hold_frac'] or 0 for l in labs], 0.4, label='hold fraction'); a2 = a.twinx(); a2.bar(x + 0.2, [rhythm[l]['burst_ratio'] or 0 for l in labs], 0.4, color='#d55', label='burst ratio')
a.set_xticks(x); a.set_xticklabels(labs, fontsize=8); a.set_title('rhythm: holds (blue) vs bursts (red)')
plt.suptitle('Animation test: references vs ours (higher = more committed / dynamic)'); plt.tight_layout(); plt.savefig(outp, dpi=80)
json.dump(dict(pose=res, rhythm=rhythm), open(outp.rsplit('.', 1)[0] + '.json', 'w'), indent=1)
for g in res: print(g, {m: (v['med'], v['n']) for m, v in res[g].items()})
print('rhythm', rhythm)

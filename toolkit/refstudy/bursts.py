"""Action-burst timing in the reference videos, from analyze.py output (per-frame residual object motion 'obj').

Inside every shot (between detected cuts, shots >= 0.5 s), a burst is a local peak of object motion that is at least
2.5x the shot's median and 0.5 s clear of a cut-adjacent frame. For each burst:
  rise   time from the last frame below 25 % of the peak (above the shot median) to the peak  -> anticipation-to-strike accel
  fwhm   width at half the peak height                                                         -> how long the fast part lasts
  decay  peak -> back under 25 %                                                                -> follow-through / settle
These are screen-space proxies for the hand-speed profile of a swing (camera motion is already removed by the affine fit).

  python toolkit/refstudy/bursts.py OUTDIR MD NV WY DFY
"""
import json, os, sys
import numpy as np

d = sys.argv[1]
print(f"{'vid':4s} bursts  rise p25/50/75 (s)     fwhm p25/50/75 (s)     decay p25/50/75 (s)   rise/fwhm med")
for name in sys.argv[2:]:
    J = json.load(open(os.path.join(d, name + '.json')))
    fps = J['fps']; obj = np.array([r.get('obj', 0) for r in J['frames']]); cuts = [0] + J['cuts'] + [len(obj)]
    R, F, D = [], [], []
    for s, e in zip(cuts[:-1], cuts[1:]):
        s, e = s + 2, e - 2
        if e - s < .5 * fps: continue
        x = obj[s:e]; base = np.median(x)
        for k in range(2, len(x) - 2):
            p = x[k]
            if p < 2.5 * max(base, .3) or p < x[k - 2:k + 3].max(): continue
            h = base + (p - base) * .5; q = base + (p - base) * .25
            a = k
            while a > 0 and x[a - 1] > q: a -= 1
            b = k
            while b < len(x) - 1 and x[b + 1] > q: b += 1
            if a == 0 or b == len(x) - 1: continue
            fa = k
            while fa > 0 and x[fa - 1] > h: fa -= 1
            fb = k
            while fb < len(x) - 1 and x[fb + 1] > h: fb += 1
            R.append((k - a) / fps); F.append((fb - fa + 1) / fps); D.append((b - k) / fps)
    R, F, D = map(np.array, (R, F, D))
    pc = lambda v: '/'.join(f'{np.percentile(v, p):.2f}' for p in (25, 50, 75)) if len(v) else '-'
    print(f"{name:4s} {len(R):6d}  {pc(R):22s} {pc(F):22s} {pc(D):22s} {np.median(R / F) if len(R) else 0:.2f}")

"""Can an AnimationGPT attack clip land a contact at our fighting gap without re-keying the arm?

For every unique attack clip, in the clip's own facing frame at the strike window (hand speed >= 50 % of peak):
  tipF   max forward reach of the blade tip (blocks from the root, along the facing direction)
  tipH   tip height at that moment (blocks above the feet)
  cross  can the tip path cross the centre line (x = 0) between 0.6 and 1.6 blocks ahead, at 0.6-1.8 blocks high?
         (a clash at a 2.0-block gap meets around 1.0 ahead; a hit on a body at 2.0 needs the tip at ~1.7)
  need   extra forward reach needed for a body hit at a 2.0 gap (blocks); IK cost = the shoulder/elbow change that
         would add it (deg, straight-line estimate on a 0.75-block arm)
Blade = forearm direction continued from the hand, 1.4 blocks (0.70 x character height, the study's target scale).

  python tools/agpt_reach.py mocap/fight20
"""
import glob, json, math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agpt_laws import fk, point, resample, ATTACKS

BLADE = 1.4; FPS = 30


def reach(clip):
    fr = resample(clip['frames'], clip['fps'], FPS); Ms = [fk(P) for P in fr]
    root = np.array([M['root'][1] for M in Ms]); Rr = [M['root'][0] for M in Ms]
    hand = np.array([point(M, 'rEl', [0, -5.5, 0]) for M in Ms]); elb = np.array([M['rEl'][1] for M in Ms])
    fa = hand - elb; fa /= np.linalg.norm(fa, axis=1, keepdims=True); tip = hand + fa * BLADE
    # everything in the facing frame at each frame (x = character left, z = forward)
    loc = lambda P: np.array([R.T @ (p - t) for R, p, t in zip(Rr, P, root)])
    hr, tr = loc(hand), loc(tip)
    spd = np.linalg.norm(np.gradient(hr, axis=0) * FPS, axis=1); k = int(np.argmax(spd[2:-2])) + 2; pk = spd[k]
    a = k
    while a > 0 and spd[a - 1] >= .5 * pk: a -= 1
    b = k
    while b < len(spd) - 1 and spd[b + 1] >= .5 * pk: b += 1
    w = tr[a:b + 1]; i = int(np.argmax(w[:, 2]))
    tipF, tipH = float(w[i, 2]), float(w[i, 1])
    cross = False
    for p, q in zip(w[:-1], w[1:]):
        if p[0] * q[0] <= 0:
            u = p[0] / (p[0] - q[0] + 1e-9); c = p + (q - p) * u
            if .6 <= c[2] <= 1.6 and .6 <= c[1] <= 1.8: cross = True
    need = max(0.0, 1.7 - tipF)
    ik = math.degrees(min(1.0, need / 0.75)) * 1.0 if need else 0.0      # rough: chord on a 0.75 arm (rad -> deg)
    return dict(tipF=round(tipF, 2), tipH=round(tipH, 2), cross=cross, need=round(need, 2), ik_deg=round(ik))


def main():
    d = sys.argv[1]; seen = set(); rows = []
    for f in sorted(glob.glob(os.path.join(d, '*__s*.json'))):
        n = os.path.basename(f)[:-5]
        if n.split('__')[0] not in ATTACKS: continue
        c = json.load(open(f, encoding='utf-8')); key = json.dumps([p.get('rArm') for p in c['frames']])
        if key in seen: continue
        seen.add(key); r = reach(c); rows.append((n, r))
    print(f"{'clip':26s} tipF  tipH cross need ik_deg")
    for n, r in rows:
        print(f"{n:26s} {r['tipF']:5.2f} {r['tipH']:5.2f} {str(r['cross']):5s} {r['need']:4.2f} {r['ik_deg']:5d}")
    tf = np.array([r['tipF'] for _, r in rows])
    print(f"\n{len(rows)} unique attack clips: tip forward reach median {np.median(tf):.2f}, p90 {np.percentile(tf, 90):.2f} blocks; "
          f"crosses a clash point at 2.0 gap: {sum(r['cross'] for _, r in rows)}/{len(rows)}; reaches a body at 2.0 gap: {sum(r['need'] == 0 for _, r in rows)}/{len(rows)}")


if __name__ == '__main__':
    main()

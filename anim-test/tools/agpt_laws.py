"""Measure combat "motion laws" from the AnimationGPT clip library (rig JSONs in mocap/fight20), in rig space.

The raw HumanML3D joints are gitignored, so this rebuilds joint positions with forward kinematics that mirror
web/rig2.js (bone offsets in px, 16 px = 1 block, root Euler 'YXZ', joints 'XYZ', waist/chest/head split over the
spine bones the same way applyPose does). Arm IK, clavicle shrug and the weapon are not used by these clips.

  python tools/agpt_laws.py mocap/fight20 [--fps 30] [--out mocap/fight20/laws.json]

Per attack clip (strike = peak right-hand speed relative to the root, i.e. the swing itself, not the step):
  wind    wind-up: frames before the strike window where the hand moves AGAINST the strike direction (s)
  hold    pause between the end of the wind-up and the strike window (hand speed < 25 % of peak) (s)
  strike  strike window: hand speed >= 50 % of peak, contiguous around the peak (s)
  follow  follow-through: from the end of the strike window until hand speed < 15 % of peak (s)
  recov   the rest of the clip after the follow-through (s)
  ratio   (wind + hold) / strike  -> anticipation-to-action ratio
  vpk     peak hand speed (blocks/s, root-relative); arc = hand path length in the strike window (blocks)
  sweep   forearm direction sweep in the strike window (deg); dpf = forearm turn per frame at --fps, p50/max (deg)
  chain   time of peak angular speed per segment relative to the hand peak (ms): root yaw, waist, chest, shoulder, elbow
  drop    pelvis drop at the strike vs the clip's standing height (blocks); dropT = when the lowest point happens (ms vs peak)
  plant   front-foot plant time relative to the hand peak (ms): last foot touchdown before the strike + 0.1 s
  fwd     root travel toward the strike during wind-up / strike (blocks)
"""
import argparse, glob, hashlib, json, math, os, sys
import numpy as np

PX = 1 / 16
AW = 4
ABS = {'root': [0, 0, 0], 'hips': [0, 12, 0], 'spine': [0, 12, 0], 'spine2': [0, 15, 0], 'chest': [0, 18, 0], 'chest2': [0, 21, 0],
       'neck': [0, 23.5, 0], 'head': [0, 24, 0], 'rClav': [-1.5, 22, 0], 'lClav': [1.5, 22, 0],
       'rSh': [-(4 + AW / 2), 22, 0], 'rEl': [-(4 + AW / 2), 18, 0], 'lSh': [4 + AW / 2, 22, 0], 'lEl': [4 + AW / 2, 18, 0],
       'rTh': [-2, 12, 0], 'rSn': [-2, 6, 0], 'lTh': [2, 12, 0], 'lSn': [2, 6, 0], 'rHand': [-(4 + AW / 2), 12.5, 0]}
PARENT = {'hips': 'root', 'spine': 'hips', 'spine2': 'spine', 'chest': 'spine2', 'chest2': 'chest', 'neck': 'chest2', 'head': 'neck',
          'rClav': 'chest2', 'lClav': 'chest2', 'rSh': 'rClav', 'rEl': 'rSh', 'lSh': 'lClav', 'lEl': 'lSh',
          'rTh': 'hips', 'rSn': 'rTh', 'lTh': 'hips', 'lSn': 'lTh', 'rHand': 'rEl'}
ORDER = list(ABS)
D2R = math.pi / 180


def rx(a): c, s = math.cos(a), math.sin(a); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
def ry(a): c, s = math.cos(a), math.sin(a); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def rz(a): c, s = math.cos(a), math.sin(a); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
def exyz(v): v = v or [0, 0, 0]; return rx(v[0] * D2R) @ ry(v[1] * D2R) @ rz(v[2] * D2R)


def fk(P):
    """World matrices (R, t) per bone for one rig pose; t in blocks."""
    tl = P.get('tilt', [0, 0])
    Rroot = ry(P.get('yaw', 0) * D2R) @ rx(tl[0] * D2R) @ rz(tl[1] * D2R)
    w = P.get('waist', [0, 0, 0]); pel = P.get('pelvis') or [w[0] * .35, w[1] * .45, w[2] * .35]
    if pel == [0, 0, 0] and 'pelvis' in P: pel = [0, 0, 0]
    rest = [w[i] - pel[i] for i in range(3)]
    sc = lambda v, k: [x * k for x in (v or [0, 0, 0])]
    loc = {'hips': pel, 'spine': sc(rest, .55), 'spine2': sc(rest, .45), 'chest': sc(P.get('chest'), .55), 'chest2': sc(P.get('chest'), .45),
           'neck': sc(P.get('head'), .4), 'head': sc(P.get('head'), .6), 'rSh': P.get('rArm'), 'rEl': P.get('rElbow'),
           'lSh': P.get('lArm'), 'lEl': P.get('lElbow'), 'rTh': P.get('rLeg'), 'rSn': P.get('rKnee'), 'lTh': P.get('lLeg'), 'lSn': P.get('lKnee')}
    for cl, arm, s in (('rClav', P.get('rArm') or [0, 0, 0], -1), ('lClav', P.get('lArm') or [0, 0, 0], 1)):
        e = min(1, max(0, (-arm[0] - 70) / 110)) + min(.6, abs(arm[2]) / 120)
        loc[cl] = [-6 * e, 0, s * 14 * e]
    M = {'root': (Rroot, np.array(P['pos'], float))}
    for n in ORDER[1:]:
        pr = PARENT[n]; Rp, tp = M[pr]
        off = (np.array(ABS[n]) - np.array(ABS[pr])) * PX
        M[n] = (Rp @ exyz(loc.get(n)), tp + Rp @ off)
    return M


def point(M, bone, local_px):
    R, t = M[bone]; return t + R @ (np.array(local_px, float) * PX)


def resample(frames, fin, fout):
    T = len(frames); n = int(round((T - 1) * fout / fin)) + 1; out = []
    keys = [k for k in frames[0] if isinstance(frames[0][k], list)] + ['yaw']
    for i in range(n):
        u = i * fin / fout; a = int(u); b = min(T - 1, a + 1); w = u - a; p = {}
        for k in keys:
            A, B = frames[a].get(k), frames[b].get(k)
            if A is None: continue
            p[k] = [x + (y - x) * w for x, y in zip(A, B)] if isinstance(A, list) else A + (B - A) * w
        out.append(p)
    return out


def geo_speed(Rs, fps):
    """Angular speed (deg/s) between consecutive rotation matrices."""
    out = [0.0]
    for a, b in zip(Rs[:-1], Rs[1:]):
        c = (np.trace(a.T @ b) - 1) / 2; out.append(math.degrees(math.acos(max(-1, min(1, c)))) * fps)
    return np.array(out)


def analyse(clip, fps):
    fr = resample(clip['frames'], clip['fps'], fps); T = len(fr)
    Ms = [fk(P) for P in fr]
    root_t = np.array([M['root'][1] for M in Ms]); Rr = [M['root'][0] for M in Ms]
    # hand in the root frame (the swing itself, independent of stepping); also world
    hand_w = np.array([point(M, 'rEl', [0, -6, 0]) for M in Ms])
    elb_w = np.array([M['rEl'][1] for M in Ms])
    hand_r = np.array([R.T @ (h - t) for R, h, t in zip(Rr, hand_w, root_t)])
    v = np.gradient(hand_r, axis=0) * fps; spd = np.linalg.norm(v, axis=1)
    k = int(np.argmax(spd[2:-2])) + 2; pk = spd[k]
    a = k
    while a > 0 and spd[a - 1] >= .5 * pk: a -= 1
    b = k
    while b < T - 1 and spd[b + 1] >= .5 * pk: b += 1
    d = hand_r[b] - hand_r[a]; d = d / (np.linalg.norm(d) + 1e-9)
    # cocked point = the hand's furthest-back position along the strike direction in the 1.2 s before the strike window.
    # wind = wind-up start -> cocked (hand drawing back), hold = time parked near the cocked point (speed < 25 % pk),
    # action = cocked -> end of the strike window (the swing as an animator counts it, e.g. NV's 7-frame axe swing).
    s0 = max(0, a - int(1.2 * fps)); proj = hand_r @ d
    ck = int(np.argmin(proj[s0:a + 1])) + s0
    i = ck
    while i < a and spd[i] < .25 * pk: i += 1
    hold = (i - ck) / fps
    j = ck
    while j > 0 and (float(v[j] @ d) < 0 or spd[j] < .05 * pk) and proj[j - 1] >= proj[j] - 1e-4: j -= 1
    while j < ck and spd[j] < .1 * pk: j += 1
    wind = (ck - j) / fps
    action = (b - ck + 1) / fps
    back = float(proj[a] - proj[ck])
    c = b + 1
    while c < T - 1 and spd[c] >= .15 * pk: c += 1
    follow = (c - b - 1) / fps; recov = (T - 1 - c) / fps; strike = (b - a + 1) / fps
    arc = float(np.linalg.norm(np.diff(hand_r[a:b + 1], axis=0), axis=1).sum())
    fa = hand_w - elb_w; fa = fa / np.linalg.norm(fa, axis=1, keepdims=True)
    turn = np.degrees(np.arccos(np.clip((fa[1:] * fa[:-1]).sum(1), -1, 1)))
    win = turn[max(0, a - 1):b + 1]
    sweep = float(np.degrees(np.arccos(np.clip(fa[a] @ fa[b], -1, 1))))
    # successive breaking: peak angular speed of each link inside [wind start, follow end]
    lo, hi = max(0, ck - int(.3 * fps)), min(T, b + int(.2 * fps) + 1)
    chain = {}
    yaw = np.unwrap(np.radians([P.get('yaw', 0) for P in fr])); ys = np.abs(np.gradient(np.degrees(yaw))) * fps
    chain['yaw'] = (int(np.argmax(ys[lo:hi])) + lo - k) / fps * 1000
    for name, bone in (('waist', 'spine2'), ('chest', 'chest2'), ('shoulder', 'rSh'), ('elbow', 'rEl')):
        par = PARENT[bone]
        rel = [M[par][0].T @ M[bone][0] for M in Ms] if bone in ('rSh', 'rEl') else [M['root'][0].T @ M[bone][0] for M in Ms]
        s = geo_speed(rel, fps); chain[name] = (int(np.argmax(s[lo:hi])) + lo - k) / fps * 1000
    # weight: pelvis height vs standing
    hip_y = np.array([M['hips'][1][1] - min(point(M, 'rSn', [0, -6, 0])[1], point(M, 'lSn', [0, -6, 0])[1]) for M in Ms])
    stand = float(np.percentile(hip_y, 90)); w0, w1 = max(0, k - int(.3 * fps)), min(T, k + int(.3 * fps) + 1)
    m = int(np.argmin(hip_y[w0:w1])) + w0
    drop = stand - float(hip_y[m]); dropT = (m - k) / fps * 1000
    # foot plant: a foot that was lifted (>0.08 blocks) and comes down (<0.03) last before k + 0.1 s
    plant = None
    for bone in ('rSn', 'lSn'):
        f = np.array([point(M, bone, [0, -6, 0]) for M in Ms]); h = f[:, 1] - f[:, 1].min()
        up = False
        for t in range(0, min(T, k + int(.1 * fps) + 1)):
            if h[t] > .08: up = True
            elif up and h[t] < .03:
                up = False; pt = (t - k) / fps * 1000
                if plant is None or pt > plant: plant = pt
    fwd_dir = Rr[k] @ np.array([0, 0, 1.0])
    fwd_w = float((root_t[i] - root_t[j]) @ fwd_dir); fwd_s = float((root_t[b] - root_t[a]) @ fwd_dir)
    sig = hashlib.md5(np.round(hand_r, 2).tobytes()).hexdigest()[:8]
    return dict(T=round(T / fps, 2), t_pk=round(k / fps, 2), wind=round(wind, 3), hold=round(hold, 3), strike=round(strike, 3), action=round(action, 3),
                back=round(back, 2), sig=sig,
                follow=round(follow, 3), recov=round(recov, 3), ratio=round((wind + hold) / action, 2), vpk=round(float(pk), 2), arc=round(arc, 2),
                sweep=round(sweep, 0), dpf50=round(float(np.median(win)), 1) if len(win) else 0, dpfmax=round(float(win.max()), 1) if len(win) else 0,
                chain={kk: round(vv) for kk, vv in chain.items()}, drop=round(drop, 3), dropT=round(dropT), plant=None if plant is None else round(plant),
                fwd_wind=round(fwd_w, 2), fwd_strike=round(fwd_s, 2), reach=round(float(np.linalg.norm(hand_r[k] - np.array([0, 1.375, 0]))), 2))


ATTACKS = ('slash_h', 'slash_lr', 'slash_diag', 'slash_up', 'slash_rl2', 'slash_combo', 'overhead', 'thrust', 'jump_attack', 'heavy_finisher',
           'heavy_attack', 'light_attack', 'run_attack', 'parry')


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('dir'); ap.add_argument('--fps', type=float, default=30); ap.add_argument('--out')
    a = ap.parse_args()
    res = {}
    for f in sorted(glob.glob(os.path.join(a.dir, '*__s*.json'))):
        name = os.path.basename(f)[:-5]
        if not name.split('__')[0] in ATTACKS: continue
        res[name] = analyse(json.load(open(f, encoding='utf-8')), a.fps)
    out = a.out or os.path.join(a.dir, 'laws.json')
    json.dump(res, open(out, 'w'), indent=1)
    hdr = f"{'clip':26s} sig      tpk  wind  hold action follow ratio back vpk  arc  sweep dpf50/max   yaw waist chest shld elbw  drop dropT plant  fwdW fwdS"
    print(hdr)
    seen = set()
    for n, m in res.items():
        if m['sig'] in seen: continue
        seen.add(m['sig'])
        c = m['chain']
        print(f"{n:26s} {m['sig']} {m['t_pk']:4.2f} {m['wind']:5.2f} {m['hold']:5.2f} {m['action']:5.2f} {m['follow']:5.2f} {m['ratio']:5.2f} {m['back']:4.2f} {m['vpk']:4.1f} {m['arc']:4.2f} "
              f"{m['sweep']:5.0f} {m['dpf50']:5.1f}/{m['dpfmax']:5.1f} {c['yaw']:5d} {c['waist']:5d} {c['chest']:5d} {c['shoulder']:5d} {c['elbow']:5d} "
              f"{m['drop']:5.2f} {m['dropT']:5d} {str(m['plant']):>5s} {m['fwd_wind']:5.2f} {m['fwd_strike']:5.2f}")


if __name__ == '__main__':
    sys.exit(main())

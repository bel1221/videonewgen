"""Vet AnimationGPT clips before using them: score every raw joint file (HumanML3D 22 joints, 20 fps) for the problems
the user called out (deep crouches, broken poses, foot sliding, jitter) and find the strike frame of attacks.

  python tools/agpt_vet.py mocap/fight20            -> table + mocap/fight20/vet.json

Metrics (per clip):
  crouch    lowest pelvis height / standing pelvis height (1 = upright; < 0.72 = deep crouch)
  bone      worst bone-length drift (std/mean over time) -> > 0.06 = stretching / broken skeleton
  jit       p95 joint jerk (m/s^3 / 1000) -> generation jitter
  skate     foot slide while planted (m per planted second)
  yaw       total body heading change (deg) -> spins / turning away
  travel    root travel [lateral(+left), forward] (m), in the clip's start heading
  strike    time of peak right-wrist speed (s) and that speed (m/s); dir = sweep direction at the strike
            ('R>L' = toward the character's left, 'L>R', 'down', 'up', 'fwd')
"""
import glob
import json
import os
import sys

import numpy as np

PEL, LHIP, RHIP, LKN, RKN, LANK, RANK, LFOOT, RFOOT, NECK, HEAD = 0, 1, 2, 4, 5, 7, 8, 10, 11, 12, 15
LSH, RSH, LEL, REL, LWR, RWR = 16, 17, 18, 19, 20, 21
BONES = [(PEL, LHIP), (PEL, RHIP), (LHIP, LKN), (RHIP, RKN), (LKN, LANK), (RKN, RANK), (NECK, HEAD),
         (LSH, LEL), (RSH, REL), (LEL, LWR), (REL, RWR)]
FPS = 20.0


def vet(J):
    J = J[0] if J.ndim == 4 else J
    T = len(J)
    t = np.arange(T) / FPS
    floor = np.percentile(np.minimum(J[:, LANK, 1], J[:, RANK, 1]), 5)
    ph = J[:, PEL, 1] - floor
    stand = np.percentile(ph, 90)
    leg = np.median(np.linalg.norm(J[:, LHIP] - J[:, LKN], axis=1) + np.linalg.norm(J[:, LKN] - J[:, LANK], axis=1))
    crouch = float(np.percentile(ph, 3) / max(stand, 1e-6))
    upright = float(stand / (leg + 0.08))                      # standing pelvis vs leg length (<0.85 = never stands up)
    bone = max(float(np.linalg.norm(J[:, a] - J[:, b], axis=1).std() / np.linalg.norm(J[:, a] - J[:, b], axis=1).mean()) for a, b in BONES)
    v = np.diff(J, axis=0) * FPS
    jerk = np.linalg.norm(np.diff(v, n=2, axis=0) * FPS * FPS, axis=2)
    jit = float(np.percentile(jerk, 95) / 1000)
    skate, planted = 0.0, 0.0
    for a in (LANK, RANK):
        h = J[1:, a, 1] - floor
        sp = np.linalg.norm(v[:, a, [0, 2]], axis=1)
        m = (h < 0.06) & (sp < 0.6)
        skate += float((sp * m).sum() / FPS); planted += float(m.sum() / FPS)
    skate = skate / max(planted, 1e-6)
    hip = J[:, LHIP] - J[:, RHIP]
    head = np.unwrap(np.arctan2(hip[:, 2], -hip[:, 0]))        # heading from the hip line
    yaw = float(np.degrees(head.max() - head.min()))
    h0 = head[0]
    fwd0 = np.array([np.sin(-h0 + np.pi / 2) * 0 + 0, 0, 0])
    # start frame: x = character left, z = forward
    lx = hip[0] / np.linalg.norm(hip[0]); fz = np.cross(lx, [0, 1, 0]); fz = -fz / np.linalg.norm(fz)
    if np.dot(fz, [0, 0, 1]) < 0 and abs(np.dot(fz, [0, 0, 1])) > 0.5:
        fz = -fz
    d = J[-1, PEL] - J[0, PEL]
    travel = [round(float(np.dot(d, lx)), 2), round(float(np.dot(d, fz)), 2)]
    # strike: peak right wrist speed relative to the pelvis
    rw = J[:, RWR] - J[:, PEL]
    ws = np.linalg.norm(np.diff(rw, axis=0) * FPS, axis=1)
    k = int(np.argmax(ws))
    dv = (rw[min(T - 1, k + 1)] - rw[k])
    comp = {'R>L': np.dot(dv, lx), 'L>R': -np.dot(dv, lx), 'down': -dv[1], 'up': dv[1], 'fwd': np.dot(dv, fz)}
    sdir = max(comp, key=comp.get)
    return dict(dur=round(T / FPS, 2), crouch=round(crouch, 2), upright=round(upright, 2), bone=round(bone, 3), jit=round(jit, 2),
                skate=round(skate, 3), yaw=round(yaw, 0), travel=travel, strike=round((k + 0.5) / FPS, 2),
                wspeed=round(float(ws[k]), 1), dir=sdir)


def main():
    d = sys.argv[1]
    out = {}
    for f in sorted(glob.glob(os.path.join(d, 'raw', '*.npy'))):
        out[os.path.basename(f)[:-4]] = vet(np.load(f))
    json.dump(out, open(os.path.join(d, 'vet.json'), 'w'), indent=1)
    print(f"{'clip':28s} dur  crouch upr  bone   jit  skate  yaw  travel(L,F)   strike  v   dir")
    for k, m in out.items():
        flag = ' DEEP' if m['crouch'] < 0.72 else ''
        flag += ' BROKEN' if m['bone'] > 0.06 else ''
        print(f"{k:28s} {m['dur']:4.1f} {m['crouch']:5.2f} {m['upright']:5.2f} {m['bone']:5.3f} {m['jit']:5.2f} {m['skate']:5.3f} {m['yaw']:4.0f} "
              f"{str(m['travel']):13s} {m['strike']:5.2f} {m['wspeed']:4.1f} {m['dir']:5s}{flag}")


if __name__ == '__main__':
    main()

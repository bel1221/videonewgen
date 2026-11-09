"""Retarget AnimationGPT / MotionGPT output (HumanML3D 22-joint positions) onto the jointed Minecraft rig.

Input : <id>_out.npy, shape (1, T, 22, 3) or (T, 22, 3), metres, y up, the character starts facing +z, 20 fps.
Output: JSON clip  {fps, frames: [pose, ...]}  where each pose uses the applyPose() format of web/rig.js and web/rig2.js:
        pos [x,y,z] blocks (root = feet), yaw deg, tilt [pitch, roll] deg (root 'YXZ'), and per joint [x,y,z] deg ('XYZ').

How: build a rotation frame per body segment from the joint positions, then take each segment's frame relative to its
parent in the rig hierarchy and turn it into Euler angles.
  root  = pelvis frame (x from the hip line, y up the lower spine)   -> yaw + tilt
  waist = lower spine (spine1 -> spine3), chest = upper spine (spine3 -> neck, x from the shoulder line), head = neck -> head
  arms / legs = upper segment frame with the hinge axis taken from the elbow / knee bend plane, so elbows and knees
  come out as a pure x rotation like the hand-keyed poses (elbow bend = -x, knee bend = +x).

Usage:
  python tools/motion2rig.py IN.npy OUT.json [--yaw DEG] [--at X,Z] [--smooth N] [--fps-out 30]
"""
import argparse
import json
import math
import sys

import numpy as np

# HumanML3D joint indices
PELVIS, L_HIP, R_HIP, SPINE1, L_KNEE, R_KNEE, SPINE2, L_ANKLE, R_ANKLE, SPINE3 = range(10)
L_FOOT, R_FOOT, NECK, L_COLLAR, R_COLLAR, HEAD, L_SH, R_SH, L_EL, R_EL, L_WR, R_WR = range(10, 22)

RIG_HIP_H = 12 / 16          # rig hip pivot height above the feet, in blocks


def norm(v):
    n = np.linalg.norm(v, axis=-1, keepdims=True)
    return v / np.maximum(n, 1e-8)


def frame_from_yx(y, x_hint):
    """Rotation matrices (T,3,3), columns = local x,y,z axes in world. y is exact, x is x_hint made orthogonal to y."""
    y = norm(y)
    x = norm(x_hint - (x_hint * y).sum(-1, keepdims=True) * y)
    z = np.cross(x, y)
    return np.stack([x, y, z], axis=-1)


def limb_frames(a, b, c, fallback_z, bend_sign):
    """Frames for a two-segment limb a->b->c whose rest pose hangs along -y and whose hinge is local x.
    bend_sign = +1 if the lower segment swings toward local +z when bent (arms), -1 toward -z (legs)."""
    d1, d2 = norm(b - a), norm(c - b)
    y = -d1
    perp = d2 - (d2 * d1).sum(-1, keepdims=True) * d1           # lower segment direction off the upper's axis
    strength = np.linalg.norm(perp, axis=-1, keepdims=True)
    fb = fallback_z - (fallback_z * y).sum(-1, keepdims=True) * y
    # when the limb is nearly straight the bend plane is undefined: blend toward the body's forward axis
    w = np.clip((strength - 0.08) / 0.25, 0, 1)
    z = norm(bend_sign * norm(perp) * w + norm(fb) * (1 - w))
    z = smooth_dirs(z)
    x = norm(np.cross(y, z))
    z = np.cross(x, y)
    upper = np.stack([x, y, z], axis=-1)
    lower = frame_from_yx(-d2, x)                              # same hinge axis -> pure x rotation at the joint
    return upper, lower


def smooth_dirs(v, k=2):
    """Light temporal smoothing of unit vectors (keeps twist axes from snapping)."""
    if k <= 0 or len(v) < 3:
        return v
    out = v.copy()
    for t in range(len(v)):
        lo, hi = max(0, t - k), min(len(v), t + k + 1)
        out[t] = v[lo:hi].mean(0)
    return norm(out)


def euler_xyz(R):
    """three.js Euler 'XYZ' from rotation matrices (T,3,3) -> degrees (T,3)."""
    m13 = np.clip(R[:, 0, 2], -1, 1)
    y = np.arcsin(m13)
    x = np.arctan2(-R[:, 1, 2], R[:, 2, 2])
    z = np.arctan2(-R[:, 0, 1], R[:, 0, 0])
    lock = np.abs(m13) > 0.9999
    x[lock] = np.arctan2(R[lock, 2, 1], R[lock, 1, 1])
    z[lock] = 0
    return np.degrees(np.stack([x, y, z], -1))


def euler_yxz(R):
    """three.js Euler 'YXZ' -> degrees (T,3) as (x, y, z)."""
    m23 = np.clip(R[:, 1, 2], -1, 1)
    x = np.arcsin(-m23)
    y = np.arctan2(R[:, 0, 2], R[:, 2, 2])
    z = np.arctan2(R[:, 1, 0], R[:, 1, 1])
    lock = np.abs(m23) > 0.9999
    y[lock] = np.arctan2(-R[lock, 2, 0], R[lock, 0, 0])
    z[lock] = 0
    return np.degrees(np.stack([x, y, z], -1))


def unwrap(deg):
    return np.degrees(np.unwrap(np.radians(deg), axis=0))


def rel(parent, child):
    return np.einsum('tji,tjk->tik', parent, child)              # parent^T @ child


def smooth_series(a, n):
    if n <= 1:
        return a
    k = np.ones(n) / n
    pad = n // 2
    ap = np.pad(a, [(pad, n - 1 - pad)] + [(0, 0)] * (a.ndim - 1), mode='edge')
    return np.apply_along_axis(lambda s: np.convolve(s, k, mode='valid'), 0, ap)


def retarget(J, yaw0=0.0, at=(0.0, 0.0), smooth=1):
    J = np.asarray(J, dtype=np.float64)
    if J.ndim == 4:
        J = J[0]
    T = len(J)
    if smooth > 1:
        J = smooth_series(J.reshape(T, -1), smooth).reshape(T, 22, 3)

    # scale: human hip->knee->ankle (+ ankle height) maps to the rig's 12 px leg
    leg = (np.linalg.norm(J[:, L_HIP] - J[:, L_KNEE], axis=-1) + np.linalg.norm(J[:, L_KNEE] - J[:, L_ANKLE], axis=-1)
           + np.linalg.norm(J[:, R_HIP] - J[:, R_KNEE], axis=-1) + np.linalg.norm(J[:, R_KNEE] - J[:, R_ANKLE], axis=-1)) / 2
    s = RIG_HIP_H / (np.median(leg) + 0.07)

    hip_x = J[:, L_HIP] - J[:, R_HIP]                              # character's left = +x in the rig
    sh_x = J[:, L_SH] - J[:, R_SH]
    root = frame_from_yx(J[:, SPINE1] - J[:, PELVIS], hip_x)
    waist = frame_from_yx(J[:, SPINE3] - J[:, SPINE1], hip_x * 0.5 + sh_x * 0.5)
    chest = frame_from_yx(J[:, NECK] - J[:, SPINE3], sh_x)
    head = frame_from_yx(J[:, HEAD] - J[:, NECK], sh_x)
    fwd_body = chest[:, :, 2]
    fwd_hips = root[:, :, 2]
    rArm, rEl = limb_frames(J[:, R_SH], J[:, R_EL], J[:, R_WR], fwd_body, +1)
    lArm, lEl = limb_frames(J[:, L_SH], J[:, L_EL], J[:, L_WR], fwd_body, +1)
    rLeg, rKn = limb_frames(J[:, R_HIP], J[:, R_KNEE], J[:, R_ANKLE], fwd_hips, -1)
    lLeg, lKn = limb_frames(J[:, L_HIP], J[:, L_KNEE], J[:, L_ANKLE], fwd_hips, -1)

    # optional re-heading / placement in the scene
    c, sn = math.cos(math.radians(yaw0)), math.sin(math.radians(yaw0))
    Ry = np.array([[c, 0, sn], [0, 1, 0], [-sn, 0, c]])
    root_w = np.einsum('ij,tjk->tik', Ry, root)
    pel = (J[:, PELVIS] - J[0, PELVIS] * np.array([1, 0, 1])) @ Ry.T * s
    pos = pel - root_w[:, :, 1] * RIG_HIP_H                         # root sits at the feet, hips 12 px up its local y
    pos[:, 0] += at[0]
    pos[:, 2] += at[1]

    rr = unwrap(euler_yxz(root_w))
    E = {
        'waist': rel(root, waist), 'chest': rel(waist, chest), 'head': rel(chest, head),
        'rArm': rel(chest, rArm), 'rElbow': rel(rArm, rEl), 'lArm': rel(chest, lArm), 'lElbow': rel(lArm, lEl),
        'rLeg': rel(root, rLeg), 'rKnee': rel(rLeg, rKn), 'lLeg': rel(root, lLeg), 'lKnee': rel(lLeg, lKn),
    }
    E = {k: unwrap(euler_xyz(v)) for k, v in E.items()}
    frames = []
    r1 = lambda a: [round(float(v), 2) for v in a]
    for t in range(T):
        p = {'pos': [round(float(v), 4) for v in pos[t]], 'yaw': round(float(rr[t, 1]), 2),
             'tilt': [round(float(rr[t, 0]), 2), round(float(rr[t, 2]), 2)], 'pelvis': [0, 0, 0]}
        for k, v in E.items():
            p[k] = r1(v[t])
        frames.append(p)
    return frames, s


def resample(frames, fps_in, fps_out):
    if fps_out == fps_in:
        return frames
    T = len(frames)
    n = int(round((T - 1) * fps_out / fps_in)) + 1
    keys = [k for k in frames[0] if isinstance(frames[0][k], list)] + ['yaw']
    out = []
    for i in range(n):
        u = i * fps_in / fps_out
        a, b = int(math.floor(u)), min(T - 1, int(math.floor(u)) + 1)
        w = u - a
        p = {}
        for k in keys:
            A, B = frames[a][k], frames[b][k]
            p[k] = ([round(x + (y - x) * w, 4) for x, y in zip(A, B)] if isinstance(A, list) else round(A + (B - A) * w, 3))
        out.append(p)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('inp')
    ap.add_argument('out')
    ap.add_argument('--yaw', type=float, default=0.0, help='turn the whole clip by this many degrees')
    ap.add_argument('--at', default='0,0', help='start position X,Z in blocks')
    ap.add_argument('--smooth', type=int, default=3, help='moving-average window on joint positions (frames, 1 = off)')
    ap.add_argument('--fps-in', type=float, default=20.0)
    ap.add_argument('--fps-out', type=float, default=20.0)
    ap.add_argument('--prompt', default='')
    a = ap.parse_args()
    at = tuple(float(v) for v in a.at.split(','))
    frames, s = retarget(np.load(a.inp), a.yaw, at, a.smooth)
    frames = resample(frames, a.fps_in, a.fps_out)
    clip = {'fps': a.fps_out, 'duration': round((len(frames) - 1) / a.fps_out, 3), 'scale': round(float(s), 4),
            'prompt': a.prompt, 'src': a.inp, 'frames': frames}
    with open(a.out, 'w', encoding='utf-8') as f:
        json.dump(clip, f, separators=(',', ':'))
    print(f'{a.out}: {len(frames)} frames @ {a.fps_out} fps, {clip["duration"]} s, scale {s:.3f} blocks/m')


if __name__ == '__main__':
    sys.exit(main())

"""Blocky Minecraft-style characters (standard 64x64 skin layout) + .bbmodel weapons, rendered in one 3D scene.

Units: 1 unit = 1 skin pixel; a character is 32 units tall. Characters face +z at yaw 0. Orthographic camera.
Usage:
    sc = Scene(W, H, scale, cam_yaw, cam_pitch, center_world, screen_center)
    sc.add_char(skin_rgba, pose, weapon_quads=None)
    img = sc.render()          # RGBA uint8 (H, W, 4)
Skins: any 64x64 Minecraft skin PNG works (drop real ones in src/skins/); make_skin() draws original placeholders.
"""
import math, os, sys, importlib.util
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))


def Rx(a):
    a = math.radians(a); c, s = math.cos(a), math.sin(a); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
def Ry(a):
    a = math.radians(a); c, s = math.cos(a), math.sin(a); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def Rz(a):
    a = math.radians(a); c, s = math.cos(a), math.sin(a); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


class Quad:
    """Parallelogram A + s*(B-A) + t*(C-A); texture coords given at A, B, C (pixel units of tex)."""
    __slots__ = ('A', 'B', 'C', 'tex', 'uvA', 'uvB', 'uvC', 'shade', 'tint')
    def __init__(s, A, B, C, tex, uvA, uvB, uvC, shade=None, tint=None):
        s.A, s.B, s.C = np.asarray(A, float), np.asarray(B, float), np.asarray(C, float)
        s.tex, s.uvA, s.uvB, s.uvC, s.shade, s.tint = tex, uvA, uvB, uvC, shade, tint
    def xf(s, M, t):
        return Quad(M @ s.A + t, M @ s.B + t, M @ s.C + t, s.tex, s.uvA, s.uvB, s.uvC, s.shade, s.tint)


def box_quads(tex, u, v, w, h, d, x0, y0, z0, inflate=0.0):
    """Box with Minecraft box-UV at (u,v), size w,h,d pixels, min corner (x0,y0,z0). Front face is +z."""
    i = inflate; x1, y1, z1 = x0 + w + i, y0 + h + i, z0 + d + i; x0, y0, z0 = x0 - i, y0 - i, z0 - i
    def r(a, b, c, uu, vv, ww, hh):  # A top-left, B top-right, C bottom-left of region
        return Quad(a, b, c, tex, (uu, vv), (uu + ww, vv), (uu, vv + hh))
    return [
        r((x0, y1, z1), (x1, y1, z1), (x0, y0, z1), u + d, v + d, w, h),            # front
        r((x1, y1, z0), (x0, y1, z0), (x1, y0, z0), u + 2 * d + w, v + d, w, h),    # back
        r((x0, y1, z0), (x0, y1, z1), (x0, y0, z0), u, v + d, d, h),                # right side (-x)
        r((x1, y1, z1), (x1, y1, z0), (x1, y0, z1), u + d + w, v + d, d, h),        # left side (+x)
        r((x0, y1, z0), (x1, y1, z0), (x0, y1, z1), u + d, v, w, d),                # top
        r((x0, y0, z1), (x1, y0, z1), (x0, y0, z0), u + d + w, v, w, d),            # bottom
    ]


LIGHT = np.array([-0.45, 0.8, 0.55]); LIGHT /= np.linalg.norm(LIGHT)

# ---------------------------------------------------------------- character
PARTS = {  # name: (u, v, w, h, d, min corner, pivot)
    'head': (0, 0, 8, 8, 8, (-4, 24, -4), (0, 24, 0)),
    'body': (16, 16, 8, 12, 4, (-4, 12, -2), (0, 12, 0)),
    'rarm': (40, 16, 4, 12, 4, (-8, 12, -2), (-6, 22, 0)),
    'larm': (32, 48, 4, 12, 4, (4, 12, -2), (6, 22, 0)),
    'rleg': (0, 16, 4, 12, 4, (-4, 0, -2), (-2, 12, 0)),
    'lleg': (16, 48, 4, 12, 4, (0, 0, -2), (2, 12, 0)),
}
OVERLAY = {'head': (32, 0), 'body': (16, 32), 'rarm': (40, 32), 'larm': (48, 48), 'rleg': (0, 32), 'lleg': (0, 48)}


def char_quads(skin, pose, weapon=None):
    """pose: dict with pos (x,y,z), yaw, roll (death tip-over, deg about the facing axis), head_yaw, head_pitch,
    and per-limb pitch/roll: rarm, larm, rleg, lleg (deg; +pitch swings forward). weapon: list of Quads in hand space."""
    out = []
    for name, (u, v, w, h, d, mn, pv) in PARTS.items():
        q = box_quads(skin, u, v, w, h, d, *mn)
        if skin.shape[0] == 64 and skin[..., 3].max() > 0:
            ou, ov = OVERLAY[name]
            if skin[ov:ov + d + h, ou:ou + 2 * (w + d), 3].max() > 0:
                q += box_quads(skin, ou, ov, w, h, d, *mn, inflate=0.5 if name == 'head' else 0.25)
        pv = np.array(pv, float)
        if name == 'head': R = Ry(pose.get('head_yaw', 0)) @ Rx(-pose.get('head_pitch', 0))
        elif name == 'body': R = np.eye(3)
        else: R = Rz(pose.get(name + '_roll', 0)) @ Rx(-pose.get(name, 0))
        q = [x.xf(R, pv - R @ pv) for x in q]
        if name == 'rarm' and weapon:
            q += [x.xf(R, pv - R @ pv) for x in weapon]
        out += q
    # whole body: death roll about the feet, then yaw, then position
    M = Ry(pose.get('yaw', 0)) @ Rz(pose.get('roll', 0)) @ Rx(-pose.get('lean', 0))
    t = np.array(pose.get('pos', (0, 0, 0)), float)
    tint = pose.get('tint')
    res = [x.xf(M, t) for x in out]
    if tint is not None:
        for x in res: x.tint = tint
    return res


# ---------------------------------------------------------------- weapons from the .bbmodel
_BB = None
def _bb():
    global _BB
    if _BB is None:
        argv = sys.argv[:]
        sys.argv = ['x', os.path.join(ROOT, 'assets/models/newgenmc_vu_khi_huyen_thoai.bbmodel'), '/tmp/bbtmp']
        spec = importlib.util.spec_from_file_location('bbrender', os.path.join(ROOT, 'bbtool/render.py'))
        m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); sys.argv = argv
        _BB = m
    return _BB


def weapon_quads(name, length=20.0, grip=0.12, hand=(-6, 11, 0), tilt=-10):
    """Weapon held in the right hand, blade pointing forward (+z). Returns Quads in character space
    (attach via char_quads(weapon=...), which then rotates them with the right arm)."""
    R = _bb(); g = next(g for g in R.d['outliner'] if g['name'] == name)
    fl = [x for e in R.collect(g) for x in R.faces(e)]
    pts = np.array([p for _, P, _ in fl for p in P] + [P[1] + P[2] - P[0] for _, P, _ in fl])
    mn, mx = pts.min(0), pts.max(0); s = length / max(1e-6, mx[1] - mn[1])
    gp = np.array([(mn[0] + mx[0]) / 2, mn[1] + grip * (mx[1] - mn[1]), (mn[2] + mx[2]) / 2])
    M = Rx(90 + tilt) * s  # weapon +y -> forward (+z), tilted up a little
    t = np.array(hand, float) - M @ gp
    qs = []
    for k, P, fc in fl:
        u1, v1, u2, v2 = fc['uv']; uvs = [(u1, v1), (u2, v1), (u2, v2), (u1, v2)]
        r = int(fc.get('rotation', 0)) // 90 % 4; uvs = uvs[r:] + uvs[:r]
        frs, uw, uh, ft = R.TEX[fc['texture']]; tex = frs[0]; th, tw = tex.shape[:2]
        sx, sy = tw / uw, th / uh
        (ua, va), (ub, vb), _, (uc, vc) = uvs
        qs.append(Quad(M @ P[0] + t, M @ P[1] + t, M @ P[2] + t, tex, (ua * sx, va * sy), (ub * sx, vb * sy), (uc * sx, vc * sy)))
    return qs


# ---------------------------------------------------------------- renderer
class Scene:
    def __init__(s, W, H, scale, cam_yaw=0.0, cam_pitch=12.0, center=(0, 16, 0), screen=None):
        s.W, s.H, s.sc = W, H, scale
        s.V = Rx(cam_pitch) @ Ry(cam_yaw); s.c = s.V @ np.array(center, float)
        s.scr = screen or (W / 2, H / 2); s.quads = []
        # optional coloured lighting (v2). None keeps the original single-direction shade exactly.
        # dict(amb=(r,g,b), key=((r,g,b), dir), rim=((r,g,b), dir), points=[((r,g,b), pos, radius), ...]); colours as 0..1+ multipliers
        s.light = None
    def _light(s, Q, n):
        L = s.light; col = np.array(L['amb'], np.float32)
        kc, kd = L['key']; kd = np.asarray(kd, float); kd = kd / np.linalg.norm(kd)
        col = col + np.array(kc, np.float32) * max(0.0, float(n @ kd))
        if L.get('rim'):
            rc, rd = L['rim']; rd = np.asarray(rd, float); rd = rd / np.linalg.norm(rd)
            side = 1.0 - abs(float((s.V @ n)[2]))          # strongest on faces seen edge-on (silhouette edges)
            col = col + np.array(rc, np.float32) * max(0.0, float(n @ rd)) * (0.35 + 0.65 * side)
        if L.get('points'):
            p = Q.A + 0.5 * (Q.B - Q.A) + 0.5 * (Q.C - Q.A)
            for pc, pp, r in L['points']:
                dv = np.asarray(pp, float) - p; d = float(np.linalg.norm(dv)) + 1e-6
                col = col + np.array(pc, np.float32) * max(0.0, float(n @ dv) / d) / (1.0 + (d / r) ** 2)
        return col
    def proj(s, p):
        q = s.V @ p
        return np.array([s.scr[0] + (q[0] - s.c[0]) * s.sc, s.scr[1] - (q[1] - s.c[1]) * s.sc, q[2]])
    def add(s, quads): s.quads += quads
    def render(s):
        W, H = s.W, s.H
        img = np.zeros((H, W, 4), np.float32); zb = np.full((H, W), -1e9, np.float32)
        for Q in s.quads:
            A, B, C = s.proj(Q.A), s.proj(Q.B), s.proj(Q.C)
            e1, e2 = B - A, C - A; det = e1[0] * e2[1] - e1[1] * e2[0]
            if abs(det) < 1e-6: continue
            D = A + e1 + e2; xs = (A[0], B[0], C[0], D[0]); ys = (A[1], B[1], C[1], D[1])
            x0, x1 = max(0, int(min(xs))), min(W - 1, int(math.ceil(max(xs)))); y0, y1 = max(0, int(min(ys))), min(H - 1, int(math.ceil(max(ys))))
            if x1 < x0 or y1 < y0: continue
            X, Y = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
            dx, dy = X - A[0], Y - A[1]
            ss = (dx * e2[1] - dy * e2[0]) / det; tt = (e1[0] * dy - e1[1] * dx) / det
            m = (ss >= 0) & (ss < 1) & (tt >= 0) & (tt < 1)
            if not m.any(): continue
            z = A[2] + ss * e1[2] + tt * e2[2]
            sub = zb[y0:y1 + 1, x0:x1 + 1]; m &= z > sub
            if not m.any(): continue
            ua, va = Q.uvA; ub, vb = Q.uvB; uc, vc = Q.uvC
            U = ua + ss * (ub - ua) + tt * (uc - ua); V = va + ss * (vb - va) + tt * (vc - va)
            th, tw = Q.tex.shape[:2]
            px = np.clip(np.floor(U).astype(int), 0, tw - 1); py = np.clip(np.floor(V).astype(int), 0, th - 1)
            c = Q.tex[py, px].astype(np.float32)
            m &= c[..., 3] >= 128
            if not m.any(): continue
            n = np.cross(Q.C - Q.A, Q.B - Q.A); nl = np.linalg.norm(n)
            if s.light is not None and Q.shade is None and nl > 0:
                c[..., :3] *= s._light(Q, n / nl)
            else:
                sh = Q.shade if Q.shade is not None else (0.62 + 0.38 * max(0.0, float(n @ LIGHT) / nl) if nl > 0 else 0.8)
                c[..., :3] *= sh
            if Q.tint is not None:
                tc, ta = Q.tint; c[..., :3] = c[..., :3] * (1 - ta) + np.array(tc, np.float32) * ta
            c[..., 3] = 255
            sub[m] = z[m]; img[y0:y1 + 1, x0:x1 + 1][m] = c[m]
        return img.clip(0, 255).astype(np.uint8)


# ---------------------------------------------------------------- placeholder skins (original designs)
def make_skin(kind):
    """64x64 RGBA. kind: 'player' (NewGen green hoodie), 'hacker' (black hood, red visor), 'admin' (white/gold)."""
    S = np.zeros((64, 64, 4), np.uint8)
    pal = {
        'player': dict(skin=(214, 160, 120), hair=(92, 58, 34), shirt=(70, 170, 92), shirt2=(52, 132, 72), pants=(48, 62, 96), shoe=(60, 60, 64), eye=(40, 90, 200), trim=(240, 244, 236)),
        'hacker': dict(skin=(150, 118, 98), hair=(24, 24, 28), shirt=(30, 30, 36), shirt2=(20, 20, 24), pants=(36, 36, 42), shoe=(18, 18, 20), eye=(255, 40, 50), trim=(200, 30, 40)),
        'admin': dict(skin=(226, 176, 136), hair=(250, 214, 110), shirt=(244, 244, 248), shirt2=(214, 214, 224), pants=(60, 50, 40), shoe=(40, 32, 26), eye=(30, 160, 90), trim=(255, 176, 60)),
    }[kind]
    def fill(x, y, w, h, col): S[y:y + h, x:x + w, :3] = col; S[y:y + h, x:x + w, 3] = 255
    def boxfill(u, v, w, h, d, col):
        fill(u + d, v, 2 * w, d, col); fill(u, v + d, 2 * (w + d), h, col)
    p = pal
    # head
    boxfill(0, 0, 8, 8, 8, p['skin'])
    fill(8, 0, 8, 8, p['hair']); fill(0, 8, 32, 2, p['hair']); fill(24, 8, 8, 6, p['hair'])
    fill(0, 10, 2, 3, p['hair']); fill(22, 10, 2, 3, p['hair'])
    if kind == 'hacker':  # hood + glowing visor
        fill(0, 8, 32, 8, p['shirt']); fill(8, 0, 8, 8, p['shirt']); fill(9, 10, 6, 5, (10, 10, 12))
        fill(9, 12, 6, 1, p['eye']); fill(10, 12, 1, 1, (255, 160, 160)); fill(13, 12, 1, 1, (255, 160, 160))
    else:
        fill(9, 12, 2, 1, (250, 250, 250)); fill(13, 12, 2, 1, (250, 250, 250))
        fill(10, 12, 1, 1, p['eye']); fill(13, 12, 1, 1, p['eye'])
        fill(11, 14, 2, 1, tuple(int(c * 0.75) for c in p['skin']))
    # body
    boxfill(16, 16, 8, 12, 4, p['shirt'])
    fill(20, 20, 8, 1, p['trim']); fill(23, 21, 2, 7, p['shirt2'])
    if kind == 'admin':
        fill(20, 20, 8, 12, p['shirt']); fill(20, 20, 1, 12, p['trim']); fill(27, 20, 1, 12, p['trim']); fill(20, 30, 8, 2, p['trim'])
        fill(22, 23, 4, 3, p['trim'])  # badge
    if kind == 'hacker':
        fill(22, 23, 4, 4, p['trim'])
    # arms (sleeves + hands)
    for (u, v) in ((40, 16), (32, 48)):
        boxfill(u, v, 4, 12, 4, p['shirt']); fill(u, v + 4 + 9, 16, 3, p['skin']); fill(u + 4, v, 4, 4, p['shirt'])
        if kind == 'admin': fill(u, v + 4 + 7, 16, 2, p['trim'])
    # legs
    for (u, v) in ((0, 16), (16, 48)):
        boxfill(u, v, 4, 12, 4, p['pants']); fill(u, v + 4 + 9, 16, 3, p['shoe'])
    return S

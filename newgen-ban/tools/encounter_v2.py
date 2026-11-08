"""Encounter clip v2: same story as v1 (player vs kill-aura hacker, admin drops in, /ban, death, BANNED), rebuilt from
notes/animation-study.md: a 14-shot cut with impact inserts and flash grammar, anticipation/knockback/trails/idle
animation, motivated coloured lighting (key/fill/rim + point lights), haze, embers, bloom and a graded look.
    python tools/encounter_v2.py still 2.0,5.0,7.9   -> qa/v2_XX.XX.jpg
    python tools/encounter_v2.py F0 F1 out.mp4      -> frames F0..F1-1 (30 fps)
Run from newgen-ban/. Reuses v1's assets/helpers (tools/encounter.py) and its story constants."""
import os, sys, math, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mcchar as MC
import encounter as E
from encounter import (W, H, FPS, WHITE, GREEN, ORANGE, RED, MUTED, FM, FI, HACKER, HITS, HEARTS,
                       T_WALK, T_TP, T_AURA, T_CHIP1, T_CHIP2, T_REC, T_BEAM, T_LAND, T_CHAT1, T_CHAT2,
                       T_BAN, T_FALL, T_POOF, T_STAMP, clamp, eo, eio, bo, runs, tl, hp_img, shadow, warn_icon, SKINS, WP, WH, DEATH)

TOTAL = 10.5
T_SUCK = 3.95                 # music low-pass sweep starts (closes until T_LAND)
INSERTS = [HITS[0], HITS[4]]  # 2-frame impact close-ups
FLASH = T_LAND                # 1 white + 2 black frames
DT = 1.0 / FPS

# ------------------------------------------------------------------ shot list (t0, cam)
# cam: yaw, pitch, scale, center (world), screen y, push (scale %/s), drift (px/s), follow (track player x)
SHOTS = [
    (0.00, dict(yaw=28, pitch=8, scale=19, center=(-50, 18, 6), sy=0.58, push=5, drift=-70, follow=True, label='walk')),
    (1.00, dict(yaw=-24, pitch=5, scale=27, center=(34, 20, 6), sy=0.56, push=7, drift=40, label='hacker in')),
    (1.40, dict(yaw=-110, pitch=3, scale=58, center=(-24, 29, 6), sy=0.5, push=6, drift=-20, follow=True, label='react')),
    (1.65, dict(yaw=4, pitch=10, scale=14.5, center=(2, 16, 4), sy=0.56, push=3, drift=60, label='wide 1')),
    (2.25, dict(yaw=-150, pitch=9, scale=21, center=(4, 19, 6), sy=0.57, push=4, drift=-60, label='ots hacker')),
    (2.80, dict(yaw=-14, pitch=-13, scale=19, center=(30, 18, 6), sy=0.50, push=6, drift=50, label='low hacker')),
    (3.30, dict(yaw=10, pitch=10, scale=15, center=(0, 16, 4), sy=0.56, push=3, drift=-50, label='wide 2')),
    (3.95, dict(yaw=6, pitch=8, scale=17, center=(-10, 15, 4), sy=0.57, push=3, drift=-12, label='suck-out')),
    (4.45, dict(yaw=-8, pitch=-16, scale=15, center=(0, 34, -26), sy=0.48, push=12, drift=20, label='beam')),
    (5.10, dict(yaw=0, pitch=10, scale=14, center=(0, 16, -4), sy=0.57, push=2.5, drift=50, label='standoff')),
    (5.90, dict(yaw=15, pitch=5, scale=32, center=(0, 26, -26), sy=0.52, push=5, drift=-30, label='admin cu')),
    (6.45, dict(yaw=-30, pitch=6, scale=28, center=(36, 20, 6), sy=0.55, push=6, drift=40, label='hacker cu')),
    (6.85, dict(yaw=4, pitch=10, scale=14.5, center=(6, 16, -4), sy=0.57, push=2, drift=-40, label='fall')),
    (8.30, dict(yaw=10, pitch=8, scale=18, center=(2, 18, -10), sy=0.57, push=3, drift=-35, label='resolve')),
]
INSERT_CAM = dict(yaw=-38, pitch=4, scale=74, sy=0.5)

def shot_at(t):
    i = max(k for k, (t0, _) in enumerate(SHOTS) if t >= t0)
    t0, c = SHOTS[i]; t1 = SHOTS[i + 1][0] if i + 1 < len(SHOTS) else TOTAL
    return i, t0, t1, c

# ------------------------------------------------------------------ skins: expressions by eye-texture swap
def face_variant(skin, kind):
    s = skin.copy(); fr = s[8:16, 8:16]
    base = fr[2, 1].copy()                                   # forehead skin colour
    if kind == 'blink': fr[3:5, 1:7] = base; fr[4, 1:3] = fr[4, 5:7] = (base * 0.6).astype(np.uint8); fr[4, 1:3, 3] = fr[4, 5:7, 3] = 255
    if kind == 'wide': fr[3, 1:3] = fr[3, 5:7] = (250, 250, 250, 255); fr[5, 3:5] = (90, 50, 40, 255)  # eyes open up + "o" mouth
    return s
FACES = {k: {'open': SKINS[k], 'blink': face_variant(SKINS[k], 'blink'), 'wide': face_variant(SKINS[k], 'wide')} for k in ('player', 'admin')}
FACES['hacker'] = {'open': SKINS['hacker']}
def eyes_only(skin):                                          # emissive pass: only the visor/eye pixels
    s = np.zeros_like(skin); e = skin[8:16, 8:16]; m = (e[..., 0] > 180) & (e[..., 1] < 120)
    s[8:16, 8:16][m] = e[m]; return s
HACKER_EYES = eyes_only(SKINS['hacker'])

def face_for(k, t):
    if k == 'player':
        if 1.45 <= t < 2.4 or T_LAND - 0.05 <= t < T_LAND + 0.8: return 'wide'
        for b in (0.55, 4.2, 6.1, 9.2):
            if b <= t < b + 0.1: return 'blink'
    if k == 'admin':
        for b in (6.3, 9.6):
            if b <= t < b + 0.1: return 'blink'
    return 'open'

# ------------------------------------------------------------------ animation
def breathe(t, ph):  # idle life on everyone
    return dict(rarm=3 * math.sin(t * 2.5 + ph), larm=-3 * math.sin(t * 2.5 + ph + 0.6), head_yaw=4 * math.sin(t * 1.6 + ph), lean=1.2 * math.sin(t * 2.5 + ph))

def hit_state(t):
    n = sum(1 for h in HITS if t >= h); last = max([h for h in HITS if t >= h], default=-9); return n, t - last

def player_pose(t):
    p = E.player_pose(t); p = dict(p); p['pos'] = list(p['pos'])
    b = breathe(t, 0.0)
    for k in ('rarm', 'larm', 'head_yaw'): p[k] = p.get(k, 0) + b[k]
    p['lean'] = p.get('lean', 0) + b['lean']
    n, dt = hit_state(t)
    if n and dt < 0.45:                                       # knockback that travels, head snaps, settles with overshoot
        k = math.exp(-dt * 9) * math.cos(dt * 18)
        p['lean'] += -16 * k; p['head_pitch'] = 14 * k; p['larm'] = p.get('larm', 0) - 25 * k
    if T_SUCK <= t < T_LAND:                                  # low on hearts: hunched, head down
        u = eo((t - T_SUCK) / 0.3); p['lean'] += 9 * u; p['head_pitch'] = p.get('head_pitch', 0) - 12 * u
    if T_LAND <= t < T_LAND + 0.6:                            # flinches at the landing, then looks up
        u = 1 - eo((t - T_LAND) / 0.6); p['lean'] += -6 * u; p['head_pitch'] = p.get('head_pitch', 0) + 10 * u
    if T_WALK[1] - 0.25 < t < T_WALK[1] + 0.2:                # walk stops with a weight settle
        u = (t - T_WALK[1] + 0.25) / 0.45; p['lean'] += 5 * math.sin(u * math.pi)
    p['pos'] = tuple(p['pos']); return p

def hacker_arm(t):
    """per-hit anticipation (wind-up 0.16 s) -> 2-frame strike -> recover."""
    for h in HITS:
        if h - 0.2 <= t < h - 0.04: return 80 + 75 * eio((t - h + 0.2) / 0.16)
        if h - 0.04 <= t < h: return 155 - 125 * ((t - h + 0.04) / 0.04)
        if h <= t < h + 0.16: return 30 + 50 * eo((t - h) / 0.16)
    return None

def hacker_pose(t):
    p = dict(E.hacker_pose(t)); p['pos'] = list(p['pos'])
    if T_AURA[0] <= t < T_AURA[1]:
        a = hacker_arm(t)
        if a is not None: p['rarm'] = a
    else:
        b = breathe(t, 2.1); p['rarm'] = p.get('rarm', 0) + b['rarm']; p['head_yaw'] = p.get('head_yaw', 0) + b['head_yaw']
    if T_TP <= t < T_TP + 0.35:                               # arrives with a small overshoot drop
        p['pos'][1] += 6 * (1 - bo((t - T_TP) / 0.35))
    p['pos'] = tuple(p['pos']); return p

def admin_pose(t):
    p = dict(E.admin_pose(t)); p['pos'] = list(p['pos'])
    if t >= T_LAND:                                           # landing crouch -> overshoot settle
        dt = t - T_LAND; k = math.exp(-dt * 7) * math.cos(dt * 13)
        p['lean'] = 14 * k; p['pos'][1] -= 3 * max(0, k); p['head_pitch'] = -8 * k
        if dt > 0.4:
            b = breathe(t, 4.2); p['head_yaw'] = p.get('head_yaw', 0) + b['head_yaw'] * 0.6; p['lean'] += b['lean']
    p['pos'] = tuple(p['pos']); return p

def hacker_visible(t): return T_TP <= t < T_POOF + 0.05

def blade_pts(pose, along):
    """world points on the hacker's blade (hand -> tip), following the right-arm rig in mcchar.char_quads."""
    pv = np.array([-6, 22, 0], float); R = MC.Rz(pose.get('rarm_roll', 0)) @ MC.Rx(-pose.get('rarm', 0))
    M = MC.Ry(pose.get('yaw', 0)) @ MC.Rz(pose.get('roll', 0)) @ MC.Rx(-pose.get('lean', 0)); pos = np.array(pose['pos'], float)
    out = []
    for a in along:
        q = np.array([-6, 11 + 3.5 * a, 19 * a], float)
        out.append(M @ (R @ (q - pv) + pv) + pos)
    return out

# ------------------------------------------------------------------ backgrounds
def _bigbg(blur):
    src = Image.open('../newgen-ranked/src/map_castle.png').convert('RGB').resize((int(W * 1.7), int(H * 1.7)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(blur))
    b = np.asarray(src).astype(np.float32) * 0.55 + np.array([6, 6, 14], np.float32)
    return Image.fromarray(np.clip(b, 0, 255).astype(np.uint8))
BG = {'near': _bigbg(12), 'far': _bigbg(26)}
def bg_view(c, t, t0, push):
    im = BG['far' if c['scale'] > 24 else 'near']; bw, bh = im.size
    z = 1.0 + 0.15 * clamp((c['scale'] - 14) / 50) + push * 0.25   # background moves slower than the subject (parallax)
    cw, ch = W / z * 1.25, H / z * 1.25
    cx = bw / 2 + (c['yaw'] / 180.0) * (bw - cw) / 2 + c['drift'] * 0.35 * (t - t0)
    cy = bh / 2 - (c['pitch'] / 20.0) * (bh - ch) / 3
    cx = min(max(cx, cw / 2), bw - cw / 2); cy = min(max(cy, ch / 2), bh - ch / 2)
    return im.crop((int(cx - cw / 2), int(cy - ch / 2), int(cx + cw / 2), int(cy + ch / 2))).resize((W, H), Image.BILINEAR).convert('RGBA')

# ------------------------------------------------------------------ lighting
def beam_alpha(t): return eo((t - T_BEAM) / 0.2) * (1 - eo((t - T_LAND - 0.1) / 0.8)) if T_BEAM <= t < T_LAND + 0.9 else 0.0
def lights(t):
    pts = []
    if hacker_visible(t) and t < T_POOF:
        hp = hacker_pose(t)['pos']; pts.append(((1.5, 0.12, 0.15), (hp[0] - 8, 3, hp[2] + 14), 26))        # red under-light from the hacker
    a = beam_alpha(t)
    if a > 0: pts.append(((1.6 * a, 1.35 * a, 1.0 * a), (0, 46, -16), 60))                                    # warm admin beam
    if t >= T_LAND: pts.append(((0.35, 0.3, 0.2), (0, 30, -10), 40))                                          # admin aura afterwards
    n, dt = hit_state(t)
    if n and dt < 0.12 and t < T_AURA[1]:
        k = 1 - dt / 0.12; pp = player_pose(t)['pos']; pts.append(((0.9 * k, 0.55 * k, 0.15 * k), (pp[0] + 10, 22, 12), 14))  # spark light
    return dict(amb=(0.36, 0.40, 0.55), key=((0.62, 0.55, 0.46), (-0.45, 0.8, 0.55)), rim=((0.75, 0.85, 1.1), (0.75, 0.3, -0.6)), points=pts)

# ------------------------------------------------------------------ fx layers
def embers(t, front):
    rs = np.random.RandomState(11 if front else 5); n = 7 if front else 46; out = []
    for i in range(n):
        x0, y0, sp, ph = rs.uniform(0, W), rs.uniform(0, H), rs.uniform(30, 90) * (2.2 if front else 1), rs.uniform(0, 6.28)
        x = (x0 + 25 * math.sin(t * 0.9 + ph) + (60 if front else 20) * t) % (W + 200) - 100
        y = (y0 - sp * t) % (H + 200) - 100
        s = rs.uniform(18, 46) if front else rs.uniform(2.5, 6)
        a = (0.35 if front else 0.75) * (0.6 + 0.4 * math.sin(t * 3 + ph))
        out.append((x, y, s, a))
    return out

def star(size, col):
    """impact flare: hot core + long horizontal streak + spikes (additive)."""
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = size / 2
    for r, al in ((size * 0.42, 40), (size * 0.25, 90), (size * 0.12, 200), (size * 0.05, 255)):
        d.ellipse((c - r, c - r, c + r, c + r), fill=col + (al,))
    d.rectangle((0, c - 3, size, c + 3), fill=(255, 236, 200, 200))
    for k in range(8):
        a = k * math.pi / 4 + 0.3; L = size * (0.48 if k % 2 else 0.3)
        d.line([(c, c), (c + L * math.cos(a), c + L * math.sin(a))], fill=(255, 250, 235, 220), width=3)
    return im.filter(ImageFilter.GaussianBlur(1.5))
STAR = star(420, ORANGE); STAR_S = star(180, ORANGE)

def grade(arr):
    x = arr.astype(np.float32) / 255.0
    x = np.clip((x - 0.025) / 0.95, 0, 1)                                     # true blacks
    l = (0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2])[..., None]
    x = x + (1 - l) ** 2 * np.array([-0.01, 0.0, 0.035]) + l ** 2 * np.array([0.035, 0.012, -0.025])  # cool shadows, warm highlights
    x = x * VIG
    return np.clip(x * 255, 0, 255).astype(np.uint8)
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = (1 - 0.22 * (((_xx - W / 2) / (W / 2)) ** 2 + ((_yy - H / 2) / (H / 2)) ** 2) / 2)[..., None]

# ------------------------------------------------------------------ frame
def shake(t):
    a = 0.0
    for t0, amp in [(T_LAND + 0.1, 18), (T_BAN, 7), (T_STAMP, 10)] + [(h, 6) for h in HITS]:
        dt = t - t0
        if 0 <= dt < 0.25: a = max(a, amp * (1 - dt / 0.25))
    return a * math.sin(t * 90), a * math.cos(t * 77)

def camera(t):
    """-> (cam dict with final scale/screen, shot index, shot start) for normal shots and inserts."""
    i, t0, t1, c = shot_at(t); lt = t - t0; c = dict(c); sx, sy = shake(t)
    scale = c['scale'] * (1 + c['push'] / 100 * lt)
    ctr = list(c['center'])
    if c.get('follow'): ctr[0] = player_pose(t)['pos'][0] + (10 if c['label'] == 'walk' else 0)
    c.update(scale=scale, center=tuple(ctr), screen=(W / 2 + c['drift'] * lt + sx, H * c['sy'] + sy))
    return c, i, t0

def scene(c, t, emissive=False):
    sc = MC.Scene(W, H, c['scale'], cam_yaw=c['yaw'], cam_pitch=c['pitch'], center=c['center'], screen=c['screen'])
    if not emissive: sc.light = lights(t)
    return sc

def characters(sc, t, glitching):
    pp = player_pose(t); sc.add(MC.char_quads(FACES['player'][face_for('player', t)], pp, WP))
    if t >= T_BEAM: sc.add(MC.char_quads(FACES['admin'][face_for('admin', t)], admin_pose(t)))
    if hacker_visible(t) and not glitching: sc.add(MC.char_quads(SKINS['hacker'], hacker_pose(t), WH))

def render_scene(t, c, insert=False):
    """graded RGBA scene layer (no text) + the scene used for projecting overlays."""
    fr = bg_view(c, t, shot_at(t)[1], c['push'] / 100 * (t - shot_at(t)[1]))
    d = ImageDraw.Draw(fr, 'RGBA'); glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    sc = scene(c, t)

    # god rays from top-left (faint, background only)
    rays = Image.new('RGBA', (W, H), (0, 0, 0, 0)); rd = ImageDraw.Draw(rays)
    for k in range(5):
        x = -200 + k * 260 + 40 * math.sin(t * 0.3 + k); rd.polygon([(x, -10), (x + 120, -10), (x + 700, H), (x + 420, H)], fill=(255, 220, 170, 10))
    fr.alpha_composite(rays.filter(ImageFilter.GaussianBlur(30)))
    # embers behind
    for x, y, s, a in embers(t, False): gd.rectangle((x - s / 2, y - s / 2, x + s / 2, y + s / 2), fill=(255, 150, 70, int(200 * a)))

    # admin beam (soft, behind everyone) + its glow
    a = beam_alpha(t)
    if a > 0:
        bx, _, _ = sc.proj(np.array([0, 0, -26.0])); beam = Image.new('RGBA', (300, H), (0, 0, 0, 0)); bd = ImageDraw.Draw(beam)
        for i in range(150):
            al = int(a * 130 * (1 - i / 150) ** 2); bd.line([(150 - i, 0), (150 - i, H)], fill=(255, 232, 186, al)); bd.line([(150 + i, 0), (150 + i, H)], fill=(255, 232, 186, al))
        fr.alpha_composite(beam, (int(bx - 150), 0)); gd.rectangle((bx - 14, 0, bx + 14, H), fill=(255, 240, 210, int(160 * a)))

    # haze between background and characters (depth)
    haze = np.zeros((H, W, 4), np.uint8); haze[..., :3] = (46, 52, 74); haze[..., 3] = (np.linspace(10, 46, H)[:, None]).astype(np.uint8)
    fr.alpha_composite(Image.fromarray(haze))

    # contact shadows (+ AO core)
    poses = [('player', player_pose(t))]
    if t >= T_BEAM: poses.append(('admin', admin_pose(t)))
    if hacker_visible(t) and t < T_POOF: poses.append(('hacker', hacker_pose(t)))
    for k, p in poses:
        gx, gy, _ = sc.proj(np.array([p['pos'][0], 0, p['pos'][2]], float)); air = p['pos'][1]; f = c['scale'] / 13
        shadow(fr, gx, gy, 120 * f * max(0.35, 1 - air / 80), 0.55 * max(0.3, 1 - air / 80))
        shadow(fr, gx, gy, 55 * f, 0.45 * max(0.0, 1 - air / 20))

    # weapon trail on the kill-aura spin (drawn before the characters so bodies occlude it)
    if hacker_visible(t) and T_AURA[0] <= t < T_AURA[1]:
        trail = Image.new('RGBA', (W, H), (0, 0, 0, 0)); td = ImageDraw.Draw(trail); prev = None
        for k in range(9):
            tk = t - k / 110.0
            if tk < T_AURA[0]: break
            pts = [sc.proj(p)[:2] for p in blade_pts(hacker_pose(tk), (0.45, 1.0))]
            if prev is not None:
                al = int(150 * (1 - k / 9)); td.polygon([tuple(prev[0]), tuple(prev[1]), tuple(pts[1]), tuple(pts[0])], fill=(225, 232, 248, al))
            prev = pts
        fr.alpha_composite(trail.filter(ImageFilter.GaussianBlur(2)))

    # characters (lit)
    glitching = 0 <= t - T_TP < 0.35
    characters(sc, t, glitching); fr.alpha_composite(Image.fromarray(sc.render()))
    if glitching:
        hs = scene(c, t); hs.add(MC.char_quads(SKINS['hacker'], hacker_pose(t), WH)); fr.alpha_composite(E.glitch(Image.fromarray(hs.render()), t))
    # emissive eyes -> bloom layer
    if hacker_visible(t) and not glitching and t < T_FALL[0] + 0.2:
        es = scene(c, t, emissive=True); qs = MC.char_quads(HACKER_EYES, hacker_pose(t))
        for q in qs: q.shade = 1.25
        es.add(qs); eye = Image.fromarray(es.render()); fr.alpha_composite(eye); glow.alpha_composite(eye)

    # crit particles + landing dust (world anchored)
    px, py, _ = sc.proj(np.array([player_pose(t)['pos'][0], 20, 6.0])); f = c['scale'] / 13
    for dx, dy, s, al, col in E.crits(t):
        d.rectangle((px + (dx - s / 2) * f, py + (dy - s / 2) * f, px + (dx + s / 2) * f, py + (dy + s / 2) * f), fill=col + (int(230 * al),))
        gd.rectangle((px + (dx - s) * f, py + (dy - s) * f, px + (dx + s) * f, py + (dy + s) * f), fill=(255, 190, 120, int(120 * al)))
    ax, ay, _ = sc.proj(np.array([0, 0, -26.0]))
    for dx, dy, s, al, col in E.dust(t - 0.1):
        d.rectangle((ax + (dx - s / 2) * f, ay + (dy - s / 2) * f, ax + (dx + s / 2) * f, ay + (dy + s / 2) * f), fill=col + (int(200 * al),))
    # landing shock ring
    if T_LAND + 0.1 <= t < T_LAND + 0.5:
        u = eo((t - T_LAND - 0.1) / 0.4); r = 60 + 420 * u * f / 1.08
        d.ellipse((ax - r, ay - r * 0.22, ax + r, ay + r * 0.22), outline=(255, 240, 215, int(200 * (1 - u))), width=max(2, int(10 * (1 - u))))

    # death puff (the user's Minecraft death-particle green screen)
    if T_POOF <= t < T_POOF + 1.4:
        k = 16 + int((t - T_POOF) * 30)
        if k < len(DEATH):
            hp_ = hacker_pose(T_FALL[1]); p2x, p2y, _ = sc.proj(np.array([hp_['pos'][0], 6, hp_['pos'][2]], float)); sz = int(620 * f / 1.08)
            im = Image.fromarray(np.asarray(DEATH[k])).resize((sz, sz), Image.BILINEAR); fr.alpha_composite(im, (int(p2x - sz / 2), int(p2y - sz * 0.58)))

    # foreground: near embers (big, soft) + a dark out-of-focus pillar on wide/walk shots
    fg = Image.new('RGBA', (W, H), (0, 0, 0, 0)); fd = ImageDraw.Draw(fg)
    lab = c.get('label', '')
    if lab in ('walk', 'standoff', 'resolve'):
        i, t0, _, _ = shot_at(t); x = {'walk': W * 0.9, 'standoff': -60, 'resolve': W * 0.95}[lab] + c['drift'] * 1.9 * (t - t0)
        fd.rectangle((x - 90, -20, x + 90, H + 20), fill=(8, 8, 14, 235))
    for x, y, s, al in embers(t, True): fd.ellipse((x - s, y - s, x + s, y + s), fill=(255, 170, 90, int(110 * al)))
    fr.alpha_composite(fg.filter(ImageFilter.GaussianBlur(16)))

    # bloom
    g = glow.filter(ImageFilter.GaussianBlur(14)); ga = np.asarray(g).astype(np.float32)
    base = np.asarray(fr).astype(np.float32); base[..., :3] = np.clip(base[..., :3] + ga[..., :3] * (ga[..., 3:] / 255.0) * 0.9, 0, 255)
    out = grade(base[..., :3].astype(np.uint8))
    return Image.fromarray(out).convert('RGBA'), sc

def render_insert(t, h):
    """2-frame impact close-up: blade contact on the player, orange flare, warm push."""
    pp = player_pose(t); u = (t - h) / (2 * DT)
    c = dict(INSERT_CAM, center=(pp['pos'][0] + 6, 21, 6), push=0, drift=0, label='insert')
    c['scale'] = INSERT_CAM['scale'] * (1 + 0.08 * u); c['screen'] = (W / 2 + 30 * u, H * c['sy'])
    fr, sc = render_scene(t, c, insert=True)
    a = np.asarray(fr).astype(np.float32); a[..., :3] = np.clip(a[..., :3] * np.array([1.07, 1.0, 0.92]) + np.array([10, 5, 0]), 0, 255)
    fr = Image.fromarray(a.astype(np.uint8))
    x, y, _ = sc.proj(np.array([pp['pos'][0] + 7, 22, 8.0])); s = STAR.resize((int(STAR.width * (1.0 - 0.25 * u)),) * 2)
    fr.alpha_composite(s, (int(x - s.width / 2), int(y - s.height / 2)))
    return fr

# ------------------------------------------------------------------ text overlays (after grade: pure white text)
def overlays(fr, t, sc, c):
    big = c['scale'] > 24; d = ImageDraw.Draw(fr, 'RGBA')
    def head_xy(p, k):
        if k == 'hacker' and p.get('roll'): return None
        x, y, _ = sc.proj(np.array([p['pos'][0], p['pos'][1] + 37, p['pos'][2]], float)); return x, y
    def nametag(k, p, parts):
        xy = head_xy(p, k)
        if not xy or big: return
        L = runs(parts, FI, 30, 'Bold'); x, y = xy
        plate = Image.new('RGBA', (L.width - 4, L.height - 10), (0, 0, 0, 120)); fr.alpha_composite(plate, (int(x - plate.width / 2), int(y - plate.height)))
        fr.alpha_composite(L, (int(x - L.width / 2), int(y - L.height + 2)))
    pp = player_pose(t); nametag('player', pp, [('Bạn', WHITE)])
    if t >= T_BEAM: nametag('admin', admin_pose(t), [('[ADMIN] ', ORANGE), ('NewGen', WHITE)])
    if hacker_visible(t) and t >= T_TP + 0.25: nametag('hacker', hacker_pose(t), [(HACKER, WHITE)])
    # player hearts: above the head on wide shots, pinned under the REC line on close shots
    n, dt = hit_state(t); hi = hp_img(HEARTS[max(0, n - 1)] if n else 10, HEARTS[n], dt / 0.4 if n else 1, 300)
    hx, hy = head_xy(pp, 'player')
    if big or not (0 < hx < W and 120 < hy < H): fr.alpha_composite(hi, (60, 150))
    else: fr.alpha_composite(hi, (int(hx - hi.width / 2), int(hy - 58 - hi.height)))
    # hack chips (screen-anchored to the right when the hacker is off-frame or close)
    if hacker_visible(t):
        hp_ = hacker_pose(t); hx2, hy2, _ = sc.proj(np.array([hp_['pos'][0], 30, hp_['pos'][2]], float))
        # follow the hacker; flip to his left side near the right edge; keep clear of the top HUD/nametag band
        # (left of him is where the admin stands, so the fallback is pinned top-right under the HUD)
        if hx2 + 150 + 320 < W - 40 and 260 < hy2 - 20 < H - 330: anchor = (hx2 + 150, hy2 - 20)
        elif t < T_BEAM and hx2 - 150 - 320 > 360: anchor = (hx2 - 150 - 320, min(max(hy2 - 20, 260), H - 330))
        else: anchor = (W - 400, 150)
        for i, (t0, label) in enumerate([(T_CHIP1, 'KILL AURA'), (T_CHIP2, 'REACH')]):
            if t < t0 or t > T_BAN: continue
            u = bo((t - t0) / 0.3); L = tl(label, FM, 40, WHITE); ic = warn_icon(34, ORANGE)
            pill = Image.new('RGBA', (L.width + 56, L.height + 4), (0, 0, 0, 0))
            ImageDraw.Draw(pill).rounded_rectangle((6, 6, pill.width - 6, pill.height - 6), 22, fill=(20, 10, 14, 170), outline=ORANGE + (255,), width=3)
            pill.alpha_composite(ic, (24, (pill.height - 34) // 2)); pill.alpha_composite(L, (50, 2)); s = max(0.05, u)
            pill = pill.resize((max(1, int(pill.width * s)), max(1, int(pill.height * s))), Image.LANCZOS)
            fr.alpha_composite(pill, (int(anchor[0]), int(anchor[1] + i * 86 - pill.height / 2)))
    # REC
    if t >= T_REC:
        a = eo((t - T_REC) / 0.3); dot = 1.0 if int((t - T_REC) * 2) % 2 == 0 else 0.35
        d.ellipse((64, 104, 92, 132), fill=RED + (int(255 * a * dot),))
        sec = int(t - T_REC); L = runs([('REC ', WHITE), (f'00:0{min(9, sec)}', WHITE)], FI, 30, 'Bold')
        L.putalpha(L.getchannel('A').point(lambda v: int(v * a))); fr.alpha_composite(L, (98, 96))
    # chat
    if t >= T_CHAT1:
        cmd = f'/ban {HACKER} Hack'; nch = int(clamp((t - T_CHAT1 - 0.15) / 0.75) * len(cmd))
        lines = [[('[ADMIN] ', ORANGE), ('NewGen: ', WHITE), (cmd[:nch] + ('_' if nch < len(cmd) and int(t * 6) % 2 else ''), WHITE)]]
        if t >= T_CHAT2: lines.append([(HACKER, RED), (' đã bị ', WHITE), ('BAN VĨNH VIỄN', ORANGE)])
        ls = [runs(l, FI, 32, 'SemiBold') for l in lines]
        bw = max(l.width for l in ls) + 20; bh = sum(l.height - 8 for l in ls) + 16
        a = eo((t - T_CHAT1) / 0.2); x0, y0 = 60, H - 120 - bh
        fr.alpha_composite(Image.new('RGBA', (bw, bh), (0, 0, 0, int(140 * a))), (x0, y0)); y = y0 + 4
        for l in ls: fr.alpha_composite(l, (x0 + 6, y)); y += l.height - 8
    # BANNED stamp (lands after the poof, holds)
    if t >= T_STAMP:
        u = (t - T_STAMP) / 0.18; s = 1.6 - 0.6 * eo(u)
        L = tl('BANNED', FM, 132, RED); L2 = tl('VĨNH VIỄN', FI, 40, WHITE, 'Bold')
        st = Image.new('RGBA', (L.width + 60, L.height + L2.height + 40), (0, 0, 0, 0)); sd = ImageDraw.Draw(st)
        sd.rounded_rectangle((8, 8, st.width - 8, st.height - 8), 26, fill=(30, 6, 10, 170), outline=RED + (255,), width=8)
        st.alpha_composite(L, (30, 12)); st.alpha_composite(L2, ((st.width - L2.width) // 2, L.height + 2))
        st = st.resize((int(st.width * s), int(st.height * s)), Image.LANCZOS).rotate(8, expand=True, resample=Image.BICUBIC)
        a = clamp(u * 3); st.putalpha(st.getchannel('A').point(lambda v: int(v * a)))
        if c['label'] == 'resolve': x, y = W * 0.79, H * 0.30
        else:
            hp_ = hacker_pose(T_FALL[1]); x, y, _ = sc.proj(np.array([hp_['pos'][0] - 4, 30, hp_['pos'][2]], float))
        fr.alpha_composite(st, (int(x - st.width / 2), int(y - st.height / 2)))

def hud(fr, t):
    d = ImageDraw.Draw(fr, 'RGBA')
    fr.alpha_composite(tl('NEWGENMC', FM, 22, WHITE), (60, 32))
    l = tl('newgenmc.net', FI, 22, WHITE, 'Medium'); fr.alpha_composite(l, (W - 60 - l.width, 34))
    num, name = ('01', 'HACKER?') if t < T_BEAM else ('03', 'REPORT')
    fr.alpha_composite(tl(num, FI, 22, GREEN, 'Bold'), (60, H - 88)); fr.alpha_composite(tl('— ' + name, FI, 22, WHITE, 'SemiBold'), (104, H - 88))
    d.rectangle((W - 360, H - 62, W - 60, H - 60), fill=(255, 255, 255, 40)); d.rectangle((W - 360, H - 62, W - 360 + 300 * t / TOTAL, H - 60), fill=GREEN + (220,))

def render(t):
    for h in INSERTS:
        if h <= t < h + 2 * DT - 1e-6:
            fr = render_insert(t, h); hud(fr, t); return np.asarray(fr.convert('RGB'))
    if FLASH <= t < FLASH + 3 * DT - 1e-6:                    # 1 white frame, 2 black frames; HUD stays on top
        col = (206, 182, 148, 255) if t < FLASH + DT - 1e-6 else (4, 4, 8, 255)   # warm white keeps the HUD readable
        fr = Image.new('RGBA', (W, H), col); hud(fr, t); return np.asarray(fr.convert('RGB'))
    c, i, t0 = camera(t)
    fr, sc = render_scene(t, c); overlays(fr, t, sc, c); hud(fr, t)
    return np.asarray(fr.convert('RGB'))

if __name__ == '__main__':
    os.makedirs('qa', exist_ok=True)
    if sys.argv[1] == 'still':
        for s in sys.argv[2].split(','):
            Image.fromarray(render(float(s))).resize((960, 540)).save(f'qa/v2_{float(s):05.2f}.jpg', quality=84)
    else:
        f0, f1, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
        for i in range(f0, f1): p.stdin.write(render(i / FPS).tobytes())
        p.stdin.close(); p.wait()

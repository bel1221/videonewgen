"""Encounter clip: a player meets a kill-aura hacker, an admin drops in and bans him (Minecraft death).
    python3 tools/encounter.py still 2.0,5.0,7.5     -> qa/enc_XX.XX.jpg
    python3 tools/encounter.py F0 F1 out.mp4         -> frames F0..F1-1 (30 fps)
Run from newgen-ban/. Needs ../newgen-ranked/src/death_keyed.npy and hp_keyed.npy (python3 tools/prep_gs.py there).
"""
import os, sys, math, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mcchar as MC

W, H, FPS = 1920, 1080, 30
TOTAL = 10.0
TK = os.environ.get('NEWGEN_TOOLKIT', os.path.abspath('../toolkit'))
FM = TK + '/fonts/Montserrat-ExtraBold.ttf'; FI = TK + '/fonts/Inter-Variable.ttf'
WHITE = (245, 247, 250); GREEN = (112, 222, 132); ORANGE = (255, 164, 104); RED = (255, 92, 96); INK = (5, 18, 22); MUTED = (232, 238, 240)

# ------------------------------------------------------------------ timeline
T_WALK = (0.0, 1.2)
T_TP = 1.0                     # hacker glitches in
T_AURA = (1.4, 4.4)            # kill-aura spin
HITS = [1.85, 2.3, 2.72, 3.12, 3.5, 3.88]
HEARTS = [10, 8, 7, 5, 4, 3, 2]  # player hearts before/after each hit
T_CHIP1, T_CHIP2 = 1.95, 2.55  # "KILL AURA", "REACH"
T_REC = 3.0
T_BEAM = 4.45; T_LAND = 5.0    # admin
T_CHAT1 = 5.45; T_CHAT2 = 6.55
T_BAN = 6.6; T_FALL = (6.85, 7.3); T_POOF = 7.32; T_STAMP = 7.75
HACKER = 'xX_H4ck3r_Xx'

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def eio(x): x = clamp(x); return 3 * x * x - 2 * x ** 3
def bo(x): x = clamp(x); c1 = 1.70158; c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2

# ------------------------------------------------------------------ assets
_fc = {}
def font(p, s, var=None):
    k = (p, s, var)
    if k not in _fc:
        f = ImageFont.truetype(p, s)
        if var:
            try: f.set_variation_by_name(var)
            except Exception: f.set_variation_by_name(var.encode())
        _fc[k] = f
    return _fc[k]

def runs(parts, fp, size, var=None, shadow=True):
    """Coloured text runs [(text, col), ...] on one shared baseline, with the house soft drop shadow."""
    f = font(fp, size, var); asc, desc = f.getmetrics()
    w = int(sum(f.getlength(t) for t, _ in parts)) + 24; h = asc + desc + 24
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im); x = 12
    for t, c in parts: d.text((x, 12 + asc), t, font=f, fill=c + (255,), anchor='ls'); x += f.getlength(t)
    if not shadow: return im
    a = im.getchannel('A'); sh = a.filter(ImageFilter.GaussianBlur(max(2, size * 0.06))).point(lambda v: int(v * 0.7))
    off = max(1, size // 30); out = Image.new('RGBA', (w, h + off), (0, 0, 0, 0))
    out.paste(Image.new('RGBA', (w, h), (8, 6, 12, 255)), (0, off), sh); out.alpha_composite(im)
    return out

def tl(text, fp, size, col, var=None, shadow=True): return runs([(text, col)], fp, size, var, shadow)

def _bg():
    src = Image.open('../newgen-ranked/src/map_castle.png').convert('RGB').resize((W + 192, H + 108), Image.LANCZOS).filter(ImageFilter.GaussianBlur(14))
    b = np.asarray(src).astype(np.float32)
    yy, xx = np.mgrid[0:H + 108, 0:W + 192].astype(np.float32)
    vg = np.sqrt(((xx - (W + 192) / 2) / ((W + 192) / 2)) ** 2 + ((yy - (H + 108) / 2) / ((H + 108) / 2)) ** 2)
    b = b * (0.62 - 0.26 * np.clip(vg - 0.3, 0, 1))[..., None]
    b = b * 0.9 + np.array([8, 6, 14], np.float32)
    return Image.fromarray(np.clip(b, 0, 255).astype(np.uint8))
BGP = _bg()

HP = np.load('../newgen-ranked/src/hp_keyed.npy', mmap_mode='r')        # (n, h, 560, 4) hearts 10 -> 0
DEATH = np.load('../newgen-ranked/src/death_keyed.npy', mmap_mode='r')  # (n, 440, 440, 4)
_HT = {10: 0, 9: 1, 8: 2, 7: 3, 6: 4, 5: 5.4, 4: 7, 3: 8, 2: 9, 1: 10, 0: 11}
def hp_img(hearts_from, hearts_to, u, width):
    a, b = _HT[hearts_from], _HT[hearts_to]; ct = a + (b - a) * eo(u)
    fr = HP[min(len(HP) - 1, int(ct * 30))]; im = Image.fromarray(np.asarray(fr))
    return im.resize((width, int(width * im.height / im.width)), Image.NEAREST)

_sh = Image.new('L', (400, 140), 0); ImageDraw.Draw(_sh).ellipse((40, 30, 360, 110), fill=255)
SHADOW = _sh.filter(ImageFilter.GaussianBlur(16))
def shadow(fr, x, y, w, a):
    m = SHADOW.resize((int(w * 2.5), int(w * 2.5 * 0.35)), Image.BILINEAR).point(lambda v: int(v * a))
    fr.alpha_composite(Image.merge('RGBA', [Image.new('L', m.size, 0)] * 3 + [m]), (int(x - m.width / 2), int(y - m.height / 2)))

def warn_icon(size, col):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.polygon([(size / 2, 2), (size - 2, size - 3), (2, size - 3)], fill=col + (255,))
    w = max(3, size // 9); d.rectangle((size / 2 - w / 2, size * 0.36, size / 2 + w / 2, size * 0.66), fill=(20, 10, 14, 255))
    d.rectangle((size / 2 - w / 2, size * 0.74, size / 2 + w / 2, size * 0.74 + w), fill=(20, 10, 14, 255))
    return im

SKINS = {}
for k in ('player', 'hacker', 'admin'):
    p = f'src/skins/{k}.png'
    SKINS[k] = np.asarray(Image.open(p).convert('RGBA')) if os.path.exists(p) else MC.make_skin(k)
WP = MC.weapon_quads('Aegisblade'); WH = MC.weapon_quads('Veilblade')

# ------------------------------------------------------------------ poses
def walk(t, speed=7.0, amp=32):
    s = math.sin(t * speed); return dict(rarm=amp * 0.7 * s, larm=-amp * 0.7 * s, rleg=-amp * s, lleg=amp * s)

def hit_state(t):
    """index of hits landed, time since last hit."""
    n = sum(1 for h in HITS if t >= h); last = max([h for h in HITS if t >= h], default=-9)
    return n, t - last

def player_pose(t):
    u = eo((t - T_WALK[0]) / (T_WALK[1] - T_WALK[0]))
    x = -70 + (70 - 24) * u
    p = dict(pos=[x, 0, 6], yaw=72, head_yaw=0, rarm=25, larm=-8, rleg=0, lleg=0)
    if t < T_WALK[1]:
        p.update(walk(t)); p['rarm'] += 20
    n, dt = hit_state(t)
    kb = sum(2.2 * eo((t - h) / 0.25) for h in HITS if t >= h)          # knockback, accumulates
    p['pos'][0] -= kb
    if n and dt < 0.3:
        p['tint'] = ((255, 40, 40), 0.45 * (1 - dt / 0.3)); p['lean'] = -8 * (1 - dt / 0.3)
    if T_AURA[0] < t < T_LAND + 0.5:
        p['rarm'] = 70; p['larm'] = 30                                        # guard up
    if t > T_STAMP:
        r = eo((t - T_STAMP) / 0.6); p['rarm'] = 70 - 50 * r; p['larm'] = 30 - 35 * r; p['head_yaw'] = -30 * r
    p['pos'] = tuple(p['pos'])
    return p

def hacker_pose(t):
    p = dict(pos=[34, 0, 6], yaw=-72, rarm=20, larm=-10, rleg=0, lleg=0)
    if T_AURA[0] <= t < T_AURA[1]:
        lt = t - T_AURA[0]; p['yaw'] = -72 + 1080 * lt                        # kill-aura spin
        p['rarm'] = 80 + 50 * math.sin(lt * 22); p['larm'] = 20; p['pos'][1] = 1.5 * abs(math.sin(lt * 9))
    elif t >= T_AURA[1]:
        p['yaw'] = -72 - 75 * eo((t - T_LAND - 0.15) / 0.35)                  # turns to the admin
    if t >= T_BAN:
        dt = t - T_BAN
        if dt < 0.35: p['tint'] = ((255, 30, 30), 0.5 if int(dt * 20) % 2 == 0 else 0.25)
        else: p['tint'] = ((255, 30, 30), 0.45)
        p['pos'][0] += 7 * eo(dt / 0.3)
        p['roll'] = -90 * eio((t - T_FALL[0]) / (T_FALL[1] - T_FALL[0]))      # Minecraft death tip-over
        p['rarm'] = 20; p['larm'] = -10
    p['pos'] = tuple(p['pos'])
    return p

def admin_pose(t):
    y = 70 * (1 - bo((t - T_BEAM - 0.05) / (T_LAND - T_BEAM - 0.05))) if t < T_LAND else 0.0
    p = dict(pos=(0, y, -26), yaw=0, head_yaw=0, rarm=0, larm=0, rleg=0, lleg=0)
    if t < T_LAND: p.update(rarm=-160, larm=-160)                             # arms up while descending
    else:
        r = eo((t - T_LAND) / 0.3); p.update(rarm=-160 * (1 - r), larm=-160 * (1 - r))
        p['head_yaw'] = -40 * eo((t - T_LAND - 0.2) / 0.3); p['yaw'] = -25 * eo((t - T_LAND - 0.2) / 0.4)
    if T_CHAT1 + 0.6 < t < T_STAMP + 0.4:
        p['rarm'] = 95; p['yaw'] = -35                                        # points at the hacker
    if t >= T_STAMP + 0.4:
        r = eo((t - T_STAMP - 0.4) / 0.5); p['rarm'] = 95 * (1 - r); p['yaw'] = -35 * (1 - r); p['head_yaw'] = -40 * (1 - r)
    return p

def hacker_visible(t): return T_TP <= t < T_POOF + 0.05

# ------------------------------------------------------------------ particles (deterministic)
def crits(t):
    out = []
    for i, h in enumerate(HITS):
        dt = t - h
        if not (0 <= dt < 0.55): continue
        rs = np.random.RandomState(100 + i)
        for k in range(14):
            vx, vy = rs.uniform(-260, 260), rs.uniform(-420, -120); s = rs.uniform(6, 13)
            out.append((vx * dt, vy * dt + 700 * dt * dt, s, 1 - dt / 0.55, (255, 255, 255) if k % 3 else (120, 210, 255)))
    return out

def dust(t):
    dt = t - T_LAND; out = []
    if not (0 <= dt < 0.8): return out
    rs = np.random.RandomState(7)
    for k in range(22):
        ang = rs.uniform(math.pi * 0.95, math.pi * 2.05); sp = rs.uniform(160, 420); s = rs.uniform(7, 15)
        out.append((math.cos(ang) * sp * dt, -abs(math.sin(ang)) * sp * dt * 0.5 + 120 * dt * dt, s, 1 - dt / 0.8, (236, 226, 210)))
    return out

# ------------------------------------------------------------------ frame
def shake(t):
    a = 0.0
    for t0, amp in [(T_LAND, 16), (T_BAN, 8), (T_STAMP, 12)] + [(h, 5) for h in HITS]:
        dt = t - t0
        if 0 <= dt < 0.3: a = max(a, amp * (1 - dt / 0.3))
    return a * math.sin(t * 90), a * math.cos(t * 77)

def glitch(im, t):
    """RGB split + slice jitter while the hacker teleports in."""
    u = (t - T_TP) / 0.35
    if not (0 <= u < 1): return im
    a = np.asarray(im).copy(); k = int(24 * (1 - u)); rs = np.random.RandomState(int(t * 100))
    out = a.copy(); out[..., 0] = np.roll(a[..., 0], k, 1); out[..., 2] = np.roll(a[..., 2], -k, 1)
    for _ in range(6):
        y = rs.randint(0, a.shape[0] - 20); hgt = rs.randint(6, 24); out[y:y + hgt] = np.roll(out[y:y + hgt], rs.randint(-40, 40), 1)
    out[..., 3] = (out[..., 3].astype(np.float32) * clamp(u * 2.5)).astype(np.uint8)
    return Image.fromarray(out)

def render(t):
    zoom = 1.0 + 0.045 * t / TOTAL; sx, sy = shake(t)
    ox = 96 + 60 * math.sin(t * 0.25); oy = 54 + 26 * math.cos(t * 0.2)
    fr = BGP.crop((int(ox), int(oy), int(ox) + W, int(oy) + H)).convert('RGBA')
    d = ImageDraw.Draw(fr, 'RGBA')
    scale = 13.0 * zoom; cx, cy = W / 2 + sx - 14 * (t / TOTAL - 0.5), H * 0.56 + sy
    def mk(): return MC.Scene(W, H, scale, cam_yaw=0, cam_pitch=10, center=(0, 16, 0), screen=(cx, cy))

    # admin light beam (soft, behind everyone)
    if T_BEAM <= t < T_LAND + 0.9:
        sc = mk(); bx, _, _ = sc.proj(np.array([0, 0, -26.0]))
        a = eo((t - T_BEAM) / 0.2) * (1 - eo((t - T_LAND - 0.1) / 0.8))
        beam = Image.new('RGBA', (260, H), (0, 0, 0, 0)); bd = ImageDraw.Draw(beam)
        for i in range(130):
            al = int(a * 120 * (1 - i / 130) ** 2); bd.line([(130 - i, 0), (130 - i, H)], fill=(255, 238, 196, al)); bd.line([(130 + i, 0), (130 + i, H)], fill=(255, 238, 196, al))
        fr.alpha_composite(beam, (int(bx - 130), 0))

    # ground shadows
    sc = mk(); poses = [('player', player_pose(t))]
    if t >= T_BEAM: poses.append(('admin', admin_pose(t)))
    if hacker_visible(t): poses.append(('hacker', hacker_pose(t)))
    for k, p in poses:
        gx, gy, _ = sc.proj(np.array([p['pos'][0], 0, p['pos'][2]], float)); air = p['pos'][1]
        rw = 120 * max(0.35, 1 - air / 80); rh = rw * 0.22
        if k == 'hacker' and t >= T_POOF: continue
        shadow(fr, gx, gy, rw, 0.55 * max(0.3, 1 - air / 80))

    # characters
    sc.add(MC.char_quads(SKINS['player'], player_pose(t), WP))
    if t >= T_BEAM: sc.add(MC.char_quads(SKINS['admin'], admin_pose(t)))
    glitching = 0 <= t - T_TP < 0.35
    if hacker_visible(t) and not glitching: sc.add(MC.char_quads(SKINS['hacker'], hacker_pose(t), WH))
    fr.alpha_composite(Image.fromarray(sc.render()))
    if glitching:
        hs = mk(); hs.add(MC.char_quads(SKINS['hacker'], hacker_pose(t), WH)); fr.alpha_composite(glitch(Image.fromarray(hs.render()), t))

    def head_xy(p, k):
        if k == 'hacker' and p.get('roll'): return None
        x, y, _ = sc.proj(np.array([p['pos'][0], p['pos'][1] + 37, p['pos'][2]], float)); return x, y

    # crit particles from the player's chest
    px, py, _ = sc.proj(np.array([player_pose(t)['pos'][0], 20, 6.0]))
    for dx, dy, s, a, col in crits(t):
        d.rectangle((px + dx - s / 2, py + dy - s / 2, px + dx + s / 2, py + dy + s / 2), fill=col + (int(230 * a),))
    ax, ay, _ = sc.proj(np.array([0, 0, -26.0]))
    for dx, dy, s, a, col in dust(t):
        d.rectangle((ax + dx - s / 2, ay + dy - s / 2, ax + dx + s / 2, ay + dy + s / 2), fill=col + (int(200 * a),))

    # nametags (Minecraft style: dark plate, white name)
    def nametag(k, p, parts, alpha=1.0):
        xy = head_xy(p, k)
        if not xy: return
        L = runs(parts, FI, 30, 'Bold'); x, y = xy
        plate = Image.new('RGBA', (L.width - 4, L.height - 10), (0, 0, 0, int(120 * alpha)))
        fr.alpha_composite(plate, (int(x - plate.width / 2), int(y - plate.height)))
        if alpha < 1: L.putalpha(L.getchannel('A').point(lambda v: int(v * alpha)))
        fr.alpha_composite(L, (int(x - L.width / 2), int(y - L.height + 2)))
    pp = player_pose(t); nametag('player', pp, [('Bạn', WHITE)])
    if t >= T_BEAM: nametag('admin', admin_pose(t), [('[ADMIN] ', ORANGE), ('NewGen', WHITE)])
    if hacker_visible(t) and t >= T_TP + 0.25: nametag('hacker', hacker_pose(t), [(HACKER, WHITE)])

    # player hearts above the nametag
    n, dt = hit_state(t)
    hx, hy = head_xy(pp, 'player')
    hi = hp_img(HEARTS[max(0, n - 1)] if n else 10, HEARTS[n], dt / 0.4 if n else 1, 300)
    fr.alpha_composite(hi, (int(hx - hi.width / 2), int(hy - 58 - hi.height)))

    # hack chips near the hacker
    if hacker_visible(t):
        hp_ = hacker_pose(t); hx2, hy2, _ = sc.proj(np.array([hp_['pos'][0], 30, hp_['pos'][2]], float))
        for i, (t0, label) in enumerate([(T_CHIP1, 'KILL AURA'), (T_CHIP2, 'REACH')]):
            if t < t0 or t > T_BAN: continue
            u = bo((t - t0) / 0.3); L = tl(label, FM, 40, WHITE); ic = warn_icon(34, ORANGE)
            pill = Image.new('RGBA', (L.width + 56, L.height + 4), (0, 0, 0, 0))
            ImageDraw.Draw(pill).rounded_rectangle((6, 6, pill.width - 6, pill.height - 6), 22, fill=(20, 10, 14, 170), outline=ORANGE + (255,), width=3)
            pill.alpha_composite(ic, (24, (pill.height - 34) // 2)); pill.alpha_composite(L, (50, 2)); s = max(0.05, u)
            pill = pill.resize((max(1, int(pill.width * s)), max(1, int(pill.height * s))), Image.LANCZOS)
            fr.alpha_composite(pill, (int(hx2 + 150), int(hy2 - 20 + i * 86 - pill.height / 2)))

    # REC indicator (the player is recording)
    if t >= T_REC:
        a = eo((t - T_REC) / 0.3); dot = 1.0 if int((t - T_REC) * 2) % 2 == 0 else 0.35
        d.ellipse((64, 104, 92, 132), fill=RED + (int(255 * a * dot),))
        sec = int(t - T_REC); L = runs([('REC ', WHITE), (f'00:0{min(9, sec)}', WHITE)], FI, 30, 'Bold')
        L.putalpha(L.getchannel('A').point(lambda v: int(v * a))); fr.alpha_composite(L, (98, 96))

    # chat box
    if t >= T_CHAT1:
        cmd = f'/ban {HACKER} Hack'; nch = int(clamp((t - T_CHAT1 - 0.15) / 0.75) * len(cmd))
        lines = [[('[ADMIN] ', ORANGE), ('NewGen: ', WHITE), (cmd[:nch] + ('_' if nch < len(cmd) and int(t * 6) % 2 else ''), WHITE)]]
        if t >= T_CHAT2: lines.append([(HACKER, RED), (' đã bị ', WHITE), ('BAN VĨNH VIỄN', ORANGE)])
        ls = [runs(l, FI, 32, 'SemiBold') for l in lines]
        bw = max(l.width for l in ls) + 20; bh = sum(l.height - 8 for l in ls) + 16
        a = eo((t - T_CHAT1) / 0.2); x0, y0 = 60, H - 120 - bh
        fr.alpha_composite(Image.new('RGBA', (bw, bh), (0, 0, 0, int(140 * a))), (x0, y0)); y = y0 + 4
        for l in ls: fr.alpha_composite(l, (x0 + 6, y)); y += l.height - 8

    # death puff (the user's Minecraft death-particle green screen)
    if T_POOF <= t < T_POOF + 1.4:
        k = 16 + int((t - T_POOF) * 30)
        if k < len(DEATH):
            hp_ = hacker_pose(T_FALL[1]); px2, py2, _ = sc.proj(np.array([hp_['pos'][0], 6, hp_['pos'][2]], float))
            im = Image.fromarray(np.asarray(DEATH[k])).resize((620, 620), Image.BILINEAR)
            fr.alpha_composite(im, (int(px2 - 310), int(py2 - 360)))

    # BANNED stamp
    if t >= T_STAMP:
        u = (t - T_STAMP) / 0.18; s = 1.6 - 0.6 * eo(u)
        L = tl('BANNED', FM, 132, RED); L2 = tl('VĨNH VIỄN', FI, 40, WHITE, 'Bold')
        st = Image.new('RGBA', (L.width + 60, L.height + L2.height + 40), (0, 0, 0, 0)); sd = ImageDraw.Draw(st)
        sd.rounded_rectangle((8, 8, st.width - 8, st.height - 8), 26, fill=(30, 6, 10, 150), outline=RED + (255,), width=8)
        st.alpha_composite(L, (30, 12)); st.alpha_composite(L2, ((st.width - L2.width) // 2, L.height + 2))
        st = st.resize((int(st.width * s), int(st.height * s)), Image.LANCZOS).rotate(8, expand=True, resample=Image.BICUBIC)
        a = clamp(u * 3); st.putalpha(st.getchannel('A').point(lambda v: int(v * a)))
        hp_ = hacker_pose(T_FALL[1]); px2, py2, _ = sc.proj(np.array([hp_['pos'][0] - 4, 30, hp_['pos'][2]], float))
        fr.alpha_composite(st, (int(px2 - st.width / 2), int(py2 - st.height / 2)))

    # HUD
    hud(fr, t)
    return np.asarray(fr.convert('RGB'))

def hud(fr, t):
    d = ImageDraw.Draw(fr, 'RGBA')
    fr.alpha_composite(tl('NEWGENMC', FM, 22, WHITE), (60, 32))
    l = tl('newgenmc.net', FI, 22, MUTED, 'Medium'); fr.alpha_composite(l, (W - 60 - l.width, 34))
    num, name = ('01', 'HACKER?') if t < T_BEAM else ('03', 'REPORT')
    fr.alpha_composite(tl(num, FI, 22, GREEN, 'Bold'), (60, H - 88)); fr.alpha_composite(tl('— ' + name, FI, 22, MUTED, 'SemiBold'), (104, H - 88))
    d.rectangle((W - 360, H - 62, W - 60, H - 60), fill=(255, 255, 255, 40)); d.rectangle((W - 360, H - 62, W - 360 + 300 * t / TOTAL, H - 60), fill=GREEN + (220,))

if __name__ == '__main__':
    os.makedirs('qa', exist_ok=True)
    if sys.argv[1] == 'still':
        for s in sys.argv[2].split(','):
            Image.fromarray(render(float(s))).resize((960, 540)).save(f'qa/enc_{float(s):05.2f}.jpg', quality=84)
    else:
        f0, f1, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
        for i in range(f0, f1): p.stdin.write(render(i / FPS).tobytes())
        p.stdin.close(); p.wait()

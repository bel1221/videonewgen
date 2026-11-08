# NewGen showcase - clean motion graphics. python3 tools/mg.py F0 F1 out.mp4 | still t1,..
import os, sys, json, math, random, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W, H, FPS = 1920, 1080, 30
TOTAL = 71.5
exec(open('tools/timing.py').read())
WHITE = (245, 247, 250); GREEN = (112, 222, 132); ORANGE = (255, 164, 104); MUTED = (232, 238, 240); RED = (255, 92, 96); NAVY = (4, 22, 26); INK = (5, 18, 22)
def clamp(x, a=0.0, b=1.0): return a if x < a else b if x > b else x
def ex(x): x = clamp(x); return 1 - 2 ** (-10 * x) if x < 1 else 1.0
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def eio(x): x = clamp(x); return 3 * x * x - 2 * x ** 3
def bo(x): x = clamp(x); c1 = 1.5; c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
def lerp(a, b, x): return a + (b - a) * x
FM = os.environ.get('NEWGEN_TOOLKIT', os.path.abspath('../toolkit')) + '/fonts/Montserrat-ExtraBold.ttf'
import os
FI = os.environ.get('NEWGEN_TOOLKIT', os.path.abspath('../toolkit')) + '/fonts/Inter-Variable.ttf'
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
_tl = {}
def tl(s, p=FM, size=100, fill=WHITE, track=0, var=None):
    k = (s, p, size, fill, track, var)
    if k in _tl: return _tl[k]
    f = font(p, size, var); asc, desc = f.getmetrics()
    wds = [f.getlength(c) + track for c in s]; w = int(sum(wds) - track) + 20; h = asc + desc + 16
    im = Image.new('RGBA', (max(w, 1), h), (0, 0, 0, 0)); d = ImageDraw.Draw(im); x = 10
    for c, cw in zip(s, wds): d.text((x, 8), c, font=f, fill=fill); x += cw
    sh = im.getchannel('A').filter(ImageFilter.GaussianBlur(max(2, size * 0.06))).point(lambda v: int(v * 0.7))
    base = Image.new('RGBA', im.size, (0, 0, 0, 0)); blk = Image.new('RGBA', im.size, (8, 6, 12, 255)); blk.putalpha(sh)
    base.alpha_composite(blk, (0, max(1, size // 30))); base.alpha_composite(im); im = base
    _tl[k] = im; return im
def fit(s, p, size, maxw, track=0, var=None):
    w = tl(s, p, size, WHITE, track, var).width
    return size if w <= maxw else int(size * maxw / w)

# background
LW, LH = 480, 270
yy, xx = np.mgrid[0:LH, 0:LW].astype(np.float32)
# teal / orange complementary scheme built from the logo colours
_u = (xx / LW * 0.6 + yy / LH * 0.4)
_top = np.array([7, 40, 44], np.float32); _bot = np.array([3, 15, 20], np.float32)
BASE = _top * (1 - _u[..., None]) + _bot * _u[..., None]
rr = np.sqrt(((xx - LW * 0.42) / LW) ** 2 + ((yy - LH * 0.45) / LH) ** 2)
BASE += np.array([10, 34, 34], np.float32) * np.clip(1 - rr * 1.6, 0, 1)[..., None]
_vig = np.clip(1 - (np.sqrt(((xx - LW / 2) / (LW / 2)) ** 2 + ((yy - LH / 2) / (LH / 2)) ** 2) - 0.6) * 0.55, 0.55, 1)
BASE *= _vig[..., None]
def _blob(r):
    y, x = np.mgrid[-r:r, -r:r].astype(np.float32); return np.exp(-((x * x + y * y) / (r * r)) * 4.6)
BLOB = _blob(150)
ORBS = [((80, 220, 140), 0.16, 0.18, 0.40, 0.05, 0.0), ((255, 138, 64), 0.86, 0.86, 0.55, 0.06, 2.0), ((255, 170, 90), 0.58, 0.04, 0.16, 0.04, 4.0), ((40, 190, 190), 0.50, 0.55, 0.14, 0.03, 1.0)]
# faint block grid (Minecraft feel), masked to fade toward centre
_gm = np.zeros((H, W), np.float32)
for gx in range(0, W, 96): _gm[:, gx] = 1
for gy in range(0, H, 96): _gm[gy, :] = 1
_y, _x = np.mgrid[0:H, 0:W].astype(np.float32)
_mask = np.clip((np.sqrt(((_x - W / 2) / (W / 2)) ** 2 + ((_y - H / 2) / (H / 2)) ** 2) - 0.55) * 1.3, 0, 1)
GRID = (_gm * _mask * 10).astype(np.float32)
del _y, _x, _mask, _gm
CUR_T = 0.0

_bgsrc = Image.open('src/background.jpg').convert('RGB').resize((W + 192, H + 108), Image.LANCZOS).filter(ImageFilter.GaussianBlur(16))
_b = np.asarray(_bgsrc).astype(np.float32)
_yy, _xx = np.mgrid[0:H + 108, 0:W + 192].astype(np.float32)
_vg = np.sqrt(((_xx - (W + 192) / 2) / ((W + 192) / 2)) ** 2 + ((_yy - (H + 108) / 2) / ((H + 108) / 2)) ** 2)
_b = _b * (0.7 - 0.24 * np.clip(_vg - 0.35, 0, 1))[..., None]
_b = _b * 0.9 + np.array([10, 4, 14], np.float32)
BGP = Image.fromarray(np.clip(_b, 0, 255).astype(np.uint8))
def _ac(dst, src, x, y):
    w, h = src.size; x0, y0 = max(0, x), max(0, y); x1, y1 = min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0: return
    if (x0, y0, x1, y1) != (x, y, x + w, y + h): src = src.crop((x0 - x, y0 - y, x1 - x, y1 - y))
    dst.alpha_composite(src, (x0, y0))
def xform(L, sc=1.0, dx=0.0, dy=0.0, a=1.0, blur=0.0, mb=0.0):
    if abs(sc - 1) > 1e-4 or abs(dx) > 0.05 or abs(dy) > 0.05 or blur > 0.3 or mb > 0.3:
        P = L.convert('RGBa'); cx, cy = W / 2, H / 2
        if abs(sc - 1) > 1e-4 or abs(dx) > 0.05 or abs(dy) > 0.05:
            P = P.transform((W, H), Image.AFFINE, (1 / sc, 0, cx - (cx + dx) / sc, 0, 1 / sc, cy - (cy + dy) / sc), Image.BILINEAR)
        if mb > 0.3:
            k = 1 + mb; P = P.resize((max(8, int(W / k)), H), Image.BOX).resize((W, H), Image.BILINEAR)
        if blur > 0.3: P = P.filter(ImageFilter.GaussianBlur(blur))
        L = P.convert('RGBA')
    if a < 0.999:
        L.putalpha(L.getchannel('A').point(lambda v: int(v * max(0.0, a))))
    return L
class Frame:
    def __init__(s, t):
        ox = 96 + 70 * math.sin(t * 0.06); oy = 54 + 36 * math.cos(t * 0.045)
        s.bg = BGP.crop((int(ox), int(oy), int(ox) + W, int(oy) + H)).convert('RGBA')
        s.d = ImageDraw.Draw(s.bg, 'RGBA')
        r = random.Random(4)
        for i in range(30):
            sp = 22 + r.random() * 30; x = (r.random() * W + math.sin(t * 0.5 + i) * 40 + t * 12) % W; y = (r.random() * H + t * sp) % H
            z = 2 + r.random() * 3.5; c = (255, int(170 + r.random() * 50), int(200 + r.random() * 40)) if i % 4 else (255, 245, 250)
            s.d.rectangle((x - z, y - z, x + z, y + z), fill=c + (int(90 + r.random() * 90),))
        s.img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); s.amul = 1.0; s.oy = 0
        s.ov = None; s.shake = (0, 0); s.gray = 0.0; s.fade = 0.0; s.flash = 0.0
    def o(s):
        if s.ov is None: s.ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); s.od = ImageDraw.Draw(s.ov)
        return s.od
    def flush(s):
        if s.ov is not None: s.img.alpha_composite(s.ov); s.ov = None
    def paste(s, lay, x, y, a=1.0):
        a *= s.amul
        if a <= 0: return
        if lay.mode != 'RGBA': lay = lay.convert('RGBA')
        if a < 1: lay = lay.copy(); lay.putalpha(lay.getchannel('A').point(lambda v: int(v * a)))
        s.flush(); _ac(s.img, lay, int(x), int(y + s.oy))
    def take(s):
        s.flush(); L = s.img; s.img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); return L
    def compose(s, layers):
        base = s.bg
        for L in layers: base.alpha_composite(L)
        s.img = base
    def hit(s, lt, dur=0.22, amp=12):
        if 0 <= lt < dur:
            k = 1 - lt / dur; r = random.Random(int(lt * 997)); s.shake = (int((r.random() - .5) * 2 * amp * k), int((r.random() - .5) * 2 * amp * k))
    def finish(s):
        s.flush(); arr = np.asarray(s.img.convert('RGB')).astype(np.float32)
        if s.gray > 0: arr = arr * (1 - s.gray) + arr.mean(axis=2, keepdims=True) * s.gray * 0.8
        if s.flash > 0: arr = arr * (1 - s.flash) + 255 * s.flash
        if s.fade > 0: arr = arr * (1 - s.fade)
        arr = np.clip(arr, 0, 255).astype(np.uint8)
        if s.shake != (0, 0): arr = np.roll(arr, s.shake, axis=(1, 0))
        return arr

# ---- typography primitives ----
def reveal(fr, lay, x, y, lt, d=0.6, anchor='mm', a=1.0):
    if lt <= 0: return
    p = ex(lt / d); w, h = lay.size; off = int((1 - p) * h * 0.9)
    x0 = x - w / 2 if anchor[0] == 'm' else x if anchor[0] == 'l' else x - w
    y0 = y - h / 2
    if h - off <= 0: return
    fr.paste(lay.crop((0, 0, w, h - off)), x0, y0 + off, a * clamp(lt / 0.25))
def stagger(fr, s, p, size, fill, cx, cy, lt, step=0.03, track=0, var=None, anchor='m'):
    if lt <= 0: return
    f = font(p, size, var); ws = [f.getlength(c) + track for c in s]; tot = sum(ws) - track
    x = cx - tot / 2 if anchor == 'm' else cx
    for i, c in enumerate(s):
        l2 = lt - i * step
        if l2 > 0 and c != ' ':
            q = eo(l2 / 0.45); lay = tl(c, p, size, fill, 0, var)
            fr.paste(lay, x - 10, cy - lay.height / 2 + (1 - q) * 46, q)
        x += ws[i]
def kicker(fr, s, x, y, lt, col=GREEN, anchor='l'):
    if lt <= 0: return
    lay = tl(s, FI, 26, col, 6, 'SemiBold'); a = clamp(lt / 0.4)
    xx = x if anchor == 'l' else x - lay.width / 2
    w = 40 * eo(lt / 0.5)
    if anchor == 'l':
        fr.o().rectangle((x, y - 2, x + w, y + 2), fill=col + (int(255 * a),)); fr.paste(lay, x + 56 - (1 - eo(lt / 0.5)) * 20, y - lay.height / 2, a)
    else: fr.paste(lay, xx, y - lay.height / 2, a)
def uline(fr, x0, x1, y, p, col=GREEN, w=6):
    if p <= 0: return
    fr.o().rounded_rectangle((x0, y - w / 2, x0 + (x1 - x0) * eo(p), y + w / 2), w // 2, fill=col + (255,))
def pill(fr, s, cx, cy, lt, col=GREEN, fg=INK, size=34):
    if lt <= 0: return
    lay = tl(s, FI, size, fg, 2, 'Bold'); p = bo(lt / 0.45); a = clamp(lt / 0.2)
    w, h = (lay.width + 40) * p, (size + 30) * p
    fr.o().rounded_rectangle((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), int(h / 2), fill=col + (int(255 * a),))
    if p > 0.7: fr.paste(lay, cx - lay.width / 2, cy - lay.height / 2 + 2, clamp((p - 0.7) / 0.3))
def strike(fr, x0, x1, y, p, col=RED):
    if p > 0: fr.o().rounded_rectangle((x0, y - 5, x0 + (x1 - x0) * eo(p), y + 5), 5, fill=col + (235,))

_mask = {}; _shad = {}
def rmask(w, h, r=22):
    k = (w, h, r)
    if k not in _mask: m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255); _mask[k] = m
    return _mask[k]
def shadow(w, h):
    k = (w, h)
    if k not in _shad:
        pad = 60; im = Image.new('RGBA', (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
        ImageDraw.Draw(im).rounded_rectangle((pad, pad + 16, pad + w, pad + h + 16), 22, fill=(0, 0, 0, 150)); _shad[k] = im.filter(ImageFilter.GaussianBlur(22))
    return _shad[k]
SS = {}
def card(fr, key, x, y, w, h, lt, label=None, col=GREEN, zoom=0.07, dx=0.3, dy=0.0, a_out=1.0):
    if lt <= 0: return
    im = SS[key]; p = ex(lt / 0.7); a = clamp(lt / 0.35) * a_out
    sc = lerp(0.94, 1.0, p); w2, h2 = int(w * sc), int(h * sc); x2, y2 = x + (w - w2) / 2, y + (h - h2) / 2 + (1 - p) * 30
    IW, IH = im.size; ar = w / h; cw = min(IW, IH * ar); ch = cw / ar; z = 1 + zoom * 1.4 * clamp(lt / 12); cw /= z; ch /= z
    u = clamp(lt / 12) * 2 - 1; cx = IW / 2 + dx * (IW - cw) / 2 * u; cy = IH / 2 + dy * (IH - ch) / 2 * u
    sm = im.resize((w2, h2), Image.BILINEAR, box=(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)).convert('RGBA')
    sm.putalpha(rmask(w2, h2).point(lambda v: int(v * a)))
    sh = shadow(w2, h2); sh2 = sh.copy(); sh2.putalpha(sh.getchannel('A').point(lambda v: int(v * a)))
    fr.paste(sh2, x2 - 60, y2 - 60); fr.paste(sm, x2, y2)
    fr.o().rounded_rectangle((x2, y2, x2 + w2, y2 + h2), 22, outline=(255, 255, 255, int(40 * a)), width=2)
    if label:
        lay = tl(label, FI, 24, col, 4, 'SemiBold'); fr.paste(lay, x2 + 4, y2 - 44, a)

# ---- sword (Minecraft-style pixel item, original sprite) ----
SWR = ['.............ooo', '............olco', '...........olcdo', '..........olcdo.', '.........olcdo..', '........olcdo...', '.......olcdo....',
       '..oo..olcdo.....', '..ogoolcdo......', '...oggcdo.......', '...ohggo........', '..ohoogo........', '.oho..oo........', 'ohho............', 'ooo.............', '................']
PAL = {'diamond': {'o': (14, 34, 44), 'l': (178, 252, 244), 'c': (64, 214, 204), 'd': (30, 140, 142), 'g': (30, 112, 116), 'h': (112, 78, 44)},
       'gold': {'o': (52, 34, 10), 'l': (255, 252, 190), 'c': (252, 214, 60), 'd': (214, 150, 20), 'g': (180, 120, 20), 'h': (112, 78, 44)}}
SPR = {'diamond': Image.open('src/sw_dia.png').convert('RGBA'), 'neth': Image.open('src/sw_neth.png').convert('RGBA')}
def _mk_sword(kind, ps):
    S = ps * 44; im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    sp = SPR[kind].resize((16 * ps, 16 * ps), Image.NEAREST)
    pos = (int(S / 2 - 2.5 * ps), int(S / 2 - 12.5 * ps))
    al = Image.new('L', (S, S), 0); al.paste(sp.getchannel('A'), pos)
    gl = al.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(ps * 0.9)).point(lambda v: int(v * 0.55))
    glow = Image.new('RGBA', (S, S), (220, 230, 255, 0)); glow.putalpha(gl)
    im = Image.alpha_composite(im, glow); im.paste(sp, pos, sp)
    return im
SWORDS = {}
def sword(fr, px, py, ang, gcol, trail=0.0, dirn=1, sc=0.62):
    kind = 'diamond' if gcol == GREEN else 'neth'; ps = int(36 * sc); k = (kind, ps)
    if k not in SWORDS: SWORDS[k] = _mk_sword(kind, ps)
    b = SWORDS[k]; im = b.rotate(-(ang - 47), resample=Image.BICUBIC)
    if trail > 0:
        od = fr.o(); R0, R1 = 4 * ps, 17.7 * ps
        for j in range(26):
            a2 = math.radians(ang - dirn * j * 2.4); al = int(70 * trail * (1 - j / 26))
            x0, y0 = px + math.sin(a2) * R0, py - math.cos(a2) * R0; x1, y1 = px + math.sin(a2) * R1, py - math.cos(a2) * R1
            col = (170, 250, 240) if kind == 'diamond' else (210, 180, 220)
            od.line([(x0, y0), (x1, y1)], fill=col + (al,), width=int(16 * (1 - j / 26)) + 3)
    fr.paste(im, px - im.width / 2, py - im.height / 2)
def swing(fr, px, py, t, t0, a0, a1, gcol, dur=0.32, sc=0.62):
    lt = t - t0
    if lt < 0: ang = a0 + math.sin(t * 2.5) * 3; tr = 0
    else:
        p = eo(lt / dur); ang = lerp(a0, a1, p) + (math.sin(lt * 14) * 6 * math.exp(-lt * 6) if lt > dur else 0)
        tr = 1 - clamp((lt - dur) / 0.35)
    sword(fr, px, py, ang, gcol, tr, 1 if a1 > a0 else -1, sc)
def spark(fr, cx, cy, lt, n=14, life=0.6, R=260, seed=1):
    if lt < 0 or lt > life: return
    od = fr.o(); r = random.Random(seed); k = lt / life
    rad = 30 + 360 * eo(k); od.ellipse((cx - rad, cy - rad, cx + rad, cy + rad), outline=(255, 255, 255, int(200 * (1 - k))), width=max(1, int(8 * (1 - k))))
    for i in range(n):
        ang = r.random() * 6.283; l0 = R * 0.3 * eo(k) + 20; l1 = R * (0.6 + 0.5 * r.random()) * eo(min(1, k * 1.6))
        col = (255, 236, 180) if i % 2 else (255, 255, 255)
        od.line([(cx + math.cos(ang) * l0, cy + math.sin(ang) * l0), (cx + math.cos(ang) * l1, cy + math.sin(ang) * l1)], fill=col + (int(255 * (1 - k)),), width=4)
def slash(fr, x0, y0, x1, y1, lt, dur=0.35):
    if lt < 0 or lt > dur + 0.3: return
    p = eo(lt / dur); a = 1 - clamp((lt - dur) / 0.3); od = fr.o()
    xe, ye = lerp(x0, x1, p), lerp(y0, y1, p); xs, ys = lerp(x0, x1, clamp(p - 0.35)), lerp(y0, y1, clamp(p - 0.35))
    od.line([(xs, ys), (xe, ye)], fill=(255, 255, 255, int(230 * a)), width=8); od.line([(xs, ys), (xe, ye)], fill=(255, 255, 255, int(70 * a)), width=26)

LOGO = Image.open('src/img3.png').convert('RGBA')
_lg = {}
def logo(w):
    if w not in _lg: _lg[w] = LOGO.resize((w, int(LOGO.height * w / LOGO.width)), Image.LANCZOS)
    return _lg[w]
for k in ('graph_blur', 'map_castle', 'map_lobby', 'map_canyon', 'lb_kills', 'lb_champ', 'lb_wins', 'legend1', 'legend2', 'lb_mr'):
    SS[k] = Image.open(f'src/{k}.png').convert('RGB')

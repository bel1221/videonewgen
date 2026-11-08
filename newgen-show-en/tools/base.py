# NewGen "money" test - cartoony pixel style. python3 tools/px.py F0 F1 out.mp4 | still t1,t2
import sys, json, math, random, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
W, H, FPS = 1920, 1080, 30
TOTAL = 91.0
BG1 = (27, 20, 64); BG2 = (33, 25, 78); OUT = (22, 14, 44); GOLD = (255, 204, 51); GOLD2 = (214, 140, 20)
LIME = (212, 250, 40); PINK = (255, 110, 160); CREAM = (255, 247, 225); RED = (255, 84, 84); SKY = (110, 200, 255)
WHITE = (255, 255, 255); GREEN = (96, 205, 96); DGREEN = (30, 110, 50); GREY = (150, 140, 190)
def clamp(x, a=0.0, b=1.0): return a if x < a else b if x > b else x
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def eio(x): x = clamp(x); return 3 * x * x - 2 * x ** 3
def lerp(a, b, x): return a + (b - a) * x
def bo(x):
    x = clamp(x); c1 = 1.9; c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2

_bf = {}
def bfont(sz):
    if sz not in _bf:
        f = ImageFont.truetype('fonts/Baloo2.ttf', sz)
        try: f.set_variation_by_name('ExtraBold')
        except Exception: f.set_variation_by_name(b'ExtraBold')
        _bf[sz] = f
    return _bf[sz]
_vf = {}
def vfont(sz):
    if sz not in _vf: _vf[sz] = ImageFont.truetype('fonts/VT323-Regular.ttf', sz)
    return _vf[sz]

_pt = {}
def ptext(s, size, fill=GOLD, px=4, outline=OUT):
    k = (s, size, fill, px, outline)
    if k in _pt: return _pt[k]
    sm = max(8, int(size / px)); f = bfont(sm); sw = max(1, round(sm * 0.09)); sh = max(1, round(sm * 0.08))
    bb = f.getbbox(s, stroke_width=sw)
    w, h = bb[2] - bb[0] + sw * 2 + sh + 4, bb[3] - bb[1] + sw * 2 + sh + 4
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    ox, oy = sw + 2 - bb[0], sw + 2 - bb[1]
    d.text((ox + sh, oy + sh), s, font=f, fill=outline, stroke_width=sw, stroke_fill=outline)
    d.text((ox, oy), s, font=f, fill=fill, stroke_width=sw, stroke_fill=outline)
    a = np.asarray(im).copy(); a[..., 3] = np.where(a[..., 3] > 110, 255, 0)
    im = Image.fromarray(a, 'RGBA').resize((w * px, h * px), Image.NEAREST)
    _pt[k] = im; return im

def spr_from(rows, cmap, sc):
    h, w = len(rows), len(rows[0]); a = np.zeros((h, w, 4), np.uint8)
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c in cmap: a[y, x, :3] = cmap[c]; a[y, x, 3] = 255
    return Image.fromarray(a, 'RGBA').resize((w * sc, h * sc), Image.NEAREST)
def coin_spr(sc=6):
    n = 12; a = np.zeros((n, n, 4), np.uint8)
    for y in range(n):
        for x in range(n):
            d = math.hypot(x - 5.5, y - 5.5)
            if d < 6: a[y, x] = (*OUT, 255)
            if d < 5: a[y, x] = (*GOLD2, 255)
            if d < 4: a[y, x] = (*GOLD, 255)
    for (x, y) in ((3, 3), (4, 3), (3, 4)): a[y, x] = (255, 250, 200, 255)
    for y in range(4, 8): a[y, 6] = (*GOLD2, 255)
    return Image.fromarray(a, 'RGBA').resize((n * sc, n * sc), Image.NEAREST)
def bill_spr(sc=6):
    w, h = 18, 10; a = np.zeros((h, w, 4), np.uint8); a[:] = (*OUT, 255)
    a[1:-1, 1:-1] = (*DGREEN, 255); a[2:-2, 2:-2] = (*GREEN, 255)
    for y in range(h):
        for x in range(w):
            if math.hypot(x - 8.5, y - 4.5) < 2.3: a[y, x] = (*DGREEN, 255)
    a[3, 3] = a[6, 14] = (190, 245, 160, 255)
    return Image.fromarray(a, 'RGBA').resize((w * sc, h * sc), Image.NEAREST)
STAR = ['..x..', '..x..', 'xxXxx', '..x..', '..x..']
HEART = ['.xx.xx.', 'xwxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...']
CROWN = ['x...x...x', 'xx.xxx.xx', 'xxxxxxxxx', 'xxxxxxxxx', 'xrxbxrxbx', 'xxxxxxxxx']
GEAR = ['...xxx...', '.x.xxx.x.', '.xxxxxxx.', 'xxxx.xxxx', 'xxx...xxx', 'xxxx.xxxx', '.xxxxxxx.', '.x.xxx.x.', '...xxx...']
MEGA = ['........xx', '......xxxx', 'xx..xxxxxx', 'xxxxxxxxxx', 'xx..xxxxxx', '......xxxx', '........xx']
SWORD = ['.......xx', '......xwx', '.....xwx.', '....xwx..', '.y.xwx...', '..yxx....', '..yy.....', '.y..y....', 'y........']
CHECK = ['........x', '.......xx', 'x.....xx.', 'xx...xx..', '.xx.xx...', '..xxx....', '...x.....']
ARROW = ['...x...', '..xxx..', '.xxxxx.', 'xxxxxxx', '..xxx..', '..xxx..', '..xxx..', '..xxx..']
WING = ['......xx', '....xxxw', '..xxxxw.', 'xxxxxw..', 'xxxww...', '.xww....']
_sp = {}
def S(name, sc, col=None):
    k = (name, sc, col)
    if k in _sp: return _sp[k]
    if name == 'coin': im = coin_spr(sc)
    elif name == 'bill': im = bill_spr(sc)
    else:
        rows = {'star': STAR, 'heart': HEART, 'crown': CROWN, 'gear': GEAR, 'mega': MEGA, 'sword': SWORD, 'check': CHECK, 'arrow': ARROW, 'wing': WING}[name]
        c = col or GOLD
        cmap = {'x': c, 'X': WHITE, 'w': WHITE, 'y': GOLD2, 'r': RED, 'b': SKY}
        im = spr_from(rows, cmap, sc)
    _sp[k] = im; return im
def outline_spr(im, k=1):
    a = np.asarray(im)[..., 3] > 0; o = a.copy()
    for dy in range(-k * 6, k * 6 + 1, 6):
        for dx in range(-k * 6, k * 6 + 1, 6): o |= np.roll(np.roll(a, dy, 0), dx, 1)
    return o

# images
def _load(p): return Image.open(p).convert('RGBA')
LOGO_ICON = _load('src/img2.png'); LOGO_WM = _load('src/img1.png'); LOGO_LK = _load('src/img3.png')
SS = {}
_pl = {}
def pixlogo(im, w, f=4, key=None):
    k = (key or id(im), w, f)
    if k not in _pl:
        h = int(im.height * w / im.width)
        sm = im.resize((max(1, w // f), max(1, h // f)), Image.LANCZOS)
        a = np.asarray(sm).copy(); a[..., 3] = np.where(a[..., 3] > 120, 255, 0)
        _pl[k] = Image.fromarray(a, 'RGBA').resize((w, h), Image.NEAREST)
    return _pl[k]

# background: dithered pixel sky + parallax blocky hills + drifting pixel clouds (low-res x8)
LW, LH, PXS = W // 8, H // 8, 8
_B4 = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0
_stops = [(0.0, (20, 14, 52)), (0.45, (40, 24, 86)), (0.78, (86, 38, 120)), (1.0, (150, 62, 128))]
_sky = np.zeros((LH, LW, 3), np.uint8)
_pal = [c for _, c in _stops]
for y in range(LH):
    v = y / (LH - 1)
    for i in range(len(_stops) - 1):
        if _stops[i][0] <= v <= _stops[i + 1][0]:
            f = (v - _stops[i][0]) / (_stops[i + 1][0] - _stops[i][0]); c0, c1 = _stops[i][1], _stops[i + 1][1]; break
    for x in range(LW):
        _sky[y, x] = c1 if f > _B4[y % 4, x % 4] else c0
def _hills(seed, base, amp, step, n=LW * 3):
    r = random.Random(seed); h = []; cur = base
    while len(h) < n:
        cur = max(base - amp, min(base + amp, cur + r.choice((-1, 0, 0, 1)) * r.randint(1, 3)))
        h += [cur] * r.randint(step, step * 3)
    return h[:n]
HF = _hills(4, int(LH * 0.70), 9, 3); HN = _hills(9, int(LH * 0.84), 6, 2)
_r = random.Random(21)
CLOUDS = [(_r.random() * LW * 1.5, 8 + _r.random() * LH * 0.45, 0.6 + _r.random() * 0.9, 1.5 + _r.random() * 2.5) for _ in range(7)]
CUR_T = 0.0
class Frame:
    def __init__(s, t):
        a = _sky.copy()
        im = Image.fromarray(a); d = ImageDraw.Draw(im)
        for (x0, y0, sc, sp) in CLOUDS:
            x = (x0 + t * sp) % (LW + 60) - 40; w = int(18 * sc); h = int(5 * sc)
            col = (70, 48, 120) if y0 < LH * 0.3 else (110, 62, 140)
            d.rectangle((x, y0, x + w, y0 + h), fill=col); d.rectangle((x + w * 0.2, y0 - h * 0.6, x + w * 0.7, y0), fill=col)
            d.rectangle((x + w * 0.45, y0 - h, x + w * 0.65, y0), fill=col)
        a = np.asarray(im).copy()
        for hs, col, top, sp in ((HF, (52, 30, 92), (78, 48, 120), 1.2), (HN, (28, 18, 56), (60, 120, 70), 3.0)):
            o = int(t * sp) % (len(hs) - LW)
            for x in range(LW):
                hy = hs[o + x]; a[hy:, x] = col; a[hy, x] = top
        s.img = Image.fromarray(a).resize((W, H), Image.NEAREST); s.d = ImageDraw.Draw(s.img)
        rnd = random.Random(5)
        for i in range(40):
            x, y = rnd.random() * W, rnd.random() * H * 0.55; ph = rnd.random() * 6.28; sz = rnd.choice((4, 6, 8))
            if math.sin(t * 2.2 + ph) > 0.2:
                c = (210, 200, 255) if i % 3 else (255, 230, 150)
                s.d.rectangle((x, y, x + sz - 1, y + sz - 1), fill=c)
        s.shake = (0, 0); s.flash = 0.0; s.fade = 0.0; s.gray = 0.0
    def hit(s, lt, dur=0.2, amp=16):
        if 0 <= lt < dur:
            k = 1 - lt / dur; r = random.Random(int(lt * 1000))
            s.shake = (int((r.random() - .5) * 2 * amp * k) // 4 * 4, int((r.random() - .5) * 2 * amp * k) // 4 * 4)
    def paste(s, lay, cx, cy, a=1.0):
        if a < 1:
            lay = lay.copy(); lay.putalpha(lay.getchannel('A').point(lambda v: int(v * a)))
        s.img.paste(lay, (int(cx - lay.width / 2), int(cy - lay.height / 2)), lay)
    def finish(s):
        arr = np.asarray(s.img).astype(np.float32)
        if s.flash > 0: arr = arr * (1 - s.flash) + np.array(CREAM, np.float32) * s.flash
        if s.gray > 0: arr = arr * (1 - s.gray) + arr.mean(axis=2, keepdims=True) * s.gray * 0.85
        if s.fade > 0: arr = arr * (1 - s.fade)
        arr = np.clip(arr, 0, 255).astype(np.uint8)
        if s.shake != (0, 0): arr = np.roll(arr, s.shake, axis=(1, 0))
        return arr

def pop(fr, lay, cx, cy, lt, bob=True, dur=0.38, sq=0.14):
    if lt < 0: return
    sc = bo(lt / dur)
    if sc <= 0.02: return
    wob = math.sin(lt * 28) * math.exp(-lt * 7) * sq
    sx, sy = sc * (1 + wob), sc * (1 - wob)
    if bob: cy += math.sin(CUR_T * 3.1 + cx * 0.01) * 5
    l2 = lay.resize((max(1, int(lay.width * sx)), max(1, int(lay.height * sy))), Image.NEAREST) if (abs(sx - 1) > 0.01 or abs(sy - 1) > 0.01) else lay
    fr.paste(l2, cx, cy)
def ptpop(fr, s, size, fill, cx, cy, lt, px=4, **k):
    pop(fr, ptext(s, size, fill, px), cx, cy, lt, **k)

def burst(fr, t, t0, cx, cy, n=40, seed=1, cols=(GOLD, PINK, LIME, CREAM, SKY), spd=900, life=1.1, stars=True):
    age = t - t0
    if age < 0 or age > life: return
    r = random.Random(seed)
    if age < 0.3:
        rr = int(40 + age * 1400); w = max(2, int(18 * (1 - age / 0.3)) // 2 * 2)
        fr.d.rectangle((cx - rr, cy - rr, cx + rr, cy + rr), outline=CREAM, width=w)
    for i in range(n):
        ang = r.random() * 6.283; v = spd * (0.35 + 0.65 * r.random()); col = r.choice(cols)
        x = cx + math.cos(ang) * v * age; y = cy + math.sin(ang) * v * age + 900 * age * age
        k = 1 - age / life
        if stars and i % 3 == 0:
            sc = max(1, int(5 * k)); fr.paste(S('star', sc, col), x, y)
        else:
            sz = max(2, int(14 * k)) // 2 * 2; fr.d.rectangle((x - sz, y - sz, x + sz, y + sz), fill=col)

def rain(fr, t, t0, t1, n=40, seed=3, kinds=('coin', 'bill'), sc=6, spd=1.0):
    r = random.Random(seed)
    for i in range(n):
        sp = t0 + (t1 - t0) * r.random(); age = t - sp
        x0 = r.random() * W; v = (260 + 320 * r.random()) * spd; ph = r.random() * 6.28; kind = r.choice(kinds)
        if age < 0: continue
        y = -80 + v * age + 120 * age * age
        if y > H + 100: continue
        x = x0 + math.sin(age * 2.6 + ph) * 50
        im = S(kind, sc)
        if kind == 'coin':
            f = abs(math.cos(age * 5 + ph)); w = max(sc, int(im.width * f) // sc * sc)
            im = im.resize((w, im.height), Image.NEAREST)
        else:
            f = 0.35 + 0.65 * abs(math.cos(age * 3.3 + ph)); h = max(sc, int(im.height * f) // sc * sc)
            im = im.resize((im.width, h), Image.NEAREST)
        fr.paste(im, x, y)

def dbox(fr, text, x, y, w, prog, size=48, h=None, col=OUT, bg=CREAM):
    h = h or size + 40; n = int(round(len(text) * clamp(prog)))
    fr.d.rectangle((x + 10, y + 10, x + w + 10, y + h + 10), fill=OUT)
    fr.d.rectangle((x, y, x + w, y + h), fill=bg, outline=OUT, width=6)
    for (cx, cy) in ((x, y), (x + w - 6, y), (x, y + h - 6), (x + w - 6, y + h - 6)): fr.d.rectangle((cx, cy, cx + 5, cy + 5), fill=BG1)
    fr.d.text((x + 26, y + h / 2 + 2), text[:n], font=vfont(size), fill=col, anchor='lm')
    if prog >= 1 and int(CUR_T * 3) % 2 == 0:
        fr.d.polygon([(x + w - 34, y + h - 26), (x + w - 18, y + h - 26), (x + w - 26, y + h - 16)], fill=col)

def pframe(fr, im, x, y, w, h, lt, label=None, lab_col=PINK):
    if lt < 0: return
    p = bo(lt / 0.4); y = y + (1 - p) * 120
    f = max(2, int(lerp(30, 2, eo(lt / 0.5))))
    ar = w / h; IW, IH = im.size; cw = min(IW, IH * ar); ch = cw / ar
    z = 1 + 0.06 * clamp(lt / 6); cw /= z; ch /= z
    box = ((IW - cw) / 2, (IH - ch) / 2, (IW + cw) / 2, (IH + ch) / 2)
    sm = im.resize((max(1, int(w // f)), max(1, int(h // f))), Image.BILINEAR, box=box).resize((int(w), int(h)), Image.NEAREST)
    fr.d.rectangle((x + 14, y + 14, x + w + 14 + 8, y + h + 14 + 8), fill=OUT)
    fr.d.rectangle((x - 10, y - 10, x + w + 10, y + h + 10), fill=OUT); fr.d.rectangle((x - 5, y - 5, x + w + 5, y + h + 5), fill=CREAM)
    fr.img.paste(sm, (int(x), int(y)))
    if label:
        tw = vfont(34).getlength(label) + 30
        fr.d.rectangle((x - 10, y - 52, x - 10 + tw, y - 10), fill=lab_col, outline=OUT, width=5)
        fr.d.text((x + 5, y - 31), label, font=vfont(34), fill=OUT, anchor='lm')

def errwin(fr, x, y, lt, msg, seed):
    if lt < 0: return
    p = bo(lt / 0.3); w, h = int(360 * p), int(200 * p)
    if w < 20: return
    j = random.Random(int(CUR_T * 12) + seed); x += (j.random() - .5) * 8; y += (j.random() - .5) * 8
    fr.d.rectangle((x + 12, y + 12, x + w + 12, y + h + 12), fill=OUT)
    fr.d.rectangle((x, y, x + w, y + h), fill=CREAM, outline=OUT, width=6)
    fr.d.rectangle((x + 6, y + 6, x + w - 6, y + 46), fill=SKY)
    if p > 0.8:
        fr.d.text((x + 18, y + 26), 'loi.exe', font=vfont(32), fill=OUT, anchor='lm')
        fr.d.rectangle((x + w - 44, y + 12, x + w - 14, y + 40), fill=RED, outline=OUT, width=3)
        fr.d.text((x + w - 29, y + 26), 'X', font=vfont(30), fill=WHITE, anchor='mm')
        fr.d.text((x + w / 2, y + 120), msg, font=vfont(64), fill=RED, anchor='mm')

def calendar(fr, cx, cy, num, lt):
    if lt < 0: return
    p = bo(lt / 0.35); w, h = 300 * p, 320 * p
    if w < 10: return
    x, y = cx - w / 2, cy - h / 2
    fr.d.rectangle((x + 14, y + 14, x + w + 14, y + h + 14), fill=OUT)
    fr.d.rectangle((x, y, x + w, y + h), fill=CREAM, outline=OUT, width=8); fr.d.rectangle((x + 8, y + 8, x + w - 8, y + 80 * p), fill=RED)
    if p > 0.8:
        fr.d.text((cx, y + 46), 'THÁNG', font=vfont(48), fill=WHITE, anchor='mm')
        fr.paste(ptext(str(num), 200, (90, 60, 160), 5), cx, cy + 40)

def rack(fr, x, y, lt):
    if lt < 0: return
    p = bo(lt / 0.35)
    if p < 0.05: return
    w, h = 300, 420; y = y + (1 - p) * 150
    fr.d.rectangle((x + 14, y + 14, x + w + 14, y + h + 14), fill=OUT)
    fr.d.rectangle((x, y, x + w, y + h), fill=(70, 66, 110), outline=OUT, width=8)
    for i in range(5):
        yy = y + 30 + i * 76
        fr.d.rectangle((x + 24, yy, x + w - 24, yy + 56), fill=(44, 40, 80), outline=OUT, width=4)
        for k in range(4):
            on = math.sin(CUR_T * (5 + i) + k * 1.7 + i) > 0
            fr.d.rectangle((x + 44 + k * 26, yy + 20, x + 58 + k * 26, yy + 34), fill=(LIME if k % 2 else SKY) if on else (30, 28, 50))
        fr.d.rectangle((x + w - 90, yy + 22, x + w - 44, yy + 32), fill=(110, 104, 160))

def cloud(fr, cx, cy, sc, lt):
    if lt < 0: return
    p = bo(lt / 0.4) * sc
    if p < 0.05: return
    sm = Image.new('RGBA', (120, 70), (0, 0, 0, 0)); d = ImageDraw.Draw(sm)
    for (x, y, r) in ((30, 42, 22), (58, 30, 28), (88, 40, 22), (60, 48, 22)): d.ellipse((x - r - 2, y - r - 2, x + r + 2, y + r + 2), fill=OUT)
    for (x, y, r) in ((30, 42, 22), (58, 30, 28), (88, 40, 22), (60, 48, 22)): d.ellipse((x - r, y - r, x + r, y + r), fill=CREAM)
    im = sm.resize((int(120 * 8 * p), int(70 * 8 * p)), Image.NEAREST); fr.paste(im, cx, cy)


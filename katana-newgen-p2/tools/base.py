# NewGen neon-laser motion graphics renderer: python3 ng_render.py F0 F1 out.mp4
import sys, json, math, subprocess, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont
W, H, FPS = 1920, 1080, 30
TOTAL = 53.0
BG = (13, 13, 12); LIME = (212, 250, 40); OFF = (234, 232, 225); WHITE = (244, 244, 240); GREY = (120, 120, 116)
FH = '/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf'
FI = '/usr/share/fonts/truetype/liberation2/LiberationSerif-Italic.ttf'
FM = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
FMB = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
_fc = {}
def font(p, s):
    k = (p, s)
    if k not in _fc: _fc[k] = ImageFont.truetype(p, s)
    return _fc[k]
def clamp(x, a=0.0, b=1.0): return a if x < a else b if x > b else x
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def ei(x): x = clamp(x); return x ** 3
def eio(x): x = clamp(x); return 3 * x * x - 2 * x * x * x
def lerp(a, b, x): return a + (b - a) * x

# ---------- assets ----------
LOGO = {k: Image.open(f'src/img{k}.png').convert('RGBA') for k in (1, 2, 3)}
_lc = {}
def logo(k, w):
    key = (k, int(w))
    if key not in _lc:
        im = LOGO[k]; h = int(im.height * w / im.width)
        _lc[key] = im.resize((int(w), h), Image.LANCZOS)
    return _lc[key]
def _halo(r):
    y, x = np.mgrid[-r:r, -r:r].astype(np.float32)
    d = np.sqrt(x * x + y * y) / r
    g = np.exp(-(d * 3.2) ** 2) * 0.9 + np.exp(-(d * 12) ** 2) * 1.6
    return g
HALO = {r: _halo(r) for r in (24, 60, 140, 320)}
LIMEF = np.array(LIME, np.float32)

_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
_r = np.sqrt(((_xx - W / 2) / (W / 2)) ** 2 + ((_yy - H / 2) / (H / 2)) ** 2)
_v = np.clip(1 - _r * 0.55, 0, 1)[..., None]
BGTEX = Image.fromarray((np.array([5, 5, 4], np.float32) + np.array([20, 21, 18], np.float32) * _v).astype(np.uint8))
del _yy, _xx, _r, _v
CUR_T = 0.0
class Frame:
    def __init__(self, bg=BG):
        self.img = BGTEX.copy() if bg == BG else Image.new('RGB', (W, H), bg)
        self.d = ImageDraw.Draw(self.img)
        self.glows = []
        self.flash = 0.0
        self.zoom = 1.0
        self.shake = (0, 0)
        if bg == BG:
            off = (CUR_T * 14) % 96
            for x in np.arange(-96 + off, W, 96):
                self.d.line([(x, 0), (x, H)], fill=(22, 23, 19), width=1)
            for y in np.arange(-96 + off * 0.5, H, 96):
                self.d.line([(0, y), (W, y)], fill=(22, 23, 19), width=1)
            rnd = random.Random(99)
            for i in range(70):
                x0, y0 = rnd.random() * W, rnd.random() * H
                vx, vy = (rnd.random() - 0.5) * 40, -rnd.random() * 30 - 8
                x, y = (x0 + vx * CUR_T) % W, (y0 + vy * CUR_T) % H
                c = int(55 + 60 * rnd.random()); r = rnd.random() * 1.6 + 0.4
                self.d.ellipse((x - r, y - r, x + r, y + r), fill=(c, c, int(c * 0.9)))
    def cam(self, lt, dur, amt=0.05):
        self.zoom = 1.0 + amt * eio(lt / max(dur, 0.01))
    def hit(self, lt, dur=0.22, amp=22, seed=0):
        if 0 <= lt < dur:
            k = 1 - lt / dur; rnd = random.Random(int(lt * 1000) + seed)
            self.shake = (int((rnd.random() - 0.5) * 2 * amp * k), int((rnd.random() - 0.5) * 2 * amp * k))
    def glow(self, x, y, r=60, a=1.0, col=LIMEF):
        self.glows.append((x, y, r, a, col))
    def finish(self):
        arr = np.asarray(self.img).astype(np.float32)
        for x, y, r, a, col in self.glows:
            g = HALO[r]; x0, y0 = int(x) - r, int(y) - r
            sx0, sy0 = max(0, -x0), max(0, -y0)
            x1, y1 = min(W, x0 + 2 * r), min(H, y0 + 2 * r)
            if x1 <= max(0, x0) or y1 <= max(0, y0): continue
            sub = g[sy0:sy0 + (y1 - max(0, y0)), sx0:sx0 + (x1 - max(0, x0))]
            arr[max(0, y0):y1, max(0, x0):x1] += sub[..., None] * col[None, None, :] * a
        if self.flash > 0:
            arr = arr * (1 - self.flash) + np.array(OFF, np.float32) * self.flash
        arr = np.clip(arr, 0, 255).astype(np.uint8)
        if self.zoom > 1.001:
            cw, ch = W / self.zoom, H / self.zoom
            arr = np.asarray(Image.fromarray(arr).resize((W, H), Image.BILINEAR, box=((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2)))
        if self.shake != (0, 0):
            arr = np.roll(arr, self.shake, axis=(1, 0))
        return arr

def text_layer(s, fp, size, fill, spacing=0):
    f = font(fp, size)
    bb = f.getbbox(s)
    w, h = bb[2] - bb[0] + 40, bb[3] - bb[1] + 40
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((20 - bb[0], 20 - bb[1]), s, font=f, fill=fill)
    return im
_tl = {}
def tl(s, fp, size, fill):
    k = (s, fp, size, fill)
    if k not in _tl: _tl[k] = text_layer(s, fp, size, fill)
    return _tl[k]
def hblur(im, k):
    k = int(k)
    if k < 2: return im
    a = np.asarray(im).astype(np.float32)
    acc = np.zeros_like(a)
    for i in range(k):
        acc += np.roll(a, i - k // 2, axis=1)
    return Image.fromarray((acc / k).astype(np.uint8), 'RGBA')
_fd = {}
def faded(lay, a):
    k = (id(lay), round(a, 3))
    if k not in _fd:
        l2 = lay.copy(); l2.putalpha(lay.getchannel('A').point(lambda v: int(v * a))); _fd[k] = l2
    return _fd[k]
def ghosts(fr, lay, cx, cy, gap, lt, n=2, a=0.13):
    for k in range(1, n + 1):
        g = faded(lay, a / k)
        for sgn in (-1, 1):
            y = cy + sgn * (gap * k + lt * 40 * k)
            fr.img.paste(g, (int(cx - g.width / 2), int(y - g.height / 2)), g)
def slam(fr, word, lt, cx, cy, size, fill=WHITE, ghost=True, glow=True):
    lay = tl(word, FH, size, fill)
    sc = lerp(1.25, 1.0, eo(lt / 0.22)) * (1 + 0.02 * lt)
    if ghost and lt > 0.08: ghosts(fr, lay, cx, cy, size * 1.05, lt, 2, 0.10)
    paste_c(fr, lay, cx, cy, sc, 1.0, int(lerp(70, 0, eo(lt / 0.18))))
    if glow: fr.glow(cx + lay.width * sc / 2 - 30, cy + size * 0.3, 60, 1.0)
    fr.hit(lt)
    if lt < 2 / FPS: fr.flash = 0.45
    return lay
def paste_c(fr, layer, cx, cy, scale=1.0, alpha=1.0, blur=0):
    if scale != 1.0:
        layer = layer.resize((max(1, int(layer.width * scale)), max(1, int(layer.height * scale))), Image.BILINEAR)
    if blur: layer = hblur(layer, blur)
    if alpha < 1.0:
        a = layer.getchannel('A').point(lambda v: int(v * alpha)); layer = layer.copy(); layer.putalpha(a)
    fr.img.paste(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)), layer)
def paste_tl(fr, layer, x, y, alpha=1.0):
    if alpha < 1.0:
        a = layer.getchannel('A').point(lambda v: int(v * alpha)); layer = layer.copy(); layer.putalpha(a)
    fr.img.paste(layer, (int(x), int(y)), layer)

def typed(fr, s, fp, size, x, y, prog, fill=WHITE, anchor='ls', dot=True):
    n = int(round(len(s) * clamp(prog)))
    sub = s[:n]
    f = font(fp, size)
    fr.d.text((x, y), sub, font=f, fill=fill, anchor=anchor)
    if dot and prog < 1.15:
        ex = x + f.getlength(sub) if anchor[0] == 'l' else x
        fr.glow(ex + 10, y - size * 0.35, 60, 0.9); fr.glow(ex + 10, y - size * 0.35, 24, 1.0)
    return x + f.getlength(sub)

def ui_chrome(fr, t, label='NEWGEN // SERVER STORY'):
    f = font(FM, 15)
    fr.d.text((60, 46), label, font=f, fill=(90, 90, 86))
    s = int(t * 100)
    fr.d.text((W - 60, 46), f'00:{s // 6000:02d}:{(s // 100) % 60:02d}:{s % 100:02d}', font=f, fill=(90, 90, 86), anchor='ra')

def card(fr, word, t, dur, bg, fg, size=300, small=None, small_fill=None):
    fr.img.paste(bg, (0, 0, W, H))
    sc = lerp(1.10, 1.0, eo(t / 0.35)) * lerp(1.0, 1.04, t / max(dur, 0.01))
    blur = int(lerp(60, 0, eo(t / 0.18)))
    lay = tl(word, FH, size, fg)
    if t > 0.06: ghosts(fr, lay, W / 2, H / 2 + 10, size * 1.08, t, 2, 0.09)
    paste_c(fr, lay, W / 2, H / 2 + 10, sc, 1.0, blur)
    fr.hit(t)
    if small:
        fr.d.text((W / 2 - lay.width * sc / 2 + 30, H / 2 - size * 0.62), small, font=font(FI, 64), fill=small_fill or fg, anchor='ls')
    if t < 2 / FPS: fr.flash = 0.55

def laser(fr, p, y0=None, ang=-0.32, w=6):
    # diagonal lime beam sweeping across, p in [0,1]
    if p <= 0 or p >= 1: return
    cx = lerp(-300, W + 300, eio(p)); cy = H / 2 if y0 is None else y0
    L = 2600; dx, dy = math.cos(ang) * L / 2, math.sin(ang) * L / 2
    fr.d.line([(cx - dx, cy - dy), (cx + dx, cy + dy)], fill=LIME, width=w)
    for k in range(-6, 7):
        fr.glow(cx + dx * k / 6, cy + dy * k / 6, 140, 0.35)
    fr.glow(cx, cy, 320, 0.25)

def dot(fr, x, y, a=1.0):
    fr.glow(x, y, 140, 0.45 * a); fr.glow(x, y, 24, 1.2 * a)

# ---------- source clips ----------
def panel(fr, im, x, y, label, a=1.0, lift=0.0):
    w, h = im.size; y = y + lift
    r = 14
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=int(255 * a))
    fr.img.paste(im, (int(x), int(y)), m)
    fr.d.rounded_rectangle((x - 1, y - 1, x + w, y + h), r, outline=(70, 70, 66), width=2)
    L = 26; c = LIME
    for (px, py, sx, sy) in ((x - 12, y - 12, 1, 1), (x + w + 12, y - 12, -1, 1), (x - 12, y + h + 12, 1, -1), (x + w + 12, y + h + 12, -1, -1)):
        fr.d.line([(px, py), (px + sx * L, py)], fill=c, width=3); fr.d.line([(px, py), (px, py + sy * L)], fill=c, width=3)
    fr.d.text((x, y - 24), label, font=font(FM, 15), fill=(150, 150, 144))

def metal_word(fr, s, size, cx, cy, t, frag=0.0, seed=1):
    lay = tl(s, FH, size, (255, 255, 255, 255))
    a = np.asarray(lay).astype(np.float32)
    h, w = a.shape[:2]
    yy = np.linspace(0, 1, h)[:, None]
    base = 120 + 120 * np.exp(-((yy - 0.38) / 0.18) ** 2) - 40 * yy
    xx = np.linspace(0, 1, w)[None, :]
    band = 90 * np.exp(-((xx - (t * 0.6 % 1.4 - 0.2)) / 0.06) ** 2)
    v = np.clip(base + band, 0, 255)
    rgb = np.stack([v, v, v * 0.98], -1)
    out = np.concatenate([rgb, a[..., 3:4]], -1)
    if frag > 0:
        rnd = random.Random(seed); sl = 14
        for y0 in range(0, h, sl):
            dx = int((rnd.random() - 0.5) * 2 * frag * 260)
            out[y0:y0 + sl] = np.roll(out[y0:y0 + sl], dx, axis=1)
        out[..., 3] *= (1 - frag * 0.6)
    im = Image.fromarray(out.astype(np.uint8), 'RGBA')
    paste_c(fr, im, cx, cy, 1.0 + frag * 0.15, 1.0, int(frag * 40))

def particles(fr, t, n=120, seed=3, a=1.0):
    rnd = random.Random(seed)
    for i in range(n):
        x0, y0 = rnd.random() * W, rnd.random() * H
        vx, vy = (rnd.random() - 0.5) * 300, -rnd.random() * 160 - 20
        x, y = (x0 + vx * t) % W, (y0 + vy * t) % H
        s = rnd.random() * 2.5 + 0.5
        c = int(160 + 90 * rnd.random() * a)
        fr.d.ellipse((x - s, y - s, x + s, y + s), fill=(c, c, c))

# ---------- timeline ----------

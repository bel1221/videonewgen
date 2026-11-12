exec(open('tools/mg.py').read())
from PIL import ImageChops
TOTAL = round(T_END + 2.6, 2)
SPD = 1.35
_r0, _s0, _k0, _p0, _c0, _sp0, _sl0 = reveal, stagger, kicker, pill, card, spark, slash
def reveal(fr, lay, x, y, lt, d=0.6, anchor='mm', a=1.0): return _r0(fr, lay, x, y, lt * SPD, d, anchor, a)
def stagger(fr, s, p, size, fill, cx, cy, lt, step=0.03, track=0, var=None, anchor='m'): return _s0(fr, s, p, size, fill, cx, cy, lt * SPD, step, track, var, anchor)
def kicker(fr, s, x, y, lt, col=GREEN, anchor='l'): return _k0(fr, s, x, y, lt * SPD, col, anchor)
def pill(fr, s, cx, cy, lt, col=GREEN, fg=INK, size=34): return _p0(fr, s, cx, cy, lt * SPD, col, fg, size)
def card(fr, key, x, y, w, h, lt, label=None, col=GREEN, zoom=0.07, dx=0.3, dy=0.0, a_out=1.0): return _c0(fr, key, x, y, w, h, lt * SPD, label, col, zoom, dx, dy, a_out)
def spark(fr, cx, cy, lt, n=14, life=0.6, R=260, seed=1): return _sp0(fr, cx, cy, lt * 1.2, n, life, R, seed)
# ---------- assets ----------
_LIB = Image.open('src/lib_all.png').convert('RGB'); TT = 320
def _unpack(img, x, y):
    h2 = img.height // 2; c = img.crop((x, y, x + TT, y + TT)).convert('RGBA'); c.putalpha(img.crop((x, y + h2, x + TT, y + h2 + TT)).convert('L')); return c
NAMES = ['Boltspear', 'Shellblaster', 'Seekerbow', 'Axolotl Gun', 'Lancebolt', 'Hiveburst', 'Skystrider', 'Corrupted Crossbow', 'Creaking Scythe', 'Bloodchain', 'Cursed Katar', 'Blinkblade', 'Jade Edge', 'Voidbow', 'Fangcaller', 'Aegisblade', 'Golem Hammer', 'Grimoire of Debts', 'Gruntilda', 'Harpoon Launcher', 'Heaven Wand', 'Charmstaff', 'Arcane Scroll', 'Jingu Bang', 'Kim the Transmuter', 'Last Rose', 'Relic Sniffer', 'Froststaff', 'Magma Club', 'Goldreaper', 'Thundermaul', 'Ocean Sword', 'Tidepiercer', 'Toxicannon', 'Warcall', 'Sakura Tessen', 'Veilblade', 'Sizeshifter', 'Shuriken', 'Sonic Crossbow', 'Soul Gauntlet', 'Silkstrike', 'Tim the Enchanter', 'Rendpick']
TILES = [_unpack(_LIB, (i % 7) * TT, (i // 7) * TT) for i in range(44)]
HERO = ['Aegisblade', 'Veilblade', 'Ocean Sword', 'Thundermaul']; NF = 144
SPN = np.load('src/spin144.npy', mmap_mode='r')
_rc = {}
def sized(im, key, s):
    s = max(8, int(s) // 4 * 4); k = (key, s)
    if k not in _rc:
        if len(_rc) > 900: _rc.clear()
        _rc[k] = im.resize((s, s), Image.LANCZOS)
    return _rc[k]
def spin_img(name, ang, s):
    h = HERO.index(name); x = (ang % 360) / 2.5; f0 = int(x) % NF; f1 = (f0 + 1) % NF; w = x - int(x)
    a0 = SPN[h, f0].astype(np.float32); a1 = SPN[h, f1].astype(np.float32)
    al = a0[..., 3:] * (1 - w) + a1[..., 3:] * w; pm = a0[..., :3] * a0[..., 3:] * (1 - w) + a1[..., :3] * a1[..., 3:] * w
    rgb = pm / np.maximum(al, 1e-3); im = Image.fromarray(np.concatenate([rgb, al], -1).clip(0, 255).astype(np.uint8), 'RGBA')
    s = max(8, int(s)); return im.resize((s, s), Image.LANCZOS)
def tile_img(i, s): return sized(TILES[i], ('t', i), s)
_gl = {}
def glow(col, r):
    k = (col, r)
    if k not in _gl:
        yy, xx = np.mgrid[-r:r, -r:r]; d = np.sqrt(xx * xx + yy * yy) / r; a = np.clip(1 - d, 0, 1) ** 2.2 * 120
        arr = np.zeros((2 * r, 2 * r, 4), np.uint8); arr[..., :3] = col; arr[..., 3] = a.astype(np.uint8); _gl[k] = Image.fromarray(arr)
    return _gl[k]
def put(fr, im, cx, cy, cw=0.0, a=1.0, tint=0.0, sc=1.0):
    if a <= 0: return
    if sc != 1.0: im = im.resize((max(2, int(im.width * sc)), max(2, int(im.height * sc))), Image.BILINEAR)
    if tint > 0:
        arr = np.asarray(im).astype(np.float32); arr[..., :3] = arr[..., :3] * (1 - tint) + np.array([255, 40, 40]) * tint; im = Image.fromarray(arr.astype(np.uint8))
    if abs(cw) > 0.3: im = im.rotate(-cw, resample=Image.BICUBIC, expand=True)
    fr.paste(im, cx - im.width / 2, cy - im.height / 2, a)
HP = np.load('src/hp_keyed.npy'); HP = [Image.fromarray(f).resize((448, int(448 * f.shape[0] / f.shape[1])), Image.NEAREST) for f in HP]
DEATH = np.load('src/death_keyed.npy'); DS = 1.7
# Clip time (s) at which exactly k hearts are left, measured by counting red pixels in the keyed clip (2026-11-13).
# The old table (0: 11) stopped on a frame that still shows 1 heart, so the loser's bar never reached 0 in v4.
_HT = {10: 0, 9: 1.37, 8: 2.37, 7: 3.37, 6: 4.37, 5: 6.37, 4: 7.4, 3: 8.37, 2: 9.37, 1: 10.37, 0: 11.47}
def hp_ct(t, ev):
    ct = 0.0
    for tt, h0, h1 in ev:
        if t >= tt: ct = lerp(_HT[h0], _HT[h1], clamp((t - tt) / 0.4))
    return ct
def hpbar(fr, cx, cy, ct, a=1.0):
    im = HP[min(len(HP) - 1, int(ct * 30))]; fr.paste(im, cx - im.width / 2, cy - im.height / 2, a)
def death(fr, cx, cy, lt):
    k = 16 + int(lt * 30)
    if lt < 0 or k >= len(DEATH): return
    im = Image.fromarray(DEATH[k]); s = int(im.width * DS); im = im.resize((s, s), Image.BILINEAR)
    fr.paste(im, cx - 241 * DS, cy - 296 * DS)
def pixart(rows, px, col, out=(10, 14, 16)):
    h, w = len(rows), len(rows[0]); im = Image.new('RGBA', ((w + 2) * px, (h + 2) * px), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c != '.':
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1): d.rectangle(((x + 1 + dx) * px, (y + 1 + dy) * px, (x + 2 + dx) * px - 1, (y + 2 + dy) * px - 1), fill=out + (255,))
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c != '.': d.rectangle(((x + 1) * px, (y + 1) * px, (x + 2) * px - 1, (y + 2) * px - 1), fill=col[c] + (255,))
    return im
CROWN = pixart(['a...a...a', 'aa.aba.aa', 'aaaaaaaaa', 'abaaaaaba', '.aaaaaaa.'], 14, {'a': (255, 196, 80), 'b': (255, 120, 90)})
CHEST = ['.ddd......ddd.', 'ddtdd....ddtdd', 'dddtddddddtddd', 'eeddtddddtddee', '.ddddtddtdddd.', '..ddddttdddd..', '..dddttttddd..', '..ddttddttdd..', '..dddttttddd..', '..ddddttdddd..', '..tttttttttt..', '..dddddddddd..']
def chest(shine):
    cols = {'d': (44, 58, 64), 'e': (70, 88, 96), 't': tuple(int(lerp(120, 255, shine)) for _ in range(1)) and (int(lerp(110, 255, shine)), int(lerp(80, 170, shine)), int(lerp(50, 90, shine)))}
    return pixart(CHEST, 15, cols)
LOCK = pixart(['.aaa.', 'a...a', 'a...a', 'bbbbb', 'bbcbb', 'bbcbb', 'bbbbb'], 9, {'a': (200, 205, 210), 'b': (255, 190, 80), 'c': (60, 40, 20)})
def xmark(fr, cx, cy, p, col=RED, s=34):
    if p <= 0: return
    od = fr.o(); q = eo(p); od.ellipse((cx - 46, cy - 46, cx + 46, cy + 46), outline=col + (int(200 * clamp(p * 3)),), width=5)
    od.line([(cx - s * q, cy - s * q), (cx + s * q, cy + s * q)], fill=col + (255,), width=10); od.line([(cx - s * q, cy + s * q), (cx + s * q, cy - s * q)], fill=col + (255,), width=10)
def check(fr, cx, cy, p, col=GREEN):
    if p <= 0: return
    od = fr.o(); q = eo(p); od.ellipse((cx - 46, cy - 46, cx + 46, cy + 46), outline=col + (int(220 * clamp(p * 3)),), width=5)
    pts = [(cx - 24, cy + 2), (cx - 6, cy + 20), (cx + 28, cy - 18)]
    if q < 0.5: od.line([pts[0], (lerp(pts[0][0], pts[1][0], q * 2), lerp(pts[0][1], pts[1][1], q * 2))], fill=col + (255,), width=10)
    else: od.line([pts[0], pts[1], (lerp(pts[1][0], pts[2][0], (q - .5) * 2), lerp(pts[1][1], pts[2][1], (q - .5) * 2))], fill=col + (255,), width=10, joint='curve')
def row(fr, parts, cx, cy, lt, d=0.55):
    ws = [p[0].width for p in parts]; x = cx - (sum(ws)) / 2
    for (lay, dl), w_ in zip(parts, ws): reveal(fr, lay, x, cy, lt - dl, d, anchor='lm'); x += w_
# ---------- scenes ----------
def s_q(fr, lt, dur, t):
    reveal(fr, tl('Bạn muốn biết', FI, 60, WHITE, 0, 'SemiBold'), W / 2, 300, lt + 0.1)
    row(fr, [(tl('TRÌNH ĐỘ ', FM, 150, WHITE), 0), (tl('PVP', FM, 150, ORANGE), 0.12)], W / 2, 440, t - T_PVP + 0.45)
    row(fr, [(tl('của bạn đang ở ', FI, 58, WHITE, 0, 'SemiBold'), 0), (tl('mức nào?', FI, 58, GREEN, 0, 'Bold'), 0.1)], W / 2, 570, t - T_PVP - 0.55)
    l = t - T_NAO + 0.3
    if l > 0:
        a = clamp(l / 0.3); x0, x1, y = 560, 1360, 735; od = fr.o(); wv = (x1 - x0) * eo(l / 0.6)
        od.rounded_rectangle((x0, y - 7, x0 + wv, y + 7), 7, fill=(255, 255, 255, int(36 * a)))
        for i in range(11): xx = x0 + i * 80; od.rectangle((xx - 1, y + 16, xx + 1, y + 26), fill=(255, 255, 255, int(60 * a)))
        u = 0.5 + 0.42 * math.sin((t - T_NAO) * 2.3) * math.cos((t - T_NAO) * 0.9); nx = x0 + (x1 - x0) * u
        n = 24
        for i in range(n):
            xa = x0 + (nx - x0) * i / n; xb = x0 + (nx - x0) * (i + 1) / n; c = tuple(int(lerp(g, o, i / n)) for g, o in zip(GREEN, ORANGE))
            od.rectangle((xa, y - 7, xb, y + 7), fill=c + (int(230 * a),))
        od.rounded_rectangle((nx - 4, y - 30, nx + 4, y + 30), 4, fill=WHITE + (int(255 * a),))
        q = tl('?', FM, 44, INK); od.rounded_rectangle((nx - 28, y - 96, nx + 28, y - 42), 14, fill=WHITE + (int(255 * a),)); fr.paste(q, nx - q.width / 2, y - 69 - q.height / 2, a)
def s_title(fr, lt, dur, t):
    kicker(fr, 'RỦ NGAY ĐỒNG ĐỘI', W / 2, 250, t - T_DD1 + 0.6, GREEN, 'm')
    stagger(fr, 'RANKED', FM, 150, WHITE, W / 2, 420, t - T_RK + 0.2, 0.04)
    l = t - T_2V2 + 0.35
    if l > 0:
        p = bo(l / 0.5); a = clamp(l / 0.15)
        parts = [tl('2', FM, 230, GREEN), tl(' VS ', FM, 150, WHITE), tl('2', FM, 230, ORANGE)]
        ws = sum(x.width for x in parts) * p; x = W / 2 - ws / 2
        for im in parts:
            im2 = im.resize((max(2, int(im.width * p)), max(2, int(im.height * p))), Image.BILINEAR); fr.paste(im2, x, 650 - im2.height / 2, a); x += im2.width
        fr.hit(l - 0.15, 0.2, 10)
    for i, (n, x, cw, col) in enumerate((('Ocean Sword', 330, -18, GREEN), ('Thundermaul', 1590, 18, ORANGE))):
        q = eo((lt - 0.1 - i * 0.12) / 0.7)
        if q <= 0: continue
        xx = x + (1 - q) * (-500 if i == 0 else 500); yy = 560 + math.sin(t * 2 + i) * 12
        put(fr, glow(col, 260), xx, yy, a=0.8 * q); put(fr, spin_img(n, t * 40 + i * 90, 500), xx, yy, cw, q)
def s_arms(fr, lt, dur, t):
    kicker(fr, 'Ở CHẾ ĐỘ NÀY', W / 2, 160, lt, GREEN, 'm')
    reveal(fr, tl('VŨ KHÍ HUYỀN THOẠI', FM, 96, WHITE), W / 2, 262, t - T_VK + 0.15)
    for side, (x0, lab, col, ws, tt) in enumerate(((160, 'ĐỘI CỦA BẠN', GREEN, ('Aegisblade', 'Ocean Sword'), T_DD2 - 0.35), (1060, 'ĐỐI THỦ', ORANGE, ('Veilblade', 'Thundermaul'), T_DOI - 0.45))):
        l = t - tt
        if l <= 0: continue
        p = ex(l / 0.6); a = clamp(l / 0.3); od = fr.o(); yo = (1 - p) * 40
        od.rounded_rectangle((x0, 370 + yo, x0 + 700, 900 + yo), 28, fill=(5, 18, 22, int(150 * a)), outline=col + (int(120 * a),), width=3)
        kicker(fr, lab, x0 + 350, 420 + yo, l - 0.1, col, 'm')
        for j, n in enumerate(ws):
            q = eo((l - 0.15 - j * 0.15) / 0.5)
            if q <= 0: continue
            cx = x0 + 190 + j * 320; cy = 660 + yo + (1 - q) * 50 + math.sin(t * 2.2 + j + side) * 8
            put(fr, glow(col, 200), cx, cy, a=0.6 * q); put(fr, spin_img(n, t * 36 + j * 120 + side * 60, 400), cx, cy, 0, q)
    l = t - T_DOI + 0.05
    if l > 0:
        p = bo(l / 0.45); r = 86 * p; od = fr.o(); a = clamp(l / 0.1)
        od.ellipse((960 - r, 635 - r, 960 + r, 635 + r), fill=INK + (int(255 * a),), outline=WHITE + (int(200 * a),), width=4)
        v = tl('VS', FM, int(max(8, 76 * p)), WHITE); fr.paste(v, 960 - v.width / 2, 635 - v.height / 2, a); fr.hit(l, 0.2, 9)
_r = random.Random(11)
def _seq(final, n=34):
    pool = [i for i in range(44) if i != final]; s = [_r.choice(pool) for _ in range(n)]; return s + [final] + [_r.choice(pool) for _ in range(3)]
REELS = [(600, GREEN, 'ĐỘI CỦA BẠN', _seq(NAMES.index('Aegisblade')), T_MOI - 0.1, T_KBG + 0.9), (1320, ORANGE, 'ĐỐI THỦ', _seq(NAMES.index('Veilblade')), T_MOI + 0.1, T_GI + 0.05)]
_rm = {}
def reelmask(w, h):
    if (w, h) not in _rm:
        y = np.linspace(0, 1, h); a = np.clip(np.minimum(y, 1 - y) / 0.2, 0, 1) ** 1.5; _rm[(w, h)] = Image.fromarray((np.repeat(a[:, None], w, 1) * 255).astype(np.uint8))
    return _rm[(w, h)]
def s_roll(fr, lt, dur, t):
    kicker(fr, 'TRƯỚC MỖI TRẬN', W / 2, 140, lt, GREEN, 'm')
    reveal(fr, tl('VŨ KHÍ NGẪU NHIÊN', FM, 92, WHITE), W / 2, 228, t - T_NN + 0.2)
    for k, (cx, col, lab, seq, t0, t1) in enumerate(REELS):
        l = lt - k * 0.12; p_ = ex(l / 0.6); a = clamp(l / 0.3)
        if a <= 0: continue
        cy = 625 + (1 - p_) * 40; od = fr.o()
        od.rounded_rectangle((cx - 200, cy - 245, cx + 200, cy + 245), 28, fill=(5, 18, 22, int(170 * a)), outline=col + (int(130 * a),), width=3)
        kicker(fr, lab, cx, cy - 290, l - 0.1, col, 'm')
        pe = len(seq) - 4; u = clamp((t - t0) / (t1 - t0)); pos = pe * (1 - (1 - u) ** 3) + (0 if t >= t0 else math.sin(t * 3 + k) * 0.04)
        v = 3 * pe * (1 - u) ** 2 / (t1 - t0) if t0 < t < t1 else 0
        L = Image.new('RGBA', (380, 470), (0, 0, 0, 0)); SP = 300
        for i in range(int(pos) - 2, int(pos) + 3):
            if 0 <= i < len(seq):
                d = i - pos; s = 250
                if t > t1 and i == pe: s = int(250 * (1 + 0.14 * math.sin(clamp((t - t1) / 0.35) * math.pi)))
                if abs(d) < 1.6: im = tile_img(seq[i], s); _ac(L, im, 190 - im.width // 2, int(235 + d * SP - im.height / 2))
        kb = 1 + min(10, v * 0.7)
        if kb > 1.3: L = L.resize((380, max(8, int(470 / kb))), Image.BILINEAR).resize((380, 470), Image.BILINEAR)
        m = ImageChops.multiply(L.getchannel('A'), reelmask(380, 470)); L.putalpha(m)
        fr.paste(L, cx - 190, cy - 235, a)
        if t > t1:
            ll = t - t1; rr = 120 + 260 * eo(ll / 0.6); od = fr.o()
            od.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=col + (int(200 * (1 - clamp(ll / 0.6))),), width=5)
            reveal(fr, tl(NAMES[seq[pe]].upper(), FM, 46, col), cx, cy + 300, ll - 0.05)
        else:
            q = tl('???', FM, 46, WHITE); fr.paste(q, cx - q.width / 2, cy + 300 - q.height / 2, a * (0.5 + 0.3 * math.sin(t * 6)))
HITS = [T_KN - 0.08, T_PH - 0.08, T_QD - 0.08]; KILL = T_CT - 0.45; CS = T_LUC - 0.2
def _bump(d):
    if d < -0.2: return 0.0
    if d < 0: return eio((d + 0.2) / 0.2)
    return max(0.0, 1 - eo(d / 0.5))
def _wind(d): return math.sin(clamp((d + 0.5) / 0.3) * math.pi) if -0.5 < d < -0.2 else 0.0
def s_clash(fr, lt, dur, t):
    l1 = t - T_KN + 0.15; l2 = t - T_PH + 0.15
    reveal(fr, tl('KỸ NĂNG', FM, 74, WHITE), W / 2 - 250, 170, l1); reveal(fr, tl('+', FM, 74, ORANGE), W / 2 + 10, 170, l2 + 0.1); reveal(fr, tl('PHỐI HỢP', FM, 74, GREEN), W / 2 + 280, 170, l2)
    ent = eo(lt / 0.6); bob = math.sin(t * 2.4) * 8
    c = max([_bump(t - h) for h in HITS] + [0]); wnd = max([_wind(t - h) for h in HITS] + [_wind(t - KILL)])
    dk = (t - KILL) * 1.25
    # left
    if dk < -0.2: lx, ly, lcw = lerp(560, 830, c) - 60 * wnd, 610 + bob - 40 * c, lerp(-10, 48, c) - 35 * wnd
    else:
        k = eio(clamp((dk + 0.2) / 0.2)); back = eo(clamp((dk - 0.15) / 0.6))
        lx, ly, lcw = lerp(lerp(560, 900, k), 560, back), 610 + bob - 40 * k * (1 - back), lerp(-10, 85, k) * (1 - back) + -10 * back
        if dk > 0.9: v = eo(clamp((dk - 0.9) / 0.9)); lx, ly, lcw = lerp(560, 960, v), lerp(610, 560, v) + bob, lcw * (1 - v)
    lx -= (1 - ent) * 900
    lang = 18 * math.sin(t * 1.3) if dk < 0.9 else (dk - 0.9) * 140
    lsz = 460 if dk < 0.9 else lerp(460, 540, eo(clamp((dk - 0.9) / 0.9)))
    put(fr, glow(GREEN, 230), lx, ly, a=0.7 * ent); put(fr, spin_img('Aegisblade', lang, lsz), lx, ly, lcw)
    # right
    if dk < 0:
        rx, ry, rcw = lerp(1360, 1090, c) + 60 * wnd, 610 - bob - 40 * c, lerp(10, -48, c) + 35 * wnd; ra, rt, rsc = 1.0, 0.0, 1.0
    else:
        k = eo(clamp(dk / 0.3)); rx, ry, rcw = lerp(1240, 1420, k), 600 - 30 * k, lerp(-20, 50, k)
        rt = clamp(1 - dk / 0.35) * 0.45 + (0.25 if dk < 0.3 and int(dk * 20) % 2 == 0 else 0); ra = 1 - clamp((dk - 0.28) / 0.12); rsc = 1 + 0.15 * clamp((dk - 0.25) / 0.15)
    rx += (1 - ent) * 900
    if ra > 0:
        put(fr, glow(ORANGE, 230), rx, ry, a=0.7 * ent * ra); put(fr, spin_img('Veilblade', -18 * math.sin(t * 1.3), 460), rx, ry, rcw, ra, min(1, rt), rsc)
    for i, h in enumerate(HITS):
        spark(fr, 960, 470, t - h, seed=3 + i, R=300); fr.hit(t - h, 0.2, 12)
    spark(fr, 1080, 520, dk, seed=9, R=360); fr.hit(dk, 0.3, 18)
    death(fr, 1420, 570, dk - 0.22)
    # hp bars
    ha = ent * (1 - clamp((dk - 1.3) / 0.4))
    if ha > 0:
        hl = hp_ct(t, [(HITS[1], 10, 9), (HITS[2], 9, 8)]); hr = hp_ct(t, [(HITS[0], 10, 7), (HITS[1], 7, 4), (HITS[2], 4, 2), (KILL, 2, 0)])
        hpbar(fr, 560 - (1 - ent) * 900, 330, hl, ha); hpbar(fr, 1360 + (1 - ent) * 900, 330, hr, ha)
        fr.paste(tl('AEGISBLADE', FI, 24, GREEN, 4, 'Bold'), 340 - (1 - ent) * 900, 270, ha); lb = tl('VEILBLADE', FI, 24, ORANGE, 4, 'Bold'); fr.paste(lb, 1580 - lb.width + (1 - ent) * 900, 270, ha)
    l = t - T_CT + 0.1
    if l > 0:
        p = bo(l / 0.45); im = tl('CHIẾN THẮNG!', FM, 120, GREEN); im = im.resize((max(2, int(im.width * p)), max(2, int(im.height * p))), Image.BILINEAR)
        fr.paste(im, W / 2 - im.width / 2, 880 - im.height / 2, clamp(l / 0.15))
def s_mr(fr, lt, dur, t):
    kicker(fr, 'MỖI TRẬN THẮNG', 140, 250, lt)
    ev = [EV[4] + 0.3, T_MR - 0.05, T_LEO + 0.35, T_DINH - 0.35]; val = 1350.0
    for e in ev: val += 25 * eo(clamp((t - e) / 0.35))
    reveal(fr, tl('MR', FI, 42, GREEN, 6, 'Bold'), 142, 345, lt - 0.1, anchor='lm')
    reveal(fr, tl(f'{int(round(val)):,}', FM, 190, WHITE), 132, 470, lt - 0.15, anchor='lm')
    for i, e in enumerate(ev):
        d = t - e
        if 0 < d < 1.0: c = tl('+25 MR', FI, 40, GREEN, 2, 'Bold'); fr.paste(c, 650, 430 - eo(d / 1.0) * 70, clamp(d / 0.12) * (1 - clamp((d - 0.6) / 0.4)))
    l = t - T_LEO + 0.3
    kicker(fr, 'LEO RANK', 140, 640, l, ORANGE)
    if l > 0:
        od = fr.o(); a = clamp(l / 0.3); x0, x1, y = 140, 900, 720; f = clamp((val - 1300) / 250)
        od.rounded_rectangle((x0, y - 9, x1, y + 9), 9, fill=(255, 255, 255, int(34 * a))); od.rounded_rectangle((x0, y - 9, x0 + (x1 - x0) * f * eo(l / 0.6), y + 9), 9, fill=ORANGE + (int(240 * a),))
        reveal(fr, tl('ĐỈNH BẢNG XẾP HẠNG', FI, 28, ORANGE, 4, 'Bold'), x1, 770, l - 0.2, anchor='rm')
    card(fr, 'lb_mr', 1010, 300, 780, 593, lt - 0.35, 'BẢNG XẾP HẠNG · MR', ORANGE, 0.05, 0)
    l = t - T_DINH + 0.1
    if l > 0:
        od = fr.o(); pp = 0.5 + 0.5 * math.sin(l * 6); od.rounded_rectangle((1010 - 6, 300 - 6, 1790 + 6, 300 + 250), 24, outline=ORANGE + (int(lerp(120, 255, pp) * clamp(l / 0.2)),), width=5)
def s_champ(fr, lt, dur, t):
    kicker(fr, 'ĐỈNH CAO NHẤT CỦA RANKED', W / 2, 270, lt + 0.05, ORANGE, 'm')
    l = t - T_CH5 + 0.3
    if l > 0:
        od = fr.o(); a = clamp(l / 0.4)
        for i in range(18):
            ang = i / 18 * 6.283 + t * 0.15; r0, r1 = 250, 900
            od.polygon([(W / 2 + math.cos(ang - 0.04) * r0, 560 + math.sin(ang - 0.04) * r0), (W / 2 + math.cos(ang - 0.08) * r1, 560 + math.sin(ang - 0.08) * r1), (W / 2 + math.cos(ang + 0.08) * r1, 560 + math.sin(ang + 0.08) * r1), (W / 2 + math.cos(ang + 0.04) * r0, 560 + math.sin(ang + 0.04) * r0)], fill=(255, 170, 90, int(6 * a)))
        q = bo(l / 0.5); cr = CROWN.resize((int(CROWN.width * q), int(CROWN.height * q)), Image.NEAREST); fr.paste(cr, W / 2 - cr.width / 2, 395 - cr.height / 2 - (1 - q) * 30 + math.sin(t * 2.5) * 5, a)
    stagger(fr, 'CHAMPION', FM, 200, ORANGE, W / 2, 580, l - 0.1, 0.04)
    uline(fr, W / 2 - 320, W / 2 + 320, 720, (l - 0.6) / 0.5, ORANGE)
def s_top(fr, lt, dur, t):
    card(fr, 'lb_champ', 120, 260, 760, 607, lt - 0.05, 'CHAMPION · TOP 10', ORANGE, 0.05, 0)
    cx = 1390
    kicker(fr, 'CHỈ DÀNH CHO', cx, 250, t - T_TOP + 0.5, GREEN, 'm')
    reveal(fr, tl('TOP 10', FM, 170, WHITE), cx, 360, t - T_TOP + 0.15)
    pill(fr, 'RANK CHAMPION', cx, 485, t - T_CH6 + 0.1, ORANGE, size=30)
    l = t - T_TRIM + 0.3
    if l > 0:
        p = bo(l / 0.55); sh = 0.5 + 0.5 * math.sin((t - T_TRIM) * 3.2)
        im = chest(sh); im = im.resize((int(im.width * p), int(im.height * p)), Image.NEAREST)
        put(fr, glow(ORANGE, 210), cx, 690, a=0.55 * clamp(l / 0.3)); fr.paste(im, cx - im.width / 2, 690 - im.height / 2 + math.sin(t * 2) * 6, clamp(l / 0.2))
        lk = t - T_KCC + 0.1
        if lk > 0: q = bo(lk / 0.4); lo = LOCK.resize((int(LOCK.width * q), int(LOCK.height * q)), Image.NEAREST); fr.paste(lo, cx + 70, 735 - lo.height / 2); fr.hit(lk, 0.15, 6)
    reveal(fr, tl('ARMOR TRIM', FM, 60, WHITE), cx, 860, t - T_TRIM - 0.1)
    reveal(fr, tl('ĐỘC QUYỀN', FM, 60, ORANGE), cx, 932, t - T_DQ + 0.05)
def s_only(fr, lt, dur, t):
    for i, (txt, tt, col, ok) in enumerate((('KHÔNG MUA ĐƯỢC', T_KM, WHITE, False), ('KHÔNG ĐỔI ĐƯỢC', T_KD, WHITE, False), ('CHỈ BẰNG KỸ NĂNG', T_CHI, GREEN, True))):
        y = 380 + i * 165 + (20 if ok else 0); l = t - tt + 0.1
        (check if ok else xmark)(fr, 220, y, (l - 0.1) / 0.4)
        sz = fit(txt, FM, 88 if ok else 74, 820); reveal(fr, tl(txt, FM, sz, col), 300, y, l, anchor='lm')
        if not ok: strike(fr, 300, 300 + tl(txt, FM, sz, col).width, y + 4, (l - 0.45) / 0.3, RED)
    uline(fr, 300, 1100, 760, (t - T_KN7 - 0.1) / 0.5)
    q = eo((lt - 0.1) / 0.7)
    if q > 0:
        cy = 560 + math.sin(t * 2) * 10; put(fr, glow(GREEN, 300), 1500, cy, a=0.7 * q); put(fr, spin_img('Aegisblade', t * 38, 560), 1500 + (1 - q) * 300, cy, 0, q)
def s_end(fr, lt, dur, t):
    if t < T_DN - 0.1:
        fr.amul = clamp((T_DN - 0.1 - t) / 0.3); fr.oy = -(1 - fr.amul) * 40
        row(fr, [(tl('Còn chờ ', FI, 66, WHITE, 0, 'SemiBold'), 0), (tl('gì nữa?', FI, 66, ORANGE, 0, 'Bold'), 0.1)], W / 2, 380, lt + 0.05)
        stagger(fr, 'RỦ NGAY ĐỒNG ĐỘI', FM, 130, WHITE, W / 2, 540, t - T_RU + 0.2, 0.03)
        fr.amul = 1.0; fr.oy = 0
    l = t - T_DN + 0.1
    if l > 0:
        p = ex(l / 0.8); lg = logo(int(lerp(780, 840, eo(l / 8))))
        fr.paste(lg, W / 2 - lg.width / 2, 360 - lg.height / 2 + (1 - p) * 40, clamp(l / 0.4))
        uline(fr, W / 2 - 200, W / 2 + 200, 540, (l - 0.5) / 0.5)
        reveal(fr, tl('newgenmc.net', FM, 64, WHITE), W / 2, 620, l - 0.6)
        w1 = tl('RANKED 2VS2', FI, 34, INK, 2, 'Bold').width + 40; w2 = tl('TEAM MẠNH NHẤT SERVER', FI, 34, INK, 2, 'Bold').width + 40; x0 = W / 2 - (w1 + w2 + 28) / 2
        pill(fr, 'RANKED 2VS2', x0 + w1 / 2, 750, t - T_CM + 0.1, GREEN); pill(fr, 'TEAM MẠNH NHẤT SERVER', x0 + w1 + 28 + w2 / 2, 750, t - T_MANH + 0.1, ORANGE)
        reveal(fr, tl('ĐĂNG NHẬP NGAY HÔM NAY', FI, 32, GREEN, 8, 'Bold'), W / 2, 860, t - T_END + 0.2)
        for i, (n, x, col) in enumerate((('Aegisblade', 250, GREEN), ('Veilblade', 1670, ORANGE))):
            q = eo((l - 0.3 - i * 0.12) / 0.7)
            if q > 0: cy = 520 + math.sin(t * 2 + i) * 10; put(fr, glow(col, 230), x, cy, a=0.6 * q); put(fr, spin_img(n, t * 38 + i * 180, 440), x + (1 - q) * (-300 if i == 0 else 300), cy, 0, q)
    fr.fade = clamp((lt - (dur - 0.7)) / 0.7)
CHAP = [(0, '01', 'RANKED 2VS2'), (EV[2] - 0.1, '02', 'VŨ KHÍ HUYỀN THOẠI'), (EV[3] - 0.1, '03', 'NGẪU NHIÊN'), (CS, '04', 'ĐỐI ĐẦU'), (EV[4] - 0.1, '05', 'LEO RANK'),
        (EV[5] - 0.1, '06', 'CHAMPION'), (EV[6] - 0.1, '07', 'PHẦN THƯỞNG'), (EV[8] - 0.1, '08', 'THAM GIA')]
SCENES = [(0.0, T_VAY - 0.15, s_q), (T_VAY - 0.15, EV[2] - 0.1, s_title), (EV[2] - 0.1, EV[3] - 0.1, s_arms), (EV[3] - 0.1, CS, s_roll), (CS, EV[4] - 0.1, s_clash),
          (EV[4] - 0.1, EV[5] - 0.1, s_mr), (EV[5] - 0.1, EV[6] - 0.1, s_champ), (EV[6] - 0.1, EV[8] - 0.1, s_top), (EV[8] - 0.1, TOTAL, s_end)]
KINDS = ['zoom', 'push', 'rise', 'focus', 'push', 'zoom', 'rise', 'focus', 'zoom']
_src = open('tools/mg_scenes.py').read(); exec(_src[_src.index('OUT_PRE, OUT_LEN'):])
OUT_PRE, OUT_LEN, IN_LEN = 0.2, 0.38, 0.42

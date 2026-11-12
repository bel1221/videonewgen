# NewGen Battle Royale video (typography style, same engine as Ranked 2vs2).
# python -X utf8 tools/br_scenes.py F0 F1 out.mp4 | still t1,t2,..
exec(open('tools/mg.py', encoding='utf8').read())
TOTAL = round(T_END + 2.6, 2)
SPD = 1.35
_r0, _s0, _k0, _p0, _sp0 = reveal, stagger, kicker, pill, spark
def reveal(fr, lay, x, y, lt, d=0.6, anchor='mm', a=1.0): return _r0(fr, lay, x, y, lt * SPD, d, anchor, a)
def stagger(fr, s, p, size, fill, cx, cy, lt, step=0.03, track=0, var=None, anchor='m'): return _s0(fr, s, p, size, fill, cx, cy, lt * SPD, step, track, var, anchor)
def kicker(fr, s, x, y, lt, col=GREEN, anchor='l'): return _k0(fr, s, x, y, lt * SPD, col, anchor)
def pill(fr, s, cx, cy, lt, col=GREEN, fg=INK, size=34): return _p0(fr, s, cx, cy, lt * SPD, col, fg, size)
def spark(fr, cx, cy, lt, n=14, life=0.6, R=260, seed=1): return _sp0(fr, cx, cy, lt * 1.2, n, life, R, seed)
def row(fr, parts, cx, cy, lt, d=0.55):
    ws = [p[0].width for p in parts]; x = cx - (sum(ws)) / 2
    for (lay, dl), w_ in zip(parts, ws): reveal(fr, lay, x, cy, lt - dl, d, anchor='lm'); x += w_
# ---------- assets ----------
NF = 144
SPK = {k: np.load(f'src/spin_{k}.npy', mmap_mode='r') for k in ('blinkblade', 'bloodchain', 'boltspear', 'tidepiercer', 'jingubang')}
def spin_img(name, ang, s):
    S_ = SPK[name]; x = (ang % 360) / 2.5; f0 = int(x) % NF; f1 = (f0 + 1) % NF; w = x - int(x)
    a0 = S_[f0].astype(np.float32); a1 = S_[f1].astype(np.float32)
    al = a0[..., 3:] * (1 - w) + a1[..., 3:] * w; pm = a0[..., :3] * a0[..., 3:] * (1 - w) + a1[..., :3] * a1[..., 3:] * w
    rgb = pm / np.maximum(al, 1e-3); im = Image.fromarray(np.concatenate([rgb, al], -1).clip(0, 255).astype(np.uint8), 'RGBA')
    s = max(8, int(s)); return im.resize((s, s), Image.LANCZOS)
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
# Heart bar. HT = clip FRAME at which exactly k hearts are left, measured from the keyed clip by counting red pixels
# (tools/hp_table.py -> src/hp_table.json). The old hand-written table put 0 hearts at 11.0 s, where the clip still shows 1.
HP = np.load('src/hp_keyed.npy'); HP = [Image.fromarray(f).resize((448, int(448 * f.shape[0] / f.shape[1])), Image.NEAREST) for f in HP]
HT = {int(k): min(len(HP) - 1, v + (4 if int(k) == 0 else 1)) for k, v in json.load(open('src/hp_table.json')).items()}
def hp_ct(t, ev):
    ct = HT[ev[0][1]]
    for tt, h0, h1 in ev:
        if t >= tt: ct = lerp(HT[h0], HT[h1], clamp((t - tt) / 0.4))
    return ct
def hpbar(fr, cx, cy, ct, a=1.0):
    im = HP[min(len(HP) - 1, int(round(ct)))]; fr.paste(im, cx - im.width / 2, cy - im.height / 2, a)
DEATH = np.load('src/death_keyed.npy'); DS = 1.7
def death(fr, cx, cy, lt):
    k = 16 + int(lt * 30)
    if lt < 0 or k >= len(DEATH): return
    im = Image.fromarray(DEATH[k]); s = int(im.width * DS); im = im.resize((s, s), Image.BILINEAR)
    fr.paste(im, cx - 241 * DS, cy - 296 * DS)
# Minecraft item textures from the user's installed game (src/mc)
_mc = {}
def mc(name, s):
    k = (name, s)
    if k not in _mc: _mc[k] = Image.open(f'src/mc/{name}.png').convert('RGBA').resize((s, s), Image.NEAREST)
    return _mc[k]
_hot = []
def mc_hot():
    if not _hot:
        h = Image.open('src/mc/hotbar.png').convert('RGBA'); _hot.append(h.resize((h.width * 4, h.height * 4), Image.NEAREST))
    return _hot[0]
def icon_pop(fr, im, cx, cy, lt, d=0.22, rot=0.0, a=1.0):
    if lt <= 0: return
    p = bo(lt / d); s = max(2, int(im.width * p)); im2 = im.resize((s, s), Image.NEAREST)
    if abs(rot) > 0.3: im2 = im2.rotate(rot, resample=Image.NEAREST, expand=True)
    fr.paste(im2, cx - im2.width / 2, cy - im2.height / 2, clamp(lt / 0.08) * a)
# Recipes: the user's own pictures (src/recipes). Slots are found from the flat colours; nothing is redrawn.
BGC = np.array([240, 185, 120]); SLC = np.array([201, 131, 95]); RK = 4
def _runs(m):
    r = []; s = None
    for i, v in enumerate(list(m) + [False]):
        if v and s is None: s = i
        if not v and s is not None: r.append((s, i)); s = None
    return r
def _comp(dst, src, x, y):
    x, y = int(x), int(y); w, h = src.size; x0, y0 = max(0, x), max(0, y); x1, y1 = min(dst.width, x + w), min(dst.height, y + h)
    if x1 <= x0 or y1 <= y0: return
    if (x0, y0, x1, y1) != (x, y, x + w, y + h): src = src.crop((x0 - x, y0 - y, x1 - x, y1 - y))
    dst.alpha_composite(src, (x0, y0))
def _load_recipe(key):
    a = np.asarray(Image.open(f'src/recipes/r_{key}.png').convert('RGB')).copy(); nb = (a != BGC).any(2)
    cr = _runs(nb.any(0)); g = max(cr, key=lambda r: r[1] - r[0]); rs = cr[-1]
    gy = max(_runs(nb[:, g[0]:g[1]].any(1)), key=lambda r: r[1] - r[0]); ry = max(_runs(nb[:, rs[0]:rs[1]].any(1)), key=lambda r: r[1] - r[0])
    cw = (g[1] - g[0]) / 3; chh = (gy[1] - gy[0]) / 3; IN = 3; items = []
    def cut(x0, y0, x1, y1):
        c = a[y0:y1, x0:x1].copy(); al = ((c != SLC).any(2) * 255).astype(np.uint8)
        if (al > 0).sum() < 12: return None
        sp = Image.fromarray(np.dstack([c, al]), 'RGBA'); a[y0:y1, x0:x1] = SLC
        return sp.resize((sp.width * RK, sp.height * RK), Image.NEAREST), sp
    for j in range(3):
        for i in range(3):
            x0 = int(round(g[0] + i * cw)) + IN; x1 = int(round(g[0] + (i + 1) * cw)) - IN; y0 = int(round(gy[0] + j * chh)) + IN; y1 = int(round(gy[0] + (j + 1) * chh)) - IN
            c = cut(x0, y0, x1, y1)
            if c: items.append(((x0 + x1) / 2 * RK, (y0 + y1) / 2 * RK, c[0], (i, j)))
    res = cut(rs[0] + IN, ry[0] + IN, rs[1] - IN, ry[1] - IN)
    base = Image.fromarray(a).resize((a.shape[1] * RK, a.shape[0] * RK), Image.NEAREST).convert('RGBA'); base.putalpha(rmask(base.width, base.height, 26))
    # centre item first (the weapon), then the rest in reading order
    items.sort(key=lambda it: (it[3] != (1, 1), it[3][1], it[3][0]))
    return {'base': base, 'items': items, 'res': ((rs[0] + rs[1]) / 2 * RK, (ry[0] + ry[1]) / 2 * RK, res[0]), 'icon': res[1]}
REC = {k: _load_recipe(k) for k in ('blinkblade', 'bloodchain', 'boltspear', 'tidepiercer', 'jingubang')}
_ic = {}
def wicon(key, s):
    k = (key, s)
    if k not in _ic:
        im = Image.open('src/mc/diamond_sword.png').convert('RGBA') if key == 'diamond_sword' else REC[key]['icon']
        im = im.crop(im.getbbox()); m = max(im.size); sq = Image.new('RGBA', (m, m), (0, 0, 0, 0)); sq.alpha_composite(im, ((m - im.width) // 2, (m - im.height) // 2))
        _ic[k] = sq.resize((s, s), Image.NEAREST)
    return _ic[k]
def craft_times(key, D):
    n = len(REC[key]['items']); step = min(0.12, D * 0.42 / n); return [0.14 + i * step for i in range(n)], 0.14 + n * step + 0.1
def craft(fr, key, cx, cy, l, D):
    R = REC[key]; a = clamp(l / 0.14) * (1 - clamp((l - D) / 0.14))
    if a <= 0: return None
    L = R['base'].copy(); ts, tr = craft_times(key, D)
    for (ix, iy, sp, _), ti in zip(R['items'], ts):
        li = l - ti
        if li <= 0: continue
        p = bo(li / 0.2); s2 = (max(2, int(sp.width * p)), max(2, int(sp.height * p))); _comp(L, sp.resize(s2, Image.NEAREST), ix - s2[0] / 2, iy - s2[1] / 2)
    lr = l - tr; rx, ry, rsp = R['res']
    if lr > 0:
        p = bo(lr / 0.26); s2 = (max(2, int(rsp.width * p)), max(2, int(rsp.height * p))); _comp(L, rsp.resize(s2, Image.NEAREST), rx - s2[0] / 2, ry - s2[1] / 2)
    q = eo(l / 0.3); x0 = cx - L.width / 2; y0 = cy - L.height / 2 + (1 - q) * 26
    fr.paste(shadow(L.width, L.height), x0 - 60, y0 - 60, a); fr.paste(L, x0, y0, a)
    if 0 < lr < 0.5:
        rr = 40 + 170 * eo(lr / 0.5); fr.o().ellipse((x0 + rx - rr, y0 + ry - rr, x0 + rx + rr, y0 + ry + rr), outline=(255, 255, 255, int(220 * (1 - lr / 0.5) * a)), width=6)
    return lr
def feedrow(fr, xr, y, killer, wkey, victim, lt, hero=False, s=1.0, a=1.0):
    if lt <= 0 or a <= 0: return
    fs = int(34 * s); kn = tl(killer, FI, fs, GREEN if hero else WHITE, 0, 'Bold'); vn = tl(victim, FI, fs, WHITE, 0, 'SemiBold'); ic = wicon(wkey, int(52 * s) // 4 * 4)
    gap = int(8 * s); wt = kn.width + vn.width + ic.width + gap * 2 + int(16 * s); h = int(70 * s)
    p = eo(lt / 0.28); al = clamp(lt / 0.16) * a; x0 = xr - wt + (1 - p) * 140
    col = GREEN if hero else WHITE
    fr.o().rounded_rectangle((x0, y - h / 2, x0 + wt, y + h / 2), int(16 * s), fill=INK + (int(200 * al),), outline=col + (int((170 if hero else 45) * al),), width=2)
    x = x0 + int(8 * s); fr.paste(kn, x, y - kn.height / 2, al); x += kn.width + gap; fr.paste(ic, x, y - ic.height / 2, al); x += ic.width + gap; fr.paste(vn, x, y - vn.height / 2, al)
def glint(lg, p):
    a = np.asarray(lg).astype(np.float32); h, w = a.shape[:2]
    xx = np.arange(w)[None, :] + (np.arange(h)[:, None] - h / 2) * 0.5
    band = np.exp(-((xx - lerp(-0.3 * w, 1.3 * w, p)) / (w * 0.06)) ** 2)
    a[..., :3] = np.clip(a[..., :3] + 255 * band[..., None] * 0.9, 0, 255); return Image.fromarray(a.astype(np.uint8), 'RGBA')
# ---------- duel (weapon vs weapon, heart bars, kill) ----------
def _bump(d):
    if d < -0.2: return 0.0
    if d < 0: return eio((d + 0.2) / 0.2)
    return max(0.0, 1 - eo(d / 0.5))
def _wind(d): return math.sin(clamp((d + 0.5) / 0.3) * math.pi) if -0.5 < d < -0.2 else 0.0
def duel(fr, t, t0, hits, kill, lk, rk, ln, rn, hl, hr, win=False):
    lt = t - t0
    if lt <= 0: return
    ent = eo(lt / 0.6); bob = math.sin(t * 2.4) * 8
    c = max([_bump(t - h) for h in hits] + [0]); wnd = max([_wind(t - h) for h in hits] + [_wind(t - kill)])
    dk = (t - kill) * 1.25
    if dk < -0.2: lx, ly, lcw = lerp(560, 830, c) - 60 * wnd, 610 + bob - 40 * c, lerp(-10, 48, c) - 35 * wnd
    else:
        k = eio(clamp((dk + 0.2) / 0.2)); back = eo(clamp((dk - 0.15) / 0.6))
        lx, ly, lcw = lerp(lerp(560, 900, k), 560, back), 610 + bob - 40 * k * (1 - back), lerp(-10, 85, k) * (1 - back) + -10 * back
        if win and dk > 0.9: v = eo(clamp((dk - 0.9) / 0.9)); lx, ly, lcw = lerp(560, 960, v), lerp(610, 540, v) + bob, lcw * (1 - v)
    lx -= (1 - ent) * 900
    spinning = win and dk >= 0.9
    lang = (dk - 0.9) * 140 if spinning else 18 * math.sin(t * 1.3)
    lsz = lerp(460, 540, eo(clamp((dk - 0.9) / 0.9))) if spinning else 460
    put(fr, glow(GREEN, 230), lx, ly, a=0.7 * ent); put(fr, spin_img(lk, lang, lsz), lx, ly, lcw)
    if dk < 0:
        rx, ry, rcw = lerp(1360, 1090, c) + 60 * wnd, 610 - bob - 40 * c, lerp(10, -48, c) + 35 * wnd; ra, rt, rsc = 1.0, 0.0, 1.0
    else:
        k = eo(clamp(dk / 0.3)); rx, ry, rcw = lerp(1240, 1420, k), 600 - 30 * k, lerp(-20, 50, k)
        rt = clamp(1 - dk / 0.35) * 0.45 + (0.25 if dk < 0.3 and int(dk * 20) % 2 == 0 else 0); ra = 1 - clamp((dk - 0.28) / 0.12); rsc = 1 + 0.15 * clamp((dk - 0.25) / 0.15)
    rx += (1 - ent) * 900
    if ra > 0:
        put(fr, glow(ORANGE, 230), rx, ry, a=0.7 * ent * ra); put(fr, spin_img(rk, -18 * math.sin(t * 1.3), 460), rx, ry, rcw, ra, min(1, rt), rsc)
    for i, h in enumerate(hits):
        spark(fr, 960, 470, t - h, seed=3 + i, R=300); fr.hit(t - h, 0.2, 12)
    spark(fr, 1080, 520, dk, seed=9, R=360); fr.hit(dk, 0.3, 18)
    death(fr, 1420, 570, dk - 0.22)
    hal = ent * (1 - clamp((dk - 2.6) / 0.4)) if win else ent; har = ent * (1 - clamp((dk - 1.9) / 0.4))
    if hal > 0:
        hpbar(fr, 560 - (1 - ent) * 900, 330, hp_ct(t, hl), hal); fr.paste(tl(ln, FI, 24, GREEN, 4, 'Bold'), 340 - (1 - ent) * 900, 270, hal)
    if har > 0:
        hpbar(fr, 1360 + (1 - ent) * 900, 330, hp_ct(t, hr), har); lb = tl(rn, FI, 24, ORANGE, 4, 'Bold'); fr.paste(lb, 1580 - lb.width + (1 - ent) * 900, 270, har)
# ---------- scenes ----------
_dr = random.Random(5); DOT_ORDER = [i for i in range(11) if i != 6]; _dr.shuffle(DOT_ORDER)
DOT_T = {j: T_NGUOI1 + 0.3 + k * 0.09 for k, j in enumerate(DOT_ORDER)}
def s_hook(fr, lt, dur, t):
    reveal(fr, tl('Bạn có đủ sức trở thành', FI, 58, WHITE, 0, 'SemiBold'), W / 2, 285, lt + 0.1)
    reveal(fr, tl('NGƯỜI SỐNG SÓT', FM, 140, WHITE), W / 2, 425, t - T_NGUOI1 + 0.4)
    reveal(fr, tl('CUỐI CÙNG?', FM, 160, ORANGE), W / 2, 590, t - T_CUOI1 + 0.35)
    l = t - T_NGUOI1 + 0.3
    if l > 0:
        od = fr.o(); done = t > max(DOT_T.values()) + 0.1
        for i in range(11):
            a = clamp((l - i * 0.025) / 0.2)
            if a <= 0: continue
            x = W / 2 + (i - 5) * 92; y = 790 + (1 - eo((l - i * 0.025) / 0.3)) * 24; r = 30
            if i == 6:
                pu = 0.5 + 0.5 * math.sin((t - T_CUOI1) * 7) if done else 0; col = GREEN if done else WHITE
                if done: rr = r + 10 + 8 * pu; od.rounded_rectangle((x - rr, y - rr, x + rr, y + rr), 16, outline=GREEN + (int(150 * (1 - pu * 0.5)),), width=4)
                od.rounded_rectangle((x - r, y - r, x + r, y + r), 10, fill=col + (int(240 * a),))
            else:
                d = t - DOT_T[i]
                if d < 0: od.rounded_rectangle((x - r, y - r, x + r, y + r), 10, fill=WHITE + (int(240 * a),))
                else:
                    k = eo(d / 0.25); r2 = r * (1 - 0.3 * k); od.rounded_rectangle((x - r2, y - r2 + 14 * k, x + r2, y + r2 + 14 * k), 10, fill=RED + (int(230 * (1 - k)),), outline=WHITE + (int(60 * a),), width=3)
def s_title(fr, lt, dur, t):
    kicker(fr, 'HÃY THỬ NGAY CHẾ ĐỘ', W / 2, 250, lt + 0.05, GREEN, 'm')
    stagger(fr, 'BATTLE', FM, 170, WHITE, W / 2, 420, t - T_BATTLE + 0.3, 0.04)
    l = t - T_ROYALE + 0.25
    if l > 0:
        p = bo(l / 0.5); im = tl('ROYALE', FM, 210, ORANGE); im2 = im.resize((max(2, int(im.width * p)), max(2, int(im.height * p))), Image.BILINEAR)
        fr.paste(im2, W / 2 - im2.width / 2, 640 - im2.height / 2, clamp(l / 0.15)); fr.hit(l - 0.15, 0.2, 10)
    for i, (n, x, cw, col) in enumerate((('blinkblade', 300, -18, GREEN), ('bloodchain', 1620, 18, ORANGE))):
        q = eo((lt - 0.1 - i * 0.12) / 0.7)
        if q <= 0: continue
        xx = x + (1 - q) * (-500 if i == 0 else 500); yy = 560 + math.sin(t * 2 + i) * 12
        put(fr, glow(col, 260), xx, yy, a=0.8 * q); put(fr, spin_img(n, t * 40 + i * 90, 480), xx, yy, cw, q)
def _clock(fr, sec, x, y, size, a=1.0, col=WHITE, centre=False):
    s = f'{int(sec) // 60:02d}:{int(sec) % 60:02d}'; cw = size * 0.7; ws = [cw * 0.45 if c == ':' else cw for c in s]
    if centre: x = x - sum(ws) / 2
    for c, w_ in zip(s, ws):
        g = tl(c, FM, size, col); fr.paste(g, x + w_ / 2 - g.width / 2, y - g.height / 2, a); x += w_
def s_prep(fr, lt, dur, t):
    kicker(fr, '10 PHÚT ĐẦU TIÊN', 140, 290, lt)
    u = eio(clamp((lt - 0.2) / (dur - 0.75))); a = clamp(lt / 0.3)
    _clock(fr, 600 * u, 132, 450, 210, a)
    od = fr.o(); x0, x1, y = 140, 850, 610
    od.rounded_rectangle((x0, y - 8, x1, y + 8), 8, fill=(255, 255, 255, int(36 * a))); od.rounded_rectangle((x0, y - 8, x0 + max(16, (x1 - x0) * u), y + 8), 8, fill=GREEN + (int(240 * a),))
    reveal(fr, tl('CHUẨN BỊ TRƯỚC KHI GIAO TRANH', FI, 28, ORANGE, 4, 'Bold'), x0, 668, lt - 0.3, anchor='lm')
    X = 1010
    l = t - T_DAO + 0.3
    reveal(fr, tl('ĐÀO KHOÁNG SẢN', FM, 62, WHITE), X, 290, l, anchor='lm')
    for i, n in enumerate(('wooden_pickaxe', 'iron_pickaxe', 'diamond_pickaxe')):
        li = l - 0.2 - i * 0.14; icon_pop(fr, mc(n, 96), X + 58 + i * 124, 388, li, rot=(math.sin(t * 9) * 16 if i == 2 and li > 0.3 else 0))
    l = t - T_THU + 0.3
    p1 = tl('THU THẬP ', FM, 62, WHITE); reveal(fr, p1, X, 530, l, anchor='lm'); reveal(fr, tl('TÀI NGUYÊN', FM, 62, GREEN), X + p1.width - 20, 530, l - 0.1, anchor='lm')
    for i, n in enumerate(('coal', 'raw_iron', 'gold_ingot', 'diamond', 'ender_pearl')):
        li = l - 0.2 - i * 0.1; icon_pop(fr, mc(n, 96), X + 58 + i * 124, 628 + (math.sin(t * 3 + i) * 4 if li > 0.3 else 0), li)
    l = t - T_TRANG + 0.3
    reveal(fr, tl('TRANG BỊ', FM, 62, ORANGE), X, 770, l, anchor='lm')
    for i, n in enumerate(('iron_helmet', 'iron_chestplate', 'iron_leggings', 'iron_boots')):
        li = l - 0.2 - i * 0.1; icon_pop(fr, mc(n, 96), X + 58 + i * 124, 868, li)
T_C0 = T_CHETAO + 0.25
CRAFTS = []; _tt = T_C0
for _k, _n, _d, _c in (('blinkblade', 'BLINKBLADE', 1.75, GREEN), ('bloodchain', 'BLOODCHAIN', 1.2, ORANGE), ('boltspear', 'BOLTSPEAR', 1.15, GREEN), ('tidepiercer', 'TIDEPIERCER', 1.1, ORANGE), ('jingubang', 'JINGU BANG', 1.05, GREEN)):
    CRAFTS.append((_k, _n, _tt, _d, _c)); _tt += _d
def s_craft(fr, lt, dur, t):
    kicker(fr, 'CÓ ĐỦ NGUYÊN LIỆU?', W / 2, 112, lt + 0.05, GREEN, 'm')
    row(fr, [(tl('CHẾ TẠO ', FM, 84, WHITE), 0), (tl('VŨ KHÍ HUYỀN THOẠI', FM, 84, ORANGE), 0.12)], W / 2, 200, t - T_CHETAO + 0.35)
    reveal(fr, tl('MỖI VŨ KHÍ · MỘT CÔNG THỨC RIÊNG', FI, 28, GREEN, 6, 'Bold'), W / 2, 288, t - T_MOI + 0.2)
    for key, name, t0, D, col in CRAFTS:
        l = t - t0
        if l <= 0 or l > D + 0.16: continue
        lr = craft(fr, key, 650, 660, l, D); a = 1 - clamp((l - D) / 0.14)
        if lr is not None and lr > 0:
            q = bo(lr / 0.35); cy = 620 + math.sin(t * 2.2) * 8
            put(fr, glow(col, 250), 1490, cy, a=0.75 * clamp(lr / 0.2) * a); put(fr, spin_img(key, 20 + lr * 150, max(8, 520 * q)), 1490, cy, 0, clamp(lr / 0.1) * a)
            nm = tl(name, FM, 58, col); fr.paste(nm, 1490 - nm.width / 2, 905 - nm.height / 2 + (1 - eo(lr / 0.3)) * 20, clamp((lr - 0.05) / 0.15) * a)
FK1 = T_KHAC + 0.05; FH1 = T_GUC + 0.02; FD0 = T_HA - 0.42
LOOT = ('diamond_helmet', 'diamond_chestplate', 'boltspear', 'golden_apple', 'diamond')
def s_fight(fr, lt, dur, t):
    if t < FD0 + 0.3:
        fr.amul = clamp((FD0 + 0.3 - t) / 0.3); fr.oy = -(1 - fr.amul) * 40
        kicker(fr, 'SAU 10 PHÚT CHUẨN BỊ', W / 2, 240, lt + 0.05, GREEN, 'm')
        pu = 1 + 0.03 * math.sin(lt * 9) * clamp(1 - lt / 1.2)
        _clock(fr, 600, W / 2, 410, int(230 * pu), clamp(lt / 0.25) * fr.amul, WHITE, True)
        row(fr, [(tl('TRẬN CHIẾN ', FM, 124, WHITE), 0), (tl('BẮT ĐẦU', FM, 124, ORANGE), 0.12)], W / 2, 650, t - T_TRAN + 0.35)
        fr.hit(t - T_TRAN + 0.1, 0.22, 12)
        fr.amul = 1.0; fr.oy = 0
    if t > FD0:
        reveal(fr, tl('HẠ GỤC NGƯỜI CHƠI KHÁC', FM, 70, WHITE), W / 2, 160, t - T_HA + 0.2)
        duel(fr, t, FD0, [FH1], FK1, 'blinkblade', 'boltspear', 'BUNN9', 'ZEROLY', [(FH1, 10, 10)], [(FH1, 10, 4), (FK1, 4, 0)])
        feedrow(fr, W - 70, 800, 'Bunn9', 'blinkblade', 'Zeroly', t - FK1 - 0.3, True, 1.1)
        l = t - T_DO + 0.25
        if l > 0:
            hb = mc_hot(); hx, hy = W / 2 - hb.width / 2, 900; fr.paste(hb, hx, hy + (1 - eo(l / 0.35)) * 60, clamp(l / 0.2))
            for j, n in enumerate(LOOT):
                lj = l - 0.12 - j * 0.07
                if lj <= 0: continue
                im = wicon(n, 64) if n == 'boltspear' else mc(n, 64)
                ang = -2.5 + j * 0.55; bx, by = 1420 + math.cos(ang) * 150, 570 + math.sin(ang) * 120; sx, sy = hx + (11 + 20 * (j + 2)) * 4, hy + 44
                if lj < 0.25: k = eo(lj / 0.25); x, y = lerp(1420, bx, k), lerp(570, by, k)
                else: k = eio(clamp((lj - 0.25) / 0.45)); x, y = lerp(bx, sx, k), lerp(by, sy, k) - math.sin(k * math.pi) * 60
                icon_pop(fr, im, x, y, lj, 0.18)
        pill(fr, 'LẤY HẾT ĐỒ', W / 2, 838, t - T_THUOC + 0.1, GREEN)
FEED = [('M4Lang', 'tidepiercer', 'Bikoji', False), ('EllySilverArrow', 'jingubang', 'mjioha', False), ('Aiufuon', 'bloodchain', 'HaChi', False), ('Bunn9', 'blinkblade', 'Drak', True),
        ('Miyozi', 'diamond_sword', 'oKhangz', False), ('Aiufuon', 'bloodchain', 'Miyozi', False), ('M4Lang', 'tidepiercer', 'EllySilverArrow', False), ('Bunn9', 'blinkblade', 'M4Lang', True)]
_fa = EV[5] + 0.25
FT = [_fa + (T_HAI - _fa) * (1 - (1 - i / 7) ** 1.5) for i in range(8)]
def s_feed(fr, lt, dur, t):
    n = sum(1 for x in FT if t >= x); left = 10 - n; last = max([x for x in FT if t >= x] + [-9])
    kicker(fr, 'CÒN LẠI', 180, 300, lt)
    p = lerp(0.82, 1.0, bo((t - last) / 0.22)) if n else 1.0; col = ORANGE if left == 2 else WHITE
    num = tl(str(left), FM, 400, col); num2 = num.resize((max(2, int(num.width * p)), max(2, int(num.height * p))), Image.BILINEAR)
    fr.paste(num2, 360 - num2.width / 2, 560 - num2.height / 2, clamp(lt / 0.25))
    if left == 2: fr.hit(t - last, 0.2, 10)
    reveal(fr, tl('NGƯỜI CHƠI', FI, 44, WHITE, 6, 'Bold'), 360, 820, lt - 0.15)
    kicker(fr, 'KILL FEED', 1780 - 270, 200, lt, ORANGE)
    for i, (k, w_, v, hero) in enumerate(FEED):
        l = t - FT[i]
        if l <= 0: continue
        pos = sum(eo((t - FT[j]) / 0.22) for j in range(i + 1, 8) if t > FT[j])
        feedrow(fr, 1780, 285 + pos * 98, k, w_, v, l, hero, 1.25, 1 - clamp((pos - 5.6) / 0.4))
DK2 = T_CUNG6 + 0.1; DH2 = T_DOI; D20 = EV[6] - 0.4
def s_final(fr, lt, dur, t):
    lab = 'CÒN LẠI: 2' if t < DK2 + 0.15 else 'CÒN LẠI: 1'
    lay = tl(lab, FI, 34, ORANGE if t < DK2 + 0.15 else GREEN, 6, 'Bold'); fr.paste(lay, W / 2 - lay.width / 2, 110 - lay.height / 2, clamp(lt / 0.3) * (1 - clamp((t - T_NGUOI6 + 0.3) / 0.25)))
    duel(fr, t, D20, [DH2], DK2, 'blinkblade', 'bloodchain', 'BUNN9', 'AIUFUON', [(DH2, 7, 6)], [(DH2, 5, 2), (DK2, 2, 0)], True)
    feedrow(fr, W - 110, 770, 'Bunn9', 'blinkblade', 'Aiufuon', t - DK2 - 0.55, True, 1.35)
    stagger(fr, 'NGƯỜI SỐNG SÓT CUỐI CÙNG', FM, 84, WHITE, W / 2, 170, t - T_NGUOI6 + 0.2, 0.025)
    l = t - T_TD6 + 0.1
    if l > 0:
        p = bo(l / 0.45); im = tl('CHIẾN THẮNG!', FM, 124, GREEN); im = im.resize((max(2, int(im.width * p)), max(2, int(im.height * p))), Image.BILINEAR)
        fr.paste(im, W / 2 - im.width / 2, 900 - im.height / 2, clamp(l / 0.15)); fr.hit(l - 0.1, 0.2, 10)
GL = [T_VAO + 0.55, T_END + 0.5]
def s_end(fr, lt, dur, t):
    if t < T_VAO - 0.1:
        fr.amul = clamp((T_VAO - 0.1 - t) / 0.3); fr.oy = -(1 - fr.amul) * 40
        row(fr, [(tl('Còn chờ ', FM, 120, WHITE), 0), (tl('gì nữa?', FM, 120, ORANGE), 0.1)], W / 2, 500, lt + 0.05)
        fr.amul = 1.0; fr.oy = 0
    l = t - T_VAO + 0.1
    if l > 0:
        p = ex(l / 0.8); lg = logo(int(lerp(760, 820, eo(l / 8)) // 2 * 2))
        for g0 in GL:
            if 0 < t - g0 < 0.75: lg = glint(lg, eio((t - g0) / 0.75))
        fr.paste(lg, W / 2 - lg.width / 2, 330 - lg.height / 2 + (1 - p) * 40, clamp(l / 0.4))
        uline(fr, W / 2 - 200, W / 2 + 200, 505, (l - 0.5) / 0.5)
        reveal(fr, tl('JOIN NOW', FM, 92, GREEN, 10), W / 2, 600, t - T_IP + 0.15)
        row(fr, [(tl('IP: ', FM, 64, ORANGE), 0), (tl('newgenmc.net', FM, 64, WHITE), 0.08)], W / 2, 715, t - T_IP - 0.2)
        w1 = tl('BATTLE ROYALE', FI, 34, INK, 2, 'Bold').width + 40; w2 = tl('VŨ KHÍ HUYỀN THOẠI', FI, 34, INK, 2, 'Bold').width + 40; x0 = W / 2 - (w1 + w2 + 28) / 2
        pill(fr, 'BATTLE ROYALE', x0 + w1 / 2, 830, t - T_GIANH + 0.1, GREEN); pill(fr, 'VŨ KHÍ HUYỀN THOẠI', x0 + w1 + 28 + w2 / 2, 830, t - T_GIANH - 0.2, ORANGE)
        for i, (n, x, col) in enumerate((('blinkblade', 250, GREEN), ('bloodchain', 1670, ORANGE))):
            q = eo((l - 0.3 - i * 0.12) / 0.7)
            if q > 0: cy = 520 + math.sin(t * 2 + i) * 10; put(fr, glow(col, 230), x, cy, a=0.6 * q); put(fr, spin_img(n, t * 38 + i * 180, 420), x + (1 - q) * (-300 if i == 0 else 300), cy, 0, q)
    fr.fade = clamp((lt - (dur - 0.7)) / 0.7)
CHAP = [(0, '01', 'BATTLE ROYALE'), (EV[2] - 0.1, '02', 'CHUẨN BỊ'), (EV[3] - 0.1, '03', 'CHẾ TẠO'), (EV[4] - 0.1, '04', 'GIAO TRANH'), (EV[5] - 0.1, '05', 'KILL FEED'), (D20 - 0.05, '06', 'CHIẾN THẮNG'), (EV[7] - 0.1, '07', 'THAM GIA')]
SCENES = [(0.0, T_VAY - 0.15, s_hook), (T_VAY - 0.15, EV[2] - 0.1, s_title), (EV[2] - 0.1, EV[3] - 0.1, s_prep), (EV[3] - 0.1, EV[4] - 0.1, s_craft), (EV[4] - 0.1, EV[5] - 0.1, s_fight),
          (EV[5] - 0.1, D20 - 0.05, s_feed), (D20 - 0.05, EV[7] - 0.1, s_final), (EV[7] - 0.1, TOTAL, s_end)]
KINDS = ['zoom', 'push', 'rise', 'focus', 'push', 'zoom', 'rise', 'zoom']
OUT_PRE, OUT_LEN, IN_LEN = 0.2, 0.38, 0.42
def _fx(kind, e, g):
    sc = 1.0; dx = dy = 0.0; a = 1.0; bl = mb = 0.0
    if e > 0:
        q = eio(e) * 0.6 + e * e * 0.4
        if kind == 'zoom': sc *= 1 + 0.32 * q; bl += 9 * e
        elif kind == 'push': dx -= 760 * q; mb += 6 * e
        elif kind == 'rise': dy -= 300 * q; bl += 3 * e
        elif kind == 'focus': sc *= 1 - 0.07 * eo(e); bl += 14 * e
        a *= 1 - eio(clamp((e - 0.2) / 0.8))
    if g < 1:
        r = 1 - eo(g)
        if kind == 'zoom': sc *= 1 - 0.12 * r
        elif kind == 'push': dx += 520 * r; mb += 5 * r
        elif kind == 'rise': dy += 240 * r
        elif kind == 'focus': sc *= 1 + 0.08 * r; bl += 10 * r
    return sc, dx, dy, a, bl, mb
def hud(fr, t):
    a = 1 - clamp((t - T_END) / 0.4)
    if a <= 0: return
    fr.paste(tl('NEWGENMC', FM, 22, WHITE, 6), 60, 44, 0.8 * a)
    l = tl('newgenmc.net', FI, 22, MUTED, 2, 'Medium'); fr.paste(l, W - 60 - l.width, 46, a)
    cur = [c for c in CHAP if c[0] <= t][-1]
    fr.paste(tl(cur[1], FI, 22, GREEN, 2, 'Bold'), 60, H - 76, a); fr.paste(tl('— ' + cur[2], FI, 22, MUTED, 4, 'SemiBold'), 104, H - 76, a)
    fr.o().rectangle((W - 360, H - 62, W - 60, H - 60), fill=(255, 255, 255, int(40 * a))); fr.o().rectangle((W - 360, H - 62, W - 360 + 300 * t / TOTAL, H - 60), fill=GREEN + (int(220 * a),))
def render(t):
    global CUR_T
    CUR_T = t; fr = Frame(t); layers = []; n = len(SCENES)
    for i, (a, b, fn) in enumerate(SCENES):
        end = b + (OUT_LEN - OUT_PRE if i < n - 1 else 0)
        if not (a <= t < end): continue
        e = clamp((t - (b - OUT_PRE)) / OUT_LEN) if i < n - 1 else 0.0
        g = clamp((t - a) / IN_LEN) if i > 0 else 1.0
        fn(fr, t - a, b - a, t); L = fr.take()
        sc_, dx, dy, al, bl, mb = _fx(KINDS[i], e, 1.0) if e > 0 else (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
        if g < 1:
            s2, dx2, dy2, _, bl2, mb2 = _fx(KINDS[i - 1], 0, g); sc_ *= s2; dx += dx2; dy += dy2; bl += bl2; mb += mb2
        u = (t - a) / max(0.1, b - a); dirn = 1 if i % 2 == 0 else -1
        sc_ *= 1 + 0.03 * u; dx += dirn * 14 * (u - 0.5)
        layers.append(xform(L, sc_, dx, dy, al, bl, mb))
    fr.compose(layers); hud(fr, t)
    return fr.finish()
if __name__ == '__main__':
    if sys.argv[1] == 'still':
        for s in sys.argv[2].split(','):
            Image.fromarray(render(float(s))).resize((960, 540)).save(f'qa/m_{float(s):05.2f}.jpg', quality=84)
    else:
        f0, f1, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
        for i in range(f0, f1): p.stdin.write(render(i / FPS).tobytes())
        p.stdin.close(); p.wait()

# NewGen Part 2 (PHAT TRIEN) renderer: python3 tools/ngp2.py F0 F1 out.mp4 | python3 tools/ngp2.py still t1,t2,..
import sys
exec(open('tools/base.py').read())
TOTAL = 61.5
WT = json.load(open('audio/vo/words.json'))
VS = {1: 1.2, 2: 10.3, 3: 27.1, 4: 40.4, 5: 48.9}
def wt(v, tok, n=0):
    hits = [w for w in WT[str(v)] if tok.lower() in w[2].lower()]
    return VS[v] + hits[n][0]
TKD = wt(1, 'khởi'); TNAY = wt(1, 'này'); TSAU = wt(1, 'sâu'); TPT = wt(1, 'phát')
TNG = wt(2, 'new'); TSMP = wt(2, 'smp'); TYT = wt(2, 'yêu'); TTC = wt(2, 'thành', 0); TNH = wt(2, 'nhưng', 1)
TPTH = wt(2, 'phát'); TDP = wt(2, 'đột'); TBR = wt(2, 'battle'); TROY = wt(2, 'royale'); THT = wt(2, 'hình')
TLV = wt(3, 'làm'); T1N = wt(3, 'năm'); TCS = wt(3, 'công'); TVON = wt(3, 'vốn'); T300 = wt(3, '300'); TTR = wt(3, 'triệu')
TSV = wt(3, 'server'); TMO = wt(3, 'mở'); TMN = wt(3, 'mọi')
THAO = wt(4, 'hào'); TPLUG = wt(4, 'plug'); TWG = wt(4, 'word'); TMINH = wt(4, 'mình', 1); TMM = wt(4, 'mò'); T3T = wt(4, '3'); TTN = wt(4, 'thử')
TMAP = wt(5, 'map'); TDEP = wt(5, 'đẹp'); TDD = wt(5, 'dạng'); TDO = wt(5, 'đó'); TQUA = wt(5, 'quả'); T3M = wt(5, '3')
TEND = 57.25

def fs(s, size, maxw=1680, fp=None):
    L = font(fp or FH, size).getlength(s)
    return size if L <= maxw else int(size * maxw / L)
def kick(fr, s, x, y, col=(150, 150, 144), size=16, anchor='la'):
    fr.d.text((x, y), s, font=font(FM, size), fill=col, anchor=anchor)
def pill(fr, s, cx, cy, p, bg=LIME, fg=(13, 13, 12), size=34):
    if p <= 0: return
    f = font(FH, size); w = f.getlength(s) + 60; h = size + 30
    sc = lerp(0.55, 1.0, eo(p / 0.6)); w2, h2 = w * sc, h * sc
    fr.d.rounded_rectangle((cx - w2 / 2, cy - h2 / 2, cx + w2 / 2, cy + h2 / 2), int(h2 / 2), fill=bg)
    if p > 0.3: fr.d.text((cx, cy + 2), s, font=f, fill=fg, anchor='mm')
def ital(fr, s, cx, cy, size, p, fill=WHITE, anchor='mm'):
    if p <= 0: return
    lay = tl(s, FI, size, fill)
    if anchor == 'lm': cx = cx + lay.width / 2
    paste_c(fr, lay, cx + lerp(-40, 0, eo(p / 0.5)), cy, 1.0, clamp(p / 0.35))
def cslam(fr, word, lt, cy, size, fill=WHITE, cx=W / 2, maxw=1700, ghost=True):
    if lt < 0: return
    slam(fr, word, lt, cx, cy, fs(word, size, maxw), fill, ghost)
def kcard(fr, word, lt, dur, bg, fg, size, small=None):
    card(fr, word, lt, dur, bg, fg, fs(word, size, 1650), small, None)

class VR:
    def __init__(s, path, start, speed, w, h):
        s.path, s.start, s.speed, s.w, s.h = path, start, speed, w, h; s.p = None; s.idx = -10; s.last = None
    def get(s, i):
        if s.p is not None and i <= s.idx and s.last is not None: return s.last
        if s.p is not None and s.idx + 1 < i <= s.idx + 8:
            while s.idx + 1 < i: s.p.stdout.read(s.w * s.h * 3); s.idx += 1
        if s.p is None or i != s.idx + 1:
            if s.p: s.p.kill()
            ss = s.start + i / FPS * s.speed
            s.p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f'{ss:.3f}', '-i', s.path, '-vf',
                f'setpts=PTS/{s.speed},fps=30,scale={s.w}:{s.h}:flags=lanczos', '-an', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
            s.last = None
        b = s.p.stdout.read(s.w * s.h * 3)
        if len(b) == s.w * s.h * 3: s.last = Image.frombytes('RGB', (s.w, s.h), b)
        s.idx = i
        return s.last if s.last is not None else Image.new('RGB', (s.w, s.h), (30, 30, 30))
RECAP = VR('in/part1.mp4', 1.0, 1.6, 1040, 585)
RECAP_T0 = VS[1]
def recap_frame(t): return RECAP.get(int(round((t - RECAP_T0) * FPS)))

SS = {k: Image.open(f'src/ss_{k}.png').convert('RGB') for k in ('over', 'snow', 'ruins', 'lobby', 'wgmap', 'wghills', 'wgbiome', 'desk', 'console', 'crowd', 'group', 'recipe1', 'recipe2', 'recipe3')}
def kb(k, w, h, p, zoom=0.08, dx=0.0, dy=0.0):
    im = SS[k]; IW, IH = im.size
    ar = w / h
    cw0 = min(IW, IH * ar); ch0 = cw0 / ar
    z = 1 + zoom * p; cw, ch = cw0 / z, ch0 / z
    cx = IW / 2 + dx * (cw0 - cw) / 2 * (2 * p - 1); cy = IH / 2 + dy * (ch0 - ch) / 2 * (2 * p - 1)
    return im.resize((int(w), int(h)), Image.BILINEAR, box=(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2))

# terrain heightmap for WorldGen viz
def _hmap(gw=64, gh=36, seed=7):
    rnd = np.random.RandomState(seed); acc = np.zeros((gh, gw), np.float32); amp = 1.0
    for oc in (4, 8, 16):
        g = rnd.rand(oc * gh // gw + 2, oc + 2).astype(np.float32)
        im = Image.fromarray((g * 255).astype(np.uint8)).resize((gw, gh), Image.BICUBIC)
        acc += np.asarray(im, np.float32) / 255 * amp; amp *= 0.5
    acc = (acc - acc.min()) / (acc.max() - acc.min()); return acc
HM = _hmap()
PAL = [(0.30, (16, 24, 26)), (0.42, (28, 44, 46)), (0.55, (44, 52, 38)), (0.68, (70, 84, 44)), (0.82, (130, 160, 44)), (1.01, LIME)]
HMC = np.zeros(HM.shape + (3,), np.uint8)
for i in range(HM.shape[0]):
    for j in range(HM.shape[1]):
        for th, c in PAL:
            if HM[i, j] < th: HMC[i, j] = c; break
_rr = np.random.RandomState(3).rand(*HM.shape) * 0.25
REVEAL = (np.add.outer(np.arange(HM.shape[0]) / HM.shape[0], np.arange(HM.shape[1]) / HM.shape[1]) / 2 * 0.75 + _rr)

# ---------------- scenes ----------------
def s_intro(fr, lt, dur, t):
    fr.cam(lt, dur, 0.04)
    a = eo(lt / 0.5)
    if a > 0: paste_c(fr, tl('CHAPTER 02', FMB, 44, LIME), W / 2, H / 2 - 10, lerp(1.08, 1.0, a), a)
    if lt > 0.35: kick(fr, 'TẬP 01 → TẬP 02', W / 2, H / 2 + 45, (150, 150, 144), 18, 'ma')

def s_recap(fr, lt, dur, t):
    fr.cam(lt, dur, 0.04)
    cx = 330; ia = eo(lt / 0.6)
    fr.glow(cx, 420, 320, 0.28 * ia)
    paste_c(fr, logo(2, int(lerp(200, 250, ia))), cx, 420, 1.0, ia)
    paste_c(fr, logo(1, 420), cx - lerp(60, 0, eo((lt - 0.25) / 0.6)), 625, 1.0, clamp((lt - 0.25) / 0.4))
    kick(fr, 'MINECRAFT SERVER · VIỆT NAM', cx, 705, anchor='ma')
    x, y, pw, ph = 800, 268, 1040, 585
    p = eo((lt - 0.15) / 0.55)
    if p > 0:
        panel(fr, recap_frame(t), x, y, 'RECAP // TẬP 01 — KHỞI ĐẦU', p, lerp(90, 0, p))
        if int(t * 2.5) % 2 == 0: fr.d.ellipse((x + pw - 150, y - 26, x + pw - 138, y - 14), fill=LIME)
        kick(fr, 'PLAYBACK 1.6×', x + pw, y - 24, anchor='ra')
    lp = clamp((lt - 0.7) / 0.7); sx, ex = cx + 230, x - 26
    if lp > 0:
        mx = lerp(sx, ex, lp); fr.d.line([(sx, 420), (mx, 420)], fill=(80, 90, 40), width=2)
        if lp < 1: dot(fr, mx, 420, 0.8)
        else: dot(fr, lerp(sx, ex, ((lt - 1.4) % 1.3) / 1.3), 420, 0.7)
    pill(fr, 'KHỞI ĐẦU', x + 120, y + ph + 62, (t - TKD + 0.1) / 0.3)
    ital(fr, 'Ở video trước…', x + 260, y + ph + 62, 44, (lt - 0.3) / 0.6, (200, 200, 194), 'lm')
    if lt < 2 / FPS: fr.flash = 0.35

def s_deeper(fr, lt, dur, t):
    # shrinking recap thumbnail into corner
    q = eo(lt / 0.5); w = int(lerp(1040, 320, q)); h = int(w * 9 / 16)
    x = lerp(800, 70, q); y = lerp(268, 130, q)
    im = recap_frame(t).resize((w, h), Image.BILINEAR)
    panel(fr, im, x, y, 'TẬP 01', 1.0)
    if t < TSAU - 0.05:
        ital(fr, 'Ở video này,', W / 2, H / 2 - 20, 96, (t - TNAY + 0.2) / 0.5)
        kick(fr, 'CHAPTER 02 // ĐANG TẢI…', W / 2, H / 2 + 70, LIME, 18, 'ma')
        fr.cam(lt, dur, 0.03)
    else:
        l2 = t - (TSAU - 0.05); fr.zoom = 1 + 0.10 * eo(l2 / 1.4)
        cslam(fr, 'ĐI SÂU HƠN', l2, H / 2, 200)

def s_card_pt(fr, lt, dur, t):
    kcard(fr, 'PHÁT TRIỂN.', lt, dur, LIME, (13, 13, 12), 230, 'chapter 02')

def s_origin(fr, lt, dur, t):
    fr.cam(lt, dur, 0.05)
    kick(fr, '// HỒ SƠ GỐC — ORIGIN', 160, 400, LIME, 18)
    typed(fr, 'Có thể các bạn không biết…', FI, 70, 160, 500, lt / 1.0)
    p = eo((t - TNG + 0.1) / 0.6)
    if p > 0:
        fr.glow(1450, 600, 320, 0.2 * p)
        paste_c(fr, logo(1, 520), 1450 + lerp(80, 0, p), 610, 1.0, p)
        kick(fr, 'BẮT ĐẦU BẰNG…', 1450, 690, anchor='ma')

def s_smp(fr, lt, dur, t):
    fr.cam(lt, dur, 0.04)
    cslam(fr, 'SMP', lt, 235, 250, ghost=False)
    if lt > 0.3: kick(fr, 'SURVIVAL MULTIPLAYER · CHẾ ĐỘ ĐẦU TIÊN', W / 2, 345, (150, 150, 144), 18, 'ma')
    p = eo((lt - 0.15) / 0.5)
    if p > 0: panel(fr, kb('group', 900, 477, clamp(lt / dur), 0.10, 0.3, -0.2), 160, 430, 'NEWGEN SMP // CỘNG ĐỒNG', p, lerp(80, 0, p))
    q = eo((t - TYT + 0.15) / 0.45)
    if q > 0: panel(fr, kb('crowd', 650, 333, clamp((t - TYT) / 2.5), 0.10, -0.4, 0), 1110, 450, 'SERVER // ĐÔNG NGƯỜI', q, lerp(80, 0, q))
    for i in range(3):
        r = eo((lt - 0.7 - i * 0.18) / 0.4)
        if r <= 0: continue
        im = SS[f'recipe{i + 1}'].resize((200, 114), Image.BILINEAR)
        panel(fr, im, 1110 + i * 225, 840, 'VŨ KHÍ TỰ CHẾ' if i == 0 else '', r, lerp(50, 0, r))
        if lt - 0.7 - i * 0.18 < 2 / FPS: fr.flash = max(fr.flash, 0.12)
    pill(fr, 'NHIỀU NGƯỜI YÊU THÍCH', 610, 975, (t - TYT + 0.1) / 0.3)

def s_card_tc(fr, lt, dur, t):
    kcard(fr, 'THÀNH CÔNG.', lt, dur, OFF, (13, 13, 12), 230, 'khá')

def s_growth(fr, lt, dur, t):
    fr.cam(lt, dur, 0.04)
    ital(fr, 'Nhưng, nếu muốn', 160, 300, 64, (lt - 0.05) / 0.5, (210, 210, 204), 'lm')
    if t >= TPTH - 0.05:
        l2 = t - (TPTH - 0.05)
        lay = tl('PHÁT TRIỂN HƠN', FH, 150, WHITE)
        sc = lerp(1.2, 1.0, eo(l2 / 0.22))
        if l2 > 0.08: ghosts(fr, lay, 160 + lay.width / 2, 450, 160, l2, 2, 0.08)
        paste_c(fr, lay, 160 + lay.width * sc / 2, 450, sc, 1.0, int(lerp(60, 0, eo(l2 / 0.18))))
        fr.hit(l2)
        if l2 < 2 / FPS: fr.flash = 0.35
    x0, x1, yb = 160, 1760, 960
    fr.d.line([(x0, yb), (x1, yb)], fill=(60, 60, 56), width=2)
    for i in range(9): fr.d.line([(x0 + i * 200, yb), (x0 + i * 200, yb + 10)], fill=(60, 60, 56), width=2)
    gp = eo(clamp(lt / (dur - 0.2)))
    n = max(2, int(80 * gp)); pts = []
    for i in range(n):
        u = i / 79; pts.append((lerp(x0, x1, u), yb - 20 - 300 * (u ** 3.2) - 18 * math.sin(u * 9)))
    fr.d.line(pts, fill=LIME, width=4); dot(fr, pts[-1][0], pts[-1][1], 1.0)
    kick(fr, 'TĂNG TRƯỞNG', x1, yb + 20, anchor='ra')

def s_dotpha(fr, lt, dur, t):
    fr.zoom = 1 + 0.06 * eo(lt / dur)
    ital(fr, 'mình cần sự', W / 2, 300, 56, lt / 0.3, (200, 200, 194))
    frag = clamp((lt - 1.0) / 0.6)
    metal_word(fr, 'ĐỘT PHÁ.', 250, W / 2, H / 2 + 20, t, frag, 5)
    if frag > 0: particles(fr, lt, 160, 9, frag)
    fr.hit(lt, 0.25, 26)
    if lt < 2 / FPS: fr.flash = 0.5
    fr.glow(W / 2 + 560, H / 2 + 60, 60, 0.8 * (1 - frag))

def s_br(fr, lt, dur, t):
    fr.cam(lt, dur, 0.06)
    if lt < 0.1: fr.img.paste(LIME, (0, 0, W, H)); fr.hit(lt); return
    cslam(fr, 'BATTLE', lt, 330, 250, ghost=False)
    if t >= TROY - 0.05: cslam(fr, 'ROYALE', t - TROY + 0.05, 560, 250, LIME, ghost=False)
    laser(fr, (t - TROY) / 0.7, 700, 0.22)
    dp = clamp((t - THT + 0.1) / 0.8)
    if dp > 0:
        ax, bx, y = 620, 1300, 860
        fr.d.rounded_rectangle((ax - 120, y - 34, ax + 120, y + 34), 34, outline=(110, 110, 104), width=2)
        fr.d.text((ax, y), 'SMP', font=font(FH, 30), fill=(170, 170, 164), anchor='mm')
        mx = lerp(ax + 130, bx - 190, dp); fr.d.line([(ax + 130, y), (mx, y)], fill=LIME, width=3)
        if dp < 1: dot(fr, mx, y, 0.9)
        kick(fr, 'Ý TƯỞNG MỚI', (ax + bx) / 2, y - 40, LIME, 16, 'ma')
        if dp >= 1:
            fr.d.rounded_rectangle((bx - 180, y - 34, bx + 180, y + 34), 34, fill=LIME)
            fr.d.text((bx, y), 'BATTLE ROYALE', font=font(FH, 30), fill=(13, 13, 12), anchor='mm'); fr.glow(bx, y, 140, 0.3)

def s_work(fr, lt, dur, t):
    fr.cam(lt, dur, 0.04)
    kick(fr, 'TERMINAL // NEWGEN-BR', 360, 300, LIME, 18)
    fr.d.rounded_rectangle((330, 280, 1590, 800), 18, outline=(60, 60, 56), width=2)
    ital(fr, 'Ngay lập tức,', 420, 420, 60, lt / 0.4, (210, 210, 204), 'lm')
    s = 'BẮT ĐẦU LÀM VIỆC'
    typed(fr, s, FH, 100, 420, 590, (t - TLV + 0.4) / 0.6)
    bp = clamp((lt - 0.4) / (dur - 0.5))
    fr.d.rectangle((420, 690, 1500, 704), outline=(70, 70, 66)); fr.d.rectangle((420, 690, 420 + 1080 * eo(bp), 704), fill=LIME)
    kick(fr, f'{int(bp * 100):3d}%', 1500, 720, anchor='ra'); kick(fr, 'BUILD › BATTLE ROYALE', 420, 720)

def s_year(fr, lt, dur, t):
    fr.cam(lt, dur, 0.05)
    p = eo(lt / 0.4)
    panel(fr, kb('desk', 800, 600, clamp(lt / dur), 0.10, 0.2, -0.2), 120, 250, 'NEWGEN STUDIO // SETUP', p, lerp(70, 0, p))
    cslam(fr, '1 NĂM', lt, 420, 220, cx=1390, maxw=800, ghost=False)
    x0, x1, y = 1010, 1770, 640; q = eo(lt / 0.9)
    for i in range(12):
        x = lerp(x0, x1, i / 11); on = i / 11 <= q
        fr.d.rectangle((x - 4, y - 14, x + 4, y + 14), fill=LIME if on else (60, 60, 56))
    fr.d.line([(x0, y), (lerp(x0, x1, q), y)], fill=LIME, width=3); dot(fr, lerp(x0, x1, q), y, 0.8)
    kick(fr, 'THÁNG 01', x0, y + 30, anchor='ma'); kick(fr, 'THÁNG 12', x1, y + 30, anchor='ma')
    ital(fr, 'công sức', 1390, 770, 60, (t - TCS + 0.1) / 0.4, (210, 210, 204))

def s_money(fr, lt, dur, t):
    fr.cam(lt, dur, 0.04)
    p = eo(lt / 0.45)
    panel(fr, kb('console', 1000, 585, clamp(lt / dur), 0.08, -0.3, 0.3), (W - 1000) / 2, 440, 'NEWGEN STUDIO // CONSOLE', p, lerp(80, 0, p))
    pill(fr, 'TIỀN VỐN', W / 2, 120, lt / 0.3, size=30)
    r = eo(clamp((t - (T300 - 0.45)) / ((TTR + 0.1) - (T300 - 0.45))))
    v = int(300_000_000 * r)
    if r < 1: v = (v // 1000) * 1000 + (int(t * 977) % 1000 if v > 0 else 0)
    s = f'{v:,}'.replace(',', '.')
    lay = tl(s, FH, 150, LIME if r >= 1 else WHITE)
    paste_c(fr, lay, W / 2, 255, 1.0 + (0.06 * (1 - eo((t - TTR - 0.1) / 0.3)) if t > TTR + 0.1 else 0))
    kick(fr, 'VNĐ', W / 2, 345, (200, 200, 194), 28, 'ma')
    if t >= TTR + 0.1:
        l2 = t - TTR - 0.1; fr.hit(l2); fr.glow(W / 2 + lay.width / 2 - 20, 280, 140, 0.4)
        if l2 < 2 / FPS: fr.flash = 0.45

def s_open(fr, lt, dur, t):
    fr.cam(lt, dur, 0.05)
    online = t >= TMO
    kick(fr, 'SERVER STATUS', W / 2 - 150, 240, (150, 150, 144), 18)
    fr.d.ellipse((W / 2 + 40, 242, W / 2 + 56, 258), fill=LIME if online else (180, 60, 50))
    kick(fr, 'ONLINE' if online else 'OFFLINE', W / 2 + 70, 240, LIME if online else (180, 60, 50), 18)
    if online:
        l2 = t - TMO + 0.05
        cslam(fr, 'MỞ CỬA.', l2, 480, 290)
        ital(fr, 'cho mọi người', W / 2, 700, 72, (t - TMN + 0.1) / 0.4)
    # doors
    q = eo((t - TMO + 0.1) / 0.4)
    if q < 1:
        off = q * 1000
        for sgn in (-1, 1):
            xa = W / 2 + sgn * off; xb = xa + sgn * 900
            fr.d.rectangle((min(xa, xb), 290, max(xa, xb), 860), fill=(18, 18, 16))
            fr.d.line([(xa, 290), (xa, 860)], fill=LIME, width=4); fr.glow(xa, 575, 140, 0.35)
        if q == 0: typed(fr, 'CHÍNH THỨC', FMB, 26, W / 2 - 400, 250 + 650, lt / 0.6, (150, 150, 144), dot=False)

def s_gallery(fr, lt, dur, t):
    fr.cam(lt, dur, 0.035)
    kick(fr, 'IN-GAME // BATTLE ROYALE', 240, 96, LIME, 18)
    pw, ph, gap = 700, 394, 40; x0, y0 = (W - 2 * pw - gap) / 2, 170
    items = [('over', 'BẢN ĐỒ', 1, 0.3), ('snow', 'SNOWY PLAINS', -1, 0.5), ('ruins', 'TÀN TÍCH', 1, -0.6), ('lobby', 'SẢNH CHỜ · 75/90', -1, 0.4)]
    for i, (k, lab, dx, dy) in enumerate(items):
        p = eo((lt - 0.1 - i * 0.22) / 0.5)
        if p <= 0: continue
        x = x0 + (i % 2) * (pw + gap); y = y0 + (i // 2) * (ph + gap + 30)
        panel(fr, kb(k, pw, ph, clamp(lt / dur), 0.10, dx, dy), x, y, lab, p, lerp(80, 0, p))
        if lt - 0.1 - i * 0.22 < 2 / FPS: fr.flash = max(fr.flash, 0.15)
    sp = (lt % 1.6) / 1.6; sx = lerp(x0 - 60, x0 + 2 * pw + gap + 60, sp)
    ital(fr, 'đã chính thức mở cửa', W - 240, 96 + 10, 34, lt / 0.5, (150, 150, 144), 'mm')

def s_proud(fr, lt, dur, t):
    fr.cam(lt, dur, 0.06)
    ital(fr, 'Thứ mình', W / 2, 360, 64, lt / 0.4, (210, 210, 204))
    cslam(fr, 'TỰ HÀO NHẤT', t - THAO + 0.05, 540, 180)

def s_wg(fr, lt, dur, t):
    fr.cam(lt, dur, 0.05)
    a = clamp(lt / 0.25)
    if a > 0:
        f = font(FMB, 34); s = '[ PLUGIN ]'
        fr.d.text((W / 2, 330), s, font=f, fill=LIME, anchor='mm')
    if t >= TWG - 0.05:
        l2 = t - TWG + 0.05
        metal_word(fr, 'WORLDGEN', fs('WORLDGEN', 260), W / 2, 530, l2 + 0.5)
        fr.hit(l2, 0.25, 24)
        if l2 < 2 / FPS: fr.flash = 0.5
        up = eo(l2 / 0.6); fr.d.line([(W / 2 - 700 * up, 690), (W / 2 + 700 * up, 690)], fill=LIME, width=4)
        fr.glow(W / 2 + 700 * up, 690, 60, 0.9); fr.glow(W / 2 - 700 * up, 690, 60, 0.9)
        if l2 > 0.4: kick(fr, 'CUSTOM WORLD GENERATION · TỰ PHÁT TRIỂN', W / 2, 720, (150, 150, 144), 18, 'ma')
    else:
        ital(fr, 'là plugin', W / 2, 520, 72, lt / 0.3, (210, 210, 204))

def s_terrain(fr, lt, dur, t):
    fr.cam(lt, dur, 0.04)
    mw, mh, mx, my = 900, 624, 150, 290
    base = np.asarray(kb('wgmap', mw, mh, clamp(lt / dur), 0.06, 0.2, 0.1)).copy()
    rp = clamp(lt / 2.6) * 1.05
    m = np.asarray(Image.fromarray(((REVEAL <= rp) * 255).astype(np.uint8)).resize((mw, mh), Image.NEAREST)) > 0
    fm = np.asarray(Image.fromarray(((REVEAL <= rp) & (REVEAL > rp - 0.04)).astype(np.uint8) * 255).resize((mw, mh), Image.NEAREST)) > 0
    base[~m] = (22, 23, 19); base[fm] = (base[fm] * 0.4 + np.array(LIME) * 0.6).astype(np.uint8)
    n = int((REVEAL <= rp).sum())
    panel(fr, Image.fromarray(base), mx, my, f'WORLDGEN // CHUNKS {min(n, 2304):4d}/2304', 1.0)
    ital(fr, 'Tự mày mò, tự tạo ra…', mx, 200, 50, (t - TMM + 0.4) / 0.4, (210, 210, 204), 'lm')
    for i, (k, lab, st) in enumerate((('wghills', 'BIOME // SMALL HILLS', 1.0), ('wgbiome', 'BIOME // NEW BIOME', 1.5))):
        p = eo((lt - st) / 0.45)
        if p <= 0: continue
        panel(fr, kb(k, 640, 359, clamp((lt - st) / 3), 0.08, (-1) ** i, 0), 1130, 290 + i * 400, lab, p, lerp(70, 0, p))
        if lt - st < 2 / FPS: fr.flash = max(fr.flash, 0.15)
    if t >= T3T - 0.05:
        fr.img = Image.blend(fr.img, Image.new('RGB', (W, H), (8, 8, 7)), 0.55); fr.d = ImageDraw.Draw(fr.img)
        cslam(fr, '3 THÁNG', t - T3T + 0.05, 540, 260, ghost=False)
        if t >= TTN - 0.05: pill(fr, 'THỬ NGHIỆM', W / 2, 740, (t - TTN + 0.05) / 0.3, size=40)

def s_map(fr, lt, dur, t):
    fr.cam(lt, dur, 0.05)
    pw, ph = 1440, 810; x, y = (W - pw) / 2, 175
    p = eo(lt / 0.5)
    panel(fr, kb('over', pw, ph, clamp(lt / dur), 0.14, 0.4, -0.3), x, y, 'BẢN ĐỒ NEWGEN · HIỆN TẠI', p, lerp(60, 0, p))
    kick(fr, 'MAP', x + pw, y - 24, LIME, 16, 'ra')
    ital(fr, 'Các bạn có thể thấy,', x, 112, 40, (lt - 0.1) / 0.5, (210, 210, 204), 'lm')
    if lt < 2 / FPS: fr.flash = 0.3

def s_biomes(fr, lt, dur, t):
    fr.cam(lt, dur, 0.05)
    pw, ph, gap = 500, 560, 40; x0 = (W - 3 * pw - 2 * gap) / 2; y = 400
    items = [('snow', 'SNOWY PLAINS', -1), ('ruins', 'PLAINS', 1), ('lobby', 'DEEP OCEAN', -1)]
    for i, (k, lab, dx) in enumerate(items):
        p = eo((lt - i * 0.12) / 0.4)
        if p <= 0: continue
        panel(fr, kb(k, pw, ph, clamp(lt / dur), 0.1, dx, 0), x0 + i * (pw + gap), y, 'BIOME // ' + lab, p, lerp(80, 0, p))
    if t < TDD - 0.05: cslam(fr, 'ĐẸP.', t - TDEP + 0.05, 230, 220)
    else: cslam(fr, 'ĐA DẠNG.', t - TDD + 0.05, 230, 220, LIME)

def s_dola(fr, lt, dur, t):
    ital(fr, 'Đó là…', W / 2, H / 2, 110, lt / 0.25)
def s_card_tq(fr, lt, dur, t):
    kcard(fr, 'THÀNH QUẢ', lt, dur, OFF, (13, 13, 12), 260)
def s_card_3m(fr, lt, dur, t):
    kcard(fr, '3 THÁNG', lt, dur, LIME, (13, 13, 12), 300, 'của sự cố gắng')

def s_end(fr, lt, dur, t):
    p = eo(lt / 0.7)
    fr.glow(W / 2, 430, 320, 0.25 * p)
    lk = logo(3, int(lerp(700, 760, eo(lt / dur))))
    paste_c(fr, lk, W / 2, 430, lerp(0.9, 1.0, p), p)
    gp = (lt - 0.6) / 0.6
    if 0 < gp < 1:
        gx = lerp(W / 2 - 420, W / 2 + 420, eio(gp)); fr.glow(gx, 430, 140, 0.55); fr.glow(gx, 430, 60, 0.9)
    if lt > 0.4: fr.d.text((W / 2, 610), 'newgenmc.net', font=font(FMB, 38), fill=WHITE, anchor='mm')
    pill(fr, 'TẬP 2 / 3', W / 2, 720, (lt - 0.8) / 0.3, size=32)
    if lt > 1.2: kick(fr, 'TIẾP THEO →  HOÀN THIỆN', W / 2, 800, LIME, 22, 'ma')
    if lt < 2 / FPS: fr.flash = 0.4
    fo = clamp((lt - (dur - 0.6)) / 0.6)
    if fo > 0: fr.flash = 0; fr._fade = fo

SCENES = [
    (0.0, VS[1], s_intro), (VS[1], 5.5, s_recap), (5.5, TPT - 0.06, s_deeper), (TPT - 0.06, VS[2] - 0.25, s_card_pt),
    (VS[2] - 0.25, TSMP - 0.06, s_origin), (TSMP - 0.06, TTC - 0.06, s_smp), (TTC - 0.06, TNH - 0.12, s_card_tc),
    (TNH - 0.12, TDP - 0.06, s_growth), (TDP - 0.06, TBR - 0.12, s_dotpha), (TBR - 0.12, VS[3] - 0.15, s_br),
    (VS[3] - 0.15, T1N - 0.08, s_work), (T1N - 0.08, TVON - 0.12, s_year), (TVON - 0.12, TSV - 0.1, s_money),
    (TSV - 0.1, 35.45, s_open), (35.45, VS[4] - 0.1, s_gallery), (VS[4] - 0.1, TPLUG - 0.1, s_proud),
    (TPLUG - 0.1, TMINH - 0.1, s_wg), (TMINH - 0.1, VS[5] - 0.12, s_terrain), (VS[5] - 0.12, TDEP - 0.06, s_map),
    (TDEP - 0.06, TDO - 0.1, s_biomes), (TDO - 0.1, TQUA - 0.06, s_dola), (TQUA - 0.06, T3M - 0.06, s_card_tq),
    (T3M - 0.06, TEND, s_card_3m), (TEND, TOTAL, s_end)]

def render(t):
    global CUR_T
    CUR_T = t
    fr = Frame(); fr._fade = 0
    for a, b, fn in SCENES:
        if a <= t < b: fn(fr, t - a, b - a, t); break
    ui_chrome(fr, t, 'NEWGEN // TẬP 02 — PHÁT TRIỂN')
    arr = fr.finish()
    if fr._fade > 0: arr = (arr.astype(np.float32) * (1 - fr._fade)).astype(np.uint8)
    return arr

if __name__ == '__main__':
    if sys.argv[1] == 'still':
        for s in sys.argv[2].split(','):
            Image.fromarray(render(float(s))).resize((960, 540)).save(f'qa/s_{float(s):05.2f}.jpg', quality=82)
        print('scenes', [(round(a, 2), fn.__name__) for a, b, fn in SCENES])
    else:
        f0, f1, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
        for i in range(f0, f1):
            p.stdin.write(render(i / FPS).tobytes())
            if i % 60 == 0: print(i, flush=True)
        p.stdin.close(); p.wait()

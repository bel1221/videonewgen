import sys
exec(open('tools/base.py').read())
TOTAL = 71.5
for k in ('graph_blur', 'sign_br', 'sign_duels', 'map_castle', 'map_lobby', 'map_canyon', 'lb_kills', 'lb_champ', 'lb_wins', 'legend1', 'legend2', 'lb_mr'):
    SS[k] = Image.open(f'src/{k}.png').convert('RGB')
SIGN = {k: Image.open(f'src/{k}.png').convert('RGBA') for k in ('sign_br', 'sign_duels')}
CROSS = ['xx...xx', 'xxx.xxx', '.xxxxx.', '..xxx..', '.xxxxx.', 'xxx.xxx', 'xx...xx']
_osp = S
def S(name, sc, col=None):
    if name == 'cross':
        k = ('cross', sc, col)
        if k not in _sp: _sp[k] = spr_from(CROSS, {'x': col or RED}, sc)
        return _sp[k]
    return _osp(name, sc, col)
WT = json.load(open('audio/vo/words.json'))
VS = {1: 0.6, 2: 6.4, 3: 9.2, 4: 17.4, 5: 28.8, 6: 36.9, 7: 47.9, 8: 60.0}
def wt(v, tok, n=0):
    h = [w for w in WT[str(v)] if tok.lower() in w[2].lower()]; return VS[v] + h[n][0]
T_CHAN = wt(1, 'chán'); T_SMP = wt(1, 'srp'); T_PAY = wt(1, 'pay')
T_NG = wt(2, 'new')
T_KB = wt(3, 'khác'); T_TT = wt(3, 'truyền'); T_CTC = wt(3, 'chưa'); T_VN = wt(3, 'việt')
T_HH = wt(4, 'hứa'); T_KB4 = wt(4, 'khác'); T_BIET = wt(4, 'chưa'); T_HAI = wt(4, 'hai'); T_BR4 = wt(4, 'battle'); T_COMP = wt(4, 'competitive')
T_CT = wt(5, 'chiến'); T_TD = wt(5, 'toàn'); T_PD = wt(5, 'phô'); T_PVP = wt(5, 'pvp'); T_DT = wt(5, 'đấu')
T_BXH = wt(6, 'bảng'); T_TOP = wt(6, 'top'); T_KHO = wt(6, 'kho'); T_HT = wt(6, 'huyền'); T_KCS = wt(6, 'không'); T_VN6 = wt(6, 'việt')
T_VAO = wt(7, 'vào'); T_SO = wt(7, 'so'); T_TOP7 = wt(7, 'top'); T_KC = wt(7, 'không'); T_VUI = wt(7, 'vui'); T_HOI = wt(7, 'hội'); T_PVP7 = wt(7, 'pvp')
T_CB = wt(8, 'chuẩn'); T_KB8 = wt(8, 'khác'); T_NT = wt(8, 'nghe'); T_END = 65.9

def drop(fr, im, cx, cy, lt, sc=2.0):
    if lt < 0: return
    p = bo(lt / 0.5); y = lerp(-250, cy, p)
    lay = im.resize((int(im.width * sc), int(im.height * sc)), Image.NEAREST)
    fr.paste(lay, cx + math.sin(CUR_T * 2 + cx) * 3, y + math.sin(CUR_T * 3 + cx) * 5)
def card(fr, x, y, w, h, title, col, lt, good):
    if lt < 0: return
    p = bo(lt / 0.35); w2, h2 = w * p, h * p
    if p < 0.05: return
    cx, cy = x + w / 2, y + h / 2
    fr.d.rectangle((cx - w2 / 2 + 14, cy - h2 / 2 + 14, cx + w2 / 2 + 14, cy + h2 / 2 + 14), fill=OUT)
    fr.d.rectangle((cx - w2 / 2, cy - h2 / 2, cx + w2 / 2, cy + h2 / 2), fill=col, outline=OUT, width=8)
    if p > 0.8:
        fr.d.text((cx, y + 80), title, font=vfont(64), fill=OUT, anchor='mm')
        fr.paste(S('check' if good else 'cross', 22, DGREEN if good else RED), cx, cy + 50)

def s_bored(fr, lt, dur, t):
    fr.gray = 0.75
    pframe(fr, SS['graph_blur'], 360, 330, 1200, 563, lt - 0.1, 'CÁC SERVER KHÁC', GREY)
    ptpop(fr, 'CHÁN RỒI?', 170, CREAM, W / 2, 170, t - T_CHAN + 0.05)
    if t >= T_SMP - 0.05: ptpop(fr, 'SMP CŨ KĨ', 110, GREY, 640, 820, t - T_SMP + 0.05)
    if t >= T_PAY - 0.05: ptpop(fr, 'PAY2WIN', 140, RED, 1320, 790, t - T_PAY + 0.05); fr.hit(t - T_PAY, 0.2, 14)
    for i in range(3):
        a = (lt * 0.6 + i * 0.33) % 1
        if lt > 0.8: fr.d.text((1600 + a * 120, 300 - a * 160), 'z', font=vfont(int(50 + a * 60)), fill=(200, 200, 210))
def s_come(fr, lt, dur, t):
    if lt < 2 / FPS: fr.flash = 0.7
    rain(fr, t, VS[2], VS[2] + 3, 30, 201, ('coin',), 5, 0.9)
    ptpop(fr, 'HÃY ĐẾN VỚI', 130, CREAM, W / 2, 230, lt)
    burst(fr, t, T_NG + 0.05, W / 2, 560, 70, 202, spd=1300, life=1.4)
    pop(fr, pixlogo(LOGO_LK, 1150, 5, 'lkbig'), W / 2, 560, t - T_NG + 0.1)
    fr.hit(t - T_NG, 0.3, 22)
    if lt > 1.2: fr.d.text((W / 2, 860), 'newgenmc.net', font=vfont(70), fill=LIME, anchor='mm')
def s_diff(fr, lt, dur, t):
    ptpop(fr, 'KHÁC BIỆT HẲN', 180, GOLD, W / 2, 210, t - T_KB + 0.1)
    card(fr, 240, 400, 640, 480, 'TRUYỀN THỐNG', (150, 145, 170), t - T_TT + 0.1, False)
    card(fr, 1040, 400, 640, 480, 'NEWGENMC', LIME, t - T_TT - 0.5, True)
    if t > T_TT + 0.1: ptpop(fr, 'VS', 120, CREAM, W / 2, 640, t - T_TT - 0.1)
    burst(fr, t, T_TT + 0.6, 1360, 640, 30, 211, spd=700, life=0.9)
def s_never(fr, lt, dur, t):
    ptpop(fr, 'CHẾ ĐỘ CHƠI', 110, CREAM, W / 2, 220, lt)
    if t >= T_CTC - 0.05:
        l2 = t - T_CTC + 0.05; ptpop(fr, 'CHƯA TỪNG CÓ', 230, RED, W / 2, 500, l2, px=5); fr.hit(l2, 0.3, 26)
        if l2 < 2 / FPS: fr.flash = 0.5
        burst(fr, t, T_CTC + 0.05, W / 2, 500, 60, 221, spd=1200)
    if t >= T_VN - 0.05: ptpop(fr, 'Ở VIỆT NAM', 150, GOLD, W / 2, 800, t - T_VN + 0.05)
def s_promise(fr, lt, dur, t):
    pframe(fr, SS['map_lobby'], 410, 280, 1100, 619, lt - 0.1, 'NEWGENMC // SẢNH', LIME)
    ptpop(fr, 'TRẢI NGHIỆM', 120, CREAM, W / 2, 150, t - T_HH + 0.1)
    if t >= T_KB4 - 0.1: ptpop(fr, 'HOÀN TOÀN KHÁC BIỆT', 130, GOLD, W / 2, 590, t - T_KB4 + 0.1)
    if t >= T_BIET - 0.2: dbox(fr, 'cho người chưa từng biết tới NewGen', 410, 950, 1100, (t - T_BIET + 0.2) / 0.9, 50, 90)
def s_modes(fr, lt, dur, t):
    ptpop(fr, '2 CHẾ ĐỘ CHÍNH', 150, CREAM, W / 2, 200, t - T_HAI + 0.1)
    drop(fr, SIGN['sign_br'], 500, 520, t - T_BR4 + 0.25, 2.0)
    if t >= T_BR4: fr.paste(S('sword', 16, GOLD), 500, 800 + math.sin(t * 4) * 8)
    if t >= T_COMP - 0.25:
        drop(fr, SIGN['sign_duels'], 1420, 520, t - T_COMP + 0.25, 2.0)
        fr.d.text((1420, 380), 'COMPETITIVE', font=vfont(56), fill=LIME, anchor='mm')
        fr.paste(S('sword', 16, SKY), 1360, 800 + math.sin(t * 4 + 1) * 8); fr.paste(S('sword', 16, PINK).transpose(Image.FLIP_LEFT_RIGHT), 1480, 800 + math.sin(t * 4 + 2) * 8)
    burst(fr, t, T_BR4 + 0.2, 500, 520, 30, 231, spd=800, life=0.9); burst(fr, t, T_COMP + 0.2, 1420, 520, 30, 232, spd=800, life=0.9)
def s_br(fr, lt, dur, t):
    pframe(fr, SS['map_castle'], 150, 300, 1100, 619, lt - 0.1, 'CHIẾN TRƯỜNG', PINK)
    pframe(fr, SS['map_canyon'], 1300, 520, 480, 270, t - T_TD - 0.2, 'MAP', GOLD)
    drop(fr, SIGN['sign_br'], 700, 160, lt, 1.6)
    if t >= T_TD - 0.1: ptpop(fr, 'TOÀN DIỆN', 120, LIME, 1540, 380, t - T_TD + 0.1)
def s_duels(fr, lt, dur, t):
    drop(fr, SIGN['sign_duels'], W / 2, 170, lt, 1.6)
    if t >= T_PD - 0.1: ptpop(fr, 'PHÔ DIỄN KỸ NĂNG', 120, CREAM, W / 2, 380, t - T_PD + 0.1)
    if t >= T_PVP - 0.1: ptpop(fr, 'PVP', 300, GOLD, W / 2, 640, t - T_PVP + 0.1, px=6)
    p = clamp((t - T_PVP) / (T_DT - T_PVP + 0.1))
    xa = lerp(250, W / 2 - 430, eo(p)); xb = lerp(W - 250, W / 2 + 430, eo(p))
    if t >= T_PVP - 0.3:
        fr.paste(S('sword', 18, SKY), xa, 660); fr.paste(S('sword', 18, PINK).transpose(Image.FLIP_LEFT_RIGHT), xb, 660)
    burst(fr, t, T_DT, W / 2, 660, 50, 241, spd=1000)
    if t >= T_DT: fr.hit(t - T_DT, 0.25, 22); fr.d.text((W / 2, 900), 'ĐẤU TRƯỜNG DUELS', font=vfont(72), fill=LIME, anchor='mm')
def s_lb(fr, lt, dur, t):
    ptpop(fr, 'BẢNG XẾP HẠNG', 150, GOLD, W / 2, 170, t - T_BXH + 0.1)
    for i, (k, lab, col) in enumerate((('lb_kills', 'HẠ GỤC', RED), ('lb_wins', 'THẮNG', LIME), ('lb_mr', 'HẠNG MR', SKY))):
        pframe(fr, SS[k], 100 + i * 590, 340, 540, 410, lt - 0.2 - i * 0.25, lab, col)
    if t >= T_TOP - 0.1: ptpop(fr, 'TOP ĐẦU SERVER', 110, CREAM, W / 2, 900, t - T_TOP + 0.1)
def s_legend(fr, lt, dur, t):
    ptpop(fr, 'KHO VŨ KHÍ', 130, CREAM, W / 2, 150, lt)
    if t >= T_HT - 0.1: ptpop(fr, 'HUYỀN THOẠI', 150, GOLD, W / 2, 290, t - T_HT + 0.1)
    pframe(fr, SS['legend1'], 120, 420, 820, 494, lt - 0.3, 'LEGENDARY I', GOLD)
    pframe(fr, SS['legend2'], 980, 420, 820, 490, lt - 0.6, 'LEGENDARY II', GOLD)
    for k in range(3): burst(fr, t, T_HT + k * 0.35, [530, 1390, W / 2][k], [650, 650, 300][k], 30, 251 + k, spd=700, life=0.9)
def s_noserver(fr, lt, dur, t):
    if t >= T_KCS - 0.05:
        l2 = t - T_KCS + 0.05; ptpop(fr, 'KHÔNG CÓ SERVER NÀO', 150, CREAM, W / 2, 330, l2); fr.hit(l2, 0.2, 18)
    if t >= T_VN6 - 0.05:
        l3 = t - T_VN6 + 0.05; ptpop(fr, 'Ở VIỆT NAM', 220, RED, W / 2, 600, l3, px=5); fr.hit(l3, 0.25, 22)
        burst(fr, t, T_VN6, W / 2, 600, 50, 261, spd=1100)
    if t >= T_VN6 + 0.7: dbox(fr, 'làm được như NewGen!', 560, 820, 800, (t - T_VN6 - 0.7) / 0.6, 56, 100)
def s_challenge(fr, lt, dur, t):
    ptpop(fr, 'VÀO NGAY!', 170, LIME, 560, 260, lt)
    if t >= T_SO - 0.1: ptpop(fr, 'SO TÀI', 160, GOLD, 560, 520, t - T_SO + 0.1)
    if t >= T_TOP7 - 0.1: ptpop(fr, 'VỚI TOP ĐẦU', 110, CREAM, 560, 760, t - T_TOP7 + 0.1)
    pframe(fr, SS['lb_champ'], 1060, 230, 720, 575, t - T_SO, 'CHAMPION', PINK)
def s_skill(fr, lt, dur, t):
    if t < T_HOI - 0.2:
        ptpop(fr, 'KHÔNG CHỈ', 130, CREAM, W / 2, 330, lt)
        if t >= T_VUI - 0.2: ptpop(fr, 'VUI VẺ', 200, PINK, W / 2, 600, t - T_VUI + 0.2)
        r = random.Random(13)
        for i in range(12):
            ph = r.random(); x = 120 + r.random() * 1680; y = H + 40 - ((lt * 180 + ph * 1200) % (H + 200))
            fr.paste(S('heart', 6, PINK if i % 2 else RED), x, y)
    else:
        for i in range(4):
            ang = t * 1.6 + i * 1.571
            fr.paste(S('sword', 10, [GOLD, SKY, PINK, LIME][i]), W / 2 + math.cos(ang) * 820, 600 + math.sin(ang) * 380)
        ptpop(fr, 'HỘI TỤ CAO THỦ', 130, CREAM, W / 2, 280, t - T_HOI + 0.2)
        if t >= T_PVP7 - 0.1:
            l2 = t - T_PVP7 + 0.1; ptpop(fr, 'PVP CỰC CAO', 220, GOLD, W / 2, 600, l2, px=5); fr.hit(l2, 0.3, 24)
            burst(fr, t, T_PVP7 + 0.05, W / 2, 600, 60, 271, spd=1200)
            if l2 < 2 / FPS: fr.flash = 0.45
def s_ready(fr, lt, dur, t):
    ptpop(fr, 'CHUẨN BỊ THẬT KỸ', 140, CREAM, W / 2, 230, lt)
    if t >= T_KB8 - 0.1 and t < T_NT - 0.1: ptpop(fr, 'SỰ KHÁC BIỆT...', 140, LIME, W / 2, 560, t - T_KB8 + 0.1)
    if t >= T_NT - 0.1:
        l2 = t - T_NT + 0.1; ptpop(fr, 'NGHẸT THỞ!', 300, RED, W / 2, 580, l2, px=6); fr.hit(l2, 0.4, 30)
        for k in range(3): burst(fr, t, T_NT + k * 0.2, [W / 2, 500, 1420][k], [580, 400, 420][k], 60, 281 + k, spd=1300, life=1.3)
        if l2 < 2 / FPS: fr.flash = 0.6
def s_end(fr, lt, dur, t):
    burst(fr, t, T_END + 0.25, W / 2, 380, 50, 291)
    pop(fr, pixlogo(LOGO_LK, 1000, 5, 'lk2'), W / 2, 380, lt - 0.15)
    if lt > 0.5: dbox(fr, 'newgenmc.net', W / 2 - 300, 570, 600, (lt - 0.5) / 0.5, 70, 120)
    if lt > 0.9:
        for i, k in enumerate(('sign_br', 'sign_duels')):
            pop(fr, SIGN[k].resize((560, 135), Image.NEAREST), W / 2 - 320 + i * 640, 810, lt - 0.9 - i * 0.15)
    if lt > 1.5 and int(t * 2.5) % 2 == 0: ptpop(fr, 'VÀO NGAY!', 90, LIME, W / 2, 970, 1.0, bob=False)
    fr.fade = clamp((lt - (dur - 0.7)) / 0.7)

SCENES = [(0.0, VS[2] - 0.1, s_bored), (VS[2] - 0.1, T_KB - 0.3, s_come), (T_KB - 0.3, T_CTC - 0.9, s_diff), (T_CTC - 0.9, VS[4] - 0.1, s_never),
    (VS[4] - 0.1, T_HAI - 0.3, s_promise), (T_HAI - 0.3, VS[5] - 0.1, s_modes), (VS[5] - 0.1, T_PD - 0.3, s_br), (T_PD - 0.3, VS[6] - 0.1, s_duels),
    (VS[6] - 0.1, T_KHO - 0.2, s_lb), (T_KHO - 0.2, T_KCS - 0.3, s_legend), (T_KCS - 0.3, VS[7] - 0.1, s_noserver), (VS[7] - 0.1, T_KC - 0.2, s_challenge),
    (T_KC - 0.2, VS[8] - 0.1, s_skill), (VS[8] - 0.1, T_END, s_ready), (T_END, TOTAL, s_end)]
WIPES = [VS[4] - 0.1, VS[5] - 0.1, VS[6] - 0.1, VS[7] - 0.1, VS[8] - 0.1, T_END]
def wipe(fr, t):
    for b in WIPES:
        d = t - b
        if -0.2 <= d <= 0.28:
            cs = 96
            for gy in range(0, H // cs + 1):
                for gx in range(0, W // cs + 1):
                    dl = (gx + gy) / (W / cs + H / cs) * 0.12
                    p = clamp((d + 0.2 - dl) / 0.08) if d < 0 else 1 - clamp((d - dl) / 0.12)
                    s = int(cs * p / 2) // 4 * 4
                    if s > 0: cx, cy = gx * cs + cs / 2, gy * cs + cs / 2; fr.d.rectangle((cx - s, cy - s, cx + s, cy + s), fill=OUT)
def hud(fr, t):
    fr.d.text((48, 52), 'NEWGEN // SHOWCASE' + ('_' if int(t * 2) % 2 else ''), font=vfont(40), fill=(190, 180, 240), anchor='lm')
    fr.d.text((W - 48, 52), 'newgenmc.net', font=vfont(40), fill=(190, 180, 240), anchor='rm')
def render(t):
    global CUR_T
    CUR_T = t; fr = Frame(t)
    for a, b, fn in SCENES:
        if a <= t < b: fn(fr, t - a, b - a, t); break
    if t < T_END: hud(fr, t)
    wipe(fr, t)
    return fr.finish()
if __name__ == '__main__':
    if sys.argv[1] == 'still':
        for s in sys.argv[2].split(','):
            Image.fromarray(render(float(s))).resize((960, 540)).save(f'qa/s_{float(s):05.2f}.jpg', quality=82)
    else:
        f0, f1, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
        for i in range(f0, f1): p.stdin.write(render(i / FPS).tobytes())
        p.stdin.close(); p.wait()

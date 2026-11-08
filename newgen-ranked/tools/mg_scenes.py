exec(open('tools/mg.py').read())
def s_bored(fr, lt, dur, t):
    fr.gray = 0.8
    kicker(fr, 'VẤN ĐỀ', 140, 250, lt)
    reveal(fr, tl('Bạn đã chán với', FI, 58, MUTED, 0, 'Medium'), 140, 340, t - T_CHAN + 0.3, anchor='lm')
    l1 = tl('SMP CŨ KĨ', FM, 130, WHITE); reveal(fr, l1, 130, 470, t - T_SMP + 0.1, anchor='lm')
    strike(fr, 150, 130 + l1.width - 20, 478, (t - T_SMP - 0.7) / 0.35, MUTED)
    reveal(fr, tl('hay', FI, 58, MUTED, 0, 'Medium'), 140, 590, t - T_SMP - 0.9, anchor='lm')
    l2 = tl('PAY2WIN?', FM, 130, RED); reveal(fr, l2, 130, 710, t - T_PAY + 0.1, anchor='lm')
    strike(fr, 150, 130 + l2.width - 20, 718, (t - T_PAY - 0.5) / 0.35, MUTED)
    card(fr, 'graph_blur', 1030, 330, 780, 366, lt - 0.3, 'CÁC SERVER KHÁC', MUTED, 0.05)
def s_come(fr, lt, dur, t):
    reveal(fr, tl('Hãy đến với', FI, 64, MUTED, 0, 'Medium'), W / 2, 300, lt - 0.05)
    l2 = t - T_NG + 0.15
    if l2 > 0:
        p = ex(l2 / 0.8); lg = logo(int(lerp(900, 1000, p)))
        od = fr.o(); rad = 200 + 500 * eo(l2 / 1.0); od.ellipse((W / 2 - rad, 540 - rad, W / 2 + rad, 540 + rad), outline=GREEN + (int(160 * (1 - clamp(l2 / 1.0))),), width=4)
        fr.paste(lg, W / 2 - lg.width / 2, 540 - lg.height / 2 + (1 - p) * 40, clamp(l2 / 0.3))
    uline(fr, W / 2 - 220, W / 2 + 220, 720, (lt - 1.2) / 0.5)
    if lt > 1.3: reveal(fr, tl('newgenmc.net', FI, 44, WHITE, 3, 'SemiBold'), W / 2, 790, lt - 1.3)
def s_diff(fr, lt, dur, t):
    stagger(fr, 'KHÁC BIỆT HẲN', FM, 120, WHITE, W / 2, 230, t - T_KB + 0.15)
    p = clamp((t - T_TT + 0.2) / 0.6); fr.o().rectangle((W / 2 - 2, 380, W / 2 + 2, 380 + 520 * eo(p)), fill=(255, 255, 255, 60))
    l = t - T_TT + 0.1
    kicker(fr, 'SERVER TRUYỀN THỐNG', W / 2 - 440, 450, l, MUTED, 'm')
    reveal(fr, tl('Cũ · Lặp lại', FM, 70, MUTED), W / 2 - 440, 600, l - 0.15)
    if l > 0.3:
        q = eo((l - 0.3) / 0.4); od = fr.o(); c = W / 2 - 440; s = 60 * q
        od.line([(c - s, 760 - s), (c + s, 760 + s)], fill=RED + (255,), width=12); od.line([(c - s, 760 + s), (c + s, 760 - s)], fill=RED + (255,), width=12)
    l2 = l - 0.6
    kicker(fr, 'NEWGENMC', W / 2 + 440, 450, l2, GREEN, 'm')
    reveal(fr, tl('Mới · Khác biệt', FM, 70, WHITE), W / 2 + 440, 600, l2 - 0.15)
    if l2 > 0.3:
        q = eo((l2 - 0.3) / 0.4); c = W / 2 + 440; od = fr.o()
        pts = [(c - 60, 760), (c - 15, 805), (c + 70, 710)]
        if q < 0.5: od.line([pts[0], (lerp(pts[0][0], pts[1][0], q * 2), lerp(pts[0][1], pts[1][1], q * 2))], fill=GREEN + (255,), width=14)
        else: od.line([pts[0], pts[1], (lerp(pts[1][0], pts[2][0], (q - .5) * 2), lerp(pts[1][1], pts[2][1], (q - .5) * 2))], fill=GREEN + (255,), width=14, joint='curve')
def s_never(fr, lt, dur, t):
    kicker(fr, 'CHẾ ĐỘ CHƠI', W / 2, 280, lt, GREEN, 'm')
    s = fit('CHƯA TỪNG CÓ', FM, 190, 1700)
    reveal(fr, tl('CHƯA TỪNG CÓ', FM, s, WHITE), W / 2, 480, t - T_CTC + 0.1, 0.55)
    reveal(fr, tl('Ở VIỆT NAM', FM, 140, ORANGE), W / 2, 680, t - T_VN + 0.1, 0.55)
    uline(fr, W / 2 - 300, W / 2 + 300, 800, (t - T_VN - 0.3) / 0.5, ORANGE)
def s_promise(fr, lt, dur, t):
    card(fr, 'map_lobby', 110, 250, 1000, 563, lt - 0.05, 'NEWGENMC · SẢNH CHỜ', GREEN, 0.08, 0.4)
    kicker(fr, 'TRẢI NGHIỆM', 1200, 330, t - T_HH + 0.2)
    reveal(fr, tl('HOÀN TOÀN', FM, 92, WHITE), 1195, 430, t - T_KB4 + 0.15, anchor='lm')
    reveal(fr, tl('KHÁC BIỆT', FM, 92, GREEN), 1195, 535, t - T_KB4, anchor='lm')
    reveal(fr, tl('cho người chưa từng', FI, 40, MUTED, 0, 'Medium'), 1205, 640, t - T_BIET + 0.1, anchor='lm')
    reveal(fr, tl('biết tới NewGen.', FI, 40, MUTED, 0, 'Medium'), 1205, 692, t - T_BIET, anchor='lm')
def s_modes(fr, lt, dur, t):
    kicker(fr, '2 CHẾ ĐỘ CHÍNH', W / 2, 170, t - T_HAI + 0.2, GREEN, 'm')
    reveal(fr, tl('BATTLE ROYALE', FM, 88, WHITE), 500, 820, t - T_BR4 + 0.1)
    swing(fr, 500, 640, t, T_BR4, -70, 40, GREEN)
    if t >= T_COMP - 0.6:
        reveal(fr, tl('COMPETITIVE', FI, 30, ORANGE, 6, 'SemiBold'), 1420, 760, t - T_COMP + 0.2)
        reveal(fr, tl('DUELS', FM, 88, WHITE), 1420, 830, t - T_COMP + 0.1)
        swing(fr, 1300, 640, t, T_COMP - 0.05, -50, 38, GREEN, sc=0.5); swing(fr, 1540, 640, t, T_COMP - 0.05, 50, -38, ORANGE, sc=0.5)
        spark(fr, 1420, 360, t - T_COMP - 0.27, seed=3)
        fr.hit(t - T_COMP - 0.27, 0.2, 10)
    fr.o().rectangle((W / 2 - 1, 300, W / 2 + 1, 300 + 600 * eo((lt - 0.2) / 0.6)), fill=(255, 255, 255, 50))
def s_br(fr, lt, dur, t):
    card(fr, 'map_castle', 110, 230, 1100, 619, lt - 0.05, 'BATTLE ROYALE · CHIẾN TRƯỜNG', GREEN, 0.08, 0.3, -0.2)
    slash(fr, 120, 840, 1200, 240, lt - 0.25)
    kicker(fr, 'BATTLE ROYALE', 1290, 300, lt - 0.2)
    reveal(fr, tl('CHIẾN', FM, 96, WHITE), 1285, 400, t - T_CT + 0.1, anchor='lm')
    reveal(fr, tl('TRƯỜNG', FM, 96, WHITE), 1285, 505, t - T_CT, anchor='lm')
    pill(fr, 'TOÀN DIỆN', 1420, 620, t - T_TD + 0.05, GREEN)
    card(fr, 'map_canyon', 1290, 700, 480, 270, t - T_TD - 0.3, None, GREEN, 0.06, -0.3)
def s_duels(fr, lt, dur, t):
    kicker(fr, 'COMPETITIVE DUELS', W / 2, 170, lt, ORANGE, 'm')
    reveal(fr, tl('PHÔ DIỄN KỸ NĂNG', FM, 84, WHITE), W / 2, 270, t - T_PD + 0.15)
    reveal(fr, tl('ĐẤU TRƯỜNG DUELS', FI, 34, MUTED, 6, 'SemiBold'), W / 2, 370, t - T_PD - 0.3)
    reveal(fr, tl('PVP', FM, 260, ORANGE), W / 2, 560, t - T_PVP + 0.1, 0.5)
    swing(fr, 640, 1010, t, T_DT - 0.3, -75, 40, GREEN, sc=0.6); swing(fr, W - 640, 1010, t, T_DT - 0.3, 75, -40, ORANGE, sc=0.6)
    spark(fr, W / 2, 720, t - T_DT, seed=7, R=320); fr.hit(t - T_DT, 0.22, 12)
def s_lb(fr, lt, dur, t):
    kicker(fr, 'CỘNG ĐỒNG', 140, 170, lt)
    reveal(fr, tl('BẢNG XẾP HẠNG', FM, 96, WHITE), 135, 260, t - T_BXH + 0.15, anchor='lm')
    for i, (k, lab, col) in enumerate((('lb_kills', 'HẠ GỤC', RED), ('lb_wins', 'THẮNG', GREEN), ('lb_mr', 'HẠNG MR', ORANGE))):
        card(fr, k, 140 + i * 560, 400, 520, 395, lt - 0.3 - i * 0.18, lab, col, 0.05, 0)
    reveal(fr, tl('Top đầu server', FI, 44, MUTED, 0, 'Medium'), 140, 890, t - T_TOP + 0.1, anchor='lm')
    uline(fr, 140, 520, 935, (t - T_TOP - 0.1) / 0.5)
def s_legend(fr, lt, dur, t):
    kicker(fr, 'KHO VŨ KHÍ', W / 2, 160, lt, ORANGE, 'm')
    stagger(fr, 'HUYỀN THOẠI', FM, 110, WHITE, W / 2, 265, t - T_HT + 0.2)
    card(fr, 'legend1', 150, 390, 780, 470, lt - 0.3, 'LEGENDARY · I', ORANGE, 0.05, 0)
    card(fr, 'legend2', 990, 390, 780, 469, lt - 0.55, 'LEGENDARY · II', ORANGE, 0.05, 0)
    sw = (lt - 1.2) / 0.9
    if 0 < sw < 1:
        x = lerp(100, 1900, eio(sw)); od = fr.o(); od.polygon([(x, 380), (x + 90, 380), (x - 150, 880), (x - 240, 880)], fill=(255, 255, 255, 34))
def s_noserver(fr, lt, dur, t):
    stagger(fr, 'KHÔNG CÓ SERVER NÀO', FM, 110, WHITE, W / 2, 380, t - T_KCS + 0.1, 0.025)
    reveal(fr, tl('Ở VIỆT NAM', FM, 150, ORANGE), W / 2, 560, t - T_VN6 + 0.1, 0.5)
    reveal(fr, tl('làm được như NewGen.', FI, 50, MUTED, 0, 'Medium'), W / 2, 720, t - T_VN6 - 0.6)
def s_challenge(fr, lt, dur, t):
    kicker(fr, 'THỬ THÁCH', 140, 280, lt)
    reveal(fr, tl('VÀO NGAY', FM, 120, GREEN), 135, 400, lt - 0.05, anchor='lm')
    reveal(fr, tl('SO TÀI', FM, 120, WHITE), 135, 530, t - T_SO + 0.1, anchor='lm')
    reveal(fr, tl('với những player top đầu.', FI, 44, MUTED, 0, 'Medium'), 140, 640, t - T_TOP7 + 0.1, anchor='lm')
    card(fr, 'lb_champ', 1040, 250, 720, 575, t - T_SO + 0.1, 'CHAMPION · TOP 10', ORANGE, 0.05, 0)
def s_skill(fr, lt, dur, t):
    if t < T_HOI - 0.15:
        fr.amul = clamp((T_HOI - 0.15 - t) / 0.3); fr.oy = -(1 - fr.amul) * 40
        reveal(fr, tl('Không chỉ là', FI, 60, MUTED, 0, 'Medium'), W / 2, 380, lt)
        reveal(fr, tl('MỘT SÂN CHƠI VUI VẺ', FM, 110, WHITE), W / 2, 520, t - T_VUI + 0.5)
        fr.amul = 1.0; fr.oy = 0
    if t >= T_HOI - 0.15:
        l = t - T_HOI + 0.1
        kicker(fr, 'NƠI HỘI TỤ', W / 2, 330, l, GREEN, 'm')
        stagger(fr, 'CAO THỦ PVP', FM, 170, ORANGE, W / 2, 500, t - T_PVP7 + 0.6, 0.035)
        slash(fr, 260, 760, 1660, 300, t - T_PVP7 - 0.05)
        reveal(fr, tl('kỹ năng cực cao.', FI, 50, MUTED, 0, 'Medium'), W / 2, 680, t - T_PVP7 - 0.4)
def s_ready(fr, lt, dur, t):
    reveal(fr, tl('Hãy chuẩn bị thật kỹ,', FI, 60, MUTED, 0, 'Medium'), W / 2, 250, lt)
    reveal(fr, tl('sự khác biệt sẽ làm bạn', FI, 60, WHITE, 0, 'Medium'), W / 2, 370, t - T_KB8 + 0.2)
    if t >= T_NT - 0.15:
        l = t - T_NT + 0.15; p = ex(l / 0.5); s = lerp(1.25, 1.0, p)
        lay = tl('NGHẸT THỞ.', FM, 230, WHITE); l2 = lay.resize((int(lay.width * s), int(lay.height * s)), Image.BILINEAR)
        fr.paste(l2, W / 2 - l2.width / 2, 610 - l2.height / 2, clamp(l / 0.15)); fr.hit(l, 0.3, 16)
        od = fr.o()
        for i in range(24):
            ang = i / 24 * 6.283; r0 = 300 + 900 * eo(l / 0.8); r1 = r0 + 200
            od.line([(W / 2 + math.cos(ang) * r0, 610 + math.sin(ang) * r0 * 0.6), (W / 2 + math.cos(ang) * r1, 610 + math.sin(ang) * r1 * 0.6)], fill=(255, 255, 255, int(120 * (1 - clamp(l / 0.8)))), width=3)
def s_end(fr, lt, dur, t):
    p = ex(lt / 0.8); lg = logo(int(lerp(820, 880, eo(lt / dur))))
    fr.paste(lg, W / 2 - lg.width / 2, 360 - lg.height / 2 + (1 - p) * 40, clamp(lt / 0.4))
    uline(fr, W / 2 - 200, W / 2 + 200, 540, (lt - 0.5) / 0.5)
    reveal(fr, tl('newgenmc.net', FM, 64, WHITE), W / 2, 620, lt - 0.6)
    pill(fr, 'BATTLE ROYALE', W / 2 - 170, 760, lt - 1.0, GREEN); pill(fr, 'DUELS', W / 2 + 150, 760, lt - 1.15, ORANGE)
    reveal(fr, tl('VÀO NGAY HÔM NAY', FI, 30, MUTED, 8, 'SemiBold'), W / 2, 870, lt - 1.4)
    fr.fade = clamp((lt - (dur - 0.7)) / 0.7)

CHAP = [(0, '01', 'VẤN ĐỀ'), (VS[2] - 0.1, '02', 'NEWGENMC'), (T_KB - 0.3, '03', 'KHÁC BIỆT'), (T_HAI - 0.3, '04', 'CHẾ ĐỘ'), (VS[6] - 0.1, '05', 'CỘNG ĐỒNG'),
        (T_KHO - 0.2, '06', 'VŨ KHÍ'), (VS[7] - 0.1, '07', 'THỬ THÁCH'), (VS[8] - 0.1, '08', 'SẴN SÀNG')]
SCENES = [(0.0, VS[2] - 0.1, s_bored), (VS[2] - 0.1, T_KB - 0.3, s_come), (T_KB - 0.3, T_CTC - 0.9, s_diff), (T_CTC - 0.9, VS[4] - 0.1, s_never),
    (VS[4] - 0.1, T_HAI - 0.3, s_promise), (T_HAI - 0.3, VS[5] - 0.1, s_modes), (VS[5] - 0.1, T_PD - 0.3, s_br), (T_PD - 0.3, VS[6] - 0.1, s_duels),
    (VS[6] - 0.1, T_KHO - 0.2, s_lb), (T_KHO - 0.2, T_KCS - 0.3, s_legend), (T_KCS - 0.3, VS[7] - 0.1, s_noserver), (VS[7] - 0.1, T_KC - 0.2, s_challenge),
    (T_KC - 0.2, VS[8] - 0.1, s_skill), (VS[8] - 0.1, T_END, s_ready), (T_END, TOTAL, s_end)]
KINDS = ['zoom', 'push', 'rise', 'focus', 'push', 'zoom', 'rise', 'push', 'focus', 'rise', 'push', 'zoom', 'focus', 'rise']
OUT_PRE, OUT_LEN, IN_LEN = 0.3, 0.55, 0.6
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
    CUR_T = t; fr = Frame(t); layers = []; gray = 0.0; n = len(SCENES)
    for i, (a, b, fn) in enumerate(SCENES):
        end = b + (OUT_LEN - OUT_PRE if i < n - 1 else 0)
        if not (a <= t < end): continue
        e = clamp((t - (b - OUT_PRE)) / OUT_LEN) if i < n - 1 else 0.0
        g = clamp((t - a) / IN_LEN) if i > 0 else 1.0
        fr.gray = 0.0; fn(fr, t - a, b - a, t); L = fr.take()
        sc_, dx, dy, al, bl, mb = _fx(KINDS[i] if i < n - 1 else 'zoom', e, 1.0) if e > 0 else (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
        if g < 1:
            s2, dx2, dy2, _, bl2, mb2 = _fx(KINDS[i - 1], 0, g); sc_ *= s2; dx += dx2; dy += dy2; bl += bl2; mb += mb2
        u = (t - a) / max(0.1, b - a); dirn = 1 if i % 2 == 0 else -1
        sc_ *= 1 + 0.03 * u; dx += dirn * 14 * (u - 0.5)
        layers.append(xform(L, sc_, dx, dy, al, bl, mb)); gray += fr.gray * al
    fr.compose(layers); fr.gray = min(gray, 0.8)
    hud(fr, t)
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

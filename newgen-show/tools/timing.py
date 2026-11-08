WT = json.load(open('audio/vo/words.json'))
VS = {1: 0.6, 2: 6.4, 3: 9.2, 4: 17.4, 5: 28.8, 6: 36.9, 7: 47.9, 8: 60.0}
def wt(v, tok, n=0):
    h = [w for w in WT[str(v)] if tok.lower() in w[2].lower()]; return VS[v] + h[n][0]
T_CHAN = wt(1, 'chán'); _w1 = WT['1']; _sv = [i for i, w in enumerate(_w1) if 'server' in w[2].lower()]
T_SMP = VS[1] + _w1[_sv[0] + 1][0]; T_PAY = VS[1] + _w1[_sv[1] + 1][0]
T_NG = wt(2, 'new')
T_KB = wt(3, 'khác'); T_TT = wt(3, 'truyền'); T_CTC = wt(3, 'chưa'); T_VN = wt(3, 'việt')
T_HH = wt(4, 'hứa'); T_KB4 = wt(4, 'khác'); T_BIET = wt(4, 'chưa'); T_HAI = wt(4, 'hai'); T_BR4 = wt(4, 'battle'); T_COMP = wt(4, 'competitive')
T_CT = wt(5, 'chiến'); T_TD = wt(5, 'toàn'); T_PD = wt(5, 'phô'); T_PVP = wt(5, 'pvp'); T_DT = wt(5, 'đấu')
T_BXH = wt(6, 'bảng'); T_TOP = wt(6, 'top'); T_KHO = wt(6, 'kho'); T_HT = wt(6, 'huyền'); T_KCS = wt(6, 'không'); T_VN6 = wt(6, 'việt')
T_VAO = wt(7, 'vào'); T_SO = wt(7, 'so'); T_TOP7 = wt(7, 'top'); T_KC = wt(7, 'không'); T_VUI = wt(7, 'vui'); T_HOI = wt(7, 'hội'); T_PVP7 = wt(7, 'pvp')
T_CB = wt(8, 'chuẩn'); T_KB8 = wt(8, 'khác'); T_NT = wt(8, 'nghe'); T_END = 65.9


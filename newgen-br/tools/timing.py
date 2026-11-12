import json
WT = json.load(open('audio/vo/words.json', encoding='utf8'))
VSP = 1.2
WT = {k: [[a / VSP, b / VSP, c] for a, b, c in v] for k, v in WT.items()}
DUR = {1: 5.93, 2: 5.01, 3: 4.61, 4: 5.88, 5: 4.09, 6: 4.01, 7: 4.67}   # vofN.mp3 (already 1.2x)
GAP = {1: 0.3, 2: 0.3, 3: 3.3, 4: 0.3, 5: 0.6, 6: 1.1}
EV = {}; _t = 0.35
ORDER = [1, 2, 3, 4, 5, 6, 7]
for _i in ORDER:
    EV[_i] = round(_t, 2); _t += DUR[_i] + GAP.get(_i, 0)
def w(v, i): return EV[v] + WT[str(v)][i][0]
T_NGUOI1 = w(1, 7); T_CUOI1 = w(1, 10); T_VAY = w(1, 12); T_CHEDO = w(1, 17); T_BATTLE = w(1, 19); T_ROYALE = w(1, 20)
T_DAO = w(2, 8); T_THU = w(2, 11); T_TRANG = w(2, 16)
T_CHETAO = w(3, 6); T_VK = w(3, 9); T_MOI = w(3, 13)
T_TRAN = w(4, 9); T_HA = w(4, 11); T_GUC = w(4, 12); T_KHAC = w(4, 15); T_DO = w(4, 19); T_THUOC = w(4, 23)
T_NGA = w(5, 4); T_HAI = w(5, 15)
T_DOI = w(6, 2); T_CUNG6 = w(6, 5); T_NGUOI6 = w(6, 10); T_TD6 = w(6, 16)
T_GI = w(7, 2); T_VAO = w(7, 4); T_IP = w(7, 6); T_GIANH = w(7, 8); T_NHA = w(7, 16)
T_END = EV[7] + DUR[7] + 0.25
VS = EV

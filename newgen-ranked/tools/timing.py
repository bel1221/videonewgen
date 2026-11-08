import json, subprocess
WT = json.load(open('audio/vo/words.json'))
VSP = 1.2
WT = {k: [[a / VSP, b / VSP, c] for a, b, c in v] for k, v in WT.items()}
DUR = {k: round(v / 1.2, 2) for k, v in {1: 8.91, 2: 6.35, 3: 13.48, 4: 6.43, 5: 3.63, 6: 9.25, 7: 5.15, 8: 6.69}.items()}
GAP = {1: 0.3, 2: 0.3, 3: 1.35, 4: 0.35, 5: 0.35, 6: 0.3, 7: 0.3}
EV = {}; _t = 0.35
ORDER = [1, 2, 3, 4, 5, 6, 8]
for _i in ORDER:
    EV[_i] = round(_t, 2); _t += DUR[_i] + GAP.get(_i, 0)
def w(v, i): return EV[v] + WT[str(v)][i][0]
def wf(v, tok, n=0):
    h = [x for x in WT[str(v)] if tok.lower() in x[2].lower()]; return EV[v] + h[n][0]
T_PVP = wf(1, 'pvp'); T_NAO = wf(1, 'nào'); T_VAY = wf(1, 'vậy'); T_DD1 = wf(1, 'đồng'); T_RK = wf(1, 'ranked'); T_2V2 = wf(1, 'vs')
T_DD2 = wf(2, 'đồng'); T_VK = wf(2, 'vũ'); T_DOI = wf(2, 'đối')
T_MOI = wf(3, 'mỗi', 1); T_NN = wf(3, 'ngẫu'); T_KBG = wf(3, 'không'); T_GI = wf(3, 'gì'); T_LUC = wf(3, 'lúc'); T_KN = wf(3, 'kỹ'); T_PH = wf(3, 'phối'); T_QD = wf(3, 'quyết'); T_CT = wf(3, 'chiến')
T_MR = wf(4, 'ma'); T_LEO = wf(4, 'leo'); T_DINH = wf(4, 'đỉnh')
T_CH5 = wf(5, 'champion'); T_DC = wf(5, 'đỉnh')
T_TOP = wf(6, 'top'); T_CH6 = wf(6, 'champion'); T_TRIM = wf(6, 'armor'); T_DQ = wf(6, 'độc'); T_KCC = wf(6, 'không')
T_RU = wf(8, 'dù'); T_DN = wf(8, 'đăng'); T_CM = wf(8, 'chứng'); T_MANH = wf(8, 'mạnh')
T_END = EV[8] + DUR[8] + 0.25
VS = EV

WT = json.load(open('audio/vo/words.json'))
import re as _re
DUR = {1: 5.36, 2: 4.56, 3: 8.48, 4: 7.76, 5: 4.88, 6: 11.52, 7: 10.56, 8: 5.36, 9: 8.4, 10: 7.36}
EV = {}; _t = 0.6
for _i in range(1, 11):
    EV[_i] = round(_t, 2); _t += DUR[_i] + 0.55
def _n(s): return _re.sub(r"[^a-z0-9']", '', s.lower())
def wt(v, tok, n=0, exact=False):
    h = [w for w in WT[str(v)] if (_n(w[2]) == tok if exact else tok in _n(w[2]))]; return EV[v] + h[n][0]
VS = {1: EV[1], 2: EV[2], 3: EV[3], 4: EV[4], 5: EV[6], 6: EV[7], 7: EV[8], 8: EV[10]}
T_CHAN = wt(1, 'tired'); T_SMP = wt(1, 'smp'); T_PAY = wt(1, 'pay')
T_NG = wt(2, 'welcome')
T_KB = wt(3, 'stands'); T_TT = wt(3, 'traditional'); T_CTC = wt(3, 'unlike'); T_VN = wt(3, 'experienced', exact=True)
T_HH = EV[4]; T_KB4 = wt(4, 'entirely'); T_BIET = wt(4, 'especially')
T_HAI = wt(5, 'two'); T_BR4 = wt(5, 'battle'); T_COMP = wt(5, 'competitive')
T_CT = wt(6, 'battlefield'); T_TD = wt(6, 'strongest'); T_PD = wt(6, 'other'); T_PVP = wt(6, 'pvp'); T_DT = wt(6, 'arena') - 0.25
T_BXH = wt(7, 'leaderboard'); T_TOP = wt(7, 'top'); T_KHO = wt(7, 'diverse'); T_HT = wt(7, 'legendary'); T_KCS = wt(7, 'delivers'); T_VN6 = wt(7, 'unlike')
T_VAO = EV[8]; T_SO = wt(8, 'prove'); T_TOP7 = wt(8, 'best')
T_KC = EV[9]; T_VUI = wt(9, 'fun'); T_HOI = wt(9, 'home'); T_PVP7 = wt(9, 'skilled')
T_CB = EV[10]; T_KB8 = wt(10, 'unique'); T_NT = wt(10, 'breathless')
T_END = EV[10] + DUR[10] + 0.35

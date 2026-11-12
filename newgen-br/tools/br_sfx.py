# SFX bed for the Battle Royale video -> audio/sfx_bed.wav. python -X utf8 tools/br_sfx.py
# Rules: no explosions / boom/, never riser/rs50__synth_misc_16.ogg, no file more than twice.
import os, json, subprocess, importlib.util
import numpy as np
SR = 48000; RR = os.environ.get('NEWGEN_TOOLKIT', os.path.abspath('../toolkit'))
spec = importlib.util.spec_from_file_location('sh', 'tools/br_scenes.py'); n = importlib.util.module_from_spec(spec); spec.loader.exec_module(n)
TOT = n.TOTAL
def load(path, ss=None, to=None):
    cmd = ['ffmpeg', '-v', 'error'] + (['-ss', str(ss), '-to', str(to)] if ss is not None else []) + ['-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    a = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()
    k = min(len(a), int(0.004 * SR)); a[:k] *= np.linspace(0, 1, k)[:, None]; a[-k:] *= np.linspace(1, 0, k)[:, None]
    return a / (np.abs(a).max() + 1e-9)
SEG = {'shine': (3.85, 4.7), 'whoosh_a': (8.95, 10.7), 'whoosh_b': (20.75, 22.5), 'whoosh_long': (23.75, 28.2)}
U = {}
for k, (a, b) in SEG.items():
    x = load('audio/userpack/pack.wav', a, b); env = np.abs(x).max(1); w = int(0.01 * SR)
    U[k] = (x, int(np.argmax(np.convolve(env, np.ones(w) / w, 'same'))))
cat = json.load(open(f'{RR}/sfx_lib/catalog.json'))['sounds']; pick = {}
for s in cat:
    f = s['file']
    if f == 'riser/rs50__synth_misc_16.ogg' or 'explosion' in f.lower() or f.startswith('boom/'): continue
    pick.setdefault(s['cat'], []).append(s)
used = {}
def lib(c):
    lst = pick[c]; i = used.get(c, 0); used[c] = i + 1; s = lst[(i // 2) % len(lst)]   # each file at most twice
    return load(f"{RR}/sfx_lib/{s['file']}"), int(s['onset'] * SR), s['file']
bed = np.zeros((int(TOT * SR) + SR, 2), np.float32); log = []
def place(x, anchor, t, g, name):
    st = int(t * SR) - anchor
    if st < 0: x = x[-st:]; st = 0
    e = min(len(bed), st + len(x)); bed[st:e] += x[:e - st] * 10 ** (g / 20); log.append({'t': round(t, 3), 'sound': name})
def user(k, t, g): x, pk = U[k]; place(x, pk, t, g, 'pack:' + k)
def L(c, t, g): x, on, f = lib(c); place(x, on, t, g, f)
def click(t, g, pitch=1.0):
    k = int(0.014 * SR); e = np.exp(-np.arange(k) / (0.0018 * SR / pitch)); x = np.random.RandomState(int(t * 1000)).randn(k) * e
    x = np.diff(np.concatenate([[0], x])); x = np.stack([x, x], 1) / (np.abs(x).max() + 1e-9); place(x.astype(np.float32), 0, t, g, 'synth:tick')
def pop(t, g, f0=520.0):
    k = int(0.07 * SR); tt = np.arange(k) / SR; x = np.sin(2 * np.pi * (f0 * tt + 0.5 * f0 * 6 * tt * tt)) * np.exp(-tt / 0.018)
    x = np.stack([x, x], 1); place(x.astype(np.float32), 0, t, g, 'synth:pop')
B = [a for a, b, f in n.SCENES[1:]]
for b, kind in zip(B, ['whoosh_a', 'L', 'whoosh_b', 'L', 'whoosh_long', 'L', 'whoosh_a']):
    if kind == 'L': L('whoosh', b, -14)
    else: user(kind, b, -13)
# 1 hook / title
L('ui_blip', n.T_NGUOI1 - 0.35, -17)
for tt in n.DOT_T.values(): click(tt, -20)
L('flash', n.T_CUOI1 - 0.2, -16); L('hit', n.T_ROYALE - 0.1, -9)
# 2 prep
L('scan', n.EV[2] + 0.2, -22)
for tt in (n.T_DAO, n.T_THU, n.T_TRANG): L('ui_blip', tt - 0.25, -17)
for i in range(3): pop(n.T_DAO - 0.1 + i * 0.14, -19, 420 + i * 60)
for i in range(5): pop(n.T_THU - 0.1 + i * 0.1, -19, 520 + i * 40)
for i in range(4): pop(n.T_TRANG - 0.1 + i * 0.1, -19, 380 + i * 30)
# 3 crafting: one rising pop per item, a flash when the weapon comes out
L('ui_blip', n.T_CHETAO - 0.3, -17)
for ci, (key, name, t0, D, col) in enumerate(n.CRAFTS):
    ts, tr = n.craft_times(key, D)
    for i, ti in enumerate(ts): pop(t0 + ti, -16, 440 + i * 45)
    L('flash' if ci % 2 == 0 else 'poweron', t0 + tr, -13 if ci == 0 else -16)
# 4 fight
L('hit', n.T_TRAN - 0.25, -8)
L('dataswish', n.FH1 - 0.22, -20); L('hit', n.FH1, -6)
L('whoosh', n.FK1 - 0.2, -14); L('hit', n.FK1, -4); L('crack', n.FK1 + 0.02, -10)
for j in range(5): pop(n.T_DO - 0.25 + 0.12 + j * 0.07 + 0.7, -17, 600 + j * 50)
L('ui_blip', n.T_THUOC - 0.1, -16)
# 5 kill feed
for i, ft in enumerate(n.FT): click(ft, -13, 0.7); pop(ft, -18, 300 + i * 25)
L('hit', n.FT[-1] + 0.02, -9)
# 6 final duel
L('dataswish', n.DH2 - 0.22, -20); L('hit', n.DH2, -6)
L('whoosh', n.DK2 - 0.2, -14); L('hit', n.DK2, -4); L('crack', n.DK2 + 0.02, -10); L('flash', n.DK2 + 0.25, -14)
user('shine', n.T_NGUOI6 - 0.1, -12); L('poweron', n.T_TD6 - 0.1, -14)
# 7 outro
L('hit', n.T_VAO - 0.05, -10); user('shine', n.GL[0] + 0.25, -10); L('ui_blip', n.T_IP - 0.1, -16); L('ui_blip', n.T_GIANH - 0.1, -16)
from collections import Counter
c = Counter(l['sound'] for l in log if not l['sound'].startswith('synth:'))
print('max reuse', c.most_common(4)); assert max(c.values()) <= 2
assert not any('boom/' in k or 'explosion' in k.lower() or 'rs50__synth_misc_16' in k for k in c)
bed = bed[:int(TOT * SR)]; pk = np.abs(bed).max()
if pk > 0.89: bed *= 0.89 / pk
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', 'audio/sfx_bed.wav'], input=bed.tobytes(), check=True)
json.dump(log, open('comp/sfx_log.json', 'w')); print('placed', len(log), 'total', TOT)

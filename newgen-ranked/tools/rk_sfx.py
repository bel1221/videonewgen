import os, json, subprocess, importlib.util, os
import numpy as np
SR = 48000; RR = os.environ.get('NEWGEN_TOOLKIT', os.path.abspath('../toolkit'))
spec = importlib.util.spec_from_file_location('sh', 'tools/rk_scenes.py'); n = importlib.util.module_from_spec(spec); spec.loader.exec_module(n)
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
    lst = pick[c]; i = used.get(c, 0); used[c] = i + 1; s = lst[i % len(lst)]
    return load(f"{RR}/sfx_lib/{s['file']}"), int(s['onset'] * SR), s['file']
bed = np.zeros((int(TOT * SR) + SR, 2), np.float32); log = []
def place(x, anchor, t, g, name):
    st = int(t * SR) - anchor
    if st < 0: x = x[-st:]; st = 0
    e = min(len(bed), st + len(x)); bed[st:e] += x[:e - st] * 10 ** (g / 20); log.append({'t': round(t, 3), 'sound': name})
def user(k, t, g): x, pk = U[k]; place(x, pk, t, g, 'pack:' + k)
def L(c, t, g): x, on, f = lib(c); place(x, on, t, g, f)
B = [a for a, b, f in n.SCENES[1:]]
for b, kind in zip(B, ['whoosh_a', 'L', 'whoosh_b', 'L', 'whoosh_long', 'L', 'whoosh_a', 'whoosh_b']):
    if kind == 'L': L('whoosh', b, -14)
    else: user(kind, b, -13)
def click(t, g):
    k = int(0.012 * SR); e = np.exp(-np.arange(k) / (0.0018 * SR)); x = np.random.RandomState(int(t * 1000)).randn(k) * e
    x = np.diff(np.concatenate([[0], x])); x = np.stack([x, x], 1) / (np.abs(x).max() + 1e-9); place(x.astype(np.float32), 0, t, g, 'synth:tick')
L('ui_blip', n.T_PVP, -17); L('scan', n.T_NAO - 0.3, -22)
L('flash', n.T_RK, -16); L('hit', n.T_2V2 - 0.2, -9)
L('dataswish', n.T_DD2 - 0.35, -18); L('ui_blip', n.T_VK, -16); L('dataswish', n.T_DOI - 0.45, -18); L('hit', n.T_DOI - 0.05, -10)
for cx, col, lab, seq, t0, t1 in n.REELS:
    pe = len(seq) - 4; last = 0; tt = t0
    while tt < t1:
        u = (tt - t0) / (t1 - t0); pos = pe * (1 - (1 - u) ** 3)
        if int(pos) != last: last = int(pos); click(tt, -21 if last < pe - 6 else -18)
        tt += 1 / 240
    L('flash', t1, -12)
L('ui_blip', n.T_NN, -17)
for h in n.HITS: L('dataswish', h - 0.22, -20); L('hit', h, -6); L('ui_error', h + 0.05, -24)
L('whoosh', n.KILL - 0.2, -14); L('hit', n.KILL, -4); L('crack', n.KILL + 0.02, -10); L('flash', n.KILL + 0.25, -14)
L('poweron', n.T_CT - 0.1, -15)
for e in [n.EV[4] + 0.3, n.T_MR - 0.05, n.T_LEO + 0.35, n.T_DINH - 0.35]: L('ui_blip', e, -17)
L('scan', n.T_DINH - 0.1, -21)
L('hit', n.T_CH5 - 0.3, -8); user('shine', n.T_CH5 - 0.1, -11)
L('hit', n.T_TOP - 0.15, -11); L('ui_blip', n.T_CH6 - 0.1, -16); L('flash', n.T_TRIM - 0.3, -14); L('ui_blip', n.T_KCC - 0.1, -14)
L('ui_blip', n.T_RU - 0.2, -17); L('hit', n.T_DN - 0.1, -10); user('shine', n.T_DN + 0.1, -12); L('ui_blip', n.T_CM - 0.1, -16); L('ui_blip', n.T_MANH - 0.1, -16)
from collections import Counter
print('reuse', [x for x in Counter(l['sound'] for l in log).most_common(6) if x[0] != 'synth:tick'])
bed = bed[:int(TOT * SR)]; pk = np.abs(bed).max()
if pk > 0.89: bed *= 0.89 / pk
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', 'audio/sfx_bed.wav'], input=bed.tobytes(), check=True)
print('placed', len(log))

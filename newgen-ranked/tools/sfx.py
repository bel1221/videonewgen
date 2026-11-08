import json, subprocess, importlib.util, os
import numpy as np
SR = 48000; RR = os.environ['HF_WORKFLOWS'] + '/katana/scripts'
spec = importlib.util.spec_from_file_location('sh', 'tools/mg_scenes.py'); n = importlib.util.module_from_spec(spec); spec.loader.exec_module(n)
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
for b, kind in zip(n.WIPES, ['whoosh_a', 'L', 'whoosh_b', 'whoosh_long', 'L', 'whoosh_a']):
    if kind == 'L': L('whoosh', b, -13)
    else: user(kind, b, -12)
L('ui_blip', n.T_CHAN, -16); L('ui_error', n.T_SMP, -18); L('ui_error', n.T_PAY, -16)
L('hit', n.VS[2] - 0.1, -10); L('flash', n.T_NG, -13); user('shine', n.T_NG + 0.15, -11)
L('hit', n.T_KB, -11); L('ui_error', n.T_TT, -17); L('ui_blip', n.T_TT + 0.5, -15)
L('hit', n.T_CTC, -9); L('ui_blip', n.T_VN, -15)
L('ui_blip', n.T_HH, -16); L('ui_blip', n.T_KB4, -15); L('type', n.T_BIET - 0.2, -20)
L('ui_blip', n.T_HAI, -15); L('hit', n.T_BR4 + 0.2, -11); L('hit', n.T_COMP + 0.2, -11)
L('ui_blip', n.T_TD, -15); L('dataswish', n.T_TD + 0.2, -17)
L('ui_blip', n.T_PD, -16); L('hit', n.T_PVP, -10); L('crack', n.T_DT, -13)
L('ui_blip', n.T_BXH, -15)
for i in range(3): L('ui_blip', n.VS[6] + 0.1 + 0.2 + i * 0.25, -18)
L('flash', n.T_HT, -13); L('flash', n.T_HT + 0.35, -15)
L('hit', n.T_KCS, -11); L('hit', n.T_VN6, -9); L('type', n.T_VN6 + 0.7, -20)
L('ui_blip', n.VS[7], -15); L('hit', n.T_SO, -11); L('ui_blip', n.T_TOP7, -16)
L('ui_blip', n.T_KC - 0.1, -16); L('ui_blip', n.T_VUI, -16); L('hit', n.T_PVP7, -9); L('flash', n.T_PVP7 + 0.1, -14)
L('ui_blip', n.T_CB, -16); L('glitch', n.T_KB8, -16); L('hit', n.T_NT - 0.05, -8); L('crack', n.T_NT, -13)
L('flash', n.T_END + 0.25, -14); L('hit', n.T_END + 0.2, -11)
from collections import Counter
print('reuse', Counter(l['sound'] for l in log).most_common(3))
bed = bed[:int(TOT * SR)]; pk = np.abs(bed).max()
if pk > 0.89: bed *= 0.89 / pk
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', 'audio/sfx_bed.wav'], input=bed.tobytes(), check=True)
print('placed', len(log))

import os, json, subprocess, importlib.util, os, sys
import numpy as np
SR = 48000; RR = os.environ.get('NEWGEN_TOOLKIT', os.path.abspath('../toolkit'))
spec = importlib.util.spec_from_file_location('ng', 'tools/ngp2.py'); n = importlib.util.module_from_spec(spec); spec.loader.exec_module(n)
TOT = n.TOTAL
def load(path, ss=None, to=None, tempo=None):
    cmd = ['ffmpeg', '-v', 'error']
    if ss is not None: cmd += ['-ss', str(ss), '-to', str(to)]
    cmd += ['-i', path] + (['-af', f'atempo={tempo}'] if tempo else []) + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    a = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()
    k = min(len(a), int(0.004 * SR))
    if k: a[:k] *= np.linspace(0, 1, k)[:, None]; a[-k:] *= np.linspace(1, 0, k)[:, None]
    return a / (np.abs(a).max() + 1e-9)
SEG = {'riser': (0.0, 3.45), 'shine': (3.85, 4.7), 'whoosh_a': (8.95, 10.7), 'talk8bit': (15.45, 18.0), 'whoosh_b': (20.75, 22.5), 'whoosh_long': (23.75, 28.2)}
U = {}
for k, (a, b) in SEG.items():
    x = load('audio/userpack/pack.wav', a, b); env = np.abs(x).max(1); w = int(0.01 * SR)
    U[k] = (x, int(np.argmax(np.convolve(env, np.ones(w) / w, 'same'))))
cat = json.load(open(f'{RR}/sfx_lib/catalog.json'))['sounds']
pick = {}
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
    e = min(len(bed), st + len(x)); bed[st:e] += x[:e - st] * 10 ** (g / 20); log.append({'t': round(t, 3), 'sound': name, 'gain_db': g})
def user(k, t, g): x, pk = U[k]; place(x, pk, t, g, 'NewgenMC_SFX:' + k)
def L(c, t, g): x, on, f = lib(c); place(x, on, t, g, f)
# user pack
tpk = n.TPT - 0.06; span = 2.9
x = load('audio/userpack/pack.wav', 0.0, 3.45, tempo=round(2.8 / span, 3)); place(x, int(span * SR), tpk, -9, 'NewgenMC_SFX:riser (into PHÁT TRIỂN)')
xt, _ = U['talk8bit']; c0 = n.T300 - 0.45; cl = n.TTR + 0.1 - c0
seg = xt[:int((cl + 0.2) * SR)].copy(); fl = int(0.2 * SR); seg[-fl:] *= np.linspace(1, 0, fl)[:, None]
place(seg, 0, c0, -10, 'NewgenMC_SFX:8bit talk (300tr counter)')
user('whoosh_a', n.VS[2] - 0.25, -9)
user('whoosh_long', n.TBR - 0.12, -9)
user('whoosh_b', 35.45, -9)
user('whoosh_long', n.VS[5] - 0.12, -9)
user('shine', n.TEND + 0.9, -9)
# library
user('shine', 0.1, -13)
user('whoosh_a', n.VS[1] + 0.1, -12)
L('flash', n.TKD - 0.1, -18)
L('hit', n.TSAU - 0.05, -9)
L('hit', n.TPT - 0.06, -8)
L('type', n.VS[2] - 0.1, -21)
L('hit', n.TSMP - 0.06, -8)
L('ui_blip', n.TYT - 0.15, -18)
L('ui_blip', n.TSMP + 0.6, -20)
L('dataswish', n.TVON - 0.1, -20)
L('hit', n.TTC - 0.06, -9)
L('hit', n.TPTH - 0.05, -10)
L('scan', n.TNH, -22)
L('hit', n.TDP - 0.06, -8)
L('glitch', n.TDP + 1.0, -14)
L('crack', n.TDP + 1.05, -13)
L('hit', n.TROY - 0.05, -8)
L('dataswish', n.THT - 0.1, -18)
L('type', n.TLV - 0.4, -20)
L('hit', n.T1N - 0.08, -9)
L('hit', n.TTR + 0.1, -8)
L('dataswish', n.TMO - 0.1, -16)
L('hit', n.TMO - 0.05, -8)
L('ui_blip', 35.6, -19); L('ui_blip', 35.85, -20); L('scan', 36.5, -22)
L('hit', n.THAO - 0.05, -9)
L('ui_blip', n.TPLUG - 0.1, -17)
L('flash', n.TWG - 0.05, -10); L('hit', n.TWG - 0.05, -10)
L('dataswish', n.TMINH + 0.9, -19); L('dataswish', n.TMINH + 1.4, -20)
L('hit', n.T3T - 0.05, -8)
L('ui_blip', n.TTN - 0.05, -18)
L('hit', n.TDEP - 0.06, -9)
L('hit', n.TDD - 0.05, -9)
L('hit', n.TQUA - 0.06, -9)
L('hit', n.T3M - 0.06, -8)
from collections import Counter
print('reuse', Counter(l['sound'] for l in log).most_common(4))
bed = bed[:int(TOT * SR)]; pk = np.abs(bed).max()
if pk > 0.89: bed *= 0.89 / pk
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', 'audio/sfx_bed.wav'], input=bed.tobytes(), check=True)
json.dump(log, open('audio/sfx_bed.json', 'w'), indent=1, ensure_ascii=False); print('placed', len(log))

"""SFX bed for encounter v2 -> audio/enc_sfx_v2.wav. Layering from notes/animation-study.md §2c:
whoosh on each anticipation, hit on contact, short tail; a quiet ringing tone under the BANNED stamp instead of a boom.
House rules: no file more than twice, no boom/explosions, never riser/rs50__synth_misc_16.ogg. Run from newgen-ban/."""
import json, os, subprocess, sys
from collections import Counter
import numpy as np
sys.path.insert(0, 'tools')
import encounter_v2 as E

SR = 48000; TK = os.environ.get('NEWGEN_TOOLKIT', os.path.abspath('../toolkit')); LIB = TK + '/sfx_lib'
PACK = '../newgen-ranked/audio/userpack/pack.wav'

def load(path, ss=None, to=None):
    cmd = ['ffmpeg', '-v', 'error'] + (['-ss', str(ss), '-to', str(to)] if ss is not None else []) + ['-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    a = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()
    k = min(len(a), int(0.004 * SR)); a[:k] *= np.linspace(0, 1, k)[:, None]; a[-k:] *= np.linspace(1, 0, k)[:, None]
    return a / (np.abs(a).max() + 1e-9)

cat = json.load(open(LIB + '/catalog.json'))['sounds']; pick = {}
for s in cat:
    f = s['file']
    if f == 'riser/rs50__synth_misc_16.ogg' or 'explosion' in f.lower() or f.startswith('boom/'): continue
    pick.setdefault(s['cat'], []).append(s)
used = {}; bed = np.zeros((int(E.TOTAL * SR) + SR, 2), np.float32); log = []

def place(x, anchor, t, g, name):
    st = int(t * SR) - anchor
    if st < 0: x = x[-st:]; st = 0
    e = min(len(bed), st + len(x)); bed[st:e] += x[:e - st] * 10 ** (g / 20); log.append(name)

def L(c, t, g, i=None):
    lst = pick[c]; k = used.get(c, 0) if i is None else i; used[c] = k + 1; s = lst[k % len(lst)]
    place(load(f"{LIB}/{s['file']}"), int(s['onset'] * SR), t, g, s['file'])

def user(name, t, g):
    a, b = {'shine': (3.85, 4.7), 'whoosh_a': (8.95, 10.7), 'whoosh_b': (20.75, 22.5)}[name]
    x = load(PACK, a, b); env = np.abs(x).max(1); w = int(0.01 * SR); pk = int(np.argmax(np.convolve(env, np.ones(w) / w, 'same')))
    place(x, pk, t, g, 'pack:' + name)

def ring(t, g, f=3600.0, d=0.9):
    n = int(d * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 3.2) * np.minimum(1, tt / 0.01)
    place(np.stack([x, x], 1).astype(np.float32), 0, t, g, 'synth:ring')

# hacker glitches in
L('glitch', E.T_TP, -16, 6); L('glitch', E.T_TP + 0.12, -20, 0)
# kill aura: one long swish for the spin, then per hit: whoosh on the wind-up, hit on contact
L('longwhoosh', E.T_AURA[0] - 0.05, -20)
for h in E.HITS:
    L('whoosh', h - 0.16, -19); L('hit', h, -9)
L('flash', E.INSERTS[0], -18); L('flash', E.INSERTS[1], -18)          # spark tails on the two inserts
L('ui_error', E.T_CHIP1, -20); L('ui_error', E.T_CHIP2, -20)
L('ui_blip', E.T_REC, -18)
# admin: beam swell, flash-frame landing, shine
L('longwhoosh', E.T_BEAM - 0.1, -17)
user('whoosh_a', E.T_LAND - 0.1, -13); L('flash', E.T_LAND, -11); user('shine', E.T_LAND + 0.12, -14)
# chat typing
cmd = f'/ban {E.HACKER} Hack'
for i in range(len(cmd)):
    if cmd[i] != ' ': L('type', E.T_CHAT1 + 0.15 + 0.75 * i / len(cmd), -26)
L('ui_blip', E.T_CHAT2, -16)
# ban: hurt hit, poof, stamp (+ ring instead of a boom)
L('hit', E.T_BAN, -8); L('crack', E.T_POOF, -16); L('hit', E.T_STAMP, -6); user('shine', E.T_STAMP + 0.05, -13); ring(E.T_STAMP + 0.02, -30)

c = Counter(log); over = [k for k, v in c.items() if v > 2 and not k.startswith('synth:')]
assert not over, f'SFX used more than twice: {over}'
bed = bed[:int(E.TOTAL * SR)]; pk = np.abs(bed).max()
if pk > 0.89: bed *= 0.89 / pk
os.makedirs('audio', exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', 'audio/enc_sfx_v2.wav'], input=bed.tobytes(), check=True)
print('placed', len(log), 'max reuse', max(v for k, v in c.items() if not k.startswith('synth:')))

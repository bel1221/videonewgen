"""Sound for the 3D test clip -> comp/anim_audio.m4a.
SFX bed from the CC0 library (whoosh on every anticipation/swing, hit on contact, crack on landings), sa.mp3 with a
low-pass suck-out into the crossing slash so the drop lands on the flash. House rules: no file more than twice,
no boom/explosions, never riser/rs50__synth_misc_16.ogg. Run from anim-test/."""
import json, os, subprocess
from collections import Counter
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000; TOTAL = 9.5; FLASH = 7.33; INS1, INS2 = 3.60, 4.82
LIB = '../toolkit/sfx_lib'; PACK = '../newgen-ranked/audio/userpack/pack.wav'

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
used = {}; bed = np.zeros((int(TOTAL * SR) + SR, 2), np.float32); log = []

def place(x, anchor, t, g, name):
    st = int(t * SR) - anchor
    if st < 0: x = x[-st:]; st = 0
    e = min(len(bed), st + len(x)); bed[st:e] += x[:e - st] * 10 ** (g / 20); log.append(name)
def L(c, t, g):
    lst = pick[c]; k = used.get(c, 0); used[c] = k + 1; s = lst[k % len(lst)]
    place(load(f"{LIB}/{s['file']}"), int(s['onset'] * SR), t, g, s['file'])
def user(name, t, g):
    a, b = {'shine': (3.85, 4.7), 'whoosh_a': (8.95, 10.7), 'whoosh_b': (20.75, 22.5)}[name]
    x = load(PACK, a, b); env = np.abs(x).max(1); w = int(0.01 * SR); pk = int(np.argmax(np.convolve(env, np.ones(w) / w, 'same')))
    place(x, pk, t, g, 'pack:' + name)
def ring(t, g, f=3400.0, d=0.9):
    tt = np.arange(int(d * SR)) / SR; x = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 3.0) * np.minimum(1, tt / 0.01)
    place(np.stack([x, x], 1).astype(np.float32), 0, t, g, 'synth:ring')

L('whoosh', 2.66, -22)                                    # B draws into guard
user('whoosh_b', 3.36, -15)                               # A's leap
L('hit', INS1, -8); L('flash', INS1, -17); L('crack', 3.84, -19)   # clash, landing
L('whoosh', 4.08, -21); L('longwhoosh', 4.16, -15)        # B wind-up + horizontal slash over A's head
L('whoosh', 4.60, -22); L('whoosh', 4.74, -15)            # A draws back, thrusts
L('hit', INS2, -7); L('flash', INS2, -16)                 # thrust lands
L('static', 4.90, -30)                                    # B's slide scrape
L('crack', 5.62, -22)                                     # B drops to one knee
L('longwhoosh', 7.02, -18)                                # both charge
L('hit', FLASH, -6); user('whoosh_a', FLASH - 0.08, -13); user('shine', FLASH + 0.12, -14); ring(FLASH + 0.1, -31)
L('crack', 7.95, -21)                                     # B falls to his knees
c = Counter(log); over = [k for k, v in c.items() if v > 2 and not k.startswith('synth:')]
assert not over, f'SFX used more than twice: {over}'
bed = bed[:int(TOTAL * SR)]; pk = np.abs(bed).max(); bed *= min(1.0, 0.89 / pk)

# music: drop of sa.mp3 (~135.5 s) lands just after the flash; low-pass sweep closes from 6.4 s into the flash
os.makedirs('comp', exist_ok=True)
SS = round(135.5 - (FLASH + 0.1), 2)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(SS), '-t', str(TOTAL), '-i', '../newgen-ranked/audio/sa.mp3', '-af',
                f'loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=0.6,afade=t=out:st={TOTAL - 1.2}:d=1.2', '-ar', str(SR), '-ac', '2', 'comp/music.wav'], check=True)
m = load('comp/music.wav') * 0.5
a0, a1 = int(6.4 * SR), int(FLASH * SR); zi = np.zeros((2, 2, 2)); y = m.copy()
for s in range(a0, a1, 256):
    u = (s - a0) / (a1 - a0); fc = 16000 * (380 / 16000) ** (u ** 0.8); sos = butter(4, fc, 'low', fs=SR, output='sos')
    for ch in range(2): y[s:s + 256, ch], zi[ch] = sosfilt(sos, m[s:s + 256, ch], zi=zi[ch])
    y[s:s + 256] *= 10 ** (-5 * u / 20)
y = y[:len(bed)]; mix = bed[:len(y)] + y
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'loudnorm=I=-16:TP=-1.2:LRA=9',
                '-c:a', 'aac', '-b:a', '256k', 'comp/anim_audio.m4a'], input=mix.astype(np.float32).tobytes(), check=True)
print('placed', len(log), 'max reuse', max(v for k, v in c.items() if not k.startswith('synth:')))
